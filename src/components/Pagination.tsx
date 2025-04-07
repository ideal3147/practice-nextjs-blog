import Link from "next/link";

interface PageProps {
  type: string;
  pages: number[];
  currentPage?: number;
}

const Pagination = ({ type, pages, currentPage = 1 }: PageProps) => {
  const totalPages = pages.length;
  const pageLimit = 5;

  let startPage = Math.max(currentPage - Math.floor(pageLimit / 2), 1);
  let endPage = Math.min(startPage + pageLimit - 1, totalPages);
  if (endPage - startPage + 1 < pageLimit) {
    startPage = Math.max(endPage - pageLimit + 1, 1);
  }

  const paginationRange: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    paginationRange.push(i);
  }

  return (
    <nav className="flex justify-center my-8">
      <ul className="inline-flex items-center space-x-1">
        {startPage > 1 && (
          <>
            <li>
              <Link
                href={`/${type}/1`}
                className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              >
                1
              </Link>
            </li>
            {startPage > 2 && (
              <li>
                <span className="px-3 py-1 text-gray-400">...</span>
              </li>
            )}
          </>
        )}

        {paginationRange.map((page) => (
          <li key={page}>
            <Link
              href={`/${type}/${page}`}
              className={`px-3 py-1 rounded-md border text-sm font-medium transition 
                ${
                  currentPage == page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
            >
              {page}
            </Link>
          </li>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <li>
                <span className="px-3 py-1 text-gray-400">...</span>
              </li>
            )}
            <li>
              <Link
                href={`/${type}/${totalPages}`}
                className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              >
                {totalPages}
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;
