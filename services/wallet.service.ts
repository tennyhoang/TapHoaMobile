import { api } from '@/lib/api';
import type { WalletBalance, WalletTransaction, PagedResult } from '@/types';

export const walletService = {
  getBalance: async (): Promise<WalletBalance> => api.get<WalletBalance>('/wallet/me'),

  getTransactions: (page = 1, pageSize = 20): Promise<PagedResult<WalletTransaction>> =>
    api.get<PagedResult<WalletTransaction>>(
      `/wallet/me/transactions?page=${page}&pageSize=${pageSize}`
    ),

  topUp: (amount: number, paymentRef: string): Promise<WalletBalance> =>
    api.post<WalletBalance>('/wallet/topup', { amount, paymentRef }),
};
