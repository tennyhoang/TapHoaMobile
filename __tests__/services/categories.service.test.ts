import { categoriesService } from '../../services/categories.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockCategories = [
  {
    id: 'cat1',
    name: 'Thực phẩm',
    children: [
      { id: 'cat1-1', name: 'Gạo & Ngũ cốc', children: [] },
      { id: 'cat1-2', name: 'Đồ uống', children: [] },
    ],
  },
  {
    id: 'cat2',
    name: 'Gia dụng',
    children: [],
  },
];

describe('categoriesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('calls GET /categories and returns category list', async () => {
      mockApi.get.mockResolvedValueOnce(mockCategories);

      const result = await categoriesService.getAll();

      expect(result).toEqual(mockCategories);
      expect(mockApi.get).toHaveBeenCalledWith('/categories');
    });

    it('returns empty array when no categories', async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const result = await categoriesService.getAll();

      expect(result).toEqual([]);
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi mạng'));

      await expect(categoriesService.getAll()).rejects.toThrow('Lỗi mạng');
    });
  });
});
