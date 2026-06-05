import { api } from '@/lib/api';
import type { WalletBalance, WalletTransaction, PagedResult } from '@/types';

export type InitiateTopupResult = {
  paymentRef: string;
  amount: number;
};

export const walletService = {
  getBalance: async (): Promise<WalletBalance> => api.get<WalletBalance>('/wallet/me'),

  getTransactions: (page = 1, pageSize = 20): Promise<PagedResult<WalletTransaction>> =>
    api.get<PagedResult<WalletTransaction>>(
      `/wallet/me/transactions?page=${page}&pageSize=${pageSize}`
    ),

  // Step 1: ask server to create a topup request, get back paymentRef for QR
  initiateTopup: (amount: number): Promise<InitiateTopupResult> =>
    api.post<InitiateTopupResult>('/wallet/me/topup/initiate', { amount }),

  // Withdraw request
  createWithdrawRequest: (data: {
    amount: number;
    bankName: string;
    accountNumber: string;
    holderName: string;
  }): Promise<{ id: string }> => api.post<{ id: string }>('/wallet/me/withdraw-request', data),
};
