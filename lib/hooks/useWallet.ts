import { useQuery, useMutation } from '@tanstack/react-query';
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

export function useInitiateTopup() {
  return useMutation({
    mutationFn: ({ amount }: { amount: number }) => walletService.initiateTopup(amount),
  });
}
