import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import StatusBadge from '@/components/StatusBadge';
import { adminService } from '@/services/admin.service';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import { C } from '@/constants/Colors';
import type { Order, OrderStatus } from '@/types';

const NEXT_STATUSES: Partial<Record<OrderStatus, { label: string; value: OrderStatus }[]>> = {
  Paid_WaitingForBatch: [{ label: 'Gửi đến Hub', value: 'ShippingToHub' }],
  ShippingToHub: [{ label: 'Đã tới Hub', value: 'InHub_ReadyForPickup' }],
  InHub_ReadyForPickup: [{ label: 'Hoàn thành', value: 'Completed' }],
};

const TIMELINE_FIELDS: { label: string; key: keyof Order; icon: string }[] = [
  { label: 'Đặt hàng', key: 'createdAt', icon: 'cart-outline' },
  { label: 'Đã thanh toán', key: 'paidAt', icon: 'card-outline' },
  { label: 'Gửi đến Hub', key: 'shippingToHubAt', icon: 'car-outline' },
  { label: 'Tại Hub', key: 'inHubAt', icon: 'storefront-outline' },
  { label: 'Hoàn thành', key: 'completedAt', icon: 'checkmark-circle-outline' },
  { label: 'Đã huỷ', key: 'cancelledAt', icon: 'close-circle-outline' },
];

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { show } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminService
      .getOrderById(id)
      .then(setOrder)
      .catch(() => show('Không thể tải đơn hàng', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = (next: { label: string; value: OrderStatus }) => {
    if (!order) return;
    Alert.alert('Cập nhật trạng thái', `Chuyển sang "${next.label}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          setUpdating(true);
          try {
            const updated = await adminService.updateOrderStatus(order.id, next.value);
            setOrder(updated);
            show('Đã cập nhật');
          } catch {
            show('Không thể cập nhật', 'error');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>Không tìm thấy đơn hàng</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextActions = NEXT_STATUSES[order.status] ?? [];
  const fmt = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  return (
    <View style={s.root}>
      <ScreenHeader title={`#${order.id.slice(-8).toUpperCase()}`} onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {/* Status & Payment */}
        <View style={s.section}>
          <View style={s.statusRow}>
            <StatusBadge
              status={order.status}
              label={order.status === 'InHub_ReadyForPickup' ? 'Tại Hub' : undefined}
            />
            <Text style={s.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
          </View>
          {order.paymentMethod && (
            <Text style={s.paymentMethod}>
              Thanh toán:{' '}
              {order.paymentMethod === 'COD'
                ? 'COD'
                : order.paymentMethod === 'BankTransfer'
                  ? 'Chuyển khoản'
                  : 'Ví TapHoa'}
            </Text>
          )}
          {order.note ? <Text style={s.note}>Ghi chú: {order.note}</Text> : null}
          {order.cancelReason ? (
            <Text style={s.cancelNote}>Lý do huỷ: {order.cancelReason}</Text>
          ) : null}
        </View>

        {/* Items */}
        <Text style={s.sectionTitle}>Sản phẩm ({order.items.length})</Text>
        <View style={s.section}>
          {order.items.map((item, i) => (
            <View key={item.productId + i} style={s.itemRow}>
              <View style={s.itemInfo}>
                <Text style={s.itemName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={s.itemMeta}>
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text style={s.itemSubtotal}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Tổng cộng</Text>
            <Text style={s.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
          {order.walletAmountUsed > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Ví TapHoa</Text>
              <Text style={s.totalValue}>{formatCurrency(order.walletAmountUsed)}</Text>
            </View>
          )}
        </View>

        {/* Hub */}
        <Text style={s.sectionTitle}>Hub nhận hàng</Text>
        <View style={s.section}>
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={16} color={C.muted} />
            <Text style={s.infoText}>
              {order.hub.name} — {order.hub.address}, {order.hub.ward}, {order.hub.district},{' '}
              {order.hub.city}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <Text style={s.sectionTitle}>Lịch sử đơn hàng</Text>
        <View style={s.section}>
          {TIMELINE_FIELDS.map(tf => {
            const val = order[tf.key] as string | undefined;
            if (!val) return null;
            return (
              <View key={tf.key} style={s.timelineRow}>
                <View style={s.timelineDot} />
                <Ionicons name={tf.icon as any} size={14} color={C.primary} />
                <View style={s.timelineInfo}>
                  <Text style={s.timelineLabel}>{tf.label}</Text>
                  <Text style={s.timelineTime}>{fmt(val)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Actions */}
        {nextActions.length > 0 && (
          <View style={s.actions}>
            {nextActions.map(next => (
              <TouchableOpacity
                key={next.value}
                style={[s.actionBtn, updating && s.actionBtnDim]}
                onPress={() => handleUpdateStatus(next)}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.actionText}>{next.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, color: C.muted },
  backBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  body: { padding: 16, gap: 16 },
  section: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: -8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalAmount: { fontSize: 20, fontWeight: '800', color: C.primary },
  paymentMethod: { fontSize: 13, color: C.muted },
  note: { fontSize: 13, color: '#F59E0B', fontStyle: 'italic' },
  cancelNote: { fontSize: 13, color: '#EF4444', fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: C.text },
  itemMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  itemSubtotal: { fontSize: 13, fontWeight: '700', color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 13, color: C.muted },
  totalValue: { fontSize: 13, fontWeight: '700', color: C.text },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 18 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  timelineInfo: { flex: 1 },
  timelineLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  timelineTime: { fontSize: 12, color: C.muted, marginTop: 1 },
  actions: { gap: 10, paddingTop: 4 },
  actionBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDim: { opacity: 0.5 },
  actionText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
