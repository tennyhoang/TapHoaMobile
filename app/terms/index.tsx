import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';

const SECTIONS = [
  {
    title: '1. Điều khoản sử dụng',
    body: `Bằng cách sử dụng ứng dụng TapHoa, bạn đồng ý tuân thủ các điều khoản này. TapHoa là nền tảng thương mại điện tử thực phẩm tươi sống kết nối người mua và hệ thống Hub giao nhận.`,
  },
  {
    title: '2. Tài khoản người dùng',
    body: `• Bạn phải đủ 18 tuổi để tạo tài khoản\n• Thông tin đăng ký phải chính xác và đầy đủ\n• Bạn chịu trách nhiệm bảo mật mật khẩu\n• Không được chia sẻ hoặc chuyển nhượng tài khoản\n• TapHoa có quyền khóa tài khoản vi phạm`,
  },
  {
    title: '3. Đặt hàng và thanh toán',
    body: `• Đơn hàng được xác nhận sau khi thanh toán thành công\n• Giá sản phẩm có thể thay đổi theo thời gian thực\n• Voucher chỉ áp dụng theo điều kiện ghi rõ\n• TapHoa không chịu trách nhiệm về sai lệch thông tin từ nhà cung cấp`,
  },
  {
    title: '4. Giao hàng',
    body: `• Hàng được giao đến Hub gần nhất theo địa chỉ đã chọn\n• Thời gian giao hàng là ước tính, có thể thay đổi\n• Khách hàng cần lấy hàng trong thời gian quy định\n• TapHoa không chịu trách nhiệm nếu khách không đến lấy đúng hạn`,
  },
  {
    title: '5. Hoàn trả và hoàn tiền',
    body: `• Được hoàn trả trong vòng 24h kể từ khi nhận hàng nếu sản phẩm lỗi\n• Hoàn tiền qua Ví TapHoa trong 1-3 ngày làm việc\n• Không chấp nhận hoàn trả sản phẩm đã sử dụng\n• Liên hệ hỗ trợ qua ứng dụng để tạo yêu cầu hoàn trả`,
  },
  {
    title: '6. Giới hạn trách nhiệm',
    body: `TapHoa không chịu trách nhiệm về:\n\n• Thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ\n• Sự cố kỹ thuật ngoài tầm kiểm soát\n• Thông tin không chính xác từ bên thứ ba`,
  },
  {
    title: '7. Điều khoản thay đổi',
    body: `TapHoa có quyền sửa đổi điều khoản bất kỳ lúc nào. Thay đổi sẽ được thông báo qua ứng dụng và có hiệu lực sau 7 ngày.\n\nMọi thắc mắc: legal@taphoa.vn`,
  },
];

export default function TermsScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Điều khoản sử dụng</Text>
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.updated}>Có hiệu lực từ: 01/01/2024</Text>
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
  root: { flex: 1, backgroundColor: '#F8F9FA' },
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
