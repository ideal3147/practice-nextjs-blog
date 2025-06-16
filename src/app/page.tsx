import PostCard from "../components/PostCard";
import Pagination from "../components/Pagination";
import { PageData, createPageData, getPostData, getTagCounts } from "./lib/functions";
import Link from "next/link";
import SignInOrOutButton from "@/components/SignInOrOutButton";
import UserAvatar from "@/components/UserAvatar";
import NewPostButton from "@/components/NewPostButton";

export default async function Home() {
  const posts = await getPostData();
  const tagCounts = await getTagCounts();
  const pageData: PageData = createPageData(1, posts.length);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

    <div className="flex justify-end items-center gap-4 mb-6">
      <UserAvatar/>
      <SignInOrOutButton /> 
    </div>

      {/* タイトル */}
      <Link href="/" className="block mb-6 text-center">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-2">🚧Avocado.dev</h1>
      </Link>
      <p className="text-center text-gray-500 text-lg mb-10">技術と日常を綴る個人ブログ</p>

      {/* コンテンツ */}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* 投稿一覧 */}
        <div className="flex-1 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {posts.slice(pageData.start, pageData.end).map((post) => (
          <div key={post.title} className="rounded-lg shadow-md overflow-hidden h-[375px] flex flex-col">
            <PostCard post={post} />
          </div>
        ))}
        </div>

        {/* タグ一覧（サイドバー） */}
        <aside className="w-full lg:w-72">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📚 人気のタグ</h2>
            <ul className="space-y-3">
              {tagCounts.map(({ tag, count }) => (
                <li key={tag} className="flex items-center justify-between">
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="bg-blue-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300"
                >
                  <span>#{tag}</span>
                </Link>
                <span className="text-sm text-gray-500">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-10 flex justify-center">
        <Pagination
          type="page"
          pages={pageData.pages}
          currentPage={pageData.currentPage}
        />
      </div>

     <NewPostButton />
    </div>
  );
}
