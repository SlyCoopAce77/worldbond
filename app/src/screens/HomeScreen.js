import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { getSocket } from '../services/socket';

export default function HomeScreen({ navigation, user }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const socket = getSocket();
    socket.emit('register', { username: user.username, language: user.language, country: user.country });
    socket.emit('get_users');

    socket.on('user_list', setUsers);
    socket.on('incoming_call', ({ from, callerName, callerCountry, offer, callType }) => {
      navigation.navigate('Call', { mode: 'incoming', from, callerName, callerCountry, offer, callType });
    });

    return () => {
      socket.off('user_list');
      socket.off('incoming_call');
    };
  }, []);

  const filtered = users.filter(u =>
    u.socketId !== getSocket().id &&
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  function openChat(otherUser) {
    navigation.navigate('Chat', { otherUser, currentUser: user });
  }

  function renderUser({ item }) {
    return (
      <TouchableOpacity style={styles.userCard} onPress={() => openChat(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={styles.userDetail}>{item.country}</Text>
        </View>
        <View style={styles.langBadge}>
          <Text style={styles.langText}>{item.language?.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {user.username} 👋</Text>
          <Text style={styles.subGreeting}>{user.country}</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{users.length} online</Text>
        </View>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search users..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.sectionTitle}>People Online 🌍</Text>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No users online yet.</Text>
          <Text style={styles.emptySubText}>Share the app with friends around the world!</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.socketId}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 12,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 13, color: '#888', marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a2a1a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  onlineText: { color: '#4caf50', fontSize: 12, fontWeight: '600' },
  search: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    padding: 12, marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#2a2a4a', fontSize: 15,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#aaa', marginLeft: 20, marginBottom: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e',
    marginHorizontal: 20, marginBottom: 10, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#6c63ff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  userDetail: { color: '#888', fontSize: 12, marginTop: 2 },
  langBadge: { backgroundColor: '#6c63ff33', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  langText: { color: '#6c63ff', fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubText: { color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
