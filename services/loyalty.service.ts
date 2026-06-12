import { api } from '@/lib/api';
import type { LoyaltyPointsBalance, LoyaltyTransaction, PagedResult } from '@/types';

export const loyaltyService = {
  getBalance: (): Promise<LoyaltyPointsBalance> => api.get('/loyalty/points'),

  getTransactions: (page = 1, pageSize = 20): Promise<PagedResult<LoyaltyTransaction>> =>
    api.get(`/loyalty/transactions?page=${page}&pageSize=${pageSize}`),
};
