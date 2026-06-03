import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ArticlesScreen from '@/app/articles/index';
import { articlesService } from '@/services/articles.service';

jest.mock('@/services/articles.service', () => ({
  articlesService: { getAll: jest.fn() },
  getCategoryMeta: () => ({ label: 'Mẹo vặt', color: '#0EA5AE' }),
  getArticleImage: () => 'https://example.com/img.jpg',
}));

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const mockArticles = jest.mocked(articlesService);

const sampleArticle = {
  id: 'a1',
  title: 'Bài viết thử nghiệm',
  excerpt: 'Mô tả ngắn',
  content: '# Nội dung',
  category: 'tips',
  readTimeMinutes: 3,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  imageUrl: null,
};

describe('ArticlesScreen', () => {
  beforeEach(() => {
    mockArticles.getAll.mockRejectedValue(new Error('no data'));
  });

  it('shows loading indicator on mount', () => {
    mockArticles.getAll.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<ArticlesScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders article list after loading', async () => {
    mockArticles.getAll.mockResolvedValueOnce([sampleArticle]);
    const { getByText } = render(<ArticlesScreen />);
    await waitFor(() => {
      expect(getByText('Bài viết thử nghiệm')).toBeTruthy();
    });
  });

  it('renders multiple articles (first is featured)', async () => {
    const second = { ...sampleArticle, id: 'a2', title: 'Bài viết thứ hai' };
    mockArticles.getAll.mockResolvedValueOnce([sampleArticle, second]);
    const { getByText } = render(<ArticlesScreen />);
    await waitFor(() => {
      expect(getByText('Bài viết thứ hai')).toBeTruthy();
    });
  });

  it('shows empty state when no articles', async () => {
    mockArticles.getAll.mockResolvedValueOnce([]);
    const { getByText } = render(<ArticlesScreen />);
    await waitFor(() => {
      expect(getByText('Chưa có bài viết')).toBeTruthy();
    });
  });

  it('shows error state and retry button on failure', async () => {
    mockArticles.getAll.mockRejectedValueOnce(new Error('Network error'));
    const { getByText } = render(<ArticlesScreen />);
    await waitFor(() => {
      expect(getByText('Lỗi kết nối')).toBeTruthy();
      expect(getByText('Thử lại')).toBeTruthy();
    });
  });

  it('retries on error', async () => {
    mockArticles.getAll.mockRejectedValueOnce(new Error('fail'));
    mockArticles.getAll.mockResolvedValueOnce([sampleArticle]);
    const { getByText } = render(<ArticlesScreen />);
    await waitFor(() => expect(getByText('Thử lại')).toBeTruthy());
    fireEvent.press(getByText('Thử lại'));
    await waitFor(() => expect(getByText('Bài viết thử nghiệm')).toBeTruthy());
  });

  it('navigates to article detail on press', async () => {
    mockArticles.getAll.mockResolvedValueOnce([sampleArticle]);
    const { getByText } = render(<ArticlesScreen />);
    await waitFor(() => expect(getByText('Bài viết thử nghiệm')).toBeTruthy());
    fireEvent.press(getByText('Bài viết thử nghiệm'));
    const { router } = jest.requireMock('expo-router');
    expect(router.push).toHaveBeenCalledWith('/articles/a1');
  });

  it('navigates back on back button press', () => {
    mockArticles.getAll.mockReturnValue(new Promise(() => {}));
    const { router } = jest.requireMock('expo-router');
    const { UNSAFE_getByType } = render(<ArticlesScreen />);
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(router.back).toHaveBeenCalled();
  });
});
