import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
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

  // src/postsフォルダのパス
  const postsDir = path.join(process.cwd(), "src", "posts");

  // タイムスタンプを生成
  const timestamp = new Date()
  .toISOString()
  .replace(/[-:.TZ]/g, "")
  .slice(0, 12); // yyyymmddhhmm形式

  // 既存のファイル数を取得して連番を生成
  const files = fs.readdirSync(postsDir);
  const postNumber = files.length + 1;

  let thumbnailUrl = "";
  if (thumbnail) {
    // サムネイル画像を保存
    const uploadsDir = path.join(process.cwd(), "public", "images", "thumbnails");

    // アップロードディレクトリが存在しない場合は作成
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `post${postNumber}-${timestamp}.png`;
    const filePath = path.join(uploadsDir, fileName);

    // ファイルを保存
    const buffer = Buffer.from(await thumbnail.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // サムネイル画像のURLを生成
    thumbnailUrl = `/images/thumbnails/${fileName}`;
  }

  // フォルダが存在しない場合は作成
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  // ファイル名を生成
  const fileName = `post${postNumber}-${timestamp}.md`;

  // Markdown形式の内容を作成
  const markdownContent = 
`---
title: ${title}
date: "${timestamp}"
image: ${thumbnailUrl || ""}
---

${content}
`;

  // ファイルを保存
  fs.writeFileSync(path.join(postsDir, fileName), markdownContent);

  return NextResponse.json({ message: "記事が保存されました！" });
}