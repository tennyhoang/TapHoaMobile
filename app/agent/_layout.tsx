import { Stack } from 'expo-router';
import { useRoleGuard } from '@/lib/useRoleGuard';

export default function AgentLayout() {
  const unauthorized = useRoleGuard('Agent');
  if (unauthorized) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
