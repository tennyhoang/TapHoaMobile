import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  uri?: string | null;
  style?: object;
  iconSize?: number;
};

export default function ProductImage({ uri, style, iconSize = 32 }: Props) {
  const [errored, setErrored] = useState(false);

  if (uri && !errored) {
    return (
      <Image
        source={{ uri }}
        style={[s.img, style]}
        contentFit="cover"
        transition={200}
        placeholderContentFit="cover"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <View style={[s.placeholder, style]}>
      <Ionicons name="leaf-outline" size={iconSize} color="#0EA5AE55" />
    </View>
  );
}

const s = StyleSheet.create({
  img: { width: '100%', height: '100%' },
  placeholder: {
    backgroundColor: '#E5F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
