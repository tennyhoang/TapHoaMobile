import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';
import ScreenHeader from '@/components/ScreenHeader';

const FAQS = [
  {
    q: 'Làm sao để đặt hàng?',
    a: 'Chọn sản phẩm → Thêm vào giỏ hàng → Vào Giỏ hàng → Thanh toán → Chọn Hub gần nhà → Đặt hàng.',
  },
  {
    q: 'Hub là gì?',
    a: 'Hub là điểm giao nhận hàng gần nhà bạn. Sau khi đặt hàng, hàng sẽ được giao đến Hub và bạn đến lấy theo giờ quy định.',
  },
  {
    q: 'Tôi có thể đổi Hub sau khi đặt hàng không?',
    a: 'Không. Hub được chọn lúc thanh toán và không thể thay đổi sau khi đã đặt. Vui lòng kiểm tra kỹ trước khi xác nhận.',
  },
  {
    q: 'Phương thức thanh toán nào được hỗ trợ?',
    a: 'Hiện tại TapHoa hỗ trợ: COD (tiền mặt tại Hub), Chuyển khoản ngân hàng (VietQR), và Ví TapHoa.',
  },
  {
    q: 'Làm sao để nạp tiền vào Ví TapHoa?',
    a: 'Vào Tài khoản → Ví của tôi → Nạp tiền → Chọn số tiền → Quét mã QR chuyển khoản ngân hàng.',
  },
  {
    q: 'Tôi có thể huỷ đơn hàng không?',
    a: 'Có thể huỷ khi đơn đang ở trạng thái "Chờ thanh toán" hoặc "Đã thanh toán". Sau khi giao cho tài xế thì không thể huỷ.',
  },
  {
    q: 'Làm sao để yêu cầu hoàn trả?',
    a: 'Vào Đơn hàng → chọn đơn đã Hoàn thành → nhấn "Yêu cầu hoàn trả". Chúng tôi xử lý trong 1-3 ngày làm việc.',
  },
  {
    q: 'Sản phẩm có đảm bảo tươi ngon không?',
    a: 'Tất cả sản phẩm được kiểm định chất lượng hàng ngày. Nếu nhận hàng không đúng chất lượng, hãy liên hệ hỗ trợ trong vòng 24h.',
  },
  {
    q: 'Flash Sale diễn ra khi nào?',
    a: 'Flash Sale được cập nhật liên tục. Bật thông báo để không bỏ lỡ các đợt giảm giá!',
  },
  {
    q: 'Tôi quên mật khẩu phải làm sao?',
    a: 'Tại màn hình đăng nhập → nhấn "Quên mật khẩu?" → nhập email → kiểm tra hộp thư để nhận link đặt lại.',
  },
];

const CONTACTS = [
  {
    icon: 'mail-outline',
    label: 'Email hỗ trợ',
    value: 'support@taphoa.vn',
    action: () => Linking.openURL('mailto:support@taphoa.vn'),
  },
  {
    icon: 'call-outline',
    label: 'Hotline',
    value: '1900 1234 (8h-22h)',
    action: () => Linking.openURL('tel:19001234'),
  },
];

export default function HelpScreen() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <View style={s.root}>
      <ScreenHeader title="Hỗ trợ & FAQ" />

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Contact */}
        <Text style={s.sectionTitle}>Liên hệ với chúng tôi</Text>
        <View style={s.contactCard}>
          {CONTACTS.map((c, i) => (
            <TouchableOpacity
              key={c.label}
              style={[s.contactRow, i < CONTACTS.length - 1 && s.contactBorder]}
              onPress={c.action}
              activeOpacity={0.7}
            >
              <View style={s.contactIcon}>
                <Ionicons name={c.icon as any} size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactLabel}>{c.label}</Text>
                <Text style={s.contactValue}>{c.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <Text style={s.sectionTitle}>Câu hỏi thường gặp</Text>
        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={s.faqCard}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={s.faqHeader}>
              <Text style={s.faqQ}>{faq.q}</Text>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={C.muted}
              />
            </View>
            {expanded === i && <Text style={s.faqA}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12, marginTop: 8 },
  contactCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  contactBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  contactValue: { fontSize: 12, color: C.muted },
  faqCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20 },
  faqA: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
});
