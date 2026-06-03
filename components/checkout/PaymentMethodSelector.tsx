import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';
import { formatCurrency } from '@/lib/utils';

type PaymentMethod = 'COD' | 'BankTransfer' | 'Wallet';

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
  { value: 'Wallet', label: 'Ví TapHoa', icon: 'wallet-outline', desc: 'Thanh toán từ ví điện tử' },
];

interface Props {
  paymentMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  walletBalance: number;
}

export default function PaymentMethodSelector({ paymentMethod, onChange, walletBalance }: Props) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Phương thức thanh toán</Text>
      <View style={s.card}>
        {PAYMENT_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            style={[s.hubRow, i < PAYMENT_OPTIONS.length - 1 && s.itemBorder]}
            onPress={() => onChange(opt.value)}
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
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
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
  hubName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  hubAddr: { fontSize: 12, color: C.muted, lineHeight: 18 },
  payIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
