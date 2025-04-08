'use client';

import { PostItem } from '@/app/lib/types/types';
import { useRouter } from 'next/navigation';

export default function PostCard({ post }: { post: PostItem }) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/posts/${post.slug}`);
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tags/${encodeURIComponent(tag)}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-transform transform hover:scale-[1.02] duration-200 flex flex-col h-full"
    >
      {/* サムネイル */}
      {post.image ? (
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No Image
        </div>
      )}

      {/* 本文 */}
      <div className="p-4 flex flex-col justify-between flex-grow">
        {/* タイトル */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
          {post.title}
        </h2>

        {/* 投稿日 */}
        <span className="inline-block text-xs text-gray-500 mb-3">
          {post.date}
        </span>

        {/* タグ */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {post.tags.map((tag, idx) => (
              <div
                key={idx}
                onClick={(e) => handleTagClick(e, tag)}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition cursor-pointer"
              >
                #{tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
