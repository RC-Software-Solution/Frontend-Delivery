import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearDeliveryStorage, loadSelection, saveSelection } from '../selection';

const SEL = { areaId: 3, area: 'Block A', sessionId: 7, mealTime: 'lunch' as const, date: '2026-10-27' };

beforeEach(() => AsyncStorage.clear());

it('round-trips a selection', async () => {
  await saveSelection(SEL);
  await expect(loadSelection()).resolves.toEqual(SEL);
});

it('treats the old { areaId, area } format and junk as no selection', async () => {
  await AsyncStorage.setItem('rc_selected_area', JSON.stringify({ areaId: 3, area: 'Block A' }));
  await expect(loadSelection()).resolves.toBeNull();
  await AsyncStorage.setItem('rc_selected_area', 'not json');
  await expect(loadSelection()).resolves.toBeNull();
});

it('clears the selection and the legacy local counters only', async () => {
  await saveSelection(SEL);
  await AsyncStorage.multiSet([['rc_delivery_paid_summary_area_3', '{}'], ['rc_delivery_unpaid_collected_area_3', '{}'], ['access_token', 't']]);
  await clearDeliveryStorage();
  expect(await AsyncStorage.getAllKeys()).toEqual(['access_token']);
});
