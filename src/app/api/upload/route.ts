import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/server";

/**
 * Handles the POST request for uploading a file.
 *
 * This function processes a multipart form-data request, saves the uploaded file
 * to the server, and returns the URL of the saved file. If the file is not provided
 * in the request, it responds with an error.
 *
 * @param request - The incoming HTTP request object.
 * @returns A JSON response containing the URL of the uploaded file or an error message.
 *
 * @remarks
 * - The uploaded file is saved in the `public/images/uploads` directory.
 * - The file name is generated using a UUID to ensure uniqueness.
 * - If the upload directory does not exist, it is created recursively.
 *
 * @example
 * // Example response on successful upload:
 * // { "url": "/images/uploads/unique-file-name.jpg" }
 *
 * @example
 * // Example response when no file is provided:
 * // { "error": "ファイルが見つかりません。" }
 */
export async function POST(request: Request) {
  // マルチパートデータを取得
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const uuid = formData.get("uuid") as string | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが見つかりません。" }, { status: 400 });
  }

  const fileName = `${uuidv4()}-${file.name}`;


  const supabase = await createClient()

  // storageに画像ファイルをアップロード
  const {data, error: uploadError } = await supabase.storage
    .from("md-blog")
    .upload(`captures/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading file to Supabase Storage:", uploadError);
    return NextResponse.json({ error: "データのストレージアップロードに失敗しました。" }, { status: 500 });
  }

  // DBにデータを挿入
  const { error } = await supabase
    .from("m_images")
    .insert([
      {
        image_id: uuid,
        file_url: data.fullPath
      },
    ]);

  if (error) {
    console.error("Error inserting data into Supabase:", error.message);
    return NextResponse.json({ error: "データの挿入に失敗しました。" }, { status: 500 });
  }

  const publicUrl = supabase.storage
  .from("md-blog")
  .getPublicUrl(data.path).data.publicUrl;
  
  return NextResponse.json({ url: publicUrl });
}