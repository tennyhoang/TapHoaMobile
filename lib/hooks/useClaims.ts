import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsService } from '@/services/claims.service';
import type { ClaimType } from '@/types';
import { queryKeys } from './queryKeys';

export function useMyClaims(page?: number, pageSize?: number) {
  return useQuery({
    queryKey: queryKeys.claims.my({ page, pageSize }),
    queryFn: () => claimsService.getMyClaims({ page, pageSize }),
    staleTime: 30_000,
  });
}

export function useCreateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { orderId: string; type: ClaimType; description: string }) =>
      claimsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.claims.all });
    },
  });
}
