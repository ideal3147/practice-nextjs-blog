export default function Loading() {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <svg
          className="animate-spin h-8 w-8 text-blue-500 mr-3"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        記事を読み込み中です...
      </div>
    );
  }
  