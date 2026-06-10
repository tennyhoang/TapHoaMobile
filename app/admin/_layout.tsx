import { Stack } from 'expo-router';
import { useRoleGuard } from '@/lib/useRoleGuard';

export default function AdminLayout() {
  const unauthorized = useRoleGuard('Admin');
  if (unauthorized) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
