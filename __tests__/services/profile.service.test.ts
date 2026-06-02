import { profileService } from '@/services/profile.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockProfile = {
  id: 'u1',
  email: 'user@example.com',
  fullName: 'Nguyễn Văn A',
  phoneNumber: '0912345678',
  avatarUrl: null,
  isActive: true,
};

describe('profileService', () => {
  describe('getMe', () => {
    it('calls GET /users/me', async () => {
      mockApi.get.mockResolvedValueOnce(mockProfile);
      const result = await profileService.getMe();
      expect(result).toEqual(mockProfile);
      expect(mockApi.get).toHaveBeenCalledWith('/users/me');
    });

    it('propagates error', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Unauthorized'));
      await expect(profileService.getMe()).rejects.toThrow('Unauthorized');
    });
  });

  describe('update', () => {
    it('calls PUT /users/me with payload', async () => {
      mockApi.put.mockResolvedValueOnce({ ...mockProfile, fullName: 'Mới' });
      const result = await profileService.update({ fullName: 'Mới', phoneNumber: '0900000000' });
      expect(result.fullName).toBe('Mới');
      expect(mockApi.put).toHaveBeenCalledWith('/users/me', {
        fullName: 'Mới',
        phoneNumber: '0900000000',
      });
    });

    it('propagates validation error', async () => {
      mockApi.put.mockRejectedValueOnce(new Error('Tên không hợp lệ'));
      await expect(profileService.update({ fullName: '' })).rejects.toThrow('Tên không hợp lệ');
    });
  });

  describe('changePassword', () => {
    it('calls PATCH /users/me/password', async () => {
      mockApi.patch.mockResolvedValueOnce(undefined);
      await profileService.changePassword({ currentPassword: 'old123', newPassword: 'new456' });
      expect(mockApi.patch).toHaveBeenCalledWith('/users/me/password', {
        currentPassword: 'old123',
        newPassword: 'new456',
      });
    });

    it('propagates wrong password error', async () => {
      mockApi.patch.mockRejectedValueOnce(new Error('Mật khẩu không đúng'));
      await expect(
        profileService.changePassword({ currentPassword: 'wrong', newPassword: 'new' })
      ).rejects.toThrow('Mật khẩu không đúng');
    });
  });

  describe('deleteAccount', () => {
    it('calls DELETE /users/me', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);
      await profileService.deleteAccount();
      expect(mockApi.delete).toHaveBeenCalledWith('/users/me');
    });
  });
});
