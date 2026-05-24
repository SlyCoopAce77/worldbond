import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Pressable,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, Image, Modal, ScrollView, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { getAccessToken } from '../services/authApi';
import axios from 'axios';
import { getSocket, SERVER_URL } from '../services/socket';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(SCREEN_W * 0.78, 320);

const ACCENT  = '#5865f2';
const BG      = '#0f0f1a';
const CARD    = '#1a1a2e';
const BORDER  = '#2a2a4a';
const REACTIONS = ['❤️', '🔥', '😂', '👍', '😮', '😢'];

// Deterministic color per username (stable across renders)
const MEMBER_COLORS = ['#e57373','#ba68c8','#4fc3f7','#81c784','#ffb74d','#f06292','#4db6ac','#7986cb','#ff8a65','#a1887f'];
function memberColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return MEMBER_COLORS[Math.abs(h) % MEMBER_COLORS.length];
}

const LANG_FLAGS = {
  en:'🇺🇸', ja:'🇯🇵', es:'🇪🇸', fr:'🇫🇷', de:'🇩🇪',
  pt:'🇧🇷', zh:'🇨🇳', ko:'🇰🇷', ar:'🇸🇦', hi:'🇮🇳', th:'🇹🇭', ru:'🇷🇺',
};

function timeStr(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function dateLabel(ts) {
  const d = new Date(ts), now = new Date();
  if (now.toDateString() === d.toDateString()) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (y.toDateString() === d.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}
async function authHeader() {
  const t = await getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name = '?', photo_url, size = 32 }) {
  const bg      = memberColor(name);
  const initial = name[0].toUpperCase();
  if (photo_url) {
    return <Image source={{ uri: photo_url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: size * 0.44 }}>{initial}</Text>
    </View>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingRow({ typingUsers }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(d, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.delay(450),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  const label = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

  return (
    <View style={styles.typingRow}>
      <View style={styles.typingBubble}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[styles.typingDot, {
            opacity: d,
            transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
          }]} />
        ))}
      </View>
      <Text style={styles.typingLabel}>{label}…</Text>
    </View>
  );
}

// ── Members panel ─────────────────────────────────────────────────────────────

