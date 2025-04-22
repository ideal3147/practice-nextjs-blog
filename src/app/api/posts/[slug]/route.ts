import { NextResponse } from "next/server";
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
import { SupabaseClient } from "@supabase/supabase-js";


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


/**
 * Handles the PUT request to update a blog post.
 *
 * This function processes the incoming request to update an article identified by its slug.
 * It extracts form data, validates required fields, handles image and thumbnail uploads,
 * updates the Markdown file, and updates the database with the new article information.
 *
 * @param request - The incoming HTTP request object.
 * @param params - An object containing route parameters, including the `slug` of the article.
 * 
 * @returns A JSON response indicating success or failure of the operation.
 *
 * @throws Will return a 400 error if required fields (title or content) are missing.
 * @throws Will return a 500 error if an unexpected error occurs during processing.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const formData = await request.formData();
    const { title, date, content, isThumbnailChange, thumbnail, tags } = extractFormData(formData);
    const articleUuid = (await params).slug;

    if (!title || !content) {
      return respondWithError("タイトルと本文は必須です。", 400);
    }

    const supabase = await createClient();

    // Handle images
    const { imageURLInfo: imageInfoMap, articleContent: updatedContent } = await handleImages(
      supabase,
      formData,
      content,
      articleUuid
    );

    // Handle thumbnail
    const thumbnailUrl = await handleThumbnail(supabase, isThumbnailChange, thumbnail, articleUuid);

    // Upload Markdown file
    await uploadMarkdownFile(supabase, articleUuid, title, date, updatedContent, thumbnailUrl, tags);

    // Update database
    await insertToDatabase(supabase, articleUuid, title, thumbnailUrl, imageInfoMap, tags);

    return NextResponse.json(
      {message: "記事が保存されました。" },
      { status: 200 }
    );
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return respondWithError("記事の保存中にエラーが発生しました。", 500);
  }
}

/**
 * Extracts and returns form data from a `FormData` object.
 *
 * @param formData - The `FormData` object containing the form fields and values.
 * @returns An object containing the extracted form data:
 * - `title`: The title of the post as a string.
 * - `date`: The date of the post as a string.
 * - `content`: The content of the post as a string.
 * - `isThumbnailChange`: A string indicating whether the thumbnail has changed.
 * - `thumbnail`: The thumbnail file as a `File` object or `null` if not provided.
 */
function extractFormData(formData: FormData) {

  const tags = formData.get("tags") as string | null;
  // tagsをカンマで区切り、配列にする
  const tagArray = tags ? JSON.parse(tags) : null;

  return {
    title: formData.get("title") as string,
    date: formData.get("date") as string,
    content: formData.get("content") as string,
    isThumbnailChange: formData.get("isThumbnailChange") as string,
    thumbnail: formData.get("thumbnail") as File | null,
    tags: tagArray
  };
}

/**
 * Handles image processing for a given article by performing the following steps:
 * 1. Deletes unused images associated with the article.
 * 2. Extracts images from the provided form data.
 * 3. Uploads the extracted images and updates the content accordingly.
 *
 * @param supabase - The Supabase client instance used for database operations.
 * @param formData - The form data containing the images to be processed.
 * @param content - The content of the article, used to determine which images are in use.
 * @param articleUuid - The unique identifier of the article for which images are being processed.
 * @returns A promise that resolves to the updated content with uploaded image references.
 */
async function handleImages(
  supabase: SupabaseClient,
  formData: FormData,
  content: string,
  articleUuid: string
) {
  await deleteUnusedImages(supabase, content, articleUuid);
  const imageMap = extractImagesFromFormData(formData);
  return await uploadImages(supabase, imageMap, content);
}

/**
 * Deletes unused images from storage and the database for a given article.
 *
 * This function retrieves the existing images associated with an article from the database,
 * compares them with the content of the article, and deletes any images that are no longer
 * referenced in the content. It ensures that only the images still in use remain stored.
 *
 * @param supabase - The Supabase client instance used for database and storage operations.
 * @param content - The content of the article as a string, used to determine which images are still in use.
 * @param articleUuid - The unique identifier of the article whose images are being managed.
 * @throws {Error} If there is an issue fetching existing images or their URLs from the database.
 */
