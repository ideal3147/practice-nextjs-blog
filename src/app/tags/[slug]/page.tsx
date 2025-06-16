import PostCard from "../../../components/PostCard";
import { PageData, createPageData, getTagsData, getTagCounts } from "../../lib/functions";
import Pagination from "../../../components/Pagination";
import TagList from "../../../components/TagList";
import Link from "next/link";
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
  const tagCounts = await getTagCounts();
  const posts = await getTagsData(params.slug);

  const pageData: PageData = createPageData(
    1,
    posts.length
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

    <div className="flex justify-end items-center gap-4 mb-6">
      <UserAvatar/>
      <SignInOrOutButton /> 
    </div>
    
      {/* タイトル */}
      <Link href="/" className="block mb-6 text-center">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-2">🦓Avocado.dev</h1>
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
        <TagList tagCounts={tagCounts} />
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