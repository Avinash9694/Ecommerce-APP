import { Button } from './button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        leadingIcon={<ChevronLeftIcon size={16} />}
      >
        Previous
      </Button>
      <span className="text-sm text-ink-muted tabular-nums" aria-current="page">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
        <ChevronRightIcon size={16} />
      </Button>
    </nav>
  );
}
