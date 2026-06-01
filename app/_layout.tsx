import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { ToastProvider } from '@/components/Toast';
import { storage } from '@/lib/storage';
import { ONBOARDING_KEY } from '@/app/onboarding';
import { addNotificationListener } from '@/lib/notifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const done = await storage.getItem(ONBOARDING_KEY);
      await SplashScreen.hideAsync();
      if (!done) router.replace('/onboarding' as any);
    })();
  }, []);

  // Handle notification taps → navigate to the relevant screen
  useEffect(() => {
    return addNotificationListener(
      () => {}, // foreground receive — toast handled by notification handler
      response => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (data?.orderId) router.push(`/order/${data.orderId}` as any);
        else if (data?.screen) router.push(data.screen as any);
        else router.push('/notifications' as any);
      }
    );
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
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
                <Stack.Screen name="admin/products" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="articles" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="flash-sale" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
