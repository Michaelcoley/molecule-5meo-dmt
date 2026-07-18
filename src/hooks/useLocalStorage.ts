import { useCallback, useEffect, useState } from 'react';

/** Persists a JSON-serialisable value to localStorage, merging with defaults so
 *  new settings keys survive older stored blobs. */
export function useLocalStorage<T extends object>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      return { ...initial, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage may be unavailable (private mode) — non-fatal */
    }
  }, [key, value]);

  const set = useCallback((v: T | ((p: T) => T)) => setValue(v), []);
  return [value, set];
}
