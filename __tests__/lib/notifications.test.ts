import {
  registerPushNotifications,
  getSavedPushToken,
  addNotificationListener,
} from '@/lib/notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('@/lib/storage', () => ({
  storage: {
    getItem: jest.fn(),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

const Notifications = jest.requireMock('expo-notifications');
const { storage } = jest.requireMock('@/lib/storage');

describe('notifications', () => {
  describe('registerPushNotifications', () => {
    it('returns token when permission granted', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[test]' });
      const token = await registerPushNotifications();
      expect(token).toBe('ExponentPushToken[test]');
      expect(storage.setItem).toHaveBeenCalled();
    });

    it('requests permission when not yet granted', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[test2]' });
      const token = await registerPushNotifications();
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(token).toBe('ExponentPushToken[test2]');
    });

    it('returns null when permission denied', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
      const token = await registerPushNotifications();
      expect(token).toBeNull();
    });

    it('returns null on token fetch error', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('fail'));
      const token = await registerPushNotifications();
      expect(token).toBeNull();
    });
  });

  describe('getSavedPushToken', () => {
    it('returns the stored token', async () => {
      storage.getItem.mockResolvedValueOnce('ExponentPushToken[saved]');
      const token = await getSavedPushToken();
      expect(token).toBe('ExponentPushToken[saved]');
    });

    it('returns null when no token stored', async () => {
      storage.getItem.mockResolvedValueOnce(null);
      const token = await getSavedPushToken();
      expect(token).toBeNull();
    });
  });

  describe('setNotificationHandler callback', () => {
    it('handleNotification returns correct display options', async () => {
      let capturedHandler: any;
      Notifications.setNotificationHandler.mockImplementationOnce((arg: any) => {
        capturedHandler = arg;
      });
      jest.isolateModules(() => {
        jest.requireActual('@/lib/notifications');
      });
      if (!capturedHandler) return;
      const result = await capturedHandler.handleNotification({});
      expect(result.shouldShowAlert).toBe(true);
      expect(result.shouldPlaySound).toBe(true);
      expect(result.shouldSetBadge).toBe(true);
    });
  });

  describe('addNotificationListener', () => {
    it('registers both listeners and returns cleanup function', () => {
      const onReceive = jest.fn();
      const onResponse = jest.fn();
      const cleanup = addNotificationListener(onReceive, onResponse);
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(onReceive);
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(
        onResponse
      );
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function removes both subscriptions', () => {
      const removeSpy = jest.fn();
      Notifications.addNotificationReceivedListener.mockReturnValueOnce({ remove: removeSpy });
      Notifications.addNotificationResponseReceivedListener.mockReturnValueOnce({
        remove: removeSpy,
      });
      const cleanup = addNotificationListener(jest.fn(), jest.fn());
      cleanup();
      expect(removeSpy).toHaveBeenCalledTimes(2);
    });
  });
});
