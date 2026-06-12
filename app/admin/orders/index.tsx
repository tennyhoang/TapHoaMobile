import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { C } from '@/constants/Colors';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { adminService } from '@/services/admin.service';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import ErrorScreen from '@/components/ErrorScreen';
import type { Order, OrderStatus } from '@/types';

const STATUS_TABS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ TT', value: 'PendingPayment' },
  { label: 'Chờ XN', value: 'AwaitingPayment' },
  { label: 'Đã TT', value: 'Paid_WaitingForBatch' },
  { label: 'Vận chuyển', value: 'ShippingToHub' },
  { label: 'Tại Hub', value: 'InHub_ReadyForPickup' },
  { label: 'Hoàn thành', value: 'Completed' },
  { label: 'Đã huỷ', value: 'Cancelled' },
];

const NEXT_STATUSES: Partial<Record<OrderStatus, { label: string; value: OrderStatus }[]>> = {
  Paid_WaitingForBatch: [{ label: 'Gửi đến Hub', value: 'ShippingToHub' }],
  ShippingToHub: [{ label: 'Đã tới Hub', value: 'InHub_ReadyForPickup' }],
  InHub_ReadyForPickup: [{ label: 'Hoàn thành', value: 'Completed' }],
};

export default function AdminOrdersScreen() {
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeStatus, setActiveStatus] = useState<OrderStatus | ''>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, reset = false, status?: OrderStatus | '') => {
      if (reset) setHasError(false);
      const s = status !== undefined ? status : activeStatus;
      try {
        const res = await adminService.getOrders({
          page: nextPage,
          pageSize: 20,
          status: s || undefined,
        });
        setOrders(prev => (reset ? (res.items ?? []) : [...prev, ...(res.items ?? [])]));
        setHasMore(nextPage < res.totalPages);
        setPage(nextPage);
      } catch {
        if (reset) setHasError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeStatus]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(1, true);
    }, [load])
  );

  const handleTabChange = (status: OrderStatus | '') => {
    setActiveStatus(status);
    setLoading(true);
    load(1, true, status);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    load(page + 1);
  };

  const handleUpdateStatus = (order: Order, next: { label: string; value: OrderStatus }) => {
    Alert.alert(
      'Cập nhật trạng thái',
      `Chuyển đơn #${order.id.slice(-6).toUpperCase()} sang "${next.label}"?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setUpdatingId(order.id);
            try {
              const updated = await adminService.updateOrderStatus(order.id, next.value);
              setOrders(prev => prev.map(o => (o.id === order.id ? updated : o)));
              show('Đã cập nhật trạng thái');
            } catch {
              show('Không thể cập nhật trạng thái', 'error');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  if (unauthorized) return null;

  const renderOrder = ({ item }: { item: Order }) => {
    const nextActions = NEXT_STATUSES[item.status] ?? [];
    const isUpdating = updatingId === item.id;

    return (
      <View style={s.orderCard}>
        <View style={s.orderTop}>
          <View>
            <Text style={s.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
            <Text style={s.orderDate}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <StatusBadge
            status={item.status}
            label={item.status === 'InHub_ReadyForPickup' ? 'Tại Hub' : undefined}
          />
        </View>

        <View style={s.orderMeta}>
          <View style={s.metaRow}>
            <Ionicons name="storefront-outline" size={13} color={C.muted} />
            <Text style={s.metaText}>{item.hub.name}</Text>
          </View>
          <View style={s.metaRow}>
            <Ionicons name="bag-outline" size={13} color={C.muted} />
            <Text style={s.metaText}>{item.items.length} sản phẩm</Text>
          </View>
          <Text style={s.orderAmount}>{formatCurrency(item.totalAmount)}</Text>
        </View>

        {nextActions.length > 0 && (
          <View style={s.actions}>
            {nextActions.map(next => (
              <TouchableOpacity
                key={next.value}
                style={[s.actionBtn, isUpdating && { opacity: 0.6 }]}
                onPress={() => handleUpdateStatus(item, next)}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator color={C.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="arrow-forward-circle-outline" size={15} color={C.primary} />
                    <Text style={s.actionText}>{next.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <ScreenHeader title="Quản lý đơn hàng" />

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabs}
        contentContainerStyle={s.tabsContent}
      >
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[s.tab, activeStatus === tab.value && s.tabActive]}
            onPress={() => handleTabChange(tab.value)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeStatus === tab.value && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : hasError ? (
        <ErrorScreen
          type="network"
          onRetry={() => {
            setLoading(true);
            load(1, true);
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
              onRefresh={handleRefresh}
              tintColor={C.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="Không có đơn hàng nào" />}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ padding: 16 }} /> : null
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  tabs: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: C.muted },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  emptyText: { fontSize: 14, color: C.muted },

  orderCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  orderDate: { fontSize: 12, color: C.muted },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: C.muted },
  orderAmount: { marginLeft: 'auto', fontSize: 14, fontWeight: '800', color: C.primary },

  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: '#E5F9FA',
  },
  actionText: { fontSize: 13, fontWeight: '600', color: C.primary },
});
