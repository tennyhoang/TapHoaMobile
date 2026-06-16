import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { useLayout } from '@/lib/layout';
import { useCartCount } from '@/lib/cart-context';
import { haptics } from '@/lib/haptics';
import ProductImage from '@/components/ProductImage';
import {
  useCategories,
  useCurrentFlashSale,
  useArticles,
  useMyOrders,
  useAddToCart,
  useProducts,
} from '@/lib/hooks';
import { getCategoryMeta, getArticleImage } from '@/services/articles.service';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/Skeleton';
import { formatCurrency, formatCountdown } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';
import type { Product } from '@/types';
import { C } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

// ── Category icon mapping ────────────────────────────────────────────────────
const CAT_ICONS: { key: string; icon: string; color: string; bg: string }[] = [
  { key: 'rau', icon: 'leaf-outline', color: '#16A34A', bg: '#DCFCE7' },
  { key: 'trái', icon: 'nutrition-outline', color: '#EA580C', bg: '#FFEDD5' },
  { key: 'thịt', icon: 'restaurant-outline', color: '#DC2626', bg: '#FEE2E2' },
  { key: 'cá', icon: 'fish-outline', color: '#2563EB', bg: '#DBEAFE' },
  { key: 'trứng', icon: 'ellipse-outline', color: '#CA8A04', bg: '#FEF9C3' },
  { key: 'sữa', icon: 'water-outline', color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'gạo', icon: 'grid-outline', color: '#92400E', bg: '#FEF3C7' },
  { key: 'khô', icon: 'cube-outline', color: '#6B7280', bg: '#F3F4F6' },
  { key: 'gia', icon: 'flame-outline', color: '#EF4444', bg: '#FEE2E2' },
];

function stripDiacritics(str: string) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, d => (d === 'đ' ? 'd' : 'D'));
}

function getCatIcon(name: string) {
  const l = stripDiacritics(name.toLowerCase());
  for (const c of CAT_ICONS) {
    if (l.includes(stripDiacritics(c.key))) return c;
  }
  return { icon: 'basket-outline', color: C.primary, bg: '#E5F9FA' };
}

const ACTIVE_ORDER_STATUSES = [
  'PendingPayment',
  'Paid_WaitingForBatch',
  'PackedAtWarehouse',
  'ShippingToHub',
  'InHub_ReadyForPickup',
];

const ORDER_STATUS_LABELS: Record<string, string> = {
  PendingPayment: 'Chờ thanh toán',
  Paid_WaitingForBatch: 'Đang chuẩn bị hàng',
  PackedAtWarehouse: 'Đang đóng gói tại kho',
  ShippingToHub: 'Đang vận chuyển về Hub',
  InHub_ReadyForPickup: 'Tại Hub — sẵn sàng lấy hàng',
};

