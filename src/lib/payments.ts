import type { Order, Payment } from '@/lib/menu';

export const PAYMENT_LABEL: Record<Payment['method'], string> = { cash: 'Cash', online: 'Online', card: 'Card' };

/** Old orders have no payment records: a "paid" order counts as fully paid in cash. */
export function orderPayments(order: Order): Payment[] {
  if (order.payments) return order.payments;
  if (order.paymentStatus === 'paid' && order.status !== 'cancelled') {
    return [{ id: `${order.id}-legacy`, orderId: order.id, method: 'cash', amount: order.total, at: new Date(order.createdAt).toISOString() }];
  }
  return [];
}

export function paidAmount(order: Order) {
  return orderPayments(order).reduce((s, p) => s + p.amount, 0);
}

export function remainingAmount(order: Order) {
  return Math.max(0, order.total - paidAmount(order));
}

export function paymentStatusFor(total: number, paid: number): Order['paymentStatus'] {
  if (paid <= 0) return 'pay-later';
  if (paid + 0.001 < total) return 'partial';
  return 'paid';
}

export function byMethod(orders: Order[]) {
  const out = { cash: 0, online: 0, card: 0 };
  for (const o of orders) for (const p of orderPayments(o)) out[p.method] += p.amount;
  return out;
}

export function summarizePayments(order: Order) {
  const m = byMethod([order]);
  return (Object.keys(m) as Payment['method'][]).filter(k => m[k] > 0).map(k => `${PAYMENT_LABEL[k]}: Rs.${m[k]}`);
}
