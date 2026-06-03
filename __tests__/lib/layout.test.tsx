import { renderHook } from '@testing-library/react-native';
import { useLayout } from '@/lib/layout';

describe('useLayout', () => {
  it('returns expected shape', () => {
    const { result } = renderHook(() => useLayout());
    const layout = result.current;
    expect(typeof layout.width).toBe('number');
    expect(typeof layout.height).toBe('number');
    expect(typeof layout.isTablet).toBe('boolean');
    expect(typeof layout.isLandscape).toBe('boolean');
    expect(typeof layout.productColumns).toBe('number');
    expect(layout.cardGap).toBe(12);
    expect(typeof layout.cardWidth).toBe('number');
    expect(typeof layout.headerTop).toBe('number');
    expect(typeof layout.tabBarBottom).toBe('number');
  });

  it('productColumns is at least 2', () => {
    const { result } = renderHook(() => useLayout());
    expect(result.current.productColumns).toBeGreaterThanOrEqual(2);
  });

  it('cardWidth is a positive number', () => {
    const { result } = renderHook(() => useLayout());
    expect(result.current.cardWidth).toBeGreaterThan(0);
  });
});
