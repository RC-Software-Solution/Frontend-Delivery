import { normalizeOrder } from '../normalizeOrder';

describe('normalizeOrder', () => {
  it('maps the order-service payload', () => {
    const o = normalizeOrder({
      id: 'ORD-1-a', customer_id: 'c1', customer_name: 'Ann', customer_phone: '0771', customer_address: 'Block A',
      area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', total_price: '450.00', payment_status: 'pending',
      status: 'delivering', failure_reason: null, created_at: '2026-10-27T05:00:00Z',
      order_items: [{ food_name: 'Rice', quantity: 2, price: '225.00', meal_type: 'veg' }],
    });
    expect(o).toEqual({
      order_id: 'ORD-1-a', customer_id: 'c1', customer_name: 'Ann', customer_phone: '0771', customer_address: 'Block A',
      area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', total_price: 450, payment_status: 'pending',
      status: 'delivering', failure_reason: null, created_at: '2026-10-27T05:00:00Z',
      items: [{ food_name: 'Rice', quantity: 2, price: 225, meal_type: 'veg' }],
    });
  });

  it('fills safe defaults for missing fields', () => {
    const o = normalizeOrder({ id: 'X' });
    expect(o.customer_name).toBe('');
    expect(o.customer_phone).toBe('');
    expect(o.items).toEqual([]);
    expect(o.total_price).toBe(0);
    expect(o.status).toBe('pending');
    expect(o.payment_status).toBe('pending');
    expect(o.target_date).toBeNull();
  });
});
