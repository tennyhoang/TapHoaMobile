import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReviewsScreen from '@/app/reviews/[id]';
import { reviewsService } from '@/services/reviews.service';

jest.mock('@/services/reviews.service', () => ({
  reviewsService: { getByProduct: jest.fn(), submit: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@/components/EmptyState', () => {
  const { Text } = require('react-native');
  return ({ title }: { title: string }) => <Text>{title}</Text>;
});

const mockReviews = jest.mocked(reviewsService);

const sampleReview = {
  id: 'r1',
  productId: 'p1',
  userName: 'Nguyen Van A',
  rating: 4,
  comment: 'Sản phẩm tốt',
  createdAt: '2025-01-01T00:00:00Z',
};

const emptyPage = { items: [], totalPages: 1, page: 1, total: 0 };

describe('ReviewsScreen', () => {
  beforeEach(() => {
    mockReviews.getByProduct.mockResolvedValue(emptyPage);
    mockReviews.submit.mockRejectedValue(new Error('no submit'));
  });

  it('shows loading then empty state', async () => {
    const { getByText } = render(<ReviewsScreen />);
    await waitFor(() => {
      expect(getByText('Chưa có đánh giá nào')).toBeTruthy();
    });
  });

  it('renders reviews list', async () => {
    mockReviews.getByProduct.mockResolvedValueOnce({
      items: [sampleReview],
      totalPages: 1,
      page: 1,
      total: 1,
    });
    const { getByText } = render(<ReviewsScreen />);
    await waitFor(() => {
      expect(getByText('Nguyen Van A')).toBeTruthy();
      expect(getByText('Sản phẩm tốt')).toBeTruthy();
    });
  });

  it('shows write review button', async () => {
    const { getByText } = render(<ReviewsScreen />);
    await waitFor(() => {
      expect(getByText('Viết đánh giá')).toBeTruthy();
    });
  });

  it('opens review form when write button pressed', async () => {
    const { getByText } = render(<ReviewsScreen />);
    await waitFor(() => expect(getByText('Viết đánh giá')).toBeTruthy());
    fireEvent.press(getByText('Viết đánh giá'));
    expect(getByText('Đánh giá của bạn')).toBeTruthy();
    expect(getByText('Gửi đánh giá')).toBeTruthy();
  });

  it('cancels review form', async () => {
    const { getByText, queryByText } = render(<ReviewsScreen />);
    await waitFor(() => expect(getByText('Viết đánh giá')).toBeTruthy());
    fireEvent.press(getByText('Viết đánh giá'));
    expect(getByText('Đánh giá của bạn')).toBeTruthy();
    fireEvent.press(getByText('Huỷ'));
    expect(queryByText('Đánh giá của bạn')).toBeNull();
  });

  it('submits a review successfully', async () => {
    mockReviews.submit.mockResolvedValueOnce({ ...sampleReview, id: 'r2', comment: 'Rất tốt' });
    const { getByText, getByPlaceholderText } = render(<ReviewsScreen />);
    await waitFor(() => expect(getByText('Viết đánh giá')).toBeTruthy());
    fireEvent.press(getByText('Viết đánh giá'));
    fireEvent.changeText(getByPlaceholderText('Nhận xét (tuỳ chọn)...'), 'Rất tốt');
    fireEvent.press(getByText('Gửi đánh giá'));
    await waitFor(() => {
      expect(mockReviews.submit).toHaveBeenCalledWith(undefined, {
        rating: 5,
        comment: 'Rất tốt',
      });
    });
  });

  it('shows average rating when reviews exist', async () => {
    mockReviews.getByProduct.mockResolvedValueOnce({
      items: [sampleReview, { ...sampleReview, id: 'r2', rating: 5 }],
      totalPages: 1,
      page: 1,
      total: 2,
    });
    const { getByText } = render(<ReviewsScreen />);
    await waitFor(() => {
      expect(getByText('4.5')).toBeTruthy();
      expect(getByText('2 đánh giá')).toBeTruthy();
    });
  });
});
