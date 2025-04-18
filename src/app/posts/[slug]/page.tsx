import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/utils/timestamp";
import EditButton from "@/components/EditButton";
import DeleteButton from "@/components/DeleteButton";
import { headers } from "next/headers";
import BackButton from "@/components/BackButton";


type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * The component for rendering a blog post page.
 *
 * @param {Props} props - The props for the component.
 * @param {Props.params} props.params - The parameters object containing the slug of the post.
 * @returns {JSX.Element} The component for rendering a blog post page.
 */
export default async function Post({ params }: Props) {

  const fetchPostData = async () => {
    try {
      const headersData = headers();
      const protocol = (await headersData).get('x-forwarded-proto') || 'http';
      const host = (await headersData).get('host');
        // 絶対パスで指定してあげる
      const apiBase = `${protocol}://${host}`;
      const response = await fetch(`${apiBase}/api/posts/${(await params).slug}`);
      if (!response.ok) throw new Error("記事データの取得に失敗しました。");
      return await response.json();
    } catch (err) {
      console.error(err);
      notFound();
    }
  };

  const postData = await fetchPostData();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
    <div className="flex justify-between items-center mb-6">
      <BackButton />
      <div className="flex gap-4">
        <EditButton slug={(await params).slug} />
        <DeleteButton slug={(await params).slug} />
      </div>
    </div>

      {postData.image && (
        <div className="mb-6 rounded-lg shadow overflow-hidden">
          <img
            src={postData.image}
            alt={postData.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <h1 className="text-4xl font-bold mb-2">{postData.title}</h1>
      <div className="text-gray-500 mb-4">{formatDate(postData.date || "")}</div>

      <div className="flex flex-wrap gap-2 mb-6">
        {postData.tags?.split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag !== "")
        .map((tag: string) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: postData?.contentHtml || "" }}
      ></div>
    </div>
  );
}
