import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/constants/Colors';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
};

export default function ScreenHeader({ title, subtitle, right, onBack }: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
      <View style={[s.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={onBack ?? (() => router.back())}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          {subtitle ? (
            <Text style={s.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </>
  );
}

const s = StyleSheet.create({
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
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
});
