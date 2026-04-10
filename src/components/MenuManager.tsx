import { useState } from 'react';
import { MenuItem, CATEGORIES } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings, Plus, Trash2, RotateCcw } from 'lucide-react';

interface MenuManagerProps {
  items: MenuItem[];
  categories: string[];
  onAddItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateItem: (id: string, data: Partial<MenuItem>) => void;
  onDeleteItem: (id: string) => void;
  onReset: () => void;
}

export function MenuManager({ items, categories, onAddItem, onUpdateItem, onDeleteItem, onReset }: MenuManagerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[1] || '');

  const handleAdd = () => {
    if (!name || !price) return;
    onAddItem({ name, price: Number(price), category });
    setName('');
    setPrice('');
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Settings className="h-4 w-4" />
        Menu
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Menu Manager</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" className="flex-1" />
              <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" className="w-24" />
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-accent text-accent-foreground rounded px-2 text-sm border border-border">
                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm py-1 border-b border-border">
                  <span className="flex-1">{item.name}</span>
                  <span className="text-muted-foreground text-xs">{item.category}</span>
                  <span className="font-bold">Rs.{item.price}</span>
                  <button onClick={() => onDeleteItem(item.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onReset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Reset Default
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
