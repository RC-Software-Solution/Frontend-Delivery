import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

// Expo Go lacks expo-notifications' FCM native modules (e.g.
// ExpoTopicSubscriptionModule), so importing the package there throws.
const Notifications: typeof NotificationsModule | null = isRunningInExpoGo()
  ? null
  : require('expo-notifications');

// Show notifications while the app is foregrounded; without this they arrive
// silently and only appear in the tray after the app is backgrounded.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Returns the native FCM registration token, or null if unavailable.
 *
 * The backend sends via firebase-admin (`admin.messaging().send({ token })`),
 * so it needs the *device* token. getExpoPushTokenAsync() returns an
 * `ExponentPushToken[...]` string, which firebase-admin rejects as an invalid
 * registration token — and the backend reacts to that by nulling the stored
 * token, so the mistake looks like an unsubscribe rather than a bug.
 */
export async function getFcmToken(): Promise<string | null> {
  if (!Notifications) return null;

  // iOS Simulator has no APNs registration; Android emulators with Play
  // Services do get real FCM tokens, so only iOS is excluded here.
  if (Platform.OS === 'ios' && !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.status === 'granted' ||
    (await Notifications.requestPermissionsAsync()).status === 'granted';
  if (!granted) return null;

  try {
    const { data } = await Notifications.getDevicePushTokenAsync();
    return typeof data === 'string' ? data : null;
  } catch (error) {
    console.log('FCM token fetch failed', error);
    return null;
  }
}
