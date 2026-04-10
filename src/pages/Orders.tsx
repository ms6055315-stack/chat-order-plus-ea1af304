import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { PrintBill } from '@/components/PrintBill';
import { Button } from '@/components/ui/button';
import { Order } from '@/lib/menu';
import { ArrowLeft, Check, X, Truck, Coffee, Car, ShoppingBag, MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ORDER_TABS: { value: Order['orderType']; label: string; icon: React.ReactNode }[] = [
  { value: 'dine-in', label: 'Dine In', icon: <Coffee className="h-3.5 w-3.5" /> },
  { value: 'takeout', label: 'Take Out', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck className="h-3.5 w-3.5" /> },
  { value: 'car', label: 'Car', icon: <Car className="h-3.5 w-3.5" /> },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useOrders();
  const [activeTab, setActiveTab] = useState<Order['orderType']>('dine-in');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter: only today's orders, exclude self-service, by type, only active (not completed/cancelled)
  const filteredOrders = orders.filter(o =>
    new Date(o.createdAt) >= today &&
    o.orderType === activeTab &&
    o.orderType !== 'self' &&
    !['completed', 'cancelled'].includes(o.status)
  );

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
    const itemsList = order.items.map(i => `${i.quantity}x ${i.name}`).join('\n');
    const msg = `*RABBANI Fast Food*\n\nOrder: ${order.id}\n${itemsList}\n\nTotal: Rs.${order.total}\nEstimated Time: 35-40 minutes\n\nThank you!`;
    window.open(`https://wa.me/${phone.startsWith('0') ? '92' + phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">Orders Management</h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-border">
        {ORDER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.value ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-muted'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="ml-1 bg-background/20 px-1.5 py-0.5 rounded text-[10px]">
              {orders.filter(o => new Date(o.createdAt) >= today && o.orderType === tab.value && !['completed', 'cancelled'].includes(o.status)).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No active {activeTab} orders</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-primary">{order.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    order.status === 'pending' ? 'bg-warning/20 text-warning' :
                    order.status === 'preparing' ? 'bg-primary/20 text-primary' :
                    'bg-success/20 text-success'
                  }`}>{order.status}</span>
                </div>

                {order.customerName && <p className="text-xs text-muted-foreground">{order.customerName} {order.customerPhone && `• ${order.customerPhone}`}</p>}
                {order.customerAddress && <p className="text-xs text-muted-foreground">{order.customerAddress}</p>}
                {order.tableNumber && <p className="text-xs text-muted-foreground">Table: {order.tableNumber}</p>}

                <div className="space-y-0.5">
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

                <div className="flex gap-1">
                  <Button size="sm" onClick={() => handleComplete(order.id)} className="flex-1 h-7 text-xs gap-1 bg-success hover:bg-success/90 text-success-foreground">
                    <Check className="h-3 w-3" /> Complete
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleCancel(order.id)} className="h-7 text-xs gap-1">
                    <X className="h-3 w-3" /> Cancel
                  </Button>
                  <PrintBill order={order} />
                  {activeTab === 'delivery' && (
                    <Button size="sm" variant="outline" onClick={() => handleWhatsApp(order)} className="h-7 text-xs gap-1">
                      <MessageCircle className="h-3 w-3" /> WA
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
