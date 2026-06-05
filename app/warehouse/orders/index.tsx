import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { useToast } from '@/components/Toast';
import { warehouseManagerService } from '@/services/warehouse-manager.service';
import { formatCurrency } from '@/lib/utils';
import type { WarehouseOrder, PagedResult } from '@/types';

const C = {
  primary: '#0891B2',
  primaryDark: '#0E7490',
  primaryLight: '#E0F2FE',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F0F9FF',
  card: '#FFFFFF',
  border: '#E0F2FE',
};

type StatusFilter = 'pending' | 'packed' | 'shipping';

const STATUS_LABELS: Record<StatusFilter, { label: string; color: string }> = {
  pending: { label: 'Chờ đóng gói', color: '#F59E0B' },
  packed: { label: 'Đã đóng gói', color: '#10B981' },
  shipping: { label: 'Đang giao', color: C.primary },
};

function OrderDetailModal({
  order,
  onClose,
  onPack,
  packing,
}: {
  order: WarehouseOrder;
  onClose: () => void;
  onPack: (id: string) => void;
  packing: boolean;
}) {
  const total = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={m.root}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose} style={m.closeBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={m.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={m.body} showsVerticalScrollIndicator={false}>
          <View style={m.infoCard}>
            <Row label="Mã đơn" value={`...${order.id.slice(-8).toUpperCase()}`} />
            <Row label="Khách hàng" value={order.customer.fullName} />
            {order.customer.phoneNumber && <Row label="SĐT" value={order.customer.phoneNumber} />}
            <Row label="Hub nhận" value={order.hub.name} />
            <Row label="Địa chỉ Hub" value={order.hub.address} />
            {order.note && <Row label="Ghi chú" value={order.note} />}
          </View>

          <Text style={m.sectionTitle}>Danh sách sản phẩm ({order.items.length})</Text>
          <View style={m.itemsCard}>
            {order.items.map((item, i) => (
              <View
                key={item.productId}
                style={[m.item, i < order.items.length - 1 && m.itemBorder]}
              >
                <View style={m.itemQtyBadge}>
                  <Text style={m.itemQtyText}>x{item.quantity}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={m.itemName}>{item.name}</Text>
                  <Text style={m.itemPrice}>{formatCurrency(item.unitPrice)}/cái</Text>
                </View>
                <Text style={m.itemSubtotal}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
              </View>
            ))}
          </View>

          <View style={m.totalRow}>
            <Text style={m.totalLabel}>Tổng cộng</Text>
            <Text style={m.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </ScrollView>

        {order.status === 'Paid_WaitingForBatch' && (
          <View style={m.footer}>
            <TouchableOpacity
              style={[m.packBtn, packing && m.packBtnDisabled]}
              onPress={() => onPack(order.id)}
              disabled={packing}
              activeOpacity={0.85}
            >
              {packing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                  <Text style={m.packBtnText}>Xác nhận đã đóng gói</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={m.row}>
      <Text style={m.rowLabel}>{label}</Text>
      <Text style={m.rowValue}>{value}</Text>
    </View>
  );
}

export default function WarehouseOrdersScreen() {
  const { top } = useSafeAreaInsets();
  const { status: initialStatus } = useLocalSearchParams<{ status?: string }>();
  const unauthorized = useRoleGuard('WarehouseManager');
  const { show } = useToast();

  const [filter, setFilter] = useState<StatusFilter>((initialStatus as StatusFilter) || 'pending');
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState<WarehouseOrder | null>(null);
  const [packingId, setPackingId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchPacking, setBatchPacking] = useState(false);

  const load = useCallback(
    async (p: number, reset = false, f = filter) => {
      try {
        const res: PagedResult<WarehouseOrder> = await warehouseManagerService.getOrders({
          status: f,
          page: p,
          pageSize: 20,
        });
        setOrders(prev => (reset ? res.items : [...prev, ...res.items]));
        setHasMore(p < res.totalPages);
        setPage(p);
      } catch {
        if (reset) show('Không tải được danh sách đơn', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter, show]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setSelectMode(false);
      setSelectedIds(new Set());
      load(1, true);
    }, [load])
  );

  const onFilterChange = (f: StatusFilter) => {
    setFilter(f);
    setSelectMode(false);
    setSelectedIds(new Set());
    setLoading(true);
    load(1, true, f);
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    load(page + 1);
  };

  const handlePack = async (id: string) => {
    setPackingId(id);
    try {
      await warehouseManagerService.packOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelected(null);
      show('Đã xác nhận đóng gói!', 'success');
    } catch {
      show('Không thể đóng gói đơn hàng', 'error');
    } finally {
      setPackingId(null);
    }
  };

  const handleBatchPack = async () => {
    if (selectedIds.size === 0) return;
    Alert.alert('Xác nhận đóng gói', `Xác nhận đã đóng gói ${selectedIds.size} đơn hàng?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          setBatchPacking(true);
          try {
            const res = await warehouseManagerService.packBatch([...selectedIds]);
            setOrders(prev => prev.filter(o => !selectedIds.has(o.id)));
            setSelectedIds(new Set());
            setSelectMode(false);
            show(`Đã đóng gói ${res.packed} đơn`, 'success');
            if (res.errors.length > 0) show(`${res.errors.length} đơn lỗi`, 'error');
          } catch {
            show('Đóng gói thất bại', 'error');
          } finally {
            setBatchPacking(false);
          }
        },
      },
    ]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (unauthorized) return null;

  const renderItem = ({ item }: { item: WarehouseOrder }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[s.card, isSelected && s.cardSelected]}
        onPress={() => (selectMode ? toggleSelect(item.id) : setSelected(item))}
        onLongPress={() => {
          if (filter === 'pending') {
            setSelectMode(true);
            toggleSelect(item.id);
          }
        }}
        activeOpacity={0.8}
      >
        {selectMode && (
          <View style={[s.checkbox, isSelected && s.checkboxChecked]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={s.cardTop}>
            <Text style={s.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
            <Text style={s.amount}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <Text style={s.customerName}>{item.customer.fullName}</Text>
          <Text style={s.hubName} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={C.muted} /> {item.hub.name}
          </Text>
          <View style={s.cardBottom}>
            <Text style={s.itemCount}>{item.items.length} sản phẩm</Text>
            <Text style={s.time}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        {!selectMode && <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Đơn hàng tại kho</Text>
        {filter === 'pending' && (
          <TouchableOpacity
            style={s.selectBtn}
            onPress={() => {
              setSelectMode(!selectMode);
              setSelectedIds(new Set());
            }}
          >
            <Text style={s.selectBtnText}>{selectMode ? 'Hủy' : 'Chọn'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.filterRow}>
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && { backgroundColor: STATUS_LABELS[f].color }]}
            onPress={() => onFilterChange(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterText, filter === f && { color: '#fff', fontWeight: '700' }]}>
              {STATUS_LABELS[f].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectMode && selectedIds.size > 0 && (
        <TouchableOpacity
          style={s.batchBar}
          onPress={handleBatchPack}
          disabled={batchPacking}
          activeOpacity={0.85}
        >
          {batchPacking ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
              <Text style={s.batchBarText}>Đóng gói {selectedIds.size} đơn đã chọn</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyText}>Không có đơn nào</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ padding: 16 }} /> : null
          }
        />
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onPack={handlePack}
          packing={packingId === selected.id}
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
  selectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  selectBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterText: { fontSize: 13, color: C.muted },

  batchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    padding: 14,
    margin: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  batchBarText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  list: { padding: 12, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  cardSelected: { borderColor: C.primary, backgroundColor: '#E0F2FE' },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: C.primary, borderColor: C.primary },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: '700', color: C.primary },
  amount: { fontSize: 13, fontWeight: '700', color: C.text },
  customerName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  hubName: { fontSize: 12, color: C.muted, marginBottom: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  itemCount: { fontSize: 12, color: C.muted },
  time: { fontSize: 12, color: C.muted },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted },
});

const m = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.primaryDark,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  body: { padding: 16, paddingBottom: 32 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card },

  infoCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: C.muted, minWidth: 90 },
  rowValue: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1, textAlign: 'right' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  itemsCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemQtyBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.primaryLight || '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQtyText: { fontSize: 13, fontWeight: '700', color: C.primary },
  itemName: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 2 },
  itemPrice: { fontSize: 12, color: C.muted },
  itemSubtotal: { fontSize: 14, fontWeight: '700', color: C.text },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: C.primary },

  packBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    padding: 16,
  },
  packBtnDisabled: { opacity: 0.6 },
  packBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
