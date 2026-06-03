import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuantitySelector from '@/components/QuantitySelector';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('QuantitySelector', () => {
  it('renders the current value', () => {
    const { getByText } = render(<QuantitySelector value={3} onChange={jest.fn()} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('calls onChange with value+1 on increment', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<QuantitySelector value={2} onChange={onChange} />);
    fireEvent.press(getByLabelText('Tăng'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('calls onChange with value-1 on decrement', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<QuantitySelector value={3} onChange={onChange} />);
    fireEvent.press(getByLabelText('Giảm'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('decrement button label changes to Xoá at min when showTrashOnMin=true', () => {
    const { getByLabelText } = render(
      <QuantitySelector value={1} min={1} showTrashOnMin onChange={jest.fn()} />
    );
    expect(getByLabelText('Xoá')).toBeTruthy();
  });

  it('renders loading indicator when loading=true', () => {
    const { UNSAFE_getByType } = render(
      <QuantitySelector value={1} onChange={jest.fn()} loading />
    );
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders sm size variant', () => {
    const { getByText } = render(<QuantitySelector value={5} onChange={jest.fn()} size="sm" />);
    expect(getByText('5')).toBeTruthy();
  });

  it('increment button disabled at max', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<QuantitySelector value={10} max={10} onChange={onChange} />);
    const btn = getByLabelText('Tăng');
    fireEvent.press(btn);
    expect(onChange).not.toHaveBeenCalled();
  });
});
