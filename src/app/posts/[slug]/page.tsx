import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/utils/timestamp";
import EditButton from "@/components/EditButton";
import DeleteButton from "@/components/DeleteButton";
import BackButton from "@/components/BackButton";
import { createClient as createSupabaseDirectClient} from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function generateStaticParams() {
  const supabase = createSupabaseDirectClient(supabaseUrl, supabaseServiceKey);
  const { data: posts } = await supabase.from("m_articles").select("article_id");
  return posts?.map((post) => ({ slug: post.article_id })) || [];
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Post({ params }: Props) {
  const slug = (await params).slug;
  const supabase = await createClient();

  // MarkdownファイルをSupabase Storageから取得
  const { data: fileData, error: fileError } = await supabase.storage
    .from("md-blog")
    .download(`articles/${slug}.md`);

  if (fileError || !fileData) {
    console.error("Error fetching markdown file:", fileError?.message);
    notFound();
  }

  const fileBuffer = await fileData.arrayBuffer();
  const fileContents = Buffer.from(fileBuffer).toString("utf-8");
  const { data: frontMatterData, content } = matter(fileContents);

  // サムネイル画像取得
  const { data: thumbnailData } = await supabase
    .from("m_articles")
    .select("thumbnail_url")
    .eq("article_id", slug)
    .single();

  const image = thumbnailData?.thumbnail_url ?? null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <BackButton />
        <div className="flex gap-4">
          <EditButton slug={slug} />
          <DeleteButton slug={slug} />
        </div>
      </div>

      {image && (
        <div className="mb-6 rounded-lg shadow overflow-hidden">
          <Image
            width={800}
            height={400}
            src={image}
            
            alt={frontMatterData.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <h1 className="text-4xl font-bold mb-2">{frontMatterData.title}</h1>
      <div className="text-gray-500 mb-4">{formatDate(frontMatterData.date || "")}</div>

      <div className="flex flex-wrap gap-2 mb-6">
        {frontMatterData.tags?.split(",")
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

      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
