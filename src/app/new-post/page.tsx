"use client";

import { useState } from "react";

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // APIルートにデータを送信
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    });

    if (response.ok) {
      setTitle("");
      setContent("");
      alert("記事が保存されました！");
    } else {
      alert("記事の保存に失敗しました。");
    }
  };

  return (
    <div className="container mx-auto my-8">
      <h1 className="text-4xl font-bold text-center mb-4">新しい記事を登録</h1>
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

        {/* 文章入力欄 */}
        <div className="mb-4">
          <label
            htmlFor="content"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            本文
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border min-h-[200px] border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="記事の内容を入力してください"
            required
          ></textarea>
        </div>

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