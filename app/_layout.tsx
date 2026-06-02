import '@/lib/i18n';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/lib/theme';
import OfflineBanner from '@/components/OfflineBanner';
import { storage } from '@/lib/storage';
import { ONBOARDING_KEY } from '@/app/onboarding';
import { addNotificationListener } from '@/lib/notifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(auth)' };

SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  tracesSampleRate: 0.2,
  enabled: !__DEV__,
});

export default Sentry.wrap(function RootLayout() {
  useEffect(() => {
    (async () => {
      const done = await storage.getItem(ONBOARDING_KEY);
      await SplashScreen.hideAsync();
      if (!done) router.replace('/onboarding' as any);
    })();
  }, []);

  useEffect(() => {
    return addNotificationListener(
      () => {},
      response => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (data?.orderId) router.push(`/order/${data.orderId}` as any);
        else if (data?.screen) router.push(data.screen as any);
        else router.push('/notifications' as any);
      }
    );
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <OfflineBanner />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="(auth)/forgot-password"
                    options={{ animation: 'slide_from_right' }}
                  />
                  <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="product/search" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="checkout" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="orders" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="addresses" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="wallet" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="profile-edit" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="reviews/[id]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="wishlist" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="admin/index" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="admin/products" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="admin/orders" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="articles" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="flash-sale" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                  <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="help" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
});
