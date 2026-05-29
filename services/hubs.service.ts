import { api } from '@/lib/api';
import type { Hub } from '@/types';

export const hubsService = {
  getActive: (city?: string, district?: string): Promise<Hub[]> => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (district) params.set('district', district);
    const qs = params.toString();
    return api.get(`/hubs${qs ? `?${qs}` : ''}`);
  },
};
