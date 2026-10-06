import { useCallback, useRef } from 'react';

/** Ignores repeat taps on the same action within `ms` (prevents double orders/prints). */
export function useOnceGuard(ms = 1200) {
  const busy = useRef<Record<string, number>>({});
  return useCallback(<T extends unknown[]>(key: string, fn: (...a: T) => void) => (...a: T) => {
    const now = Date.now();
    if (busy.current[key] && now - busy.current[key] < ms) return;
    busy.current[key] = now;
    fn(...a);
  }, [ms]);
}
