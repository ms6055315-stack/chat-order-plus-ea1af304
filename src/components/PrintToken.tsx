import { useRef, useCallback } from 'react';
import { Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';

interface PrintTokenProps {
  order: Order;
}

export function PrintToken({ order }: PrintTokenProps) {
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(() => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    const printWindow = window.open('', '_blank', 'width=300,height=400');
    if (!printWindow) { isPrintingRef.current = false; return; }

    printWindow.document.write(`
      <html><head><title>Token</title>
      <style>
        body { font-family: monospace; width: 80mm; margin: 0; padding: 5mm; font-size: 14px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .big { font-size: 24px; }
      </style></head><body>
      <div class="center bold" style="font-size:16px">RABBANI FAST FOOD</div>
      <div class="center bold big">${order.id}</div>
      <div class="line"></div>
      <div class="center">${order.orderType.toUpperCase()}</div>
      ${order.tableNumber ? `<div class="center">Table: ${order.tableNumber}</div>` : ''}
      <div class="line"></div>
      ${order.items.map(i => `<div>${i.quantity}x ${i.name}</div>`).join('')}
      <div class="line"></div>
      <div class="center bold">Total: Rs.${order.total}</div>
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
      <Receipt className="h-3.5 w-3.5" />
      Token
    </Button>
  );
}
