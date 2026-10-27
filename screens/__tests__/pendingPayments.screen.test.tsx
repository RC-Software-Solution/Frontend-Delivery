import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import PendingPaymentsScreen from '../pendingPayments/pendingPayments.screen';

jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return { useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});
jest.mock('@/services', () => ({
  deliveryService: { getUnpaidOrders: jest.fn(), setPayment: jest.fn() },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
}));
jest.mock('@/services/delivery/selection', () => ({
  loadSelection: jest.fn(async () => ({ areaId: 3, area: 'Block A', sessionId: 7, mealTime: 'lunch', date: '2026-10-27' })),
}));
jest.mock('@/services/delivery/orderView', () => ({ ...jest.requireActual('@/services/delivery/orderView'), colomboToday: () => '2026-10-27' }));

import { deliveryService } from '@/services';
const svc = deliveryService as unknown as Record<'getUnpaidOrders' | 'setPayment', jest.Mock>;

const order = (order_id: string, target_date: string, total_price: number, status = 'delivered') => ({
  order_id, status, payment_status: 'unpaid', customer_id: 'c', customer_name: `Name ${order_id}`, customer_phone: '0770',
  customer_address: `Room ${order_id}`, area_id: 3, meal_time: 'lunch', target_date, total_price, failure_reason: null,
  created_at: '', items: [],
});

beforeEach(() => {
  jest.clearAllMocks();
  svc.getUnpaidOrders.mockResolvedValue([order('A', '2026-10-26', 100), order('B', '2026-10-27', 200, 'delivery_failed'), order('C', '2026-10-27', 50)]);
  svc.setPayment.mockResolvedValue({});
});

it('lists every unpaid order of the area grouped by day, with totals', async () => {
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText('Today · 2 orders · Rs. 250.00')).toBeTruthy();
  expect(screen.getByText('2026-10-26 · 1 orders · Rs. 100.00')).toBeTruthy();
  expect(screen.getByText('Outstanding: 3 orders · Rs. 350.00')).toBeTruthy();
  expect(within(screen.getByTestId('unpaid-B')).getByText('Failed')).toBeTruthy();
  expect(svc.getUnpaidOrders).toHaveBeenCalledWith(3);
});

it('searches by address', async () => {
  await render(<PendingPaymentsScreen />);
  await fireEvent.changeText(await screen.findByPlaceholderText('Search orders'), 'room a');
  expect(screen.getByTestId('unpaid-A')).toBeTruthy();
  expect(screen.queryByTestId('unpaid-B')).toBeNull();
});

it('marks an order paid after confirming, then reloads', async () => {
  await render(<PendingPaymentsScreen />);
  await fireEvent.press(within(await screen.findByTestId('unpaid-A')).getByRole('button', { name: 'PAID' }));
  await fireEvent.press(screen.getByText('Paid'));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('A', 'paid'));
  await waitFor(() => expect(svc.getUnpaidOrders).toHaveBeenCalledTimes(2));
});
