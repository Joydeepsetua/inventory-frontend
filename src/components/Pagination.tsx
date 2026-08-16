import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import type { Pagination as PaginationMeta } from "../types/api";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  pagination,
  onPageChange,
}: PaginationProps) {
  const { total, current_page, total_pages, limit } = pagination;

  if (!total) return null;

  const first = (current_page - 1) * limit + 1;
  const last = Math.min(current_page * limit, total);

  const buttonClass =
    "flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{first}</span>–
        <span className="font-medium text-slate-700">{last}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
          className={buttonClass}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Previous
        </button>

        <span className="text-sm text-slate-500">
          {current_page} / {total_pages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= total_pages}
          className={buttonClass}
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
