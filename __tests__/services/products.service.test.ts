import { productsService } from '../../services/products.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockProduct = {
  id: 'p1',
  name: 'Gạo ST25',
  price: 50000,
  stock: 100,
  categoryId: 'cat1',
  categoryName: 'Thực phẩm',
  averageRating: 4.5,
  reviewCount: 20,
  images: [],
  createdAt: '2025-01-01T00:00:00Z',
};

const mockPaged = {
  items: [mockProduct],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('productsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('calls GET /products with no query string when no params', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      const result = await productsService.getAll();

      expect(result).toEqual(mockPaged);
      expect(mockApi.get).toHaveBeenCalledWith('/products');
    });

    it('appends search param to query string', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await productsService.getAll({ search: 'gạo' });

      expect(mockApi.get).toHaveBeenCalledWith('/products?search=g%E1%BA%A1o');
    });

    it('appends categoryId and page params', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await productsService.getAll({ categoryId: 'cat1', page: 2, pageSize: 10 });

      const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('categoryId=cat1');
      expect(url).toContain('page=2');
      expect(url).toContain('pageSize=10');
    });

    it('appends isNew and isDiscount flags', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await productsService.getAll({ isNew: true, isDiscount: false });

      const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('isNew=true');
      expect(url).toContain('isDiscount=false');
    });

    it('appends sortBy param', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await productsService.getAll({ sortBy: 'price_asc' });

      expect(mockApi.get).toHaveBeenCalledWith('/products?sortBy=price_asc');
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi mạng'));

      await expect(productsService.getAll()).rejects.toThrow('Lỗi mạng');
    });
  });

  describe('getById', () => {
    it('calls GET /products/:id and returns product', async () => {
      mockApi.get.mockResolvedValueOnce(mockProduct);

      const result = await productsService.getById('p1');

      expect(result).toEqual(mockProduct);
      expect(mockApi.get).toHaveBeenCalledWith('/products/p1');
    });

    it('propagates error for non-existent product', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi 404'));

      await expect(productsService.getById('not-exist')).rejects.toThrow('Lỗi 404');
    });
  });
});
