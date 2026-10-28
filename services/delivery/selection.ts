import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealTime } from '../types/api.types';

/** The area and meal session the driver is working, chosen on the area-selection screen */
export interface DeliverySelection {
  areaId: number;
  area: string;
  sessionId: number;
  mealTime: MealTime;
  date: string; // YYYY-MM-DD, the session date
}

const KEY = 'rc_selected_area';
const LEGACY_PREFIXES = ['rc_delivery_paid_summary_area_', 'rc_delivery_unpaid_collected_area_'];
const MEALS: MealTime[] = ['breakfast', 'lunch', 'dinner'];

export async function saveSelection(selection: DeliverySelection): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(selection));
}

/** null when nothing is stored or it is the old { areaId, area } shape without a session */
export async function loadSelection(): Promise<DeliverySelection | null> {
  try {
    const s = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
    const valid = s && Number.isInteger(s.areaId) && typeof s.area === 'string' && Number.isInteger(s.sessionId)
      && MEALS.includes(s.mealTime) && /^\d{4}-\d{2}-\d{2}$/.test(s.date);
    return valid ? { areaId: s.areaId, area: s.area, sessionId: s.sessionId, mealTime: s.mealTime, date: s.date } : null;
  } catch {
    return null;
  }
}

/** Forget the selection and the local counters older builds kept */
export async function clearDeliveryStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter((k) => k === KEY || LEGACY_PREFIXES.some((p) => k.startsWith(p)));
  if (stale.length) await AsyncStorage.multiRemove(stale);
}
