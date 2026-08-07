import { useState, useCallback } from 'react';
import { useSyncRefresh } from '@/hooks/useSyncRefresh';

const TABLES_KEY = 'rabbani_tables';
const WAITERS_KEY = 'rabbani_waiters';
const RIDERS_KEY = 'rabbani_riders';

function load(key: string, fallback: string[]): string[] {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}

function save(key: string, data: string[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useStaffAndTables() {
  const [tables, setTables] = useState<string[]>(() => load(TABLES_KEY, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']));
  const [waiters, setWaiters] = useState<string[]>(() => load(WAITERS_KEY, []));
  const [riders, setRiders] = useState<string[]>(() => load(RIDERS_KEY, []));

  useSyncRefresh([TABLES_KEY, WAITERS_KEY, RIDERS_KEY], useCallback(() => {
    setTables(load(TABLES_KEY, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']));
    setWaiters(load(WAITERS_KEY, []));
    setRiders(load(RIDERS_KEY, []));
  }, []));

  const addTable = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setTables(previous => {
      if (previous.includes(clean)) return previous;
      const updated = [...previous, clean];
      save(TABLES_KEY, updated);
      return updated;
    });
  }, []);

  const removeTable = useCallback((name: string) => {
    setTables(previous => {
      const updated = previous.filter(t => t !== name);
      save(TABLES_KEY, updated);
      return updated;
    });
  }, []);

  const editTable = useCallback((old: string, newName: string) => {
    if (!newName.trim()) return;
    setTables(previous => {
      const updated = previous.map(t => t === old ? newName.trim() : t);
      save(TABLES_KEY, updated);
      return updated;
    });
  }, []);

  const addWaiter = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setWaiters(previous => {
      if (previous.includes(clean)) return previous;
      const updated = [...previous, clean];
      save(WAITERS_KEY, updated);
      return updated;
    });
  }, []);

  const removeWaiter = useCallback((name: string) => {
    setWaiters(previous => {
      const updated = previous.filter(w => w !== name);
      save(WAITERS_KEY, updated);
      return updated;
    });
  }, []);

  const editWaiter = useCallback((old: string, newName: string) => {
    if (!newName.trim()) return;
    setWaiters(previous => {
      const updated = previous.map(w => w === old ? newName.trim() : w);
      save(WAITERS_KEY, updated);
      return updated;
    });
  }, []);

  const addRider = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setRiders(previous => {
      if (previous.includes(clean)) return previous;
      const updated = [...previous, clean];
      save(RIDERS_KEY, updated);
      return updated;
    });
  }, []);

  const removeRider = useCallback((name: string) => {
    setRiders(previous => {
      const updated = previous.filter(r => r !== name);
      save(RIDERS_KEY, updated);
      return updated;
    });
  }, []);

  const editRider = useCallback((old: string, newName: string) => {
    if (!newName.trim()) return;
    setRiders(previous => {
      const updated = previous.map(r => r === old ? newName.trim() : r);
      save(RIDERS_KEY, updated);
      return updated;
    });
  }, []);

  return {
    tables, addTable, removeTable, editTable,
    waiters, addWaiter, removeWaiter, editWaiter,
    riders, addRider, removeRider, editRider,
  };
}
