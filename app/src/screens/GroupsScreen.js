import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { getSocket } from '../services/socket';

export default function GroupsScreen({ navigation, user }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('get_groups');
    socket.on('group_list', setCategories);
    return () => socket.off('group_list');
  }, []);

  function openCategory(category) {
    navigation.navigate('GroupChat', { category, user });
  }

  function renderCategory({ item }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => openCategory(item)}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>
          <View style={styles.roomsRow}>
            {item.rooms.slice(0, 3).map(r => (
              <View key={r} style={styles.roomChip}>
                <Text style={styles.roomChipText}>#{r}</Text>
              </View>
            ))}
            {item.rooms.length > 3 && (
              <Text style={styles.moreRooms}>+{item.rooms.length - 3} more</Text>
            )}
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Chats 💬</Text>
        <Text style={styles.subtitle}>Find your community worldwide</Text>
      </View>
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        renderItem={renderCategory}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 4 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2a4a',
  },
  cardIcon: { fontSize: 36, marginRight: 14 },
  cardInfo: { flex: 1 },
  cardName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cardDesc: { color: '#888', fontSize: 12, marginTop: 3 },
  roomsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  roomChip: { backgroundColor: '#6c63ff22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roomChipText: { color: '#6c63ff', fontSize: 11 },
  moreRooms: { color: '#888', fontSize: 11, alignSelf: 'center' },
  arrow: { color: '#6c63ff', fontSize: 24 },
});
