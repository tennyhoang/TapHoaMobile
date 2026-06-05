import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { warehouseManagerService } from '@/services/warehouse-manager.service';
import type { WarehouseDriver } from '@/types';

const C = {
  primary: '#0891B2',
  primaryDark: '#0E7490',
  primaryLight: '#E0F2FE',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F0F9FF',
  card: '#FFFFFF',
  border: '#E0F2FE',
};

export default function WarehouseDriversScreen() {
  const { top } = useSafeAreaInsets();
  const unauthorized = useRoleGuard('WarehouseManager');

  const [drivers, setDrivers] = useState<WarehouseDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      const res = await warehouseManagerService.getDrivers();
      setDrivers(res);
    } catch {
      // giữ data cũ
    } finally {
      setLoading(false);
      if (refresh) setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (unauthorized) return null;

  const activeDrivers = drivers.filter(d => d.isActive);
  const inactiveDrivers = drivers.filter(d => !d.isActive);

  const renderItem = ({ item }: { item: WarehouseDriver }) => (
    <View style={[s.card, !item.isActive && s.cardInactive]}>
      <View style={[s.avatar, { backgroundColor: item.isActive ? C.primaryLight : '#F3F4F6' }]}>
        <Ionicons name="person" size={22} color={item.isActive ? C.primary : C.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.cardTop}>
          <Text style={s.name}>{item.fullName}</Text>
          <View style={[s.statusBadge, item.isActive ? s.statusActive : s.statusInactive]}>
            <Text style={[s.statusText, item.isActive ? s.statusActiveText : s.statusInactiveText]}>
              {item.isActive ? 'Hoạt động' : 'Ngừng HĐ'}
            </Text>
          </View>
        </View>
        <Text style={s.email}>{item.email}</Text>
        {item.activeOrders > 0 && (
          <View style={s.shippingRow}>
            <Ionicons name="car-outline" size={12} color={C.primary} />
            <Text style={s.shippingText}>{item.activeOrders} đơn đang giao</Text>
          </View>
        )}
      </View>
      {item.phoneNumber && (
        <TouchableOpacity
          style={s.callBtn}
          onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="call-outline" size={18} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const SectionHeader = ({ title, count }: { title: string; count: number }) => (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.countBadge}>
        <Text style={s.countText}>{count}</Text>
      </View>
    </View>
  );

  const data: (WarehouseDriver | { _section: string; count: number })[] = [
    ...(activeDrivers.length > 0
      ? [{ _section: 'Đang hoạt động', count: activeDrivers.length }, ...activeDrivers]
      : []),
    ...(inactiveDrivers.length > 0
      ? [{ _section: 'Ngừng hoạt động', count: inactiveDrivers.length }, ...inactiveDrivers]
      : []),
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tài xế của kho</Text>
        <View style={s.countPill}>
          <Text style={s.countPillText}>{drivers.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => ('_section' in item ? `section-${i}` : item.id)}
          renderItem={({ item }) => {
            if ('_section' in item) {
              return <SectionHeader title={item._section} count={item.count} />;
            }
            return renderItem({ item });
          }}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={C.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="car-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyText}>Chưa có tài xế nào được gán về kho này</Text>
              <Text style={s.emptySubText}>Admin cần phân công tài xế vào kho.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.primaryDark,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countPillText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: C.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { fontSize: 12, fontWeight: '700', color: C.primary },

  list: { padding: 12, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  cardInactive: { opacity: 0.65 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  email: { fontSize: 12, color: C.muted, marginBottom: 4 },
  shippingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shippingText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusInactive: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusActiveText: { color: '#065F46' },
  statusInactiveText: { color: C.muted },

  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'center' },
  emptySubText: { fontSize: 13, color: C.muted, textAlign: 'center' },
});
