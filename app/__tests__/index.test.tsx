import { render, screen } from '@testing-library/react-native';
import React from 'react';
import Index from '../index';

// No JSX inside factories (the JSX runtime helper is an out-of-scope variable for babel-jest's hoisting check)
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => require('react').createElement(require('react-native').Text, null, `redirect:${href}`),
}));
jest.mock('@/services', () => ({ authService: { isAuthenticated: jest.fn() } }));

import { authService } from '@/services';
const isAuthenticated = authService.isAuthenticated as jest.Mock;

it('a signed-in driver goes straight to area selection', async () => {
  isAuthenticated.mockResolvedValue(true);
  await render(<Index />);
  expect(await screen.findByText('redirect:/(routes)/area-selection')).toBeTruthy();
});

it('anyone else goes to login, also when the check throws', async () => {
  isAuthenticated.mockResolvedValue(false);
  await render(<Index />);
  expect(await screen.findByText('redirect:/(routes)/login')).toBeTruthy();
  isAuthenticated.mockRejectedValue(new Error('storage'));
  await render(<Index />);
  expect(await screen.findByText('redirect:/(routes)/login')).toBeTruthy();
});
