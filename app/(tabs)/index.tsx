import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { useLayout } from '@/lib/layout';
import { useCartCount } from '@/lib/cart-context';
import { haptics } from '@/lib/haptics';
import ProductImage from '@/components/ProductImage';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';
import { flashSaleService } from '@/services/flashsale.service';
import { cartService } from '@/services/cart.service';
import { ordersService } from '@/services/orders.service';
import {
  articlesService,
  getCategoryMeta,
  getArticleImage,
  type Article,
} from '@/services/articles.service';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/Skeleton';
import { formatCurrency, formatCountdown } from '@/lib/utils';
import type { Category, Product, FlashSaleSession, Order } from '@/types';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
};

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

function getCatIcon(name: string) {
  const l = name.toLowerCase();
  for (const c of CAT_ICONS) {
    if (l.includes(c.key)) return c;
  }
  return { icon: 'basket-outline', color: C.primary, bg: '#E5F9FA' };
}

const SCREEN_W = Dimensions.get('window').width;

const ACTIVE_ORDER_STATUSES = [
  'PendingPayment',
  'Paid_WaitingForBatch',
  'ShippingToHub',
  'InHub_ReadyForPickup',
];

const ORDER_STATUS_LABELS: Record<string, string> = {
  PendingPayment: 'Chờ thanh toán',
  Paid_WaitingForBatch: 'Đang chuẩn bị hàng',
  ShippingToHub: 'Đang vận chuyển về Hub',
  InHub_ReadyForPickup: 'Tại Hub — sẵn sàng lấy hàng 🎉',
};

// ── Hero carousel ────────────────────────────────────────────────────────────
const HERO_BANNERS = [
  {
    id: '1',
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80&auto=format&fit=crop',
    eyebrow: 'SIÊU SALE HÔM NAY',
    title: 'Giảm đến 50%\nRau củ quả tươi',
    cta: 'Mua ngay',
    route: '/flash-sale',
    badge: '🔥 Flash Sale',
  },
  {
    id: '2',
    image:
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=80&auto=format&fit=crop',
    eyebrow: 'GIAO HÀNG NHANH',
    title: 'Đặt trước 10h\nNhận trong ngày',
    cta: 'Xem thực đơn',
    route: '/(tabs)/products',
    badge: '⚡ Siêu tốc',
  },
  {
    id: '3',
    image:
      'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=900&q=80&auto=format&fit=crop',
    eyebrow: 'ORGANIC CERTIFIED',
    title: 'Thực phẩm sạch\nChứng nhận VietGAP',
    cta: 'Khám phá',
    route: '/(tabs)/products',
    badge: '🌿 Organic',
  },
];

