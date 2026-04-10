import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const SELF_ORDERS_KEY = 'rabbani_self_orders';

function loadSelfOrders() {
  try {
    const d = localStorage.getItem(SELF_ORDERS_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const selfOrders = loadSelfOrders();

  const allOrders = [...orders, ...selfOrders.filter((s: any) => s.status === 'completed')];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);
  const completedToday = todayOrders.filter(o => o.status === 'completed' || o.status === 'pending');
  const cancelledToday = todayOrders.filter(o => o.status === 'cancelled');

  const totalSales = completedToday.reduce((s, o) => s + o.total, 0);
  const byType = {
    'dine-in': completedToday.filter(o => o.orderType === 'dine-in'),
    'takeout': completedToday.filter(o => o.orderType === 'takeout'),
    'delivery': completedToday.filter(o => o.orderType === 'delivery'),
    'car': completedToday.filter(o => o.orderType === 'car'),
    'self': completedToday.filter(o => o.orderType === 'self'),
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">Sales Report</h1>
      </header>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold text-foreground">{completedToday.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold text-secondary">Rs.{totalSales}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-destructive">{cancelledToday.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Avg Order</p>
            <p className="text-2xl font-bold text-foreground">Rs.{completedToday.length ? Math.round(totalSales / completedToday.length) : 0}</p>
          </div>
        </div>

        {/* By Type */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-bold mb-3">By Order Type</h2>
          <div className="space-y-2">
            {Object.entries(byType).map(([type, typeOrders]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="capitalize">{type}</span>
                <div className="flex gap-4">
                  <span className="text-muted-foreground">{typeOrders.length} orders</span>
                  <span className="font-bold text-secondary">Rs.{typeOrders.reduce((s, o) => s + o.total, 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-bold mb-3">Today's Orders</h2>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {todayOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
              <div key={order.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border">
                <span className="font-bold">{order.id}</span>
                <span className="capitalize text-muted-foreground">{order.orderType}</span>
                <span className={order.status === 'cancelled' ? 'text-destructive' : 'text-success'}>{order.status}</span>
                <span className="font-bold">Rs.{order.total}</span>
                <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
