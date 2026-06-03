import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';

const SECTIONS = [
  {
    title: '1. Thông tin chúng tôi thu thập',
    body: `Chúng tôi thu thập các thông tin sau khi bạn sử dụng TapHoa:\n\n• Thông tin tài khoản: họ tên, email, số điện thoại\n• Thông tin giao dịch: lịch sử đơn hàng, phương thức thanh toán\n• Địa chỉ giao hàng và điểm Hub ưa thích\n• Dữ liệu thiết bị: token thông báo, hệ điều hành\n• Dữ liệu sử dụng: tìm kiếm, sản phẩm đã xem`,
  },
  {
    title: '2. Mục đích sử dụng',
    body: `Dữ liệu được sử dụng để:\n\n• Xử lý đơn hàng và thanh toán\n• Gửi thông báo về trạng thái đơn hàng\n• Cải thiện trải nghiệm mua sắm\n• Ngăn chặn gian lận và bảo mật tài khoản\n• Gửi thông tin khuyến mãi (nếu bạn đồng ý)`,
  },
  {
    title: '3. Chia sẻ dữ liệu',
    body: `Chúng tôi KHÔNG bán dữ liệu cá nhân của bạn. Dữ liệu chỉ được chia sẻ với:\n\n• Đối tác vận chuyển để thực hiện giao hàng\n• Cổng thanh toán để xử lý giao dịch\n• Cơ quan pháp luật khi có yêu cầu hợp lệ`,
  },
  {
    title: '4. Bảo mật dữ liệu',
    body: `Chúng tôi áp dụng các biện pháp bảo mật:\n\n• Mã hóa dữ liệu truyền tải (HTTPS/TLS)\n• Token xác thực lưu trong Secure Store\n• Xác thực sinh trắc học cho giao dịch nhạy cảm\n• Tự động đăng xuất sau 15 phút không hoạt động`,
  },
  {
    title: '5. Quyền của bạn',
    body: `Bạn có quyền:\n\n• Xem và cập nhật thông tin cá nhân\n• Yêu cầu xóa tài khoản và toàn bộ dữ liệu\n• Từ chối nhận thông báo marketing\n• Xuất dữ liệu cá nhân\n\nĐể thực hiện các quyền này, liên hệ: support@taphoa.vn`,
  },
  {
    title: '6. Liên hệ',
    body: `Nếu có thắc mắc về chính sách bảo mật:\n\nEmail: privacy@taphoa.vn\nĐịa chỉ: Hà Nội, Việt Nam\n\nChính sách này có hiệu lực từ 01/01/2024.`,
  },
];

export default function PrivacyPolicyScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chính sách bảo mật</Text>
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.updated}>Cập nhật lần cuối: 01/01/2024</Text>
        {SECTIONS.map(sec => (
          <View key={sec.title} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}
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
  body: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: C.muted, marginBottom: 20 },
  section: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 10 },
  sectionBody: { fontSize: 14, color: C.muted, lineHeight: 22 },
});
