import { Order } from '@/lib/menu';

interface OrderTypeSelectorProps {
  value: Order['orderType'];
  onChange: (type: Order['orderType']) => void;
}

const types: { value: Order['orderType']; label: string }[] = [
  { value: 'dine-in', label: 'Dine In' },
  { value: 'takeout', label: 'Take Out' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'car', label: 'Car Order' },
];

export function OrderTypeSelector({ value, onChange }: OrderTypeSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {types.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === t.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground hover:bg-muted'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
