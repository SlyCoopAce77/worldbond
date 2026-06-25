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
import GiftBurst from '../components/GiftBurst';
import WorldDrop, { isLegendGift } from '../components/WorldDrop';

const { width, height } = Dimensions.get('window');
const BOND_PINK = '#FF0080';
const REACTIONS = ['❤️', '🔥', '😂', '🙌', '😮', '💯'];

export default function LiveWatchScreen({ route, navigation }) {
  const { stream, currentUser } = route.params || {};
  const socket = getSocket();
  const { balance, spendCoins } = useWallet();

  const [messages,    setMessages]    = useState([]);
  const [viewerCount, setViewerCount] = useState(stream?.viewerCount || 0);
  const [floats,      setFloats]      = useState([]);
  const [bursts,      setBursts]      = useState([]);
  const [drops,       setDrops]       = useState([]);
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

    socket.on('live_gift_received', ({ senderName, senderCountry, gift, isStampHolder }) => {
      const id = `${Date.now()}-${Math.random()}`;
      if (isLegendGift(gift.id)) {
        setDrops(prev => [...prev, { id, senderName, senderCountry, gift, isStampHolder }]);
      } else {
        setBursts(prev => [...prev, { id, senderName, senderCountry, gift }]);
      }
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
      gift: { id: gift.id, name: gift.name, coins: gift.coins, color: gift.color, tier: gift.tier, tagline: gift.tagline },
    });
  }

  function removeFloat(id)  { setFloats(prev => prev.filter(f => f.id !== id)); }
  function removeBurst(id)  { setBursts(prev => prev.filter(b => b.id !== id)); }
  function removeDrop(id)   { setDrops(prev =>  prev.filter(d => d.id !== id)); }

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

      {/* Burst zone — absolute, centered on screen above chat */}
      <View style={styles.burstZone} pointerEvents="none">
        {bursts.map(b => (
          <GiftBurst key={b.id} burst={b} onDone={removeBurst} />
        ))}
      </View>

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
                      {item.wasTranslated ? <Text style={styles.translated}>🌐</Text> : null}
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            />
          </View>

          {/* ── Reactions ── */}
          <View style={styles.reactBar}>
            {REACTIONS.map(e => (
              <TouchableOpacity key={e} style={styles.reactBtn} onPress={() => sendReaction(e)}>
                <Text style={styles.reactEmoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Bond Gift strip — unmissable, WorldBond exclusive ── */}
          <TouchableOpacity onPress={() => setGiftOpen(true)} activeOpacity={0.8}>
            <LinearGradient
              colors={['rgba(20,8,46,0.97)', 'rgba(8,3,20,0.97)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.giftStrip}
            >
              <WorldMark size={20} color="#FFB700" bondColor="#FFB700" />
              <View style={styles.giftStripText}>
                <Text style={styles.giftStripLabel}>BOND GIFT</Text>
                <Text style={styles.giftStripSub}>WorldBond exclusive</Text>
              </View>
              <View style={{ flex: 1 }} />
              <View style={styles.giftStripBalance}>
                <View style={styles.giftStripDot} />
                <Text style={styles.giftStripBalanceTxt}>{balance.toLocaleString()} BC</Text>
              </View>
              <Text style={styles.giftStripArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

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
        </View>

      </SafeAreaView>

      <GiftPicker
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        onSend={sendGift}
        hostName={stream?.hostName}
      />

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

  chatArea:     { maxHeight: height * 0.34, justifyContent: 'flex-end' },
  chatList:     { padding: 10, gap: 5 },
  msgRow:       { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.48)', borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start', maxWidth: '86%' },
  msgAccent:    { width: 2, opacity: 0.6 },
  msgBody:      { flex: 1, paddingVertical: 9, paddingLeft: 10, paddingRight: 12, gap: 3 },
  msgMeta:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  msgFlag:      { fontSize: 12 },
  msgName:      { fontSize: 12, fontWeight: '800' },
  msgText:      { color: '#fff', fontSize: 14, lineHeight: 20 },
  translated:   { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
  burstZone:    { position: 'absolute', top: height * 0.2, left: 0, right: 0, zIndex: 10 },

  giftStrip:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 12, borderTopWidth: 1, borderTopColor: '#FFB70022' },
  giftStripText:    { gap: 2 },
  giftStripLabel:   { color: '#FFB700', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  giftStripSub:     { color: 'rgba(255,183,0,0.45)', fontSize: 10, fontWeight: '600' },
  giftStripBalance: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,183,0,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,183,0,0.2)' },
  giftStripDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFB700' },
  giftStripBalanceTxt: { color: '#FFB700', fontSize: 12, fontWeight: '800' },
  giftStripArrow:   { color: 'rgba(255,183,0,0.5)', fontSize: 20, fontWeight: '300' },

  reactBar:     { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 8 },
  reactBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  reactEmoji:   { fontSize: 22 },

  inputBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  input:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  sendBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: BOND_PINK, alignItems: 'center', justifyContent: 'center' },
  sendIcon:     { color: '#fff', fontSize: 18 },

  endedScreen:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  endedTitle:   { color: '#fff', fontSize: 24, fontWeight: '900' },
  endedSub:     { color: '#666', fontSize: 14, marginBottom: 20 },
  endedBtn:     { backgroundColor: BOND_PINK, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  endedBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
