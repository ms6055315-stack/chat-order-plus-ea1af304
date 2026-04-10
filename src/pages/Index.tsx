import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuGrid } from '@/components/MenuGrid';
import { CartPanel } from '@/components/CartPanel';
import { OrderTypeSelector } from '@/components/OrderTypeSelector';
import { PrintBill } from '@/components/PrintBill';
import { PrintToken } from '@/components/PrintToken';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useCustomers } from '@/hooks/useCustomers';
import { MenuManager } from '@/components/MenuManager';
import { CustomerManager } from '@/components/CustomerManager';
import { Order, MenuItem } from '@/lib/menu';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIAgentPanel, AIAgentButton } from '@/components/AIAgentPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Phone, BarChart3, ClipboardList, Sun, Moon, Plus, X, Clock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const cart = useCart();
  const { isDayOpen, currentSession, startDay, endDay, addOrder, getTodayStats } = useOrders();
  const menu = useMenuItems();
  const { customers, searchByPhone, saveCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [phoneSuggestions, setPhoneSuggestions] = useState<ReturnType<typeof searchByPhone>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const phoneInputRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderType, setOrderType] = useState<Order['orderType']>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pay-later'>('paid');
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [riderName, setRiderName] = useState('');
  const [waiterName, setWaiterName] = useState('');

  const [showStartDayDialog, setShowStartDayDialog] = useState(false);
  const [showEndDayDialog, setShowEndDayDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const voice = useVoiceCommand({
    menuItems: menu.items,
    onItemFound: (item) => {
      if (!isDayOpen) {
        toast({ title: 'Day not started', description: 'Please start the day first!', variant: 'destructive' });
        return;
      }
      cart.addItem(item);
      toast({ title: `Added ${item.name}`, description: `Rs.${item.price}` });
    },
  });

  const agent = useAIAgent();

  const handleItemClick = (item: MenuItem) => {
    if (!isDayOpen) {
      toast({ title: 'Day not started', description: 'Please start the day first!', variant: 'destructive' });
      return;
    }
    cart.addItem(item);
  };

  const handleNewOrder = () => {
    cart.clearCart();
    setOrderType('dine-in');
    setTableNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setDeliveryCharges(0);
    setPaymentStatus('paid');
    setRiderName('');
    setWaiterName('');
    setLastOrder(null);
  };

  const handlePhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    if (phone.length < 7) {
      setPhoneSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = searchByPhone(phone);
    if (matches.length === 1) {
      setCustomerName(matches[0].name);
      setCustomerAddress(matches[0].address);
      setPhoneSuggestions([]);
      setShowSuggestions(false);
      toast({ title: 'Customer found!', description: `${matches[0].name}` });
    } else if (matches.length > 1) {
      setPhoneSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setPhoneSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCustomer = (customer: { phone: string; name: string; address: string }) => {
    setCustomerPhone(customer.phone);
    setCustomerName(customer.name);
    setCustomerAddress(customer.address);
    setPhoneSuggestions([]);
    setShowSuggestions(false);
  };

  const handleCloseOrder = () => {
    if (cart.items.length === 0) {
      toast({ title: 'Empty cart', description: 'Add items first', variant: 'destructive' });
      return;
    }
    if (orderType === 'delivery' && (!customerPhone || !customerAddress)) {
      toast({ title: 'Missing info', description: 'Enter phone & address for delivery', variant: 'destructive' });
      return;
    }
    if (orderType === 'dine-in' && !tableNumber) {
      toast({ title: 'Missing table', description: 'Enter table number', variant: 'destructive' });
      return;
    }

    if (['delivery', 'takeout', 'car'].includes(orderType) && customerPhone) {
      saveCustomer({ name: customerName, phone: customerPhone, address: customerAddress });
    }

    const orderData: Omit<Order, 'id' | 'createdAt'> = {
      items: cart.items,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: orderType === 'delivery' ? customerAddress : undefined,
      deliveryCharges: orderType === 'delivery' ? deliveryCharges : undefined,
      riderName: orderType === 'delivery' ? riderName || undefined : undefined,
      waiterName: orderType === 'dine-in' ? waiterName || undefined : undefined,
      discount: cart.discount,
      discountType: cart.discountType,
      subtotal: cart.subtotal,
      total: cart.total + (orderType === 'delivery' ? deliveryCharges : 0),
      status: 'pending',
      paymentStatus,
    };

    const newOrder = addOrder(orderData);
    setLastOrder(newOrder);
    toast({ title: 'Order placed!', description: `${newOrder.id} - Rs.${newOrder.total}` });
    handleNewOrder();
  };

  const handleStartDay = () => {
    const cash = parseFloat(openingCash);
    if (isNaN(cash) || cash < 0) return;
    startDay(cash);
    setShowStartDayDialog(false);
    setOpeningCash('');
    toast({ title: 'Day started!', description: `Opening cash: Rs.${cash}` });
  };

  const handleEndDay = () => {
    const cash = parseFloat(closingCash);
    if (isNaN(cash) || cash < 0) return;
    endDay(cash);
    setShowEndDayDialog(false);
    setClosingCash('');
    toast({ title: 'Day ended!', description: 'Session closed' });
  };

  agent.setCallbacks({
    addItem: cart.addItem,
    removeItem: cart.removeItem,
    clearCart: cart.clearCart,
    setOrderType: (type) => setOrderType(type as any),
    setCustomerName,
    setCustomerPhone,
    setCustomerAddress,
    setTableNumber,
    setRiderName,
    setWaiterName,
    setDiscount: cart.setDiscount,
    setDiscountType: cart.setDiscountType,
    setDeliveryCharges,
    setPaymentStatus: (s) => setPaymentStatus(s as any),
    closeOrder: handleCloseOrder,
    newOrder: handleNewOrder,
    menuItems: menu.items,
    cartItems: cart.items,
    orderType,
  });

  const stats = getTodayStats();
  const previewOrder: Order | null = cart.items.length > 0 ? {
    id: `PREVIEW`,
    items: cart.items,
    orderType,
    tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
    customerName: customerName || undefined,
    customerPhone: customerPhone || undefined,
    customerAddress: orderType === 'delivery' ? customerAddress : undefined,
    deliveryCharges: orderType === 'delivery' ? deliveryCharges : undefined,
    discount: cart.discount,
    discountType: cart.discountType,
    subtotal: cart.subtotal,
    total: cart.total + (orderType === 'delivery' ? deliveryCharges : 0),
    status: 'pending',
    paymentStatus,
    createdAt: new Date(),
  } : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary tracking-tight">RABBANI</h1>
          <span className="text-xs text-muted-foreground">Fast Food POS</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <VoiceCommandButton isListening={voice.isListening} transcript={voice.transcript} isSupported={voice.isSupported} onToggle={voice.toggleListening} />
          <AIAgentButton isActive={agent.isAgentMode} onClick={() => agent.setIsAgentMode(!agent.isAgentMode)} />
          <MenuManager items={menu.items} categories={menu.categories} onAddItem={menu.addItem} onUpdateItem={menu.updateItem} onDeleteItem={menu.deleteItem} onReset={menu.resetToDefault} />
          <CustomerManager customers={customers} onUpdate={updateCustomer} onDelete={deleteCustomer} />
          <Button variant="outline" size="sm" onClick={() => navigate('/orders')} className="gap-1 h-8 text-xs">
            <ClipboardList className="h-3.5 w-3.5" /> Orders
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/self-service')} className="gap-1 h-8 text-xs">
            <User className="h-3.5 w-3.5" /> Self Service
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')} className="gap-1 h-8 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Reports
          </Button>

          {!isDayOpen ? (
            <Button size="sm" onClick={() => setShowStartDayDialog(true)} className="gap-1 h-8 text-xs bg-success hover:bg-success/90 text-success-foreground">
              <Sun className="h-3.5 w-3.5" /> Start Day
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setShowEndDayDialog(true)} className="gap-1 h-8 text-xs">
              <Moon className="h-3.5 w-3.5" /> End Day
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(previewOrder || lastOrder) && (
            <div className="flex gap-1">
              <PrintBill order={(previewOrder || lastOrder)!} />
              <PrintToken order={(previewOrder || lastOrder)!} />
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>0307-1203000</span>
          </div>
        </div>
      </header>

      {/* Cart & Order Panel */}
      <div className="border-b border-border p-2 bg-card/50">
        <div className="flex gap-3">
          <div className="flex-1">
            <CartPanel
              items={cart.items}
              discount={cart.discount}
              discountType={cart.discountType}
              subtotal={cart.subtotal}
              discountAmount={cart.discountAmount}
              total={cart.total}
              deliveryCharges={deliveryCharges}
              onQuantityChange={cart.updateQuantity}
              onRemoveItem={cart.removeItem}
              onDiscountChange={cart.setDiscount}
              onDiscountTypeChange={cart.setDiscountType}
              onDeliveryChargesChange={setDeliveryCharges}
              onAddItem={cart.addItem}
              showDelivery={orderType === 'delivery'}
            />
          </div>

          <div className="w-72 space-y-2">
            <OrderTypeSelector value={orderType} onChange={setOrderType} />

            <div className="flex gap-1">
              <Button
                variant={paymentStatus === 'paid' ? 'default' : 'outline'}
                size="sm" onClick={() => setPaymentStatus('paid')} className="flex-1 h-7 text-xs"
              >Paid</Button>
              <Button
                variant={paymentStatus === 'pay-later' ? 'default' : 'outline'}
                size="sm" onClick={() => setPaymentStatus('pay-later')} className="flex-1 h-7 text-xs gap-1"
              ><Clock className="h-3 w-3" /> Pay Later</Button>
            </div>

            {orderType === 'dine-in' && (
              <div className="space-y-1">
                <Input placeholder="Table Number" value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="h-7 text-xs" />
                <Input placeholder="Waiter (optional)" value={waiterName} onChange={e => setWaiterName(e.target.value)} className="h-7 text-xs" />
              </div>
            )}

            {['delivery', 'takeout', 'car'].includes(orderType) && (
              <div className="space-y-1">
                <Input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-7 text-xs" />
                <div className="relative" ref={phoneInputRef}>
                  <Input placeholder="Phone" value={customerPhone} onChange={e => handlePhoneChange(e.target.value)} className="h-7 text-xs" />
                  {showSuggestions && phoneSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded shadow-lg max-h-32 overflow-y-auto">
                      {phoneSuggestions.map((c, i) => (
                        <button key={i} onClick={() => handleSelectCustomer(c)} className="w-full text-left px-2 py-1 text-xs hover:bg-accent border-b border-border">
                          <span className="font-medium">{c.name}</span> <span className="text-muted-foreground">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {orderType === 'delivery' && (
                  <>
                    <Input placeholder="Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="h-7 text-xs" />
                    <Input placeholder="Rider (optional)" value={riderName} onChange={e => setRiderName(e.target.value)} className="h-7 text-xs" />
                  </>
                )}
              </div>
            )}

            <div className="flex gap-1">
              <Button variant="outline" onClick={handleNewOrder} className="flex-1 h-8 text-xs gap-1">
                <Plus className="h-3 w-3" /> New
              </Button>
              <Button onClick={handleCloseOrder} disabled={cart.items.length === 0 || !isDayOpen} className="flex-1 h-8 text-xs gap-1">
                <X className="h-3 w-3" /> Close Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <main className="flex-1 overflow-hidden">
        <MenuGrid onItemClick={handleItemClick} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} items={menu.items} categories={menu.categories} />
      </main>

      {/* Dialogs */}
      <Dialog open={showStartDayDialog} onOpenChange={setShowStartDayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start Day</DialogTitle></DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Opening Cash (Rs.)</label>
            <Input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)} placeholder="Enter opening cash" className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDayDialog(false)}>Cancel</Button>
            <Button onClick={handleStartDay}>Start Day</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEndDayDialog} onOpenChange={setShowEndDayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>End Day Summary</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted p-3 rounded">
                <p className="text-muted-foreground text-xs">Opening Cash</p>
                <p className="text-lg font-bold">Rs.{currentSession?.openingCash || 0}</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-muted-foreground text-xs">Total Orders</p>
                <p className="text-lg font-bold">{stats.ordersCount}</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-muted-foreground text-xs">Gross Sales</p>
                <p className="text-lg font-bold">Rs.{stats.grossSales}</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-muted-foreground text-xs">Net Sales</p>
                <p className="text-lg font-bold text-secondary">Rs.{stats.netSales}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Closing Cash (Rs.)</label>
              <Input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)} placeholder="Enter closing cash" className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDayDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleEndDay}>End Day</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {agent.isAgentMode && (
        <AIAgentPanel
          messages={agent.messages}
          isLoading={agent.isLoading}
          isListening={agent.isListening}
          isVoiceSupported={agent.isVoiceSupported}
          onSendMessage={agent.sendMessage}
          onStartVoice={agent.startVoiceInput}
          onStopVoice={agent.stopVoiceInput}
          onClear={agent.clearMessages}
          onClose={() => agent.setIsAgentMode(false)}
        />
      )}
    </div>
  );
};

export default Index;
