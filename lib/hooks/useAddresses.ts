import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesService } from '@/services/addresses.service';
import { queryKeys } from './queryKeys';
import type { Address } from '@/types';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useAddresses(options?: Partial<UseQueryOptions<Address[]>>) {
  return useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: () => addressesService.getAll(),
    staleTime: 30_000,
    ...options,
  });
}

type AddAddressPayload = {
  receiverName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault?: boolean;
};

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddAddressPayload) => addressesService.add(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesService.setDefault(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}
