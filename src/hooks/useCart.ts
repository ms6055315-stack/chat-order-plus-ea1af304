import { useState, useCallback, useEffect, useRef } from 'react';
import { MenuItem, CartItem } from '@/lib/menu';
import { useSyncRefresh } from '@/hooks/useSyncRefresh';


const CART_STORAGE_KEY = 'rabbani_cart';

interface CartState {
  items: CartItem[];
  discount: number;
  discountType: 'percent' | 'amount';
  extraCharges: number;
  orderType: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryCharges: number;
  tableNumber: string;
  riderName: string;
  waiterName: string;
}

function loadCart(): CartState {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    if (!data) return { items: [], discount: 0, discountType: 'percent', extraCharges: 0, orderType: 'dine-in', customerName: '', customerPhone: '', customerAddress: '', deliveryCharges: 0, tableNumber: '', riderName: '', waiterName: '' };
    return JSON.parse(data);
  } catch { return { items: [], discount: 0, discountType: 'percent', extraCharges: 0, orderType: 'dine-in', customerName: '', customerPhone: '', customerAddress: '', deliveryCharges: 0, tableNumber: '', riderName: '', waiterName: '' }; }
}

function saveCartState(state: CartState) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
}

export function useCart() {
  const initial = loadCart();
  const skipSyncedSave = useRef(false);
  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [discount, setDiscount] = useState(initial.discount);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>(initial.discountType);
  const [extraCharges, setExtraCharges] = useState(initial.extraCharges);
  const [orderType, setOrderType] = useState(initial.orderType);
  const [customerName, setCustomerName] = useState(initial.customerName);
  const [customerPhone, setCustomerPhone] = useState(initial.customerPhone);
  const [customerAddress, setCustomerAddress] = useState(initial.customerAddress);
  const [deliveryCharges, setDeliveryCharges] = useState(initial.deliveryCharges);
  const [tableNumber, setTableNumber] = useState(initial.tableNumber);
  const [riderName, setRiderName] = useState(initial.riderName);
  const [waiterName, setWaiterName] = useState(initial.waiterName);

  useEffect(() => {
    // A remote refresh already wrote the complete cart to localStorage. Do not
    // echo that refresh back as a new local revision (which could win a race
    // against the user's next edit on another device).
    if (skipSyncedSave.current) {
      skipSyncedSave.current = false;
      return;
    }
    saveCartState({ items, discount, discountType, extraCharges, orderType, customerName, customerPhone, customerAddress, deliveryCharges, tableNumber, riderName, waiterName });
  }, [items, discount, discountType, extraCharges, orderType, customerName, customerPhone, customerAddress, deliveryCharges, tableNumber, riderName, waiterName]);

  // Live cart sync: another device changed the cart -> mirror it here.
  useSyncRefresh([CART_STORAGE_KEY], useCallback(() => {
    const s = loadCart();
    skipSyncedSave.current = true;
    setItems(s.items);
    setDiscount(s.discount);
    setDiscountType(s.discountType);
    setExtraCharges(s.extraCharges);
    setOrderType(s.orderType);
    setCustomerName(s.customerName);
    setCustomerPhone(s.customerPhone);
    setCustomerAddress(s.customerAddress);
    setDeliveryCharges(s.deliveryCharges);
    setTableNumber(s.tableNumber);
    setRiderName(s.riderName);
    setWaiterName(s.waiterName);
  }, []));


  const addItem = useCallback((item: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setDiscountType('percent');
    setExtraCharges(0);
    setOrderType('dine-in');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setDeliveryCharges(0);
    setTableNumber('');
    setRiderName('');
    setWaiterName('');
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = discountType === 'percent' ? subtotal * discount / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount + extraCharges);

  return {
    items, addItem, removeItem, updateQuantity, clearCart,
    discount, discountType, setDiscount, setDiscountType,
    subtotal, discountAmount, total, extraCharges, setExtraCharges,
    orderType, setOrderType,
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerAddress, setCustomerAddress,
    deliveryCharges, setDeliveryCharges,
    tableNumber, setTableNumber,
    riderName, setRiderName,
    waiterName, setWaiterName,
  };
}
