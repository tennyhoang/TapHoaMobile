import { useMutation } from '@tanstack/react-query';
import { vouchersService } from '@/services/vouchers.service';

export function useValidateVoucher() {
  return useMutation({
    mutationFn: ({ code, total }: { code: string; total: number }) =>
      vouchersService.validate(code, total),
  });
}
