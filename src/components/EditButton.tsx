import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

interface Props {
  slug: string;
}

export default async function EditButton({ slug }: Props) {
  const supabase = createClient();
  const { data } = await (await supabase).auth.getUser();

  if (!data.user) return null;

  return (
    <Link
      href={`/posts/${slug}/edit`}
      className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition"
    >
      編集
    </Link>
  );
}
