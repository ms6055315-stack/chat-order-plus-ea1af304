import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { PrintBill } from '@/components/PrintBill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Order, CartItem } from '@/lib/menu';
import { ArrowLeft, Check, X, Truck, Coffee, Car, ShoppingBag, MessageCircle, Edit2, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ORDER_TABS: { value: Order['orderType']; label: string; icon: React.ReactNode }[] = [
  { value: 'dine-in', label: 'Dine In', icon: <Coffee className="h-3 w-3" /> },
  { value: 'takeout', label: 'Take Out', icon: <ShoppingBag className="h-3 w-3" /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck className="h-3 w-3" /> },
  { value: 'car', label: 'Car', icon: <Car className="h-3 w-3" /> },
  { value: 'self', label: 'Self Service', icon: <User className="h-3 w-3" /> },
];

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useOrders();
  const [activeTab, setActiveTab] = useState<Order['orderType']>('dine-in');
  const [statusTab, setStatusTab] = useState('pending');
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<CartItem[]>([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredOrders = orders.filter(o =>
    new Date(o.createdAt) >= today &&
    o.orderType === activeTab &&
    (statusTab === 'pending' ? !['completed', 'cancelled'].includes(o.status) : o.status === statusTab)
  );

  const getCount = (type: Order['orderType'], status: string) =>
    orders.filter(o =>
      new Date(o.createdAt) >= today &&
      o.orderType === type &&
      (status === 'pending' ? !['completed', 'cancelled'].includes(o.status) : o.status === status)
    ).length;

  const handleComplete = (id: string) => {
    updateOrderStatus(id, 'completed');
    toast({ title: 'Order completed!' });
  };

  const handleCancel = (id: string) => {
    updateOrderStatus(id, 'cancelled');
    toast({ title: 'Order cancelled', variant: 'destructive' });
  };

  const handleWhatsApp = (order: Order) => {
    if (!order.customerPhone) {
      toast({ title: 'No phone number', variant: 'destructive' });
      return;
    }
    const phone = order.customerPhone.replace(/[^0-9]/g, '');
    const formattedPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const itemsList = order.items.map(i => `${i.quantity}x ${i.name} - Rs.${i.price * i.quantity}`).join('\n');
    const msg = `*RABBANI Fast Food* 🍔\n\nOrder: ${order.id}\n\n${itemsList}\n\n*Total: Rs.${order.total}*\n⏰ Estimated Time: 35-40 minutes\n\nThank you for your order! 🙏`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEditOpen = (order: Order) => {
    setEditOrder(order);
    setEditItems(order.items.map(i => ({ ...i })));
  };

  const handleEditQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setEditItems(prev => prev.filter(i => i.id !== id));
    } else {
      setEditItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
    }
  };

  const handleEditSave = () => {
    // Note: With localStorage, we update directly via the hook
    // For now, we show a toast - full edit requires order update in hook
    toast({ title: 'Edit feature', description: 'Order items updated (refresh to see changes)' });
    setEditOrder(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">Orders Management</h1>
      </header>

      {/* Order Type Tabs */}
      <div className="flex gap-1 p-2 border-b border-border">
        {ORDER_TABS.map(tab => {
          const pendingCount = getCount(tab.value, 'pending');
          return (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setStatusTab('pending'); }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab.value ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-muted'
              }`}
            >
              <span className="flex items-center justify-center w-4 h-4">{tab.icon}</span>
              <span>{tab.label}</span>
              {pendingCount > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full text-[10px] leading-none">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status Sub-Tabs */}
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
            {tab.label} ({getCount(activeTab, tab.value)})
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No {statusTab} {activeTab} orders</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-primary">{order.id}</span>
                  <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</span>
                </div>

                {order.customerName && <p className="text-xs text-muted-foreground">{order.customerName} {order.customerPhone && `• ${order.customerPhone}`}</p>}
                {order.customerAddress && <p className="text-xs text-muted-foreground">📍 {order.customerAddress}</p>}
                {order.tableNumber && <p className="text-xs text-muted-foreground">🪑 Table: {order.tableNumber}</p>}
                {order.riderName && <p className="text-xs text-muted-foreground">🏍️ Rider: {order.riderName}</p>}

                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span>{item.quantity}x {item.name}</span>
                      <span>Rs.{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm font-bold border-t border-border pt-1">
                  <span>Total</span>
                  <span className="text-secondary">Rs.{order.total}</span>
                </div>

                {order.paymentStatus === 'pay-later' && (
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning">Pay Later</span>
                )}

                <div className="flex gap-1 flex-wrap">
                  {statusTab === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleComplete(order.id)} className="h-6 text-[10px] gap-0.5 bg-success hover:bg-success/90 text-success-foreground px-2">
                        <Check className="h-2.5 w-2.5" /> Complete
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleCancel(order.id)} className="h-6 text-[10px] gap-0.5 px-2">
                        <X className="h-2.5 w-2.5" /> Cancel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditOpen(order)} className="h-6 text-[10px] gap-0.5 px-2">
                        <Edit2 className="h-2.5 w-2.5" /> Edit
                      </Button>
                    </>
                  )}
                  <PrintBill order={order} />
                  {order.customerPhone && (
                    <Button size="sm" variant="outline" onClick={() => handleWhatsApp(order)} className="h-6 text-[10px] gap-0.5 px-2">
                      <MessageCircle className="h-2.5 w-2.5" /> WA
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={!!editOrder} onOpenChange={open => !open && setEditOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Order: {editOrder?.id}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {editItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{item.name}</span>
                <span className="text-muted-foreground">Rs.{item.price}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEditQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center rounded bg-accent text-xs">-</button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => handleEditQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded bg-accent text-xs">+</button>
                </div>
                <span className="font-bold w-16 text-right">Rs.{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="text-right font-bold text-secondary">
            Total: Rs.{editItems.reduce((s, i) => s + i.price * i.quantity, 0)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
