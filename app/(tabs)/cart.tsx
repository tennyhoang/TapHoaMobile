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
import { Ionicons } from '@expo/vector-icons';
import ProductImage from '@/components/ProductImage';
import { cartService } from '@/services/cart.service';
import { useCartCount } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import type { Cart, CartItem } from '@/types';
import { C } from '@/constants/Colors';
import { useToast } from '@/components/Toast';

export default function CartScreen() {
  const { top } = useSafeAreaInsets();
  const { show } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const { refreshCount } = useCartCount();

  const fetchCart = useCallback(async () => {
    try {
      const data = await cartService.get();
      setCart(data);
      refreshCount();
    } catch {
      setCart({ items: [], totalAmount: 0, totalItems: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshCount]);

  // Reload cart every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  const handleUpdate = async (productId: string, qty: number) => {
    setUpdating(productId);
    try {
      if (qty <= 0) {
        const updated = await cartService.remove(productId);
        setCart(updated);
      } else {
        const updated = await cartService.update(productId, qty);
        setCart(updated);
      }
      refreshCount();
    } catch {
      show('Có lỗi xảy ra', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await cartService.clear();
      setCart({ items: [], totalAmount: 0, totalItems: 0 });
      refreshCount();
    } catch {
      show('Có lỗi xảy ra', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const isUpdating = updating === item.productId;
    return (
      <View style={s.item}>
        {/* Image */}
        <View style={s.itemImg}>
          <ProductImage uri={item.thumbnailUrl} style={s.img} name={item.productName} />
        </View>

        {/* Info */}
        <View style={s.itemInfo}>
          <Text style={s.itemName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={s.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
          <Text style={s.itemSubtotal}>= {formatCurrency(item.subtotal)}</Text>
        </View>

        {/* Quantity controls */}
        <View style={s.qtyWrap}>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => handleUpdate(item.productId, item.quantity - 1)}
            disabled={isUpdating}
            accessibilityRole="button"
            accessibilityLabel={item.quantity - 1 <= 0 ? 'Xoá' : 'Giảm số lượng'}
          >
            {isUpdating && item.quantity - 1 <= 0 ? (
              <Ionicons name="trash-outline" size={15} color={C.error} />
            ) : (
              <Ionicons name="remove" size={16} color={C.text} />
            )}
          </TouchableOpacity>

          {isUpdating ? (
            <ActivityIndicator size="small" color={C.primary} style={{ width: 28 }} />
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
            <Ionicons name="add" size={16} color={item.quantity >= item.stock ? C.muted : C.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* Header */}
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <View style={s.blob} />
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Giỏ hàng</Text>
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

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : isEmpty ? (
        /* Empty state */
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Ionicons name="cart-outline" size={52} color={C.primary} />
          </View>
          <Text style={s.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={s.emptyText}>Hãy thêm sản phẩm vào giỏ để đặt hàng</Text>
          <TouchableOpacity
            style={s.shopBtn}
            onPress={() => router.push('/(tabs)/products' as any)}
            activeOpacity={0.85}
          >
            <Text style={s.shopBtnText}>Mua sắm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart!.items}
            keyExtractor={item => item.productId}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchCart();
                }}
                tintColor={C.primary}
              />
            }
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={s.separator} />}
          />

          {/* Summary + Checkout */}
          <View style={s.summary}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Tạm tính ({cart!.totalItems} sp)</Text>
              <Text style={s.summaryAmount}>{formatCurrency(cart!.totalAmount)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Phí giao hàng</Text>
              <Text style={[s.summaryAmount, { color: '#22C55E' }]}>Miễn phí</Text>
            </View>
            <View style={[s.summaryRow, s.totalRow]}>
              <Text style={s.totalLabel}>Tổng cộng</Text>
              <Text style={s.totalAmount}>{formatCurrency(cart!.totalAmount)}</Text>
            </View>

            <TouchableOpacity
              style={s.checkoutBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/checkout' as any)}
            >
              <Text style={s.checkoutText}>Đặt hàng</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
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
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  shopBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  list: { padding: 16, paddingBottom: 8 },
  separator: { height: 8 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E5F9FA',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 19, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: C.primary },
  itemSubtotal: { fontSize: 11, color: C.muted, marginTop: 2 },

  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  qtyBtn: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 15, fontWeight: '700', color: C.text, minWidth: 24, textAlign: 'center' },

  summary: {
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: C.muted },
  summaryAmount: { fontSize: 14, fontWeight: '600', color: C.text },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: C.text },
  totalAmount: { fontSize: 20, fontWeight: '800', color: C.primary },
  checkoutBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  checkoutText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
