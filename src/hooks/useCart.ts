import { useState, useCallback, useEffect, useRef } from 'react';
import { MenuItem, CartItem } from '@/lib/menu';
import { useSyncRefresh } from '@/hooks/useSyncRefresh';

const CART_STORAGE_KEY_PREFIX = 'rabbani_cart_';

interface CartState {
  draftOrderId: string;
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

function getInitialState(type: string = 'dine-in'): CartState {
  return {
    draftOrderId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    items: [],
    discount: 0,
    discountType: 'percent',
    extraCharges: 0,
    orderType: type,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deliveryCharges: 0,
    tableNumber: '',
    riderName: '',
    waiterName: '',
  };
}

function loadCartForType(type: string): CartState {
  try {
    const data = localStorage.getItem(`${CART_STORAGE_KEY_PREFIX}${type}`);
    if (!data) return getInitialState(type);
    const parsed = JSON.parse(data) as Partial<CartState>;
    return { ...getInitialState(type), ...parsed, orderType: type };
  } catch {
    return getInitialState(type);
  }
}

function saveCartState(type: string, state: CartState) {
  localStorage.setItem(`${CART_STORAGE_KEY_PREFIX}${type}`, JSON.stringify(state));
}

export function useCart() {
  const [orderType, setOrderTypeInternal] = useState<string>(() => {
    // Try to find the last used order type or default to dine-in
    return localStorage.getItem('rabbani_last_order_type') || 'dine-in';
  });

  const initial = loadCartForType(orderType);
  const skipSyncedSave = useRef(false);
  const [draftOrderId, setDraftOrderId] = useState(initial.draftOrderId);
  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [discount, setDiscount] = useState(initial.discount);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>(initial.discountType);
  const [extraCharges, setExtraCharges] = useState(initial.extraCharges);
  const [customerName, setCustomerName] = useState(initial.customerName);
  const [customerPhone, setCustomerPhone] = useState(initial.customerPhone);
  const [customerAddress, setCustomerAddress] = useState(initial.customerAddress);
  const [deliveryCharges, setDeliveryCharges] = useState(initial.deliveryCharges);
  const [tableNumber, setTableNumber] = useState(initial.tableNumber);
  const [riderName, setRiderName] = useState(initial.riderName);
  const [waiterName, setWaiterName] = useState(initial.waiterName);

  // When orderType changes, load that type's cart
  const setOrderType = useCallback((newType: string) => {
    // Save current type's state first
    saveCartState(orderType, {
      draftOrderId, items, discount, discountType, extraCharges, orderType,
      customerName, customerPhone, customerAddress, deliveryCharges,
      tableNumber, riderName, waiterName
    });

    const s = loadCartForType(newType);
    setDraftOrderId(s.draftOrderId);
    setItems(s.items);
    setDiscount(s.discount);
    setDiscountType(s.discountType);
    setExtraCharges(s.extraCharges);
    setCustomerName(s.customerName);
    setCustomerPhone(s.customerPhone);
    setCustomerAddress(s.customerAddress);
    setDeliveryCharges(s.deliveryCharges);
    setTableNumber(s.tableNumber);
    setRiderName(s.riderName);
    setWaiterName(s.waiterName);
    
    setOrderTypeInternal(newType);
    localStorage.setItem('rabbani_last_order_type', newType);
  }, [draftOrderId, items, discount, discountType, extraCharges, orderType, customerName, customerPhone, customerAddress, deliveryCharges, tableNumber, riderName, waiterName]);

  // Auto-save the current active cart whenever it changes
  useEffect(() => {
    if (skipSyncedSave.current) {
      skipSyncedSave.current = false;
      return;
    }
    saveCartState(orderType, { draftOrderId, items, discount, discountType, extraCharges, orderType, customerName, customerPhone, customerAddress, deliveryCharges, tableNumber, riderName, waiterName });
  }, [draftOrderId, items, discount, discountType, extraCharges, orderType, customerName, customerPhone, customerAddress, deliveryCharges, tableNumber, riderName, waiterName]);

  // Syncing is harder with multiple carts, but let's sync the current active one
  useSyncRefresh([`${CART_STORAGE_KEY_PREFIX}${orderType}`], useCallback(() => {
    const s = loadCartForType(orderType);
    skipSyncedSave.current = true;
    setDraftOrderId(s.draftOrderId);
    setItems(s.items);
    setDiscount(s.discount);
    setDiscountType(s.discountType);
    setExtraCharges(s.extraCharges);
    setCustomerName(s.customerName);
    setCustomerPhone(s.customerPhone);
    setCustomerAddress(s.customerAddress);
    setDeliveryCharges(s.deliveryCharges);
    setTableNumber(s.tableNumber);
    setRiderName(s.riderName);
    setWaiterName(s.waiterName);
  }, [orderType]));

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
    const empty = getInitialState(orderType);
    setDraftOrderId(empty.draftOrderId);
    setItems(empty.items);
    setDiscount(empty.discount);
    setDiscountType(empty.discountType);
    setExtraCharges(empty.extraCharges);
    setCustomerName(empty.customerName);
    setCustomerPhone(empty.customerPhone);
    setCustomerAddress(empty.customerAddress);
    setDeliveryCharges(empty.deliveryCharges);
    setTableNumber(empty.tableNumber);
    setRiderName(empty.riderName);
    setWaiterName(empty.waiterName);
    // Explicitly clear from storage too
    saveCartState(orderType, empty);
  }, [orderType]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = discountType === 'percent' ? subtotal * discount / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount + extraCharges);

  return {
    draftOrderId, items, addItem, removeItem, updateQuantity, clearCart,
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
