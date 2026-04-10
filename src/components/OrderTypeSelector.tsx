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
  { value: 'self', label: 'Self Service' },
];

export function OrderTypeSelector({ value, onChange }: OrderTypeSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {types.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-1.5 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
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
