import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getSocket } from '../services/socket';
import { getCountryFlag } from '../utils/countryUtils';

const BOND_PINK = '#FF0080';

function MessageBubble({ message, isMine }) {
  return (
    <View style={[b.row, isMine && b.rowMine]}>
      {!isMine && (
        <Text style={b.senderName}>
          {message.senderName}{message.senderCountry ? ` ${getCountryFlag(message.senderCountry)}` : ''}
        </Text>
      )}
      <View style={[b.bubble, isMine ? b.bubbleMine : b.bubbleOther]}>
        <Text style={[b.text, isMine && b.textMine]}>{message.text || message.originalText}</Text>
      </View>
    </View>
  );
}

const b = StyleSheet.create({
  row:        { marginVertical: 4, marginHorizontal: 14, maxWidth: '78%', alignSelf: 'flex-start' },
  rowMine:    { alignSelf: 'flex-end' },
  senderName: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 3, marginLeft: 4 },
  bubble:     { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleOther:{ backgroundColor: '#1C1F23', borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: BOND_PINK, borderBottomRightRadius: 4 },
  text:       { color: '#eee', fontSize: 14, lineHeight: 19 },
  textMine:   { color: '#fff' },
});

export default function GroupChatScreen({ route, navigation }) {
  const { categoryId, categoryName, roomName, currentUser } = route?.params || {};
  const socket = getSocket();
  const flatRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [members,  setMembers]  = useState([]);
  const [text,     setText]     = useState('');
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!categoryId || !roomName) return;

    function onHistory({ categoryId: cId, roomName: rName, messages: msgs }) {
      if (cId === categoryId && rName === roomName) setMessages(msgs || []);
    }
    function onMessage(msg) {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
    }
    function onMembers({ categoryId: cId, roomName: rName, members: list }) {
      if (cId === categoryId && rName === roomName) setMembers(list || []);
    }
    function onTyping({ socketId, name }) {
      setTypingUsers(prev => ({ ...prev, [socketId]: name }));
    }
    function onStopTyping({ socketId }) {
      setTypingUsers(prev => { const next = { ...prev }; delete next[socketId]; return next; });
    }

    socket.on('group_history',            onHistory);
    socket.on('group_message',            onMessage);
    socket.on('room_members',             onMembers);
    socket.on('group_user_typing',        onTyping);
    socket.on('group_user_stopped_typing',onStopTyping);

    socket.emit('join_group', { categoryId, roomName });

    return () => {
      socket.emit('leave_group', { categoryId, roomName });
      socket.off('group_history',            onHistory);
      socket.off('group_message',            onMessage);
      socket.off('room_members',             onMembers);
      socket.off('group_user_typing',        onTyping);
      socket.off('group_user_stopped_typing',onStopTyping);
    };
  }, [categoryId, roomName]);

  function sendMessage() {
    if (!text.trim()) return;
    socket.emit('group_stop_typing', { categoryId, roomName });
    socket.emit('group_message', { categoryId, roomName, text: text.trim() });
    setText('');
  }

  function handleTextChange(val) {
    setText(val);
    socket.emit(val.trim() ? 'group_typing' : 'group_stop_typing', { categoryId, roomName });
  }

  const typingNames = Object.values(typingUsers);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.title}>#{(roomName || '').replace(/-/g, ' ')}</Text>
          <Text style={s.sub}>{categoryName} · {members.length} here</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={s.empty}>No messages yet — say hi 👋</Text>}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMine={item.senderUserId === currentUser?.userId} />
          )}
        />

        {typingNames.length > 0 && (
          <Text style={s.typing}>{typingNames.join(', ')} typing…</Text>
        )}

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Message the room..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            multiline
          />
          <TouchableOpacity style={s.sendBtn} onPress={sendMessage} disabled={!text.trim()}>
            <Text style={s.sendTxt}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08090d' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  back:      { color: BOND_PINK, fontSize: 15, fontWeight: '700', width: 50 },
  title:     { color: '#fff', fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  sub:       { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 },
  empty:     { color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', marginTop: 40 },
  typing:    { color: 'rgba(255,255,255,0.4)', fontSize: 11, paddingHorizontal: 16, paddingBottom: 4 },
  inputRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'flex-end' },
  input:     { flex: 1, backgroundColor: '#12131a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#ffffff14' },
  sendBtn:   { backgroundColor: BOND_PINK, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 11 },
  sendTxt:   { color: '#fff', fontWeight: '800', fontSize: 13 },
});
