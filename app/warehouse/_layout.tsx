import { Stack } from 'expo-router';
import { useRoleGuard } from '@/lib/useRoleGuard';

export default function WarehouseLayout() {
  const unauthorized = useRoleGuard('WarehouseManager');
  if (unauthorized) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
