import { useRef, useCallback } from 'react';
import { Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';
import { loadPrintConfig } from './PrintSettings';

interface PrintTokenProps {
  order: Order;
}

export function PrintToken({ order }: PrintTokenProps) {
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(() => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    const c = loadPrintConfig();

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Token - ${order.id}</title>
<style>
  @page { size: ${c.tokenWidth}mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: ${c.tokenWidth}mm; margin: 0 auto; padding: 3mm; font-size: ${c.tokenFontSize}px; color: #000; line-height: 1.4; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 3px 0; }
  .header { font-size: ${c.tokenHeaderSize}px; font-weight: bold; }
  .big { font-size: ${c.tokenIdSize}px; font-weight: bold; }
</style></head><body>
<div class="center header">${loadPrintConfig().billShopName}</div>
<div class="center bold big">${order.id}</div>
<div class="line"></div>
<div class="center bold">${order.orderType.toUpperCase()}</div>
${order.tableNumber ? `<div class="center">Table: ${order.tableNumber}</div>` : ''}
<div class="line"></div>
${order.items.map(i => `<div>${i.quantity}x ${i.name}</div>`).join('')}
<div class="line"></div>
<div class="center bold" style="font-size:${c.tokenFontSize + 2}px">Total: Rs.${order.total}</div>
</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch(e) { console.error(e); }
        setTimeout(() => {
          document.body.removeChild(iframe);
          isPrintingRef.current = false;
        }, 2000);
      }, 300);
    } else {
      document.body.removeChild(iframe);
      isPrintingRef.current = false;
    }
  }, [order]);

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
      <Receipt className="h-3.5 w-3.5" />
      Token
    </Button>
  );
}
