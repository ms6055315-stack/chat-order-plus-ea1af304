import { useState } from 'react';
import { Customer } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, Trash2, Edit2, Save, X } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onUpdate: (id: string, data: Partial<Customer>) => void;
  onDelete: (id: string) => void;
}

export function CustomerManager({ customers, onUpdate, onDelete }: CustomerManagerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDelivery, setEditDelivery] = useState('');

  const startEdit = (c: Customer) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditAddress(c.address);
    setEditDelivery(String(c.deliveryCharges || 0));
  };

  const saveEdit = () => {
    if (!editId) return;
    onUpdate(editId, {
      name: editName,
      phone: editPhone,
      address: editAddress,
      deliveryCharges: Number(editDelivery) || 0,
    });
    setEditId(null);
  };

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Users className="h-4 w-4" />
        Customers
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Customers ({customers.length})</DialogTitle>
            <DialogDescription>Manage customer details and delivery charges.</DialogDescription>
          </DialogHeader>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." className="h-8 text-xs" />
          <div className="space-y-1 flex-1 overflow-y-auto">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No customers found.</p>}
            {filtered.map(c => (
              <div key={c.id} className="py-2 border-b border-border">
                {editId === c.id ? (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" className="flex-1 h-7 text-xs" />
                      <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone" className="w-32 h-7 text-xs" />
                    </div>
                    <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Address" className="h-7 text-xs" />
                    <div className="flex gap-1 items-center">
                      <Input value={editDelivery} onChange={e => setEditDelivery(e.target.value)} placeholder="Delivery Charges" type="number" className="w-32 h-7 text-xs" />
                      <span className="text-[10px] text-muted-foreground">Rs. delivery</span>
                      <div className="ml-auto flex gap-1">
                        <Button size="sm" onClick={saveEdit} className="h-6 text-[10px] gap-0.5 px-2"><Save className="h-2.5 w-2.5" /> Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(null)} className="h-6 text-[10px] px-2"><X className="h-2.5 w-2.5" /></Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-xs">{c.name || 'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground">{c.phone} {c.address && `• ${c.address}`}</p>
                      {(c.deliveryCharges || 0) > 0 && (
                        <p className="text-[10px] text-muted-foreground">🚚 Delivery: Rs.{c.deliveryCharges}</p>
                      )}
                    </div>
                    <button onClick={() => startEdit(c)} className="text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDelete(c.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
