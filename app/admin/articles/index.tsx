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
import ScreenHeader from '@/components/ScreenHeader';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { C } from '@/constants/Colors';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { articlesService, type Article, type ArticlePayload } from '@/services/articles.service';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

const CATEGORIES = [
  { value: 'dinh-duong', label: 'Dinh dưỡng' },
  { value: 'mua-sam-thong-minh', label: 'Mua sắm thông minh' },
  { value: 'he-thong-hub', label: 'Hệ thống Hub' },
  { value: 'san-pham-noi-bat', label: 'Sản phẩm nổi bật' },
];

const EMPTY_FORM: ArticlePayload = {
  title: '',
  excerpt: '',
  content: '',
  category: 'dinh-duong',
  imageUrl: '',
  readTimeMinutes: 5,
};

function ArticleForm({
  initial,
  onSave,
  onClose,
  loading,
}: {
  initial: ArticlePayload;
  onSave: (p: ArticlePayload) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ArticlePayload>(initial);
  const set = (k: keyof ArticlePayload) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const setNum = (k: keyof ArticlePayload) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: Number(v) || 0 }));

  return (
    <KeyboardAwareScreen style={f.container}>
      <View style={f.header}>
        <Text style={f.title}>{initial.title ? 'Sửa bài viết' : 'Thêm bài viết'}</Text>
        <TouchableOpacity onPress={onClose} style={f.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={f.body} keyboardShouldPersistTaps="handled">
        <Text style={f.label}>Tiêu đề *</Text>
        <TextInput
          style={f.input}
          value={form.title}
          onChangeText={set('title')}
          placeholder="Tiêu đề bài viết"
          placeholderTextColor={C.muted}
        />

        <Text style={f.label}>Mô tả ngắn *</Text>
        <TextInput
          style={[f.input, { height: 80, textAlignVertical: 'top' }]}
          value={form.excerpt}
          onChangeText={set('excerpt')}
          placeholder="Tóm tắt nội dung..."
          placeholderTextColor={C.muted}
          multiline
        />

        <Text style={f.label}>Nội dung *</Text>
        <TextInput
          style={[f.input, { height: 200, textAlignVertical: 'top' }]}
          value={form.content}
          onChangeText={set('content')}
          placeholder="Nội dung bài viết (Markdown)..."
          placeholderTextColor={C.muted}
          multiline
        />

        <Text style={f.label}>Danh mục</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={f.chipScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[f.chip, form.category === cat.value && f.chipActive]}
              onPress={() => set('category')(cat.value)}
            >
              <Text style={[f.chipText, form.category === cat.value && f.chipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={f.label}>URL hình ảnh</Text>
        <TextInput
          style={f.input}
          value={form.imageUrl ?? ''}
          onChangeText={set('imageUrl')}
          placeholder="https://..."
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={f.label}>Thời gian đọc (phút)</Text>
        <TextInput
          style={f.input}
          value={String(form.readTimeMinutes)}
          onChangeText={setNum('readTimeMinutes')}
          placeholder="5"
          placeholderTextColor={C.muted}
          keyboardType="number-pad"
        />

        <TouchableOpacity
          style={[
            f.saveBtn,
            (!form.title.trim() || !form.excerpt.trim() || !form.content.trim() || loading) &&
              f.saveBtnDim,
          ]}
          onPress={() => onSave(form)}
          disabled={!form.title.trim() || !form.excerpt.trim() || !form.content.trim() || loading}
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

export default function AdminArticlesScreen() {
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await articlesService.getAll();
      setArticles(data ?? []);
    } catch {
      show('Không thể tải bài viết', 'error');
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
  const openEdit = (article: Article) => {
    setEditing(article);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const handleSave = async (payload: ArticlePayload) => {
    setMutating(true);
    try {
      const cleaned: ArticlePayload = {
        ...payload,
        title: payload.title.trim(),
        excerpt: payload.excerpt.trim(),
        content: payload.content.trim(),
        imageUrl: payload.imageUrl?.trim() || null,
      };
      if (editing) {
        await articlesService.update(editing.id, cleaned);
        show('Đã cập nhật bài viết');
      } else {
        await articlesService.create(cleaned);
        show('Đã tạo bài viết');
      }
      closeModal();
      load(true);
    } catch {
      show('Thao tác thất bại', 'error');
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = (article: Article) => {
    Alert.alert('Xoá bài viết', `Xoá "${article.title}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await articlesService.delete(article.id);
            show('Đã xoá bài viết');
            load(true);
          } catch {
            show('Không thể xoá', 'error');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Article }) => (
    <View style={s.card}>
      <View style={s.cardLeft}>
        <Text style={s.articleTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={s.articleExcerpt} numberOfLines={2}>
          {item.excerpt}
        </Text>
        <View style={s.meta}>
          <View style={s.categoryBadge}>
            <Text style={s.categoryText}>
              {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
            </Text>
          </View>
          <Text style={s.readTime}>{item.readTimeMinutes} phút</Text>
        </View>
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

  if (unauthorized) return null;

  return (
    <View style={s.root}>
      <ScreenHeader
        title="Cẩm nang"
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
          data={articles}
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
          ListEmptyComponent={<EmptyState icon="book-outline" title="Chưa có bài viết nào" />}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <ArticleForm
          initial={
            editing
              ? {
                  title: editing.title,
                  excerpt: editing.excerpt,
                  content: editing.content,
                  category: editing.category,
                  imageUrl: editing.imageUrl,
                  readTimeMinutes: editing.readTimeMinutes,
                }
              : EMPTY_FORM
          }
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
  articleTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  articleExcerpt: { fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 17 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  categoryBadge: {
    backgroundColor: C.primary + '18',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 11, fontWeight: '600', color: C.primary },
  readTime: { fontSize: 11, color: C.muted },
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
