import type { DeliveryOrder } from '../../types/api.types';
import { colomboToday, formatRs, groupByDate, matchesSearch, needsStart, orderActions, parcelsOf, STATUS_LABEL, visibleOrders } from '../orderView';

const order = (over: Partial<DeliveryOrder>): DeliveryOrder => ({
  order_id: 'A', customer_id: 'c', customer_name: 'Ann Perera', customer_phone: '0771234567', customer_address: 'Block A room 12',
  area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', total_price: 450, payment_status: 'pending', status: 'pending',
  failure_reason: null, created_at: '', items: [{ food_name: 'Chicken Rice', quantity: 2, price: 225, meal_type: 'non-veg' }],
  ...over,
});

describe('orderActions', () => {
  it('offers Delivered and Failed only while delivering', () => {
    expect(orderActions(order({ status: 'delivering' }))).toEqual(['delivered', 'failed', 'paid', 'unpaid']);
    expect(orderActions(order({ status: 'pending' }))).toEqual(['paid', 'unpaid']);
  });
  it('offers Paid for unpaid orders and nothing once paid', () => {
    expect(orderActions(order({ status: 'delivered', payment_status: 'unpaid' }))).toEqual(['paid']);
    expect(orderActions(order({ status: 'completed', payment_status: 'paid' }))).toEqual([]);
  });
  it('offers nothing on cancelled or ignored orders', () => {
    expect(orderActions(order({ status: 'cancelled' }))).toEqual([]);
    expect(orderActions(order({ payment_status: 'ignored' }))).toEqual([]);
  });
});

describe('labels and counts', () => {
  it('maps statuses to the spec labels', () => {
    expect([STATUS_LABEL.pending, STATUS_LABEL.preparing, STATUS_LABEL.delivering, STATUS_LABEL.delivered, STATUS_LABEL.completed, STATUS_LABEL.delivery_failed])
      .toEqual(['Waiting', 'Waiting', 'On the way', 'Delivered', 'Delivered', 'Failed']);
  });
  it('counts parcels and formats money', () => {
    expect(parcelsOf(order({ items: [{ food_name: 'a', quantity: 2, price: 1, meal_type: 'veg' }, { food_name: 'b', quantity: 1, price: 1, meal_type: 'veg' }] }))).toBe(3);
    expect(formatRs(450)).toBe('Rs. 450.00');
  });
});

describe('search and filters', () => {
  it('matches order id, name, phone, address and food, ignoring case', () => {
    const o = order({ order_id: 'ORD-99-x' });
    for (const q of ['ord-99', 'ann', '077123', 'room 12', 'chicken', '']) expect(matchesSearch(o, q)).toBe(true);
    expect(matchesSearch(o, 'pizza')).toBe(false);
  });
  it('filters by group and never shows cancelled orders', () => {
    const list = [
      order({ order_id: 'P', status: 'pending' }), order({ order_id: 'D', status: 'delivering' }),
      order({ order_id: 'V', status: 'delivered' }), order({ order_id: 'C', status: 'completed' }),
      order({ order_id: 'F', status: 'delivery_failed' }), order({ order_id: 'X', status: 'cancelled' }),
    ];
    const ids = (f: Parameters<typeof visibleOrders>[1]) => visibleOrders(list, f, '').map((o) => o.order_id);
    expect(ids('to_deliver')).toEqual(['P', 'D']);
    expect(ids('delivered')).toEqual(['V', 'C']);
    expect(ids('failed')).toEqual(['F']);
    expect(ids('all')).toEqual(['P', 'D', 'V', 'C', 'F']);
  });
  it('needs a start while any order is pending or preparing', () => {
    expect(needsStart([order({ status: 'delivering' }), order({ status: 'preparing' })])).toBe(true);
    expect(needsStart([order({ status: 'delivering' })])).toBe(false);
  });
});

describe('groupByDate', () => {
  it('groups newest first with Today, counts and amounts; undated last', () => {
    const groups = groupByDate([
      order({ order_id: 'A', target_date: '2026-10-26', total_price: 100 }),
      order({ order_id: 'B', target_date: '2026-10-27', total_price: 200 }),
      order({ order_id: 'C', target_date: '2026-10-27', total_price: 50.5 }),
      order({ order_id: 'D', target_date: null, total_price: 10 }),
    ], '2026-10-27');
    expect(groups.map((g) => [g.label, g.orders.map((o) => o.order_id), g.amount])).toEqual([
      ['Today', ['B', 'C'], 250.5],
      ['2026-10-26', ['A'], 100],
      ['Undated', ['D'], 10],
    ]);
  });
  it('colomboToday is the Sri Lanka date', () => {
    expect(colomboToday(new Date('2026-10-26T19:00:00Z'))).toBe('2026-10-27');
  });
});