// ── Promo banners data ───────────────────────────────────────────────────────
const SUB_BANNERS = [
  {
    image:
      'https://images.unsplash.com/photo-1557844352-761f2565b576?w=600&q=80&auto=format&fit=crop',
    eyebrow: 'Hôm nay giảm 25%',
    title: 'Rau củ VietGAP',
    sub: 'Tươi sạch, giá tốt',
    badge: '-25%',
    route: '/(tabs)/products',
  },
  {
    image:
      'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80&auto=format&fit=crop',
    eyebrow: 'Mới về hôm nay',
    title: 'Trái cây nhập khẩu',
    sub: 'Nguồn gốc rõ ràng',
    badge: 'New',
    route: '/(tabs)/products',
  },
];

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const { cardGap } = useLayout();
  const { user } = useAuth();
  const { show } = useToast();
  const { itemCount, refreshCount } = useCartCount();

  const heroRef = useRef<any>(null);
  const [heroBannerIdx, setHeroBannerIdx] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [flashSale, setFlashSale] = useState<FlashSaleSession | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const firstName = user?.fullName?.split(' ').pop() ?? 'bạn';

  const load = useCallback(async () => {
    try {
      const [cats, prods, sale, disc, arts, orders] = await Promise.all([
        categoriesService.getAll(),
        productsService.getAll({ pageSize: 8, sortBy: 'newest' }),
        flashSaleService.getCurrent(),
        productsService.getAll({ pageSize: 6, isDiscount: true }),
        articlesService.getAll(),
        ordersService.getMyOrders({ pageSize: 10 }),
      ]);
      setCategories(cats);
      setProducts(prods.items);
      setFlashSale(sale);
      setDiscountProducts(disc.items);
      setArticles(arts.slice(0, 3));
      setActiveOrder(orders.items.find(o => ACTIVE_ORDER_STATUSES.includes(o.status)) ?? null);
      refreshCount();
    } catch {
      // silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroBannerIdx(i => {
        const next = (i + 1) % HERO_BANNERS.length;
        heroRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!flashSale) return;
    const timer = setInterval(() => setCountdown(formatCountdown(flashSale.endTime)), 1000);
    setCountdown(formatCountdown(flashSale.endTime));
    return () => clearInterval(timer);
  }, [flashSale]);

  const handleAddToCart = async (product: Product) => {
    try {
      await cartService.add(product.id, 1);
      haptics.success();
      show(`Đã thêm "${product.name}" vào giỏ`);
    } catch {
      haptics.error();
      show('Không thể thêm vào giỏ hàng', 'error');
    }
  };

  const handleSearch = () => {
    if (search.trim()) router.push(`/product/search?q=${encodeURIComponent(search)}` as any);
  };

  const handleCatFilter = (catId: string | null) => {
    setSelectedCat(catId);
    productsService
      .getAll({ categoryId: catId ?? undefined, pageSize: 8 })
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
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.headerIconBtn}
              onPress={() => router.push('/(tabs)/cart' as any)}
            >
              <Ionicons name="cart-outline" size={22} color="#fff" />
              {itemCount > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)}>
              <View style={s.avatarBtn}>
                <Text style={s.avatarLetter}>{user?.fullName?.charAt(0)?.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>
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
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {/* ── HERO CAROUSEL ── */}
        <View style={s.heroWrap}>
          <ScrollView
            ref={heroRef}
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e =>
              setHeroBannerIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
            }
          >
            {HERO_BANNERS.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[s.heroCard, { width: SCREEN_W }]}
                onPress={() => router.push(b.route as any)}
                activeOpacity={0.92}
              >
                <Image
                  source={{ uri: b.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={400}
                />
                <View style={s.heroOverlay} />
                <View style={s.heroContent}>
                  <View style={s.heroBadge}>
                    <Text style={s.heroBadgeText}>{b.badge}</Text>
                  </View>
                  <Text style={s.heroEyebrow}>{b.eyebrow}</Text>
                  <Text style={s.heroTitle}>{b.title}</Text>
                  <View style={s.heroCta}>
                    <Text style={s.heroCtaText}>{b.cta}</Text>
                    <Ionicons name="arrow-forward" size={13} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.heroDots}>
            {HERO_BANNERS.map((_, i) => (
              <View key={i} style={[s.heroDot, i === heroBannerIdx && s.heroDotActive]} />
            ))}
          </View>
        </View>

        {/* ── ACTIVE ORDER STRIP ── */}
        {activeOrder && (
          <TouchableOpacity
            style={s.orderStrip}
            onPress={() => router.push(`/order/${activeOrder.id}` as any)}
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

        {/* ── SUB BANNERS ── */}
        <View style={s.bannersRow}>
          {SUB_BANNERS.map(b => (
            <TouchableOpacity
              key={b.title}
              style={s.bannerCard}
              onPress={() => router.push(b.route as any)}
              activeOpacity={0.88}
            >
              <Image
                source={{ uri: b.image }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
              />
              <View style={s.bannerOverlay} />
              <View style={s.bannerContent}>
                <Text style={s.bannerEyebrow}>{b.eyebrow}</Text>
                <Text style={s.bannerTitle}>{b.title}</Text>
                <Text style={s.bannerSub}>{b.sub}</Text>
              </View>
              <View style={s.bannerBadge}>
                <Text style={s.bannerBadgeText}>{b.badge}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CATEGORIES (circles) ── */}
        {categories.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionLabel}>DANH MỤC</Text>
              <Text style={s.sectionTitle}>Mua sắm theo danh mục</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.catScroll}
            >
              {categories.map(cat => {
                const ic = getCatIcon(cat.name);
                const isActive = selectedCat === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={s.catCircleWrap}
                    onPress={() => handleCatFilter(isActive ? null : cat.id)}
                    activeOpacity={0.8}
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
                    <Text
                      style={[
                        s.catCircleLabel,
                        isActive && { color: C.primary, fontWeight: '700' },
                      ]}
                      numberOfLines={2}
                    >
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
            <View style={[s.flashHeaderRow, s.sectionHeaderFlash]}>
              <View style={s.flashTitleRow}>
                <View style={s.flashIconWrap}>
                  <Ionicons name="flash" size={16} color="#fff" />
                </View>
                <Text style={s.flashTitle}>Flash Sale</Text>
                <Text style={s.flashCountdown}>{countdown}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/flash-sale' as any)}>
                <Text style={s.seeAll}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.flashScroll}
            >
              {flashSale.products.slice(0, 8).map(item => (
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
                    <Text style={s.stockText}>Còn {item.stockRemaining}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── NEW PRODUCTS ── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <View>
              <Text style={s.sectionLabel}>HÀNG MỚI VỀ</Text>
              <Text style={s.sectionTitle}>Thu hoạch sáng — giao trong ngày</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/products' as any)}>
              <Text style={s.seeAll}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={[s.productGrid, { gap: cardGap }]}>
              {[1, 2, 3, 4].map(i => (
                <ProductCardSkeleton key={i} />
              ))}
            </View>
          ) : products.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="leaf-outline" size={40} color={C.muted} />
              <Text style={s.emptyText}>Chưa có sản phẩm</Text>
            </View>
          ) : (
            <View style={[s.productGrid, { gap: cardGap }]}>
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
              ))}
            </View>
          )}
        </View>

        {/* ── INTER BANNER ── */}
        <TouchableOpacity
          style={s.interBanner}
          onPress={() => router.push('/(tabs)/products' as any)}
          activeOpacity={0.88}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80&auto=format&fit=crop',
            }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={s.interOverlay} />
          <View style={s.interContent}>
            <View style={s.interBadge}>
              <Text style={s.interBadgeText}>Chứng nhận VietGAP</Text>
            </View>
            <Text style={s.interTitle}>Rau củ quả tươi sạch từ nông trại</Text>
            <Text style={s.interSub}>Kiểm định chất lượng từng lô hàng — minh bạch nguồn gốc</Text>
            <View style={s.interCta}>
              <Text style={s.interCtaText}>Đặt mua ngay</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* ── DISCOUNT PRODUCTS ── */}
        {discountProducts.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <View>
                <Text style={s.sectionLabel}>GIÁ TỐT MỖI NGÀY</Text>
                <Text style={s.sectionTitle}>Ưu đãi cập nhật liên tục</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/products' as any)}>
                <Text style={s.seeAll}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.productGrid, { gap: cardGap }]}>
              {discountProducts.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
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
            <TouchableOpacity onPress={() => router.push('/articles' as any)}>
              <Text style={s.seeAll}>Xem tất cả →</Text>
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
                    onPress={() => router.push(`/articles/${article.id}` as any)}
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
          )}
        </View>

        {/* ── TRUST BADGES ── */}
        <View style={s.trustWrap}>
          {[
            { icon: 'checkmark-circle-outline', label: 'Kiểm định chất lượng', color: '#22C55E' },
            { icon: 'location-outline', label: 'Giao tận Hub gần nhà', color: C.primary },
            { icon: 'shield-checkmark-outline', label: 'Nguồn gốc minh bạch', color: '#8B5CF6' },
          ].map(t => (
            <View key={t.label} style={s.trustItem}>
              <Ionicons name={t.icon as any} size={22} color={t.color} />
              <Text style={s.trustLabel}>{t.label}</Text>
            </View>
          ))}
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
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionHeader: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },

  // Sub Banners
  bannersRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  bannerCard: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5F9FA',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4,50,56,0.55)',
  },
  bannerContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  bannerEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff', lineHeight: 18 },
  bannerSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  bannerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bannerBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  // Category Circles
  catScroll: { gap: 14, paddingBottom: 4 },
  catCircleWrap: { alignItems: 'center', gap: 7, width: 72 },
  catCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catCircleActive: { borderColor: C.primary },
  catCircleLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: C.muted,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Flash Sale
  sectionHeaderFlash: { marginBottom: 14 },
  flashHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flashIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  flashCountdown: { fontSize: 14, fontWeight: '700', color: '#D97706', letterSpacing: 0.5 },
  flashScroll: { gap: 12, paddingBottom: 4 },
  flashCard: {
    width: 150,
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  flashImgWrap: { width: '100%', height: 130, backgroundColor: '#FEF3C7' },
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
  flashPrice: { fontSize: 13, fontWeight: '800', color: '#EF4444' },
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

  // Products
  productGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  loadingWrap: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: C.muted },

  // Inter Banner
  interBanner: {
    height: 160,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.primaryDark,
  },
  interOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4,50,56,0.6)',
  },
  interContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 6,
  },
  interBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  interBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  interTitle: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 22 },
  interSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 16 },
  interCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: C.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  interCtaText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Articles
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
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  articleBannerTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  articleBannerSub: { fontSize: 12, color: C.muted, lineHeight: 16 },

  // Header actions
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Hero carousel
  heroWrap: { marginTop: 12 },
  heroCard: { height: 200, backgroundColor: C.primaryDark, overflow: 'hidden' },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.38)' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, gap: 4 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: C.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 6,
  },
  heroCtaText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  heroDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingBottom: 2,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' },
  heroDotActive: { width: 20, backgroundColor: C.primary },

  // Active order strip
  orderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E5F9FA',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAF3F5',
  },
  orderStripIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderStripLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  orderStripSub: { fontSize: 11, color: C.primary, fontWeight: '600', marginTop: 1 },

  // Trust badges
  trustWrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  trustItem: { alignItems: 'center', gap: 6, flex: 1 },
  trustLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: C.muted,
    textAlign: 'center',
    lineHeight: 15,
  },
});
