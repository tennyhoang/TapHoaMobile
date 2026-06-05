import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ordersService } from '@/services/orders.service';
import { formatCurrency } from '@/lib/utils';
import ErrorScreen from '@/components/ErrorScreen';
import type { Order, OrderStatus } from '@/types';
import { C } from '@/constants/Colors';
import ScreenHeader from '@/components/ScreenHeader';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';

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
  const [hasError, setHasError] = useState<'network' | 'error' | false>(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | undefined>(undefined);

  const load = useCallback(async (status?: OrderStatus) => {
    setHasError(false);
    try {
      const res = await ordersService.getMyOrders({ pageSize: 50, status });
      setOrders(res.items ?? []);
    } catch (e) {
      setHasError(e instanceof TypeError ? 'network' : 'error');
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
          <StatusBadge status={item.status} />
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
      <ScreenHeader title="Đơn hàng của tôi" />

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
      ) : hasError ? (
        <ErrorScreen
          type={hasError || 'error'}
          onRetry={() => {
            setLoading(true);
            load(filterStatus);
          }}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Chưa có đơn hàng nào"
          action={{
            label: 'Mua sắm ngay',
            onPress: () => router.replace('/(tabs)' as any),
            icon: 'cart-outline',
          }}
        />
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
