"use client";

import { useEffect, useState } from "react";
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
  // const postData = await createPostData(params.slug);

  const [postData, setPostData] = useState<PostData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return <div className="text-red-500">エラー: {error}</div>;
  }

  if (!postData) {
    return <div>読み込み中...</div>;
  }

  return (
    <>
      <div className="max-w-none">
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