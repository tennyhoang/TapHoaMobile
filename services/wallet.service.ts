import { api } from '@/lib/api';
import type { WalletBalance, WalletTransaction, PagedResult } from '@/types';

export const walletService = {
  getBalance: (): Promise<WalletBalance> => api.get<WalletBalance>('/wallet/balance'),

  getTransactions: (page = 1, pageSize = 20): Promise<PagedResult<WalletTransaction>> =>
    api.get<PagedResult<WalletTransaction>>(
      `/wallet/transactions?page=${page}&pageSize=${pageSize}`
    ),
};
