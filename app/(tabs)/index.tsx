import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import ProductImage from '@/components/ProductImage';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';
import { flashSaleService } from '@/services/flashsale.service';
import { cartService } from '@/services/cart.service';
import ProductCard from '@/components/ProductCard';
import { formatCurrency, formatCountdown } from '@/lib/utils';
import type { Category, Product, FlashSaleSession } from '@/types';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
};

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const { show } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSale, setFlashSale] = useState<FlashSaleSession | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const firstName = user?.fullName?.split(' ').pop() ?? 'bạn';

  const load = useCallback(async () => {
    try {
      const [cats, prods, sale] = await Promise.all([
        categoriesService.getAll(),
        productsService.getAll({ pageSize: 10, sortBy: 'newest' }),
        flashSaleService.getCurrent(),
      ]);
      setCategories(cats);
      setProducts(prods.items);
      setFlashSale(sale);
    } catch {
      // Network error handled silently — user can pull to refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Flash sale countdown
  useEffect(() => {
    if (!flashSale) return;
    const timer = setInterval(() => setCountdown(formatCountdown(flashSale.endTime)), 1000);
    setCountdown(formatCountdown(flashSale.endTime));
    return () => clearInterval(timer);
  }, [flashSale]);

  const handleAddToCart = async (product: Product) => {
    try {
      await cartService.add(product.id, 1);
      show(`Đã thêm "${product.name}" vào giỏ`);
    } catch {
      show('Không thể thêm vào giỏ hàng', 'error');
    }
  };

  const handleSearch = () => {
    if (search.trim()) router.push(`/product/search?q=${encodeURIComponent(search)}` as any);
  };

  const handleCatFilter = (catId: string | null) => {
    setSelectedCat(catId);
    productsService
      .getAll({ categoryId: catId ?? undefined, pageSize: 10 })
      .then(r => setProducts(r.items))
      .catch(() => {});
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <View style={s.blob} />
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Xin chào, {firstName} 👋</Text>
            <Text style={s.subGreeting}>Hôm nay muốn ăn gì?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)}>
            <View style={s.avatarBtn}>
              <Text style={s.avatarLetter}>{user?.fullName?.charAt(0)?.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.searchBar} onPress={handleSearch} activeOpacity={0.85}>
          <Ionicons name="search-outline" size={18} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Tìm thực phẩm tươi ngon..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {/* ── CATEGORIES ── */}
        {categories.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Danh mục</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.catScroll}
            >
              <TouchableOpacity
                style={[s.catChip, selectedCat === null && s.catChipActive]}
                onPress={() => handleCatFilter(null)}
              >
                <Text style={[s.catChipText, selectedCat === null && s.catChipTextActive]}>
                  Tất cả
                </Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catChip, selectedCat === cat.id && s.catChipActive]}
                  onPress={() => handleCatFilter(cat.id)}
                >
                  <Text style={[s.catChipText, selectedCat === cat.id && s.catChipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── FLASH SALE ── */}
        {flashSale && (
          <View style={s.section}>
            <View style={s.flashHeader}>
              <View style={s.flashTitleRow}>
                <Ionicons name="flash" size={18} color="#F59E0B" />
                <Text style={s.flashTitle}>Flash Sale</Text>
              </View>
              <View style={s.countdownWrap}>
                <Text style={s.countdownLabel}>Kết thúc sau</Text>
                <Text style={s.countdown}>{countdown}</Text>
                <TouchableOpacity onPress={() => router.push('/flash-sale' as any)}>
                  <Text style={s.seeAll}>Xem tất cả →</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.flashScroll}
            >
              {flashSale.products.slice(0, 6).map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={s.flashCard}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                  activeOpacity={0.88}
                >
                  <View style={s.flashImgWrap}>
                    <ProductImage
                      uri={item.thumbnailUrl}
                      style={StyleSheet.absoluteFill}
                      name={item.name}
                    />
                    <View style={s.flashBadge}>
                      <Text style={s.flashBadgeText}>
                        -
                        {Math.round(
                          ((item.originalPrice - item.flashSalePrice) / item.originalPrice) * 100
                        )}
                        %
                      </Text>
                    </View>
                  </View>
                  <View style={s.flashInfo}>
                    <Text style={s.flashName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={s.flashPrice}>{formatCurrency(item.flashSalePrice)}</Text>
                    <Text style={s.flashOriginal}>{formatCurrency(item.originalPrice)}</Text>
                    {/* Stock bar */}
                    <View style={s.stockBarWrap}>
                      <View
                        style={[
                          s.stockBar,
                          {
                            width: `${Math.min(100, (item.soldCount / item.flashSaleStock) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={s.stockText}>Còn {item.stockRemaining}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── CẨM NANG ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Cẩm nang mua sắm</Text>
            <TouchableOpacity onPress={() => router.push('/articles' as any)}>
              <Text style={s.seeAll}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={s.articleBanner}
            onPress={() => router.push('/articles' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="book-outline" size={28} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.articleBannerTitle}>Kiến thức & kinh nghiệm</Text>
              <Text style={s.articleBannerSub}>Dinh dưỡng, mẹo mua sắm từ đội ngũ TapHoa</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* ── PRODUCTS ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Sản phẩm mới</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/products' as any)}>
              <Text style={s.seeAll}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator color={C.primary} size="large" />
            </View>
          ) : products.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="leaf-outline" size={40} color={C.muted} />
              <Text style={s.emptyText}>Chưa có sản phẩm nào</Text>
            </View>
          ) : (
            <View style={s.productGrid}>
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
  },
  blob: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: { fontSize: 21, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarLetter: { fontSize: 16, fontWeight: '700', color: '#fff' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },

  body: { flex: 1 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },

  catScroll: { gap: 8, paddingVertical: 2 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  catChipText: { fontSize: 13, fontWeight: '500', color: C.muted },
  catChipTextActive: { color: '#fff', fontWeight: '600' },

  flashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flashTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  countdownWrap: { alignItems: 'flex-end' },
  countdownLabel: { fontSize: 10, color: C.muted },
  countdown: { fontSize: 16, fontWeight: '800', color: C.primaryDark, letterSpacing: 1 },

  flashScroll: { gap: 12, paddingVertical: 2 },
  flashCard: {
    width: 140,
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  flashImgWrap: { width: '100%', height: 120, backgroundColor: '#E5F9FA' },
  flashBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flashBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  flashInfo: { padding: 10 },
  flashName: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 4, lineHeight: 16 },
  flashPrice: { fontSize: 13, fontWeight: '700', color: C.primary },
  flashOriginal: { fontSize: 11, color: C.muted, textDecorationLine: 'line-through' },
  stockBarWrap: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  stockBar: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 2 },
  stockText: { fontSize: 10, color: C.muted, marginTop: 3 },

  articleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  articleBannerTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  articleBannerSub: { fontSize: 12, color: C.muted, lineHeight: 16 },

  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  loadingWrap: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: C.muted },
});
