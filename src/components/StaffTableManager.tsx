import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Check, X, Table2, UserCheck, Bike } from 'lucide-react';

interface StaffTableManagerProps {
  tables: string[];
  waiters: string[];
  riders: string[];
  onAddTable: (name: string) => void;
  onRemoveTable: (name: string) => void;
  onEditTable: (old: string, newName: string) => void;
  onAddWaiter: (name: string) => void;
  onRemoveWaiter: (name: string) => void;
  onEditWaiter: (old: string, newName: string) => void;
  onAddRider: (name: string) => void;
  onRemoveRider: (name: string) => void;
  onEditRider: (old: string, newName: string) => void;
}

export function StaffTableManager(props: StaffTableManagerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'tables' | 'waiters' | 'riders'>('tables');
  const [newValue, setNewValue] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const getItems = () => tab === 'tables' ? props.tables : tab === 'waiters' ? props.waiters : props.riders;
  const handleAdd = () => {
    if (!newValue.trim()) return;
    if (tab === 'tables') props.onAddTable(newValue);
    else if (tab === 'waiters') props.onAddWaiter(newValue);
    else props.onAddRider(newValue);
    setNewValue('');
  };
  const handleRemove = (item: string) => {
    if (tab === 'tables') props.onRemoveTable(item);
    else if (tab === 'waiters') props.onRemoveWaiter(item);
    else props.onRemoveRider(item);
  };
  const handleEditSave = (old: string) => {
    if (tab === 'tables') props.onEditTable(old, editValue);
    else if (tab === 'waiters') props.onEditWaiter(old, editValue);
    else props.onEditRider(old, editValue);
    setEditingItem(null);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1 h-8 text-xs">
        <Table2 className="h-3.5 w-3.5" /> Staff
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tables, Waiters & Riders</DialogTitle></DialogHeader>
          <div className="flex gap-1 mb-3">
            {[
              { v: 'tables' as const, label: 'Tables', icon: <Table2 className="h-3 w-3" /> },
              { v: 'waiters' as const, label: 'Waiters', icon: <UserCheck className="h-3 w-3" /> },
              { v: 'riders' as const, label: 'Riders', icon: <Bike className="h-3 w-3" /> },
            ].map(t => (
              <Button key={t.v} variant={tab === t.v ? 'default' : 'outline'} size="sm" onClick={() => setTab(t.v)} className="flex-1 h-7 text-xs gap-1">
                {t.icon} {t.label} ({t.v === 'tables' ? props.tables.length : t.v === 'waiters' ? props.waiters.length : props.riders.length})
              </Button>
            ))}
          </div>

          <div className="flex gap-1 mb-3">
            <Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder={`Add ${tab === 'tables' ? 'table number' : tab === 'waiters' ? 'waiter name' : 'rider name'}`}
              className="h-8 text-xs flex-1" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <Button size="sm" onClick={handleAdd} className="h-8 text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {getItems().map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-accent rounded px-2 py-1.5">
                {editingItem === item ? (
                  <>
                    <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-6 text-xs flex-1" autoFocus onKeyDown={e => e.key === 'Enter' && handleEditSave(item)} />
                    <button onClick={() => handleEditSave(item)} className="text-success"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingItem(null)} className="text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{tab === 'tables' ? `Table ${item}` : item}</span>
                    <button onClick={() => { setEditingItem(item); setEditValue(item); }}><Edit2 className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
                    <button onClick={() => handleRemove(item)}><Trash2 className="h-3 w-3 text-destructive" /></button>
                  </>
                )}
              </div>
            ))}
            {getItems().length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No {tab} added yet</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
