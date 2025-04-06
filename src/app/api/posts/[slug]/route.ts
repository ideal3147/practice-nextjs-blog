import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { rehype } from "rehype";
import rehypeRaw from "rehype-raw";
import rehypePrism from "rehype-prism-plus";
import rehypeStringify from "rehype-stringify";
import rehypeExternalLinks from "rehype-external-links";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;

    // supabase storageから記事ファイルを取得する
    const supabase = await createClient();
    const { data, error } = await supabase.storage
    .from("md-blog")
    .download(`articles/${slug}.md`);

    if (error) {
      console.error("Error fetching data from Supabase:", error.message);
      return NextResponse.json({ error: "記事が見つかりません。" }, { status: 404 });
    }

    // 記事を読み込む
    const fileBuffer = await data.arrayBuffer();
    const fileContents = Buffer.from(fileBuffer).toString("utf-8");
    const { data: frontMatterData, content } = matter(fileContents);

    // MarkdownをHTMLに変換
    const processedContent = await remark()
      .use(html, { sanitize: false })
      .process(content);

    const contentHtml = processedContent.toString();

    // Rehypeでさらに処理
    const rehypedContent = await rehype()
      .data("settings", { fragment: true })
      .use(rehypeRaw)
      .use(rehypePrism)
      .use(rehypeExternalLinks, { target: "_blank", rel: ["nofollow"] })
      .use(rehypeStringify)
      .process(contentHtml);

      // サムネイル画像のURLを取得
      const { data: thumbnailUrl, error: thumbnailError } = await supabase
      .from("m_articles")
      .select(
        "thumbnail_url"
      ).eq("article_id", slug)
      .single();

      if (thumbnailError) {
        console.error("Error fetching thumbnail from Supabase:", thumbnailError.message);
      }
      if (thumbnailUrl) {
        frontMatterData.image = thumbnailUrl.thumbnail_url;
      }

    return NextResponse.json({
      slug,
      title: frontMatterData.title,
      description: frontMatterData.description,
      date: frontMatterData.date,
      image: frontMatterData.image,
      tags: frontMatterData.tags,
      content: content,
      contentHtml: rehypedContent.value.toString(),
    });
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return NextResponse.json(
      { error: "記事データの取得中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const content = formData.get("content") as string;
    const isThumbnailChange = formData.get("isThumbnailChange") as string;
    const thumbnail = formData.get("thumbnail") as File | null;
    let articleContent = content;

    const timestamp = generateTimestamp();

    if (!title || !content) {
      return NextResponse.json(
        { error: "タイトルと本文は必須です。" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const articleUuid = (await params).slug;
    
    let imageInfoMap = new Map<string, string>();
    
    try {
      
      // 既存の画像が削除されていないかを確認する
      const { data: existingImages, error: fetchError } = await supabase
        .from("c_article_images")
        .select("image_id")
        .eq("article_id", articleUuid);
      if (fetchError) {
        console.error("Error fetching existing images:", fetchError.message);
        return NextResponse.json(
          { error: "既存の画像を取得できませんでした。" },
          { status: 500 }
        );
      }

      // m_imagesから既存画像urlの一覧を取得する
      const { data: imageUrls, error: imageError } = await supabase
        .from("m_images")
        .select("image_id, file_url")
        .in("image_id", existingImages.map((image) => image.image_id));
      if (imageError) {
        console.error("Error fetching image URLs:", imageError.message);
        return NextResponse.json(
          { error: "画像URLを取得できませんでした。" },
          { status: 500 }
        );
      }

      // imageUrlsの中で、記事の本文に記載されていないものを削除する
      const deleteImageUrls = imageUrls.filter((image) => !content.includes(image.file_url));
      if (deleteImageUrls.length > 0) {

        // storageから削除する
        for (const image of deleteImageUrls) {
          const { error: storageError } = await supabase.storage
            .from("md-blog")
            .remove([`captures/${image.image_id}.png`]);
          if (storageError) {
            console.error("Error deleting image from storage:", storageError.message);
            return NextResponse.json(
              { error: "画像をストレージから削除できませんでした。" },
              { status: 500 }
            );
          }
        }
        // m_imagesから削除する
        const imageIdsToDelete = deleteImageUrls.map((image) => image.image_id);
        const { error: deleteError } = await supabase
          .from("m_images")
          .delete()
          .in("image_id", imageIdsToDelete);
        if (deleteError) {
          console.error("Error deleting images:", deleteError.message);
          return NextResponse.json(
            { error: "画像を削除できませんでした。" },
            { status: 500 }
          );
        }
      }

      // 新規画像のアップロード
      const imageMap: Map<string, File> = new Map<string, File>();

      for (const [key, value] of formData.entries()) {
        if (key.startsWith("image-") && value instanceof File) {
          // keyの"image-"を取り除く
          const imageKey = key.replace("image-", "");
          imageMap.set(imageKey, value as File);
        }
      }
      const uploadResult = await uploadImages(supabase, imageMap, content);
      imageInfoMap = uploadResult.imageURLInfo;
      articleContent = uploadResult.articleContent;
    } catch (error : any) {
      console.error("画像のアップロードに失敗:", error.message);
      return NextResponse.json(
        { error: "画像をストレージにアップロードできませんでした。" },
        { status: 500 }
      );
    }


    let thumbnailUrl = "";
    if (isThumbnailChange === 'true') {
      // storageから、既存のサムネイルの削除
      const { error: deleteThumbnailError } = await supabase.storage
        .from("md-blog")
        .remove([`thumbnails/${articleUuid}.png`]);
      if (deleteThumbnailError) {
        console.error("Error deleting thumbnail from storage:", deleteThumbnailError.message);
        return NextResponse.json(
          { error: "サムネイルをストレージから削除できませんでした。" },
          { status: 500 }
        );
      }

      // 新しいサムネイルURLが存在する場合、アップロード
      if (thumbnail && thumbnail instanceof File) {
        const { data, error: uploadError } = await supabase.storage
          .from("md-blog")
          .upload(`thumbnails/${articleUuid}.png`, thumbnail, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("サムネイルのアップロードに失敗:", uploadError.message);
          return NextResponse.json(
            { error: "サムネイルをストレージにアップロードできませんでした。" },
            { status: 500 }
          );
        }

        thumbnailUrl = supabase.storage
          .from("md-blog")
          .getPublicUrl(data.path).data.publicUrl;
      } 
    } else {
      // m_articlesからサムネイルURLを取得
      const { data: thumbnailData, error: thumbnailError } = await supabase
        .from("m_articles")
        .select("thumbnail_url")
        .eq("article_id", articleUuid)
        .single();
      if (thumbnailError) {
        console.error("Error fetching thumbnail URL:", thumbnailError.message);
        return NextResponse.json(
          { error: "サムネイルURLを取得できませんでした。" },
          { status: 500 }
        );
      }
      thumbnailUrl = thumbnailData.thumbnail_url;
    }

    // Markdownファイルのアップロード
    await uploadMarkdownFile(supabase, articleUuid, title, date, articleContent, thumbnailUrl);

    // データベースへの挿入
    await insertToDatabase(supabase, articleUuid, title, thumbnailUrl, imageInfoMap, date);

    return NextResponse.json({ message: "記事が保存されました。" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "記事の保存中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

/**
 * Handles the deletion of an article and its associated resources.
 *
 * This function performs the following steps:
 * 1. Retrieves the article UUID from the request parameters.
 * 2. Fetches associated image UUIDs from the database.
 * 3. Deletes associated images from storage.
 * 4. Deletes the article file from storage.
 * 5. Fetches and deletes the thumbnail image and its metadata, if present.
 * 6. Deletes image metadata from the `m_images` table.
 * 7. Deletes article metadata from the `m_articles` table.
 *
 * @param request - The HTTP request object.
 * @param context - An object containing route parameters, including:
 *   - `params`: A promise resolving to an object with the `slug` property (article UUID).
 * @returns A JSON response indicating success or failure.
 *
 * @throws Will return a JSON response with a 500 status code if any operation fails.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const articleUuid = (await params).slug;
    const supabase = await createClient();

    // Helper function to handle errors
    const handleError = (message: string, error: any) => {
      console.error(message, error.message);
      return NextResponse.json({ error: message }, { status: 500 });
    };

    // Fetch associated image UUIDs
    const { data: imageUuids, error: imagesError } = await supabase
      .from("c_article_images")
      .select("image_id")
      .eq("article_id", articleUuid);

    if (imagesError) return handleError("記事の画像を取得中にエラーが発生しました。", imagesError);

    // Delete associated images from storage
    for (const imageUuid of imageUuids) {
      const { error: deleteImageError } = await supabase.storage
        .from("md-blog")
        .remove([`captures/${imageUuid.image_id}.png`]);
      if (deleteImageError) return handleError("画像の削除中にエラーが発生しました。", deleteImageError);
    }

    // Delete article file from storage
    const { error: deleteFileError } = await supabase.storage
      .from("md-blog")
      .remove([`articles/${articleUuid}.md`]);
    if (deleteFileError) return handleError("記事ファイルの削除中にエラーが発生しました。", deleteFileError);

    // Fetch thumbnail URL
    const { data: thumbnailUrl, error: thumbnailError } = await supabase
      .from("m_articles")
      .select("thumbnail_url")
      .eq("article_id", articleUuid)
      .single();

    if (thumbnailError) return handleError("サムネイルの取得中にエラーが発生しました。", thumbnailError);

    // Delete thumbnail image and its metadata
    if (thumbnailUrl) {
      const { error: deleteThumbnailError } = await supabase.storage
        .from("md-blog")
        .remove([`thumbnails/${articleUuid}.png`]);
      if (deleteThumbnailError) return handleError("サムネイル画像の削除中にエラーが発生しました。", deleteThumbnailError);

      const { error: deleteThumbnailImageError } = await supabase
        .from("m_images")
        .delete()
        .eq("image_id", articleUuid);
      if (deleteThumbnailImageError) return handleError("サムネイル画像情報の削除中にエラーが発生しました。", deleteThumbnailImageError);
    }

    // Delete image metadata from m_images table
    const imageIdsToDelete = imageUuids.map((image) => image.image_id);
    const { error: deleteImagesError } = await supabase
      .from("m_images")
      .delete()
      .in("image_id", imageIdsToDelete);
    if (deleteImagesError) return handleError("画像情報の削除中にエラーが発生しました。", deleteImagesError);

    // Delete article metadata from m_articles table
    const { error: deleteArticleError } = await supabase
      .from("m_articles")
      .delete()
      .eq("article_id", articleUuid);
    if (deleteArticleError) return handleError("記事の削除中にエラーが発生しました。", deleteArticleError);

    return NextResponse.json({ message: "記事が削除されました。" });
  } catch (error) {
    console.error("削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "記事の削除中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

async function uploadImages(
  supabase: any,
  images: Map<string, File>,
  content: string,
): Promise<{ imageURLInfo: Map<string, string>, articleContent: string; }>  {
  if (!(images instanceof Map && images.size == 0)) {
    console.warn("画像ファイルがありません。");
    return { imageURLInfo: new Map<string, string>(), articleContent: content }; 
  }

  const result = new Map<string, string>();

  for (const [key, value] of images.entries()) {
    if (!(value instanceof File)) {
      console.warn("画像ファイルがありません。スキップします。");
      continue;
    }

    const uuid = uuidv4();
    const { data, error: uploadError } = await supabase.storage
      .from("md-blog")
      .upload(`captures/${uuid}.png`, value, {
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

    // 記事の中のObjectURLをPublicURLに置き換える
    content = content.replace(key, publicUrl);
    result.set(uuid, publicUrl);

  }
  return {imageURLInfo: result, articleContent: content};
}

// タイムスタンプを生成
function generateTimestamp(): string {
  return new Date().toISOString().replace(/[TZ]/g, "").slice(0, 12); // yyyymmddhhmm形式
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
  date: any
) {

  // 記事情報の保存
  const { error: insertError } = await supabase
    .from("m_articles")
    .update([
      {
        thumbnail_url: thumbnailPublicUrl,
        status: "published",
        title: title,
        updated_at: new Date()
      },
    ])
    .eq("article_id", articleUuid);

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
