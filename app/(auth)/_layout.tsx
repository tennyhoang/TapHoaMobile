import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth-context';

export default function AuthLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#067478',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  if (token) return <Redirect href={'/(tabs)' as any} />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
