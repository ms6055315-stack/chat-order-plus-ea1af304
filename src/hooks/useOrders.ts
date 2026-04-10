import { useState, useCallback } from 'react';
import { Order, DaySession } from '@/lib/menu';

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
    const updated = [...orders, order];
    setOrders(updated);
    saveOrders(updated);

    if (currentSession) {
      const updatedSession = { ...currentSession, orders: [...currentSession.orders, order] };
      setCurrentSession(updatedSession);
      saveSession(updatedSession);
    }
    return order;
  }, [orders, currentSession]);

  const updateOrderStatus = useCallback((id: string, status: Order['status']) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    saveOrders(updated);
  }, [orders]);

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

  return { orders, isDayOpen, currentSession, startDay, endDay, addOrder, updateOrderStatus, getTodayStats };
}
