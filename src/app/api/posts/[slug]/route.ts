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

    if (!title || !content) {
      return NextResponse.json(
        { error: "タイトルと本文は必須です。" },
        { status: 400 }
      );
    }

    const slug = (await params).slug;
    const filePath = path.join(process.cwd(), "src", "posts", `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "記事が見つかりません。" }, { status: 404 });
    }

    let thumbnailUrl = "";
    if (isThumbnailChange) {

      // サムネイル画像を保存
      const uploadsDir = path.join(process.cwd(), "public", "images", "thumbnails");
  
      // アップロードディレクトリが存在しない場合は作成
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
  
      const filePath = path.join(uploadsDir, `${slug}.png`);

      // ファイルを保存
      if (thumbnail && thumbnail instanceof File) {
        const buffer = Buffer.from(await thumbnail.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        thumbnailUrl = `/images/thumbnails/${slug}.png`;
      }
    }

    if (isThumbnailChange === 'false') {
      if (fs.existsSync(filePath)) {
        thumbnailUrl = `/images/thumbnails/${slug}.png`;
      }
    }

    const markdownContent = 
`---
title: ${title}
date: "${date}"
image: ${thumbnailUrl || ""}
---

${content}`;

    fs.writeFileSync(filePath, markdownContent);

    return NextResponse.json({ message: "記事が保存されました。" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "記事の保存中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const articleUuid = (await params).slug;

    // 記事に含まれる画像を全検索
    // c_article_imagesテーブルから、article_idがarticleUuidのimage_idを取得
    const supabase = await createClient();
    const { data: imageUuids, error: imagesError } = await supabase
      .from("c_article_images")
      .select("image_id")
      .eq("article_id", articleUuid);

    if (imagesError) {
      console.error("Error fetching images from Supabase:", imagesError.message);
      return NextResponse.json(
        { error: "記事の画像を取得中にエラーが発生しました。" },
        { status: 500 }
      );
    }

    // 取得した画像のUUIDでそれぞれ、storageの該当の画像を削除する。
    for (const imageUuid of imageUuids) {
      const { error: deleteImageError } = await supabase.storage
        .from("md-blog")
        .remove([`captures/${imageUuid.image_id}.png`]);
      if (deleteImageError) {
        console.error("Error deleting image from Supabase:", deleteImageError.message);
        return NextResponse.json(
          { error: "画像の削除中にエラーが発生しました。" },
          { status: 500 }
        );
      }
    }

    // storageから、記事ファイルを削除する
    const { error: deleteFileError } = await supabase.storage
      .from("md-blog")
      .remove([`articles/${articleUuid}.md`]);
    if (deleteFileError) {
      console.error("Error deleting file from Supabase:", deleteFileError.message);
      return NextResponse.json(
        { error: "記事ファイルの削除中にエラーが発生しました。" },
        { status: 500 }
      );
    }

    // m_articlesテーブルから、thumbnail_urlを取得する
    const { data: thumbnailUrl, error: thumbnailError } = await supabase
      .from("m_articles")
      .select("thumbnail_url")
      .eq("article_id", articleUuid)
      .single();

    if (thumbnailError) {
      console.error("Error fetching thumbnail from Supabase:", thumbnailError.message);
      return NextResponse.json(
        { error: "サムネイルの取得中にエラーが発生しました。" },
        { status: 500 }
      );
    }

    if (thumbnailUrl) {
      // サムネイル画像をstorageから削除
      const { error: deleteThumbnailError } = await supabase.storage
        .from("md-blog")
        .remove([`thumbnails/${articleUuid}.png`]);
      if (deleteThumbnailError) {
        console.error("Error deleting thumbnail from Supabase:", deleteThumbnailError.message);
        return NextResponse.json(
          { error: "サムネイル画像の削除中にエラーが発生しました。" },
          { status: 500 }
        );
      }

      // サムネイル画像情報をm_imagesテーブルから削除
      const { error: deleteThumbnailImageError } = await supabase
        .from("m_images")
        .delete()
        .eq("image_id", articleUuid);
      if (deleteThumbnailImageError) {
        console.error("Error deleting thumbnail image from Supabase:", deleteThumbnailImageError.message);
        return NextResponse.json(
          { error: "サムネイル画像情報の削除中にエラーが発生しました。" },
          { status: 500 }
        );
      }
    }

    // m_imagesテーブルから、今回削除した画像のレコードを削除する
    const imageIdsToDelete = imageUuids.map((image) => image.image_id);
    const { data: data, error: deleteImagesError } = await supabase
      .from("m_images")
      .delete()
      .in("image_id", imageIdsToDelete);

    // m_articlesテーブルから、記事のレコードを削除する
    const { error: deleteArticleError } = await supabase
      .from("m_articles")
      .delete()
      .eq("article_id", articleUuid);
    if (deleteArticleError) {
      console.error("Error deleting article from Supabase:", deleteArticleError.message);
      return NextResponse.json(
        { error: "記事の削除中にエラーが発生しました。" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: "記事が削除されました。" });
  } catch (error) {
    console.error("削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "記事の削除中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}