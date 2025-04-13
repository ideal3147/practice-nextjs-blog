"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BackButton from "@/components/BackButton";

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
  const [imageMap, setImageMap] = useState<Record<string, File>>({});
  const [tags, setTags] = useState("");

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

          // オブジェクトURLを生成
          const blobObjectUrl = URL.createObjectURL(file);
          // blobObjectUrlの文字列から、blob:を取り除く
          const objectUrl = blobObjectUrl.replace("blob:", ""); 

          const markdownImage = `![画像の説明](${objectUrl})\n`;

          // 現在のコンテンツに画像のMarkdownを追加
          setContent((prevContent) => prevContent + markdownImage);
          setImageMap((prev) => ({ ...prev, [objectUrl]: file }));
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
    Object.entries(imageMap).forEach(([blobUrl, file]) => {
      formData.append(`image-${blobUrl}`, file);
    });

    // タグの処理
    const uniqueTags = Array.from(new Set(tags.split(',').map(t => t.trim()).filter(Boolean)));
    formData.append("tags", JSON.stringify(uniqueTags));

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
      window.location.href = "/";
    } else {
      alert("記事の保存に失敗しました。");
    }
  };

  return (
    <div className="container mx-auto my-12 px-4">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">📝 新しい記事を作成</h1>
  
      <div className="max-w-2xl mx-auto">
        <BackButton />
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-lg"
        >
          {/* タイトル */}
          <div className="mb-6">

            <label htmlFor="title" className="block text-lg font-semibold text-gray-700 mb-2">
              タイトル
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="例：Markdownでブログを作る方法"
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
    
          {/* サムネイル */}
          <div className="mb-6">
            <label htmlFor="thumbnail" className="block text-lg font-semibold text-gray-700 mb-2">
              サムネイル画像
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
    
          {/* 編集/プレビュー切り替え */}
          <div className="flex mb-4 border-b">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`px-4 py-2 font-medium ${
                mode === "edit"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-400 hover:text-blue-500"
              } transition`}
            >
              編集
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`px-4 py-2 font-medium ${
                mode === "preview"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-400 hover:text-blue-500"
              } transition`}
            >
              プレビュー
            </button>
          </div>
    
          {/* 編集モード */}
          {mode === "edit" && (
            <div className="mb-6">
              <textarea
                id="content"
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                required
                placeholder="本文をMarkdown形式で入力してください..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              />
            </div>
          )}
    
          {/* プレビューモード */}
          {mode === "preview" && (
            <div className="mb-6 border rounded-md p-4 bg-gray-50">
              <div className="prose prose-blue max-w-none min-h-[200px] text-gray-800">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ node, ...props }) => (
                      <img src={'blob:' + props.src} style={{ maxWidth: "50%" }} />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* タグ入力欄 */}
          <div className="mb-6">
            <label htmlFor="tags" className="block text-lg font-semibold text-gray-700 mb-2">
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例：Next.js, Markdown, ブログ"
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              カンマ（,）で区切って複数タグを入力できます。
            </p>
          </div>
    
          {/* 登録ボタン */}
          <div className="text-center">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );   
}