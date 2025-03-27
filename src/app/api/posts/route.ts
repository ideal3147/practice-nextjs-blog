import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  const { title, content } = await request.json();

  // タイムスタンプを生成
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 12); // yyyymmddhhmm形式

  // src/postsフォルダのパス
  const postsDir = path.join(process.cwd(), "src", "posts");

  // フォルダが存在しない場合は作成
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  // 既存のファイル数を取得して連番を生成
  const files = fs.readdirSync(postsDir);
  const postNumber = files.length + 1;

  // ファイル名を生成
  const fileName = `post${postNumber}-${timestamp}.md`;

  // Markdown形式の内容を作成
  const markdownContent = 
`---
title: ${title}
date: "${timestamp}"
---

${content}
`;

  // ファイルを保存
  fs.writeFileSync(path.join(postsDir, fileName), markdownContent);

  return NextResponse.json({ message: "記事が保存されました！" });
}