import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '@/constants/Colors';
import { formatCurrency } from '@/lib/utils';
import type { CartItem } from '@/types';

interface Props {
  items: CartItem[];
  totalItems: number;
}

export default function OrderSummary({ items, totalItems }: Props) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Sản phẩm ({totalItems})</Text>
      <View style={s.card}>
        {items.map((item, i) => (
          <View key={item.productId} style={[s.itemRow, i < items.length - 1 && s.itemBorder]}>
            <Text style={s.itemName} numberOfLines={1}>
              {item.productName}
            </Text>
            <Text style={s.itemQty}>x{item.quantity}</Text>
            <Text style={s.itemPrice}>{formatCurrency(item.subtotal)}</Text>
          </View>
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
});
