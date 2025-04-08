import Link from "next/link";
import { PostItem } from "../app/lib/types/types";

const PostCard = ({ post }: { post: PostItem }) => {
  return (
    <div className="transition transform hover:scale-[1.02] duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg overflow-hidden flex flex-col h-full">
        {/* 記事全体へのリンク部分 */}
        <Link href={`/posts/${post.slug}`}>
          <div>
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
            )}

            <div className="p-4 flex flex-col justify-between flex-grow">
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                {post.title}
              </h2>

              <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-1 rounded-full self-start mb-2">
                {post.date}
              </span>
            </div>
          </div>
        </Link>

        {/* タグリンク部分 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {post.tags.map((tag: string, index: number) => (
              <Link
                key={index}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>

  );
};

export default PostCard;
