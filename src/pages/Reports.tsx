import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search } from 'lucide-react';

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
  const [categorySearch, setCategorySearch] = useState('');
  const [tab, setTab] = useState<'summary' | 'category'>('summary');

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

  // Sales by category
  const categoryMap: Record<string, { items: Record<string, { name: string; qty: number; revenue: number }>; totalQty: number; totalRevenue: number }> = {};
  completedToday.forEach(order => {
    order.items.forEach((item: any) => {
      const cat = item.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { items: {}, totalQty: 0, totalRevenue: 0 };
      if (!categoryMap[cat].items[item.id]) categoryMap[cat].items[item.id] = { name: item.name, qty: 0, revenue: 0 };
      categoryMap[cat].items[item.id].qty += item.quantity;
      categoryMap[cat].items[item.id].revenue += item.price * item.quantity;
      categoryMap[cat].totalQty += item.quantity;
      categoryMap[cat].totalRevenue += item.price * item.quantity;
    });
  });

  const filteredCategories = Object.entries(categoryMap).filter(([cat]) =>
    !categorySearch || cat.toLowerCase().includes(categorySearch.toLowerCase())
  ).sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">Sales Report</h1>
        <div className="flex gap-1 ml-4">
          <Button variant={tab === 'summary' ? 'default' : 'outline'} size="sm" onClick={() => setTab('summary')} className="h-7 text-xs">Summary</Button>
          <Button variant={tab === 'category' ? 'default' : 'outline'} size="sm" onClick={() => setTab('category')} className="h-7 text-xs">Sales by Category</Button>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {tab === 'summary' && (
          <>
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
          </>
        )}

        {tab === 'category' && (
          <>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search category..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} className="h-8 text-xs max-w-xs" />
            </div>

            {filteredCategories.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sales data for today</p>
            ) : (
              <div className="space-y-3">
                {filteredCategories.map(([cat, data]) => (
                  <div key={cat} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-primary">{cat}</h3>
                      <div className="flex gap-3 text-xs">
                        <span className="text-muted-foreground">{data.totalQty} items sold</span>
                        <span className="font-bold text-secondary">Rs.{data.totalRevenue}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {Object.values(data.items).sort((a, b) => b.revenue - a.revenue).map(item => (
                        <div key={item.name} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                          <span>{item.name}</span>
                          <div className="flex gap-4">
                            <span className="text-muted-foreground">{item.qty}x sold</span>
                            <span className="font-bold">Rs.{item.revenue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
