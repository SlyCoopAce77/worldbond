import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, Alert, ActivityIndicator,
  Animated, Linking, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { getAccessToken } from '../services/authApi';
import { SERVER_URL } from '../services/socket';

const { width, height } = Dimensions.get('window');
const COVER_HEIGHT = 340;

const CONNECTION_TYPES = [
  { key: 'dating',     emoji: '❤️',  label: 'Dating',           color: '#e91e63' },
  { key: 'friendship', emoji: '🤝',  label: 'Friendship',       color: '#2196f3' },
  { key: 'travel',     emoji: '✈️',  label: 'Travel Buddy',     color: '#ff9800' },
  { key: 'language',   emoji: '💬',  label: 'Language Exchange', color: '#9c27b0' },
  { key: 'mentorship', emoji: '🎓',  label: 'Mentorship',       color: '#4caf50' },
];

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', baseUrl: 'https://instagram.com/' },
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵', baseUrl: 'https://tiktok.com/@' },
  { key: 'twitter',   label: 'X / Twitter', icon: '🐦', baseUrl: 'https://x.com/' },
  { key: 'snapchat',  label: 'Snapchat',  icon: '👻', baseUrl: 'https://snapchat.com/add/' },
  { key: 'youtube',   label: 'YouTube',   icon: '▶️',  baseUrl: 'https://youtube.com/' },
];

