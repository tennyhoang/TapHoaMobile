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
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import KeyboardAwareScreen from '@/components/KeyboardAwareScreen';
import { C } from '@/constants/Colors';
import { useRoleGuard } from '@/lib/useRoleGuard';
import { adminService, type UpdateUserPayload } from '@/services/admin.service';
import { useToast } from '@/components/Toast';
import type { AdminUser } from '@/types';
import EmptyState from '@/components/EmptyState';

const ROLES = ['Customer', 'Admin', 'Agent', 'Driver', 'WarehouseManager'];

const ROLE_LABEL: Record<string, string> = {
  Admin: 'Admin',
  Customer: 'Khách hàng',
  Agent: 'Agent',
  Driver: 'Tài xế',
  WarehouseManager: 'QL Kho',
};

const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
  Admin: { bg: '#E5F9FA', text: C.primary },
  Customer: { bg: '#F3F4F6', text: '#374151' },
  Agent: { bg: '#FEF3C7', text: '#92400E' },
  Driver: { bg: '#DCFCE7', text: '#166534' },
  WarehouseManager: { bg: '#EDE9FE', text: '#6D28D9' },
};

function EditUserModal({
  user,
  onSave,
  onClose,
  loading,
}: {
  user: AdminUser;
  onSave: (payload: UpdateUserPayload) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);

  return (
    <View style={m.container}>
      <View style={m.header}>
        <Text style={m.title}>Chỉnh sửa người dùng</Text>
        <TouchableOpacity onPress={onClose} style={m.closeBtn}>
          <Ionicons name="close" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={m.body} keyboardShouldPersistTaps="handled">
        <View style={m.userInfo}>
          <View style={m.avatarCircle}>
            <Text style={m.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={m.userName}>{user.fullName}</Text>
            <Text style={m.userEmail}>{user.email}</Text>
          </View>
        </View>

        <Text style={m.label}>{t('admin.user_role')}</Text>
        <View style={m.roleGrid}>
          {ROLES.map(role => (
            <TouchableOpacity
              key={role}
              style={[m.roleChip, selectedRole === role && m.roleChipActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[m.roleChipText, selectedRole === role && m.roleChipTextActive]}>
                {ROLE_LABEL[role] ?? role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={m.label}>{t('admin.user_status')}</Text>
        <View style={m.statusRow}>
          <TouchableOpacity
            style={[m.statusBtn, isActive && m.statusBtnActive]}
            onPress={() => setIsActive(true)}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={isActive ? '#fff' : C.muted}
            />
            <Text style={[m.statusBtnText, isActive && { color: '#fff' }]}>
              {t('admin.user_active')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[m.statusBtn, !isActive && m.statusBtnInactive]}
            onPress={() => setIsActive(false)}
          >
            <Ionicons name="ban-outline" size={16} color={!isActive ? '#fff' : C.muted} />
            <Text style={[m.statusBtnText, !isActive && { color: '#fff' }]}>Khoá</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[m.saveBtn, loading && m.saveBtnDim]}
          onPress={() => onSave({ role: selectedRole, isActive })}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={m.saveBtnText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const unauthorized = useRoleGuard('Admin');
  const { show } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (reset = false, searchVal = search, roleVal = filterRole) => {
      const nextPage = reset ? 1 : page + 1;
      if (!reset) setLoadingMore(true);
      try {
        const res = await adminService.users.getAll({
          page: nextPage,
          pageSize: 20,
          search: searchVal || undefined,
          role: roleVal || undefined,
        });
        setUsers(prev => (reset ? (res.items ?? []) : [...prev, ...(res.items ?? [])]));
        setHasMore(nextPage < res.totalPages);
        setPage(nextPage);
      } catch {
        show('Không thể tải danh sách', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [page, search, filterRole]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(true);
    }, [])
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    setLoading(true);
    load(true, text, filterRole);
  };

  const handleRoleFilter = (role: string) => {
    const next = filterRole === role ? '' : role;
    setFilterRole(next);
    setLoading(true);
    load(true, search, next);
  };

  const handleSave = async (payload: UpdateUserPayload) => {
    if (!editing) return;
    setMutating(true);
    try {
      const updated = await adminService.users.update(editing.id, payload);
      setUsers(prev => prev.map(u => (u.id === editing.id ? updated : u)));
      show('Đã cập nhật người dùng');
      setEditing(null);
    } catch {
      show('Cập nhật thất bại', 'error');
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = (user: AdminUser) => {
    Alert.alert('Xoá người dùng', t('admin.delete_confirm', { name: user.fullName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.users.delete(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            show('Đã xoá tài khoản');
          } catch {
            show('Không thể xoá tài khoản', 'error');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: AdminUser }) => {
    const rc = ROLE_COLOR[item.role] ?? { bg: '#F3F4F6', text: '#374151' };
    return (
      <View style={[s.card, !item.isActive && s.cardInactive]}>
        <View style={s.cardLeft}>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.userInfo}>
              <View style={s.nameRow}>
                <Text style={s.userName}>{item.fullName}</Text>
                {!item.isActive && (
                  <View style={s.lockedBadge}>
                    <Text style={s.lockedText}>Khoá</Text>
                  </View>
                )}
              </View>
              <Text style={s.userEmail} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </View>
          <View style={s.metaRow}>
            <View style={[s.roleBadge, { backgroundColor: rc.bg }]}>
              <Text style={[s.roleText, { color: rc.text }]}>
                {ROLE_LABEL[item.role] ?? item.role}
              </Text>
            </View>
            {item.phoneNumber ? <Text style={s.phone}>{item.phoneNumber}</Text> : null}
          </View>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity style={s.iconBtn} onPress={() => setEditing(item)}>
            <Ionicons name="pencil-outline" size={18} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (unauthorized) return null;

  return (
    <KeyboardAwareScreen style={s.root} noDismiss>
      <ScreenHeader title={t('admin.users')} />

      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={18} color={C.muted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Tìm tên, email..."
          placeholderTextColor={C.muted}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={C.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterBar}
        contentContainerStyle={s.filterContent}
      >
        {['Customer', 'Admin', 'Agent', 'Driver', 'WarehouseManager'].map(role => (
          <TouchableOpacity
            key={role}
            style={[s.filterChip, filterRole === role && s.filterChipActive]}
            onPress={() => handleRoleFilter(role)}
          >
            <Text style={[s.filterChipText, filterRole === role && s.filterChipTextActive]}>
              {ROLE_LABEL[role]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={C.primary}
            />
          }
          onEndReached={() => {
            if (!loadingMore && hasMore) load(false);
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<EmptyState icon="people-outline" title="Không có người dùng nào" />}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ padding: 16 }} /> : null
          }
        />
      )}

      <Modal
        visible={!!editing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditing(null)}
      >
        {editing && (
          <EditUserModal
            user={editing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
            loading={mutating}
          />
        )}
      </Modal>
    </KeyboardAwareScreen>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginBottom: 8,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.text },
  filterBar: {
    flexGrow: 0,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText: { fontSize: 12, fontWeight: '500', color: C.muted },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardInactive: { opacity: 0.6 },
  cardLeft: { flex: 1, gap: 8 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: C.primary },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 14, fontWeight: '700', color: C.text },
  userEmail: { fontSize: 12, color: C.muted },
  lockedBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lockedText: { fontSize: 10, color: '#EF4444', fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },
  phone: { fontSize: 12, color: C.muted },
  cardActions: { gap: 8 },
  iconBtn: { padding: 6 },
});

const m = StyleSheet.create({
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: C.primary },
  userName: { fontSize: 15, fontWeight: '700', color: C.text },
  userEmail: { fontSize: 13, color: C.muted, marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8, marginTop: 16 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  roleChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  roleChipText: { fontSize: 13, color: C.muted, fontWeight: '500' },
  roleChipTextActive: { color: '#fff', fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  statusBtnActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  statusBtnInactive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  statusBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
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
