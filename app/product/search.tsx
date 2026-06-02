import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/lib/layout';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsService } from '@/services/products.service';
import { cartService } from '@/services/cart.service';
import { storage } from '@/lib/storage';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';

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

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
};

export default function SearchScreen() {
  const { top } = useSafeAreaInsets();
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

  const fetchProducts = async (query: string, p: number, reset = false) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    try {
      const res = await productsService.getAll({ search: query, page: p, pageSize: 20 });
      setProducts(prev => (reset ? (res.items ?? []) : [...prev, ...(res.items ?? [])]));
      setTotalPages(res.totalPages);
      setPage(p);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadHistory().then(setHistory);
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
      /* silent */
    }
  };

  const clearHistory = async () => {
    await storage.setItem(HISTORY_KEY, JSON.stringify([]));
    setHistory([]);
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
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : !search.trim() ? (
        // ── SEARCH HISTORY ──
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
  row: { justifyContent: 'space-between', marginBottom: 12 },
  resultCount: { fontSize: 13, color: C.muted, marginBottom: 12 },
  loadMore: { padding: 20, alignItems: 'center' },
});
