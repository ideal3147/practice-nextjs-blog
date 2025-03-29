"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function EditPost({ params }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const router = useRouter();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isThumbnailChange, setIsThumbnailChange] = useState(false);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/posts/${(await params).slug}`);
        if (!response.ok) {
          throw new Error("記事データの取得に失敗しました。");
        }
        const data = await response.json();
        setTitle(data.title);
        setDate(data.date);
        setContent(data.content);
        // setThumbnail(data.image);
        setThumbnail(null);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPostData();
  }, []);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          // 画像をアップロードする処理
          const formData = new FormData();
          formData.append("file", file);

          // 画像をアップロードするAPIエンドポイントを指定
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const { url } = await response.json(); // アップロードされた画像のURLを取得
            const markdownImage = `![画像の説明](${url})\n`;

            // 現在のコンテンツに画像のMarkdownを追加
            setContent((prevContent) => prevContent + markdownImage);
          } else {
            alert("画像のアップロードに失敗しました。");
          }
        }
      }
    }
  };

  const formData = new FormData();
  formData.append("title", title);
  formData.append("date", date);
  formData.append("content", content);
  formData.append("isThumbnailChange", isThumbnailChange.toString());  
  if (isThumbnailChange) {
    formData.append("thumbnail", thumbnail as Blob);
  }

  const handleSave = async () => {
    const response = await fetch(`/api/posts/${(await params).slug}`, {
      method: "PUT",
      body: formData,
    });

    if (response.ok) {
      alert("記事が保存されました。");
      router.push(`/posts/${(await params).slug}`);
    } else {
      alert("記事の保存に失敗しました。");
    }
  };

  return (
    <div className="container mx-auto my-8">
      <h1 className="text-4xl font-bold text-center mb-4">記事を編集</h1>


      <div className="max-w-2xl mb-4 mx-auto">
        <Link
          href="/"
          className="text-blue-500 hover:underline text-lg font-medium "
        >
          戻る
        </Link>
      </div>

      <form
        className="max-w-2xl mx-auto bg-white p-6 rounded shadow-md"
        onSubmit={handleSave}
      >
        {/* タイトル入力欄 */}
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="記事のタイトルを入力してください"
            required
          />
          <input
            type="hidden"
            value={date}
            />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-700 mb-2">
            サムネイル画像を変更しますか？
          </label>
          <input
            type="checkbox"
            id="isThumbnailChange"
            checked={isThumbnailChange}
            onChange={(e) => setIsThumbnailChange(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isThumbnailChange">変更する</label>
        </div>

        {isThumbnailChange && (
          <div className="mb-4">
          <label
            htmlFor="thumbnail"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            サムネイル画像
          </label>
          <input
            type="file"
            id="thumbnail"
            name="thumbnail"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        )}
        

      <div className="mb-4 flex border-b">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className={`px-4 py-2 ${
            mode === "edit"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className={`px-4 py-2 ${
            mode === "preview"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
        >
          プレビュー
        </button>
      </div>

      {mode === "edit" && (
          <div className="mb-4">
          <textarea
              id="content"
              name="content"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              className="w-full border min-h-[200px] h-1 border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
          ></textarea>
          </div>
      )}

      {mode === "preview" && (
          <div className="mb-4">
          <div className="prose !max-w-none border !min-h-[200px] border-gray-300 rounded px-4 py-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          </div>
      )}

      <div className="text-center">
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          保存
        </button>
      </div>
      </form>
    </div>
  );
}