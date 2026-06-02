import { api } from '@/lib/api';

type VoucherValidateResult = {
  discount: number;
  type: 'percent' | 'flat';
  label: string;
};

export const vouchersService = {
  validate: (code: string, total: number): Promise<VoucherValidateResult> =>
    api.post('/vouchers/validate', { code, total }),
};
