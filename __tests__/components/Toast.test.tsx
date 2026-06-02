import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { TouchableOpacity, Text } from 'react-native';
import { ToastProvider, useToast } from '@/components/Toast';

function Trigger({ message, type }: { message: string; type?: 'success' | 'error' | 'info' }) {
  const { show } = useToast();
  return (
    <TouchableOpacity testID="trigger" onPress={() => show(message, type)}>
      <Text>Show</Text>
    </TouchableOpacity>
  );
}

describe('ToastProvider', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ToastProvider>
        <Text>Content</Text>
      </ToastProvider>
    );
    expect(getByText('Content')).toBeTruthy();
  });

  it('shows toast message when show() is called', () => {
    const { getByTestId, getByText } = render(
      <ToastProvider>
        <Trigger message="Thành công" />
      </ToastProvider>
    );
    act(() => {
      fireEvent.press(getByTestId('trigger'));
    });
    expect(getByText('Thành công')).toBeTruthy();
  });

  it('shows error type toast', () => {
    const { getByTestId, getByText } = render(
      <ToastProvider>
        <Trigger message="Có lỗi xảy ra" type="error" />
      </ToastProvider>
    );
    act(() => {
      fireEvent.press(getByTestId('trigger'));
    });
    expect(getByText('Có lỗi xảy ra')).toBeTruthy();
  });

  it('shows info type toast', () => {
    const { getByTestId, getByText } = render(
      <ToastProvider>
        <Trigger message="Thông tin" type="info" />
      </ToastProvider>
    );
    act(() => {
      fireEvent.press(getByTestId('trigger'));
    });
    expect(getByText('Thông tin')).toBeTruthy();
  });

  it('shows multiple toasts (up to 3)', () => {
    function MultiTrigger() {
      const { show } = useToast();
      return (
        <>
          <TouchableOpacity testID="t1" onPress={() => show('Msg 1')}>
            <Text>1</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="t2" onPress={() => show('Msg 2')}>
            <Text>2</Text>
          </TouchableOpacity>
        </>
      );
    }
    const { getByTestId, getByText } = render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>
    );
    act(() => {
      fireEvent.press(getByTestId('t1'));
      fireEvent.press(getByTestId('t2'));
    });
    expect(getByText('Msg 1')).toBeTruthy();
    expect(getByText('Msg 2')).toBeTruthy();
  });

  it('auto-dismisses toast after timeout', () => {
    jest.useFakeTimers();
    const { getByTestId, queryByText } = render(
      <ToastProvider>
        <Trigger message="Bye soon" />
      </ToastProvider>
    );
    act(() => {
      fireEvent.press(getByTestId('trigger'));
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(queryByText('Bye soon')).toBeNull();
    jest.useRealTimers();
  });
});
