"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./ui/button";
import styles from "./Pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={styles.pagination}>
      <div className={styles.info}>
        <span className={styles.showing}>
          Showing {startItem}-{endItem} of {totalCount}
        </span>
        {onPageSizeChange && (
          <div className={styles.pageSize}>
            <span>per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={styles.pageSizeSelect}
              disabled={loading}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious || loading}
          className={styles.navButton}
        >
          <ChevronsLeft size={16} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious || loading}
          className={styles.navButton}
        >
          <ChevronLeft size={16} />
        </Button>

        <div className={styles.pages}>
          {getPageNumbers().map((page, index) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`${styles.pageButton} ${
                  page === currentPage ? styles.active : ""
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext || loading}
          className={styles.navButton}
        >
          <ChevronRight size={16} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext || loading}
          className={styles.navButton}
        >
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  );
}
