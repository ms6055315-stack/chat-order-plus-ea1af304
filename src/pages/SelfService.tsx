import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuGrid } from '@/components/MenuGrid';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useCart } from '@/hooks/useCart';
import { PrintBill } from '@/components/PrintBill';
import { PrintToken } from '@/components/PrintToken';
import { Order, CartItem, MenuItem } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Minus, Plus, Trash2, Check, X, Calculator, Edit2, Search } from 'lucide-react';
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

  // Extra charges keypad
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadValue, setKeypadValue] = useState('');
  const [selfExtraCharges, setSelfExtraCharges] = useState(0);

  // Edit order
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<CartItem[]>([]);
  const [editSearch, setEditSearch] = useState('');
  const [editCategory, setEditCategory] = useState('All');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editExtraCharges, setEditExtraCharges] = useState(0);

  const handleKeypadPress = (key: string) => {
    if (key === 'C') { setKeypadValue(''); return; }
    if (key === '⌫') { setKeypadValue(prev => prev.slice(0, -1)); return; }
    if (key === 'OK') {
      setSelfExtraCharges(Number(keypadValue) || 0);
      setShowKeypad(false);
      setKeypadValue('');
      return;
    }
    setKeypadValue(prev => prev + key);
  };

  const handlePlaceOrder = () => {
    if (cart.items.length === 0) return;
    const extraTotal = selfExtraCharges;
    const order: Order = {
      id: `SELF-${Date.now().toString(36).toUpperCase()}`,
      items: cart.items,
      orderType: 'self',
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      discount: cart.discount,
      discountType: cart.discountType,
      subtotal: cart.subtotal,
      total: cart.total + extraTotal,
      extraCharges: extraTotal || undefined,
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
    setSelfExtraCharges(0);
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

  const openEditOrder = (order: Order) => {
    setEditOrder(order);
    setEditItems([...order.items]);
    setEditName(order.customerName || '');
    setEditPhone(order.customerPhone || '');
    setEditExtraCharges(order.extraCharges || 0);
    setEditSearch('');
    setEditCategory('All');
  };

  const handleEditAddItem = (item: MenuItem) => {
    const existing = editItems.find(i => i.id === item.id);
    if (existing) {
      setEditItems(editItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setEditItems([...editItems, { ...item, quantity: 1 }]);
    }
  };

  const handleEditSave = () => {
    if (!editOrder) return;
    const subtotal = editItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const updated = selfOrders.map(o => o.id === editOrder.id ? {
      ...o,
      items: editItems,
      customerName: editName || undefined,
      customerPhone: editPhone || undefined,
      subtotal,
      total: subtotal + (editExtraCharges || 0),
      extraCharges: editExtraCharges || undefined,
    } : o);
    setSelfOrders(updated);
    saveSelfOrders(updated);
    setEditOrder(null);
    toast({ title: 'Order updated!' });
  };

  const editMenuFiltered = menu.items.filter(i =>
    (editCategory === 'All' || i.category === editCategory) &&
    (!editSearch || i.name.toLowerCase().includes(editSearch.toLowerCase()))
  );

  const getCount = (status: string) =>
    selfOrders.filter(o => status === 'pending' ? !['completed', 'cancelled'].includes(o.status) : o.status === status).length;

  const filteredSelfOrders = selfOrders.filter(o =>
    statusTab === 'pending' ? !['completed', 'cancelled'].includes(o.status) : o.status === statusTab
  );

  const selfTotal = cart.total + selfExtraCharges;

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
          <div className="border-b border-border p-2 bg-card/50">
            <div className="flex items-center gap-2 flex-wrap">
              <Input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-7 text-xs w-36" />
              <Input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-7 text-xs w-32" />

              <Button variant="outline" size="sm" onClick={() => { setKeypadValue(String(selfExtraCharges || '')); setShowKeypad(true); }} className="h-7 text-xs gap-1 px-2">
                <Calculator className="h-3 w-3" /> Extra: Rs.{selfExtraCharges || 0}
              </Button>

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
                  {selfExtraCharges > 0 && <span className="text-xs text-muted-foreground">Sub: Rs.{cart.total} + Extra: Rs.{selfExtraCharges}</span>}
                  <span className="font-bold text-secondary">Rs.{selfTotal}</span>
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
                    {(order.extraCharges || 0) > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Extra Charges</span>
                        <span>Rs.{order.extraCharges}</span>
                      </div>
                    )}
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
                          <Button size="sm" variant="outline" onClick={() => openEditOrder(order)} className="h-6 text-[10px] gap-0.5 px-2">
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
                      <PrintToken order={order} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extra Charges Keypad */}
      <Dialog open={showKeypad} onOpenChange={setShowKeypad}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Extra Charges</DialogTitle></DialogHeader>
          <div className="text-center text-2xl font-bold py-2 bg-accent rounded mb-2">
            Rs.{keypadValue || '0'}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(key => (
              <button key={key} onClick={() => handleKeypadPress(key)}
                className="h-12 rounded-lg bg-accent hover:bg-muted text-lg font-bold transition-colors">
                {key}
              </button>
            ))}
          </div>
          <Button onClick={() => handleKeypadPress('OK')} className="w-full mt-2">Set Extra Charges</Button>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={!!editOrder} onOpenChange={open => !open && setEditOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Order {editOrder?.id}</DialogTitle></DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Customer Name" value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-xs" />
              <Input placeholder="Phone" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="h-8 text-xs" />
            </div>

            <div>
              <label className="text-xs font-medium">Extra Charges: Rs.{editExtraCharges}</label>
              <Input type="number" value={editExtraCharges || ''} onChange={e => setEditExtraCharges(Number(e.target.value) || 0)} className="h-8 text-xs mt-1" placeholder="0" />
            </div>

            {/* Current items */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Order Items</label>
              {editItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-xs bg-accent rounded px-2 py-1">
                  <span className="flex-1">{item.name}</span>
                  <span className="text-muted-foreground">Rs.{item.price}</span>
                  <button onClick={() => setEditItems(editItems.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="w-5 h-5 flex items-center justify-center rounded bg-card"><Minus className="h-3 w-3" /></button>
                  <span className="font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => setEditItems(editItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))} className="w-5 h-5 flex items-center justify-center rounded bg-card"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => setEditItems(editItems.filter(i => i.id !== item.id))} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>

            {/* Add items */}
            <div className="space-y-2">
              <div className="flex gap-1 items-center">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search menu..." value={editSearch} onChange={e => setEditSearch(e.target.value)} className="h-7 text-xs flex-1" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {['All', ...menu.categories.filter(c => c !== 'All')].map(cat => (
                  <button key={cat} onClick={() => setEditCategory(cat)} className={`px-2 py-0.5 text-[10px] rounded ${editCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="max-h-32 overflow-y-auto grid grid-cols-2 gap-1">
                {editMenuFiltered.slice(0, 20).map(item => (
                  <button key={item.id} onClick={() => handleEditAddItem(item)} className="text-left px-2 py-1 text-xs bg-card border border-border rounded hover:bg-accent">
                    {item.name} - Rs.{item.price}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right font-bold text-secondary">
              Total: Rs.{editItems.reduce((s, i) => s + i.price * i.quantity, 0) + editExtraCharges}
            </div>
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
