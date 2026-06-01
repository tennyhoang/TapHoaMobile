import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { profileService } from '@/services/profile.service';
import { useToast } from '@/components/Toast';

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

export default function ProfileEditScreen() {
  const { top } = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const { show } = useToast();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');

  useEffect(() => {
    profileService
      .getMe()
      .then(me => {
        setFullName(me.fullName);
        setPhoneNumber(me.phoneNumber ?? '');
      })
      .catch(() => {});
  }, []);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setProfileError('Tên không được để trống');
      return;
    }
    setProfileError('');
    setSaving(true);
    try {
      const res = await profileService.update({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });
      await updateUser({ fullName: res.fullName, phoneNumber: res.phoneNumber });
      show('Thông tin đã được cập nhật');
      router.back();
    } catch (err) {
      show(err instanceof Error ? err.message : 'Không thể cập nhật thông tin', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (newPw.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Xác nhận mật khẩu không khớp');
      return;
    }
    setPwError('');
    setChangingPw(true);
    try {
      await profileService.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setShowPwSection(false);
      show('Mật khẩu đã được thay đổi');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Không thể đổi mật khẩu', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chỉnh sửa hồ sơ</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar placeholder */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{fullName.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={s.email}>{user?.email}</Text>
        </View>

        {/* Profile info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Thông tin cá nhân</Text>
          <View style={s.card}>
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Họ và tên</Text>
              <TextInput
                style={s.fieldInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
              />
            </View>
            <View style={[s.fieldWrap, s.fieldBorderTop]}>
              <Text style={s.fieldLabel}>Số điện thoại</Text>
              <TextInput
                style={s.fieldInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {!!profileError && (
            <View style={s.errBox}>
              <Ionicons name="alert-circle-outline" size={15} color={C.error} />
              <Text style={s.errText}>{profileError}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.65 }]}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={18} color="#fff" />
                <Text style={s.saveBtnText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Change password */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.pwToggle}
            onPress={() => setShowPwSection(v => !v)}
            activeOpacity={0.8}
          >
            <View style={s.pwToggleLeft}>
              <View style={s.pwIcon}>
                <Ionicons name="lock-closed-outline" size={18} color={C.primary} />
              </View>
              <Text style={s.sectionTitle}>Đổi mật khẩu</Text>
            </View>
            <Ionicons
              name={showPwSection ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={C.muted}
            />
          </TouchableOpacity>

          {showPwSection && (
            <View style={[s.card, { marginTop: 10 }]}>
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Mật khẩu hiện tại</Text>
                <View style={s.pwRow}>
                  <TextInput
                    style={[s.fieldInput, { flex: 1 }]}
                    value={currentPw}
                    onChangeText={setCurrentPw}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showCurrent}
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(v => !v)}>
                    <Ionicons
                      name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={C.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[s.fieldWrap, s.fieldBorderTop]}>
                <Text style={s.fieldLabel}>Mật khẩu mới</Text>
                <View style={s.pwRow}>
                  <TextInput
                    style={[s.fieldInput, { flex: 1 }]}
                    value={newPw}
                    onChangeText={setNewPw}
                    placeholder="Ít nhất 6 ký tự"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showNew}
                  />
                  <TouchableOpacity onPress={() => setShowNew(v => !v)}>
                    <Ionicons
                      name={showNew ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={C.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[s.fieldWrap, s.fieldBorderTop]}>
                <Text style={s.fieldLabel}>Xác nhận mật khẩu mới</Text>
                <TextInput
                  style={s.fieldInput}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
              </View>

              {!!pwError && (
                <View style={[s.errBox, { margin: 12, marginBottom: 0 }]}>
                  <Ionicons name="alert-circle-outline" size={15} color={C.error} />
                  <Text style={s.errText}>{pwError}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.changePwBtn, changingPw && { opacity: 0.65 }]}
                onPress={handleChangePassword}
                disabled={changingPw}
                activeOpacity={0.85}
              >
                {changingPw ? (
                  <ActivityIndicator color={C.primary} size="small" />
                ) : (
                  <Text style={s.changePwBtnText}>Xác nhận đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.primaryDark,
    paddingTop: 0,
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  body: { padding: 16, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primary + '22',
    borderWidth: 2,
    borderColor: C.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: C.primary },
  email: { fontSize: 13, color: C.muted },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldBorderTop: { borderTopWidth: 1, borderTopColor: C.border },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  fieldInput: { fontSize: 15, color: C.text, padding: 0 },
  pwRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: C.primary,
    borderRadius: 14,
    marginTop: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  pwToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pwToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pwIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePwBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  changePwBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  errText: { flex: 1, fontSize: 12, color: C.error, fontWeight: '500' },
});
