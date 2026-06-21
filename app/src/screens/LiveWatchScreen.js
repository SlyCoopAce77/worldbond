import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, StatusBar, Dimensions, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';
import { stringToColor, formatDuration } from '../utils/apiUtils';
import { useWallet } from '../context/WalletContext';
import { WorldMark } from '../components/BondLogo';
import FloatingReaction from '../components/FloatingReaction';
import GiftPicker from '../components/GiftPicker';
import GiftIcon from '../components/GiftIcon';

const { width, height } = Dimensions.get('window');
const REACTIONS = ['❤️', '🔥', '😂', '🙌', '😮', '💯'];

// ── "Global Drop" gift burst — WorldBond's unique gift animation ──────────────
// Drops from above at orbit scale, WorldMark pulses on landing in the gift's
// tier color, then launches back upward-right like returning to orbit.
function GiftBurst({ burst, onDone }) {
  const dropY      = useRef(new Animated.Value(-90)).current;
  const cardScale  = useRef(new Animated.Value(0.2)).current;
  const markScale  = useRef(new Animated.Value(1)).current;
  const exitX      = useRef(new Animated.Value(0)).current;
  const exitY      = useRef(new Animated.Value(0)).current;
  const exitScale  = useRef(new Animated.Value(1)).current;
  const fade       = useRef(new Animated.Value(1)).current;

  const color = burst.gift.color || '#6C47FF';

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(dropY,     { toValue: 0, friction: 7, tension: 65, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 65, useNativeDriver: true }),
      ]),
      // WorldMark pulses on landing
      Animated.sequence([
        Animated.timing(markScale, { toValue: 1.5, duration: 140, useNativeDriver: true }),
        Animated.spring(markScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      Animated.delay(2600),
      // Returns to orbit — launches upward-right, shrinks to a point
      Animated.parallel([
        Animated.timing(exitX,     { toValue: 60,   duration: 480, useNativeDriver: true }),
        Animated.timing(exitY,     { toValue: -110, duration: 480, useNativeDriver: true }),
        Animated.timing(exitScale, { toValue: 0.1,  duration: 480, useNativeDriver: true }),
        Animated.timing(fade,      { toValue: 0,    duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, []);

  return (
    <Animated.View
      style={[
        gb.wrap,
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
      {/* Sender's country flag — "gift arrived from here" */}
      <View style={gb.flagBadge}>
        <Text style={gb.flagText}>{burst.senderCountry || '🌍'}</Text>
      </View>

      <View style={[gb.card, { borderColor: color + '66' }]}>
        <View style={[gb.accentBar, { backgroundColor: color }]} />

        {/* Gift icon in tier color pulsing in the orbit circle */}
        <Animated.View style={[gb.orbitCircle, { backgroundColor: color + '20', borderColor: color + '55' }, { transform: [{ scale: markScale }] }]}>
          <GiftIcon id={burst.gift.id} color={color} size={22} />
        </Animated.View>

        <View style={gb.info}>
          <Text style={gb.senderName} numberOfLines={1}>{burst.senderName}</Text>
          <Text style={gb.giftName}>{burst.gift.name}</Text>
        </View>

        <View style={gb.coinBadge}>
          <WorldMark size={11} color="#FFB700" bondColor="#FFB700" />
          <Text style={gb.coinsNum}>{burst.gift.coins}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
const gb = StyleSheet.create({
  wrap:       { alignSelf: 'flex-start', marginBottom: 6 },
  flagBadge:  { alignSelf: 'flex-start', marginLeft: 44, marginBottom: -8,
                backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
                paddingHorizontal: 6, paddingVertical: 2, zIndex: 2 },
  flagText:   { fontSize: 13 },
  card:       { flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: 'rgba(8,9,16,0.88)',
                borderRadius: 20, borderWidth: 1, overflow: 'hidden',
                paddingVertical: 10, paddingRight: 14 },
  accentBar:  { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  orbitCircle:{ width: 42, height: 42, borderRadius: 21, borderWidth: 1,
                alignItems: 'center', justifyContent: 'center' },
  info:       { flex: 1 },
  senderName: { color: '#fff', fontSize: 12, fontWeight: '900' },
  giftName:   { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },
  coinBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3,
                backgroundColor: '#FFB70018', borderRadius: 10,
                paddingHorizontal: 7, paddingVertical: 4,
                borderWidth: 1, borderColor: '#FFB70033' },
  coinsNum:   { color: '#FFB700', fontSize: 11, fontWeight: '900' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LiveWatchScreen({ route, navigation }) {
  const { stream, currentUser } = route.params || {};
  const socket = getSocket();
  const { balance, spendCoins } = useWallet();

  const [messages,    setMessages]    = useState([]);
  const [viewerCount, setViewerCount] = useState(stream?.viewerCount || 0);
  const [floats,      setFloats]      = useState([]);
  const [bursts,      setBursts]      = useState([]);
  const [text,        setText]        = useState('');
  const [ended,       setEnded]       = useState(false);
  const [giftOpen,    setGiftOpen]    = useState(false);
  const [elapsed,     setElapsed]     = useState(
    stream?.startedAt ? Math.floor((Date.now() - stream.startedAt) / 1000) : 0
  );

  const flatRef  = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (stream?.startedAt || Date.now())) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    socket.emit('join_live', { streamId: stream?.streamId });

    socket.on('live_joined',       ({ messages: history }) => setMessages(history || []));
    socket.on('live_viewer_count', ({ count }) => setViewerCount(count));

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
    });

    socket.on('live_ended', ({ streamId }) => {
      if (streamId === stream?.streamId) setEnded(true);
    });

    return () => {
      socket.emit('leave_live', { streamId: stream?.streamId });
      socket.off('live_joined');
      socket.off('live_viewer_count');
      socket.off('live_message');
      socket.off('live_reaction');
      socket.off('live_gift_received');
      socket.off('live_ended');
    };
  }, []);

  function sendMessage() {
    if (!text.trim()) return;
    socket.emit('live_message', { streamId: stream?.streamId, text: text.trim() });
    setText('');
  }

  function sendReaction(emoji) {
    socket.emit('live_reaction', { streamId: stream?.streamId, emoji });
  }

  function sendGift(gift) {
    if (balance < gift.coins) return;
    spendCoins(gift.coins, 'live_gift', { giftId: gift.id, streamId: stream?.streamId });
    socket.emit('live_gift', {
      streamId: stream?.streamId,
      gift: { id: gift.id, name: gift.name, coins: gift.coins, color: gift.color, tier: gift.tier },
    });
  }

  function removeFloat(id)  { setFloats(prev => prev.filter(f => f.id !== id)); }
  function removeBurst(id)  { setBursts(prev => prev.filter(b => b.id !== id)); }

  const avatarColor = stringToColor(stream?.hostName || '');

  if (ended) {
    return (
      <View style={styles.endedScreen}>
        <LinearGradient colors={['#1a0a2e', '#000000']} style={StyleSheet.absoluteFill} />
        <Text style={{ fontSize: 52, marginBottom: 20 }}>📴</Text>
        <Text style={styles.endedTitle}>Live ended</Text>
        <Text style={styles.endedSub}>{stream?.hostName} ended their stream</Text>
        <TouchableOpacity style={styles.endedBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.endedBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <LinearGradient colors={['#1a0a2e', '#000000', '#001a0a']} style={StyleSheet.absoluteFill} />

      <View style={styles.centerAvatar}>
        {stream?.hostPhoto ? (
          <Image source={{ uri: stream.hostPhoto }} style={styles.hostPhoto} />
        ) : (
          <LinearGradient colors={[avatarColor, avatarColor + '88']} style={styles.hostAvatarBg}>
            <Text style={styles.hostInitial}>{(stream?.hostName || '?')[0].toUpperCase()}</Text>
          </LinearGradient>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>

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
            <Text style={styles.hostName}>{stream?.hostName}</Text>
            <Text style={styles.streamTitle} numberOfLines={1}>{stream?.title}</Text>
          </View>

          <View style={styles.topRight}>
            <View style={styles.viewerPill}>
              <Text style={styles.viewerIcon}>👁</Text>
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
            <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
          </View>
        </View>

        {/* ── Chat + gift bursts ── */}
        <View style={styles.chatArea}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            style={{ flex: 1 }}
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

          {/* Gift bursts — drop from top, return to orbit */}
          <View style={styles.burstZone} pointerEvents="none">
            {bursts.map(b => (
              <GiftBurst key={b.id} burst={b} onDone={removeBurst} />
            ))}
          </View>
        </View>

        {/* ── Reactions ── */}
        <View style={styles.reactBar}>
          {REACTIONS.map(e => (
            <TouchableOpacity key={e} style={styles.reactBtn} onPress={() => sendReaction(e)}>
              <Text style={styles.reactEmoji}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Input + gift button ── */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.giftBtn} onPress={() => setGiftOpen(true)} activeOpacity={0.8}>
              <WorldMark size={22} color="#FFB700" bondColor="#FFB700" />
            </TouchableOpacity>
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

      {/* GiftPicker — full WorldBond catalog with tier filters */}
      <GiftPicker
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        onSend={sendGift}
        hostName={stream?.hostName}
      />
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

  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12, gap: 10 },
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
  msgRowMine:   { borderLeftWidth: 2, borderLeftColor: '#6C47FF' },
  msgName:      { color: '#6C47FF', fontWeight: '700', fontSize: 13 },
  msgText:      { color: '#fff', fontSize: 13 },
  translated:   { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  burstZone:    { position: 'absolute', top: 0, right: 16, left: 16, zIndex: 10 },

  reactBar:     { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 8 },
  reactBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  reactEmoji:   { fontSize: 22 },

  inputBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  giftBtn:      { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,183,0,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFB70035' },
  input:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  sendBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C47FF', alignItems: 'center', justifyContent: 'center' },
  sendIcon:     { color: '#fff', fontSize: 18 },

  endedScreen:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  endedTitle:   { color: '#fff', fontSize: 24, fontWeight: '900' },
  endedSub:     { color: '#666', fontSize: 14, marginBottom: 20 },
  endedBtn:     { backgroundColor: '#6C47FF', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  endedBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
