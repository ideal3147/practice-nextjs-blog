import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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

  if (!file) {
    return NextResponse.json({ error: "ファイルが見つかりません。" }, { status: 400 });
  }

  // ファイル名を生成（UUIDを使用）
  const fileName = `${uuidv4()}-${file.name}`;
  const uploadsDir = path.join(process.cwd(),"public", "images", "uploads");

  // アップロードディレクトリが存在しない場合は作成
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // ファイルを保存
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  // 保存したファイルのURLを返す
  const fileUrl = `/images/uploads/${fileName}`;
  return NextResponse.json({ url: fileUrl });
}