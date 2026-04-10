import { useState } from 'react';
import { Customer } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Trash2 } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onUpdate: (id: string, data: Partial<Customer>) => void;
  onDelete: (id: string) => void;
}

export function CustomerManager({ customers, onUpdate, onDelete }: CustomerManagerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Users className="h-4 w-4" />
        Customers
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customers ({customers.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {customers.length === 0 && <p className="text-sm text-muted-foreground">No customers saved yet.</p>}
            {customers.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-sm py-2 border-b border-border">
                <div className="flex-1">
                  <p className="font-medium">{c.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{c.phone} {c.address && `• ${c.address}`}</p>
                </div>
                <button onClick={() => onDelete(c.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
