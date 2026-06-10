import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/lib/haptics';

const PRIMARY = '#0EA5AE';
const INACTIVE = '#9CA3AF';
const BG = '#FFFFFF';

const ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  products: { active: 'storefront', inactive: 'storefront-outline' },
  cart: { active: 'cart', inactive: 'cart-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

function TabItem({
  route,
  isFocused,
  onPress,
  badge,
}: {
  route: { name: string; key: string };
  isFocused: boolean;
  onPress: () => void;
  badge?: number;
}) {
  const { t } = useTranslation();
  const label = t(`tab.${route.name}`, route.name);
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);

  const labelOpacity = useDerivedValue(() => withTiming(isFocused ? 1 : 0.6, { duration: 200 }));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: interpolate(labelOpacity.value, [0.6, 1], [2, 0]) }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 8, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8, stiffness: 300 });
  };

  const handlePress = () => {
    iconScale.value = withSpring(1.3, { damping: 4, stiffness: 400 }, () => {
      iconScale.value = withSpring(1, { damping: 8, stiffness: 300 });
    });
    haptics.selection();
    onPress();
  };

  const icons = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={s.tabItem}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      accessibilityHint={`Switch to ${label} tab`}
    >
      <Animated.View style={[s.tabInner, animStyle]}>
        {isFocused && <Animated.View style={s.activePill} />}

        <Animated.View style={iconAnimStyle}>
          <Ionicons
            name={(isFocused ? icons.active : icons.inactive) as any}
            size={22}
            color={isFocused ? PRIMARY : INACTIVE}
          />
        </Animated.View>

        {badge != null && badge > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}

        <Animated.Text style={[s.label, { color: isFocused ? PRIMARY : INACTIVE }, labelStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

type TabBarProps = {
  state: { index: number; routes: { name: string; key: string }[] };
  navigation: { emit: (e: any) => any; navigate: (name: string) => void };
  descriptors: Record<string, { options: Record<string, any> }>;
};

export default function TabBar({ state, navigation, descriptors }: TabBarProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingBottom: bottom || 8 }]} accessibilityRole="tablist">
      <View style={s.topBorder} />
      <View style={s.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const badge =
            route.name === 'cart' ? descriptors[route.key]?.options?.tabBarBadge : undefined;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              badge={typeof badge === 'number' ? badge : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: BG, paddingTop: 8 },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  row: { flexDirection: 'row' },
  tabItem: { flex: 1, alignItems: 'center' },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 60,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 16,
    backgroundColor: '#E5F9FA',
  },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: BG,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});
