import { useMemo } from 'react';
import { Order } from '@/lib/menu';
import { buildBillHtml, buildTokenHtml } from '@/lib/printing';
import type { PrintConfig } from '@/components/PrintSettings';

const SAMPLE: Order = {
  id: 'ORD-PREVIEW',
  items: [
    { id: '1', name: 'Zinger Burger', price: 450, category: 'Burgers', quantity: 2 },
    { id: '2', name: 'Pizza Special (Medium)', price: 1200, category: 'Pizza', quantity: 1 },
    { id: '3', name: 'Cold Drink 1.5L', price: 200, category: 'Drinks', quantity: 1 },
  ] as Order['items'],
  orderType: 'delivery',
  customerName: 'Ali Khan',
  customerPhone: '0300-1234567',
  customerAddress: 'Street 4, Model Town',
  discount: 0,
  discountType: 'percent',
  subtotal: 2300,
  extraCharges: 50,
  deliveryCharges: 100,
  total: 2450,
  status: 'pending',
  paymentStatus: 'paid',
  createdAt: new Date(),
};

interface Props {
  config: PrintConfig;
  kind: 'bill' | 'token';
}

/** Live on-screen preview of exactly what the thermal printer will output. */
export function PrintPreview({ config, kind }: Props) {
  const html = useMemo(
    () => (kind === 'bill' ? buildBillHtml(SAMPLE, config) : buildTokenHtml(SAMPLE, config)),
    [config, kind],
  );
  const widthMm = kind === 'bill' ? config.billWidth : config.tokenWidth;
  const heightMm = kind === 'bill' ? config.billHeight : config.tokenHeight;
  const auto = kind === 'bill' ? config.billAutoHeight : config.tokenAutoHeight;

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium">
        Preview — {widthMm}mm × {auto ? 'auto' : `${heightMm}mm`}
      </div>
      <div className="rounded border border-border bg-muted/40 p-2 overflow-auto max-h-[45vh]">
        <iframe
          title={`${kind} preview`}
          srcDoc={html}
          className="bg-white block mx-auto"
          style={{
            width: `${widthMm}mm`,
            height: auto ? '260mm' : `${heightMm}mm`,
            border: '1px solid #ddd',
          }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Paper width is the physical roll size, print width is the printable area (usually 72.1mm on an 80mm roll).
      </p>
    </div>
  );
}
