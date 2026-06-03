import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';
import type { Hub } from '@/types';

interface Props {
  hubs: Hub[];
  selectedHub: Hub | null;
  onSelect: (hub: Hub) => void;
  onOpenMap: () => void;
}

export default function HubSelector({ hubs, selectedHub, onSelect, onOpenMap }: Props) {
  return (
    <View style={s.section}>
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>Điểm nhận hàng</Text>
        {hubs.length > 0 && (
          <TouchableOpacity style={s.mapBtn} onPress={onOpenMap} activeOpacity={0.8}>
            <Ionicons name="map-outline" size={14} color={C.primary} />
            <Text style={s.mapBtnText}>Xem bản đồ</Text>
          </TouchableOpacity>
        )}
      </View>
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
              onPress={() => onSelect(hub)}
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
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
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
  hubInfo: { flex: 1 },
  hubName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  hubAddr: { fontSize: 12, color: C.muted, lineHeight: 18 },
  emptyHub: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  emptyHubText: { fontSize: 13, color: C.muted },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5F9FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mapBtnText: { fontSize: 12, fontWeight: '600', color: C.primary },
});
