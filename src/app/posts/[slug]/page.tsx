"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


type Props = {
  params: Promise<{ slug: string }>;
};

type PostData = {
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string;
  tags: string;
  contentHtml: string;
};

/**
 * The component for rendering a blog post page.
 *
 * @param {Props} props - The props for the component.
 * @param {Props.params} props.params - The parameters object containing the slug of the post.
 * @returns {JSX.Element} The component for rendering a blog post page.
 */
export default function Post({ params }: Props) {
  const [postData, setPostData] = useState<PostData | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/posts/${(await params).slug}`);
        if (!response.ok) throw new Error("記事データの取得に失敗しました。");
        const data = await response.json();
        setPostData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "予期しないエラーが発生しました。");
      }
    };

    fetchPostData();
  }, []);

  const handleEdit = async () => {
    router.push(`/posts/${(await params).slug}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm("本当に削除してよろしいですか？")) return;
    setIsDeleting(true);
    const response = await fetch(`/api/posts/${(await params).slug}`, { method: "DELETE" });

    if (response.ok) {
      alert("記事が削除されました。");
      router.push("/");
    } else {
      alert("記事の削除に失敗しました。");
    }
    setIsDeleting(false);
  };

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!postData) return <div className="text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-end gap-4 mb-6">
        <button
          onClick={handleEdit}
          className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition"
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          {isDeleting ? "削除中..." : "削除"}
        </button>
      </div>

      {postData.image && (
        <div className="mb-6 rounded-lg shadow overflow-hidden">
          <img
            src={postData.image}
            alt={postData.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <h1 className="text-4xl font-bold mb-2">{postData.title}</h1>
      <div className="text-gray-500 mb-4">{postData.date}</div>

      <div className="flex flex-wrap gap-2 mb-6">
        {postData.tags?.split(",")
        .map(tag => tag.trim())
        .filter(tag => tag !== "")
        .map((tag) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
      ></div>
    </div>
  );
}
