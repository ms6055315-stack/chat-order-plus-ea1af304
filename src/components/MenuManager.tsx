import { useState } from 'react';
import { MenuItem, CATEGORIES } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Settings, Plus, Trash2, RotateCcw, Edit2, Save, X, FolderPlus } from 'lucide-react';

interface MenuManagerProps {
  items: MenuItem[];
  categories: string[];
  onAddItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateItem: (id: string, data: Partial<MenuItem>) => void;
  onDeleteItem: (id: string) => void;
  onReset: () => void;
  onAddCategory?: (category: string) => void;
}

export function MenuManager({ items, categories, onAddItem, onUpdateItem, onDeleteItem, onReset, onAddCategory }: MenuManagerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[1] || '');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Add category state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleAdd = () => {
    if (!name || !price) return;
    onAddItem({ name, price: Number(price), category });
    setName('');
    setPrice('');
  };

  const startEdit = (item: MenuItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditCategory(item.category);
  };

  const saveEdit = () => {
    if (!editId || !editName || !editPrice) return;
    onUpdateItem(editId, { name: editName, price: Number(editPrice), category: editCategory });
    setEditId(null);
  };

  const cancelEdit = () => setEditId(null);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    onAddCategory?.(newCatName.trim());
    setNewCatName('');
    setShowAddCat(false);
  };

  const filteredItems = items.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || i.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Settings className="h-4 w-4" />
        Menu
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Menu Manager</DialogTitle>
            <DialogDescription>Add, edit, or remove menu items and categories.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            {/* Add new item */}
            <div className="flex gap-2 flex-wrap">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" className="flex-1 h-8 text-xs min-w-[120px]" />
              <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" className="w-20 h-8 text-xs" />
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-accent text-accent-foreground rounded px-2 text-xs border border-border h-8">
                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Button onClick={handleAdd} size="sm" className="h-8 text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
            </div>

            {/* Add category */}
            <div className="flex gap-2 items-center">
              {showAddCat ? (
                <>
                  <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name" className="flex-1 h-8 text-xs" onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                  <Button size="sm" onClick={handleAddCategory} className="h-8 text-xs gap-1"><Save className="h-3 w-3" /> Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddCat(false)} className="h-8 text-xs"><X className="h-3 w-3" /></Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowAddCat(true)} className="h-8 text-xs gap-1">
                  <FolderPlus className="h-3 w-3" /> Add Category
                </Button>
              )}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="flex-1 h-8 text-xs" />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-accent text-accent-foreground rounded px-2 text-xs border border-border h-8">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Items list */}
            <div className="space-y-1 flex-1 overflow-y-auto">
              {filteredItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-border">
                  {editId === item.id ? (
                    <>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-7 text-xs" />
                      <Input value={editPrice} onChange={e => setEditPrice(e.target.value)} type="number" className="w-20 h-7 text-xs" />
                      <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="bg-accent text-accent-foreground rounded px-1.5 text-xs border border-border h-7">
                        {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={saveEdit} className="text-primary"><Save className="h-3.5 w-3.5" /></button>
                      <button onClick={cancelEdit} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-xs">{item.name}</span>
                      <span className="text-muted-foreground text-[10px]">{item.category}</span>
                      <span className="font-bold text-xs">Rs.{item.price}</span>
                      <button onClick={() => startEdit(item)} className="text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => onDeleteItem(item.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
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
