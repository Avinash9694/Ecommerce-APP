import type { ApiClient } from './types';
import { createHttpClient } from './http-client';
import { createDemoClient } from './demo/demo-client';
import type { DemoApiClient } from './demo/demo-client';

// The only place that decides which backend the app talks to.
const apiOrigin = import.meta.env.VITE_API_URL?.trim();

export const api: ApiClient = apiOrigin ? createHttpClient(apiOrigin) : createDemoClient();

export const isDemoMode = api.mode === 'demo';

export function resetDemoData(): void {
  if (isDemoMode) (api as DemoApiClient).reset();
}

export { DEMO_ACCOUNTS } from './demo/demo-store';
export * from './types';