function stringToColor(str = '') {
  const palette = ['#e57373', '#ba68c8', '#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#4db6ac', '#7986cb'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function getReliability(score) {
  if (!score) return { label: 'New',       color: '#888', emoji: '🌱' };
  if (score >= 4.5) return { label: 'Excellent', color: '#ffd700', emoji: '⭐' };
  if (score >= 3.5) return { label: 'Great',     color: '#57f287', emoji: '✅' };
  if (score >= 2.5) return { label: 'Good',      color: '#57c4ff', emoji: '👍' };
  if (score >= 1.5) return { label: 'Fair',      color: '#fee75c', emoji: '⚠️' };
  return               { label: 'Low',       color: '#f04747', emoji: '❌' };
}

// ─── Voice note player ─────────────────────────────────────────────────────
function VoiceNotePlayer({ url }) {
  const [playing, setPlaying] = useState(false);
  const bars = useRef(Array.from({ length: 32 }, () => 4 + Math.random() * 24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (playing) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [playing]);

  return (
    <View style={vStyles.section}>
      <Text style={vStyles.label}>Voice Note</Text>
      <View style={vStyles.container}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[vStyles.btn, playing && vStyles.btnActive]}
            onPress={() => setPlaying(p => !p)}
          >
            <Text style={vStyles.btnIcon}>{playing ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={vStyles.waveform}>
          {bars.map((h, i) => (
            <View key={i} style={[vStyles.bar, { height: h, opacity: playing ? 1 : 0.3 }]} />
          ))}
        </View>
        <Text style={vStyles.dur}>0:30</Text>
      </View>
      <Text style={vStyles.hint}>Tap to hear their voice 🎙️</Text>
    </View>
  );
}
const vStyles = StyleSheet.create({
  section:   { gap: 10 },
  label:     { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8003D12', borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: '#E8003D30' },
  btn:       { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E8003D', alignItems: 'center', justifyContent: 'center' },
  btnActive: { backgroundColor: '#C7003A' },
  btnIcon:   { color: '#fff', fontSize: 16 },
  waveform:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 44 },
  bar:       { width: 3, borderRadius: 2, backgroundColor: '#E8003D' },
  dur:       { color: '#666', fontSize: 12 },
  hint:      { color: '#555', fontSize: 12, textAlign: 'center' },
});

// ─── Compatibility breakdown ───────────────────────────────────────────────
function CompatBreakdown({ score, breakdown }) {
  if (!score && !breakdown) return null;
  const rounded = Math.round(score || 0);
  let ringColor = '#57f287';
  if (rounded < 50) ringColor = '#f04747';
  else if (rounded < 70) ringColor = '#fee75c';

  return (
    <View style={cStyles.card}>
      <View style={cStyles.top}>
        <View>
          <Text style={cStyles.title}>Compatibility</Text>
          <Text style={cStyles.sub}>Based on your profiles & interests</Text>
        </View>
        <View style={[cStyles.ring, { borderColor: ringColor }]}>
          <Text style={[cStyles.ringNum, { color: ringColor }]}>{rounded}%</Text>
          <Text style={cStyles.ringLabel}>match</Text>
        </View>
      </View>
      {breakdown && (
        <View style={cStyles.bars}>
          {Object.entries(breakdown).map(([key, val]) => {
            const labels = {
              connection_type:  'Connection type',
              experience_align: 'Shared interests',
              language:         'Language',
              location:         'Location',
              ghost_score:      'Reliability',
            };
            const pct = Math.round(val * 100);
            return (
              <View key={key} style={cStyles.row}>
                <Text style={cStyles.rowLabel}>{labels[key] || key}</Text>
                <View style={cStyles.track}>
                  <View style={[cStyles.fill, { width: `${pct}%` }]} />
                </View>
                <Text style={cStyles.pct}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
const cStyles = StyleSheet.create({
  card:      { backgroundColor: '#1C1F23', borderRadius: 20, padding: 20, gap: 16, borderWidth: 1, borderColor: '#2F3336' },
  top:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub:       { color: '#555', fontSize: 12, marginTop: 2 },
  ring:      { width: 76, height: 76, borderRadius: 38, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  ringNum:   { fontSize: 22, fontWeight: '800' },
  ringLabel: { color: '#888', fontSize: 10, marginTop: -2 },
  bars:      { gap: 12 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel:  { color: '#888', fontSize: 12, width: 120 },
  track:     { flex: 1, height: 4, backgroundColor: '#2F3336', borderRadius: 2, overflow: 'hidden' },
  fill:      { height: '100%', backgroundColor: '#E8003D', borderRadius: 2 },
  pct:       { color: '#E8003D', fontSize: 12, fontWeight: '700', width: 34, textAlign: 'right' },
});

// ─── Main screen ───────────────────────────────────────────────────────────
export default function ProfileScreen({ route, navigation }) {
  const { profileUser, bondUserId, compatibilityScore, scoreBreakdown } = route.params || {};
  const socket        = getSocket();
  const isOwnProfile  = profileUser?.socketId === socket.id;

  const [bondProfile, setBondProfile] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [loadingBond, setLoadingBond] = useState(false);
  const [following,   setFollowing]   = useState(false);
  const [followCounts,setFollowCounts]= useState({ followers: 0, following: 0 });
  const [connecting,  setConnecting]  = useState(false);
  const [connected,   setConnected]   = useState(false);

  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchBondProfile() {
      if (!bondUserId) return;
      setLoadingBond(true);
      try {
        const token = await getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [pRes, eRes] = await Promise.allSettled([
          axios.get(`${SERVER_URL}/api/profiles/${bondUserId}`, { headers, timeout: 8000 }),
          axios.get(`${SERVER_URL}/api/experiences`, { params: { userId: bondUserId }, headers, timeout: 8000 }),
        ]);
        if (pRes.status === 'fulfilled') setBondProfile(pRes.value.data);
        if (eRes.status === 'fulfilled') setExperiences(eRes.value.data.filter(e => e.user_id === bondUserId));
      } catch {}
      finally {
        setLoadingBond(false);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        ]).start();
      }
    }
    fetchBondProfile();
  }, [bondUserId]);

  useEffect(() => {
    if (!bondUserId) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  useEffect(() => {
    const targetId = bondUserId || profileUser?.userId || profileUser?.user_id;
    if (!isOwnProfile && targetId) {
      const emit = () => socket.emit('get_follow_status', { targetUserId: targetId });
      if (socket.connected) emit();
      else socket.once('connect', emit);
    }
    function onFollowStatus({ targetUserId, following: f, followersCount: fc, followingCount: fgc }) {
      const targetId = bondUserId || profileUser?.userId || profileUser?.user_id;
      if (targetUserId === targetId) {
        setFollowing(f);
        setFollowCounts({ followers: fc ?? 0, following: fgc ?? 0 });
      }
    }
    socket.on('follow_status', onFollowStatus);
    return () => socket.off('follow_status', onFollowStatus);
  }, [bondUserId, profileUser?.userId]);

  function toggleFollow() {
    const targetId = bondUserId || profileUser?.userId || profileUser?.user_id;
    if (!targetId) return;
    socket.emit(following ? 'unfollow_user' : 'follow_user', { targetUserId: targetId });
    setFollowing(f => !f);
    setFollowCounts(c => ({
      ...c,
      followers: following ? c.followers - 1 : c.followers + 1,
    }));
  }

  async function handleConnect() {
    if (!bondUserId) return Alert.alert('Unavailable', 'Full Bond profile not loaded yet.');
    setConnecting(true);
    try {
      const token = await getAccessToken();
      const ct = (bondProfile?.connection_types || [])[0] || 'friendship';
      await axios.post(`${SERVER_URL}/api/matches`, {
        targetUserId: bondUserId, connectionType: ct,
      }, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
      setConnected(true);
      Alert.alert('Connected! 🎉', `You're now bonded with ${displayName}.`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not connect. Try again.';
      if (msg.includes('already')) setConnected(true);
      else Alert.alert('Error', msg);
    } finally { setConnecting(false); }
  }

  function openChat() {
    if (!bondUserId) return;
    navigation.navigate('Chat', {
      otherUser: {
        userId:       bondUserId,
        display_name: displayName,
        photo_url:    bondProfile?.photo_url || null,
        socketId:     profileUser?.socketId,
      },
      currentUser: { socketId: socket.id },
    });
  }

  const displayName        = bondProfile?.display_name || profileUser?.username || 'Unknown';
  const avatarColor        = stringToColor(displayName);
  const reliability        = getReliability(bondProfile?.ghost_score);
  const hasSocials         = Object.values(profileUser?.socials || {}).some(v => v?.trim());
  const connectionTypesData = (bondProfile?.connection_types || [])
    .map(key => CONNECTION_TYPES.find(c => c.key === key)).filter(Boolean);
  const hasPhoto = !!(bondProfile?.photo_url);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── Full-bleed cover photo ─────────────────────── */}
        <View style={styles.cover}>
          {hasPhoto ? (
            <Image source={{ uri: bondProfile.photo_url }} style={styles.coverImg} />
          ) : (
            <LinearGradient colors={[avatarColor + 'cc', avatarColor + '33', '#000000']} style={styles.coverImg}>
              <Text style={styles.coverInitial}>{displayName[0]?.toUpperCase()}</Text>
            </LinearGradient>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'transparent', '#000000cc', '#000000']}
            style={styles.coverOverlay}
          />

          {/* Back button */}
          <SafeAreaView style={styles.backRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Identity block pinned to bottom of cover */}
          <View style={styles.coverBottom}>
            <Text style={styles.coverName}>
              {displayName}{bondProfile?.age ? `, ${bondProfile.age}` : ''}
            </Text>
            {bondProfile?.gender ? <Text style={styles.coverGender}>{bondProfile.gender}</Text> : null}
            <Text style={styles.coverLocation}>
              {[bondProfile?.city, bondProfile?.country || profileUser?.country].filter(Boolean).join(', ')}
            </Text>

            {bondProfile?.ghost_score ? (
              <View style={[styles.relBadge, { backgroundColor: reliability.color + '22', borderColor: reliability.color + '55' }]}>
                <Text style={{ fontSize: 12 }}>{reliability.emoji}</Text>
                <Text style={[styles.relBadgeText, { color: reliability.color }]}>{reliability.label} responder</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Body content ──────────────────────────────────── */}
        <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Follow / stats row */}
          <View style={styles.followRow}>
            <View style={styles.followStat}>
              <Text style={styles.followNum}>{followCounts.followers}</Text>
              <Text style={styles.followLabel}>Followers</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followStat}>
              <Text style={styles.followNum}>{followCounts.following}</Text>
              <Text style={styles.followLabel}>Following</Text>
            </View>
            {!isOwnProfile && (
              <>
                <View style={styles.followDivider} />
                <TouchableOpacity
                  style={[styles.followBtn, following && styles.followBtnActive]}
                  onPress={toggleFollow}
                >
                  <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                    {following ? '✓ Following' : '+ Follow'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {loadingBond && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#E8003D" size="small" />
              <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
          )}

          {/* Connection types */}
          {connectionTypesData.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Here For</Text>
              <View style={styles.ctWrap}>
                {connectionTypesData.map(ct => (
                  <View key={ct.key} style={[styles.ctBadge, { backgroundColor: ct.color + '18', borderColor: ct.color + '55' }]}>
                    <Text style={{ fontSize: 16 }}>{ct.emoji}</Text>
                    <Text style={[styles.ctLabel, { color: ct.color }]}>{ct.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Voice note */}
          {bondProfile?.voice_note_url && (
            <View style={styles.section}>
              <VoiceNotePlayer url={bondProfile.voice_note_url} />
            </View>
          )}

          {/* Bio */}
          {bondProfile?.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{bondProfile.bio}</Text>
              </View>
            </View>
          )}

          {/* Compatibility */}
          {(compatibilityScore != null || scoreBreakdown) && (
            <View style={styles.section}>
              <CompatBreakdown score={compatibilityScore} breakdown={scoreBreakdown} />
            </View>
          )}

          {/* Experiences */}
          {experiences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Their Experiences</Text>
              {experiences.map(exp => {
                const ct = CONNECTION_TYPES.find(c => c.key === exp.connection_type);
                return (
                  <View key={exp.id} style={styles.expCard}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                      {ct && (
                        <View style={[styles.expIcon, { backgroundColor: ct.color + '20' }]}>
                          <Text style={{ fontSize: 20 }}>{ct.emoji}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.expTitle}>{exp.title}</Text>
                        {exp.description ? (
                          <Text style={styles.expDesc} numberOfLines={2}>{exp.description}</Text>
                        ) : null}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.interestBtn}
                      onPress={async () => {
                        try {
                          const token = await getAccessToken();
                          await axios.post(`${SERVER_URL}/api/experiences/${exp.id}/apply`, { message: '' }, {
                            headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
                          });
                          Alert.alert('Interest sent!', `${displayName} will see your interest.`);
                        } catch (err) {
                          Alert.alert('Error', err.response?.data?.error || 'Could not apply');
                        }
                      }}
                    >
                      <Text style={styles.interestBtnText}>Show Interest</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Social links */}
          {hasSocials && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Socials</Text>
              {SOCIAL_PLATFORMS.map(p => {
                const handle = profileUser?.socials?.[p.key];
                if (!handle?.trim()) return null;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={styles.socialCard}
                    onPress={() => Linking.openURL(p.baseUrl + handle.replace('@', '').trim())}
                  >
                    <Text style={styles.socialIcon}>{p.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatform}>{p.label}</Text>
                      <Text style={styles.socialHandle}>{handle}</Text>
                    </View>
                    <Text style={styles.socialArrow}>↗</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Bottom spacer for action bar */}
          <View style={{ height: 110 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Floating action bar ──────────────────────────────── */}
      {!isOwnProfile && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.messageBtn} onPress={openChat}>
            <Text style={styles.messageBtnText}>💬  Message</Text>
          </TouchableOpacity>

          {bondUserId && (
            connected ? (
              <View style={styles.bondedBtn}>
                <Text style={styles.bondedBtnText}>✓ Bonded</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#E8003D', '#C7003A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.bondBtn}
              >
                <TouchableOpacity
                  onPress={handleConnect}
                  disabled={connecting}
                  style={styles.bondBtnInner}
                >
                  {connecting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.bondBtnText}>Bond with them 🌍</Text>
                  }
                </TouchableOpacity>
              </LinearGradient>
            )
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000000' },
  scroll:          { paddingBottom: 0 },

  cover:           { width, height: COVER_HEIGHT, position: 'relative', justifyContent: 'flex-end' },
  coverImg:        { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  coverInitial:    { color: '#fff', fontSize: 100, fontWeight: '800', opacity: 0.6 },
  coverOverlay:    { position: 'absolute', width: '100%', height: '100%' },
  backRow:         { position: 'absolute', top: 0, left: 0, right: 0 },
  backBtn:         { margin: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
  backIcon:        { color: '#fff', fontSize: 22, fontWeight: '300' },

  coverBottom:     { paddingHorizontal: 20, paddingBottom: 20, gap: 4 },
  coverName:       { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  coverGender:     { color: '#ffffff88', fontSize: 14 },
  coverLocation:   { color: '#ffffff66', fontSize: 14 },
  relBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginTop: 6 },
  relBadgeText:    { fontSize: 12, fontWeight: '700' },

  body:            { paddingTop: 20, gap: 28, paddingHorizontal: 20 },

  followRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1F23', borderRadius: 18, padding: 16, gap: 16, borderWidth: 1, borderColor: '#2F3336' },
  followStat:      { alignItems: 'center', gap: 2 },
  followNum:       { color: '#fff', fontSize: 20, fontWeight: '800' },
  followLabel:     { color: '#555', fontSize: 11 },
  followDivider:   { width: 1, height: 32, backgroundColor: '#2F3336' },
  followBtn:       { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8003D' },
  followBtnActive: { backgroundColor: '#E8003D20' },
  followBtnText:   { color: '#E8003D', fontSize: 13, fontWeight: '700' },
  followBtnTextActive: { color: '#E8003D' },

  loadingRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  loadingText:     { color: '#555', fontSize: 13 },

  section:         { gap: 12 },
  sectionTitle:    { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  ctWrap:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ctBadge:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 1 },
  ctLabel:         { fontSize: 13, fontWeight: '700' },

  bioCard:         { backgroundColor: '#1C1F23', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#2F3336' },
  bioText:         { color: '#ccc', fontSize: 15, lineHeight: 26 },

  expCard:         { backgroundColor: '#1C1F23', borderRadius: 18, padding: 16, gap: 14, borderWidth: 1, borderColor: '#2F3336' },
  expIcon:         { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expTitle:        { color: '#fff', fontSize: 15, fontWeight: '700' },
  expDesc:         { color: '#666', fontSize: 13, marginTop: 4, lineHeight: 18 },
  interestBtn:     { backgroundColor: '#E8003D', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  interestBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  socialCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1F23', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2F3336', gap: 12 },
  socialIcon:      { fontSize: 26 },
  socialPlatform:  { color: '#555', fontSize: 11, marginBottom: 2 },
  socialHandle:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  socialArrow:     { color: '#E8003D', fontSize: 20, fontWeight: '700' },

  actionBar:       { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 34, backgroundColor: '#000000f2', borderTopWidth: 1, borderTopColor: '#1C1F23' },
  messageBtn:      { flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8003D' },
  messageBtnText:  { color: '#E8003D', fontSize: 14, fontWeight: '700' },
  bondBtn:         { flex: 2, borderRadius: 18, overflow: 'hidden' },
  bondBtnInner:    { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  bondBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  bondedBtn:       { flex: 2, paddingVertical: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#57f28720', borderWidth: 1, borderColor: '#57f287' },
  bondedBtnText:   { color: '#57f287', fontSize: 15, fontWeight: '700' },
});
