import {
  articlesService,
  getCategoryMeta,
  getArticleImage,
  type Article,
} from '@/services/articles.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockArticle: Article = {
  id: 'a1',
  title: 'Dinh dưỡng cân bằng',
  excerpt: 'Mô tả ngắn',
  content: 'Nội dung đầy đủ',
  category: 'dinh-duong',
  imageUrl: null,
  readTimeMinutes: 5,
  createdAt: '2025-01-01T00:00:00Z',
};

describe('articlesService', () => {
  describe('getAll', () => {
    it('calls GET /articles and returns articles', async () => {
      mockApi.get.mockResolvedValueOnce([mockArticle]);
      const result = await articlesService.getAll();
      expect(result).toEqual([mockArticle]);
      expect(mockApi.get).toHaveBeenCalledWith('/articles');
    });

    it('returns empty array when no articles', async () => {
      mockApi.get.mockResolvedValueOnce([]);
      const result = await articlesService.getAll();
      expect(result).toHaveLength(0);
    });

    it('propagates error', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Lỗi mạng'));
      await expect(articlesService.getAll()).rejects.toThrow('Lỗi mạng');
    });
  });

  describe('create', () => {
    it('calls POST /articles', async () => {
      mockApi.post.mockResolvedValueOnce(mockArticle);
      const payload = {
        title: 'Bài mới',
        excerpt: 'Mô tả',
        content: 'Nội dung',
        category: 'dinh-duong',
        readTimeMinutes: 3,
      };
      const result = await articlesService.create(payload);
      expect(result).toEqual(mockArticle);
      expect(mockApi.post).toHaveBeenCalledWith('/articles', payload);
    });
  });

  describe('update', () => {
    it('calls PUT /articles/:id', async () => {
      mockApi.put.mockResolvedValueOnce(mockArticle);
      const payload = {
        title: 'Bài sửa',
        excerpt: 'Mô tả',
        content: 'Nội dung',
        category: 'dinh-duong',
        readTimeMinutes: 5,
      };
      const result = await articlesService.update('a1', payload);
      expect(result).toEqual(mockArticle);
      expect(mockApi.put).toHaveBeenCalledWith('/articles/a1', payload);
    });
  });

  describe('delete', () => {
    it('calls DELETE /articles/:id', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);
      await articlesService.delete('a1');
      expect(mockApi.delete).toHaveBeenCalledWith('/articles/a1');
    });
  });
});

describe('getCategoryMeta', () => {
  it('returns correct meta for known category', () => {
    const meta = getCategoryMeta('dinh-duong');
    expect(meta.label).toBe('Dinh dưỡng');
    expect(meta.color).toBe('#16A34A');
  });

  it('returns correct meta for mua-sam-thong-minh', () => {
    const meta = getCategoryMeta('mua-sam-thong-minh');
    expect(meta.label).toBe('Mua sắm thông minh');
  });

  it('returns fallback for unknown category', () => {
    const meta = getCategoryMeta('unknown-category');
    expect(meta.label).toBe('unknown-category');
    expect(meta.color).toBe('#6B7280');
  });
});

describe('getArticleImage', () => {
  it('returns imageUrl when article has one', () => {
    const article = { ...mockArticle, imageUrl: 'https://example.com/image.jpg' };
    expect(getArticleImage(article)).toBe('https://example.com/image.jpg');
  });

  it('returns category default image when no imageUrl', () => {
    const result = getArticleImage(mockArticle);
    expect(result).toContain('unsplash.com');
  });

  it('returns dinh-duong fallback for unknown category', () => {
    const article = { ...mockArticle, category: 'unknown', imageUrl: null };
    const knownResult = getArticleImage({ ...mockArticle, category: 'dinh-duong', imageUrl: null });
    expect(getArticleImage(article)).toBe(knownResult);
  });
});
