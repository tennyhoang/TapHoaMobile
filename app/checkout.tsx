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
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { hubsService } from '@/services/hubs.service';
import { ordersService } from '@/services/orders.service';
import { cartService } from '@/services/cart.service';
import { walletService } from '@/services/wallet.service';
import { formatCurrency } from '@/lib/utils';
import type { Hub, Cart } from '@/types';

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

type PaymentMethod = 'COD' | 'BankTransfer' | 'Wallet';

type VoucherResult = { discount: number; type: 'percent' | 'flat'; label: string };

const VOUCHERS: Record<string, VoucherResult> = {
  TAPHOA10: { discount: 10, type: 'percent', label: 'Giảm 10%' },
  NEWUSER15: { discount: 15, type: 'percent', label: 'Giảm 15% cho khách mới' },
  SALE20: { discount: 20, type: 'percent', label: 'Giảm 20%' },
  FREESHIP: { discount: 20000, type: 'flat', label: 'Giảm 20.000đ' },
};

function applyVoucher(code: string, total: number): { ok: boolean; msg: string; discount: number } {
  const v = VOUCHERS[code.trim().toUpperCase()];
  if (!v) return { ok: false, msg: 'Mã voucher không hợp lệ', discount: 0 };
  const discount = v.type === 'percent' ? Math.round((total * v.discount) / 100) : v.discount;
  return { ok: true, msg: v.label, discount };
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string; desc: string }[] = [
  {
    value: 'COD',
    label: 'Tiền mặt (COD)',
    icon: 'cash-outline',
    desc: 'Trả khi nhận hàng tại Hub',
  },
  {
    value: 'BankTransfer',
    label: 'Chuyển khoản',
    icon: 'card-outline',
    desc: 'Chuyển khoản ngân hàng theo mã đơn',
  },
  {
    value: 'Wallet',
    label: 'Ví TapHoa',
    icon: 'wallet-outline',
    desc: 'Thanh toán từ ví điện tử',
  },
];

