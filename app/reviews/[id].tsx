import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import { reviewsService } from '@/services/reviews.service';
import type { Review } from '@/types';
import { C } from '@/constants/Colors';

function Stars({
  rating,
  size = 14,
  interactive = false,
  onRate,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (n: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity
          key={n}
          onPress={() => interactive && onRate?.(n)}
          disabled={!interactive}
          activeOpacity={0.7}
        >
          <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={size} color={C.star} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const { top } = useSafeAreaInsets();
  const { id: productId, name: productName } = useLocalSearchParams<{
    id: string;
    name: string;
  }>();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(
    async (nextPage: number, reset = false) => {
      try {
        const res = await reviewsService.getByProduct(productId!, nextPage, 20);
        setReviews(prev => (reset ? res.items : [...prev, ...res.items]));
        setHasMore(nextPage < res.totalPages);
        setPage(nextPage);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    loadReviews(1, true);
  }, [loadReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews(1, true);
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    loadReviews(page + 1);
  };

  const handleSubmit = async () => {
    if (myRating === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao');
      return;
    }
    setSubmitting(true);
    try {
      const review = await reviewsService.submit(productId!, {
        rating: myRating,
        comment: myComment.trim() || undefined,
      });
      setReviews(prev => [review, ...prev]);
      setShowForm(false);
      setMyRating(5);
      setMyComment('');
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const renderReview = ({ item }: { item: Review }) => (
    <View style={s.reviewCard}>
      <View style={s.reviewHeader}>
        <View style={s.reviewAvatar}>
          <Text style={s.reviewAvatarText}>{item.userName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={s.reviewMeta}>
          <Text style={s.reviewName}>{item.userName}</Text>
          <Text style={s.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Stars rating={item.rating} size={13} />
      </View>
      {item.comment ? <Text style={s.reviewComment}>{item.comment}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Đánh giá</Text>
          {productName ? (
            <Text style={s.headerSub} numberOfLines={1}>
              {productName}
            </Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item.id}
          renderItem={renderReview}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            <View style={s.summary}>
              <Text style={s.summaryScore}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</Text>
              <View style={s.summaryRight}>
                <Stars rating={Math.round(avgRating)} size={18} />
                <Text style={s.summaryCount}>{reviews.length} đánh giá</Text>
              </View>
            </View>
          }
          ListEmptyComponent={<EmptyState icon="chatbubble-outline" title="Chưa có đánh giá nào" />}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ padding: 16 }} /> : null
          }
        />
      )}

      {/* Write review form */}
      {showForm ? (
        <View style={s.formWrap}>
          <Text style={s.formTitle}>Đánh giá của bạn</Text>
          <Stars rating={myRating} size={32} interactive onRate={setMyRating} />
          <TextInput
            style={s.commentInput}
            placeholder="Nhận xét (tuỳ chọn)..."
            placeholderTextColor="#9CA3AF"
            value={myComment}
            onChangeText={setMyComment}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <View style={s.formBtns}>
            <TouchableOpacity
              style={s.cancelFormBtn}
              onPress={() => setShowForm(false)}
              activeOpacity={0.8}
            >
              <Text style={s.cancelFormText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, submitting && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.submitBtnText}>Gửi đánh giá</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={s.writeBar}>
          <TouchableOpacity
            style={s.writeBtn}
            onPress={() => setShowForm(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={s.writeBtnText}>Viết đánh giá</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
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
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  list: { padding: 16, paddingBottom: 100 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 16,
  },
  summaryScore: { fontSize: 48, fontWeight: '800', color: C.text },
  summaryRight: { gap: 6 },
  summaryCount: { fontSize: 13, color: C.muted },

  reviewCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 15, fontWeight: '700', color: C.primary },
  reviewMeta: { flex: 1 },
  reviewName: { fontSize: 13, fontWeight: '600', color: C.text },
  reviewDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  reviewComment: { fontSize: 14, color: C.text, lineHeight: 20 },

  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 14, color: C.muted },

  writeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: C.primary,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  writeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  formWrap: {
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 20,
    gap: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  commentInput: {
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formBtns: { flexDirection: 'row', gap: 10 },
  cancelFormBtn: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  cancelFormText: { fontSize: 14, fontWeight: '600', color: C.muted },
  submitBtn: {
    flex: 2,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
