import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { ToastProvider } from '@/components/Toast';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
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
              <Stack.Screen name="articles/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="articles/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="flash-sale" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
