import { StarIcon } from './icons';

export function RatingStars({
  average,
  count,
  size = 14,
}: {
  average: number;
  count?: number;
  size?: number;
}) {
  const rounded = Math.round(average);
  return (
    <div
      className="flex items-center gap-1.5 text-sm text-ink-muted"
      aria-label={`Rated ${average.toFixed(1)} out of 5`}
    >
      <span className="flex text-warning" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} size={size} filled={i < rounded} />
        ))}
      </span>
      <span className="tabular-nums">{average.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-ink-subtle">({count.toLocaleString('en-IN')})</span>
      )}
    </div>
  );
}
