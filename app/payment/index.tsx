import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/constants/Colors';

type PaymentGateway = 'vnpay' | 'momo';

export default function PaymentWebViewScreen() {
  const { t } = useTranslation();
  const { url, orderId } = useLocalSearchParams<{
    url: string;
    orderId: string;
    gateway: PaymentGateway;
  }>();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const handleNavigationStateChange = (navState: { url: string }) => {
    const currentUrl = navState.url.toLowerCase();

    if (currentUrl.includes('vnp_responsecode=00') || currentUrl.includes('resultcode=0')) {
      setSuccess(true);
      setTimeout(() => router.replace(`/order/${orderId}` as any), 1500);
      return;
    }

    if (currentUrl.includes('errorCode=0') || currentUrl.includes('resultCode=0')) {
      setSuccess(true);
      setTimeout(() => router.replace(`/order/${orderId}` as any), 1500);
      return;
    }

    if (currentUrl.includes('vnp_responsecode=24') || currentUrl.includes('resultcode=9000')) {
      router.back();
      return;
    }
  };

  if (!url) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t('payment.no_url')}</Text>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
        <Text style={styles.successText}>{t('payment.success')}</Text>
        <Text style={styles.redirectText}>{t('payment.redirecting')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>{t('payment.connecting')}</Text>
        </View>
      )}
      <WebView
        source={{ uri: url }}
        onLoad={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    padding: 20,
  },
  error: { fontSize: 16, color: C.error, fontWeight: '600' },
  successText: { fontSize: 20, fontWeight: '700', color: '#16A34A', marginTop: 12 },
  redirectText: { fontSize: 14, color: C.muted, marginTop: 8 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { fontSize: 14, color: C.muted, marginTop: 12 },
  webview: { flex: 1 },
});
