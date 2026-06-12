import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { C } from '@/constants/Colors';
import { formatCurrency } from '@/lib/utils';

interface Props {
  totalAmount: number;
  shippingFee: number;
  voucherDiscount: number;
  finalAmount: number;
}

export default function OrderTotal({
  totalAmount,
  shippingFee,
  voucherDiscount,
  finalAmount,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={s.totalCard}>
      <View style={s.totalRow}>
        <Text style={s.totalLabel}>{t('cart.subtotal')}</Text>
        <Text style={s.totalValue}>{formatCurrency(totalAmount)}</Text>
      </View>
      <View style={s.totalRow}>
        <Text style={s.totalLabel}>{t('cart.shipping_fee')}</Text>
        {shippingFee === 0 ? (
          <Text style={[s.totalValue, { color: '#22C55E' }]}>Miễn phí</Text>
        ) : (
          <Text style={s.totalValue}>{formatCurrency(shippingFee)}</Text>
        )}
      </View>
      {voucherDiscount > 0 && (
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>{t('cart.discount')}</Text>
          <Text style={[s.totalValue, { color: '#22C55E' }]}>
            -{formatCurrency(voucherDiscount)}
          </Text>
        </View>
      )}
      <View style={[s.totalRow, s.totalFinal]}>
        <Text style={s.totalFinalLabel}>{t('cart.grand_total')}</Text>
        <Text style={s.totalFinalValue}>{formatCurrency(finalAmount)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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
});
