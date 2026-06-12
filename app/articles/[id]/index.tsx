import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  articlesService,
  getCategoryMeta,
  getArticleImage,
  type Article,
} from '@/services/articles.service';
import { C } from '@/constants/Colors';

const ARTICLE_BG = '#FFFFFF';

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      elements.push(<View key={key++} style={{ height: 12 }} />);
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <Text key={key++} style={md.h3}>
          {line.slice(4)}
        </Text>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <Text key={key++} style={md.h2}>
          {line.slice(3)}
        </Text>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <Text key={key++} style={md.h1}>
          {line.slice(2)}
        </Text>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <View key={key++} style={md.bulletRow}>
          <Text style={md.bullet}>•</Text>
          <Text style={md.bulletText}>{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</Text>
        </View>
      );
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1] ?? '1';
      const text = line.replace(/^\d+\. /, '');
      elements.push(
        <View key={key++} style={md.bulletRow}>
          <Text style={md.bullet}>{num}.</Text>
          <Text style={md.bulletText}>{text.replace(/\*\*(.*?)\*\*/g, '$1')}</Text>
        </View>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <View key={key++} style={md.blockquote}>
          <Text style={md.blockquoteText}>{line.slice(2)}</Text>
        </View>
      );
    } else {
      const cleaned = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      elements.push(
        <Text key={key++} style={md.para}>
          {cleaned}
        </Text>
      );
    }
  }

  return elements;
}

export default function ArticleDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articlesService
      .getAll()
      .then(articles => {
        setArticle(articles.find(a => a.id === id) ?? null);
      })
      .catch(() => console.warn('Failed to load article'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={s.center}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={s.center}>
        <Ionicons name="document-outline" size={48} color="#D1D5DB" />
        <Text style={{ color: C.muted, marginTop: 12 }}>Không tìm thấy bài viết</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: C.primary, fontWeight: '600' }}>← {t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = getCategoryMeta(article.category);
  const image = getArticleImage(article);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Hero image */}
        <View style={s.hero}>
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={s.heroOverlay} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={[s.catBadge, { backgroundColor: meta.color + 'DD' }]}>
              <Text style={s.catText}>{meta.label}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* Title */}
          <Text style={s.title}>{article.title}</Text>

          {/* Meta */}
          <View style={s.metaRow}>
            <Ionicons name="time-outline" size={14} color={C.muted} />
            <Text style={s.metaText}>{article.readTimeMinutes} phút đọc</Text>
            <Text style={s.metaDot}>·</Text>
            <Ionicons name="calendar-outline" size={14} color={C.muted} />
            <Text style={s.metaText}>
              {new Date(article.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>

          {/* Excerpt */}
          <Text style={s.excerpt}>{article.excerpt}</Text>

          <View style={s.divider} />

          {/* Content */}
          <View>{renderMarkdown(article.content)}</View>

          {/* CTA */}
          <View style={s.cta}>
            <Text style={s.ctaTitle}>Mua ngay tại TapHoa</Text>
            <Text style={s.ctaSub}>Hàng nghìn sản phẩm tươi ngon — giao tận Hub gần bạn</Text>
            <TouchableOpacity
              style={s.ctaBtn}
              onPress={() => router.push('/(tabs)/products' as any)}
              activeOpacity={0.85}
            >
              <Text style={s.ctaBtnText}>Khám phá sản phẩm</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: ARTICLE_BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: ARTICLE_BG },
  hero: {
    height: 280,
    backgroundColor: '#E5F9FA',
    paddingTop: 0,
  },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  catText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  body: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, lineHeight: 32, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaText: { fontSize: 13, color: C.muted },
  metaDot: { color: '#D1D5DB' },
  excerpt: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 20 },

  cta: {
    marginTop: 32,
    backgroundColor: '#E5F9FA',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: C.primaryDark },
  ctaSub: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 18 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

const md = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8, marginTop: 12 },
  h2: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6, marginTop: 16 },
  h3: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4, marginTop: 12 },
  para: { fontSize: 15, color: '#374151', lineHeight: 24, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 4, paddingLeft: 4 },
  bullet: { fontSize: 15, color: C.muted, width: 16 },
  bulletText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
    paddingLeft: 12,
    marginVertical: 8,
    backgroundColor: '#E5F9FA',
    borderRadius: 4,
    padding: 12,
  },
  blockquoteText: { fontSize: 14, color: C.primaryDark, fontStyle: 'italic', lineHeight: 21 },
});
