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
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isThumbnailChange, setIsThumbnailChange] = useState(false);
  const [imageMap, setImageMap] = useState<Record<string, File>>({});
  const [tags, setTags] = useState("");


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
        setTags(data.tags); // タグをカンマ区切りの文字列に変換
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



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("date", date);
    formData.append("content", content);
    formData.append("isThumbnailChange", isThumbnailChange.toString());  
    if (isThumbnailChange) {
      formData.append("thumbnail", thumbnail as Blob);
    }
    Object.entries(imageMap).forEach(([blobUrl, file]) => {
      formData.append(`image-${blobUrl}`, file);
    });

    // タグの処理
    const uniqueTags = Array.from(new Set(tags.split(',').map(t => t.trim()).filter(Boolean)));
    formData.append("tags", JSON.stringify(uniqueTags));

    const response = await fetch(`/api/posts/${(await params).slug}`, {
      method: "PUT",
      body: formData,
    });

    if (response.ok) {
      alert("記事が保存されました。");
      window.location.href = "/";
    } else {
      alert("記事の保存に失敗しました。");
    }
  };

  return (
    <div className="container mx-auto my-12 px-4">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">✏️ 記事を編集</h1>
  
      <div className="max-w-2xl mx-auto mb-6">
        <Link href="/" className="text-blue-600 hover:underline text-base flex items-center gap-1">
          ← 戻る
        </Link>
      </div>
  
      <form
        className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg"
        onSubmit={handleSave}
      >
        {/* タイトル入力欄 */}
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
            placeholder="記事タイトルを入力"
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input type="hidden" value={date} />
        </div>
  
        {/* サムネイル変更チェックボックス */}
        <div className="mb-4 flex items-center space-x-3">
          <input
            type="checkbox"
            id="isThumbnailChange"
            checked={isThumbnailChange}
            onChange={(e) => setIsThumbnailChange(e.target.checked)}
            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 rounded"
          />
          <label htmlFor="isThumbnailChange" className="text-gray-700 text-sm">
            サムネイル画像を変更する
          </label>
        </div>
  
        {/* サムネイル画像アップロード */}
        {isThumbnailChange && (
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
        )}
  
        {/* モード切り替えボタン */}
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
              placeholder="本文をMarkdown形式で編集..."
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
                  img: ({ node, ...props }) => {
                    const src = props.src?.startsWith("https") ? props.src : "blob:" + props.src;
                    return <img src={src} style={{ maxWidth: "50%" }} />;
                  },
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
  
        {/* 保存ボタン */}
        <div className="text-center">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            保存する
          </button>
        </div>
      </form>
    </div>
  );
  
}