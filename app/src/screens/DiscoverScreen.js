import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView,
  Platform, Animated, Image, RefreshControl, ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getAccessToken } from '../services/authApi';
import axios from 'axios';
import { getSocket, SERVER_URL } from '../services/socket';
import { usePremium } from '../context/PremiumContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const TABS = [
  { id: 'icebreaker', icon: '💡', label: 'Icebreaker' },
  { id: 'random',     icon: '🌀', label: 'Random'     },
  { id: 'language',   icon: '🗣️', label: 'Language'   },
  { id: 'people',     icon: '👥', label: 'People'     },
];
const TAB_W = width / TABS.length;

const LANG_FLAGS = { en:'🇺🇸', ja:'🇯🇵', es:'🇪🇸', fr:'🇫🇷', de:'🇩🇪', pt:'🇧🇷', zh:'🇨🇳', ko:'🇰🇷', ar:'🇸🇦', hi:'🇮🇳', th:'🇹🇭', ru:'🇷🇺' };
const LANG_NAMES = { en:'English', ja:'Japanese', es:'Spanish', fr:'French', de:'German', pt:'Portuguese', zh:'Chinese', ko:'Korean', ar:'Arabic', hi:'Hindi', th:'Thai', ru:'Russian' };

const CT_META = {
  dating:           { emoji:'❤️',  label:'Dating',    color:'#e91e63' },
  friendship:       { emoji:'🤝',  label:'Friends',   color:'#2196f3' },
  travel:           { emoji:'✈️',  label:'Travel',    color:'#ff9800' },
  language:         { emoji:'🗣️', label:'Language',  color:'#26c6da' },
  mentorship:       { emoji:'🎓',  label:'Mentorship',color:'#57f287' },
};

async function authHeader() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function stringToColor(str = '') {
  const p = ['#e57373','#ba68c8','#4fc3f7','#81c784','#ffb74d','#f06292','#4db6ac','#7986cb'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ photo_url, name, size = 44 }) {
  const color = stringToColor(name || '');
  if (photo_url) return <Image source={{ uri: photo_url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: size * 0.42 }}>{(name || '?')[0].toUpperCase()}</Text>
    </View>
  );
}

