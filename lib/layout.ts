import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTablet = width >= 600;
  const isLandscape = width > height;

  // Grid columns: phone=2, tablet portrait=3, tablet landscape=4
  const productColumns = isTablet ? (isLandscape ? 4 : 3) : 2;
  const cardGap = 12;
  const cardWidth = (width - (productColumns + 1) * cardGap) / productColumns;

  // Header top padding: safe area top + extra padding
  const headerTop = insets.top + 16;

  // Tab bar bottom padding
  const tabBarBottom = insets.bottom;

  return {
    width,
    height,
    insets,
    isTablet,
    isLandscape,
    productColumns,
    cardWidth,
    cardGap,
    headerTop,
    tabBarBottom,
  };
}
