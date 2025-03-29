import PostCard from "../../../components/PostCard";
import Pagination from "../../../components/Pagination";
import { Metadata, ResolvingMetadata } from "next";
import { POSTS_PER_PAGE } from "../../lib/constants";
import { PageData, createPageData, getPostData } from "../../lib/functions";

type Props = {
  params: Promise<{ page: number }>;
};

/**
 * Generates metadata for a blog post page based on the provided slug.
 *
 * @param {Object} params - The parameters object containing the slug of the post.
 * @param {string} params.slug - The unique identifier for the blog post.
 * @param {ResolvingMetadata} parent - The parent metadata object being resolved.
 * @returns {Promise<Metadata>} A promise that resolves to the metadata object
 * including the title and description for the blog post.
 */
export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  const title = `${params.page}ページ目`;
  return {
    title: `${title} | ブログタイトル`,
    description: `${title}`,
  };
}

/**
 * Generates static paths for all blog posts.
 *
 * @returns {Promise<Array<{ path: string, slug: string }>>} A promise that resolves to an array of
 * objects containing the path and slug for each blog post.
 */
export async function generateStaticParams() {
  const posts = await getPostData();

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  const pages = Array.from({ length: totalPages }, (_, i) => {
    return {
      path: `/page/${i + 1}`,
      page: `${i + 1}`,
    };
  });

  return pages;
}

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
    <div className="container">
      <div className="row">
        {posts.slice(pageData.start, pageData.end).map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
      <div className="mb-3">
        <Pagination
          type="page"
          pages={pageData.pages}
          currentPage={pageData.currentPage}
        />
      </div>
    </div>
  );
}