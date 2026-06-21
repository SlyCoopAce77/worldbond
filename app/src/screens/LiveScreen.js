import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, StatusBar, Dimensions, Image, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';
import { stringToColor, formatDuration } from '../utils/apiUtils';
import { useWallet } from '../context/WalletContext';
import { WorldMark } from '../components/BondLogo';
import FloatingReaction from '../components/FloatingReaction';

const { width, height } = Dimensions.get('window');
const REACTIONS = ['❤️', '🔥', '😂', '🙌', '😮', '💯'];

// ── "Global Drop" gift burst — WorldBond's unique gift animation ──────────────
// Gifts arrive from above (like they traveled from another country),
// emoji pops on landing, then launches upward-out when done.
function GiftBurst({ burst, onDone }) {
  const dropY      = useRef(new Animated.Value(-90)).current;
  const cardScale  = useRef(new Animated.Value(0.2)).current;
  const emojiScale = useRef(new Animated.Value(1)).current;
  const exitX      = useRef(new Animated.Value(0)).current;
  const exitY      = useRef(new Animated.Value(0)).current;
  const exitScale  = useRef(new Animated.Value(1)).current;
  const fade       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Drop in from above, scale up from tiny (like arriving from orbit)
      Animated.parallel([
        Animated.spring(dropY,     { toValue: 0, friction: 7, tension: 65, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 65, useNativeDriver: true }),
      ]),
      // 2. Emoji pops — celebration burst on landing
      Animated.sequence([
        Animated.timing(emojiScale, { toValue: 1.5, duration: 140, useNativeDriver: true }),
        Animated.spring(emojiScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      // 3. Hold so the streamer can read it
      Animated.delay(2600),
      // 4. Launch back up + right, shrink to a point — "returns to orbit"
      Animated.parallel([
        Animated.timing(exitX,     { toValue: 60,  duration: 480, useNativeDriver: true }),
        Animated.timing(exitY,     { toValue: -110, duration: 480, useNativeDriver: true }),
        Animated.timing(exitScale, { toValue: 0.1,  duration: 480, useNativeDriver: true }),
        Animated.timing(fade,      { toValue: 0,    duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, []);

  return (
    <Animated.View
      style={[
        gbS.wrap,
        {
          opacity: fade,
          transform: [
            { translateY: dropY },
            { translateX: exitX },
            { translateY: exitY },
            { scale: Animated.multiply(cardScale, exitScale) },
          ],
        },
      ]}
    >
      {/* Country flag floats above the card as a "sender origin" marker */}
      <View style={gbS.flagBadge}>
        <Text style={gbS.flagEmoji}>{burst.senderCountry || '🌍'}</Text>
      </View>

      <View style={[gbS.card, { borderColor: burst.gift.color + '66' }]}>
        {/* Colored accent bar on the left — gift tier indicator */}
        <View style={[gbS.accentBar, { backgroundColor: burst.gift.color }]} />

        {/* Emoji in a glowing orbit circle */}
        <Animated.View style={[gbS.orbitCircle, { backgroundColor: burst.gift.color + '20', borderColor: burst.gift.color + '55' }, { transform: [{ scale: emojiScale }] }]}>
          <Text style={gbS.giftEmoji}>{burst.gift.emoji}</Text>
        </Animated.View>

        <View style={gbS.info}>
          <Text style={gbS.senderName} numberOfLines={1}>{burst.senderName}</Text>
          <Text style={gbS.giftName}>{burst.gift.name}</Text>
        </View>

        <View style={gbS.coinBadge}>
          <WorldMark size={11} color="#FFB700" bondColor="#FFB700" />
          <Text style={gbS.coinsNum}>{burst.gift.coins}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
const gbS = StyleSheet.create({
  wrap:        { alignSelf: 'flex-start', marginBottom: 6 },
  flagBadge:   { alignSelf: 'flex-start', marginLeft: 44, marginBottom: -8,
                 backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
                 paddingHorizontal: 6, paddingVertical: 2, zIndex: 2 },
  flagEmoji:   { fontSize: 13 },
  card:        { flexDirection: 'row', alignItems: 'center', gap: 10,
                 backgroundColor: 'rgba(8,9,16,0.88)',
                 borderRadius: 20, borderWidth: 1, overflow: 'hidden',
                 paddingVertical: 10, paddingRight: 14 },
  accentBar:   { width: 4, alignSelf: 'stretch', borderRadius: 2, marginLeft: 0 },
  orbitCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1,
                 alignItems: 'center', justifyContent: 'center' },
  giftEmoji:   { fontSize: 24 },
  info:        { flex: 1 },
  senderName:  { color: '#fff', fontSize: 12, fontWeight: '900' },
  giftName:    { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },
  coinBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3,
                 backgroundColor: '#FFB70018', borderRadius: 10,
                 paddingHorizontal: 7, paddingVertical: 4,
                 borderWidth: 1, borderColor: '#FFB70033' },
  coinsNum:    { color: '#FFB700', fontSize: 11, fontWeight: '900' },
});

export default function LiveScreen({ route, navigation }) {
  const { user, currentUser, preTitle } = route.params || {};
  const activeUser = user || currentUser;
  const socket = getSocket();
  const { earnCoins } = useWallet();

  const [phase,        setPhase]        = useState('lobby'); // 'lobby' | 'live'
  const [title,        setTitle]        = useState(preTitle || '');
  const [streamId,     setStreamId]     = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState('');
  const [viewerCount,  setViewerCount]  = useState(0);
  const [floats,       setFloats]       = useState([]);
  const [bursts,       setBursts]       = useState([]);
  const [elapsed,      setElapsed]      = useState(0);
  const [viewerJoined, setViewerJoined] = useState(null);

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
    const liveTitle = title.trim() || `${activeUser?.username}'s Live`;
    socket.emit('go_live', { title: liveTitle });
  }

  // Socket listeners
  useEffect(() => {
    socket.on('live_started', ({ streamId: sid }) => {
      setStreamId(sid);
      setPhase('live');
    });

    socket.on('live_viewer_count', ({ count }) => setViewerCount(count));

    socket.on('live_viewer_joined', ({ viewerName, count }) => {
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

    socket.on('live_gift_received', ({ senderName, senderCountry, gift }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setBursts(prev => [...prev, { id, senderName, senderCountry, gift }]);
      earnCoins(gift.coins, 'live_gift', { giftId: gift.id, senderName });
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
      socket.off('live_gift_received');
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
          socket.emit('end_live');
          navigation.goBack();
        },
      },
    ]);
  }

  function removeFloat(id) {
    setFloats(prev => prev.filter(f => f.id !== id));
  }

  function removeBurst(id) {
    setBursts(prev => prev.filter(b => b.id !== id));
  }

  const avatarColor = stringToColor(activeUser?.username || '');

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
                {activeUser?.photo_url ? (
                  <Image source={{ uri: activeUser.photo_url }} style={styles.lobbyAvatar} />
                ) : (
                  <LinearGradient colors={[avatarColor, avatarColor + '88']} style={styles.lobbyAvatar}>
                    <Text style={styles.lobbyInitial}>{(activeUser?.username || '?')[0].toUpperCase()}</Text>
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
                placeholderTextColor="rgba(255,255,255,0.3)"
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
        {activeUser?.photo_url ? (
          <Image source={{ uri: activeUser.photo_url }} style={styles.hostPhoto} />
        ) : (
          <LinearGradient colors={[avatarColor, avatarColor + '88']} style={styles.hostAvatarBg}>
            <Text style={styles.hostInitial}>{(activeUser?.username || '?')[0].toUpperCase()}</Text>
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
            <Text style={styles.hostName}>{activeUser?.username}</Text>
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

        {/* Viewer joined toast — floats above content, never shifts layout */}
        {viewerJoined && (
          <View style={styles.joinToastWrap} pointerEvents="none">
            <Animated.View style={[styles.joinToast, { opacity: joinFadeAnim }]}>
              <Text style={styles.joinToastText}>👋 {viewerJoined}</Text>
            </Animated.View>
          </View>
        )}

        {/* ── Live chat ── */}
        <View style={styles.chatArea}>
          {/* Gift burst cards float above chat */}
          <View style={styles.burstZone} pointerEvents="none">
            {bursts.map(b => (
              <GiftBurst key={b.id} burst={b} onDone={removeBurst} />
            ))}
          </View>

          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            style={styles.chatFlatList}
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

  joinToastWrap:{ position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  joinToast:    { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  joinToastText:{ color: '#fff', fontSize: 13 },

  chatArea:     { flex: 1, justifyContent: 'flex-end' },
  burstZone:    { position: 'absolute', top: 0, right: 16, left: 16, zIndex: 10 },
  chatFlatList: { flex: 1 },
  chatList:     { padding: 12, gap: 6 },
  msgRow:       { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', maxWidth: '85%' },
  msgName:      { color: '#6C47FF', fontWeight: '700', fontSize: 13 },
  msgText:      { color: '#fff', fontSize: 13 },
  translated:   { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  reactBar:     { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 8 },
  reactBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  reactEmoji:   { fontSize: 22 },

  inputBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  input:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  sendBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C47FF', alignItems: 'center', justifyContent: 'center' },
  sendIcon:     { color: '#fff', fontSize: 18 },

  // Lobby
  lobbyBack:       { padding: 16 },
  backIcon:        { color: '#fff', fontSize: 24 },
  lobbyContent:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  lobbyAvatarWrap: { position: 'relative', marginBottom: 8 },
  lobbyAvatar:     { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#e53935' },
  lobbyInitial:    { color: '#fff', fontSize: 48, fontWeight: '900' },
  lobbyLivePill:   { position: 'absolute', bottom: -8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  lobbyTitle:      { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  lobbySub:        { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  lobbyInput:      { width: '100%', backgroundColor: '#16181C', color: '#fff', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, borderWidth: 1, borderColor: '#2F3336', marginTop: 8 },
  goLiveBtn:       { width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  goLiveBtnGrad:   { paddingVertical: 18, alignItems: 'center' },
  goLiveBtnText:   { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  lobbyHint:       { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center' },
});
