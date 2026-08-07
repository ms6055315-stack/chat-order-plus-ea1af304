import { useState, useCallback } from 'react';
import { MenuItem, DEFAULT_MENU_ITEMS, CATEGORIES } from '@/lib/menu';
import { useSyncRefresh } from '@/hooks/useSyncRefresh';


const STORAGE_KEY = 'rabbani_menu';
const CAT_STORAGE_KEY = 'rabbani_categories';

function loadItems(): MenuItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_MENU_ITEMS;
  } catch { return DEFAULT_MENU_ITEMS; }
}

function loadCategories(): string[] {
  try {
    const data = localStorage.getItem(CAT_STORAGE_KEY);
    return data ? JSON.parse(data) : CATEGORIES;
  } catch { return CATEGORIES; }
}

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>(loadItems);
  const [categories, setCategories] = useState<string[]>(loadCategories);

  useSyncRefresh([STORAGE_KEY, CAT_STORAGE_KEY], useCallback(() => {
    setItems(loadItems());
    setCategories(loadCategories());
  }, []));



  const addItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    setItems(previous => {
      const updated = [...previous, { ...item, id: `custom-${Date.now()}` }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateItem = useCallback((id: string, data: Partial<MenuItem>) => {
    setItems(previous => {
      const updated = previous.map(i => i.id === id ? { ...i, ...data } : i);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(previous => {
      const updated = previous.filter(i => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setItems(DEFAULT_MENU_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MENU_ITEMS));
    setCategories(CATEGORIES);
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(CATEGORIES));
  }, []);

  const addCategory = useCallback((cat: string) => {
    if (categories.includes(cat)) return;
    const updated = [...categories, cat];
    setCategories(updated);
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(updated));
  }, [categories]);

  return { items, categories, addItem, updateItem, deleteItem, resetToDefault, addCategory };
}
