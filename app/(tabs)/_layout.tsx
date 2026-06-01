import { Tabs, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useCartCount } from '@/lib/cart-context';
import TabBar from '@/components/TabBar';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const { token, isLoading } = useAuth();
  const { itemCount, refreshCount } = useCartCount();

  useEffect(() => {
    if (token) refreshCount();
  }, [token]);

  if (isLoading) return null;
  if (!token) return <Redirect href={'/(auth)/login' as any} />;

  const tint = Colors.light.primary;

  return (
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Sản phẩm',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'storefront' : 'storefront-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Giỏ hàng',
          tabBarBadge: itemCount > 0 ? (itemCount > 99 ? '99+' : itemCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', fontSize: 10 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
