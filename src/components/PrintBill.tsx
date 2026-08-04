import { useRef, useCallback } from 'react';
import { Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { loadPrintConfig } from './PrintSettings';

interface PrintBillProps {
  order: Order;
}

export function PrintBill({ order }: PrintBillProps) {
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(() => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    const c = loadPrintConfig();
    const deliveryCharges = order.deliveryCharges || 0;
    const extraCharges = order.extraCharges || 0;
    const taxAmount = c.billShowTax ? Math.round(order.subtotal * c.billTaxPercent / 100) : 0;
    const fontWeight = c.billBold ? 'bold' : 'normal';
    const fontStyle = c.billItalic ? 'italic' : 'normal';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Bill - ${order.id}</title>
<style>
  @page { size: ${c.billWidth}mm ${c.billHeight}mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: ${c.billPrintWidth}mm; margin: 0 auto; padding: 0; font-size: ${c.billFontSize}px; color: #000; line-height: 1.4; font-weight: ${fontWeight}; font-style: ${fontStyle}; }

  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 3px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; font-size: ${c.billItemSize}px; }
  .right { text-align: right; }
  .header { font-size: ${c.billHeaderSize}px; font-weight: bold; text-align: ${c.billHeaderAlign}; }
  .item-row { text-align: ${c.billItemAlign}; }
  .total-line { font-size: ${c.billTotalSize}px; font-weight: bold; }
  .logo { max-width: 60%; max-height: 60px; margin: 0 auto 4px; display: block; }
</style></head><body>
${c.billLogo ? `<img src="${c.billLogo}" class="logo" />` : ''}
<div class="header">${c.billShopName}</div>
<div class="${c.billHeaderAlign === 'center' ? 'center' : ''}" style="font-size:${c.billFontSize - 1}px;text-align:${c.billHeaderAlign}">${c.billPhone1} | ${c.billPhone2}</div>
<div class="line"></div>
<div>Order: <b>${order.id}</b></div>
<div>Type: <b>${order.orderType.toUpperCase()}</b></div>
${order.tableNumber ? `<div>Table: ${order.tableNumber}</div>` : ''}
${order.customerName ? `<div>Customer: ${order.customerName}</div>` : ''}
${order.customerPhone ? `<div>Phone: ${order.customerPhone}</div>` : ''}
${order.customerAddress ? `<div>Address: ${order.customerAddress}</div>` : ''}
<div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
<div class="line"></div>
<table>
  <tr class="bold"><td>Item</td><td class="right">Qty</td><td class="right">Price</td></tr>
  ${order.items.map(i => `<tr class="item-row"><td>${i.name}</td><td class="right">${i.quantity}</td><td class="right">Rs.${i.price * i.quantity}</td></tr>`).join('')}
</table>
<div class="line"></div>
<div class="right">Subtotal: Rs.${order.subtotal}</div>
${order.discount > 0 ? `<div class="right">Discount: -Rs.${order.discountType === 'percent' ? Math.round(order.subtotal * order.discount / 100) : order.discount}</div>` : ''}
${extraCharges > 0 ? `<div class="right">Extra Charges: Rs.${extraCharges}</div>` : ''}
${taxAmount > 0 ? `<div class="right">Tax (${c.billTaxPercent}%): Rs.${taxAmount}</div>` : ''}
${deliveryCharges > 0 ? `<div class="right">Delivery: Rs.${deliveryCharges}</div>` : ''}
<div class="right total-line">Total: Rs.${order.total}</div>
<div class="line"></div>
<div class="center">${c.billFooter}</div>
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
    <Button variant="outline" size="sm" onClick={handlePrint} className="h-6 text-[10px] gap-0.5 px-2">
      <Printer className="h-2.5 w-2.5" />
      Bill
    </Button>
  );
}