import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuGrid } from '@/components/MenuGrid';
import { CartPanel } from '@/components/CartPanel';
import { OrderTypeSelector } from '@/components/OrderTypeSelector';
import { PrintBill } from '@/components/PrintBill';
import { PrintToken } from '@/components/PrintToken';
import { PrintSettings } from '@/components/PrintSettings';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useCustomers } from '@/hooks/useCustomers';
import { useStaffAndTables } from '@/hooks/useStaffAndTables';
import { MenuManager } from '@/components/MenuManager';
import { CustomerManager } from '@/components/CustomerManager';
import { StaffTableManager } from '@/components/StaffTableManager';
import { Order, MenuItem } from '@/lib/menu';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIAgentPanel, AIAgentButton } from '@/components/AIAgentPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Phone, BarChart3, ClipboardList, Sun, Moon, Plus, X, Clock, MessageSquare, User, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { loadPOSConfig } from '@/pages/POSSettings';
import { buildTokenHtml, dispatchPrint } from '@/lib/printing';

const Index = () => {
  const navigate = useNavigate();
  const cart = useCart();
  const { isDayOpen, currentSession, startDay, endDay, addOrder, getTodayStats, clearNonSelfOrders, orders } = useOrders();
  const menu = useMenuItems();
  const { customers, searchByPhone, saveCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const staff = useStaffAndTables();
  const [phoneSuggestions, setPhoneSuggestions] = useState<ReturnType<typeof searchByPhone>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const phoneInputRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pay-later'>('paid');

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
  const posConfig = loadPOSConfig();
  const handleItemClick = (item: MenuItem) => {
    if (!isDayOpen) {
      toast({ title: 'Day not started', description: 'Please start the day first!', variant: 'destructive' });
      return;
    }
    cart.addItem(item);
    // Per-item auto token: prints a token containing ONLY this item.
    if (item.autoPrintToken && item.showOnToken !== false) {
      const tokenOrder: Order = {
        id: `T-${Date.now().toString().slice(-5)}`,
        items: [{ ...item, quantity: 1 }],
        orderType: cart.orderType as Order['orderType'],
        tableNumber: cart.orderType === 'dine-in' ? cart.tableNumber : undefined,
        discount: 0,
        discountType: 'percent',
        subtotal: item.price,
        total: item.price,
        status: 'pending',
        paymentStatus: 'paid',
        createdAt: new Date(),
      };
      const where = dispatchPrint(buildTokenHtml(tokenOrder), `Token ${item.name}`);
      if (where === 'remote') toast({ title: 'Token sent to main printer' });
    }
  };


  const handleNewOrder = () => {
    cart.clearCart();
    setPaymentStatus('paid');
    setLastOrder(null);
  };

  const handlePhoneChange = (phone: string) => {
    cart.setCustomerPhone(phone);
    // If phone is cleared or shortened, clear related fields
    if (phone.length < 7) {
      if (phone.length < 4) {
        cart.setCustomerName('');
        cart.setCustomerAddress('');
        cart.setDeliveryCharges(0);
      }
      setPhoneSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = searchByPhone(phone);
    if (matches.length > 0) {
      setPhoneSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setPhoneSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCustomer = (customer: { phone: string; name: string; address: string; deliveryCharges?: number }) => {
    cart.setCustomerPhone(customer.phone);
    cart.setCustomerName(customer.name);
    cart.setCustomerAddress(customer.address);
    if (customer.deliveryCharges) cart.setDeliveryCharges(customer.deliveryCharges);
    setPhoneSuggestions([]);
    setShowSuggestions(false);
  };

  const handleCloseOrder = () => {
    if (cart.items.length === 0) {
      toast({ title: 'Empty cart', description: 'Add items first', variant: 'destructive' });
      return;
    }
    if (cart.orderType === 'delivery' && (!cart.customerPhone || !cart.customerAddress)) {
      toast({ title: 'Missing info', description: 'Enter phone & address for delivery', variant: 'destructive' });
      return;
    }
    if (cart.orderType === 'dine-in' && !cart.tableNumber) {
      toast({ title: 'Missing table', description: 'Enter table number', variant: 'destructive' });
      return;
    }

    if (['delivery', 'takeout', 'car'].includes(cart.orderType) && cart.customerPhone) {
      saveCustomer({ name: cart.customerName, phone: cart.customerPhone, address: cart.customerAddress, deliveryCharges: cart.orderType === 'delivery' ? cart.deliveryCharges : undefined });
    }

    const orderData: Omit<Order, 'id' | 'createdAt'> = {
      items: cart.items,
      orderType: cart.orderType as Order['orderType'],
      tableNumber: cart.orderType === 'dine-in' ? cart.tableNumber : undefined,
      customerName: cart.customerName || undefined,
      customerPhone: cart.customerPhone || undefined,
      customerAddress: cart.orderType === 'delivery' ? cart.customerAddress : undefined,
      deliveryCharges: cart.orderType === 'delivery' ? cart.deliveryCharges : undefined,
      riderName: cart.orderType === 'delivery' ? cart.riderName || undefined : undefined,
      waiterName: cart.orderType === 'dine-in' ? cart.waiterName || undefined : undefined,
      discount: cart.discount,
      discountType: cart.discountType,
      subtotal: cart.subtotal,
      total: cart.total + (cart.orderType === 'delivery' ? cart.deliveryCharges : 0),
      extraCharges: cart.extraCharges,
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
    clearNonSelfOrders();
    setShowEndDayDialog(false);
    setClosingCash('');
    toast({ title: 'Day ended!', description: 'All orders cleared (except Self-Service)' });
  };

  agent.setCallbacks({
    addItem: cart.addItem,
    removeItem: cart.removeItem,
    clearCart: cart.clearCart,
    setOrderType: (type) => cart.setOrderType(type),
    setCustomerName: cart.setCustomerName,
    setCustomerPhone: cart.setCustomerPhone,
    setCustomerAddress: cart.setCustomerAddress,
    setTableNumber: cart.setTableNumber,
    setRiderName: cart.setRiderName,
    setWaiterName: cart.setWaiterName,
    setDiscount: cart.setDiscount,
    setDiscountType: cart.setDiscountType,
    setDeliveryCharges: cart.setDeliveryCharges,
    setPaymentStatus: (s) => setPaymentStatus(s as any),
    closeOrder: handleCloseOrder,
    newOrder: handleNewOrder,
    menuItems: menu.items,
    cartItems: cart.items,
    orderType: cart.orderType,
  });

  const stats = getTodayStats();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const occupiedTables = orders.filter(o => o.orderType === 'dine-in' && o.status === 'pending' && new Date(o.createdAt) >= today).map(o => o.tableNumber).filter(Boolean) as string[];
  const previewOrder: Order | null = cart.items.length > 0 ? {
    id: `PREVIEW`,
    items: cart.items,
    orderType: cart.orderType as Order['orderType'],
    tableNumber: cart.orderType === 'dine-in' ? cart.tableNumber : undefined,
    customerName: cart.customerName || undefined,
    customerPhone: cart.customerPhone || undefined,
    customerAddress: cart.orderType === 'delivery' ? cart.customerAddress : undefined,
    deliveryCharges: cart.orderType === 'delivery' ? cart.deliveryCharges : undefined,
    discount: cart.discount,
    discountType: cart.discountType,
    subtotal: cart.subtotal,
    total: cart.total + (cart.orderType === 'delivery' ? cart.deliveryCharges : 0),
    extraCharges: cart.extraCharges,
    status: 'pending',
    paymentStatus,
    createdAt: new Date(),
  } : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {posConfig.shopLogo && <img src={posConfig.shopLogo} alt="Logo" className="w-8 h-8 rounded object-contain" />}
          <h1 className="text-lg font-bold text-primary tracking-tight">{posConfig.shopName}</h1>
          <span className="text-xs text-muted-foreground">{posConfig.shopTagline}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <VoiceCommandButton isListening={voice.isListening} transcript={voice.transcript} isSupported={voice.isSupported} onToggle={voice.toggleListening} />
          <AIAgentButton isActive={agent.isAgentMode} onClick={() => agent.setIsAgentMode(!agent.isAgentMode)} />
          <MenuManager items={menu.items} categories={menu.categories} onAddItem={menu.addItem} onUpdateItem={menu.updateItem} onDeleteItem={menu.deleteItem} onReset={menu.resetToDefault} onAddCategory={menu.addCategory} />
          <CustomerManager customers={customers} onUpdate={updateCustomer} onDelete={deleteCustomer} />
          <StaffTableManager tables={staff.tables} waiters={staff.waiters} riders={staff.riders}
            onAddTable={staff.addTable} onRemoveTable={staff.removeTable} onEditTable={staff.editTable}
            onAddWaiter={staff.addWaiter} onRemoveWaiter={staff.removeWaiter} onEditWaiter={staff.editWaiter}
            onAddRider={staff.addRider} onRemoveRider={staff.removeRider} onEditRider={staff.editRider} />
          <Button variant="outline" size="sm" onClick={() => navigate('/orders')} className="gap-1 h-8 text-xs">
            <ClipboardList className="h-3.5 w-3.5" /> Orders
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/self-service')} className="gap-1 h-8 text-xs">
            <User className="h-3.5 w-3.5" /> Self Service
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')} className="gap-1 h-8 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Reports
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/whatsapp-settings')} className="gap-1 h-8 text-xs">
            <MessageSquare className="h-3.5 w-3.5" /> WA
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/pos-settings')} className="gap-1 h-8 text-xs">
            <Store className="h-3.5 w-3.5" /> POS
          </Button>
          <PrintSettings />

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
            <span>{posConfig.shopPhone}</span>
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
              deliveryCharges={cart.deliveryCharges}
              extraCharges={cart.extraCharges}
              onQuantityChange={cart.updateQuantity}
              onRemoveItem={cart.removeItem}
              onDiscountChange={cart.setDiscount}
              onDiscountTypeChange={cart.setDiscountType}
              onDeliveryChargesChange={cart.setDeliveryCharges}
              onExtraChargesChange={cart.setExtraCharges}
              onAddItem={cart.addItem}
              showDelivery={cart.orderType === 'delivery'}
            />
          </div>

          <div className="w-72 space-y-2">
            <OrderTypeSelector value={cart.orderType as any} onChange={(t) => cart.setOrderType(t)} />

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

            {cart.orderType === 'dine-in' && (
              <div className="space-y-1">
                {/* Table selector */}
                <div className="flex flex-wrap gap-1">
                  {staff.tables.map(t => {
                    const isOccupied = occupiedTables.includes(t) && cart.tableNumber !== t;
                    return (
                      <button key={t} disabled={isOccupied}
                        onClick={() => cart.setTableNumber(t)}
                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                          cart.tableNumber === t ? 'bg-primary text-primary-foreground border-primary' :
                          isOccupied ? 'bg-destructive/10 text-destructive border-destructive/30 cursor-not-allowed opacity-60' :
                          'bg-accent border-border hover:bg-muted'
                        }`}
                      >
                        T{t}{isOccupied ? ' ●' : ''}
                      </button>
                    );
                  })}
                </div>
                {/* Waiter selector */}
                {staff.waiters.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {staff.waiters.map(w => (
                      <button key={w} onClick={() => cart.setWaiterName(w)}
                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                          cart.waiterName === w ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent border-border hover:bg-muted'
                        }`}
                      >{w}</button>
                    ))}
                  </div>
                ) : (
                  <Input placeholder="Waiter (optional)" value={cart.waiterName} onChange={e => cart.setWaiterName(e.target.value)} className="h-7 text-xs" />
                )}
              </div>
            )}

            {['delivery', 'takeout', 'car'].includes(cart.orderType) && (
              <div className="space-y-1">
                <Input placeholder="Customer Name" value={cart.customerName} onChange={e => cart.setCustomerName(e.target.value)} className="h-7 text-xs" />
                <div className="relative" ref={phoneInputRef}>
                  <Input placeholder="Phone" value={cart.customerPhone} onChange={e => handlePhoneChange(e.target.value)} className="h-7 text-xs" />
                  {showSuggestions && phoneSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded shadow-lg max-h-32 overflow-y-auto">
                      {phoneSuggestions.map((c, i) => (
                        <button key={i} onClick={() => handleSelectCustomer(c)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent border-b border-border">
                          <span className="font-medium">{c.name}</span> — <span className="text-muted-foreground">{c.phone}</span>
                          {c.address && <span className="block text-muted-foreground text-[10px]">{c.address}</span>}
                          {c.deliveryCharges ? <span className="text-[10px] text-secondary"> Delivery: Rs.{c.deliveryCharges}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {cart.orderType === 'delivery' && (
                  <>
                    <Input placeholder="Address" value={cart.customerAddress} onChange={e => cart.setCustomerAddress(e.target.value)} className="h-7 text-xs" />
                    {/* Rider selector */}
                    {staff.riders.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {staff.riders.map(r => (
                          <button key={r} onClick={() => cart.setRiderName(r)}
                            className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                              cart.riderName === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent border-border hover:bg-muted'
                            }`}
                          >{r}</button>
                        ))}
                      </div>
                    ) : (
                      <Input placeholder="Rider (optional)" value={cart.riderName} onChange={e => cart.setRiderName(e.target.value)} className="h-7 text-xs" />
                    )}
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
