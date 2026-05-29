import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  return (
    <View style={s.root}>
      <Ionicons name="cart-outline" size={48} color="#9CA3AF" />
      <Text style={s.title}>Giỏ hàng</Text>
      <Text style={s.sub}>Đang phát triển</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280' },
});
