import type { DeliveryOrder, OrderItem } from '../types/api.types';

/** order-service returns `id`, decimal strings and `order_items`; the app uses `order_id`, numbers and `items`. */
export function normalizeOrder(raw: any): DeliveryOrder {
  const rawItems: any[] = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.order_items) ? raw.order_items : [];
  const items: OrderItem[] = rawItems.map((ri) => ({
    food_name: ri.food_name ?? '',
    quantity: Number(ri.quantity ?? 0),
    price: Number(ri.price ?? 0),
    meal_type: ri.meal_type ?? 'other',
  }));
  return {
    order_id: String(raw.order_id ?? raw.id ?? ''),
    customer_id: raw.customer_id ?? '',
    customer_name: raw.customer_name ?? '',
    customer_phone: raw.customer_phone ?? '',
    customer_address: raw.customer_address ?? '',
    area_id: Number(raw.area_id ?? 0),
    meal_time: raw.meal_time,
    target_date: raw.target_date ?? null,
    total_price: Number(raw.total_price ?? 0),
    payment_status: raw.payment_status ?? 'pending',
    status: raw.status ?? 'pending',
    failure_reason: raw.failure_reason ?? null,
    created_at: raw.created_at ?? '',
    items,
  };
}
