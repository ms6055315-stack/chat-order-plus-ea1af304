import { useState, useCallback } from 'react';
import { Order, DaySession, CartItem } from '@/lib/menu';
import { useSyncRefresh } from '@/hooks/useSyncRefresh';

const STORAGE_KEY = 'rabbani_orders';
const SESSION_KEY = 'rabbani_session';

function loadOrders(): Order[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data).map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) })) : [];
  } catch { return []; }
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function loadSession(): DaySession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    const s = JSON.parse(data);
    return { ...s, startedAt: new Date(s.startedAt), endedAt: s.endedAt ? new Date(s.endedAt) : undefined };
  } catch { return null; }
}

function saveSession(session: DaySession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [currentSession, setCurrentSession] = useState<DaySession | null>(loadSession);

  useSyncRefresh([STORAGE_KEY, SESSION_KEY], useCallback(() => {
    setOrders(loadOrders());
    setCurrentSession(loadSession());
  }, []));

  const isDayOpen = !!currentSession && !currentSession.endedAt;

  const startDay = useCallback((openingCash: number) => {
    const session: DaySession = {
      id: `S-${Date.now()}`,
      openingCash,
      startedAt: new Date(),
      orders: [],
    };
    setCurrentSession(session);
    saveSession(session);
  }, []);

  const endDay = useCallback((closingCash: number) => {
    if (!currentSession) return;
    const ended = { ...currentSession, closingCash, endedAt: new Date() };
    setCurrentSession(ended);
    saveSession(ended);
  }, [currentSession]);

  const addOrder = useCallback((orderData: Omit<Order, 'id' | 'createdAt'>) => {
    const order: Order = {
      ...orderData,
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date(),
    };
    setOrders(previous => {
      const updated = [...previous, order];
      saveOrders(updated);
      return updated;
    });
    setCurrentSession(previous => {
      if (!previous) return previous;
      const updatedSession = { ...previous, orders: [...previous.orders, order] };
      saveSession(updatedSession);
      return updatedSession;
    });
    return order;
  }, []);

  const updateOrderStatus = useCallback((id: string, status: Order['status']) => {
    setOrders(previous => {
      const updated = previous.map(o => o.id === id ? { ...o, status } : o);
      saveOrders(updated);
      return updated;
    });
  }, []);

  const updateOrder = useCallback((id: string, data: Partial<Order>) => {
    setOrders(previous => {
      const updated = previous.map(o => o.id === id ? { ...o, ...data } : o);
      saveOrders(updated);
      return updated;
    });
  }, []);

  const saveDraftOrder = useCallback((order: Order) => {
    setOrders(previous => {
      const exists = previous.some(o => o.id === order.id);
      const updated = exists ? previous.map(o => o.id === order.id ? order : o) : [...previous, order];
      saveOrders(updated);
      return updated;
    });
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders(previous => {
      const updated = previous.filter(o => o.id !== id);
      saveOrders(updated);
      return updated;
    });
  }, []);

  const purgeOldOrders = useCallback(() => {
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
    fortyDaysAgo.setHours(0, 0, 0, 0);
    setOrders(previous => {
      // Keep self-service orders and anything from last 40 days
      const updated = previous.filter(o => o.orderType === 'self' || new Date(o.createdAt) >= fortyDaysAgo);
      saveOrders(updated);
      return updated;
    });
  }, []);

  const getTodayStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const completedOrders = todayOrders.filter(o => o.status !== 'cancelled');
    const cancelledOrders = todayOrders.filter(o => o.status === 'cancelled');
    const payLaterOrders = completedOrders.filter(o => o.paymentStatus === 'pay-later');

    return {
      ordersCount: completedOrders.length,
      cancelledCount: cancelledOrders.length,
      grossSales: completedOrders.reduce((s, o) => s + o.total, 0),
      netSales: completedOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
      payLaterCount: payLaterOrders.length,
      payLaterTotal: payLaterOrders.reduce((s, o) => s + o.total, 0),
      payLaterOrders,
      byType: {
        'dine-in': completedOrders.filter(o => o.orderType === 'dine-in'),
        'takeout': completedOrders.filter(o => o.orderType === 'takeout'),
        'delivery': completedOrders.filter(o => o.orderType === 'delivery'),
        'car': completedOrders.filter(o => o.orderType === 'car'),
        'self': completedOrders.filter(o => o.orderType === 'self'),
      },
    };
  }, [orders]);

  return { orders, isDayOpen, currentSession, startDay, endDay, addOrder, saveDraftOrder, updateOrderStatus, updateOrder, deleteOrder, purgeOldOrders, clearNonSelfOrders: purgeOldOrders, getTodayStats };
}
