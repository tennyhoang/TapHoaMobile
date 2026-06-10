import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { authService } from '@/services/auth.service';
import { C } from '@/constants/Colors';

const LC = {
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
  white: '#FFFFFF',
  errorBg: '#FEF2F2',
  successBg: '#F0FDF4',
  success: '#16A34A',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const { top } = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Email không hợp lệ');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={s.blob} />
        <View style={s.headerContent}>
          <View style={s.iconWrap}>
            <Ionicons name="lock-open-outline" size={28} color="#fff" />
          </View>
          <Text style={s.title}>Quên mật khẩu</Text>
          <Text style={s.subtitle}>Nhập email để nhận link đặt lại mật khẩu</Text>
        </View>
      </View>

      <KeyboardAwareScreen style={s.body}>
        {sent ? (
          <View style={s.successCard}>
            <View style={s.successIcon}>
              <Ionicons name="checkmark-circle" size={52} color={LC.success} />
            </View>
            <Text style={s.successTitle}>Email đã được gửi!</Text>
            <Text style={s.successText}>
              Kiểm tra hộp thư <Text style={{ fontWeight: '700' }}>{email}</Text> để đặt lại mật
              khẩu.{'\n'}
              Nhớ kiểm tra cả thư mục Spam.
            </Text>
            <TouchableOpacity
              style={s.btn}
              onPress={() => router.replace('/(auth)/login' as any)}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.cardTitle}>Đặt lại mật khẩu</Text>
            <Text style={s.cardSub}>Chúng tôi sẽ gửi link đặt lại qua email của bạn</Text>

            {!!error && (
              <View style={s.errBox}>
                <Ionicons name="alert-circle-outline" size={16} color={C.error} />
                <Text style={s.errText}>{error}</Text>
              </View>
            )}

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <View style={s.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={C.muted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnDim]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.btnText}>Gửi link đặt lại</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.backLink} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={14} color={C.primary} />
              <Text style={s.backLinkText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScreen>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.primaryDark },
  header: {
    backgroundColor: C.primaryDark,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  blob: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: { alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },

  body: {
    flex: 1,
    backgroundColor: LC.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
  },
  card: { flex: 1 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 6 },
  cardSub: { fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 20 },

  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LC.errorBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errText: { fontSize: 13, color: C.error, flex: 1 },

  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LC.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LC.border,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, fontSize: 15, color: C.text },

  btn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 16,
  },
  btnDim: { opacity: 0.7 },
  btnText: { color: LC.white, fontSize: 16, fontWeight: '700' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  backLinkText: { fontSize: 14, color: C.primary, fontWeight: '600' },

  successCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: LC.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  successText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
});
