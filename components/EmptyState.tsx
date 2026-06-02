import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
  };
};

export default function EmptyState({
  icon,
  iconColor = C.muted,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <View style={s.wrap}>
      <View style={[s.iconWrap, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={44} color={iconColor} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity
          style={s.btn}
          onPress={action.onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          {action.icon && <Ionicons name={action.icon} size={16} color="#fff" />}
          <Text style={s.btnText}>{action.label}</Text>
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
  title: { fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  btnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
