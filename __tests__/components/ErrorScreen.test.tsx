import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorScreen from '@/components/ErrorScreen';

describe('ErrorScreen', () => {
  it('renders network preset by default type', () => {
    const { getByText } = render(<ErrorScreen type="network" />);
    expect(getByText('Không có kết nối')).toBeTruthy();
    expect(getByText('Kiểm tra mạng và thử lại')).toBeTruthy();
  });

  it('renders error preset', () => {
    const { getByText } = render(<ErrorScreen type="error" />);
    expect(getByText('Có lỗi xảy ra')).toBeTruthy();
  });

  it('renders empty preset', () => {
    const { getByText } = render(<ErrorScreen type="empty" />);
    expect(getByText('Không có dữ liệu')).toBeTruthy();
  });

  it('renders custom title and message', () => {
    const { getByText } = render(
      <ErrorScreen type="error" title="Lỗi tùy chỉnh" message="Thông báo tùy chỉnh" />
    );
    expect(getByText('Lỗi tùy chỉnh')).toBeTruthy();
    expect(getByText('Thông báo tùy chỉnh')).toBeTruthy();
  });

  it('does not render retry button when onRetry not provided', () => {
    const { queryByText } = render(<ErrorScreen type="network" />);
    expect(queryByText('Thử lại')).toBeNull();
  });

  it('renders retry button and calls onRetry when pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorScreen type="network" onRetry={onRetry} />);
    fireEvent.press(getByText('Thử lại'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders custom retryLabel', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorScreen type="network" onRetry={onRetry} retryLabel="Tải lại" />
    );
    expect(getByText('Tải lại')).toBeTruthy();
  });
});
