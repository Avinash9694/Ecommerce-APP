import type { ReactNode } from 'react';
import { useToastStore } from '@/store/toast-store';
import type { ToastVariant } from '@/store/toast-store';
import { cn } from '@/lib/cn';
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from './icons';

const styles: Record<ToastVariant, { ring: string; icon: ReactNode }> = {
  success: { ring: 'bg-accent-soft text-accent-soft-fg', icon: <CheckIcon size={16} /> },
  error: { ring: 'bg-danger-soft text-danger', icon: <AlertIcon size={16} /> },
  info: { ring: 'bg-info-soft text-info', icon: <InfoIcon size={16} /> },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface p-3 shadow-pop animate-rise',
          )}
        >
          <span
            className={cn(
              'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
              styles[t.variant].ring,
            )}
          >
            {styles[t.variant].icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Dismiss notification"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
