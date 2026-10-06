import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Order, Payment } from '@/lib/menu';
import { orderPayments, paidAmount } from '@/lib/payments';
import { loadPOSConfig } from '@/pages/POSSettings';

interface Props {
  order: Order | null;
  onClose: () => void;
  onSave: (payments: Payment[]) => void;
}

type Method = Payment['method'];
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

/** Cashier payment screen: cash / online / card, mixed and partial, with keypad. */
export function PaymentDialog({ order, onClose, onSave }: Props) {
  const cardEnabled = loadPOSConfig().cardEnabled === true;
  const methods: Method[] = cardEnabled ? ['cash', 'online', 'card'] : ['cash', 'online'];
  const [amounts, setAmounts] = useState<Record<Method, string>>({ cash: '', online: '', card: '' });
  const [active, setActive] = useState<Method>('cash');
  const [reference, setReference] = useState('');

  useEffect(() => {
    setAmounts({ cash: '', online: '', card: '' });
    setActive('cash');
    setReference('');
  }, [order?.id]);

  if (!order) return null;
  const alreadyPaid = paidAmount(order);
  const due = Math.max(0, order.total - alreadyPaid);
  const entered = methods.reduce((s, m) => s + (Number(amounts[m]) || 0), 0);
  const cashGiven = Number(amounts.cash) || 0;
  const nonCash = entered - cashGiven;
  // Cash may exceed the bill (change returned); other methods may not.
  const change = Math.max(0, entered - due);
  const applied = Math.min(entered, due);
  const remaining = Math.max(0, due - entered);
  const invalid = nonCash > due || entered <= 0;

  const press = (k: string) => setAmounts(prev => {
    const cur = prev[active];
    const next = k === '⌫' ? cur.slice(0, -1) : (cur + k).replace(/^0+(?=\d)/, '').slice(0, 7);
    return { ...prev, [active]: next };
  });

  const fill = (m: Method) => {
    const others = methods.filter(x => x !== m).reduce((s, x) => s + (Number(amounts[x]) || 0), 0);
    setAmounts(prev => ({ ...prev, [m]: String(Math.max(0, due - others)) }));
    setActive(m);
  };

  const save = () => {
    if (invalid) return;
    const now = new Date().toISOString();
    let cashLeft = Math.max(0, due - nonCash);
    const newPayments: Payment[] = [];
    for (const m of methods) {
      let amt = Number(amounts[m]) || 0;
      if (m === 'cash') amt = Math.min(amt, cashLeft);
      if (amt <= 0) continue;
      newPayments.push({ id: `PAY-${Date.now().toString(36)}-${m}`, orderId: order.id, method: m, amount: amt, at: now, reference: m !== 'cash' && reference ? reference : undefined });
    }
    onSave([...orderPayments(order), ...newPayments]);
  };

  return (
    <Dialog open={!!order} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment — {order.id}</DialogTitle>
          <DialogDescription>Enter cash, online{cardEnabled ? ', card' : ''} or a mix. Leave some unpaid for partial payment.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted p-2"><div className="text-[10px] text-muted-foreground">Total</div><div className="font-bold">Rs.{order.total}</div></div>
          <div className="rounded-md bg-muted p-2"><div className="text-[10px] text-muted-foreground">Already paid</div><div className="font-bold">Rs.{alreadyPaid}</div></div>
          <div className="rounded-md bg-primary/15 p-2"><div className="text-[10px] text-muted-foreground">Due</div><div className="font-bold text-primary">Rs.{due}</div></div>
        </div>

        <div className="space-y-2">
          {methods.map(m => (
            <div key={m} className="flex items-center gap-2">
              <button onClick={() => setActive(m)} className={`w-20 h-10 rounded-md text-sm font-semibold capitalize border ${active === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent border-border'}`}>{m}</button>
              <Input inputMode="numeric" value={amounts[m]} onFocus={() => setActive(m)} onChange={e => setAmounts(p => ({ ...p, [m]: e.target.value.replace(/\D/g, '').slice(0, 7) }))} placeholder="0" className="h-10 text-lg font-bold" />
              <Button variant="outline" onClick={() => fill(m)} className="h-10 text-xs">Full</Button>
            </div>
          ))}
          {(Number(amounts.online) > 0 || Number(amounts.card) > 0) && (
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Transaction / reference no. (optional)" className="h-8 text-xs" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {KEYS.map(k => (
            <Button key={k} variant="secondary" onClick={() => press(k)} className="h-11 text-lg font-bold">{k}</Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>Paying<br /><b>Rs.{applied}</b></div>
          <div>Remaining<br /><b className={remaining > 0 ? 'text-warning' : 'text-success'}>Rs.{remaining}</b></div>
          <div>Change<br /><b>Rs.{change}</b></div>
        </div>
        {nonCash > due && <p className="text-xs text-destructive">Online/card amount cannot be more than the amount due.</p>}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={invalid} className="min-w-32">Save payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
