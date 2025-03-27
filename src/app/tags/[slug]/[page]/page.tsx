import PostCard from "../../../../components/PostCard";
import { PostItem } from "../../../lib/types";
import { Metadata, ResolvingMetadata } from "next";
import {
  PageData,
  createPageData,
  getPostData,
  getTagsData,
} from "../../../lib/functions";
import Pagination from "../../../../components/Pagination";

type Props = {
  params: { slug: string; page: number };
};

/**
 * Generates metadata for a specific tag and page in the blog.
 *
 * @param {Props} params - The parameters containing the slug (tag) and page number.
 * @param {ResolvingMetadata} parent - The parent metadata being resolved.
 * @returns {Promise<Metadata>} A promise that resolves to the metadata object, including the title and description.
 *
 * The title is formatted as "{tag} - {page}ページ目 | Nemutai".
 * The description is set to the decoded tag value.
 */
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const tag = decodeURIComponent(params.slug);
  const title = `${tag} - ${params.page}ページ目 | Nemutai`;
  return {
    title: title,
    description: `${tag}`,
  };
}

/**
 * Generates static parameters for dynamic routes under `/tags/[slug]/[page]`.
 * 
 * This function processes post data to calculate the number of pages required
 * for each tag based on the number of posts associated with that tag. It then
 * generates an array of route parameters for each tag and page combination.
 * 
 * @async
 * @function
 * @returns {Promise<{ path: string; slug: string; page: string }[]>} An array of objects
 * containing the `path`, `slug`, and `page` for each dynamic route.
 * 
 * Example output:
 * ```typescript
 * [
 *   { path: '/tags/tag1/1', slug: 'tag1', page: '1' },
 *   { path: '/tags/tag1/2', slug: 'tag1', page: '2' },
 *   { path: '/tags/tag2/1', slug: 'tag2', page: '1' },
 *   ...
 * ]
 * ```
 */
export async function generateStaticParams() {
  const tagMaps: Record<string, number> = {};
  const posts = await getPostData();
  posts.forEach((post: PostItem) => {
    if (post.tags) {
      post.tags.forEach((tag: string) => {
        tag = encodeURIComponent(tag);
        if (tagMaps[tag]) {
          tagMaps[tag]++;
        } else {
          tagMaps[tag] = 1;
        }
      });
    }
  });

  let params: { path: string; slug: string; page: string }[] = [];

  for (const key in tagMaps) {
    if (tagMaps.hasOwnProperty(key)) {
      const totalPages = Math.ceil(tagMaps[key] / 1);
      for (let i = 1; i <= totalPages; i++) {
        const routes = {
          path: `/tags/${key}/${i}`,
          slug: `${key}`,
          page: `${i}`,
        };
        params.push(routes);
      }
    }
  }

  return params;
}

/**
 * Retrieves post data for a specific tag and page.
 * 
 * This function fetches the post data for a specific tag and page number
 * and returns the data as an array of PostItem objects.
 * 
 * @param {Props} params - The parameters containing the slug (tag) and page number.
 * @returns {Promise<PostItem[]>} A promise that resolves to an array of PostItem objects.
 */
export default async function TagPage({
  params,
}: {
  params: { slug: string; page: number };
}) {
  const posts = await getTagsData(params.slug);

  const pageData: PageData = createPageData(params.page, posts.length);

  return (
    <>
      <div className="my-8">
        <div className="row">
          {posts.slice(pageData.start, pageData.end).map((post) => (
            <PostCard key={post.title} post={post} />
          ))}
        </div>
        <div className="mb-3">
          <Pagination
            type={`tags/${params.slug}`}
            pages={pageData.pages}
            currentPage={pageData.currentPage}
          />
        </div>
      </div>
    </>
  );
}