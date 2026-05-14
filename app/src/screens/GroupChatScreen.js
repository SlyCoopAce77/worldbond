import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { getSocket } from '../services/socket';

export default function GroupChatScreen({ route, navigation }) {
  const { category, user } = route.params;
  const [activeRoom, setActiveRoom] = useState(category.rooms[0]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const flatRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    joinRoom(category.rooms[0]);
    socket.on('group_history', ({ messages: hist }) => setMessages(hist));
    socket.on('group_message', (msg) => setMessages(prev => [...prev, msg]));

    return () => {
      socket.emit('leave_group', { categoryId: category.id, roomName: activeRoom });
      socket.off('group_history');
      socket.off('group_message');
    };
  }, []);

  function joinRoom(roomName) {
    if (activeRoom && activeRoom !== roomName) {
      socket.emit('leave_group', { categoryId: category.id, roomName: activeRoom });
    }
    setActiveRoom(roomName);
    setMessages([]);
    socket.emit('join_group', { categoryId: category.id, roomName });
  }

  function sendMessage() {
    if (!text.trim()) return;
    socket.emit('group_message', {
      categoryId: category.id,
      roomName: activeRoom,
      text: text.trim(),
    });
    setText('');
  }

  useEffect(() => {
    if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  function renderMessage({ item }) {
    const isMine = item.senderId === socket.id;
    return (
      <View style={[styles.messageRow, isMine && styles.messageRowRight]}>
        {!isMine && (
          <View style={[styles.avatar, { backgroundColor: stringToColor(item.senderName) }]}>
            <Text style={styles.avatarText}>{item.senderName[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && (
            <View style={styles.senderRow}>
              <Text style={styles.senderName}>{item.senderName}</Text>
              <Text style={styles.senderCountry}>{item.senderCountry}</Text>
            </View>
          )}
          <Text style={styles.messageText}>{item.text}</Text>
          {item.wasTranslated && <Text style={styles.translatedTag}>🌐 translated</Text>}
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{category.icon} {category.name}</Text>
          <Text style={styles.headerRoom}>#{activeRoom}</Text>
        </View>
      </View>

      {/* Room tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsBar} contentContainerStyle={styles.tabsContent}>
        {category.rooms.map(room => (
          <TouchableOpacity
            key={room}
            style={[styles.tab, activeRoom === room && styles.tabActive]}
            onPress={() => joinRoom(room)}
          >
            <Text style={[styles.tabText, activeRoom === room && styles.tabTextActive]}>#{room}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyRoom}>
            <Text style={styles.emptyText}>No messages yet in #{activeRoom}</Text>
            <Text style={styles.emptySubText}>Be the first to say hello! 👋</Text>
          </View>
        }
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Chat in #${activeRoom}...`}
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!text.trim()}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function stringToColor(str) {
  const colors = ['#e57373', '#ba68c8', '#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#4db6ac', '#7986cb'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e', gap: 12,
  },
  backBtn: { padding: 6 },
  backText: { color: '#6c63ff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerRoom: { color: '#888', fontSize: 12, marginTop: 2 },
  tabsBar: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  tabsContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingVertical: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1a1a2e' },
  tabActive: { backgroundColor: '#6c63ff' },
  tabText: { color: '#888', fontSize: 13 },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  messageList: { padding: 14, gap: 10, flexGrow: 1 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  messageRowRight: { justifyContent: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleMine: { backgroundColor: '#6c63ff', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1a1a2e', borderBottomLeftRadius: 4 },
  senderRow: { flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'center' },
  senderName: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  senderCountry: { color: '#666', fontSize: 10 },
  messageText: { color: '#fff', fontSize: 15 },
  translatedTag: { color: '#aaa', fontSize: 10, marginTop: 4 },
  timestamp: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  emptyRoom: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  emptySubText: { color: '#888', fontSize: 13, marginTop: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, borderTopColor: '#1a1a2e', gap: 10,
  },
  input: {
    flex: 1, backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#6c63ff', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#333' },
  sendBtnText: { color: '#fff', fontSize: 18 },
});
