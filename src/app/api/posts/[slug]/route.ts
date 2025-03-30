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
    const slug = (await params).slug;

    // 記事ファイルのパス
    const postFilePath = path.join(process.cwd(), "src", "posts", `${slug}.md`);

    // 記事ファイルが存在するか確認
    if (!fs.existsSync(postFilePath)) {
      return NextResponse.json({ error: "記事が見つかりません。" }, { status: 404 });
    }

    // 記事ファイルを削除
    fs.unlinkSync(postFilePath);

    // サムネイル画像の削除
    const uploadsDir = path.join(process.cwd(), "public", "images", "thumbnails");
    const files = fs.readdirSync(uploadsDir);
    files.forEach((file) => {
      if (file.startsWith(slug)) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    });

    // TODO: 挿入画像の削除処理

    return NextResponse.json({ message: "記事が削除されました。" });
  } catch (error) {
    console.error("削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "記事の削除中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}