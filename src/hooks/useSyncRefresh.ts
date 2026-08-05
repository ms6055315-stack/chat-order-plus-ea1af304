import { useEffect } from 'react';

/**
 * Re-runs `onChange` whenever a synced localStorage key is updated by another
 * device (or by another tab on this device).
 */
export function useSyncRefresh(keys: string[], onChange: () => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent).detail as string;
      if (key === '*' || keys.includes(key)) onChange();
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key && keys.includes(e.key)) onChange();
    };
    window.addEventListener('rabbani-sync-updated', handler as EventListener);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('rabbani-sync-updated', handler as EventListener);
      window.removeEventListener('storage', storageHandler);
    };
  }, [keys.join('|'), onChange]);
}
