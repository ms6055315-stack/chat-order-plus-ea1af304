import { useState, useCallback } from 'react';
import { Customer } from '@/lib/menu';

const STORAGE_KEY = 'rabbani_customers';

function load(): Customer[] {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(load);

  const save = (c: Customer[]) => {
    setCustomers(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  };

  const findByPhone = useCallback((phone: string) => customers.find(c => c.phone === phone), [customers]);

  const searchByPhone = useCallback((phone: string) => {
    if (phone.length < 4) return [];
    return customers.filter(c => c.phone.includes(phone));
  }, [customers]);

  const saveCustomer = useCallback((data: { name: string; phone: string; address: string; deliveryCharges?: number }) => {
    if (!data.phone) return;
    const existing = customers.find(c => c.phone === data.phone);
    if (existing) {
      save(customers.map(c => c.phone === data.phone ? { ...c, name: data.name || c.name, address: data.address || c.address, deliveryCharges: data.deliveryCharges ?? c.deliveryCharges } : c));
    } else {
      save([...customers, { id: `C-${Date.now()}`, ...data }]);
    }
  }, [customers]);

  const updateCustomer = useCallback((id: string, data: Partial<Customer>) => {
    save(customers.map(c => c.id === id ? { ...c, ...data } : c));
  }, [customers]);

  const deleteCustomer = useCallback((id: string) => {
    save(customers.filter(c => c.id !== id));
  }, [customers]);

  return { customers, findByPhone, searchByPhone, saveCustomer, updateCustomer, deleteCustomer };
}
