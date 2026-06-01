import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ordersService } from '@/services/orders.service';
import { formatCurrency } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PendingPayment: 'Chờ thanh toán',
  Paid_WaitingForBatch: 'Đã thanh toán',
  ShippingToHub: 'Đang vận chuyển',
  InHub_ReadyForPickup: 'Sẵn sàng lấy',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã huỷ',
  Refunded: 'Hoàn tiền',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PendingPayment: '#F59E0B',
  Paid_WaitingForBatch: '#3B82F6',
  ShippingToHub: '#8B5CF6',
  InHub_ReadyForPickup: C.primary,
  Completed: '#22C55E',
  Cancelled: '#EF4444',
  Refunded: C.muted,
};

const FILTERS: { label: string; value: OrderStatus | undefined }[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Chờ TT', value: 'PendingPayment' },
  { label: 'Đang giao', value: 'ShippingToHub' },
  { label: 'Lấy hàng', value: 'InHub_ReadyForPickup' },
  { label: 'Hoàn thành', value: 'Completed' },
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | undefined>(undefined);

  const load = useCallback(async (status?: OrderStatus) => {
    try {
      const res = await ordersService.getMyOrders({ pageSize: 50, status });
      setOrders(res.items);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(filterStatus);
    }, [load, filterStatus])
  );

  const handleFilter = (status: OrderStatus | undefined) => {
    setFilterStatus(status);
    setLoading(true);
    load(status);
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const color = STATUS_COLOR[item.status];
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/order/${item.id}` as any)}
        activeOpacity={0.85}
      >
        <View style={s.cardHeader}>
          <Text style={s.orderId} numberOfLines={1}>
            #{item.id.slice(0, 8).toUpperCase()}
          </Text>
          <View style={[s.statusBadge, { backgroundColor: color + '18' }]}>
            <Text style={[s.statusText, { color }]}>{STATUS_LABEL[item.status]}</Text>
          </View>
        </View>

        <Text style={s.hubName} numberOfLines={1}>
          <Ionicons name="storefront-outline" size={12} color={C.muted} /> {item.hub.name}
        </Text>

        <Text style={s.itemList} numberOfLines={1}>
          {item.items.map(i => i.productName).join(', ')}
        </Text>

        <View style={s.cardFooter}>
          <Text style={s.date}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
          <Text style={s.total}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Đơn hàng của tôi</Text>
      </View>

      {/* Filter chips */}
      <View style={s.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={String(f.value)}
            style={[s.chip, filterStatus === f.value && s.chipActive]}
            onPress={() => handleFilter(f.value)}
          >
            <Text style={[s.chipText, filterStatus === f.value && s.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : orders.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="receipt-outline" size={52} color="#D1D5DB" />
          <Text style={s.emptyText}>Chưa có đơn hàng nào</Text>
          <TouchableOpacity
            style={s.shopBtn}
            onPress={() => router.replace('/(tabs)' as any)}
            activeOpacity={0.8}
          >
            <Text style={s.shopBtnText}>Mua sắm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(filterStatus);
              }}
              tintColor={C.primary}
            />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.primaryDark,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
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
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 13, fontWeight: '700', color: C.text, fontVariant: ['tabular-nums'] },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  hubName: { fontSize: 12, color: C.muted },
  itemList: { fontSize: 13, color: C.text },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  date: { fontSize: 12, color: C.muted },
  total: { fontSize: 15, fontWeight: '700', color: C.primary },
  emptyText: { fontSize: 14, color: C.muted },
  shopBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: C.primary,
    borderRadius: 12,
  },
  shopBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
