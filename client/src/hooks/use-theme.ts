import { useCallback, useEffect, useState } from 'react';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';

export type Theme = 'light' | 'dark';
type Preference = Theme | 'system';

const THEME_KEY = 'shop.theme';

function systemTheme(): Theme {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readPreference(): Preference {
  const stored = readStorage(THEME_KEY);
  return stored === 'dark' || stored === 'light' ? stored : 'system';
}

function apply(theme: Theme, preference: Preference): void {
  const root = document.documentElement;
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
  root.style.colorScheme = theme;
}

export function useTheme(): { theme: Theme; toggle(): void } {
  const [preference, setPreference] = useState<Preference>(readPreference);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme: Theme = preference === 'system' ? system : preference;

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    apply(theme, preference);
  }, [theme, preference]);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    // Choosing the system's current theme returns to following the system.
    if (next === systemTheme()) {
      removeStorage(THEME_KEY);
      setPreference('system');
    } else {
      writeStorage(THEME_KEY, next);
      setPreference(next);
    }
  }, [theme]);

  return { theme, toggle };
}
