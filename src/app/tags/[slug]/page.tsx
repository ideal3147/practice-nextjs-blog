import PostCard from "../../../components/PostCard";
import { PostItem } from "../../lib/types/types";
import { Metadata, ResolvingMetadata } from "next";
import { PageData, createPageData, getPostData, getTagsData } from "../../lib/functions";
import Pagination from "../../../components/Pagination";
import Link from "next/link";
import { Plus } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>
}

/**
 * Generates metadata for a tag-specific page.
 *
 * @param {Object} params - The parameters object containing route parameters.
 * @param {Object} params.params - The route parameters.
 * @param {string} params.params.slug - The slug of the tag, URL-encoded.
 * @param {ResolvingMetadata} parent - The parent metadata object for resolving nested metadata.
 * @returns {Promise<Metadata>} A promise that resolves to the metadata object for the page.
 *
 * The metadata includes:
 * - `title`: A string combining the decoded tag and a fixed blog title.
 * - `description`: A string containing the decoded tag.
 */
export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  const tag = decodeURIComponent(params.slug);
  return {
    title: `${tag} | ブログタイトル`,
    description: `${tag}`,
  }
}

/**
 * Generates static parameters for dynamic routes under the `/tags/[slug]` path.
 * 
 * This function retrieves all unique tags from the post data, encodes them to ensure
 * they are URL-safe, and maps them to an array of parameter objects. Each parameter
 * object contains the `slug` for the tag and the corresponding path.
 * 
 * @async
 * @function generateStaticParams
 * @returns {Promise<Array<{ path: string; slug: string }>>} A promise that resolves to an array of objects,
 * each containing the `path` and `slug` for a tag.
 */
export async function generateStaticParams() {
  const allTags = new Set<string>();

  const posts = await getPostData();
  posts.forEach((post: PostItem) => {
    if (post.tags) {
      post.tags.forEach((tag: string) => {
        return allTags.add(encodeURIComponent(tag));
      });
    }
  });

  const params = Array.from(allTags).map((tag) => {
    return {
      path: `/tags/${tag}`,
      slug: tag,
    };
  });

  return params;
}

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
      {/* タイトル */}
      <h1 className="text-5xl font-bold text-center text-gray-800 mb-2">Tatsuya's Blog</h1>
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

      {/* 新規投稿ボタン（右下固定） */}
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