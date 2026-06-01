import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { API_BASE_URL } from '@/constants/api';

function resolveUri(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  return `${API_BASE_URL}${uri.startsWith('/') ? '' : '/'}${uri}`;
}

const PALETTE = [
  { bg: '#E0F2F1', text: '#00796B' },
  { bg: '#E3F2FD', text: '#1565C0' },
  { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#F3E5F5', text: '#6A1B9A' },
  { bg: '#E8F5E9', text: '#2E7D32' },
  { bg: '#FBE9E7', text: '#BF360C' },
  { bg: '#E8EAF6', text: '#283593' },
  { bg: '#FFF8E1', text: '#F57F17' },
];

function pickColor(name?: string | null) {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

type Props = {
  uri?: string | null;
  style?: object;
  iconSize?: number;
  name?: string | null;
};

export default function ProductImage({ uri, style, name }: Props) {
  const [errored, setErrored] = useState(false);
  const resolvedUri = resolveUri(uri);
  const color = pickColor(name);
  const initial = name?.trim().charAt(0)?.toUpperCase() ?? '?';

  if (resolvedUri && !errored) {
    return (
      <Image
        source={{ uri: resolvedUri }}
        style={[s.img, style]}
        contentFit="cover"
        transition={200}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <View style={[s.placeholder, style, { backgroundColor: color.bg }]}>
      <Text style={[s.initial, { color: color.text }]}>{initial}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  img: { width: '100%', height: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 28,
    fontWeight: '700',
    opacity: 0.7,
  },
});
