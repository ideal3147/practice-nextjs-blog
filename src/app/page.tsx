import PostCard from "../components/PostCard";
import Pagination from "../components/Pagination";
import { PageData, createPageData, getPostData } from "./lib/functions";

export default async function Home() {
  const posts = await getPostData();

  const pageData: PageData = createPageData(1, posts.length);

  return (
    <div className="container">
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
    </div>
  );
}