import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ArticleDetailScreen from '@/app/articles/[id]/page';
import { articlesService } from '@/services/articles.service';

jest.mock('@/services/articles.service', () => ({
  articlesService: { getAll: jest.fn() },
  getCategoryMeta: () => ({ label: 'Mẹo vặt', color: '#0EA5AE' }),
  getArticleImage: () => 'https://example.com/img.jpg',
}));

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'a1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(() => cb(), []);
  },
  Redirect: () => null,
}));

const mockArticles = jest.mocked(articlesService);

const sampleArticle = {
  id: 'a1',
  title: 'Bài viết chi tiết',
  excerpt: 'Mô tả',
  content: '# Tiêu đề\n## Mục 1\nNội dung **đậm**\n- Bullet 1\n> Trích dẫn\n\n1. Mục số\n\n',
  category: 'tips',
  readTimeMinutes: 5,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  imageUrl: null,
};

describe('ArticleDetailScreen', () => {
  beforeEach(() => {
    mockArticles.getAll.mockRejectedValue(new Error('no data'));
  });

  it('shows loading indicator on mount', () => {
    mockArticles.getAll.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<ArticleDetailScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders article title after loading', async () => {
    mockArticles.getAll.mockResolvedValueOnce([sampleArticle]);
    const { getByText } = render(<ArticleDetailScreen />);
    await waitFor(() => {
      expect(getByText('Bài viết chi tiết')).toBeTruthy();
    });
  });

  it('renders markdown content elements', async () => {
    mockArticles.getAll.mockResolvedValueOnce([sampleArticle]);
    const { getByText } = render(<ArticleDetailScreen />);
    await waitFor(() => {
      expect(getByText('Mục 1')).toBeTruthy();
      expect(getByText('Bullet 1')).toBeTruthy();
      expect(getByText('Trích dẫn')).toBeTruthy();
    });
  });

  it('shows not found when article id does not match', async () => {
    mockArticles.getAll.mockResolvedValueOnce([{ ...sampleArticle, id: 'other' }]);
    const { getByText } = render(<ArticleDetailScreen />);
    await waitFor(() => {
      expect(getByText('Không tìm thấy bài viết')).toBeTruthy();
    });
  });

  it('shows not found when list is empty', async () => {
    mockArticles.getAll.mockResolvedValueOnce([]);
    const { getByText } = render(<ArticleDetailScreen />);
    await waitFor(() => {
      expect(getByText('Không tìm thấy bài viết')).toBeTruthy();
    });
  });

  it('renders read time', async () => {
    mockArticles.getAll.mockResolvedValueOnce([sampleArticle]);
    const { getByText } = render(<ArticleDetailScreen />);
    await waitFor(() => {
      expect(getByText(/5 phút đọc/)).toBeTruthy();
    });
  });
});
