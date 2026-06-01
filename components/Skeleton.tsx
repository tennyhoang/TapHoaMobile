import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export default function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value * 100}%` as any }],
  }));

  return (
    <View style={[s.base, { width: width as any, height, borderRadius }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ── Preset layouts ──────────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <View style={s.card}>
      <Skeleton height={140} borderRadius={0} />
      <View style={s.cardBody}>
        <Skeleton width="40%" height={10} borderRadius={6} />
        <Skeleton width="85%" height={13} borderRadius={6} style={{ marginTop: 6 }} />
        <Skeleton width="60%" height={13} borderRadius={6} style={{ marginTop: 4 }} />
        <Skeleton width="50%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={s.orderCard}>
      <Skeleton width={44} height={44} borderRadius={12} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={13} borderRadius={6} />
        <Skeleton width="40%" height={11} borderRadius={6} />
        <Skeleton width="75%" height={11} borderRadius={6} />
      </View>
      <Skeleton width={70} height={28} borderRadius={8} />
    </View>
  );
}

export function ArticleCardSkeleton() {
  return (
    <View style={s.articleCard}>
      <Skeleton width={100} height={80} borderRadius={0} />
      <View style={{ flex: 1, padding: 12, gap: 6 }}>
        <Skeleton width="35%" height={10} borderRadius={6} />
        <Skeleton width="90%" height={13} borderRadius={6} />
        <Skeleton width="70%" height={13} borderRadius={6} />
        <Skeleton width="30%" height={11} borderRadius={6} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardBody: { padding: 10, gap: 4 },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
});
