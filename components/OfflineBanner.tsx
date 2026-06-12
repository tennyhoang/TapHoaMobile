import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);
  const [translateY] = useState(new Animated.Value(-60));

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      Animated.spring(translateY, {
        toValue: offline ? 0 : -60,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    });
    return unsub;
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View style={[s.banner, { transform: [{ translateY }] }]}>
      <Ionicons name="wifi-outline" size={16} color="#fff" />
      <Text style={s.text}>{t('common.error_network')}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    zIndex: 9999,
  },
  text: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
