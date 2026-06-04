import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationsService } from '@/services/notifications.service';
import ErrorScreen from '@/components/ErrorScreen';
import EmptyState from '@/components/EmptyState';
import type { Notification, NotificationType } from '@/types';
import { C } from '@/constants/Colors';

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  OrderStatus: { icon: 'receipt-outline', color: C.primary },
  FlashSale: { icon: 'flash-outline', color: '#F59E0B' },
  Promotion: { icon: 'pricetag-outline', color: '#8B5CF6' },
  System: { icon: 'information-circle-outline', color: '#6B7280' },
};

export default function NotificationsScreen() {
  const { top } = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async (nextPage: number, reset = false) => {
    if (reset) setHasError(false);
    try {
      const res = await notificationsService.getAll(nextPage, 20);
      setNotifications(prev => (reset ? (res.items ?? []) : [...prev, ...(res.items ?? [])]));
      setHasMore(nextPage < res.totalPages);
      setPage(nextPage);
    } catch {
      if (reset) setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(1, true);
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    load(page + 1);
  };

  const handleTap = async (item: Notification) => {
    if (!item.isRead) {
      await notificationsService.markRead(item.id).catch(() => {
        if (__DEV__) console.warn('Failed to mark notification as read');
      });
      setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)));
    }
    if (item.type === 'OrderStatus' && item.data?.orderId) {
      router.push(`/order/${item.data.orderId}` as any);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationsService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      if (__DEV__) console.warn('Failed to mark all notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderItem = ({ item }: { item: Notification }) => {
    const cfg = TYPE_CONFIG[item.type];
    return (
      <TouchableOpacity
        style={[s.item, !item.isRead && s.itemUnread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.8}
      >
        <View style={[s.iconWrap, { backgroundColor: cfg.color + '18' }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
          {!item.isRead && <View style={s.unreadDot} />}
        </View>
        <View style={s.content}>
          <Text style={[s.title, !item.isRead && s.titleBold]}>{item.title}</Text>
          <Text style={s.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={s.date}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {item.type === 'OrderStatus' && item.data?.orderId && (
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={s.markAllBtn}
            onPress={handleMarkAll}
            disabled={markingAll}
            activeOpacity={0.8}
          >
            {markingAll ? (
              <ActivityIndicator color="rgba(255,255,255,0.8)" size="small" />
            ) : (
              <Text style={s.markAllText}>Đọc tất cả</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : hasError ? (
        <ErrorScreen
          type="network"
          onRetry={() => {
            setLoading(true);
            load(1, true);
          }}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <EmptyState icon="notifications-off-outline" title="Không có thông báo nào" />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ padding: 16 }} /> : null
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
    gap: 14,
    backgroundColor: C.primaryDark,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  markAllText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  list: { padding: 16, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  itemUnread: { borderColor: C.primary + '33', backgroundColor: '#F0FFFE' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
    borderWidth: 1.5,
    borderColor: C.card,
  },
  content: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: '500', color: C.text, lineHeight: 20 },
  titleBold: { fontWeight: '700' },
  body: { fontSize: 13, color: C.muted, lineHeight: 18 },
  date: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  sep: { height: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 80 },
  emptyText: { fontSize: 14, color: C.muted },
});
