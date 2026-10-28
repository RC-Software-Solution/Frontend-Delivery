import type { DeliveryOrder, OrderStatus } from '../types/api.types';

export type OrderAction = 'delivered' | 'failed' | 'paid' | 'unpaid';
export type StatusGroup = 'to_deliver' | 'delivered' | 'failed' | 'cancelled';
export type OrderFilter = 'to_deliver' | 'delivered' | 'failed' | 'all';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Waiting',
  preparing: 'Waiting',
  delivering: 'On the way',
  delivered: 'Delivered',
  completed: 'Delivered',
  delivery_failed: 'Failed',
  cancelled: 'Cancelled',
};

export function statusGroup(status: OrderStatus): StatusGroup {
  if (status === 'pending' || status === 'preparing' || status === 'delivering') return 'to_deliver';
  if (status === 'delivered' || status === 'completed') return 'delivered';
  if (status === 'delivery_failed') return 'failed';
  return 'cancelled';
}

/** Buttons an order offers. Delivered/Failed only while out for delivery; payment until it is settled. */
export function orderActions(o: Pick<DeliveryOrder, 'status' | 'payment_status'>): OrderAction[] {
  if (o.status === 'cancelled') return [];
  const actions: OrderAction[] = [];
  if (o.status === 'delivering') actions.push('delivered', 'failed');
  if (o.payment_status === 'pending') actions.push('paid', 'unpaid');
  else if (o.payment_status === 'unpaid') actions.push('paid');
  return actions;
}

export const parcelsOf = (o: Pick<DeliveryOrder, 'items'>) => o.items.reduce((n, item) => n + (item.quantity || 0), 0);

export const formatRs = (amount: number) => `Rs. ${Number(amount || 0).toFixed(2)}`;

export function matchesSearch(o: DeliveryOrder, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields = [o.order_id, o.customer_name, o.customer_phone, o.customer_address, ...o.items.map((i) => i.food_name)];
  return fields.some((f) => String(f || '').toLowerCase().includes(q));
}

export function visibleOrders(orders: DeliveryOrder[], filter: OrderFilter, query: string): DeliveryOrder[] {
  return orders.filter((o) => {
    const group = statusGroup(o.status);
    if (group === 'cancelled') return false;
    if (filter !== 'all' && group !== filter) return false;
    return matchesSearch(o, query);
  });
}

export const needsStart = (orders: DeliveryOrder[]) => orders.some((o) => o.status === 'pending' || o.status === 'preparing');

export interface DateGroup {
  date: string | null;
  label: string;
  orders: DeliveryOrder[];
  amount: number;
}

/** Unpaid orders by session date, newest first; orders without a date go last. */
export function groupByDate(orders: DeliveryOrder[], today: string): DateGroup[] {
  const byDate = new Map<string | null, DeliveryOrder[]>();
  for (const o of orders) byDate.set(o.target_date, [...(byDate.get(o.target_date) ?? []), o]);
  return [...byDate.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : b.localeCompare(a)))
    .map(([date, list]) => ({
      date,
      label: date === null ? 'Undated' : date === today ? 'Today' : date,
      orders: list,
      amount: Math.round(list.reduce((n, o) => n + o.total_price, 0) * 100) / 100,
    }));
}

/** Today's date in Sri Lanka (UTC+05:30, no DST), matching the backend's colomboToday. */
export const colomboToday = (now = new Date()) => new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
