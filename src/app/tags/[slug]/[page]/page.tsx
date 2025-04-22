import PostCard from "../../../../components/PostCard";
import {
  PageData,
  createPageData,
  getTagsData,
} from "../../../lib/functions";
import Pagination from "../../../../components/Pagination";

/**
 * Retrieves post data for a specific tag and page.
 * 
 * This function fetches the post data for a specific tag and page number
 * and returns the data as an array of PostItem objects.
 * 
 * @param {Props} params - The parameters containing the slug (tag) and page number.
 * @returns {Promise<PostItem[]>} A promise that resolves to an array of PostItem objects.
 */
export default async function TagPage(
  props: {
    params: Promise<{ slug: string; page: number }>;
  }
) {
  const params = await props.params;
  const posts = await getTagsData(params.slug);

  const pageData: PageData = createPageData(params.page, posts.length);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* 投稿一覧 */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-12">
        {posts.slice(pageData.start, pageData.end).map((post) => (
          <PostCard key={post.title} post={post} />
        ))}
      </div>
  
      {/* ページネーション */}
      <div className="flex justify-center mt-8">
        <Pagination
          type={`tags/${params.slug}`}
          pages={pageData.pages}
          currentPage={pageData.currentPage}
        />
      </div>
    </div>
  );
}