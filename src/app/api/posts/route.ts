import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const uuid = formData.get("uuid") as string;
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

  try {
    // サムネイルのアップロード
    const publicUrl = thumbnail
      ? await uploadThumbnail(supabase, uuid, thumbnail)
      : "";

    // Markdownファイルのアップロード
    await uploadMarkdownFile(supabase, uuid, title, timestamp, content, publicUrl);

    // データベースへの挿入
    await insertToDatabase(supabase, uuid, title, publicUrl);

    return NextResponse.json({ message: "記事が保存されました！" });
  } catch (error) {
    console.error("エラーが発生しました:", error);
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

  // 記事とサムネイルの中間テーブルにデータを保存
  // const { error: crossTableInsertError } = await supabase
  //   .from("m_article_images")
  //   .insert([{ article_id: uuid, image_id: uuid }]);

  // if (crossTableInsertError) {
  //   console.error("中間テーブルへのデータの保存に失敗:", crossTableInsertError.message);
  //   throw new Error("中間テーブルへのデータの保存に失敗しました。");
  // }

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

// データベースに記事情報を挿入
async function insertToDatabase(
  supabase: any,
  uuid: string,
  title: string,
  publicUrl: string
) {
  const { error: insertError } = await supabase
    .from("m_articles")
    .insert([
      {
        article_id: uuid,
        file_url: `articles/${uuid}.md`,
        thumbnail_url: publicUrl,
        status: "published",
        title: title,
      },
    ]);

  if (insertError) {
    console.error("記事情報の保存に失敗:", insertError.message);
    throw new Error("記事の保存に失敗しました。");
  }
}