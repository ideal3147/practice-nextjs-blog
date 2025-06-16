import { POSTS_PER_PAGE } from "./constants";
import { PageData, PostItem } from "./types/types";
import { createClient } from "@/utils/supabase/server";

/**
 * Asynchronously retrieves and processes post data from markdown files located in the "src/posts" directory.
 * 
 * Each markdown file is expected to contain frontmatter metadata (e.g., title, description, date, image, tags).
 * The function reads the files, extracts the metadata, and returns an array of post items sorted by date in descending order.
 * 
 * @returns {Promise<PostItem[]>} A promise that resolves to an array of post items, each containing:
 * - `slug`: The filename without the `.md` extension.
 * - `title`: The title of the post from the frontmatter.
 * - `description`: The description of the post from the frontmatter.
 * - `date`: The date of the post from the frontmatter.
 * - `image`: The image URL of the post from the frontmatter.
 * - `tags`: An array of tags associated with the post (default is an empty array if not provided).
 * - `contentHtml`: An empty string (to be populated later if needed).
 * 
 * @throws Will throw an error if the "src/posts" directory or any of its files cannot be read.
 */
const getPostData = async (): Promise<PostItem[]> => {

  // supabase DBからファイルを取得する
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("m_articles")
    .select(
      "article_id, title, thumbnail_url, file_url, tags, created_at"
    );

  if (error) {
    console.error("Error fetching data from Supabase:", error.message);
    return [];
  } 
    const posts = await Promise.all(
      data?.map(async (mdFileInfo) => {

        return {
          slug: mdFileInfo.article_id,
          title: mdFileInfo.title,
          description: "",
          date: mdFileInfo.created_at,
          image: mdFileInfo.thumbnail_url,
          tags: mdFileInfo.tags?.map((tag: string) => tag.trim()).filter((tag: string) => tag !== "") || null,
          contentHtml: "",
        };
      }) || []
    );
  return posts;
};

/**
 * Retrieves and filters posts based on a given tag (slug) and sorts them by date in descending order.
 *
 * @param slug - The tag used to filter posts. It is expected to be a URI-encoded string.
 * @returns A promise that resolves to an array of `PostItem` objects that match the given tag, sorted by date in descending order.
 */
async function getTagsData(slug: string): Promise<PostItem[]> {
  const posts = await getPostData();

  return posts
    .filter((post) => post.tags?.includes(decodeURIComponent(slug)))
    .sort((postA, postB) =>
      new Date(postA.date) > new Date(postB.date) ? -1 : 1
    );
}

/**
 * Creates pagination data for a given page.
 *
 * @param {number} currentPage - The current page number.
 * @param {number} totalPostCount - The total number of posts.
 * @returns {PageData} An object containing pagination details such as current page, total pages, start index, end index, and an array of page numbers.
 */
const createPageData = (
  currentPage: number,
  totalPostCount: number
): PageData => {
  const page = currentPage;
  const totalPages = Math.ceil(totalPostCount / POSTS_PER_PAGE);
  const start = (page - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const pages = Array(totalPages).fill(0).map((_, i) => i + 1);

  return {
    currentPage: currentPage,
    totalPages: totalPages,
    start: start,
    end: end,
    pages: pages,
  };
};

async function getTagCounts() {
  const supabase = await createClient(); // 必要なら自分の createClient 関数を使用

  const { data, error } = await supabase.
  from('m_articles')
  .select('tags');

  if (error) {
    console.error("タグの取得に失敗:", error);
    return [];
  }

  const tagMap: Record<string, number> = {};

  for (const row of data) {
    const tags = row.tags || [];
    for (const tag of tags) {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    }
  }

  return Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1]) // 出現回数で降順ソート
    .map(([tag, count]) => ({ tag, count }));
}

export { getPostData, getTagsData, createPageData, getTagCounts };
export type { PageData };