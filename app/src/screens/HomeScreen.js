import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, FlatList, RefreshControl,
  ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { getAccessToken } from '../services/authApi';
import { SERVER_URL } from '../services/socket';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_W = 160;

const CONNECTION_TYPES = {
  dating:     { emoji: '❤️',  label: 'Dating',           color: '#e91e63' },
  friendship: { emoji: '🤝',  label: 'Friendship',       color: '#2196f3' },
  travel:     { emoji: '✈️',  label: 'Travel Buddy',     color: '#ff9800' },
  language:   { emoji: '💬',  label: 'Language Exchange', color: '#9c27b0' },
  mentorship: { emoji: '🎓',  label: 'Mentorship',       color: '#4caf50' },
};

const CATEGORY_EMOJIS = {
  food: '🍜', travel: '✈️', music: '🎵', sports: '⚽',
  language: '📚', arts: '🎨', outdoors: '🏔️', business: '💼', wellness: '🧘',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function stringToColor(str = '') {
  const palette = ['#e57373', '#ba68c8', '#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#4db6ac', '#7986cb'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function compatColor(score) {
  if (score >= 75) return '#57f287';
  if (score >= 50) return '#fee75c';
  return '#f04747';
}

// ─── Stories strip ────────────────────────────────────────────────────────────
function StoryRing({ user, onPress }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const color = stringToColor(user.username);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity style={story.wrap} onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[story.ring, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['#E8003D', '#57f287']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={story.gradient}
        >
          <View style={[story.avatar, { backgroundColor: color }]}>
            {user.photo_url ? (
              <Image source={{ uri: user.photo_url }} style={story.avatarImg} />
            ) : (
              <Text style={story.avatarText}>{user.username[0]?.toUpperCase()}</Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
      {user.mood ? <Text style={story.mood}>{user.mood}</Text> : null}
      <Text style={story.name} numberOfLines={1}>{user.username.split(' ')[0]}</Text>
      <Text style={story.flag}>{user.country?.split(' ')[0]}</Text>
    </TouchableOpacity>
  );
}
const story = StyleSheet.create({
  wrap:       { alignItems: 'center', gap: 5, width: 68 },
  ring:       { padding: 2.5, borderRadius: 32 },
  gradient:   { padding: 2.5, borderRadius: 30 },
  avatar:     { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#000000' },
  avatarImg:  { width: '100%', height: '100%', borderRadius: 24 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  mood:       { fontSize: 14 },
  name:       { color: '#ddd', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  flag:       { color: '#555', fontSize: 10, textAlign: 'center' },
});

// ─── Match card ───────────────────────────────────────────────────────────────
function MatchCard({ match, onPress, index }) {
  const score   = Math.round(match.compatibility_score || 0);
  const color   = compatColor(score);
  const ct      = CONNECTION_TYPES[(match.connection_types || [])[0]] || CONNECTION_TYPES.friendship;
  const name    = match.display_name || 'Someone';
  const avatarC = stringToColor(name);

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={mc.card} onPress={onPress} activeOpacity={0.88}>
        {/* Photo */}
        {match.photo_url ? (
          <Image source={{ uri: match.photo_url }} style={mc.photo} />
        ) : (
          <LinearGradient colors={[avatarC, avatarC + '88']} style={mc.photo}>
            <Text style={mc.initials}>{name[0]?.toUpperCase()}</Text>
          </LinearGradient>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'transparent', '#000000cc']}
          style={mc.overlay}
        />

        {/* Score badge */}
        <View style={[mc.scoreBadge, { borderColor: color + '88', backgroundColor: '#000000aa' }]}>
          <Text style={[mc.scoreText, { color }]}>{score}%</Text>
        </View>

        {/* Connection type chip */}
        <View style={[mc.ctChip, { backgroundColor: ct.color + 'cc' }]}>
          <Text style={mc.ctEmoji}>{ct.emoji}</Text>
        </View>

        {/* Bottom info */}
        <View style={mc.info}>
          <Text style={mc.name} numberOfLines={1}>{name}{match.age ? `, ${match.age}` : ''}</Text>
          <Text style={mc.location} numberOfLines={1}>
            {[match.city, match.country].filter(Boolean).join(', ')}
          </Text>
          {match.voice_note_url && (
            <View style={mc.voiceRow}>
              <Text style={{ fontSize: 10 }}>🎙</Text>
              <Text style={mc.voiceText}>Voice note</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const mc = StyleSheet.create({
  card:       { width: CARD_W, height: 230, borderRadius: 22, overflow: 'hidden', marginRight: 12, backgroundColor: '#1C1F23' },
  photo:      { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  initials:   { color: '#fff', fontSize: 52, fontWeight: '800', opacity: 0.8 },
  overlay:    { position: 'absolute', width: '100%', height: '100%' },
  scoreBadge: { position: 'absolute', top: 10, left: 10, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  scoreText:  { fontSize: 12, fontWeight: '800' },
  ctChip:     { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ctEmoji:    { fontSize: 14 },
  info:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, gap: 2 },
  name:       { color: '#fff', fontSize: 15, fontWeight: '800' },
  location:   { color: '#ffffff99', fontSize: 11 },
  voiceRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  voiceText:  { color: '#ffffff88', fontSize: 10 },
});

// ─── Icebreaker card ──────────────────────────────────────────────────────────
function IcebreakerCard({ question, responseCount, onAnswer }) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <LinearGradient colors={['#1C1F23', '#16181C']} style={ib.card}>
        <View style={ib.topRow}>
          <View style={ib.labelBadge}>
            <Text style={ib.labelText}>💡 Daily Icebreaker</Text>
          </View>
          <View style={ib.countBadge}>
            <View style={ib.countDot} />
            <Text style={ib.countText}>{responseCount} answered</Text>
          </View>
        </View>
        <Text style={ib.question}>"{question}"</Text>
        <TouchableOpacity style={ib.btn} onPress={onAnswer} activeOpacity={0.85}>
          <LinearGradient colors={['#E8003D', '#C7003A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ib.btnGrad}>
            <Text style={ib.btnText}>Share Your Answer  →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}
const ib = StyleSheet.create({
  card:       { borderRadius: 24, padding: 22, gap: 16, borderWidth: 1, borderColor: '#E8003D40' },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelBadge: { backgroundColor: '#E8003D22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#E8003D40' },
  labelText:  { color: '#E8003D', fontSize: 12, fontWeight: '700' },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  countDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#57f287' },
  countText:  { color: '#888', fontSize: 12 },
  question:   { color: '#fff', fontSize: 18, lineHeight: 28, fontStyle: 'italic', fontWeight: '500' },
  btn:        { borderRadius: 14, overflow: 'hidden' },
  btnGrad:    { paddingVertical: 14, alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Random connect card ──────────────────────────────────────────────────────
function RandomConnectCard({ onConnect, onlineCount }) {
  return (
    <LinearGradient colors={['#0e1f14', '#0a180e']} style={rcc.card}>
      <View style={rcc.left}>
        <Text style={rcc.emoji}>🌀</Text>
        <View style={{ flex: 1 }}>
          <Text style={rcc.title}>Random World Connect</Text>
          <Text style={rcc.sub}>Instant chat with someone from a different country. Auto-translated.</Text>
          <View style={rcc.onlinePill}>
            <View style={rcc.dot} />
            <Text style={rcc.onlineText}>{onlineCount} people online now</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={rcc.btn} onPress={onConnect} activeOpacity={0.85}>
        <LinearGradient colors={['#4caf50', '#388e3c']} style={rcc.btnGrad}>
          <Text style={rcc.btnText}>Connect Now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}
const rcc = StyleSheet.create({
  card:       { borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: '#4caf5030' },
  left:       { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  emoji:      { fontSize: 36, marginTop: 2 },
  title:      { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub:        { color: '#888', fontSize: 13, lineHeight: 20, marginTop: 4 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dot:        { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#57f287' },
  onlineText: { color: '#57f287', fontSize: 12, fontWeight: '600' },
  btn:        { borderRadius: 14, overflow: 'hidden' },
  btnGrad:    { paddingVertical: 13, alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Experience card ──────────────────────────────────────────────────────────
function ExperienceCard({ exp, onApply, onPress }) {
  const ct   = CONNECTION_TYPES[exp.connection_type] || CONNECTION_TYPES.friendship;
  const catE = CATEGORY_EMOJIS[exp.category] || '🌍';
  return (
    <TouchableOpacity style={expS.card} onPress={onPress} activeOpacity={0.85}>
      <View style={expS.top}>
        <View style={[expS.catIcon, { backgroundColor: ct.color + '22' }]}>
          <Text style={{ fontSize: 26 }}>{catE}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={expS.title} numberOfLines={2}>{exp.title}</Text>
          <Text style={expS.author}>{exp.display_name}  ·  {exp.city || exp.profile_country || ''}</Text>
        </View>
        <View style={[expS.ctBadge, { backgroundColor: ct.color + '20', borderColor: ct.color + '50' }]}>
          <Text style={{ fontSize: 18 }}>{ct.emoji}</Text>
        </View>
      </View>
      {exp.description ? <Text style={expS.desc} numberOfLines={2}>{exp.description}</Text> : null}
      <TouchableOpacity style={expS.interestBtn} onPress={() => onApply(exp)}>
        <Text style={expS.interestText}>Show Interest</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
const expS = StyleSheet.create({
  card:        { backgroundColor: '#13132a', borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: '#2F3336' },
  top:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catIcon:     { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 21 },
  author:      { color: '#555', fontSize: 12 },
  ctBadge:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  desc:        { color: '#888', fontSize: 13, lineHeight: 20 },
  interestBtn: { backgroundColor: '#E8003D18', borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#E8003D40' },
  interestText:{ color: '#E8003D', fontSize: 14, fontWeight: '700' },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ title, sub, action, onAction }) {
  const { colors } = useTheme();
  return (
    <View style={sh.row}>
      <View style={{ flex: 1 }}>
        <Text style={[sh.title, { color: colors.text }]}>{title}</Text>
        {sub ? <Text style={[sh.sub, { color: colors.textMuted }]}>{sub}</Text> : null}
      </View>
      {action ? (
        <TouchableOpacity onPress={onAction} style={sh.actionBtn}>
          <Text style={sh.actionText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const sh = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:     { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sub:       { fontSize: 12, marginTop: 2 },
  actionBtn: { backgroundColor: '#E8003D18', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#E8003D40' },
  actionText:{ color: '#E8003D', fontSize: 12, fontWeight: '700' },
});

// ─── Quick action tile ────────────────────────────────────────────────────────
function QuickTile({ emoji, label, colors, onPress }) {
  return (
    <TouchableOpacity style={qt.wrap} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={colors} style={qt.tile}>
        <Text style={qt.emoji}>{emoji}</Text>
      </LinearGradient>
      <Text style={qt.label}>{label}</Text>
    </TouchableOpacity>
  );
}
const qt = StyleSheet.create({
  wrap:  { alignItems: 'center', gap: 7, flex: 1 },
  tile:  { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  label: { color: '#888', fontSize: 11, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation, user }) {
  const { colors, isDark } = useTheme();
  const socket = getSocket();

  const [onlineUsers,   setOnlineUsers]   = useState([]);
  const [dailyMatches,  setDailyMatches]  = useState([]);
  const [experiences,   setExperiences]   = useState([]);
  const [icebreaker,    setIcebreaker]    = useState({ question: '', responseCount: 0 });
  const [liveStreams,   setLiveStreams]   = useState([]);
  const [loadingMatches,setLoadingM]      = useState(true);
  const [loadingExps,   setLoadingE]      = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [notifCount,    setNotifCount]    = useState(0);

  const scrollY       = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp' });
  const heroOpacity   = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0], extrapolate: 'clamp' });
  const heroScale     = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.92], extrapolate: 'clamp' });

  const sectionsAnim = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;

  const fetchBondData = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) { setLoadingM(false); setLoadingE(false); return; }
      const headers = { Authorization: `Bearer ${token}` };

      const [matchRes, expRes] = await Promise.allSettled([
        axios.get(`${SERVER_URL}/api/matches/daily`, { headers, timeout: 8000 }),
        axios.get(`${SERVER_URL}/api/experiences`, {
          headers, timeout: 8000,
          params: { country: user?.country?.replace(/^.{2} /, '') || undefined, limit: 10 },
        }),
      ]);

      if (matchRes.status === 'fulfilled') {
        setDailyMatches(matchRes.value.data.slice(0, 5));
        setNotifCount(matchRes.value.data.filter(m => m.action === 'pending').length);
      }
      if (expRes.status === 'fulfilled') setExperiences(expRes.value.data.slice(0, 6));
    } catch {}
    finally {
      setLoadingM(false);
      setLoadingE(false);
      Animated.stagger(100, sectionsAnim.map(a =>
        Animated.spring(a, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
      )).start();

    }
  }, [user?.country]);

  useEffect(() => {
    if (!user) return;
    function registerAndFetch() {
      socket.emit('register', {
        username:     user.username,
        display_name: user.display_name || user.username,
        language:     user.language,
        country:      user.country,
        userId:       user.userId,
        photo_url:    user.photo_url,
      });
      socket.emit('get_users');
      socket.emit('get_icebreaker');
    }
    if (socket.connected) registerAndFetch();
    else socket.once('connect', registerAndFetch);

    socket.on('user_list', list => setOnlineUsers(list.filter(u => u.socketId !== socket.id)));
    socket.on('icebreaker_data', ({ question, responses }) => {
      setIcebreaker({ question, responseCount: responses?.length || 0 });
    });
    socket.on('incoming_call', ({ from, callerName, callerCountry, offer, callType }) => {
      navigation.navigate('Call', { mode: 'incoming', from, callerName, callerCountry, offer, callType });
    });
    socket.on('live_streams', streams => setLiveStreams(streams));
    socket.emit('get_live_streams');

    fetchBondData();
    return () => {
      socket.off('user_list');
      socket.off('icebreaker_data');
      socket.off('incoming_call');
      socket.off('live_streams');
    };
  }, [fetchBondData]);

  async function onRefresh() {
    setRefreshing(true);
    if (socket.connected) {
      socket.emit('get_users');
      socket.emit('get_icebreaker');
      socket.emit('get_live_streams');
    }
    await fetchBondData();
    setRefreshing(false);
  }

  async function applyToExperience(exp) {
    try {
      const token = await getAccessToken();
      await axios.post(`${SERVER_URL}/api/experiences/${exp.id}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
      });
      setExperiences(prev => prev.filter(e => e.id !== exp.id));
    } catch {}
  }

  function openMatchProfile(match) {
    navigation.navigate('Profile', {
      profileUser: { username: match.display_name, country: match.country, language: match.language, socials: {} },
      bondUserId:         match.matched_user_id,
      compatibilityScore: match.compatibility_score,
      scoreBreakdown:     match.score_breakdown,
    });
  }

  function openChat(otherUser) {
    navigation.navigate('Chat', { otherUser, currentUser: user });
  }

  const firstName = (user?.username || 'there').split(' ')[0];

  function sectionStyle(i) {
    return {
      opacity: sectionsAnim[i],
      transform: [{ translateY: sectionsAnim[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    };
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Floating sticky bar */}
      <Animated.View style={[styles.stickyBar, { opacity: headerOpacity, backgroundColor: colors.bg + 'f0', borderBottomColor: colors.border }]}>
        <SafeAreaView>
          <View style={styles.stickyInner}>
            <Text style={[styles.stickyLogo, { color: colors.text }]}>Bond</Text>
            <View style={styles.stickyOnline}>
              <View style={styles.onlineDot} />
              <Text style={styles.stickyOnlineText}>{onlineUsers.length} online</Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8003D" />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* ── Hero header ── */}
        <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
          <LinearGradient
            colors={isDark ? ['#1C1F23', '#000000'] : [colors.bgSecondary, colors.bg]}
            style={styles.heroBg}
          >
            <SafeAreaView>
              <View style={styles.heroInner}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.greeting, { color: colors.text }]}>{greeting()}, {firstName} 👋</Text>
                  <Text style={[styles.greetingSub, { color: colors.textMuted }]}>{user?.country || 'Earth 🌍'}</Text>
                </View>
                <View style={styles.heroRight}>
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineBadgeText}>{onlineUsers.length}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Notifications')}
                  >
                    <Text style={styles.notifIcon}>🔔</Text>
                    {notifCount > 0 && (
                      <View style={styles.notifBadge}>
                        <Text style={styles.notifBadgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

        {/* ── Quick actions ── */}
        <Animated.View style={[styles.section, sectionStyle(0)]}>
          <View style={styles.quickRow}>
            <QuickTile emoji="✨" label="Matches"  colors={['#1C1F23', '#16181C']} onPress={() => navigation.navigate('Bond')} />
            <QuickTile emoji="💬" label="Chats"    colors={['#0d1e2e', '#000000']} onPress={() => navigation.navigate('Groups')} />
            <QuickTile emoji="🎉" label="Events"   colors={['#2a1a0e', '#1a0e06']} onPress={() => navigation.navigate('Events')} />
          </View>
        </Animated.View>

        {/* ── Live Now ── */}
        {liveStreams.length > 0 && (
          <Animated.View style={[styles.section, sectionStyle(1)]}>
            <SectionHead title="Live Now" sub={`${liveStreams.length} stream${liveStreams.length > 1 ? 's' : ''} happening`} />
            <FlatList
              horizontal
              data={liveStreams}
              keyExtractor={s => s.streamId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item: s }) => (
                <TouchableOpacity
                  style={styles.liveCard}
                  onPress={() => navigation.navigate('LiveWatch', { stream: s, currentUser: user })}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#2a0a0a', '#1a0606']} style={styles.liveCardBg}>
                    <View style={styles.liveBadgeSmall}>
                      <View style={styles.liveDotSmall} />
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                    <Text style={styles.liveCardEmoji}>
                      {s.hostCountry?.split(' ')[0] || '🌍'}
                    </Text>
                    <Text style={styles.liveCardName} numberOfLines={1}>{s.hostName}</Text>
                    <Text style={styles.liveCardTitle} numberOfLines={1}>{s.title}</Text>
                    <View style={styles.liveViewerRow}>
                      <Text style={styles.liveViewerText}>👁 {s.viewerCount}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}

        {/* ── Online now (stories) ── */}
        {onlineUsers.length > 0 && (
          <Animated.View style={[styles.section, sectionStyle(liveStreams.length > 0 ? 2 : 1)]}>
            <SectionHead
              title="Online Now"
              sub={`${onlineUsers.length} people live around the world`}
            />
            <FlatList
              horizontal
              data={onlineUsers.slice(0, 15)}
              keyExtractor={u => u.socketId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
              renderItem={({ item }) => (
                <StoryRing user={item} onPress={() => openChat(item)} />
              )}
            />
          </Animated.View>
        )}

        {/* ── Daily Bond matches ── */}
        <Animated.View style={[styles.section, sectionStyle(2)]}>
          <SectionHead
            title="Your Bond Matches"
            sub={dailyMatches.length ? `${dailyMatches.length} curated for you today` : 'Updated every day'}
            action={dailyMatches.length ? 'See All' : null}
            onAction={() => navigation.navigate('Bond')}
          />

          {loadingMatches ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#E8003D" />
              <Text style={styles.loadingText}>Finding your matches…</Text>
            </View>
          ) : dailyMatches.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
              {dailyMatches.map((m, i) => (
                <MatchCard key={m.id} match={m} index={i} onPress={() => openMatchProfile(m)} />
              ))}
              <TouchableOpacity style={styles.moreCard} onPress={() => navigation.navigate('Bond')}>
                <Text style={styles.moreNum}>→</Text>
                <Text style={styles.moreLabel}>See{'\n'}All</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <LinearGradient colors={['#1a1a3a', '#16181C']} style={styles.emptyCard}>
              <Text style={{ fontSize: 40 }}>✨</Text>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySub}>Complete your profile to unlock your daily 5 curated matches.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Me')}>
                <Text style={styles.emptyBtnText}>Complete Profile →</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </Animated.View>

        {/* ── Icebreaker ── */}
        {icebreaker.question ? (
          <Animated.View style={[styles.section, sectionStyle(3)]}>
            <IcebreakerCard
              question={icebreaker.question}
              responseCount={icebreaker.responseCount}
              onAnswer={() => navigation.navigate('Discover')}
            />
          </Animated.View>
        ) : null}

        {/* ── Random connect ── */}
        <Animated.View style={[styles.section, sectionStyle(4)]}>
          <RandomConnectCard
            onConnect={() => navigation.navigate('Discover')}
            onlineCount={onlineUsers.length}
          />
        </Animated.View>

        {/* ── Experiences near you ── */}
        <Animated.View style={[styles.section, sectionStyle(5)]}>
          <SectionHead
            title="Experiences Near You"
            sub={experiences.length ? `${experiences.length} posted recently` : null}
            action="See All"
            onAction={() => navigation.navigate('Experiences')}
          />

          {loadingExps ? (
            <ActivityIndicator color="#E8003D" style={{ marginVertical: 24 }} />
          ) : experiences.length > 0 ? (
            <View style={{ gap: 12 }}>
              {experiences.slice(0, 4).map(exp => (
                <ExperienceCard
                  key={exp.id}
                  exp={exp}
                  onApply={applyToExperience}
                  onPress={() => navigation.navigate('Experiences')}
                />
              ))}
              {experiences.length > 4 && (
                <TouchableOpacity style={styles.seeMoreBtn} onPress={() => navigation.navigate('Experiences')}>
                  <Text style={styles.seeMoreText}>See {experiences.length - 4} more experiences →</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.emptyExps} onPress={() => navigation.navigate('Experiences')}>
              <Text style={{ fontSize: 36 }}>🌟</Text>
              <Text style={styles.emptyTitle}>No experiences yet</Text>
              <Text style={styles.emptySub}>Be the first to post something you want to share.</Text>
              <Text style={styles.emptyLink}>Post an Experience →</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000000' },

  stickyBar:       { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, backgroundColor: '#000000f0', borderBottomWidth: 1, borderBottomColor: '#1C1F23' },
  stickyInner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  stickyLogo:      { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  stickyOnline:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stickyOnlineText:{ color: '#57f287', fontSize: 12, fontWeight: '600' },

  hero:            { marginBottom: 0 },
  heroBg:          { paddingBottom: 20 },
  heroInner:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  greeting:        { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  greetingSub:     { color: '#555', fontSize: 13, marginTop: 3 },
  heroRight:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  onlineBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#57f28718', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#57f28730' },
  onlineBadgeText: { color: '#57f287', fontSize: 14, fontWeight: '700' },
  onlineDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#57f287' },
  notifBtn:        { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1F23', borderRadius: 14, borderWidth: 1, borderColor: '#2F3336' },
  notifIcon:       { fontSize: 18 },
  notifBadge:      { position: 'absolute', top: 4, right: 4, backgroundColor: '#f04747', borderRadius: 7, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  notifBadgeText:  { color: '#fff', fontSize: 8, fontWeight: '800' },

  scroll:          { paddingBottom: 60, gap: 30 },
  section:         { paddingHorizontal: 20 },

  quickRow:        { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },

  loadingRow:      { alignItems: 'center', paddingVertical: 40, gap: 12, flexDirection: 'row', justifyContent: 'center' },
  loadingText:     { color: '#555', fontSize: 13 },

  moreCard:        { width: 80, height: 230, backgroundColor: '#13132a', borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#2F3336', borderStyle: 'dashed' },
  moreNum:         { color: '#E8003D', fontSize: 28, fontWeight: '300' },
  moreLabel:       { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  emptyCard:       { borderRadius: 24, padding: 28, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E8003D20' },
  emptyTitle:      { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySub:        { color: '#555', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn:        { backgroundColor: '#E8003D', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, marginTop: 6 },
  emptyBtnText:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyExps:       { backgroundColor: '#13132a', borderRadius: 20, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2F3336', borderStyle: 'dashed' },
  emptyLink:       { color: '#E8003D', fontSize: 14, fontWeight: '600', marginTop: 6 },

  seeMoreBtn:      { backgroundColor: '#13132a', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2F3336' },
  seeMoreText:     { color: '#E8003D', fontSize: 14, fontWeight: '600' },

  liveCard:        { width: 130, borderRadius: 18, overflow: 'hidden' },
  liveCardBg:      { padding: 14, gap: 6, minHeight: 140, justifyContent: 'flex-end', borderWidth: 1, borderColor: '#e5393530' },
  liveBadgeSmall:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', position: 'absolute', top: 10, left: 10 },
  liveDotSmall:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText:   { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  liveCardEmoji:   { fontSize: 30, marginTop: 28 },
  liveCardName:    { color: '#fff', fontWeight: '800', fontSize: 13 },
  liveCardTitle:   { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  liveViewerRow:   { flexDirection: 'row', alignItems: 'center' },
  liveViewerText:  { color: '#e57373', fontSize: 11, fontWeight: '700' },
});
