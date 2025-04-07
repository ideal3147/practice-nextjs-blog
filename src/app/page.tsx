import PostCard from "../components/PostCard";
import Pagination from "../components/Pagination";
import { PageData, createPageData, getPostData } from "./lib/functions";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function Home() {
  const posts = await getPostData();
  const pageData: PageData = createPageData(1, posts.length);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10">🚧Tatsuya's Blog</h1>

      <div className="flex flex-col gap-6">
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
