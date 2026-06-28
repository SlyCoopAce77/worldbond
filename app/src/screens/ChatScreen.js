import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Pressable,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, Image, Modal, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { authHeader } from '../utils/apiUtils';
import axios from 'axios';
import { getSocket, SERVER_URL } from '../services/socket';
import GiftPicker from '../components/GiftPicker';
import GiftIcon from '../components/GiftIcon';
import { WorldMark } from '../components/BondLogo';

const BOND_PINK = '#FF0080';
const BG      = '#000000';
const CARD    = '#1C1F23';
const BORDER  = '#2F3336';
const REACTIONS = ['❤️', '🔥', '😂', '👍', '😮'];

// ── Pulse Drops — rotate daily, deterministic (same day = same pulses worldwide) ──
const ALL_PULSES = [
  // 🌏 Asia
  { region: '🌏', from: 'Asia',     color: '#ff6b6b', q: 'What food from your country would make anyone obsessed after one bite?' },
  { region: '🌏', from: 'Asia',     color: '#ff6b6b', q: 'What\'s a phrase in your language that has no English translation?' },
  { region: '🌏', from: 'Asia',     color: '#ff6b6b', q: 'What\'s the most beautiful place you\'ve seen in your country?' },
  { region: '🌏', from: 'Asia',     color: '#ff6b6b', q: 'What\'s one rule in your culture that outsiders always find surprising?' },
  { region: '🌏', from: 'Asia',     color: '#ff6b6b', q: 'Tea or coffee — and what\'s the ritual around it where you\'re from?' },
  { region: '🌏', from: 'Asia',     color: '#ff6b6b', q: 'What K-drama, anime, or show has the world sleeping on right now?' },
  { region: '🌏', from: 'Asia',     color: '#ff6b6b', q: 'What would a perfect Sunday look like for you?' },
  { region: '🌏', from: 'Asia',     color: '#ff6b6b', q: 'What festival from your culture do you wish the whole world celebrated?' },

  // 🌍 Africa
  { region: '🌍', from: 'Africa',   color: '#ffd93d', q: 'What tradition from your culture do you wish the world knew about?' },
  { region: '🌍', from: 'Africa',   color: '#ffd93d', q: 'What does home smell like to you?' },
  { region: '🌍', from: 'Africa',   color: '#ffd93d', q: 'What\'s the wildest thing your grandmother ever told you?' },
  { region: '🌍', from: 'Africa',   color: '#ffd93d', q: 'Name one African artist, musician, or chef the world needs to discover.' },
  { region: '🌍', from: 'Africa',   color: '#ffd93d', q: 'What\'s a proverb from your culture that you live by?' },
  { region: '🌍', from: 'Africa',   color: '#ffd93d', q: 'What\'s something about your city that tourists always miss?' },
  { region: '🌍', from: 'Africa',   color: '#ffd93d', q: 'If your life had a theme song right now, what would it be?' },
  { region: '🌍', from: 'Africa',   color: '#ffd93d', q: 'What\'s a food from your country that needs its own Netflix documentary?' },

  // 🌎 Americas
  { region: '🌎', from: 'Americas', color: '#6c5ce7', q: 'If you could teleport anywhere on Earth right now, where and why?' },
  { region: '🌎', from: 'Americas', color: '#6c5ce7', q: 'What\'s a road trip route in your country that everyone should do once?' },
  { region: '🌎', from: 'Americas', color: '#6c5ce7', q: 'What\'s the most underrated city in your country?' },
  { region: '🌎', from: 'Americas', color: '#6c5ce7', q: 'Beach, mountains, or city — where do you reset best?' },
  { region: '🌎', from: 'Americas', color: '#6c5ce7', q: 'What\'s a local slang word where you\'re from that I should know?' },
  { region: '🌎', from: 'Americas', color: '#6c5ce7', q: 'What dream are you currently chasing and why?' },
  { region: '🌎', from: 'Americas', color: '#6c5ce7', q: 'Describe your vibe in three songs.' },
  { region: '🌎', from: 'Americas', color: '#6c5ce7', q: 'What\'s one thing about your city that locals are lowkey proud of?' },

  // 🇪🇺 Europe
  { region: '🇪🇺', from: 'Europe',  color: '#00b894', q: 'What\'s the biggest misconception people have about your country?' },
  { region: '🇪🇺', from: 'Europe',  color: '#00b894', q: 'What\'s a European hidden gem that deserves more attention?' },
  { region: '🇪🇺', from: 'Europe',  color: '#00b894', q: 'Coffee shop or park bench — where do you do your best thinking?' },
  { region: '🇪🇺', from: 'Europe',  color: '#00b894', q: 'What book or film changed how you see the world?' },
  { region: '🇪🇺', from: 'Europe',  color: '#00b894', q: 'What\'s something your country does better than anywhere else?' },
  { region: '🇪🇺', from: 'Europe',  color: '#00b894', q: 'Summer in the city or summer in the countryside?' },
  { region: '🇪🇺', from: 'Europe',  color: '#00b894', q: 'What\'s a museum, market, or street that made you feel alive?' },
  { region: '🇪🇺', from: 'Europe',  color: '#00b894', q: 'What would your perfect day in your city look like?' },

  // 🌐 Global
  { region: '🌐', from: 'Worldwide', color: '#a29bfe', q: 'What\'s one thing you\'ve learned about yourself this year?' },
  { region: '🌐', from: 'Worldwide', color: '#a29bfe', q: 'What\'s a skill you\'re secretly working on right now?' },
  { region: '🌐', from: 'Worldwide', color: '#a29bfe', q: 'Would you rather be fluent in every language or able to fly?' },
  { region: '🌐', from: 'Worldwide', color: '#a29bfe', q: 'What\'s the last thing that genuinely surprised you?' },
  { region: '🌐', from: 'Worldwide', color: '#a29bfe', q: 'At what age did you feel like yourself for the first time?' },
  { region: '🌐', from: 'Worldwide', color: '#a29bfe', q: 'If you could have dinner with anyone alive on Earth tonight, who?' },
  { region: '🌐', from: 'Worldwide', color: '#a29bfe', q: 'What\'s something most people misunderstand about you?' },
  { region: '🌐', from: 'Worldwide', color: '#a29bfe', q: 'What\'s a small daily habit that quietly shapes your whole day?' },
];