export default function CheckoutScreen() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [voucherOk, setVoucherOk] = useState(false);

  useEffect(() => {
    Promise.all([cartService.get(), hubsService.getActive(), walletService.getBalance()])
      .then(([c, h, w]) => {
        setCart(c);
        setHubs(h);
        setWalletBalance(w?.balance ?? 0);
        if (h.length > 0) setSelectedHub(h[0]);
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, []);

  const handleApplyVoucher = () => {
    const total = cart?.totalAmount ?? 0;
    const result = applyVoucher(voucherCode, total);
    setVoucherOk(result.ok);
    setVoucherMsg(result.msg);
    setVoucherDiscount(result.discount);
  };

  const finalAmount = Math.max(0, (cart?.totalAmount ?? 0) - voucherDiscount);

  const handlePlaceOrder = async () => {
    if (!selectedHub) {
      setError('Vui lòng chọn điểm nhận hàng');
      return;
    }
    setError('');
    setPlacing(true);
    try {
      const order = await ordersService.create({
        hubId: selectedHub.id,
        note: note.trim() || undefined,
        paymentMethod,
      });
      router.replace(`/order/${order.id}` as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt hàng thất bại');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Xác nhận đơn hàng</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {/* Order summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sản phẩm ({cart?.totalItems ?? 0})</Text>
          <View style={s.card}>
            {cart?.items.map((item, i) => (
              <View
                key={item.productId}
                style={[s.itemRow, i < cart.items.length - 1 && s.itemBorder]}
              >
                <Text style={s.itemName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={s.itemQty}>x{item.quantity}</Text>
                <Text style={s.itemPrice}>{formatCurrency(item.subtotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hub selection */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Điểm nhận hàng</Text>
          {hubs.length === 0 ? (
            <View style={[s.card, s.emptyHub]}>
              <Ionicons name="alert-circle-outline" size={20} color={C.muted} />
              <Text style={s.emptyHubText}>Không có Hub nào đang hoạt động</Text>
            </View>
          ) : (
            <View style={s.card}>
              {hubs.map((hub, i) => (
                <TouchableOpacity
                  key={hub.id}
                  style={[s.hubRow, i < hubs.length - 1 && s.itemBorder]}
                  onPress={() => setSelectedHub(hub)}
                  activeOpacity={0.7}
                >
                  <View style={[s.radio, selectedHub?.id === hub.id && s.radioActive]}>
                    {selectedHub?.id === hub.id && <View style={s.radioDot} />}
                  </View>
                  <View style={s.hubInfo}>
                    <Text style={s.hubName}>{hub.name}</Text>
                    <Text style={s.hubAddr} numberOfLines={2}>
                      {hub.address}, {hub.ward}, {hub.district}, {hub.city}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Payment method */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Phương thức thanh toán</Text>
          <View style={s.card}>
            {PAYMENT_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.value}
                style={[s.hubRow, i < PAYMENT_OPTIONS.length - 1 && s.itemBorder]}
                onPress={() => setPaymentMethod(opt.value)}
                activeOpacity={0.7}
              >
                <View style={[s.radio, paymentMethod === opt.value && s.radioActive]}>
                  {paymentMethod === opt.value && <View style={s.radioDot} />}
                </View>
                <View style={s.payIcon}>
                  <Ionicons name={opt.icon as any} size={18} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.hubName}>{opt.label}</Text>
                  <Text style={s.hubAddr}>
                    {opt.value === 'Wallet' ? `Số dư: ${formatCurrency(walletBalance)}` : opt.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ghi chú</Text>
          <View style={s.noteWrap}>
            <TextInput
              style={s.noteInput}
              placeholder="Ghi chú cho đơn hàng (tuỳ chọn)..."
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>
        </View>

        {/* Voucher */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Mã giảm giá</Text>
          <View style={s.voucherRow}>
            <TextInput
              style={s.voucherInput}
              placeholder="Nhập mã voucher..."
              placeholderTextColor="#9CA3AF"
              value={voucherCode}
              onChangeText={v => {
                setVoucherCode(v);
                setVoucherMsg('');
                setVoucherDiscount(0);
                setVoucherOk(false);
              }}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleApplyVoucher}
            />
            <TouchableOpacity
              style={[s.voucherBtn, !voucherCode.trim() && s.voucherBtnDim]}
              onPress={handleApplyVoucher}
              disabled={!voucherCode.trim()}
              activeOpacity={0.85}
            >
              <Text style={s.voucherBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
          {!!voucherMsg && (
            <View style={[s.voucherResult, voucherOk ? s.voucherResultOk : s.voucherResultErr]}>
              <Ionicons
                name={voucherOk ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={15}
                color={voucherOk ? '#22C55E' : C.error}
              />
              <Text style={[s.voucherResultText, { color: voucherOk ? '#16A34A' : C.error }]}>
                {voucherMsg}
              </Text>
            </View>
          )}
        </View>

        {/* Total */}
        <View style={s.totalCard}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Tạm tính</Text>
            <Text style={s.totalValue}>{formatCurrency(cart?.totalAmount ?? 0)}</Text>
          </View>
          {voucherDiscount > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Voucher</Text>
              <Text style={[s.totalValue, { color: '#22C55E' }]}>
                -{formatCurrency(voucherDiscount)}
              </Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Phí giao hàng</Text>
            <Text style={[s.totalValue, { color: '#22C55E' }]}>Miễn phí</Text>
          </View>
          <View style={[s.totalRow, s.totalFinal]}>
            <Text style={s.totalFinalLabel}>Tổng cộng</Text>
            <Text style={s.totalFinalValue}>{formatCurrency(finalAmount)}</Text>
          </View>
        </View>

        {!!error && (
          <View style={s.errBox}>
            <Ionicons name="alert-circle-outline" size={16} color={C.error} />
            <Text style={s.errText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.placeBtn, placing && s.placeBtnDim]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.85}
        >
          {placing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.placeBtnText}>Đặt hàng · {formatCurrency(finalAmount)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  body: { padding: 16, paddingBottom: 120 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemName: { flex: 1, fontSize: 13, color: C.text, fontWeight: '500' },
  itemQty: { fontSize: 13, color: C.muted },
  itemPrice: { fontSize: 13, fontWeight: '700', color: C.primary },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioActive: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  hubInfo: { flex: 1 },
  hubName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  hubAddr: { fontSize: 12, color: C.muted, lineHeight: 18 },
  emptyHub: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  emptyHubText: { fontSize: 13, color: C.muted },
  payIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voucherInput: {
    flex: 1,
    height: 46,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: C.text,
    fontWeight: '600',
    letterSpacing: 1,
  },
  voucherBtn: {
    height: 46,
    paddingHorizontal: 18,
    backgroundColor: C.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherBtnDim: { opacity: 0.5 },
  voucherBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  voucherResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  voucherResultOk: { backgroundColor: '#F0FDF4' },
  voucherResultErr: { backgroundColor: '#FEF2F2' },
  voucherResultText: { fontSize: 13, fontWeight: '500' },

  noteWrap: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noteInput: { fontSize: 14, color: C.text, minHeight: 72, textAlignVertical: 'top' },
  totalCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: C.muted },
  totalValue: { fontSize: 14, fontWeight: '600', color: C.text },
  totalFinal: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
  },
  totalFinalLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  totalFinalValue: { fontSize: 18, fontWeight: '800', color: C.primary },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  errText: { fontSize: 13, color: C.error, flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  placeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: C.primary,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  placeBtnDim: { opacity: 0.65 },
  placeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
