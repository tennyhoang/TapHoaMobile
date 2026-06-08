import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { agentService } from '@/services/agent.service';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/types';

// Agent screen uses its own brand palette (indigo/purple), intentionally separate from C
const C = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryDark: '#3730A3',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
  purple: '#7C3AED',
  indigo: '#4F46E5',
  green: '#22C55E',
};

type Tab = 'incoming' | 'ready' | 'history';

export default function AgentScreen() {
  const unauthorized = useRoleGuard('Agent');
  const { top } = useSafeAreaInsets();
  const { show } = useToast();

  const [tab, setTab] = useState<Tab>('incoming');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    try {
      const [inc, rdy] = await Promise.all([
        agentService.getOrders('ShippingToHub'),
        agentService.getOrders('InHub_ReadyForPickup'),
      ]);
      setIncomingOrders(inc.items);
      setReadyOrders(rdy.items);
    } catch {
      show('Không tải được dữ liệu', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await agentService.getOrders('Completed');
      setHistoryOrders(res.items);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    if (tab === 'history') loadHistory();
  }, [load, loadHistory, tab]);

  const handleArrive = (order: Order) => {
    Alert.alert('Xác nhận hàng đến Hub', `Đơn #${order.id.slice(0, 8).toUpperCase()} đã đến Hub?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          setActioningId(order.id);
          try {
            await agentService.arrive(order.id);
            show('Đã xác nhận hàng đến Hub!');
            load();
          } catch {
            show('Xác nhận thất bại', 'error');
          } finally {
            setActioningId(null);
          }
        },
      },
    ]);
  };

  const handleComplete = (order: Order) => {
    Alert.alert(
      'Khách đã lấy hàng',
      `Xác nhận khách đã lấy đơn #${order.id.slice(0, 8).toUpperCase()}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Hoàn tất',
          onPress: async () => {
            setActioningId(order.id);
            try {
              await agentService.completePickup(order.id);
              show('Hoàn tất giao nhận!');
              load();
            } catch {
              show('Xác nhận thất bại', 'error');
            } finally {
              setActioningId(null);
            }
          },
        },
      ]
    );
  };

  const filtered = (orders: Order[]) =>
    search.trim() ? orders.filter(o => o.id.toLowerCase().includes(search.toLowerCase())) : orders;

  const TABS: { key: Tab; label: string; icon: string; count: number; color: string }[] = [
    {
      key: 'incoming',
      label: 'Đang về Hub',
      icon: 'bicycle-outline',
      count: incomingOrders.length,
      color: C.purple,
    },
    {
      key: 'ready',
      label: 'Chờ khách lấy',
      icon: 'cube-outline',
      count: readyOrders.length,
      color: C.indigo,
    },
    {
      key: 'history',
      label: 'Lịch sử',
      icon: 'checkmark-done-outline',
      count: historyOrders.length,
      color: C.green,
    },
  ];

  if (unauthorized) return null;
  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <View style={s.blob} />
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cổng Agent</Text>
        <Text style={s.headerSub}>Quản lý đơn hàng tại Hub của bạn</Text>
        <View style={s.statsRow}>
          {[
            { label: 'Đang về', count: incomingOrders.length, color: '#A78BFA' },
            { label: 'Tại Hub', count: readyOrders.length, color: '#818CF8' },
            { label: 'Hôm nay', count: historyOrders.length, color: '#34D399' },
          ].map(st => (
            <View key={st.label} style={s.statCard}>
              <Text style={[s.statCount, { color: st.color }]}>{st.count}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={t.icon as any} size={17} color={tab === t.key ? t.color : C.muted} />
            <Text style={[s.tabLabel, tab === t.key && { color: t.color }]}>{t.label}</Text>
            {t.count > 0 && (
              <View style={[s.tabBadge, { backgroundColor: t.color }]}>
                <Text style={s.tabBadgeText}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={C.muted} />
        <TextInput
          style={s.searchInput}
          placeholder="Tìm theo mã đơn..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.bodyContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {tab === 'incoming' &&
          (filtered(incomingOrders).length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="bicycle-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyTitle}>Không có đơn nào đang về Hub</Text>
              <Text style={s.emptySub}>Đơn được tài xế vận chuyển đến sẽ xuất hiện ở đây</Text>
            </View>
          ) : (
            filtered(incomingOrders).map(order => (
              <View key={order.id} style={s.orderCard}>
                <View style={[s.orderIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="bicycle-outline" size={18} color={C.purple} />
                </View>
                <View style={s.orderInfo}>
                  <View style={s.orderTopRow}>
                    <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={[s.badge, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={[s.badgeText, { color: C.purple }]}>Đang vận chuyển</Text>
                    </View>
                  </View>
                  <Text style={s.orderMeta}>
                    {order.items.length} sản phẩm · {formatCurrency(order.totalAmount)}
                  </Text>
                  <View style={s.hubRow}>
                    <Ionicons name="location-outline" size={12} color={C.muted} />
                    <Text style={s.hubText} numberOfLines={1}>
                      {order.hub?.name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    s.actionBtn,
                    { backgroundColor: C.indigo },
                    actioningId === order.id && s.actionBtnDim,
                  ]}
                  onPress={() => handleArrive(order)}
                  disabled={actioningId === order.id}
                  activeOpacity={0.85}
                >
                  {actioningId === order.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                      <Text style={s.actionBtnText}>Đã đến Hub</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))
          ))}

        {tab === 'ready' &&
          (filtered(readyOrders).length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyTitle}>Không có đơn chờ giao</Text>
              <Text style={s.emptySub}>Đơn đã về Hub và chờ khách đến lấy sẽ hiện ở đây</Text>
            </View>
          ) : (
            filtered(readyOrders).map(order => (
              <View key={order.id} style={[s.orderCard, s.orderCardReady]}>
                <View style={[s.orderIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="cube-outline" size={18} color={C.indigo} />
                </View>
                <View style={s.orderInfo}>
                  <View style={s.orderTopRow}>
                    <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={[s.badge, { backgroundColor: '#EEF2FF' }]}>
                      <Text style={[s.badgeText, { color: C.indigo }]}>Tại Hub</Text>
                    </View>
                  </View>
                  <Text style={s.orderMeta}>
                    {order.items.length} sản phẩm · {formatCurrency(order.totalAmount)}
                  </Text>
                  <View style={s.hubRow}>
                    <Ionicons name="location-outline" size={12} color={C.muted} />
                    <Text style={s.hubText} numberOfLines={1}>
                      {order.hub?.name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    s.actionBtn,
                    { backgroundColor: C.green },
                    actioningId === order.id && s.actionBtnDim,
                  ]}
                  onPress={() => handleComplete(order)}
                  disabled={actioningId === order.id}
                  activeOpacity={0.85}
                >
                  {actioningId === order.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-outline" size={14} color="#fff" />
                      <Text style={s.actionBtnText}>Đã lấy</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))
          ))}

        {tab === 'history' &&
          (filtered(historyOrders).length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-done-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyTitle}>Chưa có đơn hoàn thành</Text>
              <Text style={s.emptySub}>Lịch sử giao nhận tại Hub sẽ hiện ở đây</Text>
            </View>
          ) : (
            <>
              <Text style={s.historyCount}>{filtered(historyOrders).length} đơn đã hoàn thành</Text>
              {filtered(historyOrders).map(order => (
                <View key={order.id} style={[s.orderCard, s.orderCardDone]}>
                  <View style={[s.orderIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="checkmark-circle" size={18} color={C.green} />
                  </View>
                  <View style={s.orderInfo}>
                    <View style={s.orderTopRow}>
                      <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                      <View style={[s.badge, { backgroundColor: '#F0FDF4' }]}>
                        <Text style={[s.badgeText, { color: C.green }]}>Hoàn thành</Text>
                      </View>
                    </View>
                    <Text style={s.orderMeta}>
                      {order.items.length} sản phẩm · {formatCurrency(order.totalAmount)}
                    </Text>
                    <View style={s.hubRow}>
                      <Ionicons name="location-outline" size={12} color={C.muted} />
                      <Text style={s.hubText} numberOfLines={1}>
                        {order.hub?.name}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: C.primaryDark,
    paddingHorizontal: 16,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statCount: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: C.primary },
  tabLabel: { fontSize: 11, fontWeight: '600', color: C.muted },
  tabBadge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, height: 32 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40, gap: 10 },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orderCardReady: { borderColor: '#C7D2FE' },
  orderCardDone: { borderColor: '#BBF7D0' },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: { flex: 1 },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  orderId: { fontSize: 12, fontWeight: '800', color: C.muted },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  orderMeta: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 3 },
  hubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hubText: { fontSize: 11, color: C.muted, flex: 1 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  actionBtnDim: { opacity: 0.6 },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  historyCount: { fontSize: 12, color: C.muted, marginBottom: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.muted },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
});
