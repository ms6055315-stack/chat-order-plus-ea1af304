import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NumPadProps {
  open: boolean;
  title?: string;
  initialValue?: string | number;
  allowDecimal?: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
}

export function NumPad({ open, title = 'Enter value', initialValue = '', allowDecimal = true, onClose, onConfirm }: NumPadProps) {
  const [value, setValue] = useState(String(initialValue ?? ''));

  useEffect(() => {
    if (open) setValue(initialValue === 0 ? '' : String(initialValue ?? ''));
  }, [open, initialValue]);

  const press = (key: string) => {
    if (key === 'C') return setValue('');
    if (key === '⌫') return setValue(v => v.slice(0, -1));
    if (key === '.') {
      if (!allowDecimal || value.includes('.')) return;
      return setValue(v => (v === '' ? '0.' : v + '.'));
    }
    setValue(v => v + key);
  };

  const confirm = () => {
    onConfirm(Number(value) || 0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="text-center text-2xl font-bold py-2 bg-accent rounded mb-2">{value || '0'}</div>
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', allowDecimal ? '.' : 'C', '0', '⌫'].map(key => (
            <button key={key} onClick={() => press(key)}
              className="h-12 rounded-lg bg-accent hover:bg-muted text-lg font-bold transition-colors">
              {key}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={() => setValue('')}>Clear</Button>
          <Button className="flex-1" onClick={confirm}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Small keypad trigger button used next to numeric inputs. */
export function NumPadButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} title="Open dialer"
      className={`px-1.5 h-7 rounded border border-border bg-accent hover:bg-muted text-xs ${className}`}>
      ⌨
    </button>
  );
}
