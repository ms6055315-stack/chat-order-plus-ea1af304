import { useState } from 'react';
import { CartItem, MenuItem } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NumPad } from '@/components/NumPad';


interface CartPanelProps {
  items: CartItem[];
  discount: number;
  discountType: 'percent' | 'amount';
  subtotal: number;
  discountAmount: number;
  total: number;
  deliveryCharges: number;
  showDelivery: boolean;
  extraCharges: number;
  onQuantityChange: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onDiscountChange: (d: number) => void;
  onDiscountTypeChange: (t: 'percent' | 'amount') => void;
  onDeliveryChargesChange: (c: number) => void;
  onExtraChargesChange: (c: number) => void;
  onAddItem: (item: MenuItem) => void;
}

export function CartPanel({
  items, discount, discountType, subtotal, discountAmount, total,
  deliveryCharges, showDelivery, extraCharges, onQuantityChange, onRemoveItem,
  onDiscountChange, onDiscountTypeChange, onDeliveryChargesChange, onExtraChargesChange,
}: CartPanelProps) {
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadValue, setKeypadValue] = useState('');
  const [qtyTarget, setQtyTarget] = useState<{ id: string; name: string; qty: number } | null>(null);
  const grandTotal = total + (showDelivery ? deliveryCharges : 0);


  const handleKeypadPress = (key: string) => {
    if (key === 'C') { setKeypadValue(''); return; }
    if (key === '⌫') { setKeypadValue(prev => prev.slice(0, -1)); return; }
    if (key === 'OK') {
      onExtraChargesChange(Number(keypadValue) || 0);
      setShowKeypad(false);
      setKeypadValue('');
      return;
    }
    setKeypadValue(prev => prev + key);
  };

  return (
    <div className="space-y-2">
      <div className="max-h-36 overflow-y-auto scrollbar-thin space-y-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Cart is empty</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex items-center gap-2 bg-card border border-border rounded px-2 py-1">
              <span className="flex-1 text-xs truncate">{item.name}</span>
              <span className="text-xs text-muted-foreground">Rs.{item.price}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onQuantityChange(item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center rounded bg-accent hover:bg-muted">
                  <Minus className="h-3 w-3" />
                </button>
                <button onClick={() => setQtyTarget({ id: item.id, name: item.name, qty: item.quantity })} className="w-6 text-center text-xs font-bold underline decoration-dotted" title="Enter quantity">
                  {item.quantity}
                </button>
                <button onClick={() => onQuantityChange(item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center rounded bg-accent hover:bg-muted">
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <span className="text-xs font-bold w-16 text-right">Rs.{item.price * item.quantity}</span>
              <button onClick={() => onRemoveItem(item.id)} className="text-destructive hover:text-destructive/80">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-muted-foreground">Discount:</span>
        <Input type="number" value={discount || ''} onChange={e => onDiscountChange(Number(e.target.value))} className="h-7 w-16 text-xs" placeholder="0" />
        <button onClick={() => onDiscountTypeChange(discountType === 'percent' ? 'amount' : 'percent')} className="px-2 py-1 rounded bg-accent text-accent-foreground text-xs">
          {discountType === 'percent' ? '%' : 'Rs'}
        </button>

        <Button variant="outline" size="sm" onClick={() => { setKeypadValue(String(extraCharges || '')); setShowKeypad(true); }} className="h-7 text-xs gap-1 px-2">
          <Calculator className="h-3 w-3" /> Extra: Rs.{extraCharges || 0}
        </Button>

        {showDelivery && (
          <>
            <span className="text-muted-foreground">Delivery:</span>
            <Input type="number" value={deliveryCharges || ''} onChange={e => onDeliveryChargesChange(Number(e.target.value))} className="h-7 w-16 text-xs" placeholder="0" />
          </>
        )}

        <div className="ml-auto flex gap-4 font-bold">
          {discountAmount > 0 && <span className="text-muted-foreground">Sub: Rs.{subtotal} (-Rs.{Math.round(discountAmount)})</span>}
          <span className="text-secondary text-base">Total: Rs.{Math.round(grandTotal)}</span>
        </div>
      </div>

      {/* Extra Charges Keypad Dialog */}
      <Dialog open={showKeypad} onOpenChange={setShowKeypad}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Extra Charges</DialogTitle></DialogHeader>
          <div className="text-center text-2xl font-bold py-2 bg-accent rounded mb-2">
            Rs.{keypadValue || '0'}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(key => (
              <button key={key} onClick={() => handleKeypadPress(key)}
                className="h-12 rounded-lg bg-accent hover:bg-muted text-lg font-bold transition-colors">
                {key}
              </button>
            ))}

      <NumPad
        open={!!qtyTarget}
        title={qtyTarget ? `Quantity - ${qtyTarget.name}` : ''}
        initialValue={qtyTarget?.qty ?? ''}
        allowDecimal={false}
        onClose={() => setQtyTarget(null)}
        onConfirm={n => { if (qtyTarget) onQuantityChange(qtyTarget.id, n); setQtyTarget(null); }}
      />
    </div>

          <Button onClick={() => handleKeypadPress('OK')} className="w-full mt-2">Set Extra Charges</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
