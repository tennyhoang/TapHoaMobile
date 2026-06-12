import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '@/components/ScreenHeader';
import { C } from '@/constants/Colors';
import { useLoyaltyBalance, useLoyaltyTransactions } from '@/lib/hooks/useLoyalty';
import EmptyState from '@/components/EmptyState';

export default function LoyaltyScreen() {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(1);
  const { data: balance, isLoading: balLoading } = useLoyaltyBalance();
  const { data: txns, isLoading: txLoading, refetch, isRefetching } = useLoyaltyTransactions(page);

  const allTxns = txns?.items ?? [];
  const totalPages = txns?.totalPages ?? 1;

  return (
    <View style={s.root}>
      <ScreenHeader title={t('loyalty.title')} />

      <FlatList
        data={allTxns}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.primary} />
        }
        ListHeaderComponent={
          <>
            {balLoading ? (
              <View style={s.balLoading}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            ) : balance ? (
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.balanceCard}
              >
                <View style={s.balIcon}>
                  <Ionicons name="star" size={24} color="#fff" />
                </View>
                <Text style={s.balLabel}>{t('loyalty.balance_label')}</Text>
                <Text style={s.balValue}>{balance.points.toLocaleString()}</Text>
                <Text style={s.balSub}>
                  {t('loyalty.lifetime', { points: balance.lifetimePoints.toLocaleString() })}
                </Text>
              </LinearGradient>
            ) : (
              <View style={s.balError}>
                <Text style={s.balErrorText}>{t('loyalty.load_error')}</Text>
              </View>
            )}

            <Text style={s.sectionTitle}>{t('loyalty.history')}</Text>
          </>
        }
        ListEmptyComponent={
          txLoading ? (
            <ActivityIndicator color={C.primary} style={{ padding: 20 }} />
          ) : (
            <EmptyState icon="star-outline" title={t('loyalty.empty')} />
          )
        }
        renderItem={({ item }) => {
          const isEarn = item.type === 'Earned';
          return (
            <View style={s.txnCard}>
              <View style={[s.txnDot, { backgroundColor: isEarn ? '#16A34A' : '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.txnDesc}>{item.description}</Text>
                <Text style={s.txnDate}>
                  {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={[s.txnPoints, { color: isEarn ? '#16A34A' : '#EF4444' }]}>
                {isEarn ? '+' : '-'}
                {item.points.toLocaleString()}
              </Text>
            </View>
          );
        }}
        onEndReached={() => {
          if (page < totalPages) setPage(p => p + 1);
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, flexGrow: 1 },
  balLoading: {
    height: 160,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  balIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  balLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  balValue: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 4 },
  balSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  balError: { height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  balErrorText: { fontSize: 13, color: C.muted },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
  },
  txnDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  txnDesc: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  txnDate: { fontSize: 11, color: C.muted },
  txnPoints: { fontSize: 15, fontWeight: '800' },
});
