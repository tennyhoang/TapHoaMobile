import { cartService } from '../../services/cart.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockCart = {
  items: [
    {
      productId: 'p1',
      productName: 'Sản phẩm A',
      price: 10000,
      quantity: 2,
      stock: 10,
      unitPrice: 10000,
      subtotal: 20000,
    },
  ],
  totalAmount: 20000,
  totalItems: 2,
};

describe('cartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('calls GET /cart and returns cart data', async () => {
      mockApi.get.mockResolvedValueOnce(mockCart);

      const result = await cartService.get();

      expect(result).toEqual(mockCart);
      expect(mockApi.get).toHaveBeenCalledWith('/cart');
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi 401'));

      await expect(cartService.get()).rejects.toThrow('Lỗi 401');
    });
  });

  describe('add', () => {
    it('calls POST /cart with productId and quantity', async () => {
      mockApi.post.mockResolvedValueOnce(mockCart);

      const result = await cartService.add('p1', 3);

      expect(result).toEqual(mockCart);
      expect(mockApi.post).toHaveBeenCalledWith('/cart', { productId: 'p1', quantity: 3 });
    });
  });

  describe('update', () => {
    it('calls PUT /cart/:productId with new quantity', async () => {
      mockApi.put.mockResolvedValueOnce(mockCart);

      const result = await cartService.update('p1', 5);

      expect(result).toEqual(mockCart);
      expect(mockApi.put).toHaveBeenCalledWith('/cart/p1', { quantity: 5 });
    });
  });

  describe('remove', () => {
    it('calls DELETE /cart/:productId', async () => {
      const updatedCart = { items: [], totalAmount: 0, totalItems: 0 };
      mockApi.delete.mockResolvedValueOnce(updatedCart);

      const result = await cartService.remove('p1');

      expect(result).toEqual(updatedCart);
      expect(mockApi.delete).toHaveBeenCalledWith('/cart/p1');
    });
  });

  describe('clear', () => {
    it('calls DELETE /cart', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      await cartService.clear();

      expect(mockApi.delete).toHaveBeenCalledWith('/cart');
    });
  });
});
