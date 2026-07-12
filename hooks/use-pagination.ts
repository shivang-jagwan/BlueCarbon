'use client';

import * as React from 'react';

export function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [items.length]);

  return {
    page: safePage,
    totalPages,
    pageSize,
    totalItems: items.length,
    paginatedItems,
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
  };
}
