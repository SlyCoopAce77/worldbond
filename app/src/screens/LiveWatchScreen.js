import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, StatusBar, Dimensions, Image, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';

const { width, height } = Dimensions.get('window');
const REACTIONS = ['❤️', '🔥', '😂', '🙌', '😮', '💯'];

function stringToColor(str = '') {
  const p = ['#e57373','#ba68c8','#4fc3f7','#81c784','#ffb74d','#f06292','#4db6ac','#7986cb'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

function FloatingReaction({ emoji, id, onDone }) {
  const y  = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(1)).current;
  const x  = useRef(Math.random() * width * 0.5 + width * 0.1).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y,  { toValue: -220, duration: 1800, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0,    duration: 1800, useNativeDriver: true }),
    ]).start(() => onDone(id));
  }, []);

  return (
    <Animated.Text style={[styles.floatEmoji, { left: x, bottom: 160, transform: [{ translateY: y }], opacity: op }]}>
      {emoji}
    </Animated.Text>
  );
}

export default function LiveWatchScreen({ route, navigation }) {
  const { stream, currentUser } = route.params || {};
  const socket = getSocket();

  const [messages,    setMessages]    = useState([]);
  const [viewerCount, setViewerCount] = useState(stream?.viewerCount || 0);
  const [floats,      setFloats]      = useState([]);
  const [text,        setText]        = useState('');
  const [ended,       setEnded]       = useState(false);
  const [elapsed,     setElapsed]     = useState(stream?.startedAt ? Math.floor((Date.now() - stream.startedAt) / 1000) : 0);

  const flatRef  = useRef(null);
  const timerRef = useRef(null);

  // Duration ticker (synced to stream start)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - stream.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Join stream on mount, leave on unmount
  useEffect(() => {
    socket.emit('join_live', { streamId: stream.streamId });

    socket.on('live_joined', ({ messages: history }) => {
      setMessages(history || []);
    });

    socket.on('live_viewer_count', ({ count }) => setViewerCount(count));

    socket.on('live_message', msg => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    });

    socket.on('live_reaction', ({ emoji }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setFloats(prev => [...prev, { emoji, id }]);
    });

    socket.on('live_ended', ({ streamId }) => {
      if (streamId === stream.streamId) setEnded(true);
    });

    return () => {
      socket.emit('leave_live', { streamId: stream.streamId });
      socket.off('live_joined');
      socket.off('live_viewer_count');
      socket.off('live_message');
      socket.off('live_reaction');
      socket.off('live_ended');
    };
  }, []);

  function sendMessage() {
    if (!text.trim()) return;
    socket.emit('live_message', { streamId: stream.streamId, text: text.trim() });
    setText('');
  }

  function sendReaction(emoji) {
    socket.emit('live_reaction', { streamId: stream.streamId, emoji });
  }

  function removeFloat(id) {
    setFloats(prev => prev.filter(f => f.id !== id));
  }

  function formatDuration(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const avatarColor = stringToColor(stream.hostName || '');

  if (ended) {
    return (
      <View style={styles.endedScreen}>
        <LinearGradient colors={['#1a0a2e', '#000000']} style={StyleSheet.absoluteFill} />
        <Text style={{ fontSize: 52, marginBottom: 20 }}>📴</Text>
        <Text style={styles.endedTitle}>Live ended</Text>
        <Text style={styles.endedSub}>{stream.hostName} ended their stream</Text>
        <TouchableOpacity style={styles.endedBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.endedBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Background */}
      <LinearGradient colors={['#1a0a2e', '#000000', '#001a0a']} style={StyleSheet.absoluteFill} />

      {/* Host visual */}
      <View style={styles.centerAvatar}>
        {stream.hostPhoto ? (
          <Image source={{ uri: stream.hostPhoto }} style={styles.hostPhoto} />
        ) : (
          <LinearGradient colors={[avatarColor, avatarColor + '88']} style={styles.hostAvatarBg}>
            <Text style={styles.hostInitial}>{(stream.hostName || '?')[0].toUpperCase()}</Text>
          </LinearGradient>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>

      {/* Floating reactions */}
      {floats.map(f => (
        <FloatingReaction key={f.id} emoji={f.emoji} id={f.id} onDone={removeFloat} />
      ))}

      <SafeAreaView style={styles.overlay}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.hostInfo}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.hostName}>{stream.hostName}</Text>
            <Text style={styles.streamTitle} numberOfLines={1}>{stream.title}</Text>
          </View>

          <View style={styles.topRight}>
            <View style={styles.viewerPill}>
              <Text style={styles.viewerIcon}>👁</Text>
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
            <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
          </View>
        </View>

        {/* ── Chat ── */}
        <View style={styles.chatArea}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => {
              const isMine = item.senderId === socket.id;
              return (
                <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
                  <Text style={styles.msgName}>{item.senderName}</Text>
                  <Text style={styles.msgText}> {item.text}</Text>
                  {item.wasTranslated && <Text style={styles.translated}> 🌐</Text>}
                </View>
              );
            }}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        {/* ── Reactions bar ── */}
        <View style={styles.reactBar}>
          {REACTIONS.map(e => (
            <TouchableOpacity key={e} style={styles.reactBtn} onPress={() => sendReaction(e)}>
              <Text style={styles.reactEmoji}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Input ── */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Comment…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={text}
              onChangeText={setText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            {text.trim() ? (
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  overlay:      { flex: 1 },

  centerAvatar: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  hostPhoto:    { width, height, resizeMode: 'cover' },
  hostAvatarBg: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  hostInitial:  { color: '#fff', fontSize: 72, fontWeight: '900' },

  floatEmoji:   { position: 'absolute', fontSize: 36, zIndex: 99 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12, gap: 10,
  },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  backIcon:     { color: '#fff', fontSize: 20 },

  hostInfo:     { flex: 1, gap: 2 },
  liveBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText:     { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  hostName:     { color: '#fff', fontWeight: '800', fontSize: 14 },
  streamTitle:  { color: 'rgba(255,255,255,0.55)', fontSize: 11 },

  topRight:     { alignItems: 'flex-end', gap: 4 },
  viewerPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  viewerIcon:   { fontSize: 12 },
  viewerCount:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  timerText:    { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  chatArea:     { flex: 1, justifyContent: 'flex-end' },
  chatList:     { padding: 12, gap: 6 },
  msgRow:       { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', maxWidth: '85%' },
  msgRowMine:   { borderLeftWidth: 2, borderLeftColor: '#E8003D' },
  msgName:      { color: '#E8003D', fontWeight: '700', fontSize: 13 },
  msgText:      { color: '#fff', fontSize: 13 },
  translated:   { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  reactBar:     { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 8 },
  reactBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  reactEmoji:   { fontSize: 22 },

  inputBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  input:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  sendBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8003D', alignItems: 'center', justifyContent: 'center' },
  sendIcon:     { color: '#fff', fontSize: 18 },

  endedScreen:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  endedTitle:   { color: '#fff', fontSize: 24, fontWeight: '900' },
  endedSub:     { color: '#666', fontSize: 14, marginBottom: 20 },
  endedBtn:     { backgroundColor: '#E8003D', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  endedBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
