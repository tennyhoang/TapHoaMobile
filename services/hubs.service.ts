import { api } from '@/lib/api';
import type { Hub } from '@/types';

export const hubsService = {
  getActive: (params?: {
    city?: string;
    district?: string;
    lat?: number;
    lng?: number;
  }): Promise<Hub[]> => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.district) qs.set('district', params.district);
    if (params?.lat != null) qs.set('lat', String(params.lat));
    if (params?.lng != null) qs.set('lng', String(params.lng));
    const q = qs.toString();
    return api.get(`/hubs${q ? `?${q}` : ''}`);
  },
};
