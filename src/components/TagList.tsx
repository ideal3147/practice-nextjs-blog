import Tag from './Tag';

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
              <Tag name={tag} clickable />
              <span className="text-sm text-gray-500">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
