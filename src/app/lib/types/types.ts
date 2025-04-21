/**
 * Represents an individual blog post item.
 * 
 * @property {string} slug - The unique identifier for the post, typically used in URLs.
 * @property {string} title - The title of the blog post.
 * @property {string} [description] - An optional short description or summary of the post.
 * @property {string} date - The publication date of the post in ISO 8601 format.
 * @property {string | null} image - The URL of the post's featured image, or `null` if no image is provided.
 * @property {string[] | null} tags - An array of tags associated with the post, or `null` if no tags are provided.
 * @property {string} contentHtml - The HTML content of the blog post.
 */
export type PostItem = {
  slug: string;
  title: string;
  description?: string;
  date: string;
  image: string | null;
  tags: string[] | null;
  contentHtml: string;
};

/**
 * Represents pagination information for a collection of items.
 * 
 * @property {number} currentPage - The current page number being viewed.
 * @property {number} totalPages - The total number of pages available.
 * @property {number} start - The index of the first item on the current page.
 * @property {number} end - The index of the last item on the current page.
 * @property {number[]} pages - An array of page numbers available for navigation.
 */
export type PageData = {
  currentPage: number;
  totalPages: number;
  start: number;
  end: number;
  pages: number[];
};


/**
 * Props for the BackButton component.
 *
 * @property {string} [href] - Optional URL to navigate to when the back button is clicked.
 */
export type BackButtonProps = {
  href?: string;
};