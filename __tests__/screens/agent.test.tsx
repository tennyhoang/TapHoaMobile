import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AgentScreen from '@/app/agent/index/index';
import { agentService } from '@/services/agent.service';

jest.mock('@/services/agent.service', () => ({
  agentService: { getOrders: jest.fn(), arrive: jest.fn(), completePickup: jest.fn() },
}));

jest.mock('@/lib/useRoleGuard', () => ({ useRoleGuard: jest.fn().mockReturnValue(undefined) }));

const mockToastShow = jest.fn();
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ show: mockToastShow }),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

const wrapper = ({ children }: any) => <SafeAreaProvider>{children}</SafeAreaProvider>;

const mockService = jest.mocked(agentService);

const mockIncomingOrder = {
  id: 'o1',
  status: 'ShippingToHub' as const,
  totalAmount: 150000,
  walletAmountUsed: 0,
  hub: {
    id: 'h1',
    name: 'Hub Q1',
    address: '123',
    ward: 'BN',
    district: 'Q1',
    city: 'HCM',
    latitude: 0,
    longitude: 0,
  },
  items: [
    { productId: 'p1', productName: 'Gạo', quantity: 1, unitPrice: 150000, subtotal: 150000 },
  ],
  createdAt: '2025-01-01T00:00:00Z',
};

const mockReadyOrder = {
  id: 'o2',
  status: 'InHub_ReadyForPickup' as const,
  totalAmount: 200000,
  walletAmountUsed: 0,
  hub: {
    id: 'h1',
    name: 'Hub Q1',
    address: '123',
    ward: 'BN',
    district: 'Q1',
    city: 'HCM',
    latitude: 0,
    longitude: 0,
  },
  items: [
    { productId: 'p2', productName: 'Táo', quantity: 2, unitPrice: 100000, subtotal: 200000 },
  ],
  createdAt: '2025-01-01T00:00:00Z',
};

const mockPaged = (items: any[]) => ({
  items,
  totalCount: items.length,
  page: 1,
  pageSize: 50,
  totalPages: 1,
});

describe('AgentScreen', () => {
  beforeEach(() => {
    mockService.getOrders.mockImplementation((status: string) => {
      if (status === 'ShippingToHub') return Promise.resolve(mockPaged([mockIncomingOrder]));
      if (status === 'InHub_ReadyForPickup') return Promise.resolve(mockPaged([mockReadyOrder]));
      return Promise.resolve(mockPaged([]));
    });
  });

  it('renders loading state initially', () => {
    mockService.getOrders.mockReturnValue(new Promise(() => {}));
    const { toJSON } = render(<AgentScreen />, { wrapper });
    expect(toJSON()).not.toBeNull();
  });

  it('renders incoming orders by default', async () => {
    const { getByText } = render(<AgentScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('#O1')).toBeTruthy();
      expect(getByText(/150.000/)).toBeTruthy();
    });
  });

  it('renders header with portal name', async () => {
    const { getByText } = render(<AgentScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Cổng Agent')).toBeTruthy();
    });
  });

  it('renders stats row', async () => {
    const { getByText } = render(<AgentScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Đang về')).toBeTruthy();
      expect(getByText('Tại Hub')).toBeTruthy();
    });
  });

  it('renders tab bar', async () => {
    const { getByText } = render(<AgentScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Đang về Hub')).toBeTruthy();
      expect(getByText('Chờ khách lấy')).toBeTruthy();
    });
  });

  it('switches to ready tab on press', async () => {
    const { getByText } = render(<AgentScreen />, { wrapper });
    await waitFor(() => getByText('Chờ khách lấy'));
    fireEvent.press(getByText('Chờ khách lấy'));
    await waitFor(() => {
      expect(getByText('#O2')).toBeTruthy();
    });
  });

  it('renders empty state when no incoming orders', async () => {
    mockService.getOrders.mockResolvedValue(mockPaged([]));
    const { getByText } = render(<AgentScreen />, { wrapper });
    await waitFor(() => {
      expect(getByText('Không có đơn nào đang về Hub')).toBeTruthy();
    });
  });

  it('returns null when unauthorized', () => {
    const { useRoleGuard } = jest.requireMock('@/lib/useRoleGuard');
    useRoleGuard.mockReturnValueOnce(true);
    const { toJSON } = render(<AgentScreen />, { wrapper });
    expect(toJSON()).toBeNull();
  });
});
