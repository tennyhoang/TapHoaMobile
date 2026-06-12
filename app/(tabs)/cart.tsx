import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from '@/components/ProductImage';
import { useCart, useUpdateCartItem, useRemoveFromCart, useClearCart } from '@/lib/hooks';
import { useCartCount } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import type { CartItem } from '@/types';
import { C } from '@/constants/Colors';
import { useToast } from '@/components/Toast';
import { useTranslation } from 'react-i18next';

const FREE_SHIPPING_THRESHOLD = 300_000;
const SHIPPING_FEE = 25_000;

export default function CartScreen() {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { show } = useToast();
  const { refreshCount } = useCartCount();
  const queryClient = useQueryClient();

  const { data: cart, isLoading, isRefetching, refetch } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();

  const [updating, setUpdating] = useState<string | null>(null);

  const invalidateCart = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    refreshCount();
  }, [queryClient, refreshCount]);

  // Reload cart every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleUpdate = async (productId: string, qty: number) => {
    setUpdating(productId);
    try {
      if (qty <= 0) {
        await removeFromCart.mutateAsync(productId);
      } else {
        await updateCartItem.mutateAsync({ productId, quantity: qty });
      }
      invalidateCart();
    } catch {
      show(t('common.error_occurred'), 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleClear = async () => {
    try {
      await clearCart.mutateAsync();
      invalidateCart();
    } catch {
      show(t('common.error_occurred'), 'error');
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => {
      const isUpdating = updating === item.productId;
      const hasDiscount = item.discountPrice != null && item.discountPrice < item.price;
      const displayPrice = hasDiscount ? item.discountPrice! : item.unitPrice;
      const originalPrice = hasDiscount ? item.price : undefined;

      return (
        <View style={s.item}>
          {/* Delete button */}
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => handleUpdate(item.productId, 0)}
            disabled={isUpdating}
            accessibilityRole="button"
            accessibilityLabel="Xoá sản phẩm"
          >
            {isUpdating && updating === item.productId ? (
              <ActivityIndicator size="small" color={C.error} />
            ) : (
              <Ionicons name="trash-outline" size={16} color={C.error} />
            )}
          </TouchableOpacity>

          {/* Product image */}
          <View style={s.itemImg}>
            <ProductImage uri={item.thumbnailUrl} style={s.img} name={item.productName} />
          </View>

          {/* Info + stepper */}
          <View style={s.itemBody}>
            <Text style={s.itemName} numberOfLines={1}>
              {item.productName}
            </Text>
            <Text style={s.itemUnit}>1 đơn vị</Text>

            <View style={s.itemFooter}>
              {/* Price */}
              <View style={s.priceGroup}>
                <Text style={s.salePrice}>{formatCurrency(displayPrice)}</Text>
                {originalPrice != null && (
                  <Text style={s.origPrice}>{formatCurrency(originalPrice)}</Text>
                )}
              </View>

              {/* Qty stepper */}
              <View style={s.qtyWrap}>
                <TouchableOpacity
                  style={s.qtyBtn}
                  onPress={() => handleUpdate(item.productId, item.quantity - 1)}
                  disabled={isUpdating}
                  accessibilityRole="button"
                  accessibilityLabel={item.quantity - 1 <= 0 ? 'Xoá' : 'Giảm số lượng'}
                >
                  <Ionicons name="remove" size={16} color={C.text} />
                </TouchableOpacity>

                {isUpdating ? (
                  <ActivityIndicator size="small" color={C.primary} style={s.qtyLoader} />
                ) : (
                  <Text style={s.qtyText}>{item.quantity}</Text>
                )}

                <TouchableOpacity
                  style={s.qtyBtn}
                  onPress={() => handleUpdate(item.productId, item.quantity + 1)}
                  disabled={isUpdating || item.quantity >= item.stock}
                  accessibilityRole="button"
                  accessibilityLabel="Tăng số lượng"
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={item.quantity >= item.stock ? C.muted : C.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [updating, handleUpdate]
  );

  const isEmpty = !cart || cart.items.length === 0;
  const subtotal = cart?.totalAmount ?? 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = isFreeShipping ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  const ListHeader = !isEmpty ? (
    <>
      {/* Free shipping banner */}
      {!isFreeShipping && (
        <View style={s.shippingBanner}>
          <Ionicons name="bicycle-outline" size={22} color={C.primary} />
          <Text style={s.shippingBannerText}>
            Mua thêm{' '}
            <Text style={s.shippingBannerBold}>{formatCurrency(amountToFreeShipping)}</Text> để được
            miễn phí vận chuyển
          </Text>
        </View>
      )}
    </>
  ) : null;

  const SummaryCard = !isEmpty ? (
    <View style={s.summaryCard}>
      <Text style={s.summaryHeading}>Tóm tắt đơn hàng</Text>

      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>{t('cart.subtotal')}</Text>
        <Text style={s.summaryAmount}>{formatCurrency(subtotal)}</Text>
      </View>

      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>{t('cart.shipping_fee')}</Text>
        {isFreeShipping ? (
          <Text style={[s.summaryAmount, { color: C.primary }]}>Miễn phí</Text>
        ) : (
          <Text style={s.summaryAmount}>{formatCurrency(shippingFee)}</Text>
        )}
      </View>

      <View style={s.divider} />

      <View style={s.summaryRow}>
        <Text style={s.totalLabel}>{t('cart.total')}</Text>
        <Text style={s.totalAmount}>{formatCurrency(total)}</Text>
      </View>

      <TouchableOpacity
        style={s.checkoutBtn}
        activeOpacity={0.85}
        onPress={() => router.push('/checkout')}
        testID="cart-checkout-btn"
      >
        <Text style={s.checkoutText}>Đặt hàng</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* Header */}
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <View style={s.blob} />
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>{t('cart.title')}</Text>
            {!isEmpty && <Text style={s.headerSub}>{cart!.totalItems} sản phẩm</Text>}
          </View>
          {!isEmpty && (
            <TouchableOpacity onPress={handleClear} style={s.clearBtn}>
              <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={s.clearText}>Xóa tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : isEmpty ? (
        /* Empty state */
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Ionicons name="bag-outline" size={52} color={C.primary} />
          </View>
          <Text style={s.emptyTitle}>{t('cart.empty')}</Text>
          <Text style={s.emptyText}>Hãy thêm sản phẩm vào giỏ để đặt hàng</Text>
          <TouchableOpacity
            style={s.shopBtn}
            onPress={() => router.push('/(tabs)/products')}
            activeOpacity={0.85}
          >
            <Text style={s.shopBtnText}>Khám phá sản phẩm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cart!.items}
          keyExtractor={item => item.productId}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={10}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={C.primary}
            />
          }
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={SummaryCard}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.primaryDark,
    overflow: 'hidden',
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  blob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 },
  clearText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Empty state */
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
  shopBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  shopBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  list: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 20 },
  separator: { height: 10 },

  /* Free shipping banner */
  shippingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E5F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary + '33',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  shippingBannerText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 18 },
  shippingBannerBold: { fontWeight: '700', color: C.primary },

  /* Cart item */
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  itemImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0FAFA',
    overflow: 'hidden',
    flexShrink: 0,
  },
  img: { width: '100%', height: '100%' },
  itemBody: { flex: 1, paddingRight: 24 },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    lineHeight: 19,
    marginBottom: 2,
  },
  itemUnit: { fontSize: 12, color: C.muted, marginBottom: 10 },

  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceGroup: { flexDirection: 'column', gap: 1 },
  salePrice: { fontSize: 15, fontWeight: '700', color: C.primary },
  origPrice: {
    fontSize: 12,
    color: C.muted,
    textDecorationLine: 'line-through',
  },

  /* Qty stepper */
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyLoader: { width: 28 },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    minWidth: 24,
    textAlign: 'center',
  },

  /* Summary card */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  summaryHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, color: C.muted },
  summaryAmount: { fontSize: 14, fontWeight: '600', color: C.text },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: C.text },
  totalAmount: { fontSize: 18, fontWeight: '800', color: C.primary },

  checkoutBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  checkoutText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
