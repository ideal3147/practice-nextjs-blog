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
      <h1 className="text-3xl font-bold mb-6 text-center">👺Tatsuya' Blog</h1>

      <div className="grid grid-cols-1 gap-6">
        {posts.slice(pageData.start, pageData.end).map((post) => (
          <div
            key={post.slug}
            className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 transition hover:shadow-lg"
          >
            <PostCard post={post} />
          </div>
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
