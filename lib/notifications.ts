import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { storage } from '@/lib/storage';
import { api } from '@/lib/api';

const PUSH_TOKEN_KEY = 'taphoa_push_token';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushNotifications(): Promise<string | null> {
  // Web / simulator: skip silently
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await storage.setItem(PUSH_TOKEN_KEY, token);
    // Gửi push token lên backend để server có thể gửi notification
    api.post('/notifications/push-token', { token, platform: Platform.OS }).catch(() => {});
    return token;
  } catch {
    return null;
  }
}

export async function getSavedPushToken(): Promise<string | null> {
  return storage.getItem(PUSH_TOKEN_KEY);
}

export function addNotificationListener(
  onReceive: (n: Notifications.Notification) => void,
  onResponse: (r: Notifications.NotificationResponse) => void
) {
  const receiveSub = Notifications.addNotificationReceivedListener(onReceive);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
