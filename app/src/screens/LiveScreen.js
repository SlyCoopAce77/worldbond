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
import FloatingReaction from '../components/FloatingReaction';
import GiftBurst from '../components/GiftBurst';
import WorldDrop, { isLegendGift } from '../components/WorldDrop';

const { width, height } = Dimensions.get('window');
const BOND_PINK = '#FF0080';
const REACTIONS = ['❤️', '🔥', '😂', '👍', '😮'];

export default function LiveScreen({ route, navigation }) {
  const { user, currentUser, preTitle } = route.params || {};
  const activeUser = user || currentUser;
  const socket = getSocket();
  const { earnCoins } = useWallet();

  const [phase,        setPhase]        = useState('lobby');
  const [title,        setTitle]        = useState(preTitle || '');
  const [streamId,     setStreamId]     = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState('');
  const [viewerCount,  setViewerCount]  = useState(0);
  const [floats,       setFloats]       = useState([]);
  const [bursts,       setBursts]       = useState([]);
  const [drops,        setDrops]        = useState([]);
  const [elapsed,      setElapsed]      = useState(0);
  const [viewerJoined, setViewerJoined] = useState(null);
  const [starting,     setStarting]     = useState(false);

  const flatRef       = useRef(null);
  const timerRef      = useRef(null);
  const isLiveRef     = useRef(false);
  const joinFadeAnim  = useRef(new Animated.Value(0)).current;
  const startTimeoutRef = useRef(null);

  useEffect(() => {
    if (phase !== 'live') return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => () => clearTimeout(startTimeoutRef.current), []);

  function startLive() {
    setStarting(true);
    const liveTitle = title.trim() || `${activeUser?.username}'s Live`;
    socket.emit('go_live', { title: liveTitle });

    // The server responds almost instantly once connected — if we don't hear
    // back in a reasonable window, the socket is likely stuck reconnecting.
    // Without this, "Starting…" could otherwise hang forever with no feedback.
    clearTimeout(startTimeoutRef.current);
    startTimeoutRef.current = setTimeout(() => {
      setStarting(false);
      Alert.alert(
        'Could not go live',
        'Check your connection and try again.',
      );
    }, 8000);
  }

  useEffect(() => {
    function onLiveStarted({ streamId: sid }) {
      clearTimeout(startTimeoutRef.current);
      setStarting(false);
      isLiveRef.current = true;
      setStreamId(sid);
      setPhase('live');
    }
    function onViewerCount({ count }) { setViewerCount(count); }
    function onViewerJoined({ viewerName, count }) {
      setViewerCount(count);
      setViewerJoined(`${viewerName} joined`);
      joinFadeAnim.setValue(1);
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(joinFadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => setViewerJoined(null));
    }
    function onMessage(msg) {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    }
    function onReaction({ emoji }) {
      const id = `${Date.now()}-${Math.random()}`;
      setFloats(prev => [...prev, { emoji, id }]);
    }
    function onGiftReceived({ senderName, senderCountry, gift, isStampHolder }) {
      const id = `${Date.now()}-${Math.random()}`;
      if (isLegendGift(gift.id)) {
        setDrops(prev => [...prev, { id, senderName, senderCountry, gift, isStampHolder }]);
      } else {
        setBursts(prev => [...prev, { id, senderName, senderCountry, gift }]);
      }
      earnCoins(gift.coins, 'live_gift', { giftId: gift.id, senderName });
    }
    function onLiveEnded() {
      if (isLiveRef.current) navigation.goBack();
    }
    function onGoLiveError() {
      clearTimeout(startTimeoutRef.current);
      setStarting(false);
      Alert.alert('Could not go live', 'Reconnecting… please try again in a moment.');
    }

    socket.on('live_started',       onLiveStarted);
    socket.on('live_viewer_count',  onViewerCount);
    socket.on('live_viewer_joined', onViewerJoined);
    socket.on('live_message',       onMessage);
    socket.on('live_reaction',      onReaction);
    socket.on('live_gift_received', onGiftReceived);
    socket.on('live_ended',         onLiveEnded);
    socket.on('go_live_error',      onGoLiveError);

    return () => {
      socket.off('live_started',       onLiveStarted);
      socket.off('live_viewer_count',  onViewerCount);
      socket.off('live_viewer_joined', onViewerJoined);
      socket.off('live_message',       onMessage);
      socket.off('live_reaction',      onReaction);
      socket.off('live_gift_received', onGiftReceived);
      socket.off('live_ended',         onLiveEnded);
      socket.off('go_live_error',      onGoLiveError);
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

  function removeFloat(id) { setFloats(prev => prev.filter(f => f.id !== id)); }
  function removeBurst(id) { setBursts(prev => prev.filter(b => b.id !== id)); }
  function removeDrop(id)  { setDrops(prev =>  prev.filter(d => d.id !== id)); }

  const avatarColor = stringToColor(activeUser?.username || '');

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <LinearGradient colors={['#1a0a2e', '#000000']} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity style={styles.lobbyBack} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.lobbyContent}>
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
              returnKeyType="done"
              autoCapitalize="sentences"
              autoFocus
            />

            <TouchableOpacity style={styles.goLiveBtn} onPress={startLive} disabled={starting} activeOpacity={0.85}>
              <LinearGradient colors={[BOND_PINK, '#CC0060']} style={styles.goLiveBtnGrad}>
                <View style={styles.goLiveDot} />
                <Text style={styles.goLiveBtnText}>{starting ? 'Starting…' : 'Go Live'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.lobbyHint}>Your stream will be visible to everyone on WorldBond</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Live ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <LinearGradient colors={['#1a0a2e', '#000000', '#001a0a']} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={styles.centerAvatar}>
        {activeUser?.photo_url ? (
          <Image source={{ uri: activeUser.photo_url }} style={styles.hostPhoto} />
        ) : (
          <LinearGradient colors={[avatarColor, avatarColor + '88']} style={styles.hostAvatarBg}>
            <Text style={styles.hostInitial}>{(activeUser?.username || '?')[0].toUpperCase()}</Text>
          </LinearGradient>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>

      {floats.map(f => (
        <FloatingReaction key={f.id} emoji={f.emoji} id={f.id} onDone={removeFloat} />
      ))}

      {/* Burst zone — absolute, centered on screen above chat */}
      <View style={styles.burstZone} pointerEvents="none">
        {bursts.map(b => (
          <GiftBurst key={b.id} burst={b} onDone={removeBurst} />
        ))}
      </View>

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
              <View style={styles.viewerDot} />
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
            <TouchableOpacity style={styles.endBtn} onPress={endLive}>
              <Text style={styles.endText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewerJoined && (
          <View style={styles.joinToastWrap} pointerEvents="none">
            <Animated.View style={[styles.joinToast, { opacity: joinFadeAnim }]}>
              <Text style={styles.joinToastText}>{viewerJoined}</Text>
            </Animated.View>
          </View>
        )}

        {/* Transparent spacer — host fully visible through here */}
        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* ── Bottom section — chat + controls ── */}
        <View>
          {/* Chat messages — max 34% height so host stays visible above */}
          <View style={styles.chatArea}>
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={m => String(m.id)}
              renderItem={({ item, index }) => {
                const nameColor = stringToColor(item.senderName || '');
                const distFromEnd = messages.length - 1 - index;
                const opacity = distFromEnd <= 2 ? 1 : distFromEnd <= 5 ? 0.72 : 0.44;
                return (
                  <View style={[styles.msgRow, { opacity }]}>
                    <View style={[styles.msgAccent, { backgroundColor: nameColor }]} />
                    <View style={styles.msgBody}>
                      <View style={styles.msgMeta}>
                        {item.senderCountry ? <Text style={styles.msgFlag}>{item.senderCountry}</Text> : null}
                        <Text style={[styles.msgName, { color: nameColor }]}>{item.senderName}</Text>
                      </View>
                      <Text style={styles.msgText}>{item.text}</Text>
                      {item.wasTranslated ? <View style={styles.translatedBadge}><Text style={styles.translatedTxt}>TR</Text></View> : null}
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* ── Reactions bar ── */}
          <View style={styles.reactBar}>
            {REACTIONS.map(e => (
              <TouchableOpacity key={e} style={styles.reactBtn} onPress={() => sendReaction(e)} activeOpacity={0.75}>
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
                  <Text style={styles.sendIcon}>›</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>

      </SafeAreaView>

      {drops.map(d => (
        <WorldDrop key={d.id} drop={d} onDone={removeDrop} />
      ))}
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

  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  liveBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText:     { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  topCenter:    { alignItems: 'center', flex: 1 },
  hostName:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  timer:        { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  topRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewerPill:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  viewerDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  viewerCount:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  endBtn:       { backgroundColor: '#e5393580', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#e53935' },
  endText:      { color: '#fff', fontSize: 13, fontWeight: '800' },

  joinToastWrap: { position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  joinToast:     { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  joinToastText: { color: '#fff', fontSize: 13 },

  chatArea:     { maxHeight: height * 0.34, justifyContent: 'flex-end' },
  burstZone:    { position: 'absolute', top: height * 0.2, left: 0, right: 0, zIndex: 10 },
  chatList:     { padding: 10, gap: 5 },
  msgRow:       { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.48)', borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start', maxWidth: '86%' },
  msgAccent:    { width: 2, opacity: 0.6 },
  msgBody:      { flex: 1, paddingVertical: 9, paddingLeft: 10, paddingRight: 12, gap: 3 },
  msgMeta:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  msgFlag:      { fontSize: 12 },
  msgName:      { fontSize: 12, fontWeight: '800' },
  msgText:      { color: '#fff', fontSize: 14, lineHeight: 20 },
  translatedBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  translatedTxt:   { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  reactBar:     { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 8 },
  reactBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  reactEmoji:   { fontSize: 22 },

  inputBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  input:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  sendBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: BOND_PINK, alignItems: 'center', justifyContent: 'center' },
  sendIcon:     { color: '#fff', fontSize: 18 },

  lobbyBack:       { padding: 16 },
  backIcon:        { color: '#fff', fontSize: 24 },
  lobbyContent:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  lobbyAvatarWrap: { position: 'relative', marginBottom: 8 },
  lobbyAvatar:     { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: BOND_PINK },
  lobbyInitial:    { color: '#fff', fontSize: 48, fontWeight: '900' },
  lobbyLivePill:   { position: 'absolute', bottom: -8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  lobbyTitle:      { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  lobbySub:        { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  lobbyInput:      { width: '100%', backgroundColor: '#16181C', color: '#fff', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginTop: 8 },
  goLiveBtn:       { width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  goLiveBtnGrad:   { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  goLiveDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  goLiveBtnText:   { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  lobbyHint:       { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center' },
});
