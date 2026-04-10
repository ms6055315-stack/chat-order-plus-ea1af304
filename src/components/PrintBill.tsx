import { useRef, useCallback } from 'react';
import { Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintBillProps {
  order: Order;
}

export function PrintBill({ order }: PrintBillProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(() => {
    if (isPrintingRef.current) return; // Prevent double print
    isPrintingRef.current = true;

    const content = printRef.current;
    if (!content) { isPrintingRef.current = false; return; }

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) { isPrintingRef.current = false; return; }

    const deliveryCharges = order.deliveryCharges || 0;

    printWindow.document.write(`
      <html><head><title>Bill</title>
      <style>
        body { font-family: monospace; width: 80mm; margin: 0; padding: 5mm; font-size: 12px; }
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
      </body></html>
    `);
    printWindow.document.close();
    printWindow.onafterprint = () => {
      printWindow.close();
      isPrintingRef.current = false;
    };
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => { isPrintingRef.current = false; }, 2000);
    }, 250);
  }, [order]);

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
      <Printer className="h-3.5 w-3.5" />
      Bill
    </Button>
  );
}
