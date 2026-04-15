import { useState, useCallback } from 'react';

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

  const addTable = useCallback((name: string) => {
    if (!name.trim() || tables.includes(name.trim())) return;
    const updated = [...tables, name.trim()];
    setTables(updated);
    save(TABLES_KEY, updated);
  }, [tables]);

  const removeTable = useCallback((name: string) => {
    const updated = tables.filter(t => t !== name);
    setTables(updated);
    save(TABLES_KEY, updated);
  }, [tables]);

  const editTable = useCallback((old: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = tables.map(t => t === old ? newName.trim() : t);
    setTables(updated);
    save(TABLES_KEY, updated);
  }, [tables]);

  const addWaiter = useCallback((name: string) => {
    if (!name.trim() || waiters.includes(name.trim())) return;
    const updated = [...waiters, name.trim()];
    setWaiters(updated);
    save(WAITERS_KEY, updated);
  }, [waiters]);

  const removeWaiter = useCallback((name: string) => {
    const updated = waiters.filter(w => w !== name);
    setWaiters(updated);
    save(WAITERS_KEY, updated);
  }, [waiters]);

  const editWaiter = useCallback((old: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = waiters.map(w => w === old ? newName.trim() : w);
    setWaiters(updated);
    save(WAITERS_KEY, updated);
  }, [waiters]);

  const addRider = useCallback((name: string) => {
    if (!name.trim() || riders.includes(name.trim())) return;
    const updated = [...riders, name.trim()];
    setRiders(updated);
    save(RIDERS_KEY, updated);
  }, [riders]);

  const removeRider = useCallback((name: string) => {
    const updated = riders.filter(r => r !== name);
    setRiders(updated);
    save(RIDERS_KEY, updated);
  }, [riders]);

  const editRider = useCallback((old: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = riders.map(r => r === old ? newName.trim() : r);
    setRiders(updated);
    save(RIDERS_KEY, updated);
  }, [riders]);

  return {
    tables, addTable, removeTable, editTable,
    waiters, addWaiter, removeWaiter, editWaiter,
    riders, addRider, removeRider, editRider,
  };
}
