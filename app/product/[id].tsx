import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from '@/components/ProductImage';
import ProductCard from '@/components/ProductCard';
import { productsService } from '@/services/products.service';
import { cartService } from '@/services/cart.service';
import { useCartCount } from '@/lib/cart-context';
import { formatCurrency, discountPercent } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import type { Product } from '@/types';

const { width: W } = Dimensions.get('window');
const IMG_H = W * 0.85;

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
  error: '#EF4444',
};

export default function ProductDetailScreen() {
  const { bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [related, setRelated] = useState<Product[]>([]);
  const { refreshCount } = useCartCount();
  const { show } = useToast();
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(30), []);

  useEffect(() => {
    if (!id) return;
    productsService
      .getById(id)
      .then(p => {
        setProduct(p);
        // Fetch related products by same category
        productsService
          .getAll({ categoryId: p.categoryId, pageSize: 8 })
          .then(r => setRelated((r.items ?? []).filter(x => x.id !== p.id)))
          .catch(() => {});
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 12,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name} - ${formatCurrency(product.discountPrice ?? product.price)}\nMua ngay trên TapHoa!`,
        title: product.name,
      });
    } catch {
      /* user cancelled */
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setCartLoading(true);
    try {
      await cartService.add(product.id, qty);
      setCartSuccess(true);
      refreshCount();
      setTimeout(() => setCartSuccess(false), 2000);
    } catch {
      show('Không thể thêm vào giỏ hàng', 'error');
    } finally {
      setCartLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  if (!product) return null;

  const hasDiscount = !!product.discountPrice;
  const pct = hasDiscount ? discountPercent(product.price, product.discountPrice!) : 0;
  const allImages = [product.thumbnailUrl, ...product.images].filter(Boolean) as string[];
  const inStock = product.stock > 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Image */}
        <View style={s.imgContainer}>
          <ProductImage
            uri={allImages.length > 0 ? allImages[selectedImage] : null}
            style={s.img}
            name={product.name}
          />

          {/* Gradient overlay */}
          <View style={s.imgOverlay} />

          {/* Back button */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Header action buttons */}
          <View style={s.headerActions}>
            <TouchableOpacity style={s.headerBtn} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.headerBtn}
              onPress={() => router.push('/(tabs)/cart' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {hasDiscount && (
            <View style={s.discountBadge}>
              <Text style={s.discountText}>-{pct}%</Text>
            </View>
          )}

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <View style={s.thumbnails}>
              {allImages.map((img, i) => (
                <TouchableOpacity key={i} onPress={() => setSelectedImage(i)}>
                  <View style={[s.thumb, selectedImage === i && s.thumbActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Info Card */}
        <Animated.View
          style={[s.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={s.categoryTag}>{product.categoryName}</Text>
          <Text style={s.productName}>{product.name}</Text>

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.price}>{formatCurrency(product.discountPrice ?? product.price)}</Text>
            {hasDiscount && <Text style={s.originalPrice}>{formatCurrency(product.price)}</Text>}
          </View>

          {/* Rating */}
          <TouchableOpacity
            style={s.ratingRow}
            onPress={() =>
              router.push(`/reviews/${product.id}?name=${encodeURIComponent(product.name)}` as any)
            }
            activeOpacity={0.7}
          >
            {[1, 2, 3, 4, 5].map(star => (
              <Ionicons
                key={star}
                name={star <= Math.round(product.averageRating) ? 'star' : 'star-outline'}
                size={14}
                color="#F59E0B"
              />
            ))}
            {product.reviewCount > 0 ? (
              <>
                <Text style={s.ratingText}>{product.averageRating.toFixed(1)}</Text>
                <Text style={s.reviewCount}>({product.reviewCount} đánh giá)</Text>
              </>
            ) : (
              <Text style={s.reviewCount}>Chưa có đánh giá · Viết đánh giá</Text>
            )}
            <Ionicons name="chevron-forward" size={13} color="#D1D5DB" style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider} />

          {/* Stock info */}
          <View style={s.stockRow}>
            <View style={[s.stockDot, { backgroundColor: inStock ? '#22C55E' : C.error }]} />
            <Text style={[s.stockText, { color: inStock ? '#22C55E' : C.error }]}>
              {inStock ? `Còn hàng (${product.stock})` : 'Hết hàng'}
            </Text>
          </View>

          {/* Description */}
          {product.description && (
            <View style={s.descSection}>
              <Text style={s.descTitle}>Mô tả sản phẩm</Text>
              <Text style={s.desc}>{product.description}</Text>
            </View>
          )}

          {/* Recommendations */}
          {related.length > 0 && (
            <View style={s.relatedSection}>
              <View style={s.relatedHeader}>
                <View>
                  <Text style={s.relatedLabel}>CÓ THỂ BẠN THÍCH</Text>
                  <Text style={s.relatedTitle}>Sản phẩm tương tự</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/products' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={s.seeAll}>Xem tất cả →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.relatedScroll}
              >
                {related.map(p => (
                  <View key={p.id} style={s.relatedCard}>
                    <ProductCard
                      product={p}
                      onAddToCart={async pr => {
                        try {
                          await cartService.add(pr.id, 1);
                          show(`Đã thêm "${pr.name}" vào giỏ`);
                        } catch {
                          show('Không thể thêm vào giỏ', 'error');
                        }
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[s.bottomBar, { paddingBottom: (bottom || 16) + 8 }]}>
        {/* Quantity */}
        <View style={s.qtyWrap}>
          <TouchableOpacity
            style={[s.qtyBtn, qty <= 1 && s.qtyBtnDim]}
            onPress={() => setQty(q => Math.max(1, q - 1))}
          >
            <Ionicons name="remove" size={18} color={qty <= 1 ? C.muted : C.text} />
          </TouchableOpacity>
          <Text style={s.qtyText}>{qty}</Text>
          <TouchableOpacity
            style={[s.qtyBtn, qty >= product.stock && s.qtyBtnDim]}
            onPress={() => setQty(q => Math.min(product.stock, q + 1))}
          >
            <Ionicons name="add" size={18} color={qty >= product.stock ? C.muted : C.text} />
          </TouchableOpacity>
        </View>

        {/* Add to cart */}
        <TouchableOpacity
          style={[s.addBtn, (!inStock || cartLoading) && s.addBtnDim]}
          onPress={handleAddToCart}
          disabled={!inStock || cartLoading}
          activeOpacity={0.85}
        >
          {cartLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : cartSuccess ? (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={s.addBtnText}>Đã thêm!</Text>
            </>
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={s.addBtnText}>{inStock ? 'Thêm vào giỏ' : 'Hết hàng'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  imgContainer: { width: W, height: IMG_H, backgroundColor: '#E5F9FA' },
  img: { width: '100%', height: '100%' },
  imgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  thumbnails: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  thumb: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  thumbActive: { backgroundColor: '#fff', width: 20 },

  infoCard: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    padding: 24,
    paddingBottom: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  productName: { fontSize: 22, fontWeight: '700', color: C.text, lineHeight: 30, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  price: { fontSize: 24, fontWeight: '800', color: C.primary },
  originalPrice: { fontSize: 16, color: C.muted, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '700', color: C.text, marginLeft: 4 },
  reviewCount: { fontSize: 13, color: C.muted },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, fontWeight: '600' },
  descSection: { gap: 8 },
  descTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  desc: { fontSize: 14, color: C.muted, lineHeight: 22 },
  relatedSection: { marginTop: 24 },
  relatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  relatedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  relatedTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },
  relatedScroll: { gap: 12, paddingBottom: 4 },
  relatedCard: { width: 150 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  qtyBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  qtyBtnDim: { opacity: 0.4 },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    paddingHorizontal: 4,
    minWidth: 28,
    textAlign: 'center',
  },
  addBtn: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  addBtnDim: { opacity: 0.65 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
