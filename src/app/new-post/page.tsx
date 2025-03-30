"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { v4 as uuidv4 } from "uuid";

/**
 * A React component for creating and submitting a new blog post.
 * 
 * This page allows users to input a title and content for a new blog post, 
 * switch between "edit" and "preview" modes, and upload images via clipboard paste.
 * 
 * ## Features
 * - **Title Input**: A text input field for the post title.
 * - **Content Input**: A textarea for the post content, supporting Markdown syntax.
 * - **Image Upload**: Automatically uploads pasted images and inserts them as Markdown.
 * - **Edit/Preview Modes**: Toggle between editing the content and previewing the rendered Markdown.
 * - **Submit Post**: Sends the post data to an API endpoint for saving.
 * 
 * @component
 * @returns {JSX.Element} The rendered NewPostPage component.
 * 
 * @example
 * // Usage in a Next.js application
 * import NewPostPage from './new-post/page';
 * 
 * export default function App() {
 *   return <NewPostPage />;
 * }
 * 
 * @remarks
 * - The image upload functionality requires an API endpoint at `/api/upload`.
 * - The post submission functionality requires an API endpoint at `/api/posts`.
 * 
 * @dependencies
 * - `ReactMarkdown` for rendering Markdown content in preview mode.
 * - `remarkGfm` for GitHub Flavored Markdown support.
 * 
 * @hooks
 * - `useState` for managing the title, content, and mode states.
 * 
 * @event
 * - `onPaste`: Handles image uploads when an image is pasted into the content textarea.
 * - `onSubmit`: Submits the post data to the API.
 */
export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [uuid, setUuid] = useState<string | null>("");

  useEffect(() => {
    const generatedUuid = uuidv4();
    setUuid(generatedUuid);

    return () => {
      setUuid("");
    };
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
          formData.append("uuid", uuid || "");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    // APIルートにデータを送信
    const response = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setTitle("");
      setContent("");
      setThumbnail(null);
      alert("記事が保存されました！");
    } else {
      alert("記事の保存に失敗しました。");
    }
  };

  return (
    <div className="container mx-auto my-8">
      <h1 className="text-4xl font-bold text-center mb-4">新しい記事を登録</h1>
      
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
        onSubmit={handleSubmit}
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
        </div>

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
              placeholder="記事の内容を入力してください"
              required
            ></textarea>
          </div>
        )}

        {/* プレビューモード */}
        {mode === "preview" && (
          <div className="mb-4">
            <div className="prose !max-w-none border !min-h-[200px] border-gray-300 rounded px-4 py-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* 登録ボタン */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            登録
          </button>
        </div>
      </form>
    </div>
  );
}