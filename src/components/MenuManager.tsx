import { useState } from 'react';
import { MenuItem, MenuItemVariant, CATEGORIES } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { NumPad, NumPadButton } from '@/components/NumPad';
import { Settings, Plus, Trash2, RotateCcw, Edit2, Save, X, FolderPlus, Image, Layers } from 'lucide-react';


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
  const [image, setImage] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showOnToken, setShowOnToken] = useState(true);
  const [addVariants, setAddVariants] = useState<MenuItemVariant[]>([]);
  const [addVarName, setAddVarName] = useState('');
  const [addVarPrice, setAddVarPrice] = useState('');

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editVariants, setEditVariants] = useState<MenuItemVariant[]>([]);
  const [editToken, setEditToken] = useState(true);

  // Add category state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // New variant inputs
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');

  // Dialer (numeric keypad) target
  const [pad, setPad] = useState<{ title: string; value: string | number; apply: (n: number) => void } | null>(null);

  const handleAdd = () => {
    if (!name || !price) return;
    onAddItem({
      name,
      price: Number(price),
      category,
      image: image || undefined,
      showOnToken,
      variants: addVariants.length > 0 ? addVariants : undefined,
    });
    setName('');
    setPrice('');
    setImage('');
    setAddVariants([]);
    setShowOnToken(true);
  };


  const startEdit = (item: MenuItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditCategory(item.category);
    setEditImage(item.image || '');
    setEditVariants(item.variants ? [...item.variants] : []);
    setEditToken(item.showOnToken !== false);
    setNewVarName('');
    setNewVarPrice('');
  };

  const saveEdit = () => {
    if (!editId || !editName || !editPrice) return;
    onUpdateItem(editId, { name: editName, price: Number(editPrice), category: editCategory, image: editImage || undefined, showOnToken: editToken, variants: editVariants.length > 0 ? editVariants : undefined });
    setEditId(null);
  };

  const addVariant = () => {
    if (!newVarName || !newVarPrice) return;
    setEditVariants(prev => [...prev, { id: `var-${Date.now()}`, name: newVarName, price: Number(newVarPrice) }]);
    setNewVarName('');
    setNewVarPrice('');
  };

  const addNewItemVariant = () => {
    if (!addVarName || !addVarPrice) return;
    setAddVariants(prev => [...prev, { id: `var-${Date.now()}`, name: addVarName, price: Number(addVarPrice) }]);
    setAddVarName('');
    setAddVarPrice('');
  };

  const removeVariant = (varId: string) => {
    setEditVariants(prev => prev.filter(v => v.id !== varId));
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
            <div className="space-y-1">
              <div className="flex gap-2 flex-wrap">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" className="flex-1 h-8 text-xs min-w-[120px]" />
                <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" className="w-20 h-8 text-xs" />
                <NumPadButton onClick={() => setPad({ title: 'Item Price', value: price, apply: n => setPrice(String(n)) })} className="h-8" />
                <select value={category} onChange={e => setCategory(e.target.value)} className="bg-accent text-accent-foreground rounded px-2 text-xs border border-border h-8">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Button onClick={handleAdd} size="sm" className="h-8 text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="newToken" checked={showOnToken} onChange={e => setShowOnToken(e.target.checked)} />
                <label htmlFor="newToken" className="text-[11px]">Print this item on kitchen token</label>
              </div>
              {/* Variants for the new item */}
              <div className="bg-accent/50 rounded p-2 space-y-1">
                <p className="text-[10px] font-medium flex items-center gap-1"><Layers className="h-3 w-3" /> Variants for new item (optional)</p>
                {addVariants.map(v => (
                  <div key={v.id} className="flex items-center gap-1">
                    <span className="flex-1 text-[10px]">{v.name}</span>
                    <span className="text-[10px] font-bold">Rs.{v.price}</span>
                    <button onClick={() => setAddVariants(prev => prev.filter(x => x.id !== v.id))} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <Input value={addVarName} onChange={e => setAddVarName(e.target.value)} placeholder="Variant name (Half / 2 Pc)" className="flex-1 h-6 text-[10px]" />
                  <Input value={addVarPrice} onChange={e => setAddVarPrice(e.target.value)} type="number" placeholder="Price" className="w-16 h-6 text-[10px]" />
                  <NumPadButton onClick={() => setPad({ title: 'Variant Price', value: addVarPrice, apply: n => setAddVarPrice(String(n)) })} />
                  <button onClick={addNewItemVariant} className="text-primary"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Image className="h-4 w-4 text-muted-foreground" />
                <Input value={image} onChange={e => setImage(e.target.value)} placeholder="Image URL (PNG/JPG) - optional" className="flex-1 h-8 text-xs" />
                <input type="file" accept="image/*" className="text-xs w-32" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
                {image && <img src={image} alt="" className="w-8 h-8 rounded object-cover" />}
              </div>

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
                <div key={item.id} className="py-1.5 border-b border-border">
                  {editId === item.id ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-7 text-xs" />
                        <Input value={editPrice} onChange={e => setEditPrice(e.target.value)} type="number" className="w-20 h-7 text-xs" />
                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="bg-accent text-accent-foreground rounded px-1.5 text-xs border border-border h-7">
                          {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button onClick={saveEdit} className="text-primary"><Save className="h-3.5 w-3.5" /></button>
                        <button onClick={cancelEdit} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Image className="h-3 w-3 text-muted-foreground" />
                        <Input value={editImage} onChange={e => setEditImage(e.target.value)} placeholder="Image URL (optional)" className="flex-1 h-6 text-[10px]" />
                        <input type="file" accept="image/*" className="text-[10px] w-24" onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setEditImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                        {editImage && <img src={editImage} alt="" className="w-6 h-6 rounded object-cover" />}
                      </div>
                      {/* Variants (Half/Pieces) */}
                      <div className="bg-accent/50 rounded p-2 space-y-1">
                        <p className="text-[10px] font-medium flex items-center gap-1"><Layers className="h-3 w-3" /> Variants (Half / Pieces)</p>
                        {editVariants.map(v => (
                          <div key={v.id} className="flex items-center gap-1">
                            <Input value={v.name} onChange={e => setEditVariants(prev => prev.map(x => x.id === v.id ? { ...x, name: e.target.value } : x))} className="flex-1 h-6 text-[10px]" />
                            <Input value={v.price} onChange={e => setEditVariants(prev => prev.map(x => x.id === v.id ? { ...x, price: Number(e.target.value) || 0 } : x))} type="number" className="w-16 h-6 text-[10px]" />
                            <button onClick={() => removeVariant(v.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                        <div className="flex items-center gap-1">
                          <Input value={newVarName} onChange={e => setNewVarName(e.target.value)} placeholder="Variant name" className="flex-1 h-6 text-[10px]" />
                          <Input value={newVarPrice} onChange={e => setNewVarPrice(e.target.value)} type="number" placeholder="Price" className="w-16 h-6 text-[10px]" />
                          <button onClick={addVariant} className="text-primary"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      {item.image && <img src={item.image} alt="" className="w-6 h-6 rounded object-cover" />}
                      <span className="flex-1 text-xs">{item.name}</span>
                      {item.variants && item.variants.length > 0 && (
                        <span className="text-[9px] text-muted-foreground bg-accent px-1 rounded">{item.variants.length} variants</span>
                      )}
                      <span className="text-muted-foreground text-[10px]">{item.category}</span>
                      <span className="font-bold text-xs">Rs.{item.price}</span>
                      <button onClick={() => startEdit(item)} className="text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => onDeleteItem(item.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
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
