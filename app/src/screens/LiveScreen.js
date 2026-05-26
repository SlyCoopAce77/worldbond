import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, StatusBar, Dimensions, Image, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';

const { width, height } = Dimensions.get('window');
const REACTIONS = ['❤️', '🔥', '😂', '🙌', '😮', '💯'];

function formatDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function stringToColor(str = '') {
  const p = ['#e57373','#ba68c8','#4fc3f7','#81c784','#ffb74d','#f06292','#4db6ac','#7986cb'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

// Floating emoji that animates up and fades out
function FloatingReaction({ emoji, id, onDone }) {
  const y   = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(1)).current;
  const x   = useRef(Math.random() * width * 0.5 + width * 0.1).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y,  { toValue: -220, duration: 1800, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0,    duration: 1800, useNativeDriver: true }),
    ]).start(() => onDone(id));
  }, []);

  return (
    <Animated.Text
      style={[styles.floatEmoji, { left: x, bottom: 160, transform: [{ translateY: y }], opacity: op }]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function LiveScreen({ route, navigation }) {
  const { user } = route.params || {};
  const socket = getSocket();

  const [phase,         setPhase]         = useState('lobby'); // 'lobby' | 'live'
  const [title,         setTitle]         = useState('');
  const [streamId,      setStreamId]      = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [viewerCount,   setViewerCount]   = useState(0);
  const [floats,        setFloats]        = useState([]);
  const [elapsed,       setElapsed]       = useState(0);
  const [viewerJoined,  setViewerJoined]  = useState(null);
  const [isEnding,      setIsEnding]      = useState(false);

  const flatRef      = useRef(null);
  const timerRef     = useRef(null);
  const joinFadeAnim = useRef(new Animated.Value(0)).current;

  // Duration timer — only runs while live
  useEffect(() => {
    if (phase !== 'live') return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  function startLive() {
    const liveTitle = title.trim() || `${user?.username}'s Live`;
    socket.emit('go_live', { title: liveTitle });
  }

  // Socket listeners
  useEffect(() => {
    socket.on('live_started', ({ streamId: sid }) => {
      setStreamId(sid);
      setPhase('live');
    });

    socket.on('live_viewer_count', ({ count }) => setViewerCount(count));

    socket.on('live_viewer_joined', ({ viewerName, viewerCountry, count }) => {
      setViewerCount(count);
      setViewerJoined(`${viewerName} joined`);
      joinFadeAnim.setValue(1);
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(joinFadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => setViewerJoined(null));
    });

    socket.on('live_message', msg => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    });

    socket.on('live_reaction', ({ emoji }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setFloats(prev => [...prev, { emoji, id }]);
    });

    socket.on('live_ended', () => {
      navigation.goBack();
    });

    return () => {
      socket.off('live_started');
      socket.off('live_viewer_count');
      socket.off('live_viewer_joined');
      socket.off('live_message');
      socket.off('live_reaction');
      socket.off('live_ended');
    };
  }, []);

  function sendMessage() {
    if (!text.trim() || !streamId) return;
    socket.emit('live_message', { streamId, text: text.trim() });
    setText('');
  }

  function sendReaction(emoji) {
    if (!streamId) return;
    socket.emit('live_reaction', { streamId, emoji });
  }

  function endLive() {
    Alert.alert('End Live?', 'Your viewers will be disconnected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Live', style: 'destructive',
        onPress: () => {
          setIsEnding(true);
          socket.emit('end_live');
          navigation.goBack();
        },
      },
    ]);
  }

  function removeFloat(id) {
    setFloats(prev => prev.filter(f => f.id !== id));
  }

  const avatarColor = stringToColor(user?.username || '');

  // ── Lobby (pre-live setup) ──────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <LinearGradient colors={['#1a0a2e', '#000000']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <TouchableOpacity style={styles.lobbyBack} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <View style={styles.lobbyContent}>
              {/* Avatar preview */}
              <View style={styles.lobbyAvatarWrap}>
                {user?.photo_url ? (
                  <Image source={{ uri: user.photo_url }} style={styles.lobbyAvatar} />
                ) : (
                  <LinearGradient colors={[avatarColor, avatarColor + '88']} style={styles.lobbyAvatar}>
                    <Text style={styles.lobbyInitial}>{(user?.username || '?')[0].toUpperCase()}</Text>
                  </LinearGradient>
                )}
                <View style={styles.lobbyLivePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>

              <Text style={styles.lobbyTitle}>Start a Live Stream</Text>
              <Text style={styles.lobbySub}>Share a moment with people from around the world</Text>

              <TextInput
                style={styles.lobbyInput}
                placeholder="Give your stream a title…"
                placeholderTextColor="#444"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />

              <TouchableOpacity style={styles.goLiveBtn} onPress={startLive} activeOpacity={0.85}>
                <LinearGradient colors={['#e53935', '#b71c1c']} style={styles.goLiveBtnGrad}>
                  <Text style={styles.goLiveBtnText}>🔴  Go Live</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.lobbyHint}>Your stream will be visible to everyone on WorldBond</Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Background — gradient with avatar overlay */}
      <LinearGradient colors={['#1a0a2e', '#000000', '#001a0a']} style={StyleSheet.absoluteFill} />

      {/* Avatar / thumbnail center */}
      <View style={styles.centerAvatar}>
        {user?.photo_url ? (
          <Image source={{ uri: user.photo_url }} style={styles.hostPhoto} />
        ) : (
          <LinearGradient colors={[avatarColor, avatarColor + '88']} style={styles.hostAvatarBg}>
            <Text style={styles.hostInitial}>{(user?.username || '?')[0].toUpperCase()}</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* Floating reactions */}
      {floats.map(f => (
        <FloatingReaction key={f.id} emoji={f.emoji} id={f.id} onDone={removeFloat} />
      ))}

      <SafeAreaView style={styles.overlay}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={styles.topCenter}>
            <Text style={styles.hostName}>{user?.username}</Text>
            <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
          </View>

          <View style={styles.topRight}>
            <View style={styles.viewerPill}>
              <Text style={styles.viewerIcon}>👁</Text>
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
            <TouchableOpacity style={styles.endBtn} onPress={endLive}>
              <Text style={styles.endText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewer joined toast */}
        {viewerJoined && (
          <Animated.View style={[styles.joinToast, { opacity: joinFadeAnim }]}>
            <Text style={styles.joinToastText}>👋 {viewerJoined}</Text>
          </Animated.View>
        )}

        {/* ── Live chat ── */}
        <View style={styles.chatArea}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => (
              <View style={styles.msgRow}>
                <Text style={styles.msgName}>{item.senderName}</Text>
                <Text style={styles.msgText}> {item.text}</Text>
                {item.wasTranslated && <Text style={styles.translated}> 🌐</Text>}
              </View>
            )}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
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
              placeholder="Say something to your viewers…"
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
  hostPhoto:    { width: width, height: height, resizeMode: 'cover' },
  hostAvatarBg: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  hostInitial:  { color: '#fff', fontSize: 72, fontWeight: '900' },

  floatEmoji:   { position: 'absolute', fontSize: 36, zIndex: 99 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  liveBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText:     { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },

  topCenter:    { alignItems: 'center', flex: 1 },
  hostName:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  timer:        { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  topRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewerPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  viewerIcon:   { fontSize: 12 },
  viewerCount:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  endBtn:       { backgroundColor: '#e5393580', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#e53935' },
  endText:      { color: '#fff', fontSize: 13, fontWeight: '800' },

  joinToast:    { alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 4 },
  joinToastText:{ color: '#fff', fontSize: 13 },

  chatArea:     { flex: 1, justifyContent: 'flex-end' },
  chatList:     { padding: 12, gap: 6 },
  msgRow:       { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', maxWidth: '85%' },
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

  // Lobby
  lobbyBack:       { padding: 16 },
  lobbyContent:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  lobbyAvatarWrap: { position: 'relative', marginBottom: 8 },
  lobbyAvatar:     { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#e53935' },
  lobbyInitial:    { color: '#fff', fontSize: 48, fontWeight: '900' },
  lobbyLivePill:   { position: 'absolute', bottom: -8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  lobbyTitle:      { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  lobbySub:        { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  lobbyInput:      { width: '100%', backgroundColor: '#16181C', color: '#fff', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, borderWidth: 1, borderColor: '#2F3336', marginTop: 8 },
  goLiveBtn:       { width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  goLiveBtnGrad:   { paddingVertical: 18, alignItems: 'center' },
  goLiveBtnText:   { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  lobbyHint:       { color: '#333', fontSize: 12, textAlign: 'center' },
});
