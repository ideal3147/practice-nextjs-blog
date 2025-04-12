import PostCard from "../../../components/PostCard";
import { PageData, createPageData, getTagsData } from "../../lib/functions";
import Pagination from "../../../components/Pagination";
import Link from "next/link";
import { Plus } from "lucide-react";
import SignInOrOutButton from "@/components/SignInOrOutButton";
import UserAvatar from "@/components/UserAvatar";
import NewPostButton from "@/components/NewPostButton";

/**
 * Asynchronous React component that renders a tag-specific page displaying a list of posts
 * and pagination controls.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.params - The route parameters.
 * @param {string} props.params.slug - The slug of the tag used to filter posts.
 * @returns {Promise<JSX.Element>} A JSX element containing the tag page layout.
 *
 * @async
 */
export default async function TagPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const posts = await getTagsData(params.slug);

  const pageData: PageData = createPageData(
    1,
    posts.length
  );

  return (
    <div className="container mx-auto px-4 py-12">

      <UserAvatar/>
      <SignInOrOutButton /> 
      
      {/* タイトル */}
      <Link href="/" className="block mb-6 text-center">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-2">🦓Tatsuya's Blog</h1>
      </Link>
      <p className="text-center text-gray-500 text-lg mb-10">技術と日常を綴る個人ブログ</p>

      {/* 投稿一覧（レスポンシブGrid） */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(pageData.start, pageData.end).map((post) => (
          <PostCard key={post.title} post={post} />
        ))}
      </div>

      {/* ページネーション */}
      <div className="flex justify-center mt-12">
        <Pagination
          type={`tags/${params.slug}`}
          pages={pageData.pages}
          currentPage={pageData.currentPage}
        />
      </div>

      <NewPostButton/>
    </div>
  );
}