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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;

    // 記事ファイルのパス
    const filePath = path.join(process.cwd(), "src", "posts", `${slug}.md`);

    // 記事ファイルを読み込む
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "記事が見つかりません。" }, { status: 404 });
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

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

    return NextResponse.json({
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      image: data.image,
      tags: data.tags,
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