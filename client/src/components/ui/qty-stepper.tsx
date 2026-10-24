import { MinusIcon, PlusIcon } from './icons';
import { cn } from '@/lib/cn';

interface QtyStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function QtyStepper({
  value,
  min = 1,
  max,
  onChange,
  label = 'Quantity',
  size = 'md',
  disabled,
}: QtyStepperProps) {
  const dim = size === 'sm' ? 'h-9' : 'h-11';
  const btn = cn(
    'flex items-center justify-center text-ink-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent',
    size === 'sm' ? 'w-9' : 'w-11',
  );
  return (
    <div
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-xl border border-line-strong bg-surface',
        dim,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <MinusIcon size={16} />
      </button>
      <output
        className="flex min-w-10 items-center justify-center px-1 text-sm font-medium tabular-nums"
        aria-live="polite"
      >
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
