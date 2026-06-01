import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '@/lib/wishlist-context';
import { productsService } from '@/services/products.service';
import { cartService } from '@/services/cart.service';
import ProductImage from '@/components/ProductImage';
import { useToast } from '@/components/Toast';
import type { Product } from '@/types';
import { formatCurrency, discountPercent } from '@/lib/utils';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
  error: '#EF4444',
  heart: '#F43F5E',
};

export default function WishlistScreen() {
  const { top } = useSafeAreaInsets();
  const { ids, toggle } = useWishlist();
  const { show } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const results = await Promise.allSettled(ids.map(id => productsService.getById(id)));
      const valid = results
        .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
        .map(r => r.value);
      setProducts(valid);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [ids.length]);

  const handleRemove = (product: Product) => {
    toggle(product.id);
    show('Đã xoá khỏi danh sách yêu thích', 'info');
  };

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    try {
      await cartService.add(product.id, 1);
      show(`Đã thêm "${product.name}" vào giỏ`);
    } catch {
      show('Không thể thêm vào giỏ hàng', 'error');
    } finally {
      setAddingToCart(null);
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const hasDiscount = !!item.discountPrice;
    const pct = hasDiscount ? discountPercent(item.price, item.discountPrice!) : 0;

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.88}
        onPress={() => router.push(`/product/${item.id}` as any)}
      >
        <View style={s.imgWrap}>
          <ProductImage uri={item.thumbnailUrl} style={s.img} name={item.name} />
          {hasDiscount && (
            <View style={s.badge}>
              <Text style={s.badgeText}>-{pct}%</Text>
            </View>
          )}
        </View>

        <View style={s.info}>
          <Text style={s.category} numberOfLines={1}>
            {item.categoryName}
          </Text>
          <Text style={s.name} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={s.priceRow}>
            <Text style={s.price}>{formatCurrency(item.discountPrice ?? item.price)}</Text>
            {hasDiscount && <Text style={s.origPrice}>{formatCurrency(item.price)}</Text>}
          </View>
          {item.reviewCount > 0 && (
            <View style={s.ratingRow}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={s.rating}>{item.averageRating.toFixed(1)}</Text>
              <Text style={s.reviewCount}>({item.reviewCount})</Text>
            </View>
          )}
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            style={s.removeBtn}
            onPress={() => handleRemove(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={20} color={C.heart} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.cartBtn, addingToCart === item.id && s.cartBtnDim]}
            onPress={() => handleAddToCart(item)}
            disabled={addingToCart === item.id}
            activeOpacity={0.8}
          >
            {addingToCart === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="cart-outline" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Sản phẩm yêu thích</Text>
        {ids.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{ids.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Ionicons name="heart-outline" size={52} color={C.heart} />
          </View>
          <Text style={s.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
          <Text style={s.emptyText}>Nhấn vào biểu tượng tim để lưu sản phẩm bạn thích</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={s.shopBtnText}>Khám phá sản phẩm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.primaryDark,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1 },
  countBadge: {
    backgroundColor: C.heart,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, textAlign: 'center' },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  shopBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shopBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imgWrap: { width: 100, height: 100 },
  img: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: C.error,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  info: { flex: 1, padding: 12, paddingRight: 8 },
  category: {
    fontSize: 10,
    color: C.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  name: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  price: { fontSize: 14, fontWeight: '700', color: C.primary },
  origPrice: { fontSize: 11, color: C.muted, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  rating: { fontSize: 11, fontWeight: '600', color: '#111' },
  reviewCount: { fontSize: 11, color: C.muted },

  actions: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingRight: 10,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnDim: { opacity: 0.6 },
});
