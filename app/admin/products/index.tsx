import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import { productsService } from '@/services/products.service';
import { adminService, type CreateProductPayload } from '@/services/admin.service';
import { useRoleGuard } from '@/lib/useRoleGuard';
import ProductImage from '@/components/ProductImage';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import type { Product, Category } from '@/types';
import { C } from '@/constants/Colors';
import EmptyState from '@/components/EmptyState';

const CLOUDINARY_CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD!;
const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET!;

const EMPTY_FORM: CreateProductPayload = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  categoryId: '',
  thumbnailUrl: '',
};

function ProductForm({
  initial,
  categories,
  onSave,
  onClose,
  loading,
}: {
  initial: CreateProductPayload & { id?: string };
  categories: Category[];
  onSave: (p: CreateProductPayload) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof CreateProductPayload) => (v: string) =>
    setForm(prev => ({
      ...prev,
      [k]: k === 'name' || k === 'description' || k === 'thumbnailUrl' ? v : Number(v) || 0,
    }));

  return (
    <View style={f.container}>
      <View style={f.header}>
        <Text style={f.title}>{initial.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</Text>
        <TouchableOpacity onPress={onClose} style={f.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={f.body} keyboardShouldPersistTaps="handled">
        <Text style={f.label}>Tên sản phẩm *</Text>
        <TextInput
          style={f.input}
          value={form.name}
          onChangeText={set('name')}
          placeholder="VD: Gạo ST25"
          placeholderTextColor={C.muted}
        />

        <Text style={f.label}>Mô tả</Text>
        <TextInput
          style={[f.input, { height: 80, textAlignVertical: 'top' }]}
          value={form.description ?? ''}
          onChangeText={set('description')}
          placeholder="Mô tả sản phẩm..."
          placeholderTextColor={C.muted}
          multiline
        />

        <Text style={f.label}>Giá *</Text>
        <TextInput
          style={f.input}
          value={form.price ? String(form.price) : ''}
          onChangeText={set('price')}
          placeholder="50000"
          placeholderTextColor={C.muted}
          keyboardType="numeric"
        />

        <Text style={f.label}>Giá khuyến mãi</Text>
        <TextInput
          style={f.input}
          value={form.discountPrice ? String(form.discountPrice) : ''}
          onChangeText={v =>
            setForm(prev => ({ ...prev, discountPrice: v ? Number(v) : undefined }))
          }
          placeholder="40000"
          placeholderTextColor={C.muted}
          keyboardType="numeric"
        />

        <Text style={f.label}>Tồn kho *</Text>
        <TextInput
          style={f.input}
          value={form.stock ? String(form.stock) : ''}
          onChangeText={set('stock')}
          placeholder="100"
          placeholderTextColor={C.muted}
          keyboardType="numeric"
        />

        <Text style={f.label}>Danh mục *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={f.chipScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[f.chip, form.categoryId === cat.id && f.chipActive]}
              onPress={() => setForm(prev => ({ ...prev, categoryId: cat.id }))}
            >
              <Text style={[f.chipText, form.categoryId === cat.id && f.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={f.label}>URL hình ảnh</Text>
        <TextInput
          style={f.input}
          value={form.thumbnailUrl ?? ''}
          onChangeText={set('thumbnailUrl')}
          placeholder="https://res.cloudinary.com/..."
          placeholderTextColor={C.muted}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            f.saveBtn,
            (!form.name.trim() || !form.price || !form.stock || !form.categoryId || loading) &&
              f.saveBtnDim,
          ]}
          onPress={() => onSave(form)}
          disabled={!form.name.trim() || !form.price || !form.stock || !form.categoryId || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={f.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function AdminProductsScreen() {
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [mutating, setMutating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [urlEditingId, setUrlEditingId] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const [savingUrl, setSavingUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingProduct = useRef<Product | null>(null);
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [res, cats] = await Promise.all([
        productsService.getAll({ page: 1, pageSize: 50, search: searchRef.current || undefined }),
        adminService.categories.getAll(),
      ]);
      setProducts(res.items);
      setTotalPages(res.totalPages);
      setPage(1);
      setCategories(cats);
    } catch {
      show('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const res = await productsService.getAll({
        page: page + 1,
        pageSize: 50,
        search: searchRef.current || undefined,
      });
      setProducts(prev => [...prev, ...res.items]);
      setPage(res.page);
    } catch {
      show('Không thể tải thêm dữ liệu', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [page, totalPages, loadingMore]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchRef.current) load(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = search.trim()
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const openAdd = () => {
    setEditing(null);
    setModalVisible(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const handleSave = async (payload: CreateProductPayload) => {
    setMutating(true);
    try {
      const cleaned = {
        ...payload,
        name: payload.name.trim(),
        description: payload.description?.trim() || undefined,
        thumbnailUrl: payload.thumbnailUrl?.trim() || undefined,
      };
      if (editing) {
        const updated = await adminService.products.update(editing.id, cleaned);
        setProducts(prev => prev.map(p => (p.id === editing.id ? updated : p)));
        show('Đã cập nhật sản phẩm');
      } else {
        const created = await adminService.products.create(cleaned);
        setProducts(prev => [created, ...prev]);
        show('Đã tạo sản phẩm');
      }
      closeModal();
    } catch {
      show('Thao tác thất bại', 'error');
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = (p: Product) => {
    Alert.alert('Xoá sản phẩm', `Xoá "${p.name}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.products.delete(p.id);
            setProducts(prev => prev.filter(x => x.id !== p.id));
            show('Đã xoá sản phẩm');
          } catch {
            show('Không thể xoá', 'error');
          }
        },
      },
    ]);
  };

  const handleSaveUrl = async (p: Product) => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    setSavingUrl(p.id);
    try {
      await adminService.products.update(p.id, { thumbnailUrl: trimmed });
      setProducts(prev => prev.map(x => (x.id === p.id ? { ...x, thumbnailUrl: trimmed } : x)));
      setUrlEditingId(null);
      show('Đã cập nhật ảnh');
    } catch {
      show('Lưu thất bại', 'error');
    } finally {
      setSavingUrl(null);
    }
  };

  const handleUploadFile = (p: Product) => {
    if (Platform.OS !== 'web') {
      show('Chỉ hỗ trợ trên web', 'info');
      return;
    }
    pendingProduct.current = p;
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        const prod = pendingProduct.current;
        if (!file || !prod) return;
        setSavingUrl(prod.id);
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('upload_preset', CLOUDINARY_PRESET);
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
            { method: 'POST', body: form }
          );
          const data = await res.json();
          if (!res.ok || !data.secure_url)
            throw new Error(data.error?.message || 'Upload thất bại');
          const url = data.secure_url as string;
          await adminService.products.update(prod.id, { thumbnailUrl: url });
          setProducts(prev => prev.map(x => (x.id === prod.id ? { ...x, thumbnailUrl: url } : x)));
          show('Đã upload & cập nhật');
        } catch {
          show('Upload thất bại', 'error');
        } finally {
          setSavingUrl(null);
          pendingProduct.current = null;
        }
      };
      fileInputRef.current = input;
    }
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const renderItem = ({ item }: { item: Product }) => {
    const isEditingUrl = urlEditingId === item.id;
    const isSaving = savingUrl === item.id;
    const hasCloudinary = item.thumbnailUrl?.startsWith('https://res.cloudinary.com/');

    return (
      <View style={s.card}>
        <TouchableOpacity style={s.cardMain} onPress={() => openEdit(item)} activeOpacity={0.7}>
          <View style={s.imgWrap}>
            <ProductImage uri={item.thumbnailUrl} style={s.img} name={item.name} />
          </View>
          <View style={s.info}>
            <Text style={s.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={s.price}>{formatCurrency(item.discountPrice ?? item.price)}</Text>
            <Text style={s.stock}>Tồn: {item.stock}</Text>
          </View>
          <TouchableOpacity style={s.deleteIcon} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={s.imgActions}>
          <TouchableOpacity
            style={s.imgActionBtn}
            onPress={() => {
              setUrlEditingId(isEditingUrl ? null : item.id);
              setUrlValue(item.thumbnailUrl ?? '');
            }}
          >
            <Ionicons name="link-outline" size={13} color={C.primary} />
            <Text style={s.imgActionText}>Link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.imgActionBtn, isSaving && { opacity: 0.5 }]}
            onPress={() => handleUploadFile(item)}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={13} color={C.primary} />
            )}
            <Text style={s.imgActionText}>Upload</Text>
          </TouchableOpacity>
          <View style={[s.statusDot, { backgroundColor: hasCloudinary ? '#16A34A' : '#F59E0B' }]} />
        </View>

        {isEditingUrl && (
          <View style={s.urlEditor}>
            <TextInput
              style={s.urlInput}
              value={urlValue}
              onChangeText={setUrlValue}
              placeholder="URL Cloudinary..."
              placeholderTextColor={C.muted}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[s.saveUrlBtn, (!urlValue.trim() || isSaving) && { opacity: 0.5 }]}
              onPress={() => handleSaveUrl(item)}
              disabled={!urlValue.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.saveUrlText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (unauthorized) return null;

  return (
    <View style={s.root}>
      <ScreenHeader
        title="Sản phẩm"
        right={
          <TouchableOpacity onPress={openAdd} style={s.addBtn}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        }
      />

      <View style={s.searchBar}>
        <Ionicons name="search" size={16} color={C.muted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm sản phẩm..."
          placeholderTextColor={C.muted}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
          ListEmptyComponent={
            <EmptyState
              icon="image-outline"
              title={search ? 'Không tìm thấy' : 'Chưa có sản phẩm'}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={C.primary} size="small" />
              </View>
            ) : null
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <ProductForm
          initial={
            editing
              ? {
                  name: editing.name,
                  description: editing.description,
                  price: editing.price,
                  discountPrice: editing.discountPrice,
                  stock: editing.stock,
                  categoryId: editing.categoryId,
                  thumbnailUrl: editing.thumbnailUrl,
                  id: editing.id,
                }
              : EMPTY_FORM
          }
          categories={categories}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    marginBottom: 0,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  list: { padding: 12, gap: 10, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingBottom: 8 },
  imgWrap: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  price: { fontSize: 14, fontWeight: '800', color: C.primary },
  stock: { fontSize: 11, color: C.muted, marginTop: 1 },
  deleteIcon: { padding: 6 },
  imgActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  imgActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.primary + '40',
    backgroundColor: '#E5F9FA',
  },
  imgActionText: { fontSize: 11, fontWeight: '600', color: C.primary },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 'auto' },
  urlEditor: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  urlInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    fontSize: 12,
    color: C.text,
    backgroundColor: C.bg,
  },
  saveUrlBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveUrlText: { fontSize: 12, fontWeight: '700', color: '#fff' },
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
