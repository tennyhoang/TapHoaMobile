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
  Modal,
  Pressable,
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
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao' },
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
  const [sortModalVisible, setSortModalVisible] = useState(false);

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

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sắp xếp';
  const activeFilterCount = (isNew ? 1 : 0) + (isDiscount ? 1 : 0);

  return (
    <KeyboardAwareScreen style={s.root} noDismiss>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FAFA" />

      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: top + 12 }]}>
        <Text style={s.headerTitle}>Sản phẩm</Text>

        {/* Search + sort row */}
        <View style={s.filterCard}>
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

          <View style={s.filterDivider} />

          <TouchableOpacity
            style={s.sortBtn}
            onPress={() => setSortModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sắp xếp: ${currentSortLabel}`}
          >
            <Ionicons name="funnel-outline" size={15} color={C.primary} />
            <Text style={s.sortBtnText} numberOfLines={1}>
              {currentSortLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CATEGORY CHIPS + QUICK FILTERS ── */}
      <View style={s.chipsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsScroll}
        >
          {/* All */}
          <TouchableOpacity
            style={[s.chip, !selectedCat && s.chipActive]}
            onPress={() => setSelectedCat(null)}
            accessibilityRole="button"
            accessibilityLabel="Tất cả danh mục"
            accessibilityState={{ selected: !selectedCat }}
          >
            <Text style={[s.chipText, !selectedCat && s.chipTextActive]}>Tất cả</Text>
          </TouchableOpacity>

          {/* Category chips */}
          {(categories ?? []).map(c => (
            <TouchableOpacity
              key={c.id}
              style={[s.chip, selectedCat === c.id && s.chipActive]}
              onPress={() => setSelectedCat(c.id)}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              accessibilityState={{ selected: selectedCat === c.id }}
            >
              <Text style={[s.chipText, selectedCat === c.id && s.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={s.chipDivider} />

          {/* New tag */}
          <TouchableOpacity
            style={[s.tagChip, isNew && s.tagChipActive]}
            onPress={() => {
              setIsNew(v => !v);
              setIsDiscount(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Lọc sản phẩm mới"
            accessibilityState={{ selected: isNew }}
          >
            <Ionicons name="sparkles-outline" size={12} color={isNew ? '#fff' : '#8B5CF6'} />
            <Text style={[s.tagText, isNew && s.tagTextActive]}>Mới</Text>
          </TouchableOpacity>

          {/* Discount tag */}
          <TouchableOpacity
            style={[s.tagChip, s.tagChipSaleBase, isDiscount && s.tagChipSaleActive]}
            onPress={() => {
              setIsDiscount(v => !v);
              setIsNew(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Lọc sản phẩm giảm giá"
            accessibilityState={{ selected: isDiscount }}
          >
            <Ionicons name="pricetag-outline" size={12} color={isDiscount ? '#fff' : '#EF4444'} />
            <Text style={[s.tagText, s.tagTextSale, isDiscount && s.tagTextActive]}>Giảm giá</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Active filter count badge */}
        {activeFilterCount > 0 && (
          <View style={s.filterBadge}>
            <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </View>

      {/* ── PRODUCTS GRID ── */}
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

      {/* ── SORT MODAL ── */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setSortModalVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Đóng"
        >
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Sắp xếp theo</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.modalOption, sortBy === opt.value && s.modalOptionActive]}
                onPress={() => {
                  setSortBy(opt.value);
                  setSortModalVisible(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: sortBy === opt.value }}
                accessibilityLabel={opt.label}
              >
                <Text style={[s.modalOptionText, sortBy === opt.value && s.modalOptionTextActive]}>
                  {opt.label}
                </Text>
                {sortBy === opt.value && <Ionicons name="checkmark" size={18} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAwareScreen>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FAFA' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#F0FAFA',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
  },

  // Filter card: search + sort inline
  filterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 46,
    maxWidth: 130,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
    flexShrink: 1,
  },

  // ── Category chip bar ─────────────────────────────────────────────────────
  chipsBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
  },
  chipTextActive: {
    color: '#fff',
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginHorizontal: 4,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    backgroundColor: '#F5F3FF',
  },
  tagChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  tagChipSaleBase: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  tagChipSaleActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  tagTextSale: {
    color: '#EF4444',
  },
  tagTextActive: {
    color: '#fff',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },

  // ── Product grid ──────────────────────────────────────────────────────────
  grid: { padding: 16, paddingBottom: 32 },
  loadMoreWrap: { padding: 20, alignItems: 'center' },

  // ── Sort modal ────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  modalOptionActive: {
    backgroundColor: '#F0FAFA',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: C.primary,
  },
});
