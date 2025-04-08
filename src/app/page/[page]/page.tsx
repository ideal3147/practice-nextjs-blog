import PostCard from "../../../components/PostCard";
import Pagination from "../../../components/Pagination";
import { PageData, createPageData, getPostData } from "../../lib/functions";
import { Plus } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ page: number }>;
};

/**
 * Creates the post data for a given slug.
 *
 * @param {string} slug - The unique identifier for the blog post.
 * @returns {Promise<PostItem>} A promise that resolves to the post data object.
 */
export default async function Page(props: { params: Promise<{ page: number }> }) {
  const params = await props.params;
  const posts = await getPostData();

  const pageData: PageData = createPageData(params.page, posts.length);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* タイトル */}
      <Link href="/" className="block mb-6 text-center">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-2">👺Tatsuya's Blog</h1>
      </Link>
      <p className="text-center text-gray-500 text-lg mb-10">技術と日常を綴る個人ブログ</p>

      {/* 投稿一覧（レスポンシブGrid） */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(pageData.start, pageData.end).map((post) => (
          <PostCard key={post.title} post={post} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Pagination
          type="page"
          pages={pageData.pages}
          currentPage={pageData.currentPage}
        />
      </div>
      
      {/* フローティングボタン */}
      <Link
        href="/new-post"
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="新規記事を作成"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
