import { useCallback } from 'react';
import { Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintBillProps {
  order: Order;
}

export function PrintBill({ order }: PrintBillProps) {
  const handlePrint = useCallback(() => {
    const deliveryCharges = order.deliveryCharges || 0;

    const html = `
      <html><head><title>Bill - ${order.id}</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 5mm; font-size: 12px; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1px 0; }
        .right { text-align: right; }
      </style></head><body>
      <div class="center bold" style="font-size:16px">RABBANI FAST FOOD</div>
      <div class="center">0307-1203000 | 0316-1203000</div>
      <div class="line"></div>
      <div>Order: ${order.id}</div>
      <div>Type: ${order.orderType.toUpperCase()}</div>
      ${order.tableNumber ? `<div>Table: ${order.tableNumber}</div>` : ''}
      ${order.customerName ? `<div>Customer: ${order.customerName}</div>` : ''}
      ${order.customerPhone ? `<div>Phone: ${order.customerPhone}</div>` : ''}
      ${order.customerAddress ? `<div>Address: ${order.customerAddress}</div>` : ''}
      <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
      <div class="line"></div>
      <table>
        <tr class="bold"><td>Item</td><td class="right">Qty</td><td class="right">Price</td></tr>
        ${order.items.map(i => `<tr><td>${i.name}</td><td class="right">${i.quantity}</td><td class="right">Rs.${i.price * i.quantity}</td></tr>`).join('')}
      </table>
      <div class="line"></div>
      <div class="right">Subtotal: Rs.${order.subtotal}</div>
      ${order.discount > 0 ? `<div class="right">Discount: -Rs.${Math.round(order.subtotal - order.total + deliveryCharges)}</div>` : ''}
      ${deliveryCharges > 0 ? `<div class="right">Delivery: Rs.${deliveryCharges}</div>` : ''}
      <div class="right bold" style="font-size:14px">Total: Rs.${order.total}</div>
      <div class="line"></div>
      <div class="center">Thank you! Visit again!</div>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback: use iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '80mm';
      iframe.style.height = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 3000);
        }, 500);
      }
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }, [order]);

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="h-6 text-[10px] gap-0.5 px-2">
      <Printer className="h-2.5 w-2.5" />
      Bill
    </Button>
  );
}
