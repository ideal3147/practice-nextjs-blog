'use client';

import Link from 'next/link';

type TagProps = {
  name: string;
  clickable?: boolean; // true: リンクとして動作、false: onClickで動作（例: PostCard）
  onClick?: (e: React.MouseEvent, tag: string) => void;
};

export default function Tag({ name, clickable = true, onClick }: TagProps) {
  const TagContent = (
    <div
      onClick={(e) => !clickable && onClick?.(e, name)}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
        clickable
          ? 'bg-blue-100 text-gray-700 hover:bg-blue-200'
          : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
      }`}
    >
      <span>#{name}</span>
    </div>
  );

  return clickable ? <Link href={`/tags/${name}`}>{TagContent}</Link> : TagContent;
}
