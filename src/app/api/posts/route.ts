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

  // supabaseのストレージに記事ファイルを保存する

  const supabase = await createClient()
  
  // タイムスタンプを生成
  const timestamp = new Date()
  .toISOString()
  .replace(/[TZ]/g, "")
  .slice(0, 12); // yyyymmddhhmm形式

  let publicUrl = "";
  if (thumbnail) {

    // supabaseに画像ファイルをアップロード
    const {data, error: uploadError } = await supabase.storage
      .from("md-blog")
      .upload(`thumbnails/${uuid}.png`, thumbnail, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file to Supabase Storage:", uploadError.message);
      return NextResponse.json({ error: "データのストレージアップロードに失敗しました。" }, { status: 500 });
    }

    publicUrl = supabase.storage
    .from("md-blog")
    .getPublicUrl(data.path).data.publicUrl;

    // DBにファイルデータを保存する
    const { error: insertError } = await supabase
    .from("m_images")
    .insert([
      {
        image_id: uuid,
        // author_id: "DEV",
        file_url: `thumbnails/${uuid}.png`
      },
    ]);

    if (insertError) {
      console.error("Error inserting data into Supabase:", insertError.message);
      return NextResponse.json({ error: "データの保存に失敗しました。" }, { status: 500 });
    }
      
  }

  // Markdown形式の内容を作成
  const markdownContent = 
`---
title: ${title}
date: "${timestamp}"
image: ${publicUrl}
---

${content}
`;

  // ファイルを保存
  const {error} = await supabase.storage
  .from("md-blog")
  .upload(`articles/${uuid}.md`, new Blob([content]), {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    console.error("Error uploading file to Supabase Storage:", error.message);
    return NextResponse.json({ error: "データのストレージアップロードに失敗しました。" }, { status: 500 });
  }


  // DBにファイルデータを保存する
  const { error: insertError } = await supabase
    .from("m_articles")
    .insert([
      {
        article_id: uuid,
        // author_id: "DEV",
        file_url: `articles/${uuid}.md`,
        thumbnail_url: publicUrl,
        status: "published",
        title: title,
      },
    ]);

  if (insertError) {
    console.error("Error inserting data into Supabase:", insertError.message);
    return NextResponse.json({ error: "データの保存に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ message: "記事が保存されました！" });
}