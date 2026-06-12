import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LoyaltyScreen from '@/app/loyalty/index';
import * as useLoyaltyHooks from '@/lib/hooks/useLoyalty';
import type { LoyaltyPointsBalance, LoyaltyTransaction, PagedResult } from '@/types';

jest.mock('@/lib/hooks/useLoyalty', () => ({
  useLoyaltyBalance: jest.fn(),
  useLoyaltyTransactions: jest.fn(),
}));

jest.mock('@/components/ScreenHeader', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
  Mock.displayName = 'ScreenHeader';
  return Mock;
});

jest.mock('@/components/EmptyState', () => {
  const { View, Text } = jest.requireActual('react-native');
  const Mock = ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
  Mock.displayName = 'EmptyState';
  return Mock;
});

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  const LinearGradient = ({ children }: any) => <View>{children}</View>;
  LinearGradient.displayName = 'LinearGradient';
  return { LinearGradient };
});

jest.mock('@/lib/utils', () => ({
  formatCurrency: (v: number) => `${v.toLocaleString('vi-VN')} ₫`,
}));

const mockBalance: LoyaltyPointsBalance = { points: 1200, lifetimePoints: 3500 };

const mockTxns: PagedResult<LoyaltyTransaction> = {
  items: [
    {
      id: 'tx1',
      points: 100,
      type: 'Earned',
      description: 'Đơn hàng #ORD001',
      createdAt: '2026-06-01T10:00:00Z',
    },
    {
      id: 'tx2',
      points: 50,
      type: 'Redeemed',
      description: 'Đổi điểm thanh toán',
      createdAt: '2026-06-05T14:30:00Z',
    },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

const mockHooks = jest.mocked(useLoyaltyHooks);

function setupMocks(opts: { balLoading?: boolean; txLoading?: boolean } = {}) {
  mockHooks.useLoyaltyBalance.mockReturnValue({
    data: opts.balLoading ? undefined : mockBalance,
    isLoading: !!opts.balLoading,
  } as any);
  mockHooks.useLoyaltyTransactions.mockReturnValue({
    data: opts.txLoading ? undefined : mockTxns,
    isLoading: !!opts.txLoading,
    refetch: jest.fn(),
    isRefetching: false,
  } as any);
}

describe('LoyaltyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('renders screen title', () => {
    const { getAllByText } = render(<LoyaltyScreen />);
    expect(getAllByText('Điểm tích luỹ').length).toBeGreaterThanOrEqual(1);
  });

  it('renders balance card with points', async () => {
    const { getByText } = render(<LoyaltyScreen />);
    await waitFor(() => {
      // balance.points = 1200 — format varies by locale; match digits only
      expect(getByText(/1[\.,]?200|1200/)).toBeTruthy();
    });
  });

  it('renders lifetime points', async () => {
    const { getByText } = render(<LoyaltyScreen />);
    await waitFor(() => {
      // "Tổng tích luỹ: 3.500 điểm" or "3,500" depending on locale
      expect(getByText(/Tổng tích luỹ/)).toBeTruthy();
    });
  });

  it('renders transaction history items', async () => {
    const { getByText } = render(<LoyaltyScreen />);
    await waitFor(() => {
      expect(getByText('Đơn hàng #ORD001')).toBeTruthy();
      expect(getByText('Đổi điểm thanh toán')).toBeTruthy();
    });
  });

  it('shows earned points with plus sign', async () => {
    const { getByText } = render(<LoyaltyScreen />);
    await waitFor(() => {
      expect(getByText('+100')).toBeTruthy();
    });
  });

  it('shows redeemed points with minus sign', async () => {
    const { getByText } = render(<LoyaltyScreen />);
    await waitFor(() => {
      expect(getByText('-50')).toBeTruthy();
    });
  });

  it('shows empty state when no transactions', async () => {
    mockHooks.useLoyaltyTransactions.mockReturnValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);
    const { getByText } = render(<LoyaltyScreen />);
    await waitFor(() => {
      expect(getByText('Chưa có giao dịch')).toBeTruthy();
    });
  });

  it('shows error when balance unavailable', async () => {
    mockHooks.useLoyaltyBalance.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
    const { getByText } = render(<LoyaltyScreen />);
    await waitFor(() => {
      expect(getByText('Không tải được điểm tích luỹ')).toBeTruthy();
    });
  });
});