async function deleteUnusedImages(supabase: SupabaseClient, content: string, articleUuid: string) {
  const { data: existingImages, error: fetchError } = await supabase
    .from("c_article_images")
    .select("image_id")
    .eq("article_id", articleUuid);

  if (fetchError) throw new Error("既存の画像を取得できませんでした。");

  const { data: imageUrls, error: imageError } = await supabase
    .from("m_images")
    .select("image_id, file_url")
    .in("image_id", existingImages.map((image: { image_id: string; }) => image.image_id));

  if (imageError) throw new Error("画像URLを取得できませんでした。");

  const deleteImageUrls = imageUrls.filter((image: { file_url: string; }) => !content.includes(image.file_url));
  await deleteImagesFromStorageAndDatabase(supabase, deleteImageUrls);
}

/**
 * Deletes images from both Supabase storage and the database.
 *
 * @param supabase - The Supabase client instance used for interacting with storage and database.
 * @param deleteImageUrls - An array of objects containing image information, where each object includes an `image_id` property.
 * 
 * @throws {Error} If an error occurs while deleting images from storage or the database.
 *
 * @example
 * const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
 * const deleteImageUrls = [{ image_id: "123" }, { image_id: "456" }];
 * 
 * await deleteImagesFromStorageAndDatabase(supabase, deleteImageUrls);
 */
async function deleteImagesFromStorageAndDatabase(supabase: SupabaseClient, deleteImageUrls: Array<{ image_id: string, file_url: string }>) {
  for (const image of deleteImageUrls) {
    const { error: storageError } = await supabase.storage
      .from("md-blog")
      .remove([`captures/${image.image_id}.png`]);
    if (storageError) throw new Error("画像をストレージから削除できませんでした。");
  }

  const imageIdsToDelete = deleteImageUrls.map((image) => image.image_id);
  const { error: deleteError } = await supabase
    .from("m_images")
    .delete()
    .in("image_id", imageIdsToDelete);

  if (deleteError) throw new Error("画像を削除できませんでした。");
}

/**
 * Extracts image files from a FormData object and maps them to their corresponding keys.
 * 
 * This function iterates through all entries in the provided FormData object, identifying
 * entries where the key starts with "image-" and the value is a `File` object. It then
 * removes the "image-" prefix from the key and stores the resulting key-value pair in a
 * `Map`, where the key is the modified string and the value is the `File` object.
 * 
 * @param formData - The FormData object containing the form entries to process.
 * @returns A `Map` where the keys are the image identifiers (derived from the original
 *          keys by removing the "image-" prefix) and the values are the corresponding
 *          `File` objects.
 */
function extractImagesFromFormData(formData: FormData): Map<string, File> {
  const imageMap = new Map<string, File>();
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("image-") && value instanceof File) {
      const imageKey = key.replace("image-", "");
      imageMap.set(imageKey, value);
    }
  }
  return imageMap;
}

/**
 * Handles the thumbnail for an article by either deleting the existing thumbnail
 * and uploading a new one, or fetching the URL of the existing thumbnail.
 *
 * @param supabase - The Supabase client instance used for storage operations.
 * @param isThumbnailChange - A string indicating whether the thumbnail has changed ("true" or "false").
 * @param thumbnail - The new thumbnail file to upload, or `null` if no new thumbnail is provided.
 * @param articleUuid - The unique identifier of the article associated with the thumbnail.
 * @returns A promise that resolves to the URL of the updated or existing thumbnail.
 */
async function handleThumbnail(
  supabase: SupabaseClient,
  isThumbnailChange: string,
  thumbnail: File | null,
  articleUuid: string
): Promise<string> {
  if (isThumbnailChange === "true") {
    await deleteExistingThumbnail(supabase, articleUuid);
    return await uploadNewThumbnail(supabase, thumbnail, articleUuid);
  } else {
    return await fetchExistingThumbnailUrl(supabase, articleUuid);
  }
}

