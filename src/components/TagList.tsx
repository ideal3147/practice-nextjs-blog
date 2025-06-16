import Link from "next/link";

type TagCount = {
  tag: string;
  count: number;
};

export default function TagList({ tagCounts }: { tagCounts: TagCount[] }) {
  return (
    <aside className="w-full lg:w-72">
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📚 人気のタグ</h2>
        <ul className="space-y-3">
          {tagCounts.map(({ tag, count }) => (
            <li key={tag} className="flex items-center justify-between">
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="bg-blue-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300"
              >
                <span>#{tag}</span>
              </Link>
              <span className="text-sm text-gray-500">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
