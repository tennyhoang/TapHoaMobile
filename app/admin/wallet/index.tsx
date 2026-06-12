import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { C } from '@/constants/Colors';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { adminService } from '@/services/admin.service';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import type { WithdrawRequest } from '@/types';
import EmptyState from '@/components/EmptyState';

type TabStatus = 'Pending' | 'Completed' | 'Rejected';

const TABS: { value: TabStatus; label: string }[] = [
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'Completed', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Đã từ chối' },
];

function ProcessModal({
  request,
  action,
  onConfirm,
  onClose,
  loading,
}: {
  request: WithdrawRequest;
  action: 'complete' | 'reject';
  onConfirm: (note: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [note, setNote] = useState('');
  const isReject = action === 'reject';

  return (
    <KeyboardAwareScreen style={p.container}>
      <View style={p.header}>
        <Text style={p.title}>{isReject ? 'Từ chối yêu cầu' : 'Xác nhận đã chuyển tiền'}</Text>
        <TouchableOpacity onPress={onClose} style={p.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>
      <View style={p.body}>
        <View style={p.infoCard}>
          <Text style={p.infoLabel}>Người yêu cầu</Text>
          <Text style={p.infoValue}>
            {request.userName} ({request.userEmail})
          </Text>
          <Text style={p.infoLabel}>Ngân hàng</Text>
          <Text style={p.infoValue}>
            {request.bankName} — {request.accountNumber} — {request.holderName}
          </Text>
          <Text style={p.infoLabel}>Số tiền</Text>
          <Text style={[p.infoValue, { color: C.primary, fontWeight: '800', fontSize: 18 }]}>
            {formatCurrency(request.amount)}
          </Text>
        </View>

        <Text style={p.label}>Ghi chú (tuỳ chọn)</Text>
        <TextInput
          style={p.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder={isReject ? 'Lý do từ chối...' : 'Ghi chú...'}
          placeholderTextColor={C.muted}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            p.actionBtn,
            isReject ? p.actionBtnRed : p.actionBtnGreen,
            loading && { opacity: 0.6 },
          ]}
          onPress={() => onConfirm(note)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons
                name={isReject ? 'close-circle-outline' : 'checkmark-circle-outline'}
                size={18}
                color="#fff"
              />
              <Text style={p.actionBtnText}>
                {isReject ? 'Từ chối và hoàn tiền' : 'Xác nhận hoàn thành'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAwareScreen>
  );
}

export default function AdminWalletScreen() {
  const { t } = useTranslation();
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [tab, setTab] = useState<TabStatus>('Pending');
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<{
    req: WithdrawRequest;
    action: 'complete' | 'reject';
  } | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await adminService.wallet.getWithdrawRequests(tab);
        setRequests(data);
      } catch {
        show('Không thể tải danh sách', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleTabChange = (t: TabStatus) => {
    setTab(t);
    setLoading(true);
  };

  const handleProcess = async (note: string) => {
    if (!selected) return;
    setProcessing(true);
    try {
      if (selected.action === 'complete') {
        await adminService.wallet.completeWithdraw(selected.req.id, note || null);
        show('Đã xác nhận hoàn thành');
      } else {
        await adminService.wallet.rejectWithdraw(selected.req.id, note || null);
        show('Đã từ chối và hoàn tiền');
      }
      setSelected(null);
      load(true);
    } catch {
      show('Thao tác thất bại', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const renderItem = ({ item }: { item: WithdrawRequest }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <Text style={s.userName}>{item.userName}</Text>
          <Text style={s.userEmail}>{item.userEmail}</Text>
          <View style={s.bankInfo}>
            <Ionicons name="card-outline" size={13} color={C.muted} />
            <Text style={s.bankText}>
              {item.bankName} · {item.accountNumber} · {item.holderName}
            </Text>
          </View>
          <Text style={s.date}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {item.adminNote ? <Text style={s.adminNote}>Ghi chú: {item.adminNote}</Text> : null}
        </View>
        <Text style={s.amount}>{formatCurrency(item.amount)}</Text>
      </View>

      {tab === 'Pending' && (
        <View style={s.cardBtns}>
          <TouchableOpacity
            style={s.completeBtn}
            onPress={() => setSelected({ req: item, action: 'complete' })}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color="#16A34A" />
            <Text style={s.completeBtnText}>{t('common.confirm')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.rejectBtn}
            onPress={() => setSelected({ req: item, action: 'reject' })}
          >
            <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
            <Text style={s.rejectBtnText}>{t('admin.withdraw_reject')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (unauthorized) return null;

  return (
    <View style={s.root}>
      <ScreenHeader title="Quản lý rút tiền" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBar}
        contentContainerStyle={s.tabContent}
      >
        {TABS.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[s.tab, tab === t.value && s.tabActive]}
            onPress={() => handleTabChange(t.value)}
          >
            <Text style={[s.tabText, tab === t.value && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
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
          ListEmptyComponent={<EmptyState icon="wallet-outline" title="Không có yêu cầu nào" />}
        />
      )}

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <ProcessModal
            request={selected.req}
            action={selected.action}
            onConfirm={handleProcess}
            onClose={() => setSelected(null)}
            loading={processing}
          />
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    flexGrow: 0,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: C.muted },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardLeft: { flex: 1, gap: 3 },
  userName: { fontSize: 14, fontWeight: '700', color: C.text },
  userEmail: { fontSize: 12, color: C.muted },
  bankInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  bankText: { fontSize: 12, color: C.muted, flex: 1 },
  date: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  adminNote: { fontSize: 12, color: '#F59E0B', fontStyle: 'italic', marginTop: 2 },
  amount: { fontSize: 17, fontWeight: '800', color: C.primary },
  cardBtns: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  completeBtnText: { fontSize: 13, color: '#16A34A', fontWeight: '700' },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '700' },
});

const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.card },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  closeBtn: { padding: 4 },
  body: { padding: 20 },
  infoCard: { backgroundColor: C.bg, borderRadius: 12, padding: 14, gap: 4, marginBottom: 16 },
  infoLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  infoValue: { fontSize: 14, color: C.text, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  noteInput: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    fontSize: 14,
    color: C.text,
    height: 100,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  actionBtnGreen: { backgroundColor: '#16A34A' },
  actionBtnRed: { backgroundColor: '#EF4444' },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
