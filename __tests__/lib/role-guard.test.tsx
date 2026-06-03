import { renderHook } from '@testing-library/react-native';
import { useRoleGuard } from '@/lib/useRoleGuard';

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('useRoleGuard', () => {
  it('returns true and redirects when user has wrong role', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Customer' }, isLoading: false });
    const { result } = renderHook(() => useRoleGuard('Admin'));
    const { router } = jest.requireMock('expo-router');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    expect(result.current).toBe(true);
  });

  it('returns false when user has an allowed role', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' }, isLoading: false });
    const { result } = renderHook(() => useRoleGuard('Admin', 'SuperAdmin'));
    expect(result.current).toBe(false);
  });

  it('returns true while loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    const { result } = renderHook(() => useRoleGuard('Admin'));
    expect(result.current).toBe(true);
  });

  it('redirects when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    renderHook(() => useRoleGuard('Admin'));
    const { router } = jest.requireMock('expo-router');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });
});
