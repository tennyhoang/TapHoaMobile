import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/lib/layout';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';
import { cartService } from '@/services/cart.service';
import { storage } from '@/lib/storage';
import ProductCard from '@/components/ProductCard';
import { C } from '@/constants/Colors';
import type { Product, Category } from '@/types';

const HISTORY_KEY = 'taphoa_search_history';
const MAX_HISTORY = 10;

async function loadHistory(): Promise<string[]> {
  try {
    const raw = await storage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveHistory(query: string, current: string[]): Promise<string[]> {
  const filtered = current.filter(h => h.toLowerCase() !== query.toLowerCase());
  const next = [query, ...filtered].slice(0, MAX_HISTORY);
  await storage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

const SORT_OPTIONS = [
  { label: 'Mặc định', value: '' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Đánh giá cao', value: 'rating' },
];

export default function SearchScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { productColumns, cardGap } = useLayout();
  const { q } = useLocalSearchParams<{ q: string }>();
  const [search, setSearch] = useState(q ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isDiscount, setIsDiscount] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Pending filter state (inside modal before Apply)
  const [pendingSort, setPendingSort] = useState('');
  const [pendingCategory, setPendingCategory] = useState('');
  const [pendingDiscount, setPendingDiscount] = useState(false);

  const activeFilterCount = (sortBy ? 1 : 0) + (categoryId ? 1 : 0) + (isDiscount ? 1 : 0);

  const fetchProducts = useCallback(
    async (
      query: string,
      p: number,
      reset = false,
      filters?: { sortBy: string; categoryId: string; isDiscount: boolean }
    ) => {
      if (!query.trim()) {
        setProducts([]);
        return;
      }
      const f = filters ?? { sortBy, categoryId, isDiscount };
      try {
        const res = await productsService.getAll({
          search: query,
          page: p,
          pageSize: 20,
          sortBy: f.sortBy || undefined,
          categoryId: f.categoryId || undefined,
          isDiscount: f.isDiscount || undefined,
        });
        setProducts(prev => (reset ? (res.items ?? []) : [...prev, ...(res.items ?? [])]));
        setTotalPages(res.totalPages);
        setPage(p);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sortBy, categoryId, isDiscount]
  );

  useEffect(() => {
    loadHistory().then(setHistory);
    categoriesService
      .getAll()
      .then(setCategories)
      .catch(() => console.warn('Failed to load categories'));
    if (q?.trim()) {
      setLoading(true);
      fetchProducts(q, 1, true);
    }
    setTimeout(() => inputRef.current?.focus(), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setLoading(!!search.trim());
      setPage(1);
      fetchProducts(search, 1, true);
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [search, fetchProducts]);

  const openFilter = () => {
    setPendingSort(sortBy);
    setPendingCategory(categoryId);
    setPendingDiscount(isDiscount);
    setShowFilter(true);
  };

  const applyFilter = () => {
    setSortBy(pendingSort);
    setCategoryId(pendingCategory);
    setIsDiscount(pendingDiscount);
    setShowFilter(false);
    if (search.trim()) {
      setLoading(true);
      fetchProducts(search, 1, true, {
        sortBy: pendingSort,
        categoryId: pendingCategory,
        isDiscount: pendingDiscount,
      });
    }
  };

  const resetFilter = () => {
    setPendingSort('');
    setPendingCategory('');
    setPendingDiscount(false);
  };

  const commitSearch = async (query: string) => {
    if (!query.trim()) return;
    const next = await saveHistory(query.trim(), history);
    setHistory(next);
  };

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchProducts(search, page + 1);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await cartService.add(product.id, 1);
    } catch {
      console.warn('Failed to add to cart');
    }
  };

  const clearHistory = () => {
    setHistory([]);
    storage.setItem(HISTORY_KEY, JSON.stringify([])).catch(console.warn);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.searchRow}>
          <Ionicons name="search-outline" size={18} color={C.muted} />
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Tìm thực phẩm tươi ngon..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={() => commitSearch(search)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.filterBtn} onPress={openFilter} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={20} color="#fff" />
          {activeFilterCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {search.trim() && activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
        >
          {sortBy ? (
            <View style={s.chip}>
              <Text style={s.chipText}>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSortBy('');
                  if (search.trim()) {
                    setLoading(true);
                    fetchProducts(search, 1, true, { sortBy: '', categoryId, isDiscount });
                  }
                }}
              >
                <Ionicons name="close" size={13} color={C.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
          {categoryId ? (
            <View style={s.chip}>
              <Text style={s.chipText}>
                {categories.find(c => c.id === categoryId)?.name ?? 'Danh mục'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCategoryId('');
                  if (search.trim()) {
                    setLoading(true);
                    fetchProducts(search, 1, true, { sortBy, categoryId: '', isDiscount });
                  }
                }}
              >
                <Ionicons name="close" size={13} color={C.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
          {isDiscount ? (
            <View style={s.chip}>
              <Text style={s.chipText}>Đang giảm giá</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsDiscount(false);
                  if (search.trim()) {
                    setLoading(true);
                    fetchProducts(search, 1, true, { sortBy, categoryId, isDiscount: false });
                  }
                }}
              >
                <Ionicons name="close" size={13} color={C.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      )}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : !search.trim() ? (
        <ScrollView style={s.historyWrap} contentContainerStyle={s.historyContent}>
          {history.length > 0 && (
            <>
              <View style={s.historyHeader}>
                <Text style={s.historyTitle}>Tìm kiếm gần đây</Text>
                <TouchableOpacity onPress={clearHistory} activeOpacity={0.7}>
                  <Text style={s.historyClear}>Xoá tất cả</Text>
                </TouchableOpacity>
              </View>
              {history.map(h => (
                <TouchableOpacity
                  key={h}
                  style={s.historyItem}
                  onPress={() => setSearch(h)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={16} color={C.muted} />
                  <Text style={s.historyText}>{h}</Text>
                  <Ionicons
                    name="arrow-up-outline"
                    style={s.historyArrow}
                    size={14}
                    color={C.muted}
                  />
                </TouchableOpacity>
              ))}
            </>
          )}
          {history.length === 0 && (
            <View style={s.center}>
              <Ionicons name="search-outline" size={52} color="#D1D5DB" />
              <Text style={s.hint}>Nhập tên sản phẩm để tìm kiếm</Text>
            </View>
          )}
        </ScrollView>
      ) : products.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="leaf-outline" size={52} color="#D1D5DB" />
          <Text style={s.hint}>Không tìm thấy "{search}"</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          numColumns={productColumns}
          key={productColumns}
          contentContainerStyle={[s.grid, { gap: cardGap }]}
          columnWrapperStyle={{ gap: cardGap }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => <ProductCard product={item} onAddToCart={handleAddToCart} />}
          ListHeaderComponent={
            <Text style={s.resultCount}>
              {products.length} kết quả cho "{search}"
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={s.loadMore}>
                <ActivityIndicator color={C.primary} size="small" />
              </View>
            ) : null
          }
        />
      )}

      {/* Filter bottom sheet */}
      <Modal
        visible={showFilter}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={s.overlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowFilter(false)} />
          <View style={[s.sheet, { paddingBottom: bottom + 24 }]}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Lọc & Sắp xếp</Text>
              <TouchableOpacity onPress={resetFilter} activeOpacity={0.7}>
                <Text style={s.resetText}>Đặt lại</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort */}
              <Text style={s.filterLabel}>Sắp xếp theo</Text>
              <View style={s.sortGrid}>
                {SORT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.sortChip, pendingSort === opt.value && s.sortChipActive]}
                    onPress={() => setPendingSort(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[s.sortChipText, pendingSort === opt.value && s.sortChipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Discount */}
              <View style={s.discountRow}>
                <View>
                  <Text style={s.filterLabel}>Đang giảm giá</Text>
                  <Text style={s.filterSub}>Chỉ hiện sản phẩm đang sale</Text>
                </View>
                <Switch
                  value={pendingDiscount}
                  onValueChange={setPendingDiscount}
                  trackColor={{ true: C.primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* Category */}
              {categories.length > 0 && (
                <>
                  <Text style={[s.filterLabel, { marginTop: 4 }]}>Danh mục</Text>
                  <TouchableOpacity
                    style={[s.catRow, pendingCategory === '' && s.catRowActive]}
                    onPress={() => setPendingCategory('')}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.catText, pendingCategory === '' && s.catTextActive]}>
                      Tất cả
                    </Text>
                    {pendingCategory === '' && (
                      <Ionicons name="checkmark" size={16} color={C.primary} />
                    )}
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catRow, pendingCategory === cat.id && s.catRowActive]}
                      onPress={() => setPendingCategory(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.catText, pendingCategory === cat.id && s.catTextActive]}>
                        {cat.name}
                      </Text>
                      {pendingCategory === cat.id && (
                        <Ionicons name="checkmark" size={16} color={C.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={s.applyBtn} onPress={applyFilter} activeOpacity={0.85}>
              <Text style={s.applyBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.primaryDark,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  input: { flex: 1, fontSize: 14, color: C.text },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  chipRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.primary + '44',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: C.primary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { fontSize: 14, color: C.muted, textAlign: 'center' },
  historyWrap: { flex: 1 },
  historyContent: { padding: 16 },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  historyClear: { fontSize: 13, color: C.primary, fontWeight: '600' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  historyText: { flex: 1, fontSize: 14, color: C.text },
  historyArrow: { transform: [{ rotate: '45deg' }] },
  grid: { padding: 16, paddingBottom: 32 },
  resultCount: { fontSize: 13, color: C.muted, marginBottom: 12 },
  loadMore: { padding: 20, alignItems: 'center' },

  // Filter sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  resetText: { fontSize: 14, fontWeight: '600', color: C.primary },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  filterSub: { fontSize: 12, color: C.muted, marginTop: 2 },

  sortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  sortChipActive: { borderColor: C.primary, backgroundColor: '#E5F9FA' },
  sortChipText: { fontSize: 13, fontWeight: '500', color: C.muted },
  sortChipTextActive: { color: C.primary, fontWeight: '700' },

  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  catRowActive: { backgroundColor: '#F0FDFA', borderRadius: 8, paddingHorizontal: 8 },
  catText: { fontSize: 14, color: C.text },
  catTextActive: { color: C.primary, fontWeight: '700' },

  applyBtn: {
    height: 50,
    backgroundColor: C.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
