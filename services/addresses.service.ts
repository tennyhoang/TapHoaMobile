import { api } from '@/lib/api';
import type { Address } from '@/types';

type AddAddressPayload = {
  receiverName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault?: boolean;
};

export const addressesService = {
  getAll: (): Promise<Address[]> => api.get('/addresses'),

  add: (payload: AddAddressPayload): Promise<Address> => api.post('/addresses', payload),

  setDefault: (id: string): Promise<Address> => api.patch(`/addresses/${id}/default`, {}),

  delete: (id: string): Promise<void> => api.delete(`/addresses/${id}`),
};
