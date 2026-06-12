import React, { useState, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { C } from '@/constants/Colors';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { adminService, type WarehousePayload } from '@/services/admin.service';
import { useToast } from '@/components/Toast';
import type { Warehouse } from '@/types';
import EmptyState from '@/components/EmptyState';

const EMPTY: WarehousePayload = {
  name: '',
  address: '',
  ward: '',
  district: '',
  province: '',
  phoneNumber: '',
};

function WarehouseForm({
  initial,
  onSave,
  onClose,
  loading,
  isEdit,
}: {
  initial: WarehousePayload;
  onSave: (p: WarehousePayload) => void;
  onClose: () => void;
  loading: boolean;
  isEdit: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<WarehousePayload>(initial);
  const set = (k: keyof WarehousePayload) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const valid =
    form.name.trim() &&
    form.address.trim() &&
    form.ward.trim() &&
    form.district.trim() &&
    form.province.trim();

  return (
    <KeyboardAwareScreen style={f.container}>
      <View style={f.header}>
        <Text style={f.title}>{isEdit ? t('admin.edit_hub') : t('admin.add_hub')}</Text>
        <TouchableOpacity onPress={onClose} style={f.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={f.body} keyboardShouldPersistTaps="handled">
        {[
          { key: 'name', label: 'Tên kho *', placeholder: 'VD: Hub Trung Tâm TP.HCM' },
          {
            key: 'address',
            label: 'Địa chỉ (số nhà, tên đường) *',
            placeholder: 'VD: 227 Nguyễn Văn Cừ',
          },
          { key: 'ward', label: 'Phường/Xã *', placeholder: 'VD: Phường 4' },
          { key: 'district', label: 'Quận/Huyện *', placeholder: 'VD: Quận 5' },
          { key: 'province', label: 'Tỉnh/Thành phố *', placeholder: 'VD: TP.HCM' },
          { key: 'phoneNumber', label: 'Số điện thoại', placeholder: 'VD: 0901234567' },
        ].map(({ key, label, placeholder }) => (
          <View key={key}>
            <Text style={f.label}>{label}</Text>
            <TextInput
              style={f.input}
              value={(form as any)[key] ?? ''}
              onChangeText={set(key as keyof WarehousePayload)}
              placeholder={placeholder}
              placeholderTextColor={C.muted}
              keyboardType={key === 'phoneNumber' ? 'phone-pad' : 'default'}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[f.saveBtn, (!valid || loading) && f.saveBtnDim]}
          onPress={() => onSave(form)}
          disabled={!valid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={f.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAwareScreen>
  );
}

export default function AdminHubsScreen() {
  const { t } = useTranslation();
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [hubs, setHubs] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminService.warehouses.getAll();
      setHubs(data);
    } catch {
      show('Không thể tải danh sách kho', 'error');
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

  const openAdd = () => {
    setEditing(null);
    setModalVisible(true);
  };
  const openEdit = (hub: Warehouse) => {
    setEditing(hub);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const handleSave = async (payload: WarehousePayload) => {
    setMutating(true);
    try {
      const cleaned: WarehousePayload = {
        name: payload.name.trim(),
        address: payload.address.trim(),
        ward: payload.ward.trim(),
        district: payload.district.trim(),
        province: payload.province.trim(),
        phoneNumber: payload.phoneNumber?.trim() || undefined,
      };
      if (editing) {
        await adminService.warehouses.update(editing.id, cleaned);
        show('Đã cập nhật kho');
      } else {
        await adminService.warehouses.create(cleaned);
        show('Đã tạo kho mới');
      }
      closeModal();
      load(true);
    } catch {
      show('Thao tác thất bại', 'error');
    } finally {
      setMutating(false);
    }
  };

  const handleToggle = async (hub: Warehouse) => {
    setTogglingId(hub.id);
    try {
      const res = await adminService.warehouses.toggle(hub.id);
      setHubs(prev => prev.map(h => (h.id === hub.id ? { ...h, isActive: res.isActive } : h)));
    } catch {
      show('Không thể thay đổi trạng thái', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (hub: Warehouse) => {
    Alert.alert('Xoá kho', t('admin.delete_confirm', { name: hub.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.warehouses.delete(hub.id);
            show('Đã xoá kho');
            load(true);
          } catch {
            show('Không thể xoá kho', 'error');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Warehouse }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <View style={s.nameRow}>
            <Ionicons name="storefront-outline" size={16} color={C.primary} />
            <Text style={s.hubName}>{item.name}</Text>
          </View>
          <Text style={s.hubAddr} numberOfLines={1}>
            {item.address}, {item.ward}, {item.district}, {item.province}
          </Text>
          {item.phoneNumber ? <Text style={s.hubPhone}>{item.phoneNumber}</Text> : null}
        </View>
        <View style={s.cardActions}>
          {togglingId === item.id ? (
            <ActivityIndicator color={C.primary} size="small" />
          ) : (
            <Switch
              value={item.isActive ?? true}
              onValueChange={() => handleToggle(item)}
              trackColor={{ false: '#E5E7EB', true: C.primary + '80' }}
              thumbColor={item.isActive ? C.primary : '#9CA3AF'}
            />
          )}
        </View>
      </View>
      <View style={s.cardBtns}>
        <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil-outline" size={14} color={C.primary} />
          <Text style={s.editBtnText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={14} color="#EF4444" />
          <Text style={s.deleteBtnText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (unauthorized) return null;

  return (
    <View style={s.root}>
      <ScreenHeader
        title="Kho / Hub"
        right={
          <TouchableOpacity onPress={openAdd} style={s.addBtn}>
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
          data={hubs}
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
          ListEmptyComponent={<EmptyState icon="storefront-outline" title="Chưa có kho nào" />}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <WarehouseForm
          initial={
            editing
              ? {
                  name: editing.name,
                  address: editing.address,
                  ward: editing.ward,
                  district: editing.district,
                  province: editing.province,
                  phoneNumber: editing.phoneNumber,
                }
              : EMPTY
          }
          onSave={handleSave}
          onClose={closeModal}
          loading={mutating}
          isEdit={!!editing}
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hubName: { fontSize: 15, fontWeight: '700', color: C.text },
  hubAddr: { fontSize: 12, color: C.muted },
  hubPhone: { fontSize: 12, color: C.primary },
  cardActions: { justifyContent: 'center' },
  cardBtns: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: '#E5F9FA',
  },
  editBtnText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
});

const f = StyleSheet.create({
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
  saveBtn: {
    marginTop: 24,
    marginBottom: 40,
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDim: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
