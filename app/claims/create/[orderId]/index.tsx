import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { claimsService } from '@/services/claims.service';
import type { ClaimType } from '@/types';
import { C } from '@/constants/Colors';

type ClaimOption = { value: ClaimType; label: string; icon: string };

const CLAIM_TYPES: ClaimOption[] = [
  { value: 'DamagedProduct', label: 'Sản phẩm hư hỏng', icon: 'warning-outline' },
  { value: 'WrongProduct', label: 'Sản phẩm sai', icon: 'swap-horizontal-outline' },
  { value: 'MissingProduct', label: 'Thiếu sản phẩm', icon: 'cube-outline' },
  { value: 'LateDelivery', label: 'Giao hàng trễ', icon: 'time-outline' },
  { value: 'Other', label: 'Khác', icon: 'ellipsis-horizontal-outline' },
];

export default function CreateClaimScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { top } = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<ClaimType | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = selectedType !== null && description.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedType) return;
    setSubmitting(true);
    try {
      await claimsService.create({ orderId, type: selectedType, description: description.trim() });
      Alert.alert(
        'Thành công',
        'Khiếu nại của bạn đã được gửi. Chúng tôi sẽ xem xét và phản hồi sớm.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/claims' as any),
          },
        ]
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi khiếu nại. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Gửi khiếu nại</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.orderInfo}>
          <Ionicons name="receipt-outline" size={16} color={C.muted} />
          <Text style={s.orderInfoText}>Đơn hàng #{orderId?.slice(0, 8).toUpperCase()}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Loại khiếu nại</Text>
          <View style={s.typeList}>
            {CLAIM_TYPES.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.typeItem, selectedType === opt.value && s.typeItemActive]}
                onPress={() => setSelectedType(opt.value)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    s.typeIcon,
                    {
                      backgroundColor: selectedType === opt.value ? C.primary + '20' : C.bg,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={selectedType === opt.value ? C.primary : C.muted}
                  />
                </View>
                <Text style={[s.typeLabel, selectedType === opt.value && s.typeLabelActive]}>
                  {opt.label}
                </Text>
                {selectedType === opt.value && (
                  <Ionicons name="checkmark-circle" size={18} color={C.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Mô tả chi tiết</Text>
          <TextInput
            style={s.textArea}
            placeholder="Mô tả vấn đề bạn gặp phải (tối thiểu 10 ký tự)..."
            placeholderTextColor={C.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={s.charCount}>{description.length}/1000</Text>
        </View>

        <TouchableOpacity
          style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={s.submitText}>Gửi khiếu nại</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={s.notice}>
          Chúng tôi sẽ xem xét khiếu nại và phản hồi trong vòng 1-3 ngày làm việc.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.primaryDark,
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
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  orderInfoText: { fontSize: 13, color: C.muted, fontVariant: ['tabular-nums'] },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  typeList: { gap: 8 },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  typeItemActive: { borderColor: C.primary, backgroundColor: C.primary + '08' },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: { flex: 1, fontSize: 14, color: C.text, fontWeight: '500' },
  typeLabelActive: { color: C.primary, fontWeight: '600' },
  textArea: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 14,
    color: C.text,
    minHeight: 120,
    lineHeight: 20,
  },
  charCount: { fontSize: 11, color: C.muted, textAlign: 'right' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  submitBtnDisabled: { backgroundColor: C.border },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  notice: { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 18 },
});
