import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/services/wallet.service';
import { queryKeys } from './queryKeys';
import type { WalletBalance, WalletTransaction, PagedResult } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useWalletBalance(options?: Partial<UseQueryOptions<WalletBalance>>) {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: () => walletService.getBalance(),
    staleTime: 30_000,
    ...options,
  });
}

export function useWalletTransactions(
  page = 1,
  options?: Partial<UseQueryOptions<PagedResult<WalletTransaction>>>
) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(page),
    queryFn: () => walletService.getTransactions(page),
    ...options,
  });
}

export function useTopUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, paymentRef }: { amount: number; paymentRef: string }) =>
      walletService.topUp(amount, paymentRef),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.balance });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.transactions() });
    },
  });
}
