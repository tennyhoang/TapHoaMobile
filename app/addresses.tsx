import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addressesService } from '@/services/addresses.service';
import type { Address } from '@/types';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  error: '#EF4444',
};

type FormState = {
  receiverName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  receiverName: '',
  phoneNumber: '',
  province: '',
  district: '',
  ward: '',
  streetAddress: '',
  isDefault: false,
};

export default function AddressesScreen() {
  const { top } = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAddresses = useCallback(async () => {
    try {
      const data = await addressesService.getAll();
      setAddresses(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );

  const handleSetDefault = async (id: string) => {
    try {
      await addressesService.setDefault(id);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ mặc định.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xoá địa chỉ', 'Bạn có chắc muốn xoá địa chỉ này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await addressesService.delete(id);
            setAddresses(prev => prev.filter(a => a.id !== id));
          } catch {
            Alert.alert('Lỗi', 'Không thể xoá địa chỉ này.');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (
      !form.receiverName.trim() ||
      !form.phoneNumber.trim() ||
      !form.province.trim() ||
      !form.district.trim() ||
      !form.ward.trim() ||
      !form.streetAddress.trim()
    ) {
      setFormError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const newAddr = await addressesService.add({
        receiverName: form.receiverName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        province: form.province.trim(),
        district: form.district.trim(),
        ward: form.ward.trim(),
        streetAddress: form.streetAddress.trim(),
        isDefault: form.isDefault,
      });
      setAddresses(prev =>
        form.isDefault
          ? [...prev.map(a => ({ ...a, isDefault: false })), newAddr]
          : [...prev, newAddr]
      );
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lưu địa chỉ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: keyof FormState) => (value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Địa chỉ giao hàng</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => {
            setForm(EMPTY_FORM);
            setShowModal(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="location-outline" size={52} color="#D1D5DB" />
          <Text style={s.emptyText}>Chưa có địa chỉ nào</Text>
          <TouchableOpacity
            style={s.newBtn}
            onPress={() => {
              setForm(EMPTY_FORM);
              setShowModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={s.newBtnText}>Thêm địa chỉ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.cardInfo}>
                  <View style={s.nameRow}>
                    <Text style={s.receiverName}>{item.receiverName}</Text>
                    {item.isDefault && (
                      <View style={s.defaultBadge}>
                        <Text style={s.defaultText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.phone}>{item.phoneNumber}</Text>
                  <Text style={s.addr}>
                    {item.streetAddress}, {item.ward}, {item.district}, {item.province}
                  </Text>
                </View>
              </View>
              <View style={s.cardActions}>
                {!item.isDefault && (
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => handleSetDefault(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="star-outline" size={14} color={C.primary} />
                    <Text style={[s.actionText, { color: C.primary }]}>Đặt mặc định</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={s.actionBtn}
                  onPress={() => handleDelete(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={C.error} />
                  <Text style={[s.actionText, { color: C.error }]}>Xoá</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add address modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Thêm địa chỉ mới</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!!formError && (
                <View style={s.errBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={C.error} />
                  <Text style={s.errText}>{formError}</Text>
                </View>
              )}

              {(
                [
                  { key: 'receiverName', label: 'Họ tên người nhận', placeholder: 'Nguyễn Văn A' },
                  {
                    key: 'phoneNumber',
                    label: 'Số điện thoại',
                    placeholder: '0912 345 678',
                    keyboardType: 'phone-pad',
                  },
                  { key: 'province', label: 'Tỉnh / Thành phố', placeholder: 'TP. Hồ Chí Minh' },
                  { key: 'district', label: 'Quận / Huyện', placeholder: 'Quận 1' },
                  { key: 'ward', label: 'Phường / Xã', placeholder: 'Phường Bến Nghé' },
                  { key: 'streetAddress', label: 'Địa chỉ cụ thể', placeholder: '123 Nguyễn Huệ' },
                ] as const
              ).map(field => (
                <View key={field.key} style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={s.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={String(form[field.key])}
                    onChangeText={setField(field.key)}
                    keyboardType={(field as any).keyboardType ?? 'default'}
                    autoCorrect={false}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={s.defaultToggle}
                onPress={() => setField('isDefault')(!form.isDefault)}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, form.isDefault && s.checkboxActive]}>
                  {form.isDefault && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={s.defaultToggleText}>Đặt làm địa chỉ mặc định</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.65 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.saveBtnText}>Lưu địa chỉ</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  cardTop: { marginBottom: 10 },
  cardInfo: { gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  receiverName: { fontSize: 15, fontWeight: '700', color: C.text },
  defaultBadge: {
    backgroundColor: '#E5F9FA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultText: { fontSize: 11, fontWeight: '600', color: C.primary },
  phone: { fontSize: 13, color: C.muted },
  addr: { fontSize: 13, color: C.text, lineHeight: 20 },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '500' },
  emptyText: { fontSize: 14, color: C.muted },
  newBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: C.primary,
    borderRadius: 12,
  },
  newBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errText: { fontSize: 13, color: C.error, flex: 1 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: C.text,
  },
  defaultToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: C.primary, borderColor: C.primary },
  defaultToggleText: { fontSize: 14, color: C.text },
  saveBtn: {
    height: 50,
    backgroundColor: C.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
