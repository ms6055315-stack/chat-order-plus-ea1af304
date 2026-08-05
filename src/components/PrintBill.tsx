import { useRef, useCallback } from 'react';
import { Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { buildBillHtml, dispatchPrint } from '@/lib/printing';
import { toast } from '@/hooks/use-toast';

interface PrintBillProps {
  order: Order;
}

export function PrintBill({ order }: PrintBillProps) {
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(() => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    const where = dispatchPrint(buildBillHtml(order), `Bill ${order.id}`);
    if (where === 'remote') toast({ title: 'Sent to main printer' });
    setTimeout(() => { isPrintingRef.current = false; }, 1500);
  }, [order]);

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="h-6 text-[10px] gap-0.5 px-2">
      <Printer className="h-2.5 w-2.5" />
      Bill
    </Button>
  );
}
