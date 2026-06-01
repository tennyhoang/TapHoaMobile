import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsService } from '@/services/products.service';
import { api } from '@/lib/api';
import ProductImage from '@/components/ProductImage';
import { useToast } from '@/components/Toast';
import type { Product } from '@/types';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
  error: '#EF4444',
};

const CLOUDINARY_CLOUD = 'doy14nwx0';
const CLOUDINARY_PRESET = 'taphoa_unsigned';

function isCloudinaryUrl(url?: string | null) {
  return url?.startsWith('https://res.cloudinary.com/') ?? false;
}

function isOldPath(url?: string | null) {
  return !url || (!url.startsWith('http://') && !url.startsWith('https://'));
}

async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(data.error?.message || 'Upload thất bại');
  return data.secure_url as string;
}

async function saveProductUrl(product: Product, newUrl: string): Promise<void> {
  await api.put(`/products/${product.id}`, {
    name: product.name,
    description: product.description,
    price: product.price,
    discountPrice: product.discountPrice,
    stock: product.stock,
    thumbnailUrl: newUrl,
    images: product.images,
    categoryId: product.categoryId,
  });
}

type EditState = { productId: string; url: string };

export default function AdminProductsScreen() {
  const { show } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingProduct = useRef<Product | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const pages = await Promise.all(
        [1, 2, 3, 4].map(p => productsService.getAll({ page: p, pageSize: 50 }))
      );
      setProducts(pages.flatMap(r => r.items));
    } catch {
      show('Không thể tải danh sách', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveUrl = async (product: Product, url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setSaving(product.id);
    try {
      await saveProductUrl(product, trimmed);
      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, thumbnailUrl: trimmed } : p))
      );
      setEditing(null);
      show(`Đã cập nhật ảnh "${product.name}"`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Lưu thất bại', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handlePickFile = (product: Product) => {
    if (Platform.OS !== 'web') {
      show('Chỉ hỗ trợ trên web', 'info');
      return;
    }
    pendingProduct.current = product;
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,image/gif';
      input.onchange = handleFileSelected;
      fileInputRef.current = input;
    }
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleFileSelected = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    const product = pendingProduct.current;
    if (!file || !product) return;
    setSaving(product.id);
    try {
      const url = await uploadToCloudinary(file);
      await saveProductUrl(product, url);
      setProducts(prev => prev.map(p => (p.id === product.id ? { ...p, thumbnailUrl: url } : p)));
      show(`Đã upload & cập nhật "${product.name}"`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Upload thất bại', 'error');
    } finally {
      setSaving(null);
      pendingProduct.current = null;
    }
  };

  const needCount = products.filter(p => !isCloudinaryUrl(p.thumbnailUrl)).length;

  const renderItem = ({ item }: { item: Product }) => {
    const isEditing = editing?.productId === item.id;
    const isSaving = saving === item.id;
    const hasCloudinary = isCloudinaryUrl(item.thumbnailUrl);
    const hasOld = isOldPath(item.thumbnailUrl);

    return (
      <View style={s.card}>
        {/* Top row: image + info + actions */}
        <View style={s.row}>
          <View style={s.imgWrap}>
            <ProductImage uri={item.thumbnailUrl} style={s.img} name={item.name} />
          </View>
          <View style={s.info}>
            <Text style={s.name} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={[s.badge, hasCloudinary ? s.badgeOk : hasOld ? s.badgeWarn : s.badgeInfo]}>
              <Ionicons
                name={
                  hasCloudinary ? 'cloud-done-outline' : hasOld ? 'warning-outline' : 'link-outline'
                }
                size={11}
                color={hasCloudinary ? '#065F46' : hasOld ? '#92400E' : '#1E40AF'}
              />
              <Text
                style={[
                  s.badgeText,
                  hasCloudinary ? s.colorOk : hasOld ? s.colorWarn : s.colorInfo,
                ]}
              >
                {hasCloudinary ? 'Cloudinary ✓' : hasOld ? 'Chưa có ảnh' : 'URL khác'}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={s.actions}>
            {/* Paste URL button */}
            <TouchableOpacity
              style={[s.actionBtn, s.urlBtn]}
              onPress={() =>
                setEditing(isEditing ? null : { productId: item.id, url: item.thumbnailUrl ?? '' })
              }
              activeOpacity={0.8}
            >
              <Ionicons name={isEditing ? 'close' : 'link-outline'} size={15} color={C.primary} />
            </TouchableOpacity>
            {/* Upload file button */}
            <TouchableOpacity
              style={[s.actionBtn, s.uploadBtn, isSaving && s.btnDim]}
              onPress={() => handlePickFile(item)}
              disabled={!!saving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator
                  color="#fff"
                  size="small"
                  style={{ transform: [{ scale: 0.7 }] }}
                />
              ) : (
                <Ionicons name="cloud-upload-outline" size={15} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline URL editor */}
        {isEditing && (
          <View style={s.urlEditor}>
            <TextInput
              style={s.urlInput}
              value={editing.url}
              onChangeText={url => setEditing({ productId: item.id, url })}
              placeholder="https://res.cloudinary.com/doy14nwx0/..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              multiline={false}
              selectTextOnFocus
            />
            <TouchableOpacity
              style={[s.saveUrlBtn, (!editing.url.trim() || isSaving) && s.btnDim]}
              onPress={() => handleSaveUrl(item, editing.url)}
              disabled={!editing.url.trim() || isSaving}
              activeOpacity={0.8}
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Quản lý ảnh sản phẩm</Text>
            {!loading && (
              <Text style={s.headerSub}>
                {needCount > 0
                  ? `${needCount}/${products.length} chưa có ảnh Cloudinary`
                  : `Tất cả ${products.length} sản phẩm OK ✓`}
              </Text>
            )}
          </View>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={C.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={s.hint}>
                <Ionicons name="information-circle-outline" size={15} color={C.primary} />
                <Text style={s.hintText}>
                  <Text style={{ fontWeight: '700' }}>Link</Text> → paste URL Cloudinary có sẵn
                  {'   '}
                  <Text style={{ fontWeight: '700' }}>Upload</Text> → chọn file mới
                </Text>
              </View>
            }
            renderItem={renderItem}
          />
        )}
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  list: { padding: 12, gap: 10, paddingBottom: 40 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E5F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  hintText: { flex: 1, fontSize: 12, color: C.primaryDark, lineHeight: 18 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 12 },
  imgWrap: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOk: { backgroundColor: '#ECFDF5' },
  badgeWarn: { backgroundColor: '#FFFBEB' },
  badgeInfo: { backgroundColor: '#EFF6FF' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  colorOk: { color: '#065F46' },
  colorWarn: { color: '#92400E' },
  colorInfo: { color: '#1E40AF' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlBtn: { backgroundColor: '#E5F9FA', borderWidth: 1, borderColor: C.primary + '40' },
  uploadBtn: { backgroundColor: C.primary },
  btnDim: { opacity: 0.5 },
  urlEditor: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  urlInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    fontSize: 12,
    color: C.text,
    backgroundColor: C.bg,
  },
  saveUrlBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveUrlText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
