import { useState, useCallback } from 'react';
import { MenuItem, DEFAULT_MENU_ITEMS, CATEGORIES } from '@/lib/menu';

const STORAGE_KEY = 'rabbani_menu';

function loadItems(): MenuItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_MENU_ITEMS;
  } catch { return DEFAULT_MENU_ITEMS; }
}

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>(loadItems);

  const save = (newItems: MenuItem[]) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const addItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    save([...items, { ...item, id: `custom-${Date.now()}` }]);
  }, [items]);

  const updateItem = useCallback((id: string, data: Partial<MenuItem>) => {
    save(items.map(i => i.id === id ? { ...i, ...data } : i));
  }, [items]);

  const deleteItem = useCallback((id: string) => {
    save(items.filter(i => i.id !== id));
  }, [items]);

  const resetToDefault = useCallback(() => {
    save(DEFAULT_MENU_ITEMS);
  }, []);

  return { items, categories: CATEGORIES, addItem, updateItem, deleteItem, resetToDefault };
}
