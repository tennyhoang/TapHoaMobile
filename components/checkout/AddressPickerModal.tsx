import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';
import type { Address } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedAddress: Address | null;
  onSelect: (addr: Address) => void;
  onAddNew: () => void;
  bottom: number;
}

export default function AddressPickerModal({
  visible,
  onClose,
  addresses,
  selectedAddress,
  onSelect,
  onAddNew,
  bottom,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={[s.addrSheet, { paddingBottom: bottom + 24 }]}>
          <View style={s.sheetHandle} />
          <Text style={s.addrSheetTitle}>Chọn người nhận</Text>

          {addresses.map(addr => (
            <TouchableOpacity
              key={addr.id}
              style={[s.addrRow, selectedAddress?.id === addr.id && s.addrRowActive]}
              onPress={() => {
                onSelect(addr);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <View style={[s.addrRadio, selectedAddress?.id === addr.id && s.addrRadioActive]}>
                {selectedAddress?.id === addr.id && <View style={s.addrRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.addrNameRow}>
                  <Text style={s.addrName}>{addr.receiverName}</Text>
                  {addr.isDefault && (
                    <View style={s.defaultBadge}>
                      <Text style={s.defaultBadgeText}>Mặc định</Text>
                    </View>
                  )}
                </View>
                <Text style={s.addrPhone}>{addr.phoneNumber}</Text>
                <Text style={s.addrText} numberOfLines={2}>
                  {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={s.addAddrSheetBtn}
            onPress={() => {
              onClose();
              onAddNew();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={C.primary} />
            <Text style={s.addAddrSheetText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  addrSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  addrSheetTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 16 },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  addrRowActive: { backgroundColor: '#F0FDFA', borderRadius: 12, paddingHorizontal: 10 },
  addrRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addrRadioActive: { borderColor: C.primary },
  addrRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  addrNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  addrName: { fontSize: 14, fontWeight: '700', color: C.text },
  defaultBadge: {
    backgroundColor: '#E5F9FA',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: '700', color: C.primary },
  addrPhone: { fontSize: 13, color: C.muted, marginBottom: 2 },
  addrText: { fontSize: 12, color: C.muted, lineHeight: 17 },
  addAddrSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  addAddrSheetText: { fontSize: 14, fontWeight: '600', color: C.primary },
});
