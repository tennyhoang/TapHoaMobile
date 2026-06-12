import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { C } from '@/constants/Colors';

export default function PaymentLoading() {
  return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
});
