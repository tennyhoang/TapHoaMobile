import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/constants/Colors';
import { useAuth } from '@/lib/auth-context';
import { profileService } from '@/services/profile.service';
import { useWalletBalance } from '@/lib/hooks/useWallet';
import { formatCurrency } from '@/lib/utils';

type MenuItem = {
  icon: string;
  label: string;
  color: string;
  route: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const ACCOUNT_ITEMS: MenuItem[] = [
  { icon: 'receipt-outline', label: 'Đơn hàng của tôi', color: C.primary, route: '/orders' },
  {
    icon: 'chatbubble-ellipses-outline',
    label: 'Khiếu nại của tôi',
    color: '#EF4444',
    route: '/claims',
  },
  { icon: 'heart-outline', label: 'Sản phẩm yêu thích', color: '#F43F5E', route: '/wishlist' },
  { icon: 'location-outline', label: 'Địa chỉ giao hàng', color: '#8B5CF6', route: '/addresses' },
  {
    icon: 'notifications-outline',
    label: 'Thông báo',
    color: '#F59E0B',
    route: '/notifications',
  },
];

const SUPPORT_ITEMS: MenuItem[] = [
  { icon: 'book-outline', label: 'Cẩm nang mua sắm', color: '#16A34A', route: '/articles' },
  { icon: 'help-circle-outline', label: 'Hỗ trợ & FAQ', color: C.muted, route: '/help' },
];

const LEGAL_ITEMS: MenuItem[] = [
  {
    icon: 'shield-checkmark-outline',
    label: 'Chính sách bảo mật',
    color: C.muted,
    route: '/privacy-policy',
  },
  {
    icon: 'document-text-outline',
    label: 'Điều khoản sử dụng',
    color: C.muted,
    route: '/terms',
  },
];

function roleBadgeLabel(role: string | undefined): string {
  switch (role) {
    case 'Agent':
      return 'Đại lý';
    case 'Driver':
      return 'Tài xế';
    case 'WarehouseManager':
      return 'Quản lý kho';
    case 'Admin':
      return 'Quản trị viên';
    default:
      return 'Thành viên';
  }
}

function MenuCard({ section }: { section: MenuSection }) {
  return (
    <View style={s.menuSection}>
      <Text style={s.sectionTitle}>{section.title}</Text>
      <View style={s.menuCard}>
        {section.items.map((item, i) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity
              style={s.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[s.menuIcon, { backgroundColor: item.color + '1A' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
            {i < section.items.length - 1 && <View style={s.menuDivider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: walletData } = useWalletBalance();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login' as any);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xoá tài khoản',
      'Tất cả dữ liệu của bạn sẽ bị xoá vĩnh viễn. Bạn có chắc chắn không?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá tài khoản',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.deleteAccount();
              await logout();
              router.replace('/(auth)/login' as any);
            } catch {
              Alert.alert('Lỗi', 'Không thể xoá tài khoản. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const initials = user?.fullName?.charAt(0)?.toUpperCase() ?? '?';
  const balance = walletData?.balance ?? 0;

  /* Role-specific portal items */
  const rolePortalSection: MenuSection | null = (() => {
    switch (user?.role) {
      case 'Agent':
        return {
          title: 'CỔNG ĐẠI LÝ',
          items: [
            {
              icon: 'storefront-outline',
              label: 'Cổng Agent',
              color: '#4F46E5',
              route: '/agent',
            },
          ],
        };
      case 'Driver':
        return {
          title: 'CỔNG TÀI XẾ',
          items: [
            {
              icon: 'bicycle-outline',
              label: 'Cổng Tài xế',
              color: '#7C3AED',
              route: '/driver',
            },
          ],
        };
      case 'WarehouseManager':
        return {
          title: 'QUẢN LÝ KHO',
          items: [
            {
              icon: 'business-outline',
              label: 'Cổng Quản lý kho',
              color: '#0891B2',
              route: '/warehouse',
            },
          ],
        };
      case 'Admin':
        return {
          title: 'QUẢN TRỊ',
          items: [
            {
              icon: 'shield-outline',
              label: 'Admin Dashboard',
              color: '#FF6B00',
              route: '/admin',
            },
          ],
        };
      default:
        return null;
    }
  })();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet card */}
        <LinearGradient
          colors={['#0EA5AE', '#0891b2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.walletCard}
        >
          <View style={s.walletTop}>
            <View style={s.walletLeft}>
              <View style={s.walletIconWrap}>
                <Ionicons name="wallet-outline" size={20} color="#fff" />
              </View>
              <Text style={s.walletLabel}>Số dư ví TapHoa</Text>
              <Text style={s.walletBalance}>{formatCurrency(balance)}</Text>
            </View>
            <View style={s.walletRight}>
              <View style={s.memberBadge}>
                <Ionicons name="star-outline" size={13} color="#fff" />
                <Text style={s.memberText}>{roleBadgeLabel(user?.role)}</Text>
              </View>
            </View>
          </View>

          <View style={s.walletActions}>
            <TouchableOpacity
              style={s.walletActionBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/wallet' as any)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={s.walletActionText}>Nạp tiền</Text>
            </TouchableOpacity>
            <View style={s.walletActionDivider} />
            <TouchableOpacity
              style={s.walletActionBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/wallet' as any)}
            >
              <Ionicons name="arrow-up-circle-outline" size={16} color="#fff" />
              <Text style={s.walletActionText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Profile info card */}
        <View style={s.profileCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.fullName}</Text>
            <Text style={s.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={s.editLink}
            activeOpacity={0.7}
            onPress={() => router.push('/profile-edit' as any)}
          >
            <Text style={s.editLinkText}>Chỉnh sửa hồ sơ</Text>
            <Ionicons name="chevron-forward" size={14} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* Main account menu */}
        <MenuCard section={{ title: 'TÀI KHOẢN', items: ACCOUNT_ITEMS }} />

        {/* Role portal */}
        {rolePortalSection && <MenuCard section={rolePortalSection} />}

        {/* Support */}
        <MenuCard section={{ title: 'HỖ TRỢ', items: SUPPORT_ITEMS }} />

        {/* Legal */}
        <MenuCard section={{ title: 'PHÁP LÝ', items: LEGAL_ITEMS }} />

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={C.error} />
          <Text style={s.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
          <Text style={s.deleteText}>Xoá tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FAFA' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  /* Wallet card */
  walletCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  walletLeft: { flex: 1 },
  walletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  walletBalance: { fontSize: 26, fontWeight: '800', color: '#fff' },
  walletRight: { alignItems: 'flex-end' },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  walletActions: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  walletActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  walletActionDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  walletActionText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  /* Profile info card */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5F9FA',
    borderWidth: 2,
    borderColor: C.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: C.primary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 3 },
  profileEmail: { fontSize: 13, color: C.muted },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editLinkText: { fontSize: 13, fontWeight: '600', color: C.primary },

  /* Menu sections */
  menuSection: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 70 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: C.text },

  /* Logout / delete */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 52,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: C.error },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  deleteText: { fontSize: 13, color: '#9CA3AF' },
});
