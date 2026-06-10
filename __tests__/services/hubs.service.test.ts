import { hubsService } from '@/services/hubs.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({ api: { get: jest.fn() } }));

const mockApi = api as jest.Mocked<typeof api>;

const mockHubs = [
  {
    id: 'h1',
    name: 'Hub Quận 1',
    address: '123 Lê Lợi',
    ward: 'Bến Nghé',
    district: 'Quận 1',
    city: 'TP.HCM',
    latitude: 10.77,
    longitude: 106.7,
  },
];

describe('hubsService', () => {
  describe('getActive', () => {
    it('calls GET /hubs with no query string when no params', async () => {
      mockApi.get.mockResolvedValueOnce(mockHubs);
      const result = await hubsService.getActive();
      expect(result).toEqual(mockHubs);
      expect(mockApi.get).toHaveBeenCalledWith('/hubs');
    });

    it('appends city param', async () => {
      mockApi.get.mockResolvedValueOnce(mockHubs);
      await hubsService.getActive({ city: 'TP.HCM' });
      expect(mockApi.get).toHaveBeenCalledWith('/hubs?city=TP.HCM');
    });

    it('appends city and district params', async () => {
      mockApi.get.mockResolvedValueOnce(mockHubs);
      await hubsService.getActive({ city: 'TP.HCM', district: 'Quận 1' });
      const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('city=TP.HCM');
      expect(url).toContain('district=Qu%E1%BA%ADn+1');
    });

    it('ignores undefined district', async () => {
      mockApi.get.mockResolvedValueOnce(mockHubs);
      await hubsService.getActive({ city: 'TP.HCM', district: undefined });
      expect(mockApi.get).toHaveBeenCalledWith('/hubs?city=TP.HCM');
    });

    it('propagates error', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Server error'));
      await expect(hubsService.getActive()).rejects.toThrow('Server error');
    });
  });
});
