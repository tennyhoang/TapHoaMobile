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

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email.trim(), password);
      await login(res.accessToken, res.email, res.fullName, res.role);
      router.replace('/(tabs)' as any);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
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
          <Text style={s.tagline}>Tươi ngon — giao tận nhà</Text>
        </Animated.View>
      </View>

      {/* ── FORM CARD ── */}
      <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={s.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.formTitle}>Đăng nhập</Text>
            <Text style={s.formSub}>Chào mừng bạn trở lại</Text>

            {!!error && (
              <View style={s.errBox}>
                <Ionicons name="alert-circle-outline" size={16} color={C.error} />
                <Text style={s.errText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <View style={s.inputRow}>
                <Ionicons name="mail-outline" size={18} color={C.muted} style={s.icon} />
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.field}>
              <Text style={s.label}>Mật khẩu</Text>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={C.muted} style={s.icon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="••••••••"
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

            {/* Submit */}
            <TouchableOpacity
              style={[s.btn, loading && s.btnDim]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={s.btnText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={s.footer}>
              <Text style={s.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                <Text style={s.footerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.primaryDark },

  // Hero
  hero: {
    height: '32%',
    backgroundColor: C.primaryDark,
    justifyContent: 'flex-end',
    paddingBottom: 52,
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
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appName: {
    fontSize: 38,
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    color: C.white,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.4 },

  // Card
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
  form: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 48 },
  formTitle: { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 4 },
  formSub: { fontSize: 14, color: C.muted, marginBottom: 24 },

  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.errorBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errText: { fontSize: 13, color: C.error, flex: 1 },

  field: { marginBottom: 18 },
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
    marginTop: 6,
    marginBottom: 22,
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
