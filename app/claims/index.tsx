import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { claimsService } from '@/services/claims.service';
import ErrorScreen from '@/components/ErrorScreen';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import type { Claim, ClaimStatus, ClaimType } from '@/types';
import { C } from '@/constants/Colors';

const STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; bg: string }> = {
  Pending: { label: 'Chờ xử lý', color: '#D97706', bg: '#FEF3C7' },
  UnderReview: { label: 'Đang xem xét', color: '#2563EB', bg: '#DBEAFE' },
  Resolved: { label: 'Đã giải quyết', color: '#16A34A', bg: '#DCFCE7' },
  Rejected: { label: 'Từ chối', color: '#DC2626', bg: '#FEE2E2' },
};

const TYPE_LABEL: Record<ClaimType, string> = {
  DamagedProduct: 'Sản phẩm hư hỏng',
  WrongProduct: 'Sản phẩm sai',
  MissingProduct: 'Thiếu sản phẩm',
  LateDelivery: 'Giao hàng trễ',
  Other: 'Khác',
};

export default function ClaimsScreen() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState<'network' | 'error' | false>(false);

  const load = useCallback(async () => {
    setHasError(false);
    try {
      const res = await claimsService.getMyClaims({ pageSize: 50 });
      setClaims(res.items ?? []);
    } catch (e) {
      setHasError(e instanceof TypeError ? 'network' : 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const renderClaim = ({ item }: { item: Claim }) => {
    const statusCfg = STATUS_CONFIG[item.status];
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.claimId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <View style={[s.badge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[s.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <View style={s.typeRow}>
          <Ionicons name="alert-circle-outline" size={14} color={C.muted} />
          <Text style={s.typeText}>{TYPE_LABEL[item.type]}</Text>
        </View>

        <Text style={s.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={s.orderRow}>
          <Ionicons name="receipt-outline" size={13} color={C.muted} />
          <Text style={s.orderIdText}>Đơn #{item.orderId.slice(0, 8).toUpperCase()}</Text>
        </View>

        <View style={s.cardFooter}>
          <Text style={s.date}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
          {item.resolution && (
            <Text style={s.resolution} numberOfLines={1}>
              Kết quả: {item.resolution}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <ScreenHeader title="Khiếu nại của tôi" />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : hasError ? (
        <ErrorScreen
          type={hasError || 'error'}
          onRetry={() => {
            setLoading(true);
            load();
          }}
        />
      ) : claims.length === 0 ? (
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="Chưa có khiếu nại nào"
          subtitle="Nếu có vấn đề với đơn hàng, hãy gửi khiếu nại từ chi tiết đơn hàng"
        />
      ) : (
        <FlatList
          data={claims}
          keyExtractor={item => item.id}
          renderItem={renderClaim}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={C.primary}
            />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimId: { fontSize: 13, fontWeight: '700', color: C.text, fontVariant: ['tabular-nums'] },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeText: { fontSize: 13, color: C.muted, fontWeight: '500' },
  description: { fontSize: 13, color: C.text, lineHeight: 18 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orderIdText: { fontSize: 12, color: C.muted, fontVariant: ['tabular-nums'] },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: C.muted },
  resolution: { fontSize: 12, color: '#16A34A', flex: 1, textAlign: 'right', marginLeft: 8 },
});
