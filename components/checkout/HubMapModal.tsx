import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Hub } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  hubs: Hub[];
  selectedHub: Hub | null;
  onSelectHub: (hub: Hub) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export default function HubMapModal({
  visible,
  onClose,
  hubs,
  selectedHub,
  onSelectHub,
  userLocation,
}: Props) {
  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : hubs[0]?.latitude
      ? {
          latitude: hubs[0].latitude,
          longitude: hubs[0].longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }
      : { latitude: 10.7769, longitude: 106.7009, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {hubs.map(hub => (
            <Marker
              key={hub.id}
              coordinate={{ latitude: hub.latitude, longitude: hub.longitude }}
              title={hub.name}
              description={`${hub.address}, ${hub.ward}`}
              pinColor={selectedHub?.id === hub.id ? '#0EA5AE' : '#EF4444'}
              onPress={() => {
                onSelectHub(hub);
                onClose();
              }}
            />
          ))}
        </MapView>
        <View style={s.mapBar}>
          {selectedHub && (
            <View style={s.mapBarInfo}>
              <Ionicons name="storefront-outline" size={16} color="#0EA5AE" />
              <Text style={s.mapBarText} numberOfLines={1}>
                {selectedHub.name}
              </Text>
            </View>
          )}
          <TouchableOpacity style={s.mapCloseBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.mapCloseBtnText}>Xong</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  mapBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  mapBarInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapBarText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  mapCloseBtn: {
    backgroundColor: '#0EA5AE',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  mapCloseBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
