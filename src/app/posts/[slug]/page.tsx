import fs from "fs";
import path from "path";
import Link from "next/link";
import React from "react";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { rehype } from "rehype";
import rehypeRaw from "rehype-raw";
import rehypePrism from "rehype-prism-plus";
import rehypeStringify from "rehype-stringify";
import rehypeExternalLinks from "rehype-external-links";
import { PostItem } from "../../lib/types";
import { Metadata, ResolvingMetadata } from "next";
import { getPostData } from "../../lib/functions";

type Props = {
  params: Promise<{ slug: string }>;
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
  const post = await createPostData(params.slug);
  return {
    title: `${post.title} | ブログタイトル`,
    description: `${post.description ?? post.title}`,
  };
}

/**
 * Generates static paths for all blog posts.
 *
 * @returns {Promise<Array<{ path: string, slug: string }>>} A promise that resolves to an array of
 * objects containing the path and slug for each blog post.
 */
export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), "src", "posts");
  const filenames = fs.readdirSync(postsDirectory);
  const posts = await getPostData();
  return posts.map((post: PostItem) => {
    return {
      path: `/posts/${post.slug}`,
      slug: post.slug,
    };
  });
}

/**
 * Creates the post data for a given slug.
 *
 * @param {string} slug - The unique identifier for the blog post.
 * @returns {Promise<PostItem>} A promise that resolves to the post data object.
 */
async function createPostData(slug: string): Promise<PostItem> {
  const filePath = path.join(process.cwd(), "src", "posts", `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(content);

  const contentHtml = processedContent.toString();

  const rehypedContent = await rehype()
    .data("settings", { fragment: true })
    .use(rehypeRaw)
    .use(rehypePrism)
    .use(rehypeExternalLinks, { target: "_blank", rel: ["nofollow"] })
    .use(rehypeStringify)
    .process(contentHtml);

  return {
    slug: slug,
    title: data.title,
    description: data.description,
    date: data.date,
    image: data.image,
    tags: data.tags,
    contentHtml: rehypedContent.value.toString(),
  };
}

/**
 * The component for rendering a blog post page.
 *
 * @param {Props} props - The props for the component.
 * @param {Props.params} props.params - The parameters object containing the slug of the post.
 * @returns {JSX.Element} The component for rendering a blog post page.
 */
export default async function Post(props: Props) {
  const params = await props.params;
  const postData = await createPostData(params.slug);

  return (
    <>
      <div className="prose max-w-none m-8">
        {postData.image && (
          <div className="flex shadow justify-center mb-3">
            <picture>
              <img
                src={`${postData.image}`}
                alt={postData.title}
                width={600}
                height={224}
                className="object-contain max-w-full h-auto"
                style={{ maxHeight: "224px" }}
              />
            </picture>
          </div>
        )}
        <h1 className="h2">{postData?.title}</h1>
        <time>{postData?.date}</time>
        <div className="space-x-2">
          {postData?.tags &&
            postData.tags?.map((category) => (
              <span key={category} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-gray-400 border border-gray-400 inline-flex items-center justify-center">
                <Link href={`/tags/${category}`}>{category}</Link>
              </span>
            ))}
        </div>
        <div className="row">
          <div
            className={"markdown-content prose col-md-12"}
            dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
          ></div>
        </div>
      </div>
    </>
  );
}