import { useState } from 'react';
import { MenuItem, MenuItemVariant } from '@/lib/menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MenuGridProps {
  items: MenuItem[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onItemClick: (item: MenuItem) => void;
}

export function MenuGrid({ items, categories, selectedCategory, onCategoryChange, onItemClick }: MenuGridProps) {
  const filtered = selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);
  const [variantItem, setVariantItem] = useState<MenuItem | null>(null);

  const handleClick = (item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      setVariantItem(item);
    } else {
      onItemClick(item);
    }
  };

  const handleVariantSelect = (variant: MenuItemVariant, parentItem: MenuItem) => {
    onItemClick({ id: variant.id, name: variant.name, price: variant.price, category: parentItem.category });
    setVariantItem(null);
  };

  const handleFullItem = () => {
    if (variantItem) {
      onItemClick(variantItem);
      setVariantItem(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-thin border-b border-border">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className="bg-card border border-border rounded-lg p-2 text-left hover:border-primary hover:bg-accent transition-all active:scale-95"
            >
              <p className="text-xs font-medium leading-tight text-card-foreground">{item.name}</p>
              <p className="text-sm font-bold text-secondary mt-1">Rs.{item.price}</p>
              {item.variants && item.variants.length > 0 && (
                <p className="text-[9px] text-muted-foreground mt-0.5">+{item.variants.length} options</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Variant Selection Dialog */}
      <Dialog open={!!variantItem} onOpenChange={open => !open && setVariantItem(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">{variantItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <button
              onClick={handleFullItem}
              className="w-full bg-primary text-primary-foreground rounded-lg p-3 text-left hover:bg-primary/90 transition-colors"
            >
              <p className="text-sm font-bold">{variantItem?.name} (Full)</p>
              <p className="text-xs">Rs.{variantItem?.price}</p>
            </button>
            {variantItem?.variants?.map(v => (
              <button
                key={v.id}
                onClick={() => handleVariantSelect(v, variantItem)}
                className="w-full bg-accent text-accent-foreground rounded-lg p-3 text-left hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-secondary font-bold">Rs.{v.price}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
