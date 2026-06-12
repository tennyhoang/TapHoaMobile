import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type Props = {
  type?: 'network' | 'empty' | 'error';
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

const PRESETS = {
  network: {
    icon: 'wifi-outline' as const,
    color: '#6B7280',
    titleKey: 'common.error_network' as const,
    messageKey: 'common.error_network_msg' as const,
  },
  empty: {
    icon: 'file-tray-outline' as const,
    color: '#9CA3AF',
    titleKey: 'common.no_data' as const,
    messageKey: null,
  },
  error: {
    icon: 'alert-circle-outline' as const,
    color: '#EF4444',
    titleKey: 'common.error_occurred' as const,
    messageKey: 'common.try_again' as const,
  },
};

export default function ErrorScreen({
  type = 'error',
  title,
  message,
  onRetry,
  retryLabel,
}: Props) {
  const { t } = useTranslation();
  const preset = PRESETS[type];
  const resolvedTitle = title ?? t(preset.titleKey);
  const resolvedMessage =
    message ?? (preset.messageKey ? t(preset.messageKey) : 'Nội dung sẽ xuất hiện ở đây');
  const resolvedRetryLabel = retryLabel ?? t('common.retry');

  return (
    <View style={s.wrap}>
      <View style={[s.iconWrap, { backgroundColor: preset.color + '15' }]}>
        <Ionicons name={preset.icon} size={44} color={preset.color} />
      </View>
      <Text style={s.title}>{resolvedTitle}</Text>
      <Text style={s.message}>{resolvedMessage}</Text>
      {onRetry && (
        <TouchableOpacity
          style={s.btn}
          onPress={onRetry}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Ionicons name="refresh-outline" size={16} color="#fff" />
          <Text style={s.btnText}>{resolvedRetryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0EA5AE',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  btnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
