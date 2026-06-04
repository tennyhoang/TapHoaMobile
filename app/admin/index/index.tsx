import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { adminService, type AdminStats } from '@/services/admin.service';
import { C } from '@/constants/Colors';
import { formatCurrency } from '@/lib/utils';

const NAV_ITEMS = [
  {
    icon: 'receipt-outline',
    label: 'Quản lý đơn hàng',
    desc: 'Xem và cập nhật trạng thái đơn',
    color: '#3B82F6',
    route: '/admin/orders',
  },
  {
    icon: 'image-outline',
    label: 'Quản lý sản phẩm',
    desc: 'Cập nhật ảnh và thông tin sản phẩm',
    color: '#FF6B00',
    route: '/admin/products',
  },
];

export default function AdminDashboard() {
  const unauthorized = useRoleGuard('Admin');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    adminService
      .getStats()
      .then(setStats)
      .catch(() => {
        if (__DEV__) console.warn('Failed to load admin stats');
      })
      .finally(() => setLoadingStats(false));
  }, []);

  if (unauthorized) return null;

  return (
    <View style={s.root}>
      <ScreenHeader title="Admin Dashboard" />

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <Text style={s.sectionTitle}>Tổng quan</Text>
        {loadingStats ? (
          <View style={s.statsLoading}>
            <ActivityIndicator color={C.primary} />
          </View>
        ) : stats ? (
          <View style={s.statsGrid}>
            <View style={[s.statCard, { borderLeftColor: C.primary }]}>
              <Text style={s.statValue}>{stats.totalOrders.toLocaleString()}</Text>
              <Text style={s.statLabel}>Tổng đơn hàng</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#22C55E' }]}>
              <Text style={s.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
              <Text style={s.statLabel}>Doanh thu</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={s.statValue}>{stats.pendingOrders}</Text>
              <Text style={s.statLabel}>Chờ xử lý</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#8B5CF6' }]}>
              <Text style={s.statValue}>{stats.totalUsers.toLocaleString()}</Text>
              <Text style={s.statLabel}>Người dùng</Text>
            </View>
          </View>
        ) : (
          <View style={s.statsUnavailable}>
            <Text style={s.statsUnavailableText}>Không tải được thống kê</Text>
          </View>
        )}

        {/* Navigation */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Quản lý</Text>
        <View style={s.navCard}>
          {NAV_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[s.navRow, i < NAV_ITEMS.length - 1 && s.navBorder]}
              onPress={() => router.push(item.route as any)}
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
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },

  statsLoading: { height: 100, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    padding: 16,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: C.muted },
  statsUnavailable: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statsUnavailableText: { fontSize: 13, color: C.muted },

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
