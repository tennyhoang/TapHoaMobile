import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/services/auth.service';

const C = {
  primary: '#0EA5AE',
  primaryDark: '#067478',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
  white: '#FFFFFF',
  error: '#EF4444',
  errorBg: '#FEF2F2',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(0|\+84)[3-9]\d{8}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function RegisterScreen() {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cardY = useMemo(() => new Animated.Value(60), []);
  const cardOpacity = useMemo(() => new Animated.Value(0), []);
  const headerY = useMemo(() => new Animated.Value(-24), []);
  const headerOpacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(headerY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        delay: 180,
        useNativeDriver: true,
      }),
      Animated.spring(cardY, {
        toValue: 0,
        tension: 60,
        friction: 11,
        delay: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Email không hợp lệ');
      return;
    }
    if (phone.trim() && !PHONE_RE.test(phone.trim())) {
      setError('Số điện thoại không hợp lệ (VD: 0912345678)');
      return;
    }
    if (!PASSWORD_RE.test(password)) {
      setError('Mật khẩu tối thiểu 8 ký tự, có cả chữ lẫn số');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authService.register(
        fullName.trim(),
        email.trim(),
        password,
        phone.trim() || undefined
      );
      await login(res.accessToken, res.email, res.fullName, res.role);
      router.replace('/(tabs)' as any);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* ── HERO ── */}
      <View style={s.hero}>
        <View style={s.blob1} />
        <View style={s.blob2} />
        <View style={s.blob3} />

        <Animated.View
          style={[s.logoWrap, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}
        >
          <View style={s.logoBox}>
            <Ionicons name="leaf" size={30} color={C.white} />
          </View>
          <Text style={s.appName}>Tạp Hóa</Text>
          <Text style={s.tagline}>Tham gia cộng đồng mua sắm sạch</Text>
        </Animated.View>
      </View>

      {/* ── FORM CARD ── */}
      <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={s.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.formTitle}>Đăng ký</Text>
            <Text style={s.formSub}>Tạo tài khoản mới chỉ mất 1 phút</Text>

            {!!error && (
              <View style={s.errBox}>
                <Ionicons name="alert-circle-outline" size={16} color={C.error} />
                <Text style={s.errText}>{error}</Text>
              </View>
            )}

            <Field
              label="Họ và tên"
              icon="person-outline"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn A"
            />
            <Field
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Số điện thoại (tuỳ chọn)"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="0912 345 678"
              keyboardType="phone-pad"
            />

            {/* Password */}
            <View style={s.field}>
              <Text style={s.label}>Mật khẩu</Text>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={C.muted} style={s.icon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Tối thiểu 8 ký tự, có chữ và số"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={C.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={s.field}>
              <Text style={s.label}>Xác nhận mật khẩu</Text>
              <View style={s.inputRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={C.muted}
                  style={s.icon}
                />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.eyeBtn}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={C.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnDim]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={s.btnText}>Tạo tài khoản</Text>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={s.footerLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

type FieldProps = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
};

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'words',
}: FieldProps) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <Ionicons name={icon} size={18} color={C.muted} style={s.icon} />
        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.primaryDark },

  hero: {
    height: '32%',
    backgroundColor: C.primaryDark,
    justifyContent: 'flex-end',
    paddingBottom: 48,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blob2: {
    position: 'absolute',
    top: 30,
    right: 60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  blob3: {
    position: 'absolute',
    bottom: 10,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  logoWrap: { alignItems: 'center' },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appName: {
    fontSize: 34,
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    color: C.white,
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.3 },

  card: {
    flex: 1,
    backgroundColor: C.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },
  form: { paddingHorizontal: 28, paddingTop: 28, paddingBottom: 48 },
  formTitle: { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 4 },
  formSub: { fontSize: 14, color: C.muted, marginBottom: 22 },

  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.errorBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errText: { fontSize: 13, color: C.error, flex: 1 },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 50,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.text },
  eyeBtn: { padding: 4, marginLeft: 6 },

  btn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  btnDim: { opacity: 0.7 },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: C.muted },
  footerLink: { fontSize: 14, color: C.primary, fontWeight: '600' },
});
