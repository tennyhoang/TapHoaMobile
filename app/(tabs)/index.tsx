import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, Platform, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { router } from 'expo-router';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
};

const CATEGORIES = [
  { icon: 'leaf-outline', label: 'Rau củ', color: '#22C55E' },
  { icon: 'fish-outline', label: 'Hải sản', color: '#3B82F6' },
  { icon: 'nutrition-outline', label: 'Trái cây', color: '#F59E0B' },
  { icon: 'egg-outline', label: 'Trứng & Sữa', color: '#EC4899' },
];

export default function HomeScreen() {
  const { user } = useAuth();

  const firstName = user?.fullName?.split(' ').pop() ?? 'bạn';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerBlob} />
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Xin chào, {firstName} 👋</Text>
            <Text style={s.subGreeting}>Hôm nay muốn ăn gì?</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn}>
            <Ionicons name="person-circle" size={40} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={C.muted} />
          <Text style={s.searchPlaceholder}>Tìm thực phẩm tươi ngon...</Text>
        </View>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Categories */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Danh mục</Text>
          <View style={s.catRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.label} style={s.catItem} activeOpacity={0.8}>
                <View style={[s.catIcon, { backgroundColor: cat.color + '18' }]}>
                  <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                </View>
                <Text style={s.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Banner */}
        <View style={s.banner}>
          <View style={s.bannerBlob} />
          <View>
            <Text style={s.bannerBadge}>Flash Sale</Text>
            <Text style={s.bannerTitle}>Rau củ VietGAP{'\n'}giảm đến 40%</Text>
            <TouchableOpacity style={s.bannerBtn}>
              <Text style={s.bannerBtnText}>Mua ngay</Text>
              <Ionicons name="arrow-forward" size={14} color={C.primary} />
            </TouchableOpacity>
          </View>
          <Ionicons name="leaf" size={80} color="rgba(255,255,255,0.15)" style={s.bannerIcon} />
        </View>

        {/* Coming soon */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sản phẩm nổi bật</Text>
          <View style={s.comingSoon}>
            <Ionicons name="construct-outline" size={32} color={C.muted} />
            <Text style={s.comingSoonText}>Đang phát triển — sắp ra mắt</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.primaryDark,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerBlob: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.65)' },
  avatarBtn: { padding: 2 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 16, height: 46,
  },
  searchPlaceholder: { fontSize: 14, color: '#9CA3AF' },

  body: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 14 },

  catRow: { flexDirection: 'row', justifyContent: 'space-between' },
  catItem: { alignItems: 'center', width: '22%' },
  catIcon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  catLabel: { fontSize: 12, fontWeight: '500', color: C.text, textAlign: 'center' },

  banner: {
    marginHorizontal: 20, marginTop: 24,
    backgroundColor: C.primaryDark, borderRadius: 20,
    padding: 22, overflow: 'hidden',
    flexDirection: 'row', justifyContent: 'space-between',
  },
  bannerBlob: {
    position: 'absolute', top: -30, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bannerBadge: {
    fontSize: 11, fontWeight: '700', color: '#F59E0B',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', lineHeight: 26, marginBottom: 14 },
  bannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start',
  },
  bannerBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
  bannerIcon: { position: 'absolute', right: 16, bottom: 12 },

  comingSoon: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12,
  },
  comingSoonText: { fontSize: 14, color: C.muted },
});
