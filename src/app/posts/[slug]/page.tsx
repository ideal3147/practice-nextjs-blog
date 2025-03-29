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
  tags: string[];
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
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/posts/${(await params).slug}`);
        if (!response.ok) {
          throw new Error("記事データの取得に失敗しました。");
        }
        const data = await response.json();
        setPostData(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("予期しないエラーが発生しました。");
        }
      }
    };

    fetchPostData();
  }, []);

  const handleDelete = async () => {
    const confirmed = window.confirm("本当に削除してよろしいですか？");
    if (!confirmed) return;

    setIsDeleting(true);

    const response = await fetch(`/api/posts/${(await params).slug}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("記事が削除されました。");
      router.push("/"); // ウェルカムページにリダイレクト
    } else {
      alert("記事の削除に失敗しました。");
    }

    setIsDeleting(false);
  };

  if (error) {
    return <div className="text-red-500">エラー: {error}</div>;
  }

  if (!postData) {
    return <div>読み込み中...</div>;
  }

  return (
    <>
      <div className="max-w-none">

        <div className="flex justify-end mb-4">
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={isDeleting}
          >
            {isDeleting ? "削除中..." : "削除"}
          </button>
        </div>
        
        {postData.image && (
          <div className="flex border justify-center mb-3">
            <picture>
              <img
                src={`${postData.image}`}
                alt={postData.title}
                width={600}
                height={224}
                className="object-contain max-w-full h-auto"
                style={{ maxHeight: "224px" }}
              />
            </picture>
          </div>
        )}
        <h1 className="h2">{postData?.title}</h1>
        <time>{postData?.date}</time>
        <div className="space-x-2">
          {postData?.tags &&
            postData.tags?.map((category) => (
              <span key={category} className="badge bg-secondary">
                <Link href={`/tags/${category}`}>{category}</Link>
              </span>
            ))}
        </div>
        <div className="row">
          <div
            className={"markdown-content prose col-md-12"}
            dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
          ></div>
        </div>
      </div>
    </>
  );
}