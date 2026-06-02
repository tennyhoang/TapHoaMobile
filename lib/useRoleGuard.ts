import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

/**
 * Redirects to home if the current user's role is not in the allowed list.
 * Call at the top of any screen that requires a specific role.
 */
export function useRoleGuard(...allowedRoles: string[]) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user || !allowedRoles.includes(user.role)) {
      router.replace('/(tabs)' as any);
    }
  }, [user, isLoading]);

  // Returns true while we're still checking (screen should show nothing)
  return isLoading || !user || !allowedRoles.includes(user.role);
}