// ─── Icebreaker tab ───────────────────────────────────────────────────────────
function IcebreakerTab({ user }) {
  const { tierInfo, isPremium } = usePremium();
  const [question,  setQuestion]  = useState('');
  const [responses, setResponses] = useState([]);
  const [myAnswer,  setMyAnswer]  = useState('');
  const [submitted, setSubmitted] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    if (socket.connected) socket.emit('get_icebreaker');
    else socket.once('connect', () => socket.emit('get_icebreaker'));
    socket.on('icebreaker_data', ({ question: q, responses: r }) => { setQuestion(q); setResponses(r); });
    socket.on('icebreaker_responses', ({ responses: r }) => setResponses(r));
    return () => { socket.off('icebreaker_data'); socket.off('icebreaker_responses'); };
  }, []);

  function submit() {
    if (!myAnswer.trim()) return;
    socket.emit('submit_icebreaker', { text: myAnswer.trim() });
    setSubmitted(true);
  }

  const visible = isPremium ? responses : responses.slice(0, tierInfo?.icebreakerResponses ?? 3);

  return (
    <ScrollView contentContainerStyle={tab.scroll} showsVerticalScrollIndicator={false}>
      {/* Question card */}
      <LinearGradient colors={['#16181C', '#000000']} style={tab.questionCard}>
        <View style={tab.questionTop}>
          <View style={tab.questionBadge}>
            <View style={tab.questionDot} />
            <Text style={tab.questionBadgeText}>Today's Question</Text>
          </View>
          <Text style={tab.responseCount}>{responses.length} answered 🌍</Text>
        </View>
        <Text style={tab.questionText}>"{question || 'Loading today\'s question…'}"</Text>
      </LinearGradient>

      {/* Answer box */}
      {!submitted ? (
        <View style={tab.answerWrap}>
          <TextInput
            style={tab.answerInput}
            placeholder="Share your honest answer with people worldwide…"
            placeholderTextColor="#444"
            value={myAnswer}
            onChangeText={setMyAnswer}
            multiline
            maxLength={200}
          />
          <View style={tab.answerFooter}>
            <Text style={tab.charCount}>{myAnswer.length}/200</Text>
            <TouchableOpacity
              style={[tab.submitBtn, !myAnswer.trim() && { opacity: 0.4 }]}
              onPress={submit}
              disabled={!myAnswer.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#E8003D', '#C7003A']} style={tab.submitGrad}>
                <Text style={tab.submitText}>Share with the World 🌍</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={tab.submitted}>
          <Text style={{ fontSize: 20 }}>✅</Text>
          <Text style={tab.submittedText}>Your answer is live! See what others said below.</Text>
        </View>
      )}

      {/* Responses */}
      {visible.length > 0 && (
        <View style={tab.responsesWrap}>
          <Text style={tab.responsesLabel}>What people said</Text>
          {visible.map((r, i) => (
            <Animated.View key={r.id} style={tab.responseCard}>
              <View style={tab.responseTop}>
                <Text style={{ fontSize: 20 }}>{r.country?.split(' ')[0] || '🌍'}</Text>
                <Text style={tab.responseName}>{r.username}</Text>
                <Text style={tab.responseCountry}>{r.country?.split(' ').slice(1).join(' ')}</Text>
              </View>
              <Text style={tab.responseText}>{r.text}</Text>
            </Animated.View>
          ))}
        </View>
      )}

      {!isPremium && responses.length > (tierInfo?.icebreakerResponses ?? 3) && (
        <View style={tab.lockedMore}>
          <Text style={tab.lockedText}>🔒  +{responses.length - (tierInfo?.icebreakerResponses ?? 3)} more responses</Text>
          <Text style={tab.lockedSub}>Upgrade to Bond Plus to read all answers</Text>
        </View>
      )}
    </ScrollView>
  );
}
const tab = StyleSheet.create({
  scroll:          { padding: 20, gap: 16, paddingBottom: 50 },
  questionCard:    { borderRadius: 22, padding: 22, gap: 14, borderWidth: 1, borderColor: '#E8003D30' },
  questionTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  questionDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E8003D' },
  questionBadgeText:{ color: '#E8003D', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  responseCount:   { color: '#555', fontSize: 12 },
  questionText:    { color: '#fff', fontSize: 18, lineHeight: 28, fontStyle: 'italic', fontWeight: '500' },
  answerWrap:      { gap: 10 },
  answerInput:     { backgroundColor: '#16181C', color: '#fff', borderRadius: 16, padding: 16, fontSize: 14, minHeight: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2F3336', lineHeight: 22 },
  answerFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  charCount:       { color: '#444', fontSize: 11 },
  submitBtn:       { borderRadius: 14, overflow: 'hidden' },
  submitGrad:      { paddingHorizontal: 20, paddingVertical: 12 },
  submitText:      { color: '#fff', fontSize: 14, fontWeight: '800' },
  submitted:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#57f28715', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#57f28730' },
  submittedText:   { color: '#57f287', fontSize: 13, fontWeight: '600', flex: 1 },
  responsesWrap:   { gap: 10 },
  responsesLabel:  { color: '#444', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  responseCard:    { backgroundColor: '#16181C', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#2F3336', gap: 8 },
  responseTop:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  responseName:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  responseCountry: { color: '#555', fontSize: 11 },
  responseText:    { color: '#bbb', fontSize: 14, lineHeight: 21 },
  lockedMore:      { backgroundColor: '#E8003D10', borderRadius: 18, padding: 18, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E8003D30', borderStyle: 'dashed' },
  lockedText:      { color: '#E8003D', fontSize: 14, fontWeight: '800' },
  lockedSub:       { color: '#E8003D88', fontSize: 12 },
});

// ─── Random connect tab ───────────────────────────────────────────────────────
function RandomTab({ user, navigation }) {
  const [state,       setState]       = useState('idle');
  const [matchedUser, setMatchedUser] = useState(null);
  const [roomKey,     setRoomKey]     = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState('');
  const flatRef   = useRef(null);
  const socket    = getSocket();
  const ring1     = useRef(new Animated.Value(1)).current;
  const ring2     = useRef(new Animated.Value(1)).current;
  const ring3     = useRef(new Animated.Value(1)).current;
  const op1       = useRef(new Animated.Value(0.5)).current;
  const op2       = useRef(new Animated.Value(0.35)).current;
  const op3       = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    socket.on('random_match',     ({ matchedUser: mu, roomKey: rk }) => {
      setMatchedUser(mu); setRoomKey(rk); setState('connected'); setMessages([]);
    });
    socket.on('random_waiting',   () => setState('waiting'));
    socket.on('random_cancelled', () => setState('idle'));
    socket.on('random_timeout',   () => setState('timeout'));
    socket.on('random_message',   msg => setMessages(prev => [...prev, msg]));
    return () => {
      socket.off('random_match'); socket.off('random_waiting');
      socket.off('random_cancelled'); socket.off('random_timeout');
      socket.off('random_message');
    };
  }, []);

  useEffect(() => {
    if (state !== 'waiting') { [ring1,ring2,ring3].forEach(r => r.setValue(1)); return; }
    const anims = [ring1,ring2,ring3].map((r, i) =>
      Animated.loop(Animated.parallel([
        Animated.sequence([
          Animated.delay(i * 500),
          Animated.timing(r, { toValue: 2.4, duration: 1800, useNativeDriver: true }),
          Animated.timing(r, { toValue: 1,   duration: 0,    useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(i * 500),
          Animated.timing([op1,op2,op3][i], { toValue: 0, duration: 1800, useNativeDriver: true }),
          Animated.timing([op1,op2,op3][i], { toValue: [0.5,0.35,0.2][i], duration: 0, useNativeDriver: true }),
        ]),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [state]);

  useEffect(() => {
    if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  function connect()    { setState('waiting'); socket.emit('join_random_connect'); }
  function disconnect() {
    socket.emit('leave_random_connect');
    setState('idle'); setMatchedUser(null); setRoomKey(null); setMessages([]);
  }
  function sendMsg() {
    if (!text.trim() || !roomKey) return;
    socket.emit('random_message', { roomKey, text: text.trim() });
    setText('');
  }

  // Connected: full chat
  if (state === 'connected' && matchedUser) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#000000', '#000000']} style={rc.connHeader}>
          <View style={rc.connAvatar}>
            <Avatar photo_url={matchedUser.photo_url} name={matchedUser.display_name || matchedUser.username} size={44} />
            <View style={rc.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rc.connName}>{matchedUser.display_name || matchedUser.username}</Text>
            <Text style={rc.connCountry}>{matchedUser.country} · Random Connect 🌀</Text>
          </View>
          <TouchableOpacity style={rc.endBtn} onPress={disconnect}>
            <Text style={rc.endText}>End</Text>
          </TouchableOpacity>
        </LinearGradient>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={
            <View style={rc.emptyChat}>
              <Text style={{ fontSize: 36 }}>👋</Text>
              <Text style={rc.emptyChatText}>Say hello to someone from {matchedUser.country}!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === socket.id;
            return (
              <View style={[rc.msgRow, isMine && rc.msgRowMine]}>
                <View style={[rc.bubble, isMine ? rc.bubbleMine : rc.bubbleOther]}>
                  <Text style={rc.msgText}>{item.text}</Text>
                  {item.wasTranslated && <Text style={rc.translated}>🌐 translated</Text>}
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={rc.inputRow}>
            <TextInput
              style={rc.input}
              placeholder="Say something…"
              placeholderTextColor="#444"
              value={text}
              onChangeText={setText}
              returnKeyType="send"
              onSubmitEditing={sendMsg}
            />
            <TouchableOpacity
              style={[rc.sendBtn, { backgroundColor: text.trim() ? '#4caf50' : '#2F3336' }]}
              onPress={sendMsg}
              disabled={!text.trim()}
            >
              <Text style={rc.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={rc.scroll} showsVerticalScrollIndicator={false}>
      {/* Orb */}
      <View style={rc.orbWrap}>
        {state === 'waiting' && (
          <>
            {[ring1, ring2, ring3].map((r, i) => (
              <Animated.View key={i} style={[rc.ring, { transform: [{ scale: r }], opacity: [op1,op2,op3][i] }]} />
            ))}
          </>
        )}
        <LinearGradient
          colors={state === 'waiting' ? ['#1a3a1a', '#000000'] : state === 'timeout' ? ['#3a1a1a', '#000000'] : ['#16181C', '#000000']}
          style={rc.orb}
        >
          <Text style={{ fontSize: 52 }}>{state === 'waiting' ? '🔍' : state === 'timeout' ? '😔' : '🌀'}</Text>
        </LinearGradient>
      </View>

      <Text style={rc.title}>
        {state === 'waiting' ? 'Finding someone for you…' : state === 'timeout' ? 'No one available right now' : 'Random World Connect'}
      </Text>
      <Text style={rc.sub}>
        {state === 'waiting'
          ? 'Matching you with someone from a different country 🌍'
          : state === 'timeout'
          ? 'Nobody from another country is online right now. Try again in a moment!'
          : 'Meet a stranger from anywhere on Earth. Messages auto-translate in real time.'}
      </Text>

      {state === 'waiting' ? (
        <TouchableOpacity style={rc.cancelBtn} onPress={disconnect}>
          <Text style={rc.cancelText}>Cancel</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={connect} activeOpacity={0.85} style={rc.connectWrap}>
          <LinearGradient colors={['#E8003D', '#E8003D']} style={rc.connectBtn}>
            <Text style={rc.connectText}>{state === 'timeout' ? '🔄  Try Again' : '🌀  Connect with a Stranger'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {state === 'idle' && <Text style={rc.hint}>Average wait: under 10 seconds</Text>}
      {state === 'timeout' && <Text style={rc.hint}>Searched for 30 seconds — no match found</Text>}

      {/* Stats */}
      <View style={rc.statsRow}>
        {[
          { emoji: '🌍', label: 'Countries', value: '195' },
          { emoji: '⚡', label: 'Avg Wait',  value: '<10s' },
          { emoji: '🌐', label: 'Translated',value: 'Auto' },
        ].map(s => (
          <View key={s.label} style={rc.statCard}>
            <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
            <Text style={rc.statVal}>{s.value}</Text>
            <Text style={rc.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
const rc = StyleSheet.create({
  scroll:       { padding: 24, alignItems: 'center', gap: 18, paddingBottom: 50 },
  orbWrap:      { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ring:         { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1.5, borderColor: '#57f28755' },
  orb:          { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  title:        { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.3 },
  sub:          { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  connectWrap:  { borderRadius: 18, overflow: 'hidden', width: '100%' },
  connectBtn:   { paddingVertical: 16, alignItems: 'center' },
  connectText:  { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn:    { backgroundColor: '#16181C', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 40, borderWidth: 1, borderColor: '#2F3336' },
  cancelText:   { color: '#aaa', fontSize: 15, fontWeight: '700' },
  hint:         { color: '#444', fontSize: 12 },
  statsRow:     { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  statCard:     { flex: 1, backgroundColor: '#16181C', borderRadius: 18, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2F3336' },
  statVal:      { color: '#fff', fontSize: 16, fontWeight: '900' },
  statLbl:      { color: '#444', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  connHeader:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#2F3336' },
  connAvatar:   { position: 'relative' },
  onlineDot:    { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#57f287', borderWidth: 2, borderColor: '#000000' },
  connName:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  connCountry:  { color: '#555', fontSize: 12, marginTop: 2 },
  endBtn:       { backgroundColor: '#e5393522', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#e5393540' },
  endText:      { color: '#e53935', fontSize: 13, fontWeight: '800' },
  emptyChat:    { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyChatText:{ color: '#555', fontSize: 14, textAlign: 'center' },
  msgRow:       { flexDirection: 'row' },
  msgRowMine:   { justifyContent: 'flex-end' },
  bubble:       { maxWidth: width * 0.72, borderRadius: 18, padding: 12 },
  bubbleMine:   { backgroundColor: '#E8003D', borderBottomRightRadius: 4 },
  bubbleOther:  { backgroundColor: '#16181C', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#2F3336' },
  msgText:      { color: '#fff', fontSize: 14, lineHeight: 20 },
  translated:   { color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 2 },
  inputRow:     { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#2F3336', gap: 10, alignItems: 'flex-end' },
  input:        { flex: 1, backgroundColor: '#16181C', color: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#2F3336' },
  sendBtn:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon:     { color: '#fff', fontSize: 18 },
});

// ─── Language exchange tab ────────────────────────────────────────────────────
function LanguageTab({ user, navigation }) {
  const { isPremium } = usePremium();
  const [partners, setPartners] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [online,   setOnline]   = useState({});
  const socket = getSocket();

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeader();
      const { data } = await axios.get(`${SERVER_URL}/api/profiles`, { headers, params: { limit: 30 }, timeout: 8000 });
      const profiles = (data.profiles || data || []).filter(
        p => p.language && p.language !== (user.language || user.lang)
      );
      setPartners(profiles);
    } catch {
      socket.emit('get_users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
    socket.on('user_list', users => {
      const map = {};
      users.forEach(u => { if (u.userId) map[u.userId] = true; });
      setOnline(map);
    });
    if (socket.connected) socket.emit('get_users');
    else socket.once('connect', () => socket.emit('get_users'));
    return () => socket.off('user_list');
  }, []);

  const myLang = user.language || user.lang || 'en';
  const myFlag = LANG_FLAGS[myLang] || '🌐';
  const myName = LANG_NAMES[myLang] || myLang.toUpperCase();

  return (
    <ScrollView contentContainerStyle={lx.scroll} showsVerticalScrollIndicator={false}>
      {/* Your language */}
      <LinearGradient colors={['#16181C', '#000000']} style={lx.myBadge}>
        <Text style={{ fontSize: 36 }}>{myFlag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={lx.myTitle}>You speak {myName}</Text>
          <Text style={lx.mySub}>Find partners who can teach you a new language 🌍</Text>
        </View>
      </LinearGradient>

      {!isPremium && (
        <View style={lx.proGate}>
          <Text style={{ fontSize: 20 }}>🌟</Text>
          <Text style={lx.proText}>Upgrade to Bond Plus for unlimited language matching</Text>
        </View>
      )}

      <Text style={lx.sectionLabel}>Available Partners</Text>

      {loading ? (
        <View style={lx.loading}>
          <ActivityIndicator color="#E8003D" />
          <Text style={lx.loadingText}>Finding language partners…</Text>
        </View>
      ) : partners.length === 0 ? (
        <View style={lx.loading}>
          <Text style={{ fontSize: 36 }}>🗣️</Text>
          <Text style={lx.emptyTitle}>No partners online right now</Text>
          <Text style={lx.emptyText}>Check back soon — people join from all over the world</Text>
        </View>
      ) : (
        partners.map(p => {
          const theirLang = p.language || 'en';
          const theirFlag = LANG_FLAGS[theirLang] || '🌐';
          const theirName = LANG_NAMES[theirLang] || theirLang.toUpperCase();
          const isOnline  = online[p.user_id];
          return (
            <TouchableOpacity
              key={p.user_id}
              style={lx.card}
              onPress={() => navigation.navigate('Profile', {
                profileUser: { userId: p.user_id, username: p.display_name, photo_url: p.photo_url, country: p.country, language: p.language },
                bondUserId: p.user_id,
              })}
              activeOpacity={0.85}
            >
              <View style={{ position: 'relative' }}>
                <Avatar photo_url={p.photo_url} name={p.display_name} size={50} />
                {isOnline && <View style={lx.onlineDot} />}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={lx.name}>{p.display_name}{p.age ? `, ${p.age}` : ''}</Text>
                <Text style={lx.country}>{p.country}</Text>
              </View>
              <View style={lx.exchangeBadge}>
                <Text style={lx.exchangeFlags}>{myFlag} ↔ {theirFlag}</Text>
                <Text style={lx.exchangeNames}>{myName} / {theirName}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}
const lx = StyleSheet.create({
  scroll:        { padding: 20, gap: 12, paddingBottom: 50 },
  myBadge:       { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#E8003D30' },
  myTitle:       { color: '#fff', fontSize: 16, fontWeight: '800' },
  mySub:         { color: '#ffffff66', fontSize: 12, marginTop: 3, lineHeight: 18 },
  proGate:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f59e0b15', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f59e0b30' },
  proText:       { color: '#f59e0b', fontSize: 13, fontWeight: '600', flex: 1 },
  sectionLabel:  { color: '#444', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  loading:       { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText:   { color: '#555', fontSize: 14 },
  emptyTitle:    { color: '#fff', fontSize: 17, fontWeight: '700' },
  emptyText:     { color: '#555', fontSize: 13, textAlign: 'center' },
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16181C', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#2F3336', gap: 14 },
  onlineDot:     { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#57f287', borderWidth: 2, borderColor: '#000000' },
  name:          { color: '#fff', fontSize: 15, fontWeight: '700' },
  country:       { color: '#555', fontSize: 12 },
  exchangeBadge: { backgroundColor: '#E8003D18', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: '#E8003D35' },
  exchangeFlags: { color: '#E8003D', fontSize: 15, fontWeight: '800' },
  exchangeNames: { color: '#E8003D88', fontSize: 9, fontWeight: '700' },
});

// ─── People tab ───────────────────────────────────────────────────────────────
function PeopleTab({ user, navigation }) {
  const [profiles,   setProfiles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [ctFilter,   setCtFilter]   = useState(null);
  const [online,     setOnline]     = useState({});
  const socket = getSocket();

  const CT_FILTERS = [
    { id: null,               label: 'All',      emoji: '🌍' },
    { id: 'dating',           label: 'Dating',   emoji: '❤️'  },
    { id: 'friendship',       label: 'Friends',  emoji: '🤝'  },
    { id: 'travel',           label: 'Travel',   emoji: '✈️'  },
    { id: 'language',         label: 'Language', emoji: '🗣️' },
    { id: 'mentorship',       label: 'Mentor',   emoji: '🎓'  },
  ];

  const fetchProfiles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const headers = await authHeader();
      const params  = { limit: 30 };
      if (ctFilter) params.connection_type = ctFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await axios.get(`${SERVER_URL}/api/profiles`, { headers, params, timeout: 8000 });
      setProfiles(data.profiles || data || []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [ctFilter, search]);

  useEffect(() => { fetchProfiles(); }, [ctFilter]);

  useEffect(() => {
    socket.on('user_list', users => {
      const map = {};
      users.forEach(u => { if (u.userId) map[u.userId] = true; });
      setOnline(map);
    });
    if (socket.connected) socket.emit('get_users');
    else socket.once('connect', () => socket.emit('get_users'));
    return () => socket.off('user_list');
  }, []);

  function ghostColor(s) {
    if (!s) return '#555';
    if (s >= 4.5) return '#ffd700';
    if (s >= 3.5) return '#57f287';
    if (s >= 2.5) return '#57c4ff';
    return '#fee75c';
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={pe.searchWrap}>
        <Text style={pe.searchIcon}>🔍</Text>
        <TextInput
          style={pe.searchInput}
          placeholder="Search by name or city…"
          placeholderTextColor="#444"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => fetchProfiles()}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchProfiles(); }}>
            <Text style={pe.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CT Filters */}
      <FlatList
        data={CT_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={f => String(f.id)}
        contentContainerStyle={pe.filtersRow}
        renderItem={({ item: f }) => {
          const meta   = f.id ? CT_META[f.id] : null;
          const active = ctFilter === f.id;
          return (
            <TouchableOpacity
              style={[
                pe.chip,
                active && meta  && { backgroundColor: meta.color + '20', borderColor: meta.color + '55' },
                active && !meta && { backgroundColor: '#E8003D20', borderColor: '#E8003D55' },
              ]}
              onPress={() => setCtFilter(f.id)}
            >
              <Text style={{ fontSize: 13 }}>{f.emoji}</Text>
              <Text style={[pe.chipText, active && { color: meta ? meta.color : '#E8003D' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        }}
        style={{ flexGrow: 0, marginBottom: 4 }}
      />

      {loading ? (
        <View style={pe.loading}>
          <ActivityIndicator color="#E8003D" />
          <Text style={pe.loadingText}>Loading people…</Text>
        </View>
      ) : profiles.length === 0 ? (
        <View style={pe.loading}>
          <Text style={{ fontSize: 48 }}>🌍</Text>
          <Text style={pe.emptyTitle}>No profiles found</Text>
          <Text style={pe.emptySub}>Try a different filter or check back later</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={p => String(p.user_id)}
          contentContainerStyle={pe.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfiles(true)} tintColor="#E8003D" />}
          renderItem={({ item: p }) => {
            const isOnline = online[p.user_id];
            const cts      = p.connection_types || [];
            return (
              <TouchableOpacity
                style={pe.card}
                onPress={() => navigation.navigate('Profile', {
                  profileUser: { userId: p.user_id, username: p.display_name, photo_url: p.photo_url, country: p.country, language: p.language },
                  bondUserId: p.user_id,
                })}
                activeOpacity={0.85}
              >
                <View style={{ position: 'relative' }}>
                  <Avatar photo_url={p.photo_url} name={p.display_name} size={58} />
                  {isOnline && <View style={pe.onlineDot} />}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={pe.nameRow}>
                    <Text style={pe.name}>{p.display_name}</Text>
                    {p.age ? <Text style={pe.age}>{p.age}</Text> : null}
                    {p.ghost_score != null && (
                      <View style={[pe.ghostPill, { backgroundColor: ghostColor(p.ghost_score) + '20', borderColor: ghostColor(p.ghost_score) + '55' }]}>
                        <Text style={[pe.ghostText, { color: ghostColor(p.ghost_score) }]}>⭐ {Number(p.ghost_score).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={pe.location}>
                    {[LANG_FLAGS[p.language] || '🌐', p.city, p.country].filter(Boolean).join('  ')}
                  </Text>
                  {cts.length > 0 && (
                    <View style={pe.ctRow}>
                      {cts.slice(0, 3).map(ct => {
                        const m = CT_META[ct];
                        if (!m) return null;
                        return (
                          <View key={ct} style={[pe.ctPill, { backgroundColor: m.color + '18', borderColor: m.color + '40' }]}>
                            <Text style={{ fontSize: 10 }}>{m.emoji}</Text>
                            <Text style={[pe.ctText, { color: m.color }]}>{m.label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
                <Text style={pe.arrow}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
const pe = StyleSheet.create({
  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, marginBottom: 8, backgroundColor: '#16181C', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: '#2F3336' },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  searchClear: { color: '#444', fontSize: 15, paddingHorizontal: 4 },
  filtersRow:  { paddingHorizontal: 20, gap: 8 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2F3336' },
  chipText:    { color: '#555', fontSize: 12, fontWeight: '700' },
  loading:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#555', fontSize: 14 },
  emptyTitle:  { color: '#fff', fontSize: 17, fontWeight: '700' },
  emptySub:    { color: '#555', fontSize: 13, textAlign: 'center' },
  list:        { padding: 16, gap: 10, paddingBottom: 60 },
  card:        { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#16181C', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#2F3336' },
  onlineDot:   { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#57f287', borderWidth: 2, borderColor: '#000000' },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:        { color: '#fff', fontSize: 16, fontWeight: '800' },
  age:         { color: '#555', fontSize: 14 },
  ghostPill:   { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  ghostText:   { fontSize: 10, fontWeight: '800' },
  location:    { color: '#555', fontSize: 12 },
  ctRow:       { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  ctPill:      { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
  ctText:      { fontSize: 10, fontWeight: '700' },
  arrow:       { color: '#333', fontSize: 22, fontWeight: '300' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DiscoverScreen({ navigation, user }) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('icebreaker');
  const indicatorX = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  function switchTab(id) {
    const idx = TABS.findIndex(t => t.id === id);
    Animated.spring(indicatorX, { toValue: idx * TAB_W, friction: 8, tension: 60, useNativeDriver: true }).start();
    setActiveTab(id);
  }

  const headerSlide = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerSlide }] }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>New ways to connect with the world</Text>
        </View>
      </Animated.View>

      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.tabItem}
              onPress={() => switchTab(t.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
        <Animated.View style={[styles.tabIndicator, { transform: [{ translateX: indicatorX }], width: TAB_W }]} />
      </View>

      {/* ── Content ── */}
      {activeTab === 'icebreaker' && <IcebreakerTab user={user} />}
      {activeTab === 'random'     && <RandomTab user={user} navigation={navigation} />}
      {activeTab === 'language'   && <LanguageTab user={user} navigation={navigation} />}
      {activeTab === 'people'     && <PeopleTab user={user} navigation={navigation} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#000000' },

  header:        { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  title:         { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle:      { color: '#444', fontSize: 13, marginTop: 3 },

  tabBar:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2F3336', position: 'relative' },
  tabItem:       { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 3 },
  tabIcon:       { fontSize: 18 },
  tabLabel:      { color: '#444', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabLabelActive:{ color: '#E8003D' },
  tabIndicator:  { position: 'absolute', bottom: 0, height: 2, backgroundColor: '#E8003D', borderRadius: 2 },
});
