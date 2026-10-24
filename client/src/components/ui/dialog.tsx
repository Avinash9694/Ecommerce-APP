import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { CloseIcon } from './icons';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** `sheet` slides from the bottom on small screens; `panel` slides from the right. */
  variant?: 'center' | 'sheet' | 'panel';
  footer?: ReactNode;
  widthClassName?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  variant = 'center',
  footer,
  widthClassName,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const firstEl = focusable[0] as HTMLElement;
      const lastEl = focusable[focusable.length - 1] as HTMLElement;
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const placement = {
    center: 'items-end sm:items-center justify-center p-0 sm:p-4',
    sheet: 'items-end justify-center',
    panel: 'items-stretch justify-end',
  }[variant];

  const panelClass = {
    center: cn(
      'w-full rounded-t-2xl sm:rounded-2xl max-h-[92dvh] animate-slide-up',
      widthClassName ?? 'sm:max-w-lg',
    ),
    sheet: cn(
      'w-full rounded-t-2xl max-h-[88dvh] animate-slide-up',
      widthClassName ?? 'sm:max-w-lg',
    ),
    panel: cn('h-full w-full animate-slide-in-right', widthClassName ?? 'sm:max-w-md'),
  }[variant];

  return (
    <div className={cn('fixed inset-0 z-[60] flex', placement)}>
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex flex-col overflow-hidden bg-surface shadow-pop outline-none',
          panelClass,
        )}
      >
        <header className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p id="dialog-description" className="mt-0.5 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-line px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
}
