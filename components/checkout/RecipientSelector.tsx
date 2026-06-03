import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';
import type { Address } from '@/types';

interface Props {
  selectedAddress: Address | null;
  onPress: () => void;
  onAddNew: () => void;
}

export default function RecipientSelector({ selectedAddress, onPress, onAddNew }: Props) {
  if (selectedAddress) {
    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>Người nhận</Text>
        <TouchableOpacity style={s.recipientCard} onPress={onPress} activeOpacity={0.8}>
          <View style={s.recipientIcon}>
            <Ionicons name="person-outline" size={18} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.recipientName}>{selectedAddress.receiverName}</Text>
            <Text style={s.recipientPhone}>{selectedAddress.phoneNumber}</Text>
            <Text style={s.recipientAddr} numberOfLines={2}>
              {selectedAddress.streetAddress}, {selectedAddress.ward}, {selectedAddress.district},{' '}
              {selectedAddress.province}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Người nhận</Text>
      <TouchableOpacity style={s.addAddrBtn} onPress={onAddNew} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={18} color={C.primary} />
        <Text style={s.addAddrText}>Thêm địa chỉ người nhận</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  recipientIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  recipientName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  recipientPhone: { fontSize: 13, color: C.primary, fontWeight: '600', marginBottom: 3 },
  recipientAddr: { fontSize: 12, color: C.muted, lineHeight: 17 },
  addAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderStyle: 'dashed',
    padding: 16,
  },
  addAddrText: { fontSize: 14, fontWeight: '600', color: C.primary },
});
