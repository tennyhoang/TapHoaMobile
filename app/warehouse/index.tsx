import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { warehouseManagerService } from '@/services/warehouse-manager.service';
import type { WarehouseDashboard } from '@/types';

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

const NAV_ITEMS = [
  {
    icon: 'cube-outline',
    label: 'Đơn chờ đóng gói',
    desc: 'Xem và xác nhận pack đơn',
    color: '#F59E0B',
    route: '/warehouse/orders',
    statusParam: 'pending',
  },
  {
    icon: 'checkmark-done-outline',
    label: 'Đơn đã đóng gói',
    desc: 'Đơn sẵn sàng cho tài xế lấy',
    color: '#10B981',
    route: '/warehouse/orders',
    statusParam: 'packed',
  },
  {
    icon: 'layers-outline',
    label: 'Tồn kho',
    desc: 'Kiểm tra và điều chỉnh số lượng',
    color: '#8B5CF6',
    route: '/warehouse/inventory',
    statusParam: '',
  },
  {
    icon: 'car-outline',
    label: 'Tài xế',
    desc: 'Tài xế được gán về kho này',
    color: '#3B82F6',
    route: '/warehouse/drivers',
    statusParam: '',
  },
];

export default function WarehouseDashboardScreen() {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const unauthorized = useRoleGuard('WarehouseManager');
  const [data, setData] = useState<WarehouseDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setError(false);
    try {
      const res = await warehouseManagerService.getDashboard();
      setData(res);
    } catch {
      setError(true);
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

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (unauthorized) return null;

  const stats = data
    ? [
        {
          label: 'Chờ đóng gói',
          value: data.pendingOrders,
          color: '#F59E0B',
          icon: 'time-outline',
        },
        {
          label: 'Đã đóng gói',
          value: data.packedOrders,
          color: '#10B981',
          icon: 'checkmark-circle-outline',
        },
        { label: 'Đang giao', value: data.shippingOrders, color: C.primary, icon: 'car-outline' },
        {
          label: 'Pack hôm nay',
          value: data.packedToday,
          color: '#8B5CF6',
          icon: 'trending-up-outline',
        },
        {
          label: 'Tài xế hoạt động',
          value: data.activeDrivers,
          color: '#3B82F6',
          icon: 'people-outline',
        },
        {
          label: 'Hàng sắp hết',
          value: data.lowStockProducts,
          color: '#EF4444',
          icon: 'alert-circle-outline',
        },
      ]
    : [];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Ionicons name="business-outline" size={28} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Quản lý kho</Text>
            {data?.warehouse && (
              <Text style={s.headerSub} numberOfLines={1}>
                {data.warehouse.name} · {data.warehouse.district}
              </Text>
            )}
          </View>
          {data?.warehouse?.isActive === false && (
            <View style={s.inactiveBadge}>
              <Text style={s.inactiveBadgeText}>Ngừng HĐ</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={56} color="#CBD5E1" />
          <Text style={s.errorTitle}>Không kết nối được</Text>
          <Text style={s.errorSub}>API endpoint chưa được deploy.{'\n'}Vui lòng thử lại sau.</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => {
              setLoading(true);
              load();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={s.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
        >
          {data?.warehouse == null && (
            <View style={s.noWarning}>
              <Ionicons name="alert-circle-outline" size={32} color="#F59E0B" />
              <Text style={s.noWarningText}>Bạn chưa được gán vào kho nào.</Text>
              <Text style={s.noWarningText2}>Liên hệ Admin để được phân công.</Text>
            </View>
          )}

          {data && (
            <>
              <Text style={s.sectionTitle}>Tổng quan hôm nay</Text>
              <View style={s.statsGrid}>
                {stats.map(stat => (
                  <View
                    key={stat.label}
                    style={[
                      s.statCard,
                      { borderColor: stat.color, backgroundColor: stat.color + '08' },
                    ]}
                  >
                    <View style={s.statRow}>
                      <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                      <Ionicons name={stat.icon as any} size={20} color={stat.color + '88'} />
                    </View>
                    <Text style={s.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {data.lowStockProducts > 0 && (
                <TouchableOpacity
                  style={s.alertBanner}
                  onPress={() =>
                    router.push({
                      pathname: '/warehouse/inventory' as any,
                      params: { filter: 'low' },
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="warning-outline" size={20} color="#92400E" />
                  <Text style={s.alertText}>
                    {data.lowStockProducts} sản phẩm sắp hết hàng — nhấn để xem
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#92400E" />
                </TouchableOpacity>
              )}

              <Text style={[s.sectionTitle, { marginTop: 16 }]}>Chức năng</Text>
              <View style={s.navCard}>
                {NAV_ITEMS.map((item, i) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[s.navRow, i < NAV_ITEMS.length - 1 && s.navBorder]}
                    onPress={() =>
                      router.push(
                        item.statusParam
                          ? ({
                              pathname: item.route as any,
                              params: { status: item.statusParam },
                            } as any)
                          : (item.route as any)
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <View style={[s.navIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon as any} size={22} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.navLabel}>{item.label}</Text>
                      <Text style={s.navDesc}>{item.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    backgroundColor: C.primaryDark,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: { marginBottom: 12 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  inactiveBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inactiveBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  errorTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  errorSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  body: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: C.muted },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 14,
    marginBottom: 4,
  },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#92400E' },

  noWarning: {
    alignItems: 'center',
    padding: 40,
    gap: 8,
  },
  noWarningText: { fontSize: 15, fontWeight: '600', color: C.text, textAlign: 'center' },
  noWarningText2: { fontSize: 13, color: C.muted, textAlign: 'center' },

  navCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  navBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  navDesc: { fontSize: 12, color: C.muted },
});
