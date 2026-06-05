import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from '@/components/ProductImage';
import { useWishlist } from '@/lib/wishlist-context';
import { haptics } from '@/lib/haptics';
import type { Product } from '@/types';
import { formatCurrency, discountPercent } from '@/lib/utils';
import { C } from '@/constants/Colors';

const NOW = Date.now();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type Props = {
  product: Product;
  onAddToCart?: (product: Product) => void;
};

export default function ProductCard({ product, onAddToCart }: Props) {
  const hasDiscount = !!product.discountPrice;
  const pct = hasDiscount ? discountPercent(product.price, product.discountPrice!) : 0;
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const isNew = !!product.createdAt && NOW - new Date(product.createdAt).getTime() < SEVEN_DAYS_MS;

  // Card press scale
  const cardScale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  // Cart button bounce
  const cartScale = useSharedValue(1);
  const cartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  // Heart button scale
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePress = () => {
    haptics.light();
    router.push(`/product/${product.id}` as any);
  };

  const handleAddToCart = useCallback(() => {
    if (!onAddToCart) return;
    cartScale.value = withSequence(
      withSpring(1.35, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 300 })
    );
    haptics.success();
    onAddToCart(product);
  }, [onAddToCart, product]);

  const handleWishlist = useCallback(() => {
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 300 })
    );
    haptics.light();
    toggle(product.id);
  }, [product.id]);

  return (
    <Animated.View style={[s.card, cardStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          cardScale.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          cardScale.value = withSpring(1, { damping: 10, stiffness: 300 });
        }}
        accessibilityRole="button"
        accessibilityLabel={product.name}
      >
        {/* Image */}
        <View style={s.imgWrap}>
          <ProductImage uri={product.thumbnailUrl} style={s.img} name={product.name} />

          {/* Badges */}
          <View style={s.badgeStack}>
            {isNew && (
              <View style={s.newBadge}>
                <Text style={s.newBadgeText}>Mới</Text>
              </View>
            )}
            {hasDiscount && (
              <View style={s.discountBadge}>
                <Text style={s.discountText}>-{pct}%</Text>
              </View>
            )}
          </View>

          {/* Wishlist */}
          <Pressable
            onPress={e => {
              e.stopPropagation?.();
              handleWishlist();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={wishlisted ? 'Xoá khỏi yêu thích' : 'Thêm vào yêu thích'}
          >
            <Animated.View style={[s.heartBtn, heartStyle]}>
              <Ionicons
                name={wishlisted ? 'heart' : 'heart-outline'}
                size={15}
                color={wishlisted ? C.heart : C.muted}
              />
            </Animated.View>
          </Pressable>
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={s.price} numberOfLines={1}>
            {formatCurrency(product.discountPrice ?? product.price)}
          </Text>
          {hasDiscount && <Text style={s.originalPrice}>{formatCurrency(product.price)}</Text>}
          {product.reviewCount > 0 && (
            <View style={s.ratingRow}>
              <Ionicons name="star" size={10} color="#F59E0B" />
              <Text style={s.rating}>{product.averageRating.toFixed(1)}</Text>
              <Text style={s.reviewCount}>({product.reviewCount})</Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Add to cart — outside Pressable to avoid event clash */}
      {onAddToCart && (
        <Pressable
          onPress={handleAddToCart}
          style={s.cartBtnWrap}
          accessibilityRole="button"
          accessibilityLabel={`Thêm ${product.name} vào giỏ`}
        >
          <Animated.View style={[s.cartBtn, cartStyle]}>
            <Ionicons name="add" size={18} color="#fff" />
          </Animated.View>
        </Pressable>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    flexShrink: 0,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  imgWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0FDF9',
  },
  img: { width: '100%', height: '100%' },

  badgeStack: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 4,
  },
  newBadge: {
    backgroundColor: '#16A34A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  discountBadge: {
    backgroundColor: C.discount,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  info: { padding: 10, paddingBottom: 44 },
  name: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18, marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '800', color: C.primary },
  originalPrice: {
    fontSize: 11,
    color: C.muted,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  rating: { fontSize: 11, fontWeight: '600', color: C.text },
  reviewCount: { fontSize: 11, color: C.muted },

  cartBtnWrap: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  cartBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
});
