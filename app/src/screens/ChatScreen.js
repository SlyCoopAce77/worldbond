import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { getSocket } from '../services/socket';
import GiftPicker from '../components/GiftPicker';

export default function ChatScreen({ route, navigation }) {
  const { otherUser, currentUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [giftAnim] = useState(new Animated.Value(0));
  const [lastGift, setLastGift] = useState(null);
  const flatRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    socket.emit('get_dm_history', { otherSocketId: otherUser.socketId });

    socket.on('dm_history', setMessages);
    socket.on('direct_message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('gift_received', (giftMsg) => {
      setLastGift(giftMsg);
      setMessages(prev => [...prev, giftMsg]);
      animateGift();
    });
    socket.on('gift_sent', (giftMsg) => {
      setMessages(prev => [...prev, giftMsg]);
    });

    return () => {
      socket.off('dm_history');
      socket.off('direct_message');
      socket.off('gift_received');
      socket.off('gift_sent');
    };
  }, [otherUser.socketId]);

  useEffect(() => {
    if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  function animateGift() {
    giftAnim.setValue(0);
    Animated.sequence([
      Animated.spring(giftAnim, { toValue: 1, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(giftAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  function sendMessage() {
    if (!text.trim()) return;
    socket.emit('direct_message', { toSocketId: otherUser.socketId, text: text.trim() });
    setText('');
  }

  function sendGift(gift) {
    socket.emit('send_gift', { toSocketId: otherUser.socketId, gift });
  }

  function startCall(callType) {
    navigation.navigate('Call', {
      mode: 'outgoing', toSocketId: otherUser.socketId,
      toName: otherUser.username, callType,
    });
  }

  function renderMessage({ item }) {
    const isMine = item.senderId === socket.id;

    if (item.type === 'gift') {
      return (
        <View style={styles.giftRow}>
          <View style={styles.giftBubble}>
            <Text style={styles.giftBubbleEmoji}>{item.gift.emoji}</Text>
            <Text style={styles.giftBubbleText}>
              {isMine ? 'You' : item.senderName} sent a {item.gift.name}!
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isMine && styles.messageRowRight]}>
        {!isMine && (
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{item.senderName[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && <Text style={styles.senderName}>{item.senderName}</Text>}
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
      {/* Gift animation overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.giftOverlay, {
          opacity: giftAnim,
          transform: [{ scale: giftAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }]}
      >
        {lastGift && <Text style={styles.giftOverlayEmoji}>{lastGift.gift.emoji}</Text>}
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => navigation.navigate('Profile', { profileUser: otherUser })}
        >
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{otherUser.username[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{otherUser.username}</Text>
            <Text style={styles.headerCountry}>{otherUser.country} · tap to view profile</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.callButtons}>
          <TouchableOpacity style={styles.callBtn} onPress={() => startCall('voice')}>
            <Text style={styles.callBtnText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => startCall('video')}>
            <Text style={styles.callBtnText}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.giftBtn} onPress={() => setShowGifts(true)}>
            <Text style={styles.giftBtnText}>🎁</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={`Message in ${currentUser.language.toUpperCase()}...`}
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <GiftPicker
        visible={showGifts}
        onClose={() => setShowGifts(false)}
        onSend={sendGift}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  giftOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 99,
  },
  giftOverlayEmoji: { fontSize: 120 },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  backBtn: { padding: 6 },
  backText: { color: '#6c63ff', fontSize: 22 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10, gap: 10 },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#6c63ff',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerCountry: { color: '#888', fontSize: 11 },
  callButtons: { flexDirection: 'row', gap: 8 },
  callBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 8 },
  callBtnText: { fontSize: 18 },
  messageList: { padding: 14, gap: 10 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  messageRowRight: { justifyContent: 'flex-end' },
  avatarSmall: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#6c63ff',
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  avatarSmallText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 12 },
  bubbleMine: { backgroundColor: '#6c63ff', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1a1a2e', borderBottomLeftRadius: 4 },
  senderName: { color: '#aaa', fontSize: 11, marginBottom: 4 },
  messageText: { color: '#fff', fontSize: 15 },
  translatedTag: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 },
  timestamp: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  giftRow: { alignItems: 'center', marginBottom: 10 },
  giftBubble: {
    backgroundColor: '#2a1a3e', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#6c63ff44',
  },
  giftBubbleEmoji: { fontSize: 40, marginBottom: 6 },
  giftBubbleText: { color: '#ddd', fontSize: 13, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, borderTopColor: '#1a1a2e', gap: 8,
  },
  giftBtn: { backgroundColor: '#1a1a2e', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  giftBtnText: { fontSize: 22 },
  input: {
    flex: 1, backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#6c63ff', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#333' },
  sendBtnText: { color: '#fff', fontSize: 18 },
});
