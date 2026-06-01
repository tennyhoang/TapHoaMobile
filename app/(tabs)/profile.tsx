import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

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

const MENU_ITEMS = [
  { icon: 'wallet-outline', label: 'Ví của tôi', color: '#22C55E', route: '/wallet' },
  { icon: 'receipt-outline', label: 'Đơn hàng của tôi', color: C.primary, route: '/orders' },
  { icon: 'heart-outline', label: 'Sản phẩm yêu thích', color: '#F43F5E', route: '/wishlist' },
  { icon: 'location-outline', label: 'Địa chỉ giao hàng', color: '#8B5CF6', route: '/addresses' },
  {
    icon: 'notifications-outline',
    label: 'Thông báo',
    color: '#F59E0B',
    route: '/notifications',
  },
  { icon: 'create-outline', label: 'Chỉnh sửa hồ sơ', color: '#3B82F6', route: '/profile-edit' },
  { icon: 'book-outline', label: 'Cẩm nang mua sắm', color: '#16A34A', route: '/articles/index' },
  { icon: 'help-circle-outline', label: 'Hỗ trợ', color: C.muted, route: null },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={s.header}>
        <View style={s.blob} />
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={s.name}>{user?.fullName}</Text>
          <Text style={s.email}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{user?.role}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuItem, i < MENU_ITEMS.length - 1 && s.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={[s.menuIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {user?.role === 'Admin' && (
          <View style={[s.card, { marginBottom: 16 }]}>
            <TouchableOpacity
              style={s.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/admin/products' as any)}
            >
              <View style={[s.menuIcon, { backgroundColor: '#FF6B0018' }]}>
                <Ionicons name="image-outline" size={20} color="#FF6B00" />
              </View>
              <Text style={s.menuLabel}>Quản lý ảnh sản phẩm</Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={C.error} />
          <Text style={s.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.primaryDark,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 32,
  },
  blob: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarWrap: { alignItems: 'center' },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#FFFFFF' },
  name: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  body: { flex: 1, padding: 20 },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: C.text },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 14,
    height: 52,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: C.error },
});
