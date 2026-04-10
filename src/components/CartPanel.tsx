import { CartItem, MenuItem } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartPanelProps {
  items: CartItem[];
  discount: number;
  discountType: 'percent' | 'amount';
  subtotal: number;
  discountAmount: number;
  total: number;
  deliveryCharges: number;
  showDelivery: boolean;
  onQuantityChange: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onDiscountChange: (d: number) => void;
  onDiscountTypeChange: (t: 'percent' | 'amount') => void;
  onDeliveryChargesChange: (c: number) => void;
  onAddItem: (item: MenuItem) => void;
}

export function CartPanel({
  items, discount, discountType, subtotal, discountAmount, total,
  deliveryCharges, showDelivery, onQuantityChange, onRemoveItem,
  onDiscountChange, onDiscountTypeChange, onDeliveryChargesChange,
}: CartPanelProps) {
  const grandTotal = total + (showDelivery ? deliveryCharges : 0);

  return (
    <div className="space-y-2">
      {/* Cart items */}
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
                <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
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

      {/* Discount & Totals */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Discount:</span>
        <Input
          type="number"
          value={discount || ''}
          onChange={e => onDiscountChange(Number(e.target.value))}
          className="h-7 w-20 text-xs"
          placeholder="0"
        />
        <button
          onClick={() => onDiscountTypeChange(discountType === 'percent' ? 'amount' : 'percent')}
          className="px-2 py-1 rounded bg-accent text-accent-foreground text-xs"
        >
          {discountType === 'percent' ? '%' : 'Rs'}
        </button>
        {showDelivery && (
          <>
            <span className="text-muted-foreground ml-2">Delivery:</span>
            <Input
              type="number"
              value={deliveryCharges || ''}
              onChange={e => onDeliveryChargesChange(Number(e.target.value))}
              className="h-7 w-20 text-xs"
              placeholder="0"
            />
          </>
        )}
        <div className="ml-auto flex gap-4 font-bold">
          {discountAmount > 0 && <span className="text-muted-foreground">Sub: Rs.{subtotal} (-Rs.{Math.round(discountAmount)})</span>}
          <span className="text-secondary text-base">Total: Rs.{Math.round(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
