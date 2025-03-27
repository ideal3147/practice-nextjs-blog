import Link from "next/link";

/**
 * Interface representing the properties for the Pagination component.
 *
 * @property {string} type - The type of pagination (e.g., "numeric", "infinite").
 * @property {number[]} pages - An array of page numbers available for navigation.
 * @property {number} [currentPage] - The currently active page number (optional).
 */
interface PageProps {
  type: string;
  pages: number[];
  currentPage?: number;
}

/**
 * Pagination component for rendering a paginated navigation bar.
 *
 * @param {Object} props - The props object.
 * @param {string} props.type - The type of content being paginated, used to construct the URL.
 * @param {number[]} props.pages - An array representing the total pages available.
 * @param {number} [props.currentPage=1] - The current active page, defaults to 1 if not provided.
 *
 * @returns {JSX.Element} A pagination component with links to navigate between pages.
 *
 * @example
 * <Pagination type="posts" pages={[1, 2, 3, 4, 5]} currentPage={2} />
 *
 * @remarks
 * - The component dynamically calculates the range of pages to display based on the `currentPage` and a fixed `pageLimit`.
 * - It includes "..." for skipped pages and ensures the first and last pages are always accessible.
 * - The `active` class is applied to the current page for styling purposes.
 */
const Pagination = ({ type, pages, currentPage = 1 }: PageProps) => {
  const totalPages = pages.length;
  const pageLimit = 5;

  // 計算した開始ページと終了ページを決定
  let startPage = Math.max(currentPage - Math.floor(pageLimit / 2), 1);
  let endPage = Math.min(startPage + pageLimit - 1, totalPages);

  // ページ数が足りない場合は調整
  if (endPage - startPage + 1 < pageLimit) {
    startPage = Math.max(endPage - pageLimit + 1, 1);
  }

  const paginationRange: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    paginationRange.push(i);
  }

  return (
    <ul className="pagination text-center">
      {startPage > 1 && (
        <>
          <li className="page-item">
            <Link href={`/${type}/1`} className="page-link">
              1
            </Link>
          </li>
          {startPage > 2 && (
            <li className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          )}
        </>
      )}
      {paginationRange.map((page) => (
        <li className="page-item" key={page}>
          <Link
            href={`/${type}/${page}`}
            className={`page-link ${currentPage == page ? "active" : ""}`}
          >
            {page}
          </Link>
        </li>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <li className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          )}
          <li className="page-item">
            <Link href={`/${type}/${totalPages}`} className="page-link">
              {totalPages}
            </Link>
          </li>
        </>
      )}
    </ul>
  );
};

export default Pagination;