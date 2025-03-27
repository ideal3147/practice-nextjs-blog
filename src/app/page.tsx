import PostCard from "../components/PostCard";
import Pagination from "../components/Pagination";
import { PageData, createPageData, getPostData } from "./lib/functions";
import Link from "next/link";

export default async function Home() {
  const posts = await getPostData();

  const pageData: PageData = createPageData(1, posts.length);

  return (
    <div className="container">
      <h1 className="text-4xl font-bold text-center my-8">Tatsuya's Blog</h1>
      <div className="flex flex-col align-top min-h-screen w-1/2 justify-center align-center mx-auto">
        {posts.slice(pageData.start, pageData.end).map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
      <div className="mb-3">
        <Pagination
          type="page"
          pages={pageData.pages}
          currentPage={pageData.currentPage}
        />
      </div>

      <Link href="/new-post" className="fixed bottom-15 right-10 bg-blue-500 text-white px-6 py-4 rounded-full shadow-lg hover:bg-blue-600 text-xl">
          +
      </Link>
    </div>
  );
}