import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  articlesService,
  getCategoryMeta,
  getArticleImage,
  type Article,
} from '@/services/articles.service';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#F3F4F6',
};

export default function ArticlesScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const data = await articlesService.getAll();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải bài viết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item, index }: { item: Article; index: number }) => {
    const meta = getCategoryMeta(item.category);
    const image = getArticleImage(item);
    const isFeatured = index === 0;

    if (isFeatured) {
      return (
        <TouchableOpacity
          style={s.featured}
          onPress={() => router.push(`/articles/${item.id}` as any)}
          activeOpacity={0.88}
        >
          <Image
            source={{ uri: image }}
            style={s.featuredImg}
            contentFit="cover"
            transition={300}
          />
          <View style={s.featuredOverlay} />
          <View style={s.featuredContent}>
            <View style={[s.catBadge, { backgroundColor: meta.color + 'CC' }]}>
              <Text style={s.catBadgeText}>{meta.label}</Text>
            </View>
            <Text style={s.featuredTitle} numberOfLines={3}>
              {item.title}
            </Text>
            <View style={s.metaRow}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={s.metaText}>{item.readTimeMinutes} phút đọc</Text>
              <Text style={s.metaDot}>·</Text>
              <Text style={s.metaText}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/articles/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <Image source={{ uri: image }} style={s.cardImg} contentFit="cover" transition={200} />
        <View style={s.cardInfo}>
          <View style={[s.catBadgeSmall, { backgroundColor: meta.color + '22' }]}>
            <Text style={[s.catBadgeSmallText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={s.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={s.cardExcerpt} numberOfLines={2}>
            {item.excerpt}
          </Text>
          <View style={s.cardMeta}>
            <Ionicons name="time-outline" size={12} color={C.muted} />
            <Text style={s.cardMetaText}>{item.readTimeMinutes} phút đọc</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Cẩm nang mua sắm</Text>
          <Text style={s.headerSub}>Kiến thức & kinh nghiệm từ TapHoa</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : error ? (
        <View style={s.empty}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[s.emptyTitle, { color: '#EF4444' }]}>Lỗi kết nối</Text>
          <Text style={s.emptyText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={s.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : articles.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="book-outline" size={52} color="#D1D5DB" />
          <Text style={s.emptyTitle}>Chưa có bài viết</Text>
          <Text style={s.emptyText}>Chúng tôi đang chuẩn bị nội dung cho bạn</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
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
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  list: { padding: 16, paddingBottom: 32 },

  featured: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E5F9FA',
  },
  featuredImg: { ...StyleSheet.absoluteFill },
  featuredOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 8,
  },
  featuredTitle: { fontSize: 20, fontWeight: '800', color: '#fff', lineHeight: 26 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  metaDot: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },

  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  catBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardImg: { width: 110, height: 110 },
  cardInfo: { flex: 1, padding: 12, gap: 5, justifyContent: 'center' },
  catBadgeSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeSmallText: { fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18 },
  cardExcerpt: { fontSize: 12, color: C.muted, lineHeight: 16 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 11, color: C.muted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
