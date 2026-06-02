import { vouchersService } from '@/services/vouchers.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({ api: { post: jest.fn() } }));

const mockApi = api as jest.Mocked<typeof api>;

describe('vouchersService', () => {
  describe('validate', () => {
    it('calls POST /vouchers/validate with code and total', async () => {
      const mockResult = { discount: 10000, type: 'flat', label: 'Giảm 10.000đ' };
      mockApi.post.mockResolvedValueOnce(mockResult);

      const result = await vouchersService.validate('SALE10', 200000);

      expect(result).toEqual(mockResult);
      expect(mockApi.post).toHaveBeenCalledWith('/vouchers/validate', {
        code: 'SALE10',
        total: 200000,
      });
    });

    it('returns percent-type voucher result', async () => {
      const mockResult = { discount: 20000, type: 'percent', label: 'Giảm 10%' };
      mockApi.post.mockResolvedValueOnce(mockResult);

      const result = await vouchersService.validate('TAPHOA10', 200000);

      expect(result.type).toBe('percent');
      expect(result.discount).toBe(20000);
    });

    it('propagates error for invalid code', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Mã voucher không hợp lệ'));
      await expect(vouchersService.validate('INVALID', 100000)).rejects.toThrow(
        'Mã voucher không hợp lệ'
      );
    });

    it('propagates error for expired code', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Voucher đã hết hạn'));
      await expect(vouchersService.validate('EXPIRED', 100000)).rejects.toThrow(
        'Voucher đã hết hạn'
      );
    });
  });
});
