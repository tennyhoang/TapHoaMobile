import { addressesService } from '../../services/addresses.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockAddress = {
  id: 'addr1',
  receiverName: 'Nguyễn Văn A',
  phoneNumber: '0912345678',
  province: 'TP.HCM',
  district: 'Quận 1',
  ward: 'Bến Nghé',
  streetAddress: '123 Lê Lợi',
  isDefault: true,
};

describe('addressesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('calls GET /addresses and returns address list', async () => {
      mockApi.get.mockResolvedValueOnce([mockAddress]);

      const result = await addressesService.getAll();

      expect(result).toEqual([mockAddress]);
      expect(mockApi.get).toHaveBeenCalledWith('/addresses');
    });

    it('returns empty array when no addresses', async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const result = await addressesService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('calls POST /addresses with full payload and returns new address', async () => {
      mockApi.post.mockResolvedValueOnce(mockAddress);

      const payload = {
        receiverName: 'Nguyễn Văn A',
        phoneNumber: '0912345678',
        province: 'TP.HCM',
        district: 'Quận 1',
        ward: 'Bến Nghé',
        streetAddress: '123 Lê Lợi',
        isDefault: true,
      };
      const result = await addressesService.add(payload);

      expect(result).toEqual(mockAddress);
      expect(mockApi.post).toHaveBeenCalledWith('/addresses', payload);
    });

    it('adds address without isDefault field', async () => {
      mockApi.post.mockResolvedValueOnce({ ...mockAddress, isDefault: false });

      const payload = {
        receiverName: 'Trần Thị B',
        phoneNumber: '0987654321',
        province: 'Hà Nội',
        district: 'Hoàn Kiếm',
        ward: 'Hàng Bạc',
        streetAddress: '45 Hàng Bạc',
      };
      await addressesService.add(payload);

      expect(mockApi.post).toHaveBeenCalledWith('/addresses', payload);
    });

    it('propagates error when api throws', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Đã tồn tại địa chỉ mặc định'));

      await expect(addressesService.add({ ...mockAddress })).rejects.toThrow(
        'Đã tồn tại địa chỉ mặc định'
      );
    });
  });

  describe('setDefault', () => {
    it('calls PATCH /addresses/:id/default', async () => {
      const updated = { ...mockAddress, isDefault: true };
      mockApi.patch.mockResolvedValueOnce(updated);

      const result = await addressesService.setDefault('addr1');

      expect(result).toEqual(updated);
      expect(mockApi.patch).toHaveBeenCalledWith('/addresses/addr1/default', {});
    });
  });

  describe('delete', () => {
    it('calls DELETE /addresses/:id', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      await addressesService.delete('addr1');

      expect(mockApi.delete).toHaveBeenCalledWith('/addresses/addr1');
    });
  });
});
