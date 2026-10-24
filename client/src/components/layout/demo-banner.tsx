import { useState } from 'react';
import { isDemoMode } from '@/api';
import { readStorage, writeStorage } from '@/lib/storage';
import { CloseIcon, InfoIcon } from '@/components/ui/icons';

const DISMISS_KEY = 'shop.demo-banner-dismissed';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(() => readStorage(DISMISS_KEY) === '1');
  if (!isDemoMode || dismissed) return null;

  return (
    <div className="border-b border-line bg-info-soft text-info" role="status">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <InfoIcon size={16} className="shrink-0" />
        <p className="flex-1">
          <span className="font-medium">Demo mode:</span> data is stored in your browser.
          <span className="hidden sm:inline">
            {' '}
            Sign in with <code className="font-mono text-xs">demo@shop.test / demo1234</code> or the
            admin account on the sign-in page.
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            writeStorage(DISMISS_KEY, '1');
            setDismissed(true);
          }}
          className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-surface/40"
          aria-label="Dismiss demo mode notice"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}
