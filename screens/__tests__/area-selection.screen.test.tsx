import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import AreaSelectionScreen from '../area-selection/area-selection.screen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
// jest.mock factories are hoisted above imports: build the fakes inside the factory, never from outer variables.
jest.mock('@/services', () => ({
  authService: { logout: jest.fn() },
  ErrorUtils: { getErrorMessage: (e: any) => e?.message ?? 'error' },
  locationService: { getAreas: jest.fn(async () => [{ area_id: 3, area_name: 'Block A' }, { area_id: 4, area_name: 'Block B' }]) },
  menuApi: {
    getMyDeliverySessions: jest.fn(async () => [
      { id: 7, date: '2026-10-27', meal_time: 'lunch', start_time: '06:00:00', end_time: '10:00:00', notes: null, state: 'closed', mine: [3], taken: [] },
    ]),
    setMyDeliveryAreas: jest.fn(async () => undefined),
  },
}));

beforeEach(() => AsyncStorage.clear());

it('choosing one of my areas saves the area with its session and opens the tabs', async () => {
  await render(<AreaSelectionScreen />);
  await fireEvent.press(await screen.findByText('Block A'));
  await waitFor(() => expect(router.push).toHaveBeenCalledWith('/(tabs)'));
  expect(JSON.parse((await AsyncStorage.getItem('rc_selected_area'))!)).toEqual({ areaId: 3, area: 'Block A', sessionId: 7, mealTime: 'lunch', date: '2026-10-27' });
});
