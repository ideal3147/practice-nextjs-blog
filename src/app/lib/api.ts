import fs from "fs";
import path from "path";
import matter from "gray-matter";

type Post = {
  slug: string;
  content: string;
  title: string;
  date: string;
};

const postsDirectory = path.join(process.cwd(), "content");

/**
 * Retrieves the slugs of all posts by reading the directories within the posts directory.
 *
 * @returns {string[]} An array of strings representing the names of directories (post slugs).
 *
 * @throws Will throw an error if the `fs.readdirSync` operation fails or if `postsDirectory` is not defined.
 */
export function getPostSlugs() {
  const allDirents = fs.readdirSync(postsDirectory, { withFileTypes: true });
  return allDirents
    .filter((dirent) => dirent.isDirectory())
    .map(({ name }) => name);
}

/**
 * Retrieves a post by its slug and returns the specified fields.
 *
 * @param slug - The unique identifier for the post, typically part of its file path.
 * @param fields - An array of field names to include in the returned post object.
 *                 Supported fields are "slug", "content", "title", and "date".
 *                 If no fields are specified, an empty object is returned.
 * @returns An object containing the requested fields of the post.
 *
 * @example
 * // Retrieve the title and content of a post
 * const post = getPostBySlug("my-post", ["title", "content"]);
 * console.log(post.title); // Outputs the title of the post
 * console.log(post.content); // Outputs the content of the post
 */
export function getPostBySlug(slug: string, fields: string[] = []) {
  const fullPath = path.join(postsDirectory, slug, "index.md");
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const items: Post = {
    slug: "",
    content: "",
    title: "",
    date: "",
  };

  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = slug;
    }
    if (field === "content") {
      items[field] = content;
    }
    if (field === "title" || field === "date") {
      items[field] = data[field];
    }
  });
  return items;
}

/**
 * Retrieves all posts with the specified fields, sorted by date in descending order.
 *
 * @param fields - An array of strings specifying the fields to include for each post.
 *                 If no fields are provided, all fields will be included.
 * @returns An array of posts, each containing the specified fields, sorted by date
 *          from newest to oldest.
 */
export function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
  return posts;
}