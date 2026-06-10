import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { useToast } from '@/components/Toast';
import { warehouseManagerService } from '@/services/warehouse-manager.service';
import { formatCurrency } from '@/lib/utils';
import type { WarehouseInventoryItem, PagedResult } from '@/types';

const C = {
  primary: '#0891B2',
  primaryDark: '#0E7490',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F0F9FF',
  card: '#FFFFFF',
  border: '#E0F2FE',
};

type FilterType = '' | 'low' | 'out';

function AdjustModal({
  item,
  onClose,
  onSave,
  saving,
}: {
  item: WarehouseInventoryItem;
  onClose: () => void;
  onSave: (delta: number, reason: string) => void;
  saving: boolean;
}) {
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'+' | '-'>('+');

  const parsedDelta = parseInt(delta, 10);
  const finalDelta =
    isNaN(parsedDelta) || parsedDelta <= 0 ? 0 : mode === '-' ? -parsedDelta : parsedDelta;
  const newStock = item.stock + finalDelta;
  const valid = finalDelta !== 0 && newStock >= 0;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <KeyboardAwareScreen style={a.overlay}>
        <View style={a.sheet}>
          <View style={a.sheetHeader}>
            <Text style={a.sheetTitle}>Điều chỉnh tồn kho</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          <Text style={a.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={a.currentStock}>
            Tồn hiện tại: <Text style={a.stockBold}>{item.stock}</Text>
          </Text>

          <View style={a.modeRow}>
            <TouchableOpacity
              style={[a.modeBtn, mode === '+' && a.modeBtnActive]}
              onPress={() => setMode('+')}
            >
              <Ionicons name="add" size={18} color={mode === '+' ? '#fff' : C.primary} />
              <Text style={[a.modeBtnText, mode === '+' && a.modeBtnActiveText]}>Nhập thêm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                a.modeBtn,
                mode === '-' && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
              ]}
              onPress={() => setMode('-')}
            >
              <Ionicons name="remove" size={18} color={mode === '-' ? '#fff' : '#EF4444'} />
              <Text style={[a.modeBtnText, mode === '-' && { color: '#fff' }]}>Xuất bớt</Text>
            </TouchableOpacity>
          </View>

          <Text style={a.fieldLabel}>Số lượng</Text>
          <TextInput
            style={a.input}
            value={delta}
            onChangeText={setDelta}
            keyboardType="numeric"
            placeholder="Nhập số lượng..."
            placeholderTextColor="#9CA3AF"
          />

          {delta !== '' && !isNaN(parsedDelta) && parsedDelta > 0 && (
            <Text style={[a.previewText, newStock < 0 && { color: '#EF4444' }]}>
              Sau điều chỉnh: {item.stock} {mode} {parsedDelta} ={' '}
              <Text style={a.previewBold}>{newStock}</Text>
            </Text>
          )}

          <Text style={a.fieldLabel}>Lý do (không bắt buộc)</Text>
          <TextInput
            style={[a.input, { height: 72 }]}
            value={reason}
            onChangeText={setReason}
            placeholder="VD: Nhập hàng từ nhà cung cấp, kiểm kê, hỏng hàng..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[a.saveBtn, !valid && a.saveBtnDisabled]}
            onPress={() => onSave(finalDelta, reason)}
            disabled={!valid || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={a.saveBtnText}>Lưu điều chỉnh</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScreen>
    </Modal>
  );
}

export default function WarehouseInventoryScreen() {
  const { top } = useSafeAreaInsets();
  const { filter: initialFilter } = useLocalSearchParams<{ filter?: string }>();
  const unauthorized = useRoleGuard('WarehouseManager');
  const { show } = useToast();

  const [filter, setFilter] = useState<FilterType>((initialFilter as FilterType) || '');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<WarehouseInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [adjustTarget, setAdjustTarget] = useState<WarehouseInventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (p: number, reset = false, s = search, f: FilterType = filter) => {
      try {
        const res: PagedResult<WarehouseInventoryItem> = await warehouseManagerService.getInventory(
          {
            search: s || undefined,
            filter: f || undefined,
            page: p,
            pageSize: 30,
          }
        );
        setItems(prev => (reset ? res.items : [...prev, ...res.items]));
        setHasMore(p < res.totalPages);
        setPage(p);
      } catch {
        if (reset) show('Không tải được tồn kho', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [search, filter, show]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(1, true);
    }, [load])
  );

  const onSearch = () => {
    setSearch(searchInput);
    setLoading(true);
    load(1, true, searchInput, filter);
  };

  const onFilterChange = (f: FilterType) => {
    setFilter(f);
    setLoading(true);
    load(1, true, search, f);
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  const handleAdjust = async (delta: number, reason: string) => {
    if (!adjustTarget) return;
    setSaving(true);
    try {
      const res = await warehouseManagerService.adjustStock(
        adjustTarget.id,
        delta,
        reason || undefined
      );
      setItems(prev =>
        prev.map(i =>
          i.id === res.id
            ? { ...i, stock: res.stock, isLowStock: res.stock < 10, isOutOfStock: res.stock === 0 }
            : i
        )
      );
      setAdjustTarget(null);
      show(`Đã cập nhật tồn kho: ${res.stock}`, 'success');
    } catch {
      show('Điều chỉnh thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (unauthorized) return null;

  const renderItem = ({ item }: { item: WarehouseInventoryItem }) => (
    <TouchableOpacity
      style={[
        s.card,
        item.isOutOfStock && s.cardOutOfStock,
        item.isLowStock && !item.isOutOfStock && s.cardLowStock,
      ]}
      onPress={() => setAdjustTarget(item)}
      activeOpacity={0.8}
    >
      <View style={s.stockBadge}>
        <Text
          style={[
            s.stockNum,
            item.isOutOfStock
              ? { color: '#EF4444' }
              : item.isLowStock
                ? { color: '#F59E0B' }
                : { color: '#10B981' },
          ]}
        >
          {item.stock}
        </Text>
        <Text style={s.stockUnit}>sp</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={s.category}>{item.categoryName}</Text>
        <Text style={s.price}>{formatCurrency(item.price)}</Text>
      </View>
      {item.isOutOfStock ? (
        <View style={s.tagOut}>
          <Text style={s.tagOutText}>Hết hàng</Text>
        </View>
      ) : item.isLowStock ? (
        <View style={s.tagLow}>
          <Text style={s.tagLowText}>Sắp hết</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tồn kho</Text>
      </View>

      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={18} color={C.muted} />
        <TextInput
          style={s.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Tìm sản phẩm..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        {searchInput !== '' && (
          <TouchableOpacity
            onPress={() => {
              setSearchInput('');
              setSearch('');
              setLoading(true);
              load(1, true, '', filter);
            }}
          >
            <Ionicons name="close-circle" size={18} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.filterRow}>
        {(
          [
            ['', 'Tất cả'],
            ['low', 'Sắp hết'],
            ['out', 'Hết hàng'],
          ] as [FilterType, string][]
        ).map(([f, label]) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => onFilterChange(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          onEndReached={() => {
            if (!hasMore || loadingMore) return;
            setLoadingMore(true);
            load(page + 1);
          }}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="layers-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyText}>Không có sản phẩm nào</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ padding: 16 }} /> : null
          }
        />
      )}

      {adjustTarget && (
        <AdjustModal
          item={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSave={handleAdjust}
          saving={saving}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.primaryDark,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: { backgroundColor: C.primary },
  filterText: { fontSize: 13, color: C.muted },
  filterTextActive: { color: '#fff', fontWeight: '700' },

  list: { padding: 12, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  cardLowStock: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  cardOutOfStock: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },

  stockBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockNum: { fontSize: 18, fontWeight: '800' },
  stockUnit: { fontSize: 10, color: C.muted },
  itemName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  category: { fontSize: 12, color: C.muted, marginBottom: 2 },
  price: { fontSize: 12, color: C.primary, fontWeight: '600' },

  tagOut: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#FEE2E2' },
  tagOutText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  tagLow: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#FEF3C7' },
  tagLowText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted },
});

const a = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  productName: { fontSize: 15, fontWeight: '600', color: C.text },
  currentStock: { fontSize: 13, color: C.muted },
  stockBold: { fontWeight: '700', color: C.text },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: C.primary,
    borderRadius: 12,
    padding: 10,
  },
  modeBtnActive: { backgroundColor: C.primary },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
  modeBtnActiveText: { color: '#fff' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.muted },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.text,
  },
  previewText: { fontSize: 13, color: C.muted },
  previewBold: { fontWeight: '700', color: C.text },

  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
