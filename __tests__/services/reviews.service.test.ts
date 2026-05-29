import { reviewsService } from '../../services/reviews.service';
import { api } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockReview = {
  id: 'rev1',
  productId: 'p1',
  userId: 'u1',
  userName: 'Nguyễn Văn A',
  rating: 5,
  comment: 'Sản phẩm rất tốt!',
  createdAt: '2025-05-01T10:00:00Z',
};

const mockPaged = {
  items: [mockReview],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('reviewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByProduct', () => {
    it('calls GET with default page=1 and pageSize=20', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      const result = await reviewsService.getByProduct('p1');

      expect(result).toEqual(mockPaged);
      expect(mockApi.get).toHaveBeenCalledWith('/products/p1/reviews?page=1&pageSize=20');
    });

    it('passes custom page and pageSize', async () => {
      mockApi.get.mockResolvedValueOnce(mockPaged);

      await reviewsService.getByProduct('p1', 2, 5);

      expect(mockApi.get).toHaveBeenCalledWith('/products/p1/reviews?page=2&pageSize=5');
    });

    it('propagates error when api throws', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi 404'));

      await expect(reviewsService.getByProduct('not-exist')).rejects.toThrow('Lỗi 404');
    });
  });

  describe('submit', () => {
    it('calls POST /products/:productId/reviews with rating and comment', async () => {
      mockApi.post.mockResolvedValueOnce(mockReview);

      const result = await reviewsService.submit('p1', { rating: 5, comment: 'Tốt lắm!' });

      expect(result).toEqual(mockReview);
      expect(mockApi.post).toHaveBeenCalledWith('/products/p1/reviews', {
        rating: 5,
        comment: 'Tốt lắm!',
      });
    });

    it('submits review without comment', async () => {
      const reviewNoComment = { ...mockReview, comment: undefined };
      mockApi.post.mockResolvedValueOnce(reviewNoComment);

      await reviewsService.submit('p1', { rating: 4 });

      expect(mockApi.post).toHaveBeenCalledWith('/products/p1/reviews', { rating: 4 });
    });

    it('propagates error when api throws', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Bạn đã đánh giá sản phẩm này'));

      await expect(reviewsService.submit('p1', { rating: 5 })).rejects.toThrow(
        'Bạn đã đánh giá sản phẩm này'
      );
    });
  });
});
