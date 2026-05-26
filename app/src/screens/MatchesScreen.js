import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Image, StyleSheet, RefreshControl, Alert, ScrollView,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { getAccessToken } from '../services/authApi';
import { SERVER_URL, getSocket } from '../services/socket';

const { width } = Dimensions.get('window');

const CT = {
  dating:     { emoji: '❤️',  label: 'Dating',           color: '#e91e63' },
  friendship: { emoji: '🤝',  label: 'Friendship',       color: '#2196f3' },
  travel:     { emoji: '✈️',  label: 'Travel Buddy',     color: '#ff9800' },
  language:   { emoji: '💬',  label: 'Language Exchange', color: '#9c27b0' },
  mentorship: { emoji: '🎓',  label: 'Mentorship',       color: '#4caf50' },
};

const BREAKDOWN_LABELS = {
  connection_type:  'Connection type',
  experience_align: 'Shared interests',
  language:         'Language',
  location:         'Location',
  ghost_score:      'Reliability',
};

function stringToColor(str = '') {
  const p = ['#e57373','#ba68c8','#4fc3f7','#81c784','#ffb74d','#f06292','#4db6ac','#7986cb'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

function compatColor(score) {
  if (score >= 75) return '#57f287';
  if (score >= 50) return '#fee75c';
  return '#f04747';
}

async function authHeaders() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Voice note mini-player ────────────────────────────────────────────────
function VoiceNote() {
  const [playing, setPlaying] = useState(false);
  const bars = useRef(Array.from({ length: 24 }, () => 3 + Math.random() * 18)).current;
  return (
    <TouchableOpacity
      style={vn.row}
      onPress={() => setPlaying(p => !p)}
      activeOpacity={0.85}
    >
      <View style={[vn.btn, playing && vn.btnOn]}>
        <Text style={vn.btnIcon}>{playing ? '⏸' : '▶'}</Text>
      </View>
      <View style={vn.wave}>
        {bars.map((h, i) => (
          <View key={i} style={[vn.bar, { height: h, opacity: playing ? 1 : 0.4 }]} />
        ))}
      </View>
      <Text style={vn.dur}>0:30</Text>
    </TouchableOpacity>
  );
}
const vn = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8003D15', borderRadius: 14, padding: 12, gap: 10, borderWidth: 1, borderColor: '#E8003D30' },
  btn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8003D', alignItems: 'center', justifyContent: 'center' },
  btnOn:{ backgroundColor: '#C7003A' },
  btnIcon: { color: '#fff', fontSize: 12 },
  wave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar:  { width: 3, borderRadius: 2, backgroundColor: '#E8003D' },
  dur:  { color: '#555', fontSize: 11 },
});

// ─── Compatibility ring ────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = Math.round(score || 0);
  const c = compatColor(r);
  return (
    <View style={[ring.wrap, { borderColor: c }]}>
      <Text style={[ring.num, { color: c }]}>{r}%</Text>
      <Text style={ring.lbl}>match</Text>
    </View>
  );
}
const ring = StyleSheet.create({
  wrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  num:  { fontSize: 18, fontWeight: '800' },
  lbl:  { color: '#555', fontSize: 9, marginTop: -2 },
});

// ─── Score breakdown ───────────────────────────────────────────────────────
function Breakdown({ data }) {
  if (!data) return null;
  return (
    <View style={bd.wrap}>
      <Text style={bd.title}>Why you match</Text>
      {Object.entries(data).map(([k, v]) => {
        const pct = Math.round(v * 100);
        const c   = compatColor(pct);
        return (
          <View key={k} style={bd.row}>
            <Text style={bd.label}>{BREAKDOWN_LABELS[k] || k}</Text>
            <View style={bd.track}>
              <View style={[bd.fill, { width: `${pct}%`, backgroundColor: c }]} />
            </View>
            <Text style={[bd.pct, { color: c }]}>{pct}%</Text>
          </View>
        );
      })}
    </View>
  );
}
const bd = StyleSheet.create({
  wrap:  { gap: 8 },
  title: { color: '#555', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#666', fontSize: 11, width: 110 },
  track: { flex: 1, height: 3, backgroundColor: '#2F3336', borderRadius: 2, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 2 },
  pct:   { fontSize: 11, fontWeight: '700', width: 30, textAlign: 'right' },
});

// ─── Daily match card ──────────────────────────────────────────────────────
function DailyCard({ item, onConnect, onPass, onProfile, index }) {
  const ct     = CT[(item.connection_types || [])[0]] || CT.friendship;
  const name   = item.display_name || 'Someone';
  const avatarC= stringToColor(name);
  const [passed, setPassed]   = useState(false);
  const [bonded, setBonded]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleConnect() {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.04, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    setBonded(true);
    onConnect(item);
  }

  function handlePass() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setPassed(true));
  }

  if (passed) return null;

  return (
    <Animated.View style={[dc.wrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={onProfile} activeOpacity={0.95} style={dc.card}>
        {/* Photo */}
        <View style={dc.photoArea}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={dc.photo} />
          ) : (
            <LinearGradient colors={[avatarC, avatarC + '66']} style={dc.photo}>
              <Text style={dc.photoInitial}>{name[0]?.toUpperCase()}</Text>
            </LinearGradient>
          )}
          <LinearGradient colors={['transparent', 'transparent', '#000000']} style={dc.photoOverlay} />

          {/* Score ring */}
          <View style={dc.ringWrap}>
            <ScoreRing score={item.compatibility_score} />
          </View>

          {/* Connection type */}
          <View style={[dc.ctChip, { backgroundColor: ct.color + 'cc' }]}>
            <Text style={{ fontSize: 14 }}>{ct.emoji}</Text>
            <Text style={dc.ctLabel}>{ct.label}</Text>
          </View>

          {/* Identity on photo */}
          <View style={dc.photoBottom}>
            <Text style={dc.photoName}>{name}{item.age ? `, ${item.age}` : ''}</Text>
            <Text style={dc.photoLocation}>
              {[item.city, item.country].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={dc.body}>
          {/* Bio */}
          {item.bio ? (
            <Text style={dc.bio} numberOfLines={expanded ? undefined : 2}>
              {item.bio}
            </Text>
          ) : null}

          {/* Voice note */}
          {item.voice_note_url ? <VoiceNote /> : null}

          {/* Breakdown toggle */}
          <TouchableOpacity onPress={() => setExpanded(e => !e)} style={dc.breakdownToggle}>
            <Text style={dc.breakdownToggleText}>
              {expanded ? '▲ Hide breakdown' : '▼ Why you match'}
            </Text>
          </TouchableOpacity>

          {expanded && item.score_breakdown && (
            <Breakdown data={item.score_breakdown} />
          )}

          {/* Actions */}
          <View style={dc.actions}>
            <TouchableOpacity style={dc.passBtn} onPress={handlePass}>
              <Text style={dc.passIcon}>✕</Text>
              <Text style={dc.passText}>Pass</Text>
            </TouchableOpacity>

            {bonded ? (
              <View style={dc.bondedBtn}>
                <Text style={dc.bondedText}>✓ Bonded!</Text>
              </View>
            ) : (
              <LinearGradient
                colors={[ct.color, ct.color + 'cc']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={dc.connectGrad}
              >
                <TouchableOpacity style={dc.connectInner} onPress={handleConnect}>
                  <Text style={dc.connectIcon}>✦</Text>
                  <Text style={dc.connectText}>Bond with them</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const dc = StyleSheet.create({
  wrap:          { marginBottom: 20 },
  card:          { backgroundColor: '#16181C', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#2F3336' },
  photoArea:     { height: 260, position: 'relative' },
  photo:         { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  photoInitial:  { color: '#fff', fontSize: 80, fontWeight: '800', opacity: 0.7 },
  photoOverlay:  { position: 'absolute', width: '100%', height: '100%' },
  ringWrap:      { position: 'absolute', top: 14, right: 14 },
  ctChip:        { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  ctLabel:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  photoBottom:   { position: 'absolute', bottom: 14, left: 16, right: 16 },
  photoName:     { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  photoLocation: { color: '#ffffff88', fontSize: 13, marginTop: 2 },
  body:          { padding: 18, gap: 14 },
  bio:           { color: '#aaa', fontSize: 14, lineHeight: 22 },
  breakdownToggle:{ alignSelf: 'flex-start' },
  breakdownToggleText: { color: '#E8003D', fontSize: 12, fontWeight: '600' },
  actions:       { flexDirection: 'row', gap: 10, marginTop: 4 },
  passBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 16, backgroundColor: '#2F3336', borderWidth: 1, borderColor: '#2F3336' },
  passIcon:      { color: '#555', fontSize: 14, fontWeight: '700' },
  passText:      { color: '#555', fontSize: 14, fontWeight: '700' },
  connectGrad:   { flex: 2, borderRadius: 16, overflow: 'hidden' },
  connectInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14 },
  connectIcon:   { color: '#fff', fontSize: 14 },
  connectText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  bondedBtn:     { flex: 2, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: '#57f28720', borderWidth: 1, borderColor: '#57f287' },
  bondedText:    { color: '#57f287', fontSize: 15, fontWeight: '700' },
});

// ─── Connection row ────────────────────────────────────────────────────────
function ConnectionRow({ item, onChat, onProfile, index }) {
  const ct     = CT[item.connection_type] || CT.friendship;
  const name   = item.display_name || 'Someone';
  const avatarC= stringToColor(name);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim= useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={cr.row} onPress={onProfile} activeOpacity={0.85}>
        <View style={cr.avatarWrap}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={cr.avatar} />
          ) : (
            <View style={[cr.avatarFallback, { backgroundColor: avatarC }]}>
              <Text style={cr.avatarInitial}>{name[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={[cr.ctDot, { backgroundColor: ct.color }]}>
            <Text style={{ fontSize: 8 }}>{ct.emoji}</Text>
          </View>
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <Text style={cr.name}>{name}{item.age ? `, ${item.age}` : ''}</Text>
          <Text style={cr.meta}>{[item.city, item.country].filter(Boolean).join(', ')}</Text>
          <View style={[cr.badge, { backgroundColor: ct.color + '18', borderColor: ct.color + '50' }]}>
            <Text style={[cr.badgeText, { color: ct.color }]}>{ct.label}</Text>
          </View>
        </View>

        <TouchableOpacity style={cr.chatBtn} onPress={onChat}>
          <LinearGradient colors={['#E8003D', '#C7003A']} style={cr.chatGrad}>
            <Text style={cr.chatIcon}>💬</Text>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
const cr = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16181C', borderRadius: 20, padding: 14, gap: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2F3336' },
  avatarWrap:    { position: 'relative' },
  avatar:        { width: 58, height: 58, borderRadius: 29 },
  avatarFallback:{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 24, fontWeight: '800' },
  ctDot:         { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000000' },
  name:          { color: '#fff', fontSize: 16, fontWeight: '700' },
  meta:          { color: '#555', fontSize: 12 },
  badge:         { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, marginTop: 2 },
  badgeText:     { fontSize: 10, fontWeight: '700' },
  chatBtn:       { borderRadius: 14, overflow: 'hidden' },
  chatGrad:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  chatIcon:      { fontSize: 18 },
});

// ─── Main ──────────────────────────────────────────────────────────────────
export default function MatchesScreen({ navigation }) {
  const [tab,         setTab]         = useState('daily');
  const [daily,       setDaily]       = useState([]);
  const [confirmed,   setConfirmed]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const socket  = getSocket();
  const tabAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const [dailyRes, confRes] = await Promise.allSettled([
        axios.get(`${SERVER_URL}/api/matches/daily`, { headers, timeout: 8000 }),
        axios.get(`${SERVER_URL}/api/matches`,       { headers, timeout: 8000 }),
      ]);
      if (dailyRes.status === 'fulfilled') setDaily(dailyRes.value.data);
      if (confRes.status  === 'fulfilled') setConfirmed(confRes.value.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    socket.on('user_list', list => setOnlineUsers(list));
    socket.emit('get_users');
    return () => socket.off('user_list');
  }, []);

  function switchTab(t) {
    setTab(t);
    Animated.timing(tabAnim, {
      toValue: t === 'daily' ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }

  async function handleConnect(item) {
    try {
      const headers = await authHeaders();
      const targetId = item.matched_user_id || item.user_id;
      const ct = (item.connection_types || [])[0] || 'friendship';
      await axios.post(`${SERVER_URL}/api/matches`, { targetUserId: targetId, connectionType: ct }, { headers, timeout: 10000 });
      // Refresh confirmed list
      const { data } = await axios.get(`${SERVER_URL}/api/matches`, { headers, timeout: 8000 });
      setConfirmed(data);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (!msg.includes('already')) Alert.alert('Error', msg || 'Could not create match');
    }
  }

  function openProfile(item) {
    if (!navigation) return;
    navigation.navigate('Profile', {
      profileUser: { username: item.display_name, country: item.country, language: item.language, socials: {} },
      bondUserId:         item.matched_user_id || item.user_id,
      compatibilityScore: item.compatibility_score,
      scoreBreakdown:     item.score_breakdown,
    });
  }

  function openChat(item) {
    if (!navigation) return;
    const targetUserId = item.matched_user_id || item.user_id;
    const online = onlineUsers.find(u => u.userId === targetUserId);
    navigation.navigate('Chat', {
      otherUser: {
        userId:       targetUserId,
        display_name: item.display_name,
        photo_url:    item.photo_url,
        socketId:     online?.socketId,
      },
      currentUser: {},
    });
  }

  const indicatorX = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (width - 40) / 2] });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bond Matches</Text>
        <View style={styles.countPills}>
          <View style={styles.pill}>
            <Text style={styles.pillNum}>{daily.length}</Text>
            <Text style={styles.pillLabel}>today</Text>
          </View>
          <View style={[styles.pill, { borderColor: '#57f28740' }]}>
            <Text style={[styles.pillNum, { color: '#57f287' }]}>{confirmed.length}</Text>
            <Text style={styles.pillLabel}>bonded</Text>
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('daily')}>
          <Text style={[styles.tabText, tab === 'daily' && styles.tabTextOn]}>
            ✨  Today's 5
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('confirmed')}>
          <Text style={[styles.tabText, tab === 'confirmed' && styles.tabTextOn]}>
            💛  Connections
          </Text>
        </TouchableOpacity>
        <Animated.View style={[styles.tabIndicator, { transform: [{ translateX: indicatorX }] }]} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#E8003D" size="large" />
          <Text style={styles.loadingText}>Finding your matches…</Text>
        </View>
      ) : (
        <FlatList
          data={tab === 'daily' ? daily : confirmed}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#E8003D"
            />
          }
          renderItem={({ item, index }) =>
            tab === 'daily' ? (
              <DailyCard
                item={item}
                index={index}
                onConnect={handleConnect}
                onPass={() => {}}
                onProfile={() => openProfile(item)}
              />
            ) : (
              <ConnectionRow
                item={item}
                index={index}
                onChat={() => openChat(item)}
                onProfile={() => openProfile(item)}
              />
            )
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <LinearGradient colors={['#1C1F23', '#16181C']} style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>{tab === 'daily' ? '✨' : '💛'}</Text>
                <Text style={styles.emptyTitle}>
                  {tab === 'daily' ? 'No matches yet' : 'No connections yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {tab === 'daily'
                    ? 'Complete your profile and post an experience to get your daily 5 curated matches.'
                    : 'Bond with someone from your daily matches to see them here.'}
                </Text>
                {tab === 'daily' && navigation && (
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => navigation.navigate('Me')}
                  >
                    <Text style={styles.emptyBtnText}>Complete Profile →</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000000' },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  countPills:  { flexDirection: 'row', gap: 8 },
  pill:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8003D15', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#E8003D40' },
  pillNum:     { color: '#E8003D', fontSize: 15, fontWeight: '800' },
  pillLabel:   { color: '#555', fontSize: 10 },

  tabBar:      { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#16181C', borderRadius: 16, padding: 4, position: 'relative', overflow: 'hidden' },
  tabBtn:      { flex: 1, paddingVertical: 11, alignItems: 'center', zIndex: 1 },
  tabText:     { color: '#555', fontSize: 13, fontWeight: '700' },
  tabTextOn:   { color: '#fff' },
  tabIndicator:{ position: 'absolute', top: 4, bottom: 4, left: 4, width: '50%', backgroundColor: '#E8003D', borderRadius: 12 },

  list:        { paddingHorizontal: 20, paddingBottom: 60 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: '#555', fontSize: 14 },

  empty:       { paddingTop: 40 },
  emptyCard:   { borderRadius: 24, padding: 32, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E8003D20' },
  emptyEmoji:  { fontSize: 50 },
  emptyTitle:  { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptySub:    { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn:    { marginTop: 6, backgroundColor: '#E8003D', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
});
