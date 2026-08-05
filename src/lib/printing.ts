// Central printing helpers: builds bill/token HTML and routes the job either to
// the local printer or, when device sync is on, to the designated print host.
import { Order } from '@/lib/menu';
import { loadPrintConfig, PrintConfig } from '@/components/PrintSettings';
import { isPrintHost, sendRemotePrint, getSyncCode } from '@/lib/posSync';

export function printHtml(html: string) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 2000);
  }, 300);
}

function pageSize(width: number, height: number, auto: boolean) {
  return auto ? `${width}mm auto` : `${width}mm ${height}mm`;
}

export function buildBillHtml(order: Order, c: PrintConfig = loadPrintConfig()): string {
  const deliveryCharges = order.deliveryCharges || 0;
  const extraCharges = order.extraCharges || 0;
  const taxAmount = c.billShowTax ? Math.round((order.subtotal * c.billTaxPercent) / 100) : 0;
  const fontWeight = c.billBold ? 'bold' : 'normal';
  const fontStyle = c.billItalic ? 'italic' : 'normal';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Bill - ${order.id}</title>
<style>
  @page { size: ${pageSize(c.billWidth, c.billHeight, c.billAutoHeight)}; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: ${c.billPrintWidth}mm; margin: 0 auto; padding: 0; font-size: ${c.billFontSize}px; color: #000; line-height: ${c.billLineHeight}; font-weight: ${fontWeight}; font-style: ${fontStyle}; }
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
<div style="font-size:${c.billFontSize - 1}px;text-align:${c.billHeaderAlign}">${c.billPhone1} | ${c.billPhone2}</div>
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
}

/** Token shows only kitchen items — no charges, no totals. */
export function buildTokenHtml(order: Order, c: PrintConfig = loadPrintConfig()): string {
  const fontWeight = c.tokenBold ? 'bold' : 'normal';
  const fontStyle = c.tokenItalic ? 'italic' : 'normal';
  const items = order.items.filter(i => i.showOnToken !== false);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Token - ${order.id}</title>
<style>
  @page { size: ${pageSize(c.tokenWidth, c.tokenHeight, c.tokenAutoHeight)}; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: ${c.tokenPrintWidth}mm; margin: 0 auto; padding: 0; font-size: ${c.tokenFontSize}px; color: #000; line-height: ${c.tokenLineHeight}; font-weight: ${fontWeight}; font-style: ${fontStyle}; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 3px 0; }
  .header { font-size: ${c.tokenHeaderSize}px; font-weight: bold; }
  .big { font-size: ${c.tokenIdSize}px; font-weight: bold; }
  .item { font-size: ${c.tokenItemSize}px; }
</style></head><body>
<div class="center header">${c.billShopName}</div>
<div class="center bold big">${order.id}</div>
<div class="line"></div>
<div class="center bold">${order.orderType.toUpperCase()}</div>
${order.tableNumber ? `<div class="center">Table: ${order.tableNumber}</div>` : ''}
<div class="line"></div>
${items.map(i => `<div class="item">${i.quantity}x ${i.name}</div>`).join('')}
<div class="line"></div>
</body></html>`;
}

/**
 * Prints locally, or forwards the job to the sync print host when this device
 * is not the one with the printer attached.
 */
export function dispatchPrint(html: string, label: string) {
  const c = loadPrintConfig();
  if (getSyncCode() && c.remotePrint && !isPrintHost()) {
    sendRemotePrint(html, label);
    return 'remote';
  }
  printHtml(html);
  return 'local';
}
