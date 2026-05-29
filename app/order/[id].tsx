import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
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
  error: '#EF4444',
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  PendingPayment: {
    label: 'Chờ thanh toán',
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: 'time-outline',
  },
  Paid_WaitingForBatch: {
    label: 'Đã thanh toán',
    color: '#3B82F6',
    bg: '#EFF6FF',
    icon: 'checkmark-circle-outline',
  },
  ShippingToHub: {
    label: 'Đang vận chuyển',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    icon: 'bicycle-outline',
  },
  InHub_ReadyForPickup: {
    label: 'Sẵn sàng lấy hàng',
    color: C.primary,
    bg: '#E5F9FA',
    icon: 'storefront-outline',
  },
  Completed: {
    label: 'Hoàn thành',
    color: '#22C55E',
    bg: '#F0FDF4',
    icon: 'checkmark-done-outline',
  },
  Cancelled: { label: 'Đã huỷ', color: C.error, bg: '#FEF2F2', icon: 'close-circle-outline' },
  Refunded: { label: 'Đã hoàn tiền', color: C.muted, bg: C.bg, icon: 'return-down-back-outline' },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    ordersService
      .getById(id)
      .then(setOrder)
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = () => {
    Alert.alert('Huỷ đơn hàng', 'Bạn có chắc muốn huỷ đơn hàng này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Huỷ đơn',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const updated = await ordersService.cancel(id!);
            setOrder(updated);
          } catch {
            Alert.alert('Lỗi', 'Không thể huỷ đơn hàng lúc này.');
          } finally {
            setCancelling(false);
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
  if (!order) return null;

  const status = STATUS_CONFIG[order.status];
  const canCancel = order.status === 'PendingPayment' || order.status === 'Paid_WaitingForBatch';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chi tiết đơn hàng</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {/* Status */}
        <View style={[s.statusCard, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon as any} size={32} color={status.color} />
          <Text style={[s.statusLabel, { color: status.color }]}>{status.label}</Text>
          {order.status === 'PendingPayment' && order.paymentRef && (
            <View style={s.payRefWrap}>
              <Text style={s.payRefHint}>Nội dung chuyển khoản:</Text>
              <Text style={s.payRef}>{order.paymentRef}</Text>
            </View>
          )}
          {order.cancelReason && <Text style={s.cancelReason}>Lý do: {order.cancelReason}</Text>}
        </View>

        {/* Hub */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Điểm nhận hàng</Text>
          <View style={s.card}>
            <View style={s.hubRow}>
              <View style={s.hubIcon}>
                <Ionicons name="storefront-outline" size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.hubName}>{order.hub.name}</Text>
                <Text style={s.hubAddr}>
                  {order.hub.address}, {order.hub.ward}, {order.hub.district}, {order.hub.city}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sản phẩm ({order.items.length})</Text>
          <View style={s.card}>
            {order.items.map((item, i) => (
              <View
                key={item.productId}
                style={[s.itemRow, i < order.items.length - 1 && s.itemBorder]}
              >
                <View style={s.itemDot} />
                <Text style={s.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={s.itemQty}>x{item.quantity}</Text>
                <Text style={s.itemPrice}>{formatCurrency(item.subtotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Thanh toán</Text>
          <View style={s.card}>
            <View style={[s.payRow, s.itemBorder]}>
              <Text style={s.payLabel}>Tổng sản phẩm</Text>
              <Text style={s.payValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
            {order.walletAmountUsed > 0 && (
              <View style={[s.payRow, s.itemBorder]}>
                <Text style={s.payLabel}>Ví điện tử</Text>
                <Text style={[s.payValue, { color: '#22C55E' }]}>
                  -{formatCurrency(order.walletAmountUsed)}
                </Text>
              </View>
            )}
            <View style={s.payRow}>
              <Text style={[s.payLabel, { fontWeight: '700', color: C.text }]}>
                Tổng thanh toán
              </Text>
              <Text style={[s.payValue, { fontWeight: '800', color: C.primary, fontSize: 16 }]}>
                {formatCurrency(order.totalAmount - order.walletAmountUsed)}
              </Text>
            </View>
          </View>
        </View>

        {/* Note */}
        {order.note && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ghi chú</Text>
            <View style={s.noteCard}>
              <Text style={s.noteText}>{order.note}</Text>
            </View>
          </View>
        )}

        {/* Cancel */}
        {canCancel && (
          <TouchableOpacity
            style={[s.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            {cancelling ? (
              <ActivityIndicator color={C.error} size="small" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={C.error} />
                <Text style={s.cancelBtnText}>Huỷ đơn hàng</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={s.shopBtn}
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="bag-outline" size={18} color={C.primary} />
          <Text style={s.shopBtnText}>Tiếp tục mua sắm</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  body: { padding: 16, paddingBottom: 40 },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusLabel: { fontSize: 17, fontWeight: '700' },
  payRefWrap: { alignItems: 'center', marginTop: 4 },
  payRefHint: { fontSize: 12, color: C.muted },
  payRef: { fontSize: 20, fontWeight: '800', color: '#1D4ED8', letterSpacing: 1 },
  cancelReason: { fontSize: 13, color: C.muted, textAlign: 'center' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  hubRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  hubIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  hubAddr: { fontSize: 12, color: C.muted, lineHeight: 18 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  itemName: { flex: 1, fontSize: 13, color: C.text },
  itemQty: { fontSize: 13, color: C.muted },
  itemPrice: { fontSize: 13, fontWeight: '700', color: C.text },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  payLabel: { fontSize: 14, color: C.muted },
  payValue: { fontSize: 14, color: C.text },
  noteCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  noteText: { fontSize: 14, color: C.muted, lineHeight: 22 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    marginBottom: 12,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.error },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  shopBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
});
