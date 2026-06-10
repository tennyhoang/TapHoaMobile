import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { useProducts, useAddToCart } from '@/lib/hooks';
import { useCategories } from '@/lib/hooks';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useLayout } from '@/lib/layout';
import type { Product } from '@/types';
import { C } from '@/constants/Colors';
import EmptyState from '@/components/EmptyState';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng' },
  { value: 'price_desc', label: 'Giá giảm' },
  { value: 'rating', label: 'Đánh giá' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductsScreen() {
  const { top } = useSafeAreaInsets();
  const { productColumns, cardGap } = useLayout();
  const { show } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [isNew, setIsNew] = useState(false);
  const [isDiscount, setIsDiscount] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const { data: categories } = useCategories();
  const {
    data: productsData,
    isLoading,
    isFetching,
    refetch,
    isRefetching,
  } = useProducts({
    search: debouncedSearch || undefined,
    categoryId: selectedCat ?? undefined,
    sortBy,
    pageSize: 20,
    isNew: isNew || undefined,
    isDiscount: isDiscount || undefined,
  });

  const products = productsData?.items ?? [];

  const { mutateAsync: addToCart } = useAddToCart();

  const handleLoadMore = () => {
    if (loadingMore || isFetching) return;
    setLoadingMore(true);
    refetch().finally(() => setLoadingMore(false));
  };

  const handleAddToCart = useCallback(
    async (product: Product) => {
      try {
        await addToCart({ productId: product.id, quantity: 1 });
        show(`Đã thêm "${product.name}" vào giỏ`);
      } catch {
        show('Không thể thêm vào giỏ hàng', 'error');
      }
    },
    [addToCart, show]
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} onAddToCart={handleAddToCart} />,
    [handleAddToCart]
  );

  return (
    <KeyboardAwareScreen style={s.root} noDismiss>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* Header */}
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <View style={s.blob} />
        <Text style={s.headerTitle}>Sản phẩm</Text>
        <View style={s.searchRow}>
          <Ionicons name="search-outline" size={18} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
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
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories + Sort */}
      <View style={s.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catScroll}
        >
          <TouchableOpacity
            style={[s.chip, !selectedCat && s.chipActive]}
            onPress={() => setSelectedCat(null)}
            accessibilityRole="button"
            accessibilityLabel="Tất cả danh mục"
          >
            <Text style={[s.chipText, !selectedCat && s.chipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {(categories ?? []).map(c => (
            <TouchableOpacity
              key={c.id}
              style={[s.chip, selectedCat === c.id && s.chipActive]}
              onPress={() => setSelectedCat(c.id)}
              accessibilityRole="button"
              accessibilityLabel={c.name}
            >
              <Text style={[s.chipText, selectedCat === c.id && s.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.sortScroll}
        >
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.sortChip, sortBy === opt.value && s.sortChipActive]}
              onPress={() => setSortBy(opt.value)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text style={[s.sortText, sortBy === opt.value && s.sortTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={s.divider} />
          <TouchableOpacity
            style={[s.tagChip, isNew && s.tagChipNew]}
            onPress={() => {
              setIsNew(v => !v);
              setIsDiscount(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Lọc sản phẩm mới"
          >
            <Ionicons name="sparkles-outline" size={12} color={isNew ? '#fff' : '#8B5CF6'} />
            <Text style={[s.tagText, isNew && s.tagTextActive]}>Mới</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tagChip, isDiscount && s.tagChipSale]}
            onPress={() => {
              setIsDiscount(v => !v);
              setIsNew(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Lọc sản phẩm giảm giá"
          >
            <Ionicons name="pricetag-outline" size={12} color={isDiscount ? '#fff' : '#EF4444'} />
            <Text style={[s.tagText, isDiscount && s.tagTextActive]}>Giảm giá</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Products Grid */}
      {isLoading ? (
        <View style={[s.grid, { gap: cardGap }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ flex: 1, maxWidth: productColumns > 1 ? '50%' : '100%' }}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Không tìm thấy sản phẩm"
          subtitle="Thử thay đổi bộ lọc hoặc từ khóa"
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          numColumns={productColumns}
          key={productColumns}
          contentContainerStyle={[s.grid, { gap: cardGap }]}
          columnWrapperStyle={{ gap: cardGap }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={renderItem}
          ListFooterComponent={
            loadingMore ? (
              <View style={s.loadMoreWrap}>
                <ActivityIndicator color={C.primary} size="small" />
              </View>
            ) : null
          }
          windowSize={5}
          maxToRenderPerBatch={10}
        />
      )}
    </KeyboardAwareScreen>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.primaryDark,
    overflow: 'hidden',
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },

  filterBar: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  catScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  sortScroll: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: C.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  sortChipActive: { backgroundColor: '#E5F9FA' },
  sortText: { fontSize: 12, color: C.muted, fontWeight: '500' },
  sortTextActive: { color: C.primary, fontWeight: '700' },

  divider: { width: 1, backgroundColor: C.border, marginHorizontal: 4, marginVertical: 2 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    backgroundColor: '#F5F3FF',
  },
  tagChipNew: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  tagChipSale: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  tagText: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  tagTextActive: { color: '#fff' },

  grid: { padding: 16, paddingBottom: 32 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadMoreWrap: { padding: 20, alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  emptyText: { fontSize: 13, color: C.muted },
});
