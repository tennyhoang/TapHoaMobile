import { api } from '@/lib/api';

export type Article = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  imageUrl?: string | null;
  readTimeMinutes: number;
  createdAt: string;
};

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  'dinh-duong': { label: 'Dinh dưỡng', color: '#16A34A' },
  'mua-sam-thong-minh': { label: 'Mua sắm thông minh', color: '#0EA5AE' },
  'he-thong-hub': { label: 'Hệ thống Hub', color: '#7C3AED' },
  'san-pham-noi-bat': { label: 'Sản phẩm nổi bật', color: '#D97706' },
};

const DEFAULT_IMAGES: Record<string, string> = {
  'dinh-duong':
    'https://images.unsplash.com/photo-1557844352-761f2565b576?w=800&q=80&auto=format&fit=crop',
  'mua-sam-thong-minh':
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&auto=format&fit=crop',
  'he-thong-hub':
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80&auto=format&fit=crop',
  'san-pham-noi-bat':
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80&auto=format&fit=crop',
};

export function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? { label: category, color: '#6B7280' };
}

export function getArticleImage(article: Article): string {
  return article.imageUrl || DEFAULT_IMAGES[article.category] || DEFAULT_IMAGES['dinh-duong'];
}

export type ArticlePayload = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  imageUrl?: string | null;
  readTimeMinutes: number;
};

export const articlesService = {
  getAll: (): Promise<Article[]> => api.get<Article[]>('/articles'),
  create: (payload: ArticlePayload): Promise<Article> => api.post('/articles', payload),
  update: (id: string, payload: ArticlePayload): Promise<Article> =>
    api.put(`/articles/${id}`, payload),
  delete: (id: string): Promise<void> => api.delete(`/articles/${id}`),
};
