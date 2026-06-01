import React, { useState, useEffect, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { walletService } from '@/services/wallet.service';
import { formatCurrency } from '@/lib/utils';
import type { WalletTransaction, WalletTransactionType } from '@/types';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
};

const TX_CONFIG: Record<WalletTransactionType, { label: string; icon: string; color: string }> = {
  Credit: { label: 'Tiền vào', icon: 'add-circle-outline', color: '#22C55E' },
  Debit: { label: 'Tiền ra', icon: 'remove-circle-outline', color: '#EF4444' },
};

export default function WalletScreen() {
  const { top } = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.balance);
    } catch {
      /* silent */
    }
  };

  const loadTransactions = useCallback(async (nextPage: number, reset = false) => {
    try {
      const res = await walletService.getTransactions(nextPage, 20);
      setTransactions(prev => (reset ? res.items : [...prev, ...res.items]));
      setHasMore(nextPage < res.totalPages);
      setPage(nextPage);
    } catch {
      /* silent */
    }
  }, []);

  const load = useCallback(async () => {
    await Promise.all([loadBalance(), loadTransactions(1, true)]);
    setLoading(false);
    setRefreshing(false);
  }, [loadTransactions]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const onEndReached = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadTransactions(page + 1);
    setLoadingMore(false);
  };

  const renderTx = ({ item }: { item: WalletTransaction }) => {
    const cfg = TX_CONFIG[item.type];
    const isCredit = item.type === 'Credit';
    return (
      <View style={s.txRow}>
        <View style={[s.txIcon, { backgroundColor: cfg.color + '18' }]}>
          <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
        </View>
        <View style={s.txMid}>
          <Text style={s.txLabel}>{cfg.label}</Text>
          {item.description ? (
            <Text style={s.txDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <Text style={s.txDate}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={[s.txAmount, { color: isCredit ? '#22C55E' : '#EF4444' }]}>
          {isCredit ? '+' : '-'}
          {formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ví của tôi</Text>
      </View>

      {/* Balance card */}
      <View style={s.balanceCard}>
        <View style={s.balanceBlob} />
        <Text style={s.balanceHint}>Số dư khả dụng</Text>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" style={{ marginTop: 8 }} />
        ) : (
          <Text style={s.balanceAmount}>{formatCurrency(balance)}</Text>
        )}
        <View style={s.balanceFooter}>
          <Ionicons name="wallet-outline" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={s.balanceFooterText}>Ví TapHoa</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={renderTx}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            transactions.length > 0 ? <Text style={s.listHeader}>Lịch sử giao dịch</Text> : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyText}>Chưa có giao dịch nào</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ padding: 16 }} /> : null
          }
          ItemSeparatorComponent={() => <View style={s.sep} />}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  balanceCard: {
    backgroundColor: C.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  balanceBlob: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceHint: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  balanceFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  list: { padding: 16, paddingBottom: 32 },
  listHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMid: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  txDesc: { fontSize: 12, color: C.muted, marginBottom: 2 },
  txDate: { fontSize: 11, color: '#9CA3AF' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  sep: { height: 8 },

  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { fontSize: 14, color: C.muted },
});