/**
 * Deletes an existing thumbnail image from the Supabase storage.
 *
 * @param supabase - The Supabase client instance used to interact with the storage.
 * @param articleUuid - The unique identifier of the article whose thumbnail is to be deleted.
 * @throws {Error} Throws an error if the thumbnail could not be removed from storage.
 */
async function deleteExistingThumbnail(supabase: SupabaseClient, articleUuid: string) {
  const { error } = await supabase.storage
    .from("md-blog")
    .remove([`thumbnails/${articleUuid}.png`]);
  if (error) throw new Error("サムネイルをストレージから削除できませんでした。");
}

/**
 * Uploads a new thumbnail image to the Supabase storage and returns its public URL.
 *
 * @param supabase - The Supabase client instance used for interacting with the storage.
 * @param thumbnail - The new thumbnail file to be uploaded. If null, an error will be thrown.
 * @param articleUuid - The unique identifier of the article, used to name the thumbnail file.
 * @returns A promise that resolves to the public URL of the uploaded thumbnail.
 * @throws Will throw an error if the thumbnail is not provided or if the upload fails.
 */
async function uploadNewThumbnail(
  supabase: SupabaseClient,
  thumbnail: File | null,
  articleUuid: string
): Promise<string> {
  if (!(thumbnail instanceof(File))) {
    console.log("新しいサムネイルが提供されていません。");
    return "";
  }

  const { data, error } = await supabase.storage
    .from("md-blog")
    .upload(`thumbnails/${articleUuid}.png`, thumbnail, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw new Error("サムネイルをストレージにアップロードできませんでした。");

  return supabase.storage.from("md-blog").getPublicUrl(data.path).data.publicUrl;
}

/**
 * Fetches the existing thumbnail URL for a given article from the "m_articles" table.
 *
 * @param supabase - The Supabase client instance used to interact with the database.
 * @param articleUuid - The unique identifier of the article whose thumbnail URL is to be fetched.
 * @returns A promise that resolves to the thumbnail URL as a string.
 * @throws An error if the thumbnail URL cannot be retrieved.
 */
async function fetchExistingThumbnailUrl(supabase: SupabaseClient, articleUuid: string): Promise<string> {
  const { data, error } = await supabase
    .from("m_articles")
    .select("thumbnail_url")
    .eq("article_id", articleUuid)
    .single();

  if (error) throw new Error("サムネイルURLを取得できませんでした。");

  return data.thumbnail_url;
}

/**
 * Generates a JSON response with an error message and HTTP status code.
 *
 * @param message - The error message to include in the response.
 * @param status - The HTTP status code to set for the response.
 * @returns A `NextResponse` object containing the error message and status code.
 */
function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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
    const handleError = (message: string, error: Error) => {
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
  supabase: SupabaseClient,
  images: Map<string, File>,
  content: string,
): Promise<{ imageURLInfo: Map<string, string>, articleContent: string; }>  {
  if (images instanceof Map && images.size == 0) {
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
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day}/${hours}:${minutes}`;
}

// Markdownファイルをアップロード
async function uploadMarkdownFile(
  supabase: SupabaseClient,
  uuid: string,
  title: string,
  timestamp: string,
  content: string,
  publicUrl: string,
  tags: string[] | null
) {
  const markdownContent =  
`---
title: ${title}
date: "${generateTimestamp()}"
image: ${publicUrl}
tags: ${tags ? tags : "[]"}
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
  supabase: SupabaseClient,
  articleUuid: string,
  title: string,
  thumbnailPublicUrl: string,
  imageMap: Map<string, string>,
  tags: string[] | null
) {

  // 記事情報の保存
  const { error: insertError } = await supabase
    .from("m_articles")
    .update([
      {
        thumbnail_url: thumbnailPublicUrl,
        status: "published",
        title: title,
        tags: tags ? tags : null,
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
