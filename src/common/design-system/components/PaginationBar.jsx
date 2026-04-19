import './PaginationBar.css';

function buildPages(current, total, delta = 2) {
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }
  const pages = [1];
  if (range[0] > 2) pages.push('...');
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push('...');
  if (total > 1) pages.push(total);
  return pages;
}

export function PaginationBar({ page, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null;
  const pages = buildPages(page, totalPages);

  return (
    <nav aria-label="Pagination" className={['claude-pagination', className].filter(Boolean).join(' ')}>
      <button
        className={`claude-pagination__item${page <= 1 ? ' claude-pagination__item--disabled' : ''}`}
        onClick={() => onPageChange?.(page - 1)}
        aria-label="Previous page"
        disabled={page <= 1}
      >
        ←
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="claude-pagination__ellipsis" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            className={`claude-pagination__item${p === page ? ' claude-pagination__item--active' : ''}`}
            onClick={() => p !== page && onPageChange?.(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        )
      )}
      <button
        className={`claude-pagination__item${page >= totalPages ? ' claude-pagination__item--disabled' : ''}`}
        onClick={() => onPageChange?.(page + 1)}
        aria-label="Next page"
        disabled={page >= totalPages}
      >
        →
      </button>
    </nav>
  );
}