function MembersPanel({ visible, members, category, activeRoom, onClose }) {
  const slideAnim = useRef(new Animated.Value(PANEL_W)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: PANEL_W, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,       duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.panelBackdrop, { opacity: fadeAnim }]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Slide panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>{category.icon} #{activeRoom}</Text>
              <Text style={styles.panelSub}>{members.length} member{members.length !== 1 ? 's' : ''} online</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.panelClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={members}
            keyExtractor={(m, i) => m.socketId || String(i)}
            contentContainerStyle={{ padding: 12, gap: 6 }}
            renderItem={({ item: m }) => (
              <View style={styles.memberRow}>
                <View style={{ position: 'relative' }}>
                  <Avatar name={m.username} photo_url={m.photo_url} size={38} />
                  <View style={styles.memberOnlineDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.username}</Text>
                  <Text style={styles.memberMeta}>
                    {m.country}  {LANG_FLAGS[m.language] || '🌐'}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: '#555', textAlign: 'center', marginTop: 20 }}>No members yet</Text>
            }
          />
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function GroupChatScreen({ route, navigation }) {
  const { category, user } = route.params;

  const [activeRoom,   setActiveRoom]   = useState(category.rooms[0]);
  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState('');
  const [members,      setMembers]      = useState([]);
  const [typingUsers,  setTypingUsers]  = useState([]); // [{socketId, name}]
  const [showMembers,  setShowMembers]  = useState(false);
  const [reactions,    setReactions]    = useState({});   // msgId → [emoji]
  const [contextMsg,   setContextMsg]   = useState(null);
  const [uploading,    setUploading]    = useState(false);

  const flatRef     = useRef(null);
  const inputRef    = useRef(null);
  const typingTimer = useRef(null);
  const socket      = getSocket();

  // ── Socket setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    joinRoom(category.rooms[0]);

    socket.on('group_history', ({ messages: hist }) => setMessages(hist || []));
    socket.on('group_message', msg => setMessages(prev => [...prev, msg]));
    socket.on('room_members',  ({ members: m }) => setMembers(m || []));

    socket.on('group_user_typing', ({ socketId, name }) => {
      setTypingUsers(prev => prev.some(u => u.socketId === socketId) ? prev : [...prev, { socketId, name }]);
    });
    socket.on('group_user_stopped_typing', ({ socketId }) => {
      setTypingUsers(prev => prev.filter(u => u.socketId !== socketId));
    });

    return () => {
      socket.emit('leave_group', { categoryId: category.id, roomName: activeRoomRef.current });
      socket.off('group_history');
      socket.off('group_message');
      socket.off('room_members');
      socket.off('group_user_typing');
      socket.off('group_user_stopped_typing');
      clearTimeout(typingTimer.current);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 || typingUsers.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [messages, typingUsers]);

  // ── Room management ───────────────────────────────────────────────────────

  const activeRoomRef = useRef(activeRoom);
  activeRoomRef.current = activeRoom;

  function joinRoom(roomName) {
    if (activeRoomRef.current && activeRoomRef.current !== roomName) {
      socket.emit('leave_group', { categoryId: category.id, roomName: activeRoomRef.current });
    }
    setActiveRoom(roomName);
    setMessages([]);
    setTypingUsers([]);
    setMembers([]);
    socket.emit('join_group', { categoryId: category.id, roomName });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleTextChange(val) {
    setText(val);
    if (val.trim()) {
      socket.emit('group_typing', { categoryId: category.id, roomName: activeRoom });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('group_stop_typing', { categoryId: category.id, roomName: activeRoom });
      }, 2000);
    } else {
      clearTimeout(typingTimer.current);
      socket.emit('group_stop_typing', { categoryId: category.id, roomName: activeRoom });
    }
  }

  function sendMessage() {
    if (!text.trim()) return;
    clearTimeout(typingTimer.current);
    socket.emit('group_stop_typing', { categoryId: category.id, roomName: activeRoom });
    socket.emit('group_message', {
      categoryId: category.id,
      roomName: activeRoom,
      text: text.trim(),
    });
    setText('');
  }

  async function pickAndSendPhoto() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.75 });
    if (!result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const headers  = await authHeader();
      const formData = new FormData();
      formData.append('photo', { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'photo.jpg' });
      const { data } = await axios.post(`${SERVER_URL}/api/photos/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }, timeout: 30000,
      });
      socket.emit('group_message', {
        categoryId: category.id,
        roomName: activeRoom,
        text: '📷 Photo',
        imageUrl: data.imageUrl,
      });
    } catch {
      // upload failure — don't break the chat
    } finally {
      setUploading(false);
    }
  }

  function addReaction(msgId, emoji) {
    setReactions(prev => ({
      ...prev,
      [msgId]: [...new Set([...(prev[msgId] || []), emoji])],
    }));
    setContextMsg(null);
  }

  // ── Render message ─────────────────────────────────────────────────────────

  function renderMessage({ item }) {
    if (item._sep) {
      return (
        <View style={styles.dateSep}>
          <View style={styles.dateSepLine} />
          <Text style={styles.dateSepText}>{item.label}</Text>
          <View style={styles.dateSepLine} />
        </View>
      );
    }

    const isMine   = item.senderId === socket.id;
    const color    = memberColor(item.senderName);
    const msgRxns  = reactions[item.id] || [];

    return (
      <Pressable
        onLongPress={() => setContextMsg(item)}
        style={[styles.msgRow, isMine && styles.msgRowMine]}
      >
        {!isMine && (
          <View style={styles.avatarWrap}>
            <Avatar name={item.senderName} photo_url={item.senderPhoto} size={30} />
          </View>
        )}

        <View style={{ maxWidth: '78%', gap: 2 }}>
          {!isMine && (
            <View style={styles.senderRow}>
              <Text style={[styles.senderName, { color }]}>{item.senderName}</Text>
              <Text style={styles.senderCountry}>{item.senderCountry}</Text>
            </View>
          )}

          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.imageThumb} resizeMode="cover" />
            )}
            {item.text && item.text !== '📷 Photo' && (
              <Text style={styles.msgText}>{item.text}</Text>
            )}
            {item.wasTranslated && (
              <Text style={styles.translatedTag}>🌐 auto-translated</Text>
            )}
            <View style={styles.msgMeta}>
              <Text style={styles.msgTime}>{timeStr(item.timestamp)}</Text>
            </View>
          </View>

          {msgRxns.length > 0 && (
            <View style={[styles.reactionsRow, isMine && styles.reactionsRowMine]}>
              {msgRxns.map((e, i) => (
                <View key={i} style={styles.reactionPill}>
                  <Text style={styles.reactionEmoji}>{e}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  // ── Build display list with date separators ────────────────────────────────

  const displayData = [];
  let lastDate = null;
  messages.forEach((m, i) => {
    const label = dateLabel(m.timestamp);
    if (label !== lastDate) {
      displayData.push({ _sep: true, id: `sep_${i}`, label });
      lastDate = label;
    }
    displayData.push(m);
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  const roomDesc = category.description || '';

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{category.icon}  {category.name}</Text>
          <Text style={styles.headerSub}>#{activeRoom}  ·  {roomDesc}</Text>
        </View>

        <TouchableOpacity
          style={styles.membersBtn}
          onPress={() => setShowMembers(true)}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[`${ACCENT}44`, `${ACCENT}22`]} style={styles.membersBtnGradient}>
            <Text style={styles.membersBtnIcon}>👥</Text>
            <Text style={styles.membersBtnCount}>{members.length}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Room tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.roomTabsBar}
        contentContainerStyle={styles.roomTabsContent}
      >
        {category.rooms.map(room => (
          <TouchableOpacity
            key={room}
            style={[styles.roomTab, activeRoom === room && styles.roomTabActive]}
            onPress={() => joinRoom(room)}
          >
            <Text style={[styles.roomTabText, activeRoom === room && styles.roomTabTextActive]}>
              #{room}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Messages ── */}
      <FlatList
        ref={flatRef}
        data={displayData}
        keyExtractor={item => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyRoom}>
            <Text style={styles.emptyIcon}>{category.icon}</Text>
            <Text style={styles.emptyTitle}>#{activeRoom}</Text>
            <Text style={styles.emptyHint}>No messages yet — be the first! 👋</Text>
          </View>
        }
        ListFooterComponent={
          typingUsers.length > 0
            ? <TypingRow typingUsers={typingUsers.map(u => u.name)} />
            : null
        }
      />

      {/* ── Input bar ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.inputAction}
            onPress={pickAndSendPhoto}
            disabled={uploading}
          >
            <Text style={styles.inputActionIcon}>{uploading ? '⏳' : '📷'}</Text>
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={`Message #${activeRoom}…`}
            placeholderTextColor="#555"
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={1000}
          />

          {text.trim() ? (
            <TouchableOpacity onPress={sendMessage} activeOpacity={0.85}>
              <LinearGradient colors={[ACCENT, '#7289da']} style={styles.sendBtn}>
                <Text style={styles.sendIcon}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.inputAction}>
              <Text style={styles.inputActionIcon}>🎤</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Members panel ── */}
      <MembersPanel
        visible={showMembers}
        members={members}
        category={category}
        activeRoom={activeRoom}
        onClose={() => setShowMembers(false)}
      />

      {/* ── Reaction / context modal ── */}
      <Modal
        visible={!!contextMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setContextMsg(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setContextMsg(null)}>
          <View style={styles.contextMenu}>
            <View style={styles.reactStrip}>
              {REACTIONS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={styles.reactBtn}
                  onPress={() => addReaction(contextMsg?.id, e)}
                >
                  <Text style={styles.reactEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.contextDivider} />
            <TouchableOpacity style={styles.contextAction} onPress={() => setContextMsg(null)}>
              <Text style={styles.contextActionIcon}>✕</Text>
              <Text style={[styles.contextActionText, { color: '#888' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e', gap: 10,
  },
  backBtn:    { padding: 4 },
  backArrow:  { color: ACCENT, fontSize: 24 },
  headerTitle:{ color: '#fff', fontSize: 16, fontWeight: '800' },
  headerSub:  { color: '#666', fontSize: 11, marginTop: 2 },
  membersBtn: { borderRadius: 12, overflow: 'hidden' },
  membersBtnGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12,
    borderWidth: 1, borderColor: `${ACCENT}44`,
  },
  membersBtnIcon:  { fontSize: 16 },
  membersBtnCount: { color: ACCENT, fontSize: 13, fontWeight: '800' },

  // Room tabs
  roomTabsBar:     { maxHeight: 46, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  roomTabsContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingVertical: 8 },
  roomTab:         { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 16, backgroundColor: CARD },
  roomTabActive:   { backgroundColor: ACCENT },
  roomTabText:     { color: '#666', fontSize: 12, fontWeight: '600' },
  roomTabTextActive:{ color: '#fff', fontWeight: '700' },

  // Messages
  msgList: { padding: 14, paddingBottom: 8, gap: 4, flexGrow: 1 },

  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dateSepText: { color: '#555', fontSize: 11, fontWeight: '600' },

  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  avatarWrap: { marginRight: 7, marginBottom: 2 },

  senderRow:    { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 3 },
  senderName:   { fontSize: 11, fontWeight: '700' },
  senderCountry:{ color: '#555', fontSize: 10 },

  bubble:      { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, gap: 2 },
  bubbleMine:  { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: CARD,   borderBottomLeftRadius:  4 },

  imageThumb:    { width: 200, height: 150, borderRadius: 10, marginBottom: 4 },
  msgText:       { color: '#fff', fontSize: 15, lineHeight: 21 },
  translatedTag: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 },
  msgMeta:       { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 3 },
  msgTime:       { color: 'rgba(255,255,255,0.35)', fontSize: 10 },

  reactionsRow:     { flexDirection: 'row', gap: 4, marginTop: 3 },
  reactionsRowMine: { justifyContent: 'flex-end' },
  reactionPill: {
    backgroundColor: CARD, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: BORDER,
  },
  reactionEmoji: { fontSize: 13 },

  // Empty state
  emptyRoom:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon:  { fontSize: 52 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyHint:  { color: '#888', fontSize: 13 },

  // Typing
  typingRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  typingBubble:{ backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  typingDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#666' },
  typingLabel: { color: '#666', fontSize: 12 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, gap: 8,
    borderTopWidth: 1, borderTopColor: '#1a1a2e',
    backgroundColor: BG,
  },
  inputAction:     { width: 40, height: 40, borderRadius: 20, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  inputActionIcon: { fontSize: 20 },
  input: {
    flex: 1, backgroundColor: CARD, color: '#fff', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 110,
    borderWidth: 1, borderColor: BORDER,
  },
  sendBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 18 },

  // Members panel
  panelBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 50,
  },
  panel: {
    position: 'absolute', top: 0, bottom: 0, right: 0,
    width: PANEL_W, backgroundColor: '#12121f',
    borderLeftWidth: 1, borderLeftColor: BORDER,
    zIndex: 51,
  },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  panelTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  panelSub:   { color: '#888', fontSize: 12, marginTop: 2 },
  panelClose: { color: '#666', fontSize: 20, padding: 4 },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  memberOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4caf50', borderWidth: 2, borderColor: '#12121f',
  },
  memberName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  memberMeta: { color: '#666', fontSize: 12, marginTop: 2 },

  // Context menu modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  contextMenu:  { backgroundColor: '#1e1e32', borderRadius: 20, overflow: 'hidden', minWidth: 260, borderWidth: 1, borderColor: BORDER },
  reactStrip:   { flexDirection: 'row', padding: 14, justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: BORDER },
  reactBtn:     { padding: 6 },
  reactEmoji:   { fontSize: 26 },
  contextDivider: { height: 1, backgroundColor: BORDER },
  contextAction:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  contextActionIcon: { color: '#aaa', fontSize: 16, width: 22, textAlign: 'center' },
  contextActionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