// ── Trust badge data ─────────────────────────────────────────────────────────
const TRUST_BADGES = [
  {
    icon: 'car-outline' as const,
    label: 'Giao trong ngày',
    sub: 'Đặt trước 10h',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Đảm bảo chất lượng',
    sub: 'Kiểm định từng lô',
  },
  {
    icon: 'leaf-outline' as const,
    label: '100% tươi sạch',
    sub: 'Chứng nhận VietGAP',
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { cardGap, fontScale } = useLayout();
  useAuth();
  const { show } = useToast();
  const { itemCount } = useCartCount();

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const { data: categories } = useCategories();
  const { data: flashSale } = useCurrentFlashSale();
  const { data: articlesRaw } = useArticles();
  const { data: ordersData } = useMyOrders({ pageSize: 10 });
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch,
  } = useProducts({ pageSize: 8, isNew: true, sortBy: 'newest' });
  const { data: discountData } = useProducts({ pageSize: 6, isDiscount: true });
  const queryClient = useQueryClient();

  const addToCartMutation = useAddToCart();

  const loading = productsLoading;
  const products = productsData?.items ?? [];
  const discountProducts = discountData?.items ?? [];
  const articles = (articlesRaw ?? []).slice(0, 3);
  const activeOrder =
    (ordersData?.items ?? []).find(o => ACTIVE_ORDER_STATUSES.includes(o.status)) ?? null;

  useEffect(() => {
    if (!flashSale) return;
    const timer = setInterval(() => setCountdown(formatCountdown(flashSale.endTime)), 1000);
    setCountdown(formatCountdown(flashSale.endTime));
    return () => clearInterval(timer);
  }, [flashSale]);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCartMutation.mutateAsync({ productId: product.id, quantity: 1 });
      haptics.success();
      show(`Đã thêm "${product.name}" vào giỏ`);
    } catch {
      haptics.error();
      show('Không thể thêm vào giỏ hàng', 'error');
    }
  };

  const handleSearch = () => {
    if (search.trim()) router.push(`/product/search?q=${encodeURIComponent(search)}`);
  };

  const handleCatFilter = (catId: string | null) => {
    setSelectedCat(catId);
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setRefreshing(false);
  }, [refetch, queryClient]);

  return (
    <KeyboardAwareScreen style={s.root} noDismiss>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FAFA" />

      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: top + 12 }]}>
        {/* Top row: logo + location + actions */}
        <View style={s.headerTop}>
          <View style={s.headerLeft}>
            <View style={s.logoWrap}>
              <Ionicons name="basket" size={18} color="#fff" />
            </View>
            <View>
              <Text style={s.logoText}>Tạp Hóa</Text>
              <View style={s.locationRow}>
                <Ionicons name="location-outline" size={11} color={C.primary} />
                <Text style={s.locationText}>Giao hàng tận nơi</Text>
              </View>
            </View>
          </View>

          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.headerIconBtn}
              onPress={() => router.push('/(tabs)/cart')}
              accessibilityRole="button"
              accessibilityLabel="Giỏ hàng"
            >
              <Ionicons name="cart-outline" size={21} color={C.text} />
              {itemCount > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.headerIconBtn}
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel="Thông báo"
            >
              <Ionicons name="notifications-outline" size={21} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
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
            accessibilityRole="search"
            accessibilityLabel="Tìm kiếm sản phẩm"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Xóa tìm kiếm"
            >
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {/* ── HERO BANNER ── */}
        <View style={s.heroCard}>
          <View style={s.heroBg} />
          <View style={s.heroInner}>
            <View style={s.heroTextCol}>
              <View style={s.heroEyebrowRow}>
                <View style={s.heroEyebrowDot} />
                <Text style={s.heroEyebrow}>TapHoa Fresh</Text>
              </View>
              <Text style={s.heroTitle}>Thực phẩm{'\n'}tươi sạch</Text>
              <Text style={s.heroSub}>
                Thu hoạch sáng, giao trong ngày — đảm bảo chất lượng từ nông trại
              </Text>
              <TouchableOpacity
                style={s.heroCta}
                onPress={() => router.push('/(tabs)/products')}
                activeOpacity={0.85}
              >
                <Text style={s.heroCtaText}>Mua ngay</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={s.heroIllustration}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: 88 }}>
                {(
                  [
                    'leaf-outline',
                    'nutrition-outline',
                    'fish-outline',
                    'restaurant-outline',
                  ] as const
                ).map((icon, i) => (
                  <View
                    key={i}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: 'rgba(14,165,174,0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={icon} size={19} color={C.primary} />
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Trust badges row */}
          <View style={s.trustRow}>
            {TRUST_BADGES.map(badge => (
              <View key={badge.label} style={s.trustBadge}>
                <View style={s.trustIconCircle}>
                  <Ionicons name={badge.icon} size={16} color={C.primary} />
                </View>
                <View style={s.trustTextCol}>
                  <Text style={s.trustLabel}>{badge.label}</Text>
                  <Text style={s.trustSub}>{badge.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── ACTIVE ORDER STRIP ── */}
        {activeOrder && (
          <TouchableOpacity
            style={s.orderStrip}
            onPress={() => router.push(`/order/${activeOrder.id}`)}
            activeOpacity={0.85}
          >
            <View style={s.orderStripIcon}>
              <Ionicons name="bicycle-outline" size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.orderStripLabel}>Đơn hàng đang xử lý</Text>
              <Text style={s.orderStripSub}>
                {ORDER_STATUS_LABELS[activeOrder.status] ?? activeOrder.status}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>
        )}

        {/* ── CATEGORIES (circles) ── */}
        {(categories ?? []).length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <View>
                <Text style={s.sectionLabel}>DANH MỤC</Text>
                <Text style={s.sectionTitle}>Mua sắm theo danh mục</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                <Text style={s.seeAll}>{t('common.view_all')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.catScroll}
            >
              {(categories ?? []).map(cat => {
                const ic = getCatIcon(cat.name);
                const isActive = selectedCat === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={s.catCircleWrap}
                    onPress={() => handleCatFilter(isActive ? null : cat.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={cat.name}
                    accessibilityState={{ selected: isActive }}
                  >
                    <View
                      style={[
                        s.catCircle,
                        { backgroundColor: isActive ? C.primary : ic.bg },
                        isActive && s.catCircleActive,
                      ]}
                    >
                      <Ionicons
                        name={ic.icon as any}
                        size={22}
                        color={isActive ? '#fff' : ic.color}
                      />
                    </View>
                    <Text style={[s.catLabel, isActive && s.catLabelActive]} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── FLASH SALE ── */}
        {flashSale && (
          <View style={s.section}>
            {/* Orange gradient header card */}
            <View style={s.flashHeaderCard}>
              <View style={s.flashHeaderLeft}>
                <View style={s.flashIconWrap}>
                  <Ionicons name="flash" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={s.flashTitle}>Flash Sale</Text>
                  <Text style={s.flashSubtitle}>Ưu đãi có giới hạn</Text>
                </View>
              </View>
              <View style={s.flashRightCol}>
                <Text style={s.flashCountdownLabel}>Kết thúc sau</Text>
                <View style={s.flashCountdownRow}>
                  {countdown.split(':').map((seg, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <Text style={s.flashColon}>:</Text>}
                      <View style={s.flashTimeSeg}>
                        <Text style={s.flashTimeNum}>{seg}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.flashScroll}
            >
              {(flashSale.products ?? []).slice(0, 8).map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={s.flashCard}
                  onPress={() => router.push(`/product/${item.id}`)}
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
                    <Text
                      style={[s.flashName, { fontSize: Math.round(12 * fontScale) }]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text style={[s.flashPrice, { fontSize: Math.round(13 * fontScale) }]}>
                      {formatCurrency(item.flashSalePrice)}
                    </Text>
                    <Text style={[s.flashOriginal, { fontSize: Math.round(11 * fontScale) }]}>
                      {formatCurrency(item.originalPrice)}
                    </Text>
                    <View style={s.stockBarWrap}>
                      <View
                        style={[
                          s.stockBar,
                          {
                            width:
                              `${Math.min(100, (item.soldCount / item.flashSaleStock) * 100)}%` as any,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[s.stockText, { fontSize: Math.round(10 * fontScale) }]}>
                      Còn {item.stockRemaining}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* See-all card */}
              <TouchableOpacity
                style={s.flashSeeAllCard}
                onPress={() => router.push('/flash-sale')}
                activeOpacity={0.85}
              >
                <View style={s.flashSeeAllIcon}>
                  <Ionicons name="arrow-forward" size={22} color="#F97316" />
                </View>
                <Text style={s.flashSeeAllText}>Xem{'\n'}tất cả</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ── FEATURED / NEW PRODUCTS ── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <View>
              <Text style={s.sectionLabel}>HÀNG MỚI VỀ</Text>
              <Text style={s.sectionTitle}>Thu hoạch sáng — giao trong ngày</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
              <Text style={s.seeAll}>{t('common.view_all')}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={[s.productGrid, { gap: cardGap }]}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={{ flex: 1, maxWidth: '50%' }}>
                  <ProductCardSkeleton />
                </View>
              ))}
            </View>
          ) : products.length === 0 ? (
            <EmptyState icon="leaf-outline" title="Chưa có sản phẩm" />
          ) : (
            <View style={[s.productGrid, { gap: cardGap }]}>
              {products.map(p => (
                <View key={p.id} style={{ flex: 1, maxWidth: '50%' }}>
                  <ProductCard product={p} onAddToCart={handleAddToCart} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── DISCOUNT PRODUCTS ── */}
        {discountProducts.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <View>
                <Text style={s.sectionLabel}>GIÁ TỐT MỖI NGÀY</Text>
                <Text style={s.sectionTitle}>Ưu đãi cập nhật liên tục</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                <Text style={s.seeAll}>{t('common.view_all')}</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.productGrid, { gap: cardGap }]}>
              {discountProducts.map(p => (
                <View key={p.id} style={{ flex: 1, maxWidth: '50%' }}>
                  <ProductCard product={p} onAddToCart={handleAddToCart} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── ARTICLES PREVIEW ── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <View>
              <Text style={s.sectionLabel}>CẨM NANG</Text>
              <Text style={s.sectionTitle}>Bếp & Ẩm thực</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/articles/index' as any)}>
              <Text style={s.seeAll}>{t('common.view_all')}</Text>
            </TouchableOpacity>
          </View>

          {articles.length > 0 ? (
            <View style={s.articlesWrap}>
              {articles.map((article, i) => {
                const meta = getCategoryMeta(article.category);
                const image = getArticleImage(article);
                return (
                  <TouchableOpacity
                    key={article.id}
                    style={i === 0 ? s.articleFeatured : s.articleCard}
                    onPress={() => router.push(`/articles/${article.id}`)}
                    activeOpacity={0.88}
                  >
                    {i === 0 ? (
                      <>
                        <Image
                          source={{ uri: image }}
                          style={s.articleFeaturedImg}
                          contentFit="cover"
                          transition={200}
                        />
                        <View style={s.articleFeaturedOverlay} />
                        <View style={s.articleFeaturedContent}>
                          <View style={[s.articleCatBadge, { backgroundColor: meta.color + 'CC' }]}>
                            <Text style={s.articleCatText}>{meta.label}</Text>
                          </View>
                          <Text style={s.articleFeaturedTitle} numberOfLines={2}>
                            {article.title}
                          </Text>
                          <View style={s.articleMeta}>
                            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                            <Text style={s.articleMetaText}>
                              {article.readTimeMinutes} phút đọc
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <>
                        <Image
                          source={{ uri: image }}
                          style={s.articleCardImg}
                          contentFit="cover"
                          transition={200}
                        />
                        <View style={s.articleCardInfo}>
                          <View
                            style={[s.articleCatBadgeSmall, { backgroundColor: meta.color + '22' }]}
                          >
                            <Text style={[s.articleCatTextSmall, { color: meta.color }]}>
                              {meta.label}
                            </Text>
                          </View>
                          <Text style={s.articleCardTitle} numberOfLines={2}>
                            {article.title}
                          </Text>
                          <View style={s.articleMeta}>
                            <Ionicons name="time-outline" size={11} color={C.muted} />
                            <Text style={[s.articleMetaText, { color: C.muted }]}>
                              {article.readTimeMinutes} phút
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TouchableOpacity
              style={s.articleBanner}
              onPress={() => router.push('/articles/index' as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="book-outline" size={28} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.articleBannerTitle}>Kiến thức & kinh nghiệm</Text>
                <Text style={s.articleBannerSub}>Dinh dưỡng, mẹo mua sắm từ đội ngũ TapHoa</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAwareScreen>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FAFA' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#F0FAFA',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  logoText: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // ── Search bar ────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },

  body: { flex: 1 },

  // ── Hero banner ───────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F0FAFA',
  },
  heroInner: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 16,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.text,
    lineHeight: 30,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 17,
    marginBottom: 14,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  heroCtaText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroIllustration: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Trust badges inside hero
  trustRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  trustBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 4,
  },
  trustIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trustTextCol: {
    flex: 1,
  },
  trustLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.text,
    lineHeight: 13,
  },
  trustSub: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 12,
  },

  // ── Shared section ────────────────────────────────────────────────────────
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },

  // ── Active order strip ────────────────────────────────────────────────────
  orderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAF3F5',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  orderStripIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderStripLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  orderStripSub: { fontSize: 11, color: C.primary, fontWeight: '600', marginTop: 1 },

  // ── Category circles ──────────────────────────────────────────────────────
  catScroll: { gap: 14, paddingBottom: 4 },
  catCircleWrap: { alignItems: 'center', gap: 7, width: 72 },
  catCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  catCircleActive: { borderColor: C.primary },
  catLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: C.muted,
    textAlign: 'center',
    lineHeight: 14,
  },
  catLabelActive: { color: C.primary, fontWeight: '700' },

  // ── Flash sale ────────────────────────────────────────────────────────────
  flashHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF7F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    marginBottom: 12,
  },
  flashHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flashIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashTitle: { fontSize: 16, fontWeight: '800', color: '#C2410C' },
  flashSubtitle: { fontSize: 11, color: '#EA580C', fontWeight: '500', marginTop: 1 },
  flashRightCol: { alignItems: 'flex-end' },
  flashCountdownLabel: { fontSize: 10, color: '#EA580C', fontWeight: '500', marginBottom: 4 },
  flashCountdownRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  flashTimeSeg: {
    backgroundColor: '#F97316',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  flashTimeNum: { fontSize: 13, fontWeight: '800', color: '#fff' },
  flashColon: { fontSize: 13, fontWeight: '800', color: '#F97316', marginBottom: 1 },

  flashScroll: { gap: 12, paddingBottom: 4 },
  flashCard: {
    width: 148,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  flashImgWrap: { width: '100%', height: 126, backgroundColor: '#FFF7F0' },
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
  flashPrice: { fontSize: 13, fontWeight: '800', color: '#F97316' },
  flashOriginal: { fontSize: 11, color: C.muted, textDecorationLine: 'line-through' },
  stockBarWrap: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  stockBar: { height: '100%', backgroundColor: '#F97316', borderRadius: 2 },
  stockText: { fontSize: 10, color: C.muted, marginTop: 3 },
  flashSeeAllCard: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  flashSeeAllIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashSeeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Product grid ──────────────────────────────────────────────────────────
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // ── Articles ──────────────────────────────────────────────────────────────
  articlesWrap: { gap: 10 },
  articleFeatured: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E5F9FA',
  },
  articleFeaturedImg: { ...StyleSheet.absoluteFill },
  articleFeaturedOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.42)' },
  articleFeaturedContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 6,
  },
  articleFeaturedTitle: { fontSize: 16, fontWeight: '800', color: '#fff', lineHeight: 21 },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  articleCardImg: { width: 100, height: 88 },
  articleCardInfo: { flex: 1, padding: 12, justifyContent: 'center', gap: 5 },
  articleCardTitle: { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 17 },
  articleCatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  articleCatText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  articleCatBadgeSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  articleCatTextSmall: { fontSize: 10, fontWeight: '700' },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  articleMetaText: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  articleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  articleBannerTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  articleBannerSub: { fontSize: 12, color: C.muted, lineHeight: 16 },
});
