import type { CartItem } from '@/lib/menu';

export interface DiscountRules {
  enabled: boolean;
  /** Items in a category whose name contains this word count as deals. */
  dealKeyword: string;
  smallDealMax: number;
  smallDealOff: number;
  bigDealMax: number;
  bigDealOff: number;
}

export const DEFAULT_DISCOUNT_RULES: DiscountRules = {
  enabled: true,
  dealKeyword: 'deal',
  smallDealMax: 800,
  smallDealOff: 40,
  bigDealMax: 1500,
  bigDealOff: 100,
};

const KEY = 'rabbani_discount_rules';

export function loadDiscountRules(): DiscountRules {
  try {
    const d = localStorage.getItem(KEY);
    return d ? { ...DEFAULT_DISCOUNT_RULES, ...JSON.parse(d) } : DEFAULT_DISCOUNT_RULES;
  } catch { return DEFAULT_DISCOUNT_RULES; }
}

export function saveDiscountRules(r: DiscountRules) {
  localStorage.setItem(KEY, JSON.stringify(r));
}

/** Single source of truth for automatic deal discounts. Computed once per cart, never stacked. */
export function dealDiscountFor(items: CartItem[], rules: DiscountRules = loadDiscountRules()): number {
  if (!rules.enabled) return 0;
  const kw = rules.dealKeyword.trim().toLowerCase();
  if (!kw) return 0;
  let off = 0;
  for (const i of items) {
    const isDeal = i.category.toLowerCase().includes(kw) || i.name.toLowerCase().includes(kw);
    if (!isDeal) continue;
    const per = i.price <= rules.smallDealMax ? rules.smallDealOff : i.price <= rules.bigDealMax ? rules.bigDealOff : 0;
    off += per * i.quantity;
  }
  return off;
}
