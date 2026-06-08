import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/lib/layout';
import { Ionicons } from '@expo/vector-icons';
import { flashSaleService } from '@/services/flashsale.service';
import { cartService } from '@/services/cart.service';
import ProductImage from '@/components/ProductImage';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import { formatCurrency, formatCountdown } from '@/lib/utils';
import type { FlashSaleSession, FlashSaleProduct } from '@/types';
import { C } from '@/constants/Colors';

const FLASH_BG = '#FFF8F0';

export default function FlashSaleScreen() {
  const { top } = useSafeAreaInsets();
  const { productColumns, cardGap } = useLayout();
  const { show } = useToast();
  const [session, setSession] = useState<FlashSaleSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await flashSaleService.getCurrent();
      setSession(data);
    } catch {
      console.warn('Failed to load flash sale');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => setCountdown(formatCountdown(session.endTime)), 1000);
    setCountdown(formatCountdown(session.endTime));
    return () => clearInterval(timer);
  }, [session]);

  const handleAddToCart = async (product: FlashSaleProduct) => {
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

  const renderItem = ({ item }: { item: FlashSaleProduct }) => {
    const pct = Math.round(((item.originalPrice - item.flashSalePrice) / item.originalPrice) * 100);
    const soldPct = Math.min(100, (item.soldCount / item.flashSaleStock) * 100);
    const isAdding = addingToCart === item.id;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/product/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <View style={s.imgWrap}>
          <ProductImage uri={item.thumbnailUrl} style={StyleSheet.absoluteFill} name={item.name} />
          <View style={s.pctBadge}>
            <Text style={s.pctText}>-{pct}%</Text>
          </View>
          {item.stockRemaining <= 5 && item.stockRemaining > 0 && (
            <View style={s.lowStockBadge}>
              <Text style={s.lowStockText}>Còn {item.stockRemaining}</Text>
            </View>
          )}
        </View>

        <View style={s.info}>
          <Text style={s.category}>{item.categoryName}</Text>
          <Text style={s.name} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={s.priceRow}>
            <Text style={s.salePrice}>{formatCurrency(item.flashSalePrice)}</Text>
            <Text style={s.origPrice}>{formatCurrency(item.originalPrice)}</Text>
          </View>

          {/* Stock progress */}
          <View style={s.stockSection}>
            <View style={s.stockBar}>
              <View style={[s.stockFill, { width: `${soldPct}%` as any }]} />
            </View>
            <Text style={s.stockText}>Đã bán {item.soldCount}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[s.cartBtn, isAdding && s.cartBtnDim]}
          onPress={() => handleAddToCart(item)}
          disabled={isAdding || item.stockRemaining === 0}
          activeOpacity={0.8}
        >
          {isAdding ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : item.stockRemaining === 0 ? (
            <Text style={s.soldOutText}>Hết</Text>
          ) : (
            <Ionicons name="add" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.saleDark} />

      {/* Header */}
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Ionicons name="flash" size={20} color="#FCD34D" />
            <Text style={s.headerTitle}>Flash Sale</Text>
          </View>
          {session && <Text style={s.sessionName}>{session.name}</Text>}
        </View>
        {session && (
          <View style={s.countdownBox}>
            <Text style={s.countdownLabel}>Kết thúc sau</Text>
            <Text style={s.countdown}>{countdown}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.sale} size="large" />
        </View>
      ) : !session ? (
        <EmptyState
          icon="flash-outline"
          iconColor={C.sale}
          title="Không có Flash Sale"
          subtitle="Hiện chưa có phiên Flash Sale nào đang diễn ra"
          action={{
            label: 'Xem sản phẩm thường',
            onPress: () => router.push('/(tabs)/products' as any),
          }}
        />
      ) : (
        <FlatList
          data={session.products ?? []}
          keyExtractor={item => item.id}
          numColumns={productColumns}
          key={productColumns}
          contentContainerStyle={[s.grid, { gap: cardGap }]}
          columnWrapperStyle={{ gap: cardGap }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={C.sale}
            />
          }
          ListHeaderComponent={
            <View style={s.banner}>
              <Ionicons name="flash" size={16} color={C.saleDark} />
              <Text style={s.bannerText}>
                {(session.products ?? []).length} sản phẩm giảm giá sốc — số lượng có hạn!
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FLASH_BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.saleDark,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  sessionName: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  countdownBox: { alignItems: 'flex-end' },
  countdownLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  countdown: { fontSize: 18, fontWeight: '800', color: '#FCD34D', letterSpacing: 1 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontSize: 13, color: C.saleDark, fontWeight: '500' },

  grid: { padding: 16, paddingBottom: 32 },
  row: { justifyContent: 'space-between', marginBottom: 12 },

  card: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imgWrap: { width: '100%', aspectRatio: 1, backgroundColor: '#FEF3C7' },
  pctBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pctText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  lowStockBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lowStockText: { fontSize: 10, fontWeight: '600', color: '#FCD34D' },

  info: { padding: 10 },
  category: {
    fontSize: 10,
    color: C.sale,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  name: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 17, marginBottom: 6 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  salePrice: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
  origPrice: { fontSize: 11, color: C.muted, textDecorationLine: 'line-through' },

  stockSection: { gap: 4 },
  stockBar: {
    height: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stockFill: { height: '100%', backgroundColor: C.sale, borderRadius: 3 },
  stockText: { fontSize: 10, color: C.muted },

  cartBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.sale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnDim: { opacity: 0.6 },
  soldOutText: { fontSize: 9, fontWeight: '700', color: '#fff' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  shopBtn: {
    marginTop: 8,
    backgroundColor: C.sale,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shopBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
