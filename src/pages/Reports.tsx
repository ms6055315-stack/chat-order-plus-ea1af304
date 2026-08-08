import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Printer, Calendar } from 'lucide-react';
import { loadPOSConfig } from '@/pages/POSSettings';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const [categorySearch, setCategorySearch] = useState('');
  const [tab, setTab] = useState<'summary' | 'category'>('summary');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const posConfig = loadPOSConfig();

  // Filter orders for the selected date
  const reportDate = new Date(selectedDate);
  reportDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(reportDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const allOrders = orders.filter(o => o.orderType !== 'self');
  const filteredOrders = allOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= reportDate && d < nextDate;
  });

  const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'pending');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');
  const totalSales = completedOrders.reduce((s, o) => s + o.total, 0);
  
  const byType = {
    'dine-in': completedOrders.filter(o => o.orderType === 'dine-in'),
    'takeout': completedOrders.filter(o => o.orderType === 'takeout'),
    'delivery': completedOrders.filter(o => o.orderType === 'delivery'),
    'car': completedOrders.filter(o => o.orderType === 'car'),
  };

  const categoryMap: Record<string, { items: Record<string, { name: string; qty: number; revenue: number }>; totalQty: number; totalRevenue: number }> = {};
  completedOrders.forEach(order => {
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

  const printReport = () => {
    const html = `
      <html><head><title>Sales Report - ${selectedDate}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 11px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .total-row { font-weight: bold; background: #f0f0f0; }
        .section { margin: 16px 0; }
        .section-title { font-size: 13px; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px; }
      </style></head><body>
      <h1>${posConfig.shopName} - Sales Report</h1>
      <div class="subtitle">Date: ${selectedDate} | Printed: ${new Date().toLocaleString()}</div>
      
      <div class="section">
        <div class="section-title">Summary</div>
        <table>
          <tr><td>Total Orders</td><td><strong>${completedOrders.length}</strong></td></tr>
          <tr><td>Total Sales</td><td><strong>Rs.${totalSales}</strong></td></tr>
          <tr><td>Cancelled Orders</td><td>${cancelledOrders.length}</td></tr>
          <tr><td>Average Order</td><td>Rs.${completedOrders.length ? Math.round(totalSales / completedOrders.length) : 0}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">By Order Type</div>
        <table>
          <tr><th>Type</th><th>Orders</th><th>Sales</th></tr>
          ${Object.entries(byType).map(([type, typeOrders]) => `
            <tr><td style="text-transform:capitalize">${type}</td><td>${typeOrders.length}</td><td>Rs.${typeOrders.reduce((s, o) => s + o.total, 0)}</td></tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <div class="section-title">Sales by Category</div>
        ${Object.entries(categoryMap).sort((a, b) => b[1].totalRevenue - a[1].totalRevenue).map(([cat, data]) => `
          <table>
            <tr class="total-row"><td colspan="3">${cat} — ${data.totalQty} items — Rs.${data.totalRevenue}</td></tr>
            <tr><th>Item</th><th>Qty</th><th>Revenue</th></tr>
            ${Object.values(data.items).sort((a, b) => b.revenue - a.revenue).map(item => `
              <tr><td>${item.name}</td><td>${item.qty}</td><td>Rs.${item.revenue}</td></tr>
            `).join('')}
          </table>
        `).join('')}
      </div>

      <div class="section">
        <div class="section-title">Order List</div>
        <table>
          <tr><th>ID</th><th>Type</th><th>Status</th><th>Total</th><th>Time</th></tr>
          ${filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(o => `
            <tr><td>${o.id}</td><td style="text-transform:capitalize">${o.orderType}</td><td>${o.status}</td><td>Rs.${o.total}</td><td>${new Date(o.createdAt).toLocaleTimeString()}</td></tr>
          `).join('')}
        </table>
      </div>
      </body></html>`;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument?.write(html);
    iframe.contentDocument?.close();
    setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 1000); }, 300);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border p-2 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1 h-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary hidden md:block">Sales Report</h1>
        
        <div className="flex items-center gap-2 ml-auto md:ml-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 text-xs w-36"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="flex gap-1 ml-2">
          <Button variant={tab === 'summary' ? 'default' : 'outline'} size="sm" onClick={() => setTab('summary')} className="h-7 text-xs px-2 md:px-3">Summary</Button>
          <Button variant={tab === 'category' ? 'default' : 'outline'} size="sm" onClick={() => setTab('category')} className="h-7 text-xs px-2 md:px-3">By Category</Button>
        </div>
        
        <Button variant="outline" size="sm" onClick={printReport} className="ml-auto gap-1 h-7 text-xs">
          <Printer className="h-3.5 w-3.5" /> Print
        </Button>
      </header>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Report for {new Date(selectedDate).toLocaleDateString()}</h2>
          <span className="text-xs text-muted-foreground">Showing history from last 40 days</span>
        </div>

        {tab === 'summary' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{completedOrders.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-secondary">Rs.{totalSales}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-destructive">{cancelledOrders.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Avg Order</p>
                <p className="text-2xl font-bold">Rs.{completedOrders.length ? Math.round(totalSales / completedOrders.length) : 0}</p>
              </div>
            </div>

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

            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-sm font-bold mb-3">Orders List</h2>
              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {filteredOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-xs">No orders for this date</p>
                ) : (
                  filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                    <div key={order.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                      <div className="flex flex-col">
                        <span className="font-bold">{order.id}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{order.orderType}</span>
                      </div>
                      <span className={order.status === 'cancelled' ? 'text-destructive' : 'text-success'}>{order.status}</span>
                      <span className="font-bold">Rs.{order.total}</span>
                      <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  ))
                )}
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
              <p className="text-center text-muted-foreground py-8">No sales data for this date</p>
            ) : (
              <div className="space-y-3">
                {filteredCategories.map(([cat, data]) => (
                  <div key={cat} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-primary">{cat}</h3>
                      <div className="flex gap-3 text-xs items-center">
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
