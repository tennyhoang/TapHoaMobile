import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from './queryKeys';

export function useLoyaltyBalance() {
  return useQuery({
    queryKey: queryKeys.loyalty.balance,
    queryFn: () => loyaltyService.getBalance(),
    staleTime: 30_000,
  });
}

export function useLoyaltyTransactions(page = 1) {
  return useQuery({
    queryKey: queryKeys.loyalty.transactions(page),
    queryFn: () => loyaltyService.getTransactions(page),
    staleTime: 30_000,
  });
}
