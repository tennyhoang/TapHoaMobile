import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_CONFIG } from '@/lib/status-config';

type StatusBadgeProps = {
  status: OrderStatus;
  size?: 'sm' | 'lg';
  label?: string;
};

export default function StatusBadge({ status, size = 'sm', label }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = ORDER_STATUS_CONFIG[status];
  const displayLabel = label ?? t(config.labelKey);

  if (size === 'lg') {
    return (
      <View style={[lg.card, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={32} color={config.color} />
        <Text style={[lg.label, { color: config.color }]}>{displayLabel}</Text>
      </View>
    );
  }

  return (
    <View style={[sm.badge, { backgroundColor: config.color + '18' }]}>
      <Text style={[sm.text, { color: config.color }]}>{displayLabel}</Text>
    </View>
  );
}

const sm = StyleSheet.create({
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: '600' },
});

const lg = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, marginBottom: 12 },
  label: { fontSize: 17, fontWeight: '700' },
});
