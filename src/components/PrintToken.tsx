import { useRef, useCallback } from 'react';
import { Order } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';
import { buildTokenHtml, dispatchPrint } from '@/lib/printing';
import { toast } from '@/hooks/use-toast';

interface PrintTokenProps {
  order: Order;
}

export function PrintToken({ order }: PrintTokenProps) {
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(() => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    const tokenItems = order.items.filter(i => i.showOnToken !== false);
    if (tokenItems.length === 0) {
      toast({ title: 'No token items', description: 'All items in this order have token printing turned off.' });
      isPrintingRef.current = false;
      return;
    }
    const where = dispatchPrint(buildTokenHtml(order), `Token ${order.id}`);
    if (where === 'remote') toast({ title: 'Sent to main printer' });
    setTimeout(() => { isPrintingRef.current = false; }, 1500);
  }, [order]);

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
      <Receipt className="h-3.5 w-3.5" />
      Token
    </Button>
  );
}
