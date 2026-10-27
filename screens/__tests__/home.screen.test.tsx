import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import HomeScreen from '../home/home.screen';

jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return { useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});

// Factories are hoisted above the imports: fakes are built inside them, and outer state is only read
// lazily through `mock`-prefixed variables (the only outer names babel-jest allows in a factory).
let mockSessionState = 'closed';
let mockSelection: any = null;
jest.mock('@/services', () => ({
  deliveryService: {
    getSessionOrders: jest.fn(),
    getSummary: jest.fn(),
    startDelivery: jest.fn(),
    markDelivered: jest.fn(),
    markFailed: jest.fn(),
    setPayment: jest.fn(),
  },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
  menuApi: { getMyDeliverySessions: jest.fn(async () => [{ id: 7, meal_time: 'lunch', state: mockSessionState, mine: [3], taken: [] }]) },
}));
jest.mock('@/services/delivery/selection', () => ({ loadSelection: jest.fn(async () => mockSelection) }));

import { deliveryService } from '@/services';
const svc = deliveryService as unknown as Record<'getSessionOrders' | 'getSummary' | 'startDelivery' | 'markDelivered' | 'markFailed' | 'setPayment', jest.Mock>;

const order = (order_id: string, status: string, payment_status = 'pending', over: object = {}) => ({
  order_id, status, payment_status, customer_id: 'c', customer_name: `Name ${order_id}`, customer_phone: `07700${order_id}`,
  customer_address: `Room ${order_id}`, area_id: 3, meal_time: 'lunch', target_date: '2026-10-27', total_price: 450,
  failure_reason: null, created_at: '', items: [{ food_name: 'Rice', quantity: 2, price: 225, meal_type: 'veg' }], ...over,
});
const SUMMARY = {
  to_deliver: { orders: 4, parcels: 6 }, delivered: { orders: 2, parcels: 3 }, failed: { orders: 1 },
  collected: { orders: 2, amount: 900 }, unpaid: { orders: 1, amount: 450, list: [] },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSessionState = 'closed';
  mockSelection = { areaId: 3, area: 'Block A', sessionId: 7, mealTime: 'lunch', date: '2026-10-27' };
  svc.getSessionOrders.mockResolvedValue([order('A', 'pending'), order('B', 'delivering'), order('V', 'delivered', 'paid'), order('X', 'cancelled')]);
  svc.getSummary.mockResolvedValue(SUMMARY);
  for (const k of ['startDelivery', 'markDelivered', 'markFailed', 'setPayment'] as const) svc[k].mockResolvedValue({ message: 'ok' });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('shows the server counters and, by default, only orders still to deliver', async () => {
  await render(<HomeScreen />);
  expect(await screen.findByText('To deliver: 4 orders · 6 parcels')).toBeTruthy();
  expect(screen.getByText('Delivered: 2 orders · 3 parcels')).toBeTruthy();
  expect(screen.getByText('Collected: Rs. 900.00')).toBeTruthy();
  expect(screen.getByText('Unpaid: 1 orders · Rs. 450.00')).toBeTruthy();
  expect(screen.getByTestId('order-A')).toBeTruthy();
  expect(screen.getByTestId('order-B')).toBeTruthy();
  expect(screen.queryByTestId('order-V')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'All' }));
  expect(screen.getByTestId('order-V')).toBeTruthy();
  expect(screen.queryByTestId('order-X')).toBeNull();
  expect(svc.getSessionOrders).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch', target_date: '2026-10-27' });
});

it('searches by phone', async () => {
  await render(<HomeScreen />);
  await fireEvent.changeText(await screen.findByPlaceholderText('Search orders'), '07700B');
  expect(screen.queryByTestId('order-A')).toBeNull();
  expect(screen.getByTestId('order-B')).toBeTruthy();
});

it('Start delivery waits for ordering to close', async () => {
  mockSessionState = 'open';
  await render(<HomeScreen />);
  expect(await screen.findByText('Available after ordering closes')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Start delivery' }).props.accessibilityState).toMatchObject({ disabled: true });
});

it('Start delivery moves the area on and refreshes', async () => {
  await render(<HomeScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Start delivery' }));
  await fireEvent.press(screen.getByText('Start'));
  await waitFor(() => expect(svc.startDelivery).toHaveBeenCalledWith({ area_id: 3, meal_time: 'lunch' }));
  await waitFor(() => expect(svc.getSessionOrders).toHaveBeenCalledTimes(2));
});

it('Delivered on an order not yet paid then asks whether it was paid', async () => {
  await render(<HomeScreen />);
  await fireEvent.press(within(await screen.findByTestId('order-B')).getByRole('button', { name: 'DELIVERED' }));
  await fireEvent.press(screen.getByText('Yes, delivered'));
  await waitFor(() => expect(svc.markDelivered).toHaveBeenCalledWith('B'));
  expect(await screen.findByText('Was it paid?')).toBeTruthy();
  await fireEvent.press(screen.getByText('Paid'));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('B', 'paid'));
});

it('Failed needs a reason and sends it', async () => {
  await render(<HomeScreen />);
  await fireEvent.press(within(await screen.findByTestId('order-B')).getByRole('button', { name: 'FAILED' }));
  await fireEvent.changeText(screen.getByTestId('fail-reason-input'), 'Not at hostel');
  await fireEvent.press(screen.getByRole('button', { name: 'Mark failed' }));
  await waitFor(() => expect(svc.markFailed).toHaveBeenCalledWith('B', 'Not at hostel'));
});

it('Unpaid on a waiting order records it without delivering', async () => {
  await render(<HomeScreen />);
  await fireEvent.press(within(await screen.findByTestId('order-A')).getByRole('button', { name: 'UNPAID' }));
  await fireEvent.press(screen.getByText('Unpaid'));
  await waitFor(() => expect(svc.setPayment).toHaveBeenCalledWith('A', 'unpaid'));
  expect(svc.markDelivered).not.toHaveBeenCalled();
});

it("shows the server's message when an action fails", async () => {
  svc.markDelivered.mockRejectedValue(new Error('Cannot change status from delivered to delivered'));
  await render(<HomeScreen />);
  await fireEvent.press(within(await screen.findByTestId('order-B')).getByRole('button', { name: 'DELIVERED' }));
  await fireEvent.press(screen.getByText('Yes, delivered'));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Could not update', 'Cannot change status from delivered to delivered'));
});

it('asks for an area when nothing is selected', async () => {
  mockSelection = null;
  await render(<HomeScreen />);
  expect(await screen.findByText('Choose a delivery area first')).toBeTruthy();
  expect(svc.getSessionOrders).not.toHaveBeenCalled();
});
