import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { PrintBill } from '@/components/PrintBill';
import { loadPrintConfig } from '@/components/PrintSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Order, CartItem, MenuItem, CATEGORIES } from '@/lib/menu';
import { ArrowLeft, Check, X, Truck, Coffee, Car, ShoppingBag, MessageCircle, Edit2, Minus, Plus, Search, Trash2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ORDER_TABS: { value: Order['orderType']; label: string; icon: React.ReactNode }[] = [
  { value: 'dine-in', label: 'Dine In', icon: <Coffee className="h-3 w-3" /> },
  { value: 'takeout', label: 'Take Out', icon: <ShoppingBag className="h-3 w-3" /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck className="h-3 w-3" /> },
  { value: 'car', label: 'Car', icon: <Car className="h-3 w-3" /> },
];

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, updateOrder, deleteOrder } = useOrders();
  const menu = useMenuItems();
  const [activeTab, setActiveTab] = useState<Order['orderType']>('dine-in');
  const [statusTab, setStatusTab] = useState('pending');
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<CartItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [editDeliveryCharges, setEditDeliveryCharges] = useState(0);
  const [editCategory, setEditCategory] = useState('All');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredOrders = orders.filter(o =>
    new Date(o.createdAt) >= today &&
    o.orderType === activeTab &&
    o.orderType !== 'self' &&
    (statusTab === 'pending' ? !['completed', 'cancelled'].includes(o.status) : o.status === statusTab)
  );

  const getCount = (type: Order['orderType'], status: string) =>
    orders.filter(o =>
      new Date(o.createdAt) >= today &&
      o.orderType === type &&
      o.orderType !== 'self' &&
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

  const handleClearOrder = (id: string) => {
    deleteOrder(id);
    toast({ title: 'Order removed' });
  };

  const downloadOrders = (ordersToDownload: Order[], label: string) => {
    const data = JSON.stringify(ordersToDownload, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rabbani_${label}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAllCompleted = () => {
    const toDelete = orders.filter(o => o.status === 'completed' && o.orderType !== 'self');
    if (toDelete.length === 0) { toast({ title: 'No completed orders to clear' }); return; }
    toDelete.forEach(o => deleteOrder(o.id));
    toast({ title: `Cleared ${toDelete.length} completed orders` });
  };

  const handleClearAllCancelled = () => {
    const toDelete = orders.filter(o => o.status === 'cancelled' && o.orderType !== 'self');
    if (toDelete.length === 0) { toast({ title: 'No cancelled orders to clear' }); return; }
    toDelete.forEach(o => deleteOrder(o.id));
    toast({ title: `Cleared ${toDelete.length} cancelled orders` });
  };

  const handleDownloadAll = () => {
    downloadOrders(orders, 'all_orders');
    toast({ title: 'All orders downloaded!' });
  };

  const handleWhatsApp = (order: Order) => {
    if (!order.customerPhone) {
      toast({ title: 'No phone number', variant: 'destructive' });
      return;
    }
    let phone = order.customerPhone.replace(/[^0-9+]/g, '');
    if (phone.startsWith('0')) phone = '92' + phone.slice(1);
    if (!phone.startsWith('+') && !phone.startsWith('92')) phone = '92' + phone;

    const c = loadPrintConfig();
    const itemsList = order.items.map(i => `${i.quantity}x ${i.name} - Rs.${i.price * i.quantity}`).join('\n');
    const template = order.orderType === 'delivery' ? c.waDeliveryTemplate : c.waMessageTemplate;
    const msg = template
      .replace('{orderId}', order.id)
      .replace('{items}', itemsList)
      .replace('{total}', String(order.total))
      .replace('{subtotal}', String(order.subtotal))
      .replace('{customerName}', order.customerName || '')
      .replace('{address}', order.customerAddress || '')
      .replace('{phone}', order.customerPhone || '')
      .replace('{deliveryCharges}', String(order.deliveryCharges || 0));
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  // Edit order
  const handleEditOpen = (order: Order) => {
    setEditOrder(order);
    setEditItems(order.items.map(i => ({ ...i })));
    setEditDeliveryCharges(order.deliveryCharges || 0);
    setEditCustomerName(order.customerName || '');
    setEditCustomerPhone(order.customerPhone || '');
    setEditCustomerAddress(order.customerAddress || '');
    setEditCustomerEmail('');
    setMenuSearch('');
    setEditCategory('All');
  };

  const handleEditQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setEditItems(prev => prev.filter(i => i.id !== id));
    } else {
      setEditItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
    }
  };

  const handleAddMenuItem = (item: MenuItem) => {
    setEditItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleEditSave = () => {
    if (!editOrder || editItems.length === 0) return;
    const subtotal = editItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = editOrder.discount || 0;
    const discountAmt = editOrder.discountType === 'percent' ? Math.round(subtotal * discount / 100) : discount;
    const total = subtotal - discountAmt + editDeliveryCharges;
    updateOrder(editOrder.id, {
      items: editItems,
      subtotal,
      total,
      deliveryCharges: editDeliveryCharges,
      customerName: editCustomerName || undefined,
      customerPhone: editCustomerPhone || undefined,
      customerAddress: editCustomerAddress || undefined,
    });
    toast({ title: 'Order updated!', description: `${editOrder.id} saved` });
    setEditOrder(null);
  };

  // Filtered menu items for search + category
  const searchResults = menu.items.filter(i => {
    const matchSearch = !menuSearch.trim() || i.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchCat = editCategory === 'All' || i.category === editCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">Orders Management</h1>

        <div className="ml-auto flex gap-1 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleDownloadAll} className="h-7 text-xs gap-1">
            <Download className="h-3 w-3" /> Download All
          </Button>
          <Button size="sm" variant="destructive" onClick={handleClearAllCompleted} className="h-7 text-xs gap-1">
            <Trash2 className="h-3 w-3" /> Clear All Completed
          </Button>
          <Button size="sm" variant="destructive" onClick={handleClearAllCancelled} className="h-7 text-xs gap-1">
            <Trash2 className="h-3 w-3" /> Clear All Cancelled
          </Button>
        </div>
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

                <div className="border-t border-border pt-1 space-y-0.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>Rs.{order.subtotal}</span>
                  </div>
                  {(order.extraCharges || 0) > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Extra Charges</span>
                      <span>Rs.{order.extraCharges}</span>
                    </div>
                  )}
                  {(order.deliveryCharges || 0) > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Delivery</span>
                      <span>Rs.{order.deliveryCharges}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Discount</span>
                      <span>-Rs.{order.discountType === 'percent' ? Math.round(order.subtotal * order.discount / 100) : order.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span className="text-secondary">Rs.{order.total}</span>
                  </div>
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
                  {(statusTab === 'completed' || statusTab === 'cancelled') && (
                    <Button size="sm" variant="outline" onClick={() => handleClearOrder(order.id)} className="h-6 text-[10px] gap-0.5 px-2">
                      <Trash2 className="h-2.5 w-2.5" /> Clear
                    </Button>
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Order: {editOrder?.id}</DialogTitle>
            <DialogDescription>Edit items, customer info, then save.</DialogDescription>
          </DialogHeader>

          {/* Customer Info Edit */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            <Input value={editCustomerName} onChange={e => setEditCustomerName(e.target.value)} placeholder="Customer Name" className="h-7 text-xs" />
            <Input value={editCustomerPhone} onChange={e => setEditCustomerPhone(e.target.value)} placeholder="Phone" className="h-7 text-xs" />
            <Input value={editCustomerAddress} onChange={e => setEditCustomerAddress(e.target.value)} placeholder="Address" className="h-7 text-xs" />
            <Input value={editCustomerEmail} onChange={e => setEditCustomerEmail(e.target.value)} placeholder="Email (optional)" className="h-7 text-xs" />
          </div>

          <div className="flex gap-3 flex-1 overflow-hidden min-h-0">
            {/* Left: Menu with search + categories */}
            <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-lg">
              <div className="p-2 border-b border-border space-y-1">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Search menu items..." className="h-8 text-xs pl-7" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {['All', ...menu.categories.filter(c => c !== 'All')].map(cat => (
                    <button key={cat} onClick={() => setEditCategory(cat)}
                      className={`px-2 py-0.5 text-[10px] rounded ${editCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-1 scrollbar-thin">
                <div className="grid grid-cols-2 gap-1">
                  {searchResults.map(item => (
                    <button key={item.id} onClick={() => handleAddMenuItem(item)}
                      className="bg-accent/50 border border-border rounded p-1.5 text-left hover:border-primary hover:bg-accent transition-all active:scale-95">
                      <p className="text-[10px] font-medium leading-tight">{item.name}</p>
                      <p className="text-xs font-bold text-secondary">Rs.{item.price}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Current order items */}
            <div className="w-64 flex flex-col overflow-hidden border border-border rounded-lg">
              <div className="p-2 border-b border-border">
                <h3 className="text-xs font-bold">Order Items ({editItems.length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-1 scrollbar-thin space-y-1">
                {editItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No items</p>}
                {editItems.map(item => (
                  <div key={item.id} className="flex items-center gap-1 bg-card border border-border rounded px-2 py-1">
                    <span className="flex-1 text-[10px] leading-tight">{item.name}</span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleEditQuantity(item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center rounded bg-accent text-xs">
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="w-5 text-center text-[10px] font-bold">{item.quantity}</span>
                      <button onClick={() => handleEditQuantity(item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center rounded bg-accent text-xs">
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-bold w-12 text-right">Rs.{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border space-y-1">
                {editOrder?.orderType === 'delivery' && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Delivery:</span>
                    <Input type="number" value={editDeliveryCharges} onChange={e => setEditDeliveryCharges(Number(e.target.value) || 0)} className="h-6 text-xs w-20" />
                  </div>
                )}
                <div className="text-right text-xs text-muted-foreground">
                  Subtotal: Rs.{editItems.reduce((s, i) => s + i.price * i.quantity, 0)}
                </div>
                {editDeliveryCharges > 0 && (
                  <div className="text-right text-xs text-muted-foreground">
                    Delivery: Rs.{editDeliveryCharges}
                  </div>
                )}
                <div className="text-right font-bold text-secondary text-sm">
                  Total: Rs.{editItems.reduce((s, i) => s + i.price * i.quantity, 0) + editDeliveryCharges}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={editItems.length === 0}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
