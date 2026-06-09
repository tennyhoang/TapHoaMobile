import { api } from '@/lib/api';
import type { Claim, ClaimType, PagedResult } from '@/types';

type CreateClaimPayload = {
  orderId: string;
  type: ClaimType;
  description: string;
};

export const claimsService = {
  getMyClaims: (params?: { page?: number; pageSize?: number }): Promise<PagedResult<Claim>> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    return api.get(`/customer/claims${qs.toString() ? `?${qs}` : ''}`);
  },

  create: (payload: CreateClaimPayload): Promise<Claim> => api.post('/claims', payload),
};
