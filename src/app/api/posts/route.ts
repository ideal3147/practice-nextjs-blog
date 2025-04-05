import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const thumbnail = formData.get("thumbnail") as File | null;

  if (!title || !content) {
    return NextResponse.json(
      { error: "タイトルと本文は必須です。" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const timestamp = generateTimestamp();
  const articleUuid = uuidv4();
  let imageMap = new Map<string, string>();
  try {
    // サムネイルのアップロード
    const thumbnailPublicUrl = thumbnail
      ? await uploadThumbnail(supabase, articleUuid, thumbnail)
      : "";

    // 画像のアップロード
    const images: File[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image-") && value instanceof File) {
        images.push(value);
      }
    }
    imageMap = await uploadImages(supabase, images);

    // Markdownファイルのアップロード
    await uploadMarkdownFile(supabase, articleUuid, title, timestamp, content, thumbnailPublicUrl);

    // データベースへの挿入
    await insertToDatabase(supabase, articleUuid, title, thumbnailPublicUrl, imageMap);

    return NextResponse.json({ message: "記事が保存されました！" });
  } catch (error) {
    console.error("エラーが発生しました:", error);
    // supabase storageに保存した記事の削除処理を追加する
    const { error: deleteError } = await supabase.storage
      .from("md-blog")
      .remove([`articles/${articleUuid}.md`, `thumbnails/${articleUuid}.png`]);

    // supabase databaseに保存した画像の削除処理を追加する
    for (const [uuid] of imageMap.entries()) {
      const { error: deleteImageError } = await supabase.storage
        .from("md-blog")
        .remove([`captures/${uuid}.png`]);
    }

    return NextResponse.json(
      { error: "記事の保存中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

// タイムスタンプを生成
function generateTimestamp(): string {
  return new Date().toISOString().replace(/[TZ]/g, "").slice(0, 12); // yyyymmddhhmm形式
}

// サムネイルをアップロード
async function uploadThumbnail(supabase: any, uuid: string, thumbnail: File): Promise<string> {
  const { data, error: uploadError } = await supabase.storage
    .from("md-blog")
    .upload(`thumbnails/${uuid}.png`, thumbnail, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("サムネイルのアップロードに失敗:", uploadError.message);
    throw new Error("サムネイルをストレージにアップロードできませんでした。");
  }

  const publicUrl = supabase.storage
    .from("md-blog")
    .getPublicUrl(data.path).data.publicUrl;

  // サムネイル情報をデータベースに保存
  const { error: insertError } = await supabase
    .from("m_images")
    .insert([{ image_id: uuid, file_url: `thumbnails/${uuid}.png` }]);

  if (insertError) {
    console.error("サムネイル情報の保存に失敗:", insertError.message);
    throw new Error("サムネイル情報の保存に失敗しました。");
  }

  return publicUrl;
}

// Markdownファイルをアップロード
async function uploadMarkdownFile(
  supabase: any,
  uuid: string,
  title: string,
  timestamp: string,
  content: string,
  publicUrl: string
) {
  const markdownContent = `---
title: ${title}
date: "${timestamp}"
image: ${publicUrl}
---

${content}
`;

  const { error } = await supabase.storage
    .from("md-blog")
    .upload(`articles/${uuid}.md`, new Blob([markdownContent]), {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Markdownファイルのアップロードに失敗:", error.message);
    throw new Error("記事をストレージにアップロードできませんでした。");
  }
}

// データベースに記事情報・画像情報を挿入
async function insertToDatabase(
  supabase: any,
  articleUuid: string,
  title: string,
  thumbnailPublicUrl: string,
  imageMap: Map<string, string>,
) {

  // 記事情報の保存
  const { error: insertError } = await supabase
    .from("m_articles")
    .insert([
      {
        article_id: articleUuid,
        file_url: `articles/${articleUuid}.md`,
        thumbnail_url: thumbnailPublicUrl,
        status: "published",
        title: title,
      },
    ]);

  if (insertError) {
    console.error("記事情報の保存に失敗:", insertError.message);
    throw new Error("記事の保存に失敗しました。");
  }

  // 画像情報の保存
  for (const [uuid, publicUrl] of imageMap.entries()) {
    const { error: imageInsertError } = await supabase
      .from("m_images")
      .insert([{ image_id: uuid, file_url: publicUrl }]);

    if (imageInsertError) {
      console.error("画像情報の保存に失敗:", imageInsertError.message);
      throw new Error("画像情報の保存に失敗しました。");
    }
  }

  // 記事と画像の中間テーブルにデータを保存
  for (const [uuid] of imageMap.entries()) {
    const { error: crossTableInsertError } = await supabase
      .from("c_article_images")
      .insert([{ article_id: articleUuid, image_id: uuid }]);
    
    if (crossTableInsertError) {
      console.error("中間テーブルへのデータの保存に失敗:", crossTableInsertError.message);
      throw new Error("中間テーブルへのデータの保存に失敗しました。");
    }
  }
}

/**
 * Uploads images to a Supabase storage bucket and returns a map of UUIDs to their public URLs.
 *
 * @param supabase - An instance of the Supabase client configured for the "public" schema.
 * @param imageMap - A `Map` containing image files to upload, where the key is a string identifier
 *                   and the value is a `File` object. If the value is not a `File`, the entry is skipped.
 * @returns A `Promise` that resolves to a `Map` where each key is a UUID generated for the uploaded image,
 *          and the value is the public URL of the uploaded image.
 * @throws Will throw an error if `imageMap` is not a `Map` or if any image fails to upload.
 */
async function uploadImages(
  supabase: any,
  images: File[]
): Promise<Map<string, string>> {
  if (!(images instanceof Array)) {
    console.warn("画像ファイルがありません。");
    return new Map<string, string>(); 
  }

  const result = new Map<string, string>();

  for (const image of images) {
    if (!(image instanceof File)) {
      console.warn("画像ファイルがありません。スキップします。");
      continue;
    }

    const uuid = uuidv4();
    const { data, error: uploadError } = await supabase.storage
      .from("md-blog")
      .upload(`captures/${uuid}.png`, image, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("画像のアップロードに失敗:", uploadError.message);
      throw new Error("画像をストレージにアップロードできませんでした。");
    }

    const publicUrl = supabase.storage
      .from("md-blog")
      .getPublicUrl(data.path).data.publicUrl;

    result.set(uuid, publicUrl);
  }
  return result;
}