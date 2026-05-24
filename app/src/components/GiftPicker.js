import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  FlatList, Animated,
} from 'react-native';

export const GIFTS = [
  { id: 'rose', emoji: '🌹', name: 'Rose', category: 'love' },
  { id: 'heart', emoji: '❤️', name: 'Heart', category: 'love' },
  { id: 'kiss', emoji: '💋', name: 'Kiss', category: 'love' },
  { id: 'fire', emoji: '🔥', name: 'Fire', category: 'hype' },
  { id: 'star', emoji: '⭐', name: 'Star', category: 'hype' },
  { id: 'crown', emoji: '👑', name: 'Crown', category: 'hype' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', category: 'hype' },
  { id: 'diamond', emoji: '💎', name: 'Diamond', category: 'luxury' },
  { id: 'money', emoji: '💸', name: 'Money Bag', category: 'luxury' },
  { id: 'champagne', emoji: '🍾', name: 'Champagne', category: 'luxury' },
  { id: 'cake', emoji: '🎂', name: 'Birthday Cake', category: 'fun' },
  { id: 'balloon', emoji: '🎈', name: 'Balloon', category: 'fun' },
  { id: 'confetti', emoji: '🎊', name: 'Confetti', category: 'fun' },
  { id: 'gift', emoji: '🎁', name: 'Gift Box', category: 'fun' },
  { id: 'hug', emoji: '🤗', name: 'Hug', category: 'friendly' },
  { id: 'wave', emoji: '👋', name: 'Wave', category: 'friendly' },
  { id: 'handshake', emoji: '🤝', name: 'Handshake', category: 'friendly' },
  { id: 'clap', emoji: '👏', name: 'Clap', category: 'friendly' },
  { id: 'sushi', emoji: '🍣', name: 'Sushi', category: 'food' },
  { id: 'boba', emoji: '🧋', name: 'Boba Tea', category: 'food' },
  { id: 'pizza', emoji: '🍕', name: 'Pizza', category: 'food' },
  { id: 'beer', emoji: '🍺', name: 'Beer', category: 'food' },
  { id: 'globe', emoji: '🌍', name: 'Globe', category: 'travel' },
  { id: 'plane', emoji: '✈️', name: 'Airplane', category: 'travel' },
  { id: 'map', emoji: '🗺️', name: 'World Map', category: 'travel' },
];

const CATEGORIES = ['all', 'love', 'hype', 'luxury', 'fun', 'friendly', 'food', 'travel'];

export default function GiftPicker({ visible, onClose, onSend }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? GIFTS
    : GIFTS.filter(g => g.category === activeCategory);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Send a Gift 🎁</Text>

        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={c => c}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, activeCategory === item && styles.catChipActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.catText, activeCategory === item && styles.catTextActive]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          data={filtered}
          numColumns={5}
          keyExtractor={g => g.id}
          contentContainerStyle={styles.giftGrid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.giftItem}
              onPress={() => { onSend(item); onClose(); }}
            >
              <Text style={styles.giftEmoji}>{item.emoji}</Text>
              <Text style={styles.giftName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40, maxHeight: '70%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  catList: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: '#2a2a4a' },
  catChipActive: { backgroundColor: '#5865f2', borderColor: '#5865f2' },
  catText: { color: '#888', fontSize: 13 },
  catTextActive: { color: '#fff', fontWeight: '700' },
  giftGrid: { paddingHorizontal: 12, paddingTop: 4 },
  giftItem: { flex: 1, alignItems: 'center', padding: 10, margin: 4, backgroundColor: '#0f0f1a', borderRadius: 14 },
  giftEmoji: { fontSize: 30 },
  giftName: { color: '#888', fontSize: 9, marginTop: 4, textAlign: 'center' },
});
