import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '@/lib/storage';

const { width: W } = Dimensions.get('window');
export const ONBOARDING_KEY = 'taphoa_onboarding_done';

const SLIDES = [
  {
    icon: 'leaf' as const,
    iconColor: '#22C55E',
    iconBg: '#F0FDF4',
    accent: '#22C55E',
    title: 'Thực phẩm tươi sạch',
    body: 'Rau củ, trái cây, thịt cá tươi mỗi ngày\nKiểm định chất lượng, nguồn gốc minh bạch',
    bg: '#F9FFFE',
  },
  {
    icon: 'flash' as const,
    iconColor: '#F59E0B',
    iconBg: '#FFFBEB',
    accent: '#F59E0B',
    title: 'Flash Sale mỗi ngày',
    body: 'Giảm đến 50% các mặt hàng tươi\nFlash Sale cập nhật liên tục — đừng bỏ lỡ!',
    bg: '#FFFDF5',
  },
  {
    icon: 'bicycle' as const,
    iconColor: '#0EA5AE',
    iconBg: '#E5F9FA',
    accent: '#0EA5AE',
    title: 'Giao đến Hub gần nhà',
    body: 'Đặt trước 10h, nhận trong ngày\nNhận hàng tại Hub tiện lợi gần bạn nhất',
    bg: '#F5FDFE',
  },
  {
    icon: 'wallet' as const,
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
    accent: '#8B5CF6',
    title: 'Thanh toán dễ dàng',
    body: 'Ví TapHoa, chuyển khoản hoặc COD\nBảo mật cao — an toàn mọi giao dịch',
    bg: '#FDFAFF',
  },
];

export default function OnboardingScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      const next = current + 1;
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setCurrent(next);
    } else {
      finish();
    }
  };

  const finish = async () => {
    await storage.setItem(ONBOARDING_KEY, '1');
    router.replace('/(auth)/login' as any);
  };

  const slide = SLIDES[current];

  return (
    <View style={[s.root, { backgroundColor: slide.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={slide.bg} />

      {/* Skip */}
      <TouchableOpacity style={[s.skip, { top: top + 16 }]} onPress={finish} activeOpacity={0.7}>
        <Text style={s.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={s.scroll}
      >
        {SLIDES.map((sl, i) => (
          <View key={i} style={[s.slide, { width: W }]}>
            <View style={[s.iconCircle, { backgroundColor: sl.iconBg }]}>
              <View style={[s.iconInner, { backgroundColor: sl.iconColor + '20' }]}>
                <Ionicons name={sl.icon} size={52} color={sl.iconColor} />
              </View>
            </View>
            <Text style={s.title}>{sl.title}</Text>
            <Text style={s.body}>{sl.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={[s.bottom, { paddingBottom: bottom + 24 }]}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i === current ? [s.dotActive, { backgroundColor: slide.accent }] : s.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[s.btn, { backgroundColor: slide.accent }]}
          onPress={goNext}
          activeOpacity={0.88}
        >
          <Text style={s.btnText}>
            {current < SLIDES.length - 1 ? 'Tiếp theo' : 'Bắt đầu ngay'}
          </Text>
          <Ionicons
            name={current < SLIDES.length - 1 ? 'arrow-forward' : 'checkmark'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  skip: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  skipText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  scroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '900', color: '#111827', textAlign: 'center', lineHeight: 34 },
  body: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  bottom: {
    paddingHorizontal: 24,
    gap: 20,
    paddingTop: 8,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 28 },
  dotInactive: { width: 8, backgroundColor: '#D1D5DB' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
