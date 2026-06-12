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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { C } from '@/constants/Colors';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { adminService, type CategoryPayload } from '@/services/admin.service';
import { useToast } from '@/components/Toast';
import type { Category } from '@/types';
import EmptyState from '@/components/EmptyState';

const EMPTY_FORM: CategoryPayload = { name: '', description: '', imageUrl: '', parentId: '' };

function CategoryForm({
  initial,
  parentCategories,
  onSave,
  onClose,
  loading,
}: {
  initial: CategoryPayload;
  parentCategories: Category[];
  onSave: (p: CategoryPayload) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CategoryPayload>(initial);
  const set = (k: keyof CategoryPayload) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <KeyboardAwareScreen style={f.container}>
      <View style={f.header}>
        <Text style={f.title}>
          {initial.name ? t('admin.edit_category') : t('admin.add_category')}
        </Text>
        <TouchableOpacity onPress={onClose} style={f.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={f.body} keyboardShouldPersistTaps="handled">
        <Text style={f.label}>Tên danh mục *</Text>
        <TextInput
          style={f.input}
          value={form.name}
          onChangeText={set('name')}
          placeholder="VD: Rau củ quả"
          placeholderTextColor={C.muted}
        />

        <Text style={f.label}>{t('admin.description')}</Text>
        <TextInput
          style={[f.input, { height: 80, textAlignVertical: 'top' }]}
          value={form.description ?? ''}
          onChangeText={set('description')}
          placeholder="Mô tả danh mục..."
          placeholderTextColor={C.muted}
          multiline
        />

        <Text style={f.label}>{t('admin.image_url')}</Text>
        <TextInput
          style={f.input}
          value={form.imageUrl ?? ''}
          onChangeText={set('imageUrl')}
          placeholder="https://..."
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={f.label}>Danh mục cha</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={f.chipScroll}>
          <TouchableOpacity
            style={[f.chip, !form.parentId && f.chipActive]}
            onPress={() => set('parentId')('')}
          >
            <Text style={[f.chipText, !form.parentId && f.chipTextActive]}>Không có</Text>
          </TouchableOpacity>
          {parentCategories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[f.chip, form.parentId === cat.id && f.chipActive]}
              onPress={() => set('parentId')(cat.id)}
            >
              <Text style={[f.chipText, form.parentId === cat.id && f.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[f.saveBtn, (!form.name.trim() || loading) && f.saveBtnDim]}
          onPress={() => onSave(form)}
          disabled={!form.name.trim() || loading}
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

export default function AdminCategoriesScreen() {
  const { t } = useTranslation();
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminService.categories.getAll();
      setCategories(data);
    } catch {
      show('Không thể tải danh mục', 'error');
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
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const handleSave = async (payload: CategoryPayload) => {
    setMutating(true);
    try {
      const cleaned: CategoryPayload = {
        name: payload.name.trim(),
        description: payload.description?.trim() || undefined,
        imageUrl: payload.imageUrl?.trim() || undefined,
        parentId: payload.parentId || undefined,
      };
      if (editing) {
        await adminService.categories.update(editing.id, cleaned);
        show('Đã cập nhật danh mục');
      } else {
        await adminService.categories.create(cleaned);
        show('Đã tạo danh mục');
      }
      closeModal();
      load(true);
    } catch {
      show('Thao tác thất bại', 'error');
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('Xoá danh mục', t('admin.delete_confirm', { name: cat.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.categories.delete(cat.id);
            show('Đã xoá danh mục');
            load(true);
          } catch {
            show('Không thể xoá', 'error');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Category }) => {
    const isChild = !!item.parentId;
    return (
      <View style={[s.card, isChild && { marginLeft: 24, backgroundColor: '#F9FAFB' }]}>
        {isChild && (
          <View style={s.childIndicator}>
            <Ionicons name="return-down-forward-outline" size={14} color={C.muted} />
          </View>
        )}
        <View style={s.cardLeft}>
          <Text style={s.catName}>{item.name}</Text>
          {item.description ? (
            <Text style={s.catDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          {item.children.length > 0 && (
            <Text style={s.childCount}>{item.children.length} danh mục con</Text>
          )}
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil-outline" size={18} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (unauthorized) return null;

  return (
    <View style={s.root}>
      <ScreenHeader
        title={t('admin.categories')}
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
          data={categories}
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
          ListEmptyComponent={<EmptyState icon="pricetag-outline" title="Chưa có danh mục nào" />}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <CategoryForm
          initial={
            editing
              ? {
                  name: editing.name,
                  description: editing.description,
                  imageUrl: editing.imageUrl,
                  parentId: editing.parentId,
                }
              : EMPTY_FORM
          }
          parentCategories={categories.filter(c => !c.parentId && c.id !== editing?.id)}
          onSave={handleSave}
          onClose={closeModal}
          loading={mutating}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLeft: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '700', color: C.text },
  catDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  childCount: { fontSize: 12, color: C.primary, marginTop: 4, fontWeight: '600' },
  childIndicator: { width: 20, alignItems: 'center', justifyContent: 'center' },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
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
  chipScroll: { flexGrow: 0, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.muted, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
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
