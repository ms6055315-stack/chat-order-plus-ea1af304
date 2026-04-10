import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuGrid } from '@/components/MenuGrid';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useCart } from '@/hooks/useCart';
import { PrintBill } from '@/components/PrintBill';
import { Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Minus, Plus, Trash2, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SELF_ORDERS_KEY = 'rabbani_self_orders';

function loadSelfOrders(): Order[] {
  try {
    const d = localStorage.getItem(SELF_ORDERS_KEY);
    return d ? JSON.parse(d).map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) })) : [];
  } catch { return []; }
}

function saveSelfOrders(orders: Order[]) {
  localStorage.setItem(SELF_ORDERS_KEY, JSON.stringify(orders));
}

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SelfServicePage() {
  const navigate = useNavigate();
  const menu = useMenuItems();
  const cart = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selfOrders, setSelfOrders] = useState<Order[]>(loadSelfOrders);
  const [view, setView] = useState<'menu' | 'orders'>('menu');
  const [statusTab, setStatusTab] = useState('pending');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const handlePlaceOrder = () => {
    if (cart.items.length === 0) return;
    const order: Order = {
      id: `SELF-${Date.now().toString(36).toUpperCase()}`,
      items: cart.items,
      orderType: 'self',
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      discount: cart.discount,
      discountType: cart.discountType,
      subtotal: cart.subtotal,
      total: cart.total,
      status: 'pending',
      paymentStatus: 'paid',
      createdAt: new Date(),
    };
    const updated = [order, ...selfOrders];
    setSelfOrders(updated);
    saveSelfOrders(updated);
    cart.clearCart();
    setCustomerName('');
    setCustomerPhone('');
    toast({ title: 'Self-service order placed!', description: `${order.id} - Rs.${order.total}` });
  };

  const handleComplete = (id: string) => {
    const updated = selfOrders.map(o => o.id === id ? { ...o, status: 'completed' as const } : o);
    setSelfOrders(updated);
    saveSelfOrders(updated);
    toast({ title: 'Order completed!' });
  };

  const handleCancel = (id: string) => {
    const updated = selfOrders.map(o => o.id === id ? { ...o, status: 'cancelled' as const } : o);
    setSelfOrders(updated);
    saveSelfOrders(updated);
    toast({ title: 'Order cancelled', variant: 'destructive' });
  };

  const handleClearOrder = (id: string) => {
    const updated = selfOrders.filter(o => o.id !== id);
    setSelfOrders(updated);
    saveSelfOrders(updated);
    toast({ title: 'Order cleared' });
  };

  const handleClearAllCompleted = () => {
    const updated = selfOrders.filter(o => o.status !== 'completed');
    setSelfOrders(updated);
    saveSelfOrders(updated);
    toast({ title: 'All completed orders cleared' });
  };

  const handleClearAllCancelled = () => {
    const updated = selfOrders.filter(o => o.status !== 'cancelled');
    setSelfOrders(updated);
    saveSelfOrders(updated);
    toast({ title: 'All cancelled orders cleared' });
  };

  const getCount = (status: string) =>
    selfOrders.filter(o => status === 'pending' ? !['completed', 'cancelled'].includes(o.status) : o.status === status).length;

  const filteredSelfOrders = selfOrders.filter(o =>
    statusTab === 'pending' ? !['completed', 'cancelled'].includes(o.status) : o.status === statusTab
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">Self Service</h1>
        <div className="flex gap-1 ml-4">
          <Button variant={view === 'menu' ? 'default' : 'outline'} size="sm" onClick={() => setView('menu')} className="h-7 text-xs">New Order</Button>
          <Button variant={view === 'orders' ? 'default' : 'outline'} size="sm" onClick={() => setView('orders')} className="h-7 text-xs">
            Orders ({getCount('pending')})
          </Button>
        </div>

        {view === 'orders' && statusTab === 'completed' && filteredSelfOrders.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleClearAllCompleted} className="ml-auto h-7 text-xs gap-1">
            <Trash2 className="h-3 w-3" /> Clear All Completed
          </Button>
        )}
        {view === 'orders' && statusTab === 'cancelled' && filteredSelfOrders.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleClearAllCancelled} className="ml-auto h-7 text-xs gap-1">
            <Trash2 className="h-3 w-3" /> Clear All Cancelled
          </Button>
        )}
      </header>

      {view === 'menu' ? (
        <>
          {/* Cart summary with customer info */}
          <div className="border-b border-border p-2 bg-card/50">
            <div className="flex items-center gap-2 flex-wrap">
              <Input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-7 text-xs w-36" />
              <Input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-7 text-xs w-32" />
              {cart.items.map(item => (
                <div key={item.id} className="flex items-center gap-1 bg-card border border-border rounded px-2 py-1 text-xs whitespace-nowrap">
                  <span>{item.name}</span>
                  <button onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} className="w-4 h-4 flex items-center justify-center rounded bg-accent"><Minus className="h-2.5 w-2.5" /></button>
                  <span className="font-bold">{item.quantity}</span>
                  <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} className="w-4 h-4 flex items-center justify-center rounded bg-accent"><Plus className="h-2.5 w-2.5" /></button>
                  <button onClick={() => cart.removeItem(item.id)} className="text-destructive"><Trash2 className="h-2.5 w-2.5" /></button>
                </div>
              ))}
              {cart.items.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-bold text-secondary">Rs.{cart.total}</span>
                  <Button size="sm" onClick={handlePlaceOrder} className="h-7 text-xs bg-success hover:bg-success/90 text-success-foreground">Place Order</Button>
                </div>
              )}
            </div>
          </div>
          <main className="flex-1 overflow-hidden">
            <MenuGrid items={menu.items} categories={menu.categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onItemClick={item => cart.addItem(item)} />
          </main>
        </>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Status tabs */}
          <div className="flex gap-1 px-2 py-1.5 border-b border-border bg-card/50">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  statusTab === tab.value
                    ? tab.value === 'pending' ? 'bg-warning text-warning-foreground'
                    : tab.value === 'completed' ? 'bg-success text-success-foreground'
                    : 'bg-destructive text-destructive-foreground'
                    : 'bg-accent text-accent-foreground hover:bg-muted'
                }`}
              >
                {tab.label} ({getCount(tab.value)})
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {filteredSelfOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No {statusTab} self-service orders</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSelfOrders.map(order => (
                  <div key={order.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-sm text-primary">{order.id}</span>
                      <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {order.customerName && <p className="text-xs text-muted-foreground">{order.customerName} {order.customerPhone && `• ${order.customerPhone}`}</p>}
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{item.quantity}x {item.name}</span>
                        <span>Rs.{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm border-t border-border pt-1">
                      <span>Total</span>
                      <span className="text-secondary">Rs.{order.total}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {statusTab === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleComplete(order.id)} className="h-6 text-[10px] gap-0.5 bg-success hover:bg-success/90 text-success-foreground px-2">
                            <Check className="h-2.5 w-2.5" /> Complete
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleCancel(order.id)} className="h-6 text-[10px] gap-0.5 px-2">
                            <X className="h-2.5 w-2.5" /> Cancel
                          </Button>
                        </>
                      )}
                      {(statusTab === 'completed' || statusTab === 'cancelled') && (
                        <Button size="sm" variant="outline" onClick={() => handleClearOrder(order.id)} className="h-6 text-[10px] gap-0.5 px-2">
                          <Trash2 className="h-2.5 w-2.5" /> Clear
                        </Button>
                      )}
                      <PrintBill order={order} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
