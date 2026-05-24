import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Pressable,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, Image, Modal, ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { getAccessToken } from '../services/authApi';
import axios from 'axios';
import { getSocket, SERVER_URL } from '../services/socket';
import GiftPicker from '../components/GiftPicker';

const ACCENT  = '#5865f2';
const BG      = '#0f0f1a';
const CARD    = '#1a1a2e';
const BORDER  = '#2a2a4a';
const REACTIONS = ['❤️', '🔥', '😂', '👍', '😮'];

const STARTERS = [
  'If you could live anywhere in the world for a year, where?',
  'What\'s one thing about your culture you wish more people knew?',
  'What\'s the best meal you\'ve ever had?',
  'What\'s a skill you\'re currently learning?',
  'What song are you listening to on repeat right now?',
];

async function authHeader() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function timeStr(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dateLabel(ts) {
  const d   = new Date(ts);
  const now = new Date();
  if (now.toDateString() === d.toDateString()) return 'Today';
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (yest.toDateString() === d.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ photo_url, name, size = 38 }) {
  const initials = (name || '?')[0].toUpperCase();
  if (photo_url) {
    return (
      <Image
        source={{ uri: photo_url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: size * 0.42 }}>{initials}</Text>
    </View>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────

function TypingBubble({ name }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.delay(450),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.typingBubble}>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, {
              opacity: d,
              transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
            }]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChatScreen({ route, navigation }) {
  const { otherUser, currentUser, matchId, compatibilityScore } = route.params;

  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState('');
  const [showGifts,   setShowGifts]   = useState(false);
  const [giftAnim]                    = useState(new Animated.Value(0));
  const [lastGift,    setLastGift]    = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [reactions,   setReactions]   = useState({});
  const [replyTo,     setReplyTo]     = useState(null);
  const [contextMsg,  setContextMsg]  = useState(null);
  const [uploading,   setUploading]   = useState(false);

  const flatRef     = useRef(null);
  const inputRef    = useRef(null);
  const typingTimer = useRef(null);
  const socket      = getSocket();

  const displayName = otherUser.display_name || otherUser.username || 'Someone';

  // ── Socket listeners ───────────────────────────────────────────────────────

  useEffect(() => {
    socket.emit('get_dm_history', { otherSocketId: otherUser.socketId });

    socket.on('dm_history', msgs => setMessages(msgs || []));

    socket.on('direct_message', msg => {
      setMessages(prev => [...prev, msg]);
      setOtherTyping(false);
    });

    socket.on('gift_received', giftMsg => {
      setLastGift(giftMsg);
      setMessages(prev => [...prev, giftMsg]);
      triggerGiftAnim();
    });

    socket.on('gift_sent', giftMsg => setMessages(prev => [...prev, giftMsg]));

    socket.on('user_typing', ({ fromSocketId }) => {
      if (fromSocketId === otherUser.socketId) setOtherTyping(true);
    });
    socket.on('user_stopped_typing', ({ fromSocketId }) => {
      if (fromSocketId === otherUser.socketId) setOtherTyping(false);
    });

    socket.on('user_list', users => {
      setOtherOnline(users.some(u => u.socketId === otherUser.socketId));
    });
    socket.emit('get_users');

    return () => {
      socket.off('dm_history');
      socket.off('direct_message');
      socket.off('gift_received');
      socket.off('gift_sent');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('user_list');
      clearTimeout(typingTimer.current);
    };
  }, [otherUser.socketId]);

  useEffect(() => {
    if (messages.length > 0 || otherTyping) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [messages, otherTyping]);

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleTextChange(val) {
    setText(val);
    if (val.trim()) {
      socket.emit('typing', { toSocketId: otherUser.socketId });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('stop_typing', { toSocketId: otherUser.socketId });
      }, 2000);
    } else {
      clearTimeout(typingTimer.current);
      socket.emit('stop_typing', { toSocketId: otherUser.socketId });
    }
  }

  function sendMessage() {
    if (!text.trim()) return;
    clearTimeout(typingTimer.current);
    socket.emit('stop_typing', { toSocketId: otherUser.socketId });
    socket.emit('direct_message', {
      toSocketId: otherUser.socketId,
      text: text.trim(),
      matchId,
      replyTo: replyTo
        ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName }
        : undefined,
    });
    setText('');
    setReplyTo(null);
  }

  function sendGift(gift) {
    socket.emit('send_gift', { toSocketId: otherUser.socketId, gift });
  }

  function sendStarter(q) {
    socket.emit('direct_message', { toSocketId: otherUser.socketId, text: q, matchId });
  }

  async function pickAndSendPhoto() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.75 });
    if (!result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const headers  = await authHeader();
      const formData = new FormData();
      formData.append('photo', {
        uri:  asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'photo.jpg',
      });
      const { data } = await axios.post(`${SERVER_URL}/api/photos/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }, timeout: 30000,
      });
      socket.emit('direct_message', {
        toSocketId: otherUser.socketId,
        text:     '📷 Photo',
        imageUrl: data.imageUrl,
        matchId,
      });
    } catch {
      // silently fall through — upload failure shouldn't break the chat
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

  function triggerGiftAnim() {
    giftAnim.setValue(0);
    Animated.sequence([
      Animated.spring(giftAnim, { toValue: 1, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(giftAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  function startCall(callType) {
    navigation.navigate('Call', {
      mode: 'outgoing',
      toSocketId: otherUser.socketId,
      toName:     displayName,
      callType,
    });
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

    const isMine  = item.senderId === socket.id;
    const msgRxns = reactions[item.id] || [];

    if (item.type === 'gift') {
      return (
        <View style={styles.giftRow}>
          <LinearGradient colors={['#2a1a4e', '#1a1a3e']} style={styles.giftBubble}>
            <Text style={styles.giftEmoji}>{item.gift?.emoji}</Text>
            <Text style={styles.giftText}>
              {isMine ? 'You' : item.senderName} sent a {item.gift?.name}!
            </Text>
            <Text style={styles.giftTime}>{timeStr(item.timestamp)}</Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <Pressable
        onLongPress={() => setContextMsg(item)}
        style={[styles.msgRow, isMine && styles.msgRowMine]}
      >
        {!isMine && (
          <View style={styles.avatarWrap}>
            <Avatar photo_url={otherUser.photo_url} name={displayName} size={28} />
          </View>
        )}

        <View style={{ maxWidth: '75%', gap: 2 }}>
          {/* Reply preview */}
          {item.replyTo && (
            <View style={[styles.replyPreview, isMine ? styles.replyPreviewMine : styles.replyPreviewOther]}>
              <Text style={styles.replyPreviewName} numberOfLines={1}>{item.replyTo.senderName}</Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>{item.replyTo.text}</Text>
            </View>
          )}

          {/* Bubble */}
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.imageThumb} resizeMode="cover" />
            )}
            {(item.text && item.text !== '📷 Photo') && (
              <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{item.text}</Text>
            )}
            {item.wasTranslated && (
              <Text style={styles.translatedTag}>🌐 auto-translated</Text>
            )}
            <View style={styles.msgMeta}>
              <Text style={[styles.msgTime, isMine && styles.msgTimeMine]}>
                {timeStr(item.timestamp)}
              </Text>
              {isMine && <Text style={styles.readReceipt}>✓✓</Text>}
            </View>
          </View>

          {/* Reactions */}
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

  // ── Build display list (inject date separators + typing) ──────────────────

  const displayData = [];
  let lastDateLabel = null;
  messages.forEach((m, i) => {
    const label = dateLabel(m.timestamp);
    if (label !== lastDateLabel) {
      displayData.push({ _sep: true, id: `sep_${i}`, label });
      lastDateLabel = label;
    }
    displayData.push(m);
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  const headerSubtitle = otherOnline
    ? '🟢 Online now'
    : otherUser.country || '';

  return (
    <SafeAreaView style={styles.container}>

      {/* Gift fly-in overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.giftOverlay, {
          opacity:   giftAnim,
          transform: [{ scale: giftAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }]}
      >
        {lastGift && <Text style={styles.giftOverlayEmoji}>{lastGift.gift?.emoji}</Text>}
      </Animated.View>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => navigation.navigate('Profile', {
            profileUser: otherUser,
            bondUserId:  otherUser.userId || otherUser.user_id,
          })}
          activeOpacity={0.78}
        >
          <View style={{ position: 'relative' }}>
            <Avatar photo_url={otherUser.photo_url} name={displayName} size={40} />
            {otherOnline && <View style={styles.headerOnlineDot} />}
          </View>
          <View>
            <Text style={styles.headerName}>{displayName}</Text>
            <Text style={styles.headerSub}>{headerSubtitle}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.callBtn} onPress={() => startCall('voice')}>
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => startCall('video')}>
            <Text style={styles.callIcon}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compatibility banner */}
      {compatibilityScore != null && (
        <LinearGradient colors={[`${ACCENT}1a`, 'transparent']} style={styles.compatBanner}>
          <Text style={styles.compatText}>✨ {compatibilityScore}% Bond Match</Text>
        </LinearGradient>
      )}

      {/* ── Messages or empty state ── */}
      {messages.length === 0 && !otherTyping ? (
        <ScrollView contentContainerStyle={styles.emptyState} showsVerticalScrollIndicator={false}>
          <View style={{ position: 'relative', marginBottom: 12 }}>
            <Avatar photo_url={otherUser.photo_url} name={displayName} size={80} />
            {otherOnline && <View style={styles.emptyOnlineDot} />}
          </View>
          <Text style={styles.emptyName}>{displayName}</Text>
          <Text style={styles.emptyHint}>
            {otherOnline ? 'Online now — say hi!' : 'Start the conversation'}
          </Text>
          <Text style={styles.startersLabel}>Conversation starters:</Text>
          {STARTERS.map((q, i) => (
            <TouchableOpacity key={i} style={styles.starterChip} onPress={() => sendStarter(q)} activeOpacity={0.75}>
              <Text style={styles.starterText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={flatRef}
          data={displayData}
          keyExtractor={item => String(item.id)}
          renderItem={({ item, index }) => {
            if (item._sep) return renderMessage({ item, index });
            return renderMessage({ item, index });
          }}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={otherTyping ? <TypingBubble name={displayName} /> : null}
        />
      )}

      {/* Reply bar */}
      {replyTo && (
        <View style={styles.replyBar}>
          <View style={styles.replyBarAccent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyBarName}>{replyTo.senderName}</Text>
            <Text style={styles.replyBarPreview} numberOfLines={1}>{replyTo.text}</Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.replyBarClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

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
          <TouchableOpacity style={styles.inputAction} onPress={() => setShowGifts(true)}>
            <Text style={styles.inputActionIcon}>🎁</Text>
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={`Message ${displayName}…`}
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

      {/* GiftPicker */}
      <GiftPicker visible={showGifts} onClose={() => setShowGifts(false)} onSend={sendGift} />

      {/* Long-press context menu */}
      <Modal
        visible={!!contextMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setContextMsg(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setContextMsg(null)}>
          <View style={styles.contextMenu}>
            {/* Reaction strip */}
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

            <TouchableOpacity
              style={styles.contextAction}
              onPress={() => {
                setReplyTo(contextMsg);
                setContextMsg(null);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
            >
              <Text style={styles.contextActionIcon}>↩</Text>
              <Text style={styles.contextActionText}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contextAction, { borderTopWidth: 1, borderTopColor: BORDER }]}
              onPress={() => setContextMsg(null)}
            >
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

  giftOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 99, pointerEvents: 'none',
  },
  giftOverlayEmoji: { fontSize: 110 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
    gap: 10,
  },
  backBtn:    { padding: 4 },
  backArrow:  { color: ACCENT, fontSize: 24 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#4caf50', borderWidth: 2, borderColor: BG,
  },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerSub:  { color: '#888', fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  callBtn: { backgroundColor: CARD, borderRadius: 10, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  callIcon: { fontSize: 18 },

  // Compatibility banner
  compatBanner: { paddingHorizontal: 16, paddingVertical: 7, alignItems: 'center' },
  compatText:   { color: ACCENT, fontSize: 12, fontWeight: '700' },

  // Messages
  msgList: { padding: 14, paddingBottom: 8, gap: 6 },

  dateSep: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 12, gap: 8,
  },
  dateSepLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dateSepText: { color: '#555', fontSize: 11, fontWeight: '600' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  msgRowMine: { justifyContent: 'flex-end' },
  avatarWrap: { marginRight: 6, marginBottom: 2 },

  replyPreview: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: -4, borderLeftWidth: 3,
  },
  replyPreviewMine:  { backgroundColor: `${ACCENT}33`, borderLeftColor: ACCENT, alignSelf: 'flex-end' },
  replyPreviewOther: { backgroundColor: '#252540',      borderLeftColor: '#888'  },
  replyPreviewName:  { color: ACCENT, fontSize: 10, fontWeight: '700', marginBottom: 2 },
  replyPreviewText:  { color: '#999', fontSize: 11 },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, gap: 2 },
  bubbleMine:  { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: CARD,   borderBottomLeftRadius: 4 },

  imageThumb:   { width: 200, height: 150, borderRadius: 10, marginBottom: 6 },
  msgText:      { color: '#fff', fontSize: 15, lineHeight: 21 },
  msgTextMine:  { color: '#fff' },
  translatedTag:{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 },
  msgMeta:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  msgTime:      { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
  msgTimeMine:  { color: 'rgba(255,255,255,0.5)' },
  readReceipt:  { color: 'rgba(255,255,255,0.55)', fontSize: 10 },

  reactionsRow:     { flexDirection: 'row', gap: 4, marginTop: 3 },
  reactionsRowMine: { justifyContent: 'flex-end' },
  reactionPill: {
    backgroundColor: CARD, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: BORDER,
  },
  reactionEmoji: { fontSize: 14 },

  // Gift
  giftRow:  { alignItems: 'center', marginVertical: 10 },
  giftBubble: {
    borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: `${ACCENT}44`,
  },
  giftEmoji: { fontSize: 44 },
  giftText:  { color: '#ddd', fontSize: 14, fontWeight: '600' },
  giftTime:  { color: '#666', fontSize: 10 },

  // Typing
  typingRow:   { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, paddingHorizontal: 14 },
  typingBubble: {
    backgroundColor: CARD, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#666',
  },

  // Empty state
  emptyState: { alignItems: 'center', padding: 28, paddingTop: 40, gap: 8 },
  emptyOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#4caf50', borderWidth: 2.5, borderColor: BG,
  },
  emptyName:     { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  emptyHint:     { color: '#888', fontSize: 13, marginBottom: 8 },
  startersLabel: { color: '#555', fontSize: 12, fontWeight: '600', marginTop: 10, alignSelf: 'flex-start' },
  starterChip: {
    backgroundColor: CARD, borderRadius: 14, padding: 14, width: '100%',
    borderWidth: 1, borderColor: BORDER,
  },
  starterText: { color: '#ccc', fontSize: 14, lineHeight: 20 },

  // Reply bar
  replyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#16162a', paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  replyBarAccent: { width: 3, height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  replyBarName:   { color: ACCENT, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  replyBarPreview:{ color: '#888', fontSize: 12 },
  replyBarClose:  { color: '#666', fontSize: 16, paddingHorizontal: 4 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, gap: 8,
    borderTopWidth: 1, borderTopColor: '#1a1a2e',
    backgroundColor: BG,
  },
  inputAction: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: CARD,
    alignItems: 'center', justifyContent: 'center',
  },
  inputActionIcon: { fontSize: 20 },
  input: {
    flex: 1, backgroundColor: CARD, color: '#fff', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 110,
    borderWidth: 1, borderColor: BORDER,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 18 },

  // Context menu modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  contextMenu: {
    backgroundColor: '#1e1e32', borderRadius: 20, overflow: 'hidden',
    minWidth: 220, borderWidth: 1, borderColor: BORDER,
  },
  reactStrip: {
    flexDirection: 'row', padding: 14, justifyContent: 'space-around',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  reactBtn:   { padding: 6 },
  reactEmoji: { fontSize: 28 },
  contextDivider: { height: 1, backgroundColor: BORDER },
  contextAction: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  contextActionIcon: { color: '#aaa', fontSize: 16, width: 22, textAlign: 'center' },
  contextActionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
