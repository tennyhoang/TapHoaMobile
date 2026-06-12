import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { C } from '@/constants/Colors';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { adminService } from '@/services/admin.service';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import type { AdminVoucher, VoucherDiscountType } from '@/types';
import EmptyState from '@/components/EmptyState';

function getDefaultDates() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const end = `${later.getFullYear()}-${pad(later.getMonth() + 1)}-${pad(later.getDate())}T${pad(later.getHours())}:${pad(later.getMinutes())}`;
  return { start, end };
}

function VoucherFormModal({
  initial,
  onSave,
  onClose,
  loading,
}: {
  initial?: AdminVoucher;
  onSave: (p: any) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const isEdit = !!initial;
  const defaults = getDefaultDates();
  const [code, setCode] = useState(initial?.code ?? '');
  const [type, setType] = useState<VoucherDiscountType>(initial?.type ?? 'percent');
  const [value, setValue] = useState(initial ? String(initial.value) : '');
  const [minOrder, setMinOrder] = useState(initial ? String(initial.minOrder) : '');
  const [maxDiscount, setMaxDiscount] = useState(
    initial?.maxDiscount ? String(initial.maxDiscount) : ''
  );
  const [usageLimit, setUsageLimit] = useState(initial ? String(initial.usageLimit) : '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? defaults.start);
  const [endDate, setEndDate] = useState(initial?.endDate ?? defaults.end);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const valid =
    code.trim() &&
    value &&
    Number(value) > 0 &&
    minOrder &&
    Number(minOrder) >= 0 &&
    usageLimit &&
    Number(usageLimit) > 0 &&
    startDate &&
    endDate &&
    new Date(endDate) > new Date(startDate);

  return (
    <KeyboardAwareScreen style={fm.container}>
      <View style={fm.header}>
        <Text style={fm.title}>{isEdit ? t('voucher.edit') : t('voucher.create')}</Text>
        <TouchableOpacity onPress={onClose} style={fm.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={fm.body} keyboardShouldPersistTaps="handled">
        <Text style={fm.label}>{t('voucher.code')} *</Text>
        <TextInput
          style={fm.input}
          value={code}
          onChangeText={setCode}
          placeholder={t('voucher.code_placeholder')}
          placeholderTextColor={C.muted}
          autoCapitalize="characters"
        />

        <Text style={fm.label}>{t('voucher.discount_type')} *</Text>
        <View style={fm.typeRow}>
          <TouchableOpacity
            style={[fm.typeBtn, type === 'percent' && fm.typeBtnActive]}
            onPress={() => setType('percent')}
          >
            <Text style={[fm.typeBtnText, type === 'percent' && fm.typeBtnTextActive]}>
              {t('voucher.type_percent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[fm.typeBtn, type === 'flat' && fm.typeBtnActive]}
            onPress={() => setType('flat')}
          >
            <Text style={[fm.typeBtnText, type === 'flat' && fm.typeBtnTextActive]}>
              {t('voucher.type_flat')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={fm.label}>{t('voucher.value')} *</Text>
        <TextInput
          style={fm.input}
          value={value}
          onChangeText={setValue}
          placeholder={
            type === 'percent'
              ? t('voucher.value_placeholder_percent')
              : t('voucher.value_placeholder_flat')
          }
          placeholderTextColor={C.muted}
          keyboardType="numeric"
        />
        {type === 'percent' && value && (
          <Text style={fm.hint}>
            {t('voucher.hint_percent', {
              value,
              max: maxDiscount
                ? formatCurrency(Number(maxDiscount))
                : t('voucher.max_discount_placeholder'),
            })}
          </Text>
        )}

        <Text style={fm.label}>{t('voucher.min_order')} *</Text>
        <TextInput
          style={fm.input}
          value={minOrder}
          onChangeText={setMinOrder}
          placeholder="0"
          placeholderTextColor={C.muted}
          keyboardType="numeric"
        />

        <Text style={fm.label}>{t('voucher.max_discount')}</Text>
        <TextInput
          style={fm.input}
          value={maxDiscount}
          onChangeText={setMaxDiscount}
          placeholder={t('voucher.max_discount_placeholder')}
          placeholderTextColor={C.muted}
          keyboardType="numeric"
        />

        <Text style={fm.label}>{t('voucher.usage_limit')} *</Text>
        <TextInput
          style={fm.input}
          value={usageLimit}
          onChangeText={setUsageLimit}
          placeholder={t('voucher.usage_placeholder')}
          placeholderTextColor={C.muted}
          keyboardType="numeric"
        />

        <Text style={fm.label}>{t('voucher.start_date')} *</Text>
        <TextInput
          style={fm.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
        />

        <Text style={fm.label}>{t('voucher.end_date')} *</Text>
        <TextInput
          style={fm.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
        />

        <Text style={fm.label}>{t('voucher.description')}</Text>
        <TextInput
          style={[fm.input, fm.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('voucher.description_placeholder')}
          placeholderTextColor={C.muted}
          multiline
        />

        <View style={fm.switchRow}>
          <Text style={fm.label}>{t('voucher.active')}</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#E5E7EB', true: C.primary + '80' }}
            thumbColor={isActive ? C.primary : '#9CA3AF'}
          />
        </View>

        {startDate && endDate && new Date(endDate) <= new Date(startDate) ? (
          <Text style={fm.warning}>{t('voucher.end_after_start')}</Text>
        ) : null}

        <TouchableOpacity
          style={[fm.saveBtn, (!valid || loading) && fm.saveBtnDim]}
          onPress={() =>
            onSave({
              code: code.trim().toUpperCase(),
              type,
              value: Number(value),
              minOrder: Number(minOrder),
              maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
              usageLimit: Number(usageLimit),
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
              description: description.trim() || undefined,
              isActive,
            })
          }
          disabled={!valid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={fm.saveBtnText}>{isEdit ? t('voucher.edit') : t('voucher.create')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAwareScreen>
  );
}

export default function AdminVouchersScreen() {
  const { t } = useTranslation();
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<AdminVoucher | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminService.vouchers.getAll();
      setVouchers(data);
    } catch {
      show(t('voucher.load_error'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openCreate = () => {
    setEditing(undefined);
    setFormVisible(true);
  };

  const openEdit = (v: AdminVoucher) => {
    setEditing(v);
    setFormVisible(true);
  };

  const handleSave = async (payload: any) => {
    setSaving(true);
    try {
      if (editing) {
        await adminService.vouchers.update(editing.id, payload);
        show(t('voucher.update_success'));
      } else {
        await adminService.vouchers.create(payload);
        show(t('voucher.save_success'));
      }
      setFormVisible(false);
      load(true);
    } catch {
      show(t('voucher.save_error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (v: AdminVoucher) => {
    Alert.alert(t('voucher.delete_title'), t('voucher.delete_confirm', { code: v.code }), [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setDeletingId(v.id);
          try {
            await adminService.vouchers.delete(v.id);
            setVouchers(prev => prev.filter(x => x.id !== v.id));
            show(t('voucher.delete_success'));
          } catch {
            show(t('voucher.delete_error'), 'error');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderVoucher = ({ item }: { item: AdminVoucher }) => {
    const now = new Date();
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    const expired = end < now;
    const upcoming = start > now;
    const active = item.isActive && !expired;

    let statusLabel = t('voucher.status_expired');
    let statusColor = '#9CA3AF';
    if (active) {
      statusLabel = t('voucher.status_active');
      statusColor = '#16A34A';
    } else if (upcoming) {
      statusLabel = t('voucher.status_upcoming');
      statusColor = '#F59E0B';
    } else if (!item.isActive) {
      statusLabel = t('voucher.status_disabled');
      statusColor = '#EF4444';
    }

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardLeft}>
            <View style={s.codeRow}>
              <View style={s.codeBadge}>
                <Text style={s.codeText}>{item.code}</Text>
              </View>
              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            </View>
            <Text style={s.valueText}>
              {item.type === 'percent'
                ? `Giảm ${item.value}%`
                : `Giảm ${formatCurrency(item.value)}`}
              {item.maxDiscount ? ` (tối đa ${formatCurrency(item.maxDiscount)})` : ''}
            </Text>
            <Text style={s.detailText}>Đơn tối thiểu: {formatCurrency(item.minOrder)}</Text>
            <Text style={s.detailText}>
              {t('voucher.used_count', { used: item.usedCount, limit: item.usageLimit })}
            </Text>
            <Text style={s.dateText}>
              {fmtDate(item.startDate)} → {fmtDate(item.endDate)}
            </Text>
            {item.description ? (
              <Text style={s.descText} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <View style={s.statusWrap}>
            <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={s.cardBtns}>
          <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil-outline" size={14} color={C.primary} />
            <Text style={s.editBtnText}>{t('common.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => handleDelete(item)}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={s.deleteBtnText}>{t('common.delete')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (unauthorized) return null;

  return (
    <View style={s.root}>
      <ScreenHeader
        title={t('voucher.title')}
        right={
          <TouchableOpacity onPress={openCreate} style={s.addBtn}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={vouchers}
          keyExtractor={item => item.id}
          renderItem={renderVoucher}
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
          ListEmptyComponent={<EmptyState icon="pricetag-outline" title={t('voucher.empty')} />}
        />
      )}

      <Modal
        visible={formVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFormVisible(false)}
      >
        <VoucherFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => setFormVisible(false)}
          loading={saving}
        />
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: C.primary, borderRadius: 8, padding: 6 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  codeText: { fontSize: 14, fontWeight: '800', color: '#D97706', letterSpacing: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  valueText: { fontSize: 14, fontWeight: '700', color: C.text },
  detailText: { fontSize: 12, color: C.muted },
  dateText: { fontSize: 11, color: '#9CA3AF' },
  descText: { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 2 },
  statusWrap: { alignItems: 'flex-end' },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  cardBtns: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: '#E5F9FA',
  },
  editBtnText: { fontSize: 13, color: C.primary, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '700' },
});

const fm = StyleSheet.create({
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
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  typeBtnActive: { borderColor: C.primary, backgroundColor: '#E5F9FA' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
  typeBtnTextActive: { color: C.primary },
  hint: { fontSize: 12, color: C.muted, marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  warning: { fontSize: 12, color: '#EF4444', marginTop: 8, textAlign: 'center' },
  saveBtn: {
    marginTop: 16,
    marginBottom: 40,
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDim: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
