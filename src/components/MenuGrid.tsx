import { MenuItem } from '@/lib/menu';

interface MenuGridProps {
  items: MenuItem[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onItemClick: (item: MenuItem) => void;
}

export function MenuGrid({ items, categories, selectedCategory, onCategoryChange, onItemClick }: MenuGridProps) {
  const filtered = selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);

  return (
    <div className="h-full flex flex-col">
      {/* Category tabs */}
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

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="bg-card border border-border rounded-lg p-2 text-left hover:border-primary hover:bg-accent transition-all active:scale-95"
            >
              <p className="text-xs font-medium leading-tight text-card-foreground">{item.name}</p>
              <p className="text-sm font-bold text-secondary mt-1">Rs.{item.price}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
