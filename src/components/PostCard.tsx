import Link from "next/link";
import { PostItem } from "../app/lib/types/types";

/**
 * A React component that renders a card for a blog post.
 * The card includes an optional image, the post title, and the post date.
 * It links to the detailed post page using the post's slug.
 *
 * @component
 * @param {Object} props - The props object.
 * @param {PostItem} props.post - The post data to display in the card.
 * @param {string} props.post.slug - The unique identifier for the post, used in the URL.
 * @param {string} props.post.title - The title of the post.
 * @param {string} props.post.date - The publication date of the post.
 * @param {string} [props.post.image] - The optional image URL for the post.
 *
 * @returns {JSX.Element} A clickable card component displaying the post details.
 */
const PostCard = ({ post }: { post: PostItem }) => {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="align-self-baseline col-lg-4 d-flex flex-column justify-content-between scale-95 hover:scale-100 ease-in duration-100"
    >
      {post.image && (
        <div className="rounded mx-auto shadow">
          <picture>
            <img
              src={`${post.image}`}
              width={600}
              height={300}
              alt={post.title}
              className="object-contain img-fluid img-thumbnail"
              style={{ maxWidth: "100%", height: "224px" }}
            />
          </picture>
          <div className="px-2 py-3 mt-auto mx-auto">
            <h2 className="font-bold text-lg">{post.title}</h2>
            <span className="badge bg-secondary text-white">{post.date}</span>
          </div>
        </div>
      )}
      {!post.image && (
        <div className="px-2 py-3 mt-auto mx-auto shadow rounded">
          <h2 className="font-bold text-lg">{post.title}</h2>
          <span className="badge bg-secondary text-white">{post.date}</span>
        </div>
      )}
    </Link>
  );
};

export default PostCard;