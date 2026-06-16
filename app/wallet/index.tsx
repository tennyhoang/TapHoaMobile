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
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { useTranslation } from 'react-i18next';
import { walletService } from '@/services/wallet.service';
import { useToast } from '@/components/Toast';
import { biometrics } from '@/lib/biometrics';
import * as ScreenCapture from 'expo-screen-capture';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';
import type { WalletTransaction, WalletTransactionType } from '@/types';
import { C } from '@/constants/Colors';

const BANK_CODE = 'MB';
const ACCOUNT_NO = '0000000001';
const ACCOUNT_NAME = 'TAPHOA TEST';

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

const TX_CONFIG: Record<WalletTransactionType, { label: string; icon: string; color: string }> = {
  Credit: { label: 'Tiền vào', icon: 'add-circle-outline', color: '#22C55E' },
  Debit: { label: 'Tiền ra', icon: 'remove-circle-outline', color: '#EF4444' },
};

function buildQrUrl(amount: number, ref: string) {
  return `https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NO}-compact2.jpg?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(ref)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
}

export default function WalletScreen() {
  const { t } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();
  const { show } = useToast();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Top-up modal state
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [topUpStep, setTopUpStep] = useState<'pick' | 'qr'>('pick');
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Withdraw modal state
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawHolder, setWithdrawHolder] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

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

  // Prevent screenshots on this screen (contains financial data + QR codes)
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

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

  const openTopUp = () => {
    setTopUpStep('pick');
    setSelectedAmount(0);
    setCustomAmount('');
    setPaymentRef('');
    setTopUpVisible(true);
  };

  const openWithdraw = () => {
    setWithdrawAmount('');
    setWithdrawBank('');
    setWithdrawAccount('');
    setWithdrawHolder('');
    setWithdrawVisible(true);
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount < 50_000) {
      show('Số tiền rút tối thiểu là 50.000đ', 'error');
      return;
    }
    if (amount > balance) {
      show('Số tiền rút vượt quá số dư khả dụng', 'error');
      return;
    }
    if (!withdrawBank.trim() || !withdrawAccount.trim() || !withdrawHolder.trim()) {
      show('Vui lòng điền đầy đủ thông tin ngân hàng', 'error');
      return;
    }
    const confirmed = await biometrics.authenticate('Xác nhận yêu cầu rút tiền');
    if (!confirmed) return;
    setWithdrawing(true);
    try {
      await walletService.createWithdrawRequest({
        amount,
        bankName: withdrawBank.trim(),
        accountNumber: withdrawAccount.trim(),
        holderName: withdrawHolder.trim(),
      });
      setWithdrawVisible(false);
      show('Yêu cầu rút tiền đã được ghi nhận, xử lý trong 1-2 ngày làm việc');
      await load();
    } catch {
      show('Không thể gửi yêu cầu rút tiền, thử lại sau', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const finalAmount = (() => {
    if (selectedAmount > 0) return selectedAmount;
    const n = parseInt(customAmount.replace(/\D/g, ''), 10);
    return isNaN(n) ? 0 : n;
  })();

  const handleConfirmAmount = async () => {
    if (finalAmount < 10_000) {
      show('Số tiền tối thiểu là 10.000đ', 'error');
      return;
    }
    const confirmed = await biometrics.authenticate('Xác nhận nạp tiền vào ví');
    if (!confirmed) return;
    try {
      const res = await walletService.initiateTopup(finalAmount);
      setPaymentRef(res.paymentRef);
      setTopUpStep('qr');
    } catch {
      show('Không thể tạo yêu cầu nạp tiền', 'error');
    }
  };

  const handleConfirmTransfer = async () => {
    setConfirming(true);
    try {
      await load();
      setTopUpVisible(false);
      show('Đã ghi nhận, số dư sẽ cập nhật sau khi chuyển khoản xác nhận');
    } catch {
      show('Chưa xác nhận được, vui lòng thử lại sau', 'error');
    } finally {
      setConfirming(false);
    }
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
    <KeyboardAwareScreen style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('wallet.title')}</Text>
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

      {/* Action buttons */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.actionBtn} onPress={openTopUp} activeOpacity={0.8}>
          <View style={s.actionIcon}>
            <Ionicons name="add-circle-outline" size={22} color={C.primary} />
          </View>
          <Text style={s.actionLabel}>{t('wallet.top_up')}</Text>
        </TouchableOpacity>
        <View style={s.actionDivider} />
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => router.push('/orders' as any)}
          activeOpacity={0.8}
        >
          <View style={s.actionIcon}>
            <Ionicons name="receipt-outline" size={22} color="#8B5CF6" />
          </View>
          <Text style={s.actionLabel}>Lịch sử dùng</Text>
        </TouchableOpacity>
        <View style={s.actionDivider} />
        <TouchableOpacity style={s.actionBtn} onPress={openWithdraw} activeOpacity={0.8}>
          <View style={s.actionIcon}>
            <Ionicons name="arrow-up-circle-outline" size={22} color="#F59E0B" />
          </View>
          <Text style={s.actionLabel}>{t('wallet.withdraw')}</Text>
        </TouchableOpacity>
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
            transactions.length > 0 ? (
              <Text style={s.listHeader}>{t('wallet.transactions')}</Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title={t('wallet.no_transactions')} />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ padding: 16 }} /> : null
          }
          ItemSeparatorComponent={() => <View style={s.sep} />}
        />
      )}

      {/* ── TOP-UP MODAL ── */}
      <Modal
        visible={topUpVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTopUpVisible(false)}
      >
        <KeyboardAwareScreen style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setTopUpVisible(false)} />
          <View style={[s.sheet, { paddingBottom: bottom + 24 }]}>
            {/* Handle */}
            <View style={s.sheetHandle} />

            {topUpStep === 'pick' ? (
              <>
                <Text style={s.sheetTitle}>Nạp tiền vào ví</Text>
                <Text style={s.sheetSub}>Chọn hoặc nhập số tiền muốn nạp</Text>

                <View style={s.presetGrid}>
                  {PRESET_AMOUNTS.map(amt => (
                    <TouchableOpacity
                      key={amt}
                      style={[s.presetChip, selectedAmount === amt && s.presetChipActive]}
                      onPress={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[s.presetChipText, selectedAmount === amt && s.presetChipTextActive]}
                      >
                        {formatCurrency(amt)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={s.customWrap}>
                  <Text style={s.customLabel}>Hoặc nhập số tiền khác</Text>
                  <View style={s.customInputRow}>
                    <TextInput
                      style={s.customInput}
                      placeholder="VD: 300.000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={customAmount}
                      onChangeText={v => {
                        setCustomAmount(v);
                        setSelectedAmount(0);
                      }}
                    />
                    <Text style={s.customUnit}>đ</Text>
                  </View>
                </View>

                {finalAmount > 0 && (
                  <View style={s.amountPreview}>
                    <Text style={s.amountPreviewLabel}>Số tiền nạp</Text>
                    <Text style={s.amountPreviewValue}>{formatCurrency(finalAmount)}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.confirmBtn, finalAmount < 10_000 && s.confirmBtnDim]}
                  onPress={handleConfirmAmount}
                  disabled={finalAmount < 10_000}
                  activeOpacity={0.85}
                >
                  <Text style={s.confirmBtnText}>Tiếp tục</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={s.backRow}
                  onPress={() => setTopUpStep('pick')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color={C.primary} />
                  <Text style={s.backRowText}>Thay đổi số tiền</Text>
                </TouchableOpacity>

                <Text style={s.sheetTitle}>Quét mã chuyển khoản</Text>
                <Text style={s.sheetSub}>
                  Nạp{' '}
                  <Text style={{ fontWeight: '800', color: C.primary }}>
                    {formatCurrency(finalAmount)}
                  </Text>{' '}
                  vào ví TapHoa
                </Text>

                <View style={s.qrCard}>
                  <Image
                    source={{ uri: buildQrUrl(finalAmount, paymentRef) }}
                    style={s.qrImg}
                    contentFit="contain"
                  />
                </View>

                <View style={s.infoBox}>
                  {[
                    { label: 'Ngân hàng', value: 'MB Bank' },
                    { label: 'Số tài khoản', value: ACCOUNT_NO },
                    { label: 'Số tiền', value: formatCurrency(finalAmount) },
                    { label: 'Nội dung CK', value: paymentRef },
                  ].map(row => (
                    <View key={row.label} style={s.infoRow}>
                      <Text style={s.infoLabel}>{row.label}</Text>
                      <Text style={[s.infoValue, row.label === 'Nội dung CK' && s.infoRef]}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={s.qrHint}>
                  Hệ thống tự động xác nhận sau khi nhận tiền.{'\n'}
                  Nhập đúng nội dung chuyển khoản để xử lý nhanh.
                </Text>

                <TouchableOpacity
                  style={[s.confirmBtn, confirming && s.confirmBtnDim]}
                  onPress={handleConfirmTransfer}
                  disabled={confirming}
                  activeOpacity={0.85}
                >
                  {confirming ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={s.confirmBtnText}>Đã chuyển khoản xong</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAwareScreen>
      </Modal>

      {/* ── WITHDRAW MODAL ── */}
      <Modal
        visible={withdrawVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWithdrawVisible(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setWithdrawVisible(false)} />
          <View style={[s.sheet, { paddingBottom: bottom + 24 }]}>
            <View style={s.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.sheetTitle}>Rút tiền từ ví</Text>
              <Text style={s.sheetSub}>
                Số dư khả dụng:{' '}
                <Text style={{ fontWeight: '800', color: C.primary }}>
                  {formatCurrency(balance)}
                </Text>
              </Text>

              {/* Amount */}
              <Text style={s.customLabel}>Số tiền muốn rút</Text>
              <View style={[s.customInputRow, { marginBottom: 14 }]}>
                <TextInput
                  style={s.customInput}
                  placeholder="Tối thiểu 50.000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />
                <Text style={s.customUnit}>đ</Text>
              </View>

              {/* Bank info */}
              <Text style={[s.customLabel, { marginBottom: 10 }]}>Thông tin ngân hàng</Text>
              {[
                {
                  label: 'Tên ngân hàng',
                  value: withdrawBank,
                  setter: setWithdrawBank,
                  placeholder: 'VD: MB Bank, Vietcombank...',
                },
                {
                  label: 'Số tài khoản',
                  value: withdrawAccount,
                  setter: setWithdrawAccount,
                  placeholder: 'Số tài khoản thụ hưởng',
                  keyboard: 'numeric' as const,
                },
                {
                  label: 'Chủ tài khoản',
                  value: withdrawHolder,
                  setter: setWithdrawHolder,
                  placeholder: 'Tên chủ tài khoản (in hoa)',
                },
              ].map(field => (
                <View key={field.label} style={{ marginBottom: 12 }}>
                  <Text style={[s.customLabel, { fontSize: 12, marginBottom: 6 }]}>
                    {field.label}
                  </Text>
                  <View style={s.customInputRow}>
                    <TextInput
                      style={s.customInput}
                      placeholder={field.placeholder}
                      placeholderTextColor="#9CA3AF"
                      keyboardType={field.keyboard ?? 'default'}
                      value={field.value}
                      onChangeText={field.setter}
                      autoCapitalize={field.label === 'Chủ tài khoản' ? 'characters' : 'none'}
                    />
                  </View>
                </View>
              ))}

              <View
                style={[
                  s.qrHint,
                  { marginBottom: 16, padding: 12, borderRadius: 10, backgroundColor: '#FEF3C7' },
                ]}
              >
                <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>
                  Yêu cầu rút tiền sẽ được xử lý trong 1–2 ngày làm việc. Kiểm tra kỹ thông tin
                  trước khi xác nhận.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  s.confirmBtn,
                  { backgroundColor: '#F59E0B' },
                  withdrawing && s.confirmBtnDim,
                ]}
                onPress={handleWithdraw}
                disabled={withdrawing}
                activeOpacity={0.85}
              >
                {withdrawing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="arrow-up-circle-outline" size={18} color="#fff" />
                    <Text style={s.confirmBtnText}>Xác nhận rút tiền</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAwareScreen>
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
  balanceFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  balanceFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
  },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: C.text },
  actionDivider: { width: 1, height: 40, backgroundColor: C.border },

  list: { padding: 16, paddingBottom: 32 },
  listHeader: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
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

  // Modal / Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  sheetSub: { fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 18 },

  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  presetChipActive: { borderColor: C.primary, backgroundColor: '#E5F9FA' },
  presetChipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  presetChipTextActive: { color: C.primary },

  customWrap: { marginBottom: 16 },
  customLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 48,
  },
  customInput: { flex: 1, fontSize: 16, fontWeight: '700', color: C.text },
  customUnit: { fontSize: 14, fontWeight: '600', color: C.muted },

  amountPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E5F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  amountPreviewLabel: { fontSize: 13, color: C.muted, fontWeight: '500' },
  amountPreviewValue: { fontSize: 18, fontWeight: '800', color: C.primary },

  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: C.primary,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnDim: { opacity: 0.5 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backRowText: { fontSize: 13, fontWeight: '600', color: C.primary },

  qrCard: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  qrImg: { width: 200, height: 200 },

  infoBox: {
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoLabel: { fontSize: 13, color: C.muted },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.text },
  infoRef: { fontSize: 15, fontWeight: '800', color: C.primaryDark, letterSpacing: 0.5 },

  qrHint: {
    fontSize: 12,
    color: C.primaryDark,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.7,
    marginBottom: 20,
  },
});
