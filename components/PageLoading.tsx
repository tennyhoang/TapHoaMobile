import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { C } from '@/constants/Colors';

export default function PageLoading() {
  return (
    <View style={s.root}>
      <ActivityIndicator color={C.primary} size="large" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
});
