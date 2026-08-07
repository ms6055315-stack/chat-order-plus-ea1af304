import { useState, useCallback } from 'react';
import { Customer } from '@/lib/menu';
import { useSyncRefresh } from '@/hooks/useSyncRefresh';

const STORAGE_KEY = 'rabbani_customers';

function load(): Customer[] {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(load);

  useSyncRefresh([STORAGE_KEY], useCallback(() => setCustomers(load()), []));

  const findByPhone = useCallback((phone: string) => customers.find(c => c.phone === phone), [customers]);

  const searchByPhone = useCallback((phone: string) => {
    if (phone.length < 4) return [];
    return customers.filter(c => c.phone.includes(phone));
  }, [customers]);

  const saveCustomer = useCallback((data: { name: string; phone: string; address: string; deliveryCharges?: number }) => {
    if (!data.phone) return;
    setCustomers(previous => {
      const existing = previous.find(c => c.phone === data.phone);
      const updated = existing
        ? previous.map(c => c.phone === data.phone ? { ...c, name: data.name || c.name, address: data.address || c.address, deliveryCharges: data.deliveryCharges ?? c.deliveryCharges } : c)
        : [...previous, { id: `C-${Date.now()}`, ...data }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateCustomer = useCallback((id: string, data: Partial<Customer>) => {
    setCustomers(previous => {
      const updated = previous.map(c => c.id === id ? { ...c, ...data } : c);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(previous => {
      const updated = previous.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { customers, findByPhone, searchByPhone, saveCustomer, updateCustomer, deleteCustomer };
}
