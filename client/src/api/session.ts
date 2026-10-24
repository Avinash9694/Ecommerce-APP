import { readStorage, removeStorage, writeStorage } from '@/lib/storage';

const TOKEN_KEY = 'shop.token';

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export const getToken = (): string | null => readStorage(TOKEN_KEY);

export function setToken(token: string | null): void {
  if (token) writeStorage(TOKEN_KEY, token);
  else removeStorage(TOKEN_KEY);
  listeners.forEach((listener) => listener(token));
}

export function onTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
