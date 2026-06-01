import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ordersService } from '@/services/orders.service';
import * as ScreenCapture from 'expo-screen-capture';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const BANK_CODE = 'MB';
const ACCOUNT_NO = '0000000001';
const ACCOUNT_NAME = 'TAPHOA TEST';
const BANK_NAME = 'MB Bank';

function buildQrUrl(amount: number, paymentRef: string): string {
  const addInfo = encodeURIComponent(paymentRef);
  const name = encodeURIComponent(ACCOUNT_NAME);
  return `https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NO}-compact2.jpg?amount=${Math.round(amount)}&addInfo=${addInfo}&accountName=${name}`;
}

function PaymentQR({ amount, paymentRef }: { amount: number; paymentRef: string }) {
  const { show } = useToast();
  const qrUrl = buildQrUrl(amount, paymentRef);

  const copy = (text: string, label: string) => {
    Clipboard.setString(text);
    show(`Đã sao chép ${label}`);
  };

  return (
    <View style={q.wrap}>
      <View style={q.header}>
        <Ionicons name="qr-code-outline" size={18} color="#fff" />
        <Text style={q.headerTitle}>Quét mã để chuyển khoản</Text>
      </View>
      <View style={q.body}>
        <View style={q.qrWrap}>
          <Image source={{ uri: qrUrl }} style={q.qrImg} contentFit="contain" />
        </View>
        <View style={q.infoBox}>
          {[
            { label: 'Ngân hàng', value: BANK_NAME, copy: false },
            { label: 'Số tài khoản', value: ACCOUNT_NO, copy: true },
            { label: 'Số tiền', value: formatCurrency(amount), copy: false },
            { label: 'Nội dung CK', value: paymentRef, copy: true },
          ].map(row => (
            <View key={row.label} style={q.infoRow}>
              <Text style={q.infoLabel}>{row.label}</Text>
              <View style={q.infoRight}>
                <Text style={[q.infoValue, row.label === 'Nội dung CK' && q.infoRef]}>
                  {row.value}
                </Text>
                {row.copy && (
                  <TouchableOpacity
                    onPress={() => copy(row.value, row.label)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="copy-outline" size={14} color={C.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
        <Text style={q.hint}>
          Hệ thống tự động xác nhận sau khi nhận tiền (trong vòng 1 phút).{'\n'}
          Nhập đúng nội dung chuyển khoản để xử lý nhanh nhất.
        </Text>
      </View>
    </View>
  );
}

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
  const { top } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { show } = useToast();

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ordersService.getById(id);
      setOrder(data);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Prevent screenshots — screen may contain payment QR code
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  // Poll every 15s while waiting for payment confirmation
  useEffect(() => {
    if (order?.status !== 'PendingPayment') return;
    const timer = setInterval(fetchOrder, 15000);
    return () => clearInterval(timer);
  }, [order?.status, fetchOrder]);

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
            show('Không thể huỷ đơn hàng lúc này', 'error');
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

      <View style={[s.header, { paddingTop: top + 16 }]}>
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
          {order.status === 'PendingPayment' && (
            <View style={s.refreshRow}>
              <Ionicons name="time-outline" size={13} color={C.muted} />
              <Text style={s.refreshHint}>Tự động cập nhật mỗi 15 giây</Text>
            </View>
          )}
          {order.cancelReason && <Text style={s.cancelReason}>Lý do: {order.cancelReason}</Text>}
        </View>

        {/* QR payment */}
        {order.status === 'PendingPayment' && order.paymentRef && (
          <PaymentQR
            amount={order.totalAmount - (order.walletAmountUsed ?? 0)}
            paymentRef={order.paymentRef}
          />
        )}

        {/* Timeline */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tiến trình đơn hàng</Text>
          <View style={s.card}>
            {order.status === 'Cancelled' || order.status === 'Refunded'
              ? // ── Cancelled / Refunded timeline ──
                [
                  { key: 'placed', label: 'Đặt hàng', ts: order.createdAt, icon: 'bag-outline' },
                  {
                    key: 'cancelled',
                    label: order.status === 'Refunded' ? 'Đã hoàn tiền' : 'Đã huỷ đơn',
                    ts: order.cancelledAt ?? order.refundedAt,
                    icon:
                      order.status === 'Refunded'
                        ? 'return-down-back-outline'
                        : 'close-circle-outline',
                  },
                ].map((step, i, arr) => {
                  const done = !!step.ts;
                  const isLast = i === arr.length - 1;
                  const isCancel = step.key === 'cancelled';
                  return (
                    <View key={step.key} style={s.timelineRow}>
                      <View style={s.timelineLeft}>
                        <View
                          style={[
                            s.timelineDot,
                            done
                              ? isCancel
                                ? s.timelineDotCancel
                                : s.timelineDotDone
                              : s.timelineDotPending,
                          ]}
                        >
                          <Ionicons
                            name={step.icon as any}
                            size={10}
                            color={done ? '#fff' : '#9CA3AF'}
                          />
                        </View>
                        {!isLast && <View style={[s.timelineLine, done && s.timelineLineDone]} />}
                      </View>
                      <View style={s.timelineContent}>
                        <Text
                          style={[
                            s.timelineLabel,
                            done
                              ? isCancel
                                ? { color: '#EF4444' }
                                : s.timelineLabelDone
                              : s.timelineLabelPending,
                          ]}
                        >
                          {step.label}
                        </Text>
                        {step.ts && (
                          <Text style={s.timelineTs}>
                            {new Date(step.ts).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        )}
                        {isCancel && order.cancelReason && (
                          <Text style={s.timelineCancelReason}>"{order.cancelReason}"</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              : // ── Normal progress timeline ──
                (() => {
                  const STEPS = [
                    {
                      key: 'placed',
                      label: 'Đặt hàng',
                      ts: order.createdAt,
                      icon: 'bag-outline',
                      activeStatus: null,
                    },
                    {
                      key: 'paid',
                      label: 'Đã thanh toán',
                      ts: order.paidAt,
                      icon: 'card-outline',
                      activeStatus: 'PendingPayment',
                    },
                    {
                      key: 'shipping',
                      label: 'Đang vận chuyển',
                      ts: order.shippingToHubAt,
                      icon: 'bicycle-outline',
                      activeStatus: 'Paid_WaitingForBatch',
                    },
                    {
                      key: 'inhub',
                      label: 'Sẵn sàng lấy hàng',
                      ts: order.inHubAt,
                      icon: 'storefront-outline',
                      activeStatus: 'ShippingToHub',
                    },
                    {
                      key: 'done',
                      label: 'Hoàn thành',
                      ts: order.completedAt,
                      icon: 'checkmark-done-outline',
                      activeStatus: 'InHub_ReadyForPickup',
                    },
                  ] as const;

                  // "active" = first step not yet done (the current pending step)
                  const activeIdx = STEPS.findIndex(st => !st.ts);

                  return STEPS.map((step, i) => {
                    const done = !!step.ts;
                    const isActive = i === activeIdx;
                    const isLast = i === STEPS.length - 1;
                    return (
                      <View key={step.key} style={s.timelineRow}>
                        <View style={s.timelineLeft}>
                          <View
                            style={[
                              s.timelineDot,
                              done
                                ? s.timelineDotDone
                                : isActive
                                  ? s.timelineDotActive
                                  : s.timelineDotPending,
                            ]}
                          >
                            <Ionicons
                              name={step.icon as any}
                              size={10}
                              color={done || isActive ? '#fff' : '#9CA3AF'}
                            />
                          </View>
                          {!isLast && <View style={[s.timelineLine, done && s.timelineLineDone]} />}
                        </View>
                        <View style={s.timelineContent}>
                          <Text
                            style={[
                              s.timelineLabel,
                              done
                                ? s.timelineLabelDone
                                : isActive
                                  ? s.timelineLabelActive
                                  : s.timelineLabelPending,
                            ]}
                          >
                            {step.label}
                            {isActive && <Text style={s.timelineActiveBadge}> · đang xử lý</Text>}
                          </Text>
                          {step.ts ? (
                            <Text style={s.timelineTs}>
                              {new Date(step.ts).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          ) : isActive ? (
                            <Text style={s.timelineTsActive}>Đang chờ cập nhật...</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  });
                })()}
          </View>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  body: { padding: 16, paddingBottom: 40 },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusLabel: { fontSize: 17, fontWeight: '700' },
  refreshRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  refreshHint: { fontSize: 11, color: C.muted },
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
  timelineRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: C.primary },
  timelineDotActive: { backgroundColor: '#F59E0B' },
  timelineDotCancel: { backgroundColor: '#EF4444' },
  timelineDotPending: { backgroundColor: '#E5E7EB', borderWidth: 2, borderColor: '#D1D5DB' },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    marginBottom: -4,
    minHeight: 20,
  },
  timelineLineDone: { backgroundColor: C.primary },
  timelineContent: { flex: 1, paddingBottom: 14 },
  timelineLabel: { fontSize: 14, fontWeight: '600' },
  timelineLabelDone: { color: C.text },
  timelineLabelActive: { color: '#D97706' },
  timelineLabelPending: { color: '#9CA3AF' },
  timelineActiveBadge: { fontSize: 11, fontWeight: '500', color: '#F59E0B' },
  timelineTs: { fontSize: 11, color: C.muted, marginTop: 2 },
  timelineTsActive: { fontSize: 11, color: '#F59E0B', marginTop: 2 },
  timelineCancelReason: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 3,
    lineHeight: 16,
  },

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

const q = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  body: {
    backgroundColor: '#F0FDFA',
    padding: 16,
    gap: 14,
  },
  qrWrap: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImg: { width: 200, height: 200 },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0FDF4',
  },
  infoLabel: { fontSize: 13, color: C.muted },
  infoRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.text },
  infoRef: { fontSize: 16, fontWeight: '800', color: C.primaryDark, letterSpacing: 0.5 },
  hint: {
    fontSize: 11,
    color: C.primaryDark,
    textAlign: 'center',
    lineHeight: 17,
    opacity: 0.75,
  },
});
