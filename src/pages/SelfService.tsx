import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuGrid } from '@/components/MenuGrid';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useCart } from '@/hooks/useCart';
import { CartItem, Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { PrintBill } from '@/components/PrintBill';
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

export default function SelfServicePage() {
  const navigate = useNavigate();
  const menu = useMenuItems();
  const cart = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selfOrders, setSelfOrders] = useState<Order[]>(loadSelfOrders);
  const [view, setView] = useState<'menu' | 'orders'>('menu');

  const handlePlaceOrder = () => {
    if (cart.items.length === 0) return;
    const order: Order = {
      id: `SELF-${Date.now().toString(36).toUpperCase()}`,
      items: cart.items,
      orderType: 'self',
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

  const activeOrders = selfOrders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const historyOrders = selfOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">Self Service</h1>
        <div className="flex gap-1 ml-4">
          <Button variant={view === 'menu' ? 'default' : 'outline'} size="sm" onClick={() => setView('menu')} className="h-7 text-xs">Menu</Button>
          <Button variant={view === 'orders' ? 'default' : 'outline'} size="sm" onClick={() => setView('orders')} className="h-7 text-xs">
            Orders ({activeOrders.length})
          </Button>
        </div>
      </header>

      {view === 'menu' ? (
        <>
          {/* Cart summary */}
          {cart.items.length > 0 && (
            <div className="border-b border-border p-2 bg-card/50">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
                {cart.items.map(item => (
                  <div key={item.id} className="flex items-center gap-1 bg-card border border-border rounded px-2 py-1 text-xs whitespace-nowrap">
                    <span>{item.name}</span>
                    <button onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} className="w-4 h-4 flex items-center justify-center rounded bg-accent"><Minus className="h-2.5 w-2.5" /></button>
                    <span className="font-bold">{item.quantity}</span>
                    <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} className="w-4 h-4 flex items-center justify-center rounded bg-accent"><Plus className="h-2.5 w-2.5" /></button>
                    <button onClick={() => cart.removeItem(item.id)} className="text-destructive"><Trash2 className="h-2.5 w-2.5" /></button>
                  </div>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-bold text-secondary">Rs.{cart.total}</span>
                  <Button size="sm" onClick={handlePlaceOrder} className="h-7 text-xs bg-success hover:bg-success/90 text-success-foreground">Place Order</Button>
                </div>
              </div>
            </div>
          )}
          <main className="flex-1 overflow-hidden">
            <MenuGrid items={menu.items} categories={menu.categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onItemClick={item => cart.addItem(item)} />
          </main>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <h2 className="text-sm font-bold">Active Orders</h2>
          {activeOrders.length === 0 ? <p className="text-muted-foreground text-sm">No active orders</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between"><span className="font-bold text-sm text-primary">{order.id}</span><span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</span></div>
                  {order.items.map((item, i) => <div key={i} className="flex justify-between text-xs"><span>{item.quantity}x {item.name}</span><span>Rs.{item.price * item.quantity}</span></div>)}
                  <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span className="text-secondary">Rs.{order.total}</span></div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => handleComplete(order.id)} className="flex-1 h-7 text-xs gap-1 bg-success hover:bg-success/90 text-success-foreground"><Check className="h-3 w-3" /> Complete</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleCancel(order.id)} className="h-7 text-xs gap-1"><X className="h-3 w-3" /> Cancel</Button>
                    <PrintBill order={order} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-sm font-bold mt-6">History</h2>
          {historyOrders.length === 0 ? <p className="text-muted-foreground text-sm">No history</p> : (
            <div className="space-y-1">
              {historyOrders.slice(0, 50).map(order => (
                <div key={order.id} className="flex items-center justify-between bg-card border border-border rounded px-3 py-2 text-xs">
                  <span className="font-bold">{order.id}</span>
                  <span className={order.status === 'completed' ? 'text-success' : 'text-destructive'}>{order.status}</span>
                  <span>Rs.{order.total}</span>
                  <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
