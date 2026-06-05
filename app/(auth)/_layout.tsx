import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function AuthLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;
  if (token) return <Redirect href={'/(tabs)' as any} />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
