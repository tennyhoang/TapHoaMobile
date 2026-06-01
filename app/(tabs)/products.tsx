import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';
import { cartService } from '@/services/cart.service';
import ProductCard from '@/components/ProductCard';
import { useToast } from '@/components/Toast';
import type { Product, Category } from '@/types';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng' },
  { value: 'price_desc', label: 'Giá giảm' },
  { value: 'rating', label: 'Đánh giá' },
];

export default function ProductsScreen() {
  const { show } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [isNew, setIsNew] = useState(false);
  const [isDiscount, setIsDiscount] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    categoriesService
      .getAll()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(
    async (p: number, reset = false) => {
      try {
        const res = await productsService.getAll({
          search: search || undefined,
          categoryId: selectedCat ?? undefined,
          sortBy,
          page: p,
          pageSize: 20,
          isNew: isNew || undefined,
          isDiscount: isDiscount || undefined,
        });
        setProducts(prev => (reset ? res.items : [...prev, ...res.items]));
        setTotalPages(res.totalPages);
        setPage(p);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [search, selectedCat, sortBy, isNew, isDiscount]
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchProducts(1, true);
  }, [selectedCat, sortBy, isNew, isDiscount]);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setLoading(true);
      fetchProducts(1, true);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchProducts(page + 1);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await cartService.add(product.id, 1);
      show(`Đã thêm "${product.name}" vào giỏ`);
    } catch {
      show('Không thể thêm vào giỏ hàng', 'error');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, true);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* Header */}
      <View style={s.header}>
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
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
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
          >
            <Text style={[s.chipText, !selectedCat && s.chipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[s.chip, selectedCat === c.id && s.chipActive]}
              onPress={() => setSelectedCat(c.id)}
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
          >
            <Ionicons name="pricetag-outline" size={12} color={isDiscount ? '#fff' : '#EF4444'} />
            <Text style={[s.tagText, isDiscount && s.tagTextActive]}>Giảm giá</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="search-outline" size={48} color={C.muted} />
          <Text style={s.emptyTitle}>Không tìm thấy sản phẩm</Text>
          <Text style={s.emptyText}>Thử thay đổi bộ lọc hoặc từ khóa</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => <ProductCard product={item} onAddToCart={handleAddToCart} />}
          ListFooterComponent={
            loadingMore ? (
              <View style={s.loadMoreWrap}>
                <ActivityIndicator color={C.primary} size="small" />
              </View>
            ) : null
          }
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
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
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
