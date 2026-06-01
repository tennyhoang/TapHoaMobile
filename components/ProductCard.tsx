import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from '@/components/ProductImage';
import { useWishlist } from '@/lib/wishlist-context';
import type { Product } from '@/types';
import { formatCurrency, discountPercent } from '@/lib/utils';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

const C = {
  primary: '#0EA5AE',
  text: '#111827',
  muted: '#6B7280',
  card: '#FFFFFF',
  border: '#F3F4F6',
  discount: '#EF4444',
  heart: '#F43F5E',
};

type Props = {
  product: Product;
  onAddToCart?: (product: Product) => void;
};

export default function ProductCard({ product, onAddToCart }: Props) {
  const hasDiscount = !!product.discountPrice;
  const pct = hasDiscount ? discountPercent(product.price, product.discountPrice!) : 0;
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/product/${product.id}` as any)}
    >
      {/* Image */}
      <View style={s.imgWrap}>
        <ProductImage uri={product.thumbnailUrl} style={s.img} name={product.name} />
        {hasDiscount && (
          <View style={s.badge}>
            <Text style={s.badgeText}>-{pct}%</Text>
          </View>
        )}
        <TouchableOpacity
          style={s.heartBtn}
          onPress={() => toggle(product.id)}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={16}
            color={wishlisted ? C.heart : C.muted}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.category} numberOfLines={1}>
          {product.categoryName}
        </Text>
        <Text style={s.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price */}
        <View style={s.priceRow}>
          <Text style={s.price}>{formatCurrency(product.discountPrice ?? product.price)}</Text>
          {hasDiscount && <Text style={s.originalPrice}>{formatCurrency(product.price)}</Text>}
        </View>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <View style={s.ratingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={s.rating}>{product.averageRating.toFixed(1)}</Text>
            <Text style={s.reviewCount}>({product.reviewCount})</Text>
          </View>
        )}
      </View>

      {/* Add to cart button */}
      {onAddToCart && (
        <TouchableOpacity
          style={s.cartBtn}
          onPress={() => onAddToCart(product)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imgWrap: {
    width: '100%',
    height: CARD_WIDTH * 0.85,
    backgroundColor: '#E5F9FA',
  },
  img: { width: '100%', height: '100%' },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.discount,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  info: { padding: 10, paddingBottom: 12 },
  category: {
    fontSize: 10,
    color: C.primary,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  name: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  price: { fontSize: 14, fontWeight: '700', color: C.primary },
  originalPrice: { fontSize: 11, color: C.muted, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  rating: { fontSize: 11, fontWeight: '600', color: '#111' },
  reviewCount: { fontSize: 11, color: C.muted },

  cartBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