function getDailyPulses() {
  const now  = new Date();
  const day  = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  // Deterministic shuffle: same day everywhere = same 3 pulses globally
  const pool = ALL_PULSES.map((p, i) => ({ ...p, _i: i }));
  pool.sort((a, b) => {
    const ha = ((day * 2654435761 + a._i * 40503) >>> 0);
    const hb = ((day * 2654435761 + b._i * 40503) >>> 0);
    return ha - hb;
  });
  // Pick one from each of the first 3 distinct regions that appear
  const seen = new Set();
  const picks = [];
  for (const p of pool) {
    if (!seen.has(p.from)) { seen.add(p.from); picks.push(p); }
    if (picks.length === 3) break;
  }
  return picks;
}

const TODAY_PULSES = getDailyPulses();

function todayLabel() {
  return new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
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
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: BOND_PINK, alignItems: 'center', justifyContent: 'center' }}>
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
        <Text style={styles.typingLabel}>{name} is typing</Text>
      </View>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChatScreen({ route, navigation }) {
  const { otherUser, currentUser, matchId, compatibilityScore } = route.params || {};

  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState('');
  const [showGifts,   setShowGifts]   = useState(false);
  const giftAnim                      = useRef(new Animated.Value(0)).current;
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

  const displayName = otherUser?.display_name || otherUser?.username || 'Someone';

  // ── Socket listeners ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!otherUser?.socketId) return;
    socket.emit('get_dm_history', { otherSocketId: otherUser.socketId });

    function onDmHistory(msgs) { setMessages(msgs || []); }
    function onDirectMessage(msg) {
      setMessages(prev => [...prev, msg]);
      setOtherTyping(false);
    }
    function onGiftReceived(giftMsg) {
      setLastGift(giftMsg);
      setMessages(prev => [...prev, giftMsg]);
      triggerGiftAnim();
    }
    function onGiftSent(giftMsg) { setMessages(prev => [...prev, giftMsg]); }
    function onUserTyping({ fromSocketId }) {
      if (fromSocketId === otherUser.socketId) setOtherTyping(true);
    }
    function onUserStoppedTyping({ fromSocketId }) {
      if (fromSocketId === otherUser.socketId) setOtherTyping(false);
    }
    function onUserList(users) {
      setOtherOnline(users.some(u => u.socketId === otherUser.socketId));
    }

    socket.on('dm_history',          onDmHistory);
    socket.on('direct_message',      onDirectMessage);
    socket.on('gift_received',       onGiftReceived);
    socket.on('gift_sent',           onGiftSent);
    socket.on('user_typing',         onUserTyping);
    socket.on('user_stopped_typing', onUserStoppedTyping);
    socket.on('user_list',           onUserList);
    socket.emit('get_users');

    return () => {
      socket.off('dm_history',          onDmHistory);
      socket.off('direct_message',      onDirectMessage);
      socket.off('gift_received',       onGiftReceived);
      socket.off('gift_sent',           onGiftSent);
      socket.off('user_typing',         onUserTyping);
      socket.off('user_stopped_typing', onUserStoppedTyping);
      socket.off('user_list',           onUserList);
      clearTimeout(typingTimer.current);
    };
  }, [otherUser?.socketId]);

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
        headers: { ...headers }, timeout: 30000,
      });
      socket.emit('direct_message', {
        toSocketId: otherUser.socketId,
        text:     'Photo',
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
    socket.emit('call_user', { toSocketId: otherUser.socketId, callType });
    navigation.navigate('Call', {
      mode: 'outgoing',
      toSocketId: otherUser.socketId,
      toName:     displayName,
      callType,
    });
  }

  function reportUser() {
    Alert.alert(
      `Report ${displayName}`,
      'Why are you reporting this user?',
      [
        { text: 'Spam',                 onPress: () => confirmReport('spam') },
        { text: 'Harassment',           onPress: () => confirmReport('harassment') },
        { text: 'Inappropriate content',onPress: () => confirmReport('inappropriate') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  function confirmReport(reason) {
    Alert.alert('Report Submitted', 'Thank you. Our team will review this report within 24 hours.', [{ text: 'OK' }]);
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
      const gc = item.gift?.color || BOND_PINK;
      return (
        <View style={[styles.giftRow, isMine && { alignSelf: 'flex-end' }]}>
          <LinearGradient
            colors={['rgba(30,5,55,0.97)', 'rgba(8,0,22,0.97)']}
            style={[styles.giftBubble, { borderColor: gc + '55' }]}
          >
            <View style={[styles.giftIconWrap, { backgroundColor: gc + '1a', borderColor: gc + '44' }]}>
              <GiftIcon id={item.gift?.id} color={gc} size={40} />
            </View>
            <Text style={[styles.giftName, { color: gc }]}>{item.gift?.name}</Text>
            {item.gift?.tagline ? (
              <Text style={styles.giftTagline}>{item.gift.tagline}</Text>
            ) : null}
            <View style={[styles.giftCoinRow, { borderColor: gc + '35' }]}>
              <Text style={[styles.giftCoins, { color: gc }]}>
                {item.gift?.coins >= 1000
                  ? `${(item.gift.coins / 1000).toFixed(item.gift.coins % 1000 === 0 ? 0 : 1)}k`
                  : item.gift?.coins} BC
              </Text>
            </View>
            <Text style={styles.giftSender}>
              {isMine ? 'You' : item.senderName} sent this gift
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
            {(item.text && item.text !== 'Photo') && (
              <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{item.text}</Text>
            )}
            {item.wasTranslated && (
              <Text style={styles.translatedTag}>auto-translated</Text>
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
    ? 'Online now'
    : otherUser?.country || '';

  return (
    <SafeAreaView style={styles.container}>

      {/* Gift fly-in overlay — shows the actual GiftIcon, no emoji */}
      {lastGift && (
        <Animated.View
          pointerEvents="none"
          style={[styles.giftOverlay, {
            opacity:   giftAnim,
            transform: [{ scale: giftAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          }]}
        >
          <View style={[styles.giftOverlayCircle, { borderColor: (lastGift.gift?.color || BOND_PINK) + '66', backgroundColor: (lastGift.gift?.color || BOND_PINK) + '18' }]}>
            <GiftIcon id={lastGift.gift?.id} color={lastGift.gift?.color || BOND_PINK} size={72} />
          </View>
          <Text style={[styles.giftOverlayName, { color: lastGift.gift?.color || BOND_PINK }]}>{lastGift.gift?.name}</Text>
        </Animated.View>
      )}

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
          <TouchableOpacity style={styles.hdrBtn} onPress={reportUser}>
            <Text style={styles.hdrBtnTxt}>···</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hdrBtn} onPress={() => startCall('voice')}>
            <Text style={styles.hdrBtnTxt}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hdrBtn} onPress={() => startCall('video')}>
            <Text style={styles.hdrBtnTxt}>Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compatibility banner */}
      {compatibilityScore != null && (
        <LinearGradient colors={[`${BOND_PINK}1a`, 'transparent']} style={styles.compatBanner}>
          <Text style={styles.compatText}>{compatibilityScore}% Bond Match</Text>
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

          {/* ── Pulse Drops ── */}
          <View style={styles.pulseHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseTitle}>Today's Pulse Drops</Text>
            <Text style={styles.pulseDate}>{todayLabel()}</Text>
          </View>
          {TODAY_PULSES.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.pulseCard, { borderLeftColor: p.color }]}
              onPress={() => sendStarter(p.q)}
              activeOpacity={0.78}
            >
              <View style={[styles.pulseAccent, { backgroundColor: p.color }]} />
              <View style={styles.pulseBody}>
                <View style={styles.pulseFromRow}>
                  <Text style={styles.pulseRegion}>{p.region}</Text>
                  <Text style={[styles.pulseFrom, { color: p.color }]}>Pulse from {p.from}</Text>
                </View>
                <Text style={styles.pulseQ}>{p.q}</Text>
              </View>
              <Text style={[styles.pulseArrow, { color: p.color }]}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={flatRef}
          data={displayData}
          keyExtractor={item => String(item.id)}
          renderItem={({ item, index }) => renderMessage({ item, index })}
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
            {uploading
              ? <ActivityIndicator size="small" color={BOND_PINK} />
              : <Text style={styles.inputActionTxt}>+</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={[styles.inputAction, styles.giftInputBtn]} onPress={() => setShowGifts(true)}>
            <WorldMark size={18} color="#FFB700" bondColor="#FFB700" />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={`Message ${displayName}…`}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={1000}
          />
          {text.trim() && (
            <TouchableOpacity onPress={sendMessage} activeOpacity={0.85}>
              <LinearGradient colors={[BOND_PINK, '#CC0060']} style={styles.sendBtn}>
                <Text style={styles.sendIcon}>›</Text>
              </LinearGradient>
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
              onPress={() => { setContextMsg(null); confirmReport('message'); }}
            >
              <Text style={[styles.contextActionIcon, { color: '#e53935', fontWeight: '800' }]}>!</Text>
              <Text style={[styles.contextActionText, { color: '#e53935' }]}>Report Message</Text>
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
    gap: 14,
  },
  giftOverlayCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  giftOverlayName:   { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1C1F23',
    gap: 10,
  },
  backBtn:    { padding: 4 },
  backArrow:  { color: BOND_PINK, fontSize: 24 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#4caf50', borderWidth: 2, borderColor: BG,
  },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerSub:  { color: '#888', fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  hdrBtn:    { backgroundColor: CARD, borderRadius: 10, paddingHorizontal: 10, height: 34, alignItems: 'center', justifyContent: 'center', minWidth: 38 },
  hdrBtnTxt: { color: '#ccc', fontSize: 12, fontWeight: '700' },

  // Compatibility banner
  compatBanner: { paddingHorizontal: 16, paddingVertical: 7, alignItems: 'center' },
  compatText:   { color: BOND_PINK, fontSize: 12, fontWeight: '700' },

  // Messages
  msgList: { padding: 14, paddingBottom: 8, gap: 6 },

  dateSep: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 12, gap: 8,
  },
  dateSepLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dateSepText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  msgRowMine: { justifyContent: 'flex-end' },
  avatarWrap: { marginRight: 6, marginBottom: 2 },

  replyPreview: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: -4, borderLeftWidth: 3,
  },
  replyPreviewMine:  { backgroundColor: `${BOND_PINK}33`, borderLeftColor: BOND_PINK, alignSelf: 'flex-end' },
  replyPreviewOther: { backgroundColor: '#252540',      borderLeftColor: '#888'  },
  replyPreviewName:  { color: BOND_PINK, fontSize: 10, fontWeight: '700', marginBottom: 2 },
  replyPreviewText:  { color: '#999', fontSize: 11 },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, gap: 2 },
  bubbleMine:  { backgroundColor: BOND_PINK, borderBottomRightRadius: 4 },
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

  // Gift bubble
  giftRow:     { alignSelf: 'flex-start', marginVertical: 6, maxWidth: '72%' },
  giftBubble:  { borderRadius: 22, padding: 18, alignItems: 'center', gap: 9, borderWidth: 1.5 },
  giftIconWrap:{ width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  giftName:    { fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: -0.2 },
  giftTagline: { color: 'rgba(255,255,255,0.38)', fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
  giftCoinRow: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 },
  giftCoins:   { fontSize: 14, fontWeight: '800' },
  giftSender:  { color: 'rgba(255,255,255,0.38)', fontSize: 11 },
  giftTime:    { color: 'rgba(255,255,255,0.22)', fontSize: 10 },

  // Typing
  typingRow:   { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, paddingHorizontal: 14 },
  typingBubble: {
    backgroundColor: CARD, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  typingDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  typingLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 4 },

  // Empty state
  emptyState: { alignItems: 'center', padding: 28, paddingTop: 40, gap: 8 },
  emptyOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#4caf50', borderWidth: 2.5, borderColor: BG,
  },
  emptyName:     { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  emptyHint:     { color: '#888', fontSize: 13, marginBottom: 8 },
  // Pulse Drops
  pulseHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 18, marginBottom: 10, alignSelf: 'flex-start' },
  pulseDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: BOND_PINK },
  pulseTitle:   { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  pulseDate:    { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '600', marginLeft: 'auto' },
  pulseCard:    { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER, borderLeftWidth: 0, marginBottom: 8 },
  pulseAccent:  { width: 3, alignSelf: 'stretch' },
  pulseBody:    { flex: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 5 },
  pulseFromRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseRegion:  { fontSize: 13 },
  pulseFrom:    { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  pulseQ:       { color: '#ddd', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  pulseArrow:   { fontSize: 18, fontWeight: '700', paddingRight: 14 },

  // Reply bar
  replyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#16162a', paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  replyBarAccent: { width: 3, height: '100%', backgroundColor: BOND_PINK, borderRadius: 2 },
  replyBarName:   { color: BOND_PINK, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  replyBarPreview:{ color: '#888', fontSize: 12 },
  replyBarClose:  { color: 'rgba(255,255,255,0.4)', fontSize: 16, paddingHorizontal: 4 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, gap: 8,
    borderTopWidth: 1, borderTopColor: '#1C1F23',
    backgroundColor: BG,
  },
  inputAction: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: CARD,
    alignItems: 'center', justifyContent: 'center',
  },
  giftInputBtn:   { backgroundColor: 'rgba(255,183,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,183,0,0.25)' },
  inputActionTxt: { color: '#aaa', fontSize: 22, fontWeight: '300', lineHeight: 26 },
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
