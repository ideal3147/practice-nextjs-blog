import PostCard from "../../../components/PostCard";
import { PostItem } from "../../lib/types";
import { Metadata, ResolvingMetadata } from "next";
import { PageData, createPageData, getPostData, getTagsData } from "../../lib/functions";
import Pagination from "../../../components/Pagination";

type Props = {
  params: { slug: string }
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
export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
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
export default async function TagPage({ params }: { params: { slug: string } }) {
  const posts = await getTagsData(params.slug);

  const pageData: PageData = createPageData(
    1,
    posts.length
  );

  return (
    <>
      <div className="my-8">
        <div className="row">
          {posts.slice(pageData.start, pageData.end).map((post) => (
            <PostCard key={post.title} post={post} />
          ))}
        </div>
        <div className='mb-3'>
          <Pagination type={`tags/${params.slug}`} pages={pageData.pages} currentPage={pageData.currentPage} />
        </div>
      </div>
    </>
  );
}