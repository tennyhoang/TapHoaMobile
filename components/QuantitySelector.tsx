import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';

type QuantitySelectorProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (newValue: number) => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  showTrashOnMin?: boolean;
};

export default function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
  loading = false,
  disabled = false,
  size = 'md',
  showTrashOnMin = false,
}: QuantitySelectorProps) {
  const isAtMin = value <= min;
  const isAtMax = max !== undefined && value >= max;
  const dim = { opacity: 0.4 };
  const iconSize = size === 'sm' ? 16 : 18;
  const isMinusTrash = showTrashOnMin && isAtMin;

  return (
    <View style={size === 'sm' ? sm.wrap : md.wrap}>
      <TouchableOpacity
        style={[size === 'sm' ? sm.btn : md.btn, isAtMin && dim]}
        onPress={() => onChange(value - 1)}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={isMinusTrash ? 'Xoá' : 'Giảm'}
      >
        <Ionicons
          name={isMinusTrash ? 'trash-outline' : 'remove'}
          size={iconSize}
          color={isMinusTrash ? C.error : isAtMin ? C.muted : C.text}
        />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={C.primary}
          style={{ width: size === 'sm' ? 28 : 32 }}
        />
      ) : (
        <Text style={size === 'sm' ? sm.text : md.text}>{value}</Text>
      )}

      <TouchableOpacity
        style={[size === 'sm' ? sm.btn : md.btn, isAtMax && dim]}
        onPress={() => onChange(value + 1)}
        disabled={disabled || loading || isAtMax}
        accessibilityRole="button"
        accessibilityLabel="Tăng"
      >
        <Ionicons name="add" size={iconSize} color={isAtMax ? C.muted : C.text} />
      </TouchableOpacity>
    </View>
  );
}

const sm = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  btn: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, fontWeight: '700', color: C.text, minWidth: 24, textAlign: 'center' },
});

const md = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  btn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    paddingHorizontal: 4,
    minWidth: 28,
    textAlign: 'center',
  },
});
