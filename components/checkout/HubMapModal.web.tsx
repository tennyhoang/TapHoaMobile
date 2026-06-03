import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Hub } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  hubs: Hub[];
  selectedHub: Hub | null;
  onSelectHub: (hub: Hub) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export default function HubMapModal({ visible, onClose, hubs, selectedHub, onSelectHub }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chọn điểm lấy hàng</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {hubs.map(hub => (
            <TouchableOpacity
              key={hub.id}
              style={[styles.hubItem, selectedHub?.id === hub.id && styles.selected]}
              onPress={() => {
                onSelectHub(hub);
                onClose();
              }}
            >
              <Ionicons
                name="location"
                size={20}
                color={selectedHub?.id === hub.id ? '#2ecc71' : '#666'}
              />
              <View style={styles.hubInfo}>
                <Text style={styles.hubName}>{hub.name}</Text>
                <Text style={styles.hubAddress}>
                  {hub.address}, {hub.ward}, {hub.district}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '600' },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 12,
  },
  selected: { backgroundColor: '#f0fff4' },
  hubInfo: { flex: 1 },
  hubName: { fontSize: 15, fontWeight: '500', color: '#222' },
  hubAddress: { fontSize: 13, color: '#888', marginTop: 2 },
});
