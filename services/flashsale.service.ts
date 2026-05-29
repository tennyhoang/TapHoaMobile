import { api } from '@/lib/api';
import type { FlashSaleSession } from '@/types';

export const flashSaleService = {
  getCurrent: (): Promise<FlashSaleSession | null> =>
    api.get<FlashSaleSession | null>('/flash-sale/current'),
};
