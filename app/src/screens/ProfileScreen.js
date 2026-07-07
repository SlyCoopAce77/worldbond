import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, Alert, ActivityIndicator,
  Animated, Linking, Dimensions, Modal, TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { getAccessToken } from '../services/authApi';
import { SERVER_URL } from '../services/socket';
import { getCountryFlag } from '../utils/countryUtils';
import { useBondPass } from '../context/PremiumContext';
import { stringToColor } from '../utils/apiUtils';
import { CONNECTION_TYPES } from '../utils/constants';
import GiftPicker from '../components/GiftPicker';
import { WorldMark } from '../components/BondLogo';

const BOND_PINK = '#FF0080';

const { width, height } = Dimensions.get('window');

const IMPRESSION_PROMPTS = [
  { key: 'give',   color: '#4fc3f7', prompt: 'One thing my country gave the world…'              },
  { key: 'draw',   color: '#81c784', prompt: 'What draws me to meeting new people…'              },
  { key: 'moment', color: '#ffb74d', prompt: 'The moment that left the biggest footprint on me…' },
];

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram',   baseUrl: 'https://instagram.com/' },
  { key: 'tiktok',    label: 'TikTok',      baseUrl: 'https://tiktok.com/@' },
  { key: 'twitter',   label: 'X / Twitter', baseUrl: 'https://x.com/' },
  { key: 'snapchat',  label: 'Snapchat',    baseUrl: 'https://snapchat.com/add/' },
  { key: 'youtube',   label: 'YouTube',     baseUrl: 'https://youtube.com/' },
];

function getReliability(score) {
  if (!score)       return { label: 'New',       color: '#888'    };
  if (score >= 4.5) return { label: 'Excellent', color: '#ffd700' };
  if (score >= 3.5) return { label: 'Great',     color: '#57f287' };
  if (score >= 2.5) return { label: 'Good',      color: '#57c4ff' };
  if (score >= 1.5) return { label: 'Fair',      color: '#fee75c' };
  return                   { label: 'Low',       color: '#f04747' };
}

// ─── Voice note player ─────────────────────────────────────────────────────
function VoiceNotePlayer({ url }) {
  const [loading,  setLoading]  = useState(true);
  const [playing,  setPlaying]  = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [loadErr,  setLoadErr]  = useState(false);
  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const bars     = useRef(Array.from({ length: 32 }, () => 4 + Math.random() * 24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!url) { setLoading(false); setLoadErr(true); return; }
    Sound.setCategory('Playback');
    const snd = new Sound(url, '', err => {
      if (err) { setLoadErr(true); setLoading(false); return; }
      setDuration(snd.getDuration());
      soundRef.current = snd;
      setLoading(false);
    });
    return () => {
      clearInterval(timerRef.current);
      soundRef.current?.release();
    };
  }, [url]);

  useEffect(() => {
    if (playing) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 450, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 450, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [playing]);

  function togglePlay() {
    const snd = soundRef.current;
    if (!snd || loading || loadErr) return;
    if (playing) {
      snd.pause();
      clearInterval(timerRef.current);
      setPlaying(false);
    } else {
      snd.play(success => {
        clearInterval(timerRef.current);
        setPlaying(false);
        if (success) { snd.setCurrentTime(0); setPosition(0); }
      });
      timerRef.current = setInterval(() => {
        snd.getCurrentTime(t => setPosition(t));
      }, 200);
      setPlaying(true);
    }
  }

  function fmt(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <View style={vStyles.section}>
      <Text style={vStyles.label}>Voice Note</Text>
      <View style={vStyles.container}>
        {loading ? (
          <ActivityIndicator color={BOND_PINK} style={{ marginRight: 12 }} />
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[vStyles.btn, playing && vStyles.btnActive]}
              onPress={togglePlay}
              disabled={loadErr}
            >
              {playing ? (
                <View style={vStyles.pauseIcon}>
                  <View style={vStyles.pauseBar} />
                  <View style={vStyles.pauseBar} />
                </View>
              ) : (
                <View style={vStyles.playIcon} />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
        <View style={vStyles.waveform}>
          {bars.map((h, i) => (
            <View key={i} style={[vStyles.bar, { height: h, opacity: playing ? 1 : 0.3 }]} />
          ))}
        </View>
        <Text style={vStyles.dur}>{loadErr ? '--:--' : fmt(playing ? position : duration)}</Text>
      </View>
      {!loadErr && <Text style={vStyles.hint}>Tap to hear their voice</Text>}
    </View>
  );
}
const vStyles = StyleSheet.create({
  section:   { gap: 10 },
  label:     { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: BOND_PINK + '12', borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: BOND_PINK + '30' },
  btn:       { width: 46, height: 46, borderRadius: 23, backgroundColor: BOND_PINK, alignItems: 'center', justifyContent: 'center' },
  btnActive: { backgroundColor: '#CC0060' },
  playIcon:  { width: 0, height: 0, borderTopWidth: 8, borderBottomWidth: 8, borderLeftWidth: 13, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 3 },
  pauseIcon: { flexDirection: 'row', gap: 4 },
  pauseBar:  { width: 4, height: 15, borderRadius: 2, backgroundColor: '#fff' },
  waveform:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 44 },
  bar:       { width: 3, borderRadius: 2, backgroundColor: BOND_PINK },
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
  fill:      { height: '100%', backgroundColor: BOND_PINK, borderRadius: 2 },
  pct:       { color: BOND_PINK, fontSize: 12, fontWeight: '700', width: 34, textAlign: 'right' },
});

// ─── Main screen ───────────────────────────────────────────────────────────
export default function ProfileScreen({ route, navigation }) {
  const { profileUser, bondUserId, compatibilityScore, scoreBreakdown } = route.params || {};
  const socket        = getSocket();
  const isOwnProfile  = profileUser?.socketId === socket.id;

  const [bondProfile, setBondProfile] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [loadingBond, setLoadingBond] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [following,        setFollowing]        = useState(false);
  const [followCounts,     setFollowCounts]     = useState({ followers: 0, following: 0 });
  const [countryFlagCount, setCountryFlagCount] = useState(null);
  const [connecting,       setConnecting]       = useState(false);
  const [connected,        setConnected]        = useState(false);
  const [viewingPhoto,     setViewingPhoto]     = useState(null);
  const [showBondSheet,    setShowBondSheet]    = useState(false);
  const [bondNote,         setBondNote]         = useState('');
  const [showGiftPicker,   setShowGiftPicker]   = useState(false);
  const [isLive,           setIsLive]           = useState(false);
  const [coverPhotoUrl,    setCoverPhotoUrl]    = useState(null);
  const [isBlocked,        setIsBlocked]        = useState(false);

  const { hasBondPass } = useBondPass();

  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchBondProfile() {
      if (!bondUserId) return;
      setLoadingBond(true);
      try {
        const token = await getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [pRes, eRes, bRes] = await Promise.allSettled([
          axios.get(`${SERVER_URL}/api/profiles/${bondUserId}`, { headers, timeout: 8000 }),
          axios.get(`${SERVER_URL}/api/experiences`, { params: { userId: bondUserId }, headers, timeout: 8000 }),
          axios.get(`${SERVER_URL}/api/profiles/blocks`, { headers, timeout: 8000 }),
        ]);
        if (pRes.status === 'fulfilled') setBondProfile(pRes.value.data);
        else { setProfileNotFound(true); }
        if (eRes.status === 'fulfilled') setExperiences(eRes.value.data.filter(e => e.user_id === bondUserId));
        if (bRes.status === 'fulfilled') {
          setIsBlocked(bRes.value.data.blocked.some(b => String(b.user_id) === String(bondUserId)));
        }
      } catch { setProfileNotFound(true); }
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

  // Check if this user is currently live
  useEffect(() => {
    const targetId = bondUserId || profileUser?.userId || profileUser?.user_id;
    function onStreams(streams) {
      setIsLive((streams || []).some(s =>
        s.hostId === targetId || s.hostUserId === targetId || s.userId === targetId
      ));
    }
    socket.on('live_streams', onStreams);
    if (socket.connected) socket.emit('get_live_streams');
    else socket.once('connect', () => socket.emit('get_live_streams'));
    return () => socket.off('live_streams', onStreams);
  }, [bondUserId, profileUser?.userId]);

  // Fetch flag count for this user's country
  useEffect(() => {
    const country = bondProfile?.country || profileUser?.country;
    if (!country) return;
    const emit = () => socket.emit('get_country_flag_count', { country });
    if (socket.connected) emit();
    else socket.once('connect', emit);
    function onFlagCount({ country: c, count }) {
      if (c === country) setCountryFlagCount(count);
    }
    socket.on('country_flag_count', onFlagCount);
    return () => socket.off('country_flag_count', onFlagCount);
  }, [bondProfile?.country, profileUser?.country]);

  function toggleFollow() {
    const targetId = bondUserId || profileUser?.userId || profileUser?.user_id;
    if (!targetId) return;
    socket.emit(following ? 'unfollow_user' : 'follow_user', {
      targetUserId: targetId,
    });
    setFollowing(f => !f);
    setFollowCounts(c => ({
      ...c,
      followers: following ? c.followers - 1 : c.followers + 1,
    }));
  }

  async function handleConnect(note = '') {
    if (!bondUserId) return Alert.alert('Unavailable', 'Full Bond profile not loaded yet.');
    setConnecting(true);
    setShowBondSheet(false);
    try {
      const token = await getAccessToken();
      const ct = (bondProfile?.connection_types || [])[0] || 'circle';
      await axios.post(`${SERVER_URL}/api/matches`, {
        targetUserId: bondUserId,
        connectionType: ct,
        note: note.trim() || undefined,
      }, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
      setConnected(true);
      setBondNote('');
      Alert.alert(
        'Bonded!',
        // The server creates this as an active connection immediately — no
        // acceptance step exists yet, so the copy shouldn't imply one.
        `You're now Bonded with ${displayName}.`,
      );
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not connect. Try again.';
      if (msg.includes('already')) setConnected(true);
      else Alert.alert('Error', msg);
    } finally { setConnecting(false); }
  }


  function sendGift(gift) {
    socket.emit('send_gift', { toSocketId: profileUser?.socketId, gift });
    setShowGiftPicker(false);
  }

  async function handleBlock() {
    const displayName = bondProfile?.display_name || profileUser?.username || 'this user';
    if (isBlocked) {
      Alert.alert('Unblock User', `Unblock ${displayName}? They will be able to appear in discovery again.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: async () => {
          try {
            const token = await getAccessToken();
            await axios.delete(`${SERVER_URL}/api/profiles/blocks/${bondUserId}`, { headers: { Authorization: `Bearer ${token}` } });
            setIsBlocked(false);
          } catch { Alert.alert('Error', 'Could not unblock. Try again.'); }
        }},
      ]);
    } else {
      Alert.alert('Block User', `Block ${displayName}? They will no longer appear in discovery and cannot message you.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: async () => {
          try {
            const token = await getAccessToken();
            await axios.post(`${SERVER_URL}/api/profiles/blocks/${bondUserId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setIsBlocked(true);
          } catch { Alert.alert('Error', 'Could not block. Try again.'); }
        }},
      ]);
    }
  }

  async function pickCoverPhoto() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.85 });
    if (!result.assets?.[0]) return;
    const asset = result.assets[0];
    try {
      const token = await getAccessToken();
      const form  = new FormData();
      form.append('photo',    { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'cover.jpg' });
      form.append('userId',   profileUser?.userId || '');
      form.append('username', displayName);
      form.append('country',  bondProfile?.country || profileUser?.country || '');
      form.append('language', 'en');
      const uploadRes = await fetch(`${SERVER_URL}/api/photos/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!uploadRes.ok) throw new Error('upload failed');
      const data = await uploadRes.json();
      await fetch(`${SERVER_URL}/api/profiles/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_photo_url: data.imageUrl }),
      });
      setCoverPhotoUrl(data.imageUrl);
    } catch { Alert.alert('Error', 'Could not upload cover. Try again.'); }
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
        {/* ── Banner ── */}
        <View style={styles.banner}>
          {(coverPhotoUrl || bondProfile?.cover_photo_url) ? (
            <Image source={{ uri: coverPhotoUrl || bondProfile.cover_photo_url }} style={styles.bannerBg} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#160020', '#0c0016', '#06000e', '#020006']} style={styles.bannerBg} />
          )}
          {/* Bottom fade into dark content */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.bannerFade} />

          {/* Back + live — top nav */}
          <SafeAreaView style={styles.bannerNav}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.bannerNavRight}>
              {isLive && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeTxt}>LIVE</Text>
                </View>
              )}
              {isOwnProfile ? (
                <TouchableOpacity style={styles.editCoverBtn} onPress={pickCoverPhoto} activeOpacity={0.8}>
                  <Text style={styles.editCoverDots}>•••</Text>
                </TouchableOpacity>
              ) : bondUserId ? (
                <TouchableOpacity
                  style={styles.editCoverBtn}
                  onPress={() => Alert.alert(
                    isBlocked ? 'Unblock User' : 'More Options',
                    undefined,
                    [
                      { text: isBlocked ? 'Unblock' : 'Block User', onPress: handleBlock },
                      { text: 'Cancel', style: 'cancel' },
                    ],
                  )}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editCoverDots}>•••</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </SafeAreaView>
        </View>

        {/* ── Avatar row — overlaps banner seam ── */}
        <View style={styles.avatarActionRow}>
          <View style={styles.avatarRing}>
            {bondProfile?.photo_url ? (
              <Image source={{ uri: bondProfile.photo_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#FF0080', '#CC0060']} style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
              </LinearGradient>
            )}
          </View>
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followBtn, { borderColor: BOND_PINK }, following && { backgroundColor: BOND_PINK + '22' }]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followBtnText, { color: BOND_PINK }]}>
                {following ? '✓ Bonded' : '+ Bond'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Profile info ── */}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.heroName} numberOfLines={1}>
              {displayName}{bondProfile?.age ? `, ${bondProfile.age}` : ''}
            </Text>
            {bondProfile?.is_id_verified && (
              <View style={styles.verifyBadge}>
                <Text style={styles.verifyTxt}>✓</Text>
              </View>
            )}
            {bondProfile?.has_bond_pass && (
              <View style={styles.bpBadge}>
                <Text style={styles.bpBadgeTxt}>✦ Bond Pass</Text>
              </View>
            )}
          </View>

          {(() => {
            const country = bondProfile?.country || profileUser?.country;
            const flag    = getCountryFlag(country);
            const parts   = [bondProfile?.city, country].filter(Boolean);
            if (!flag && !parts.length) return null;
            return <Text style={styles.heroLoc}>{parts.join(', ')} {flag}</Text>;
          })()}

          {bondProfile?.gender ? <Text style={styles.heroGender}>{bondProfile.gender}</Text> : null}

          {bondProfile?.ghost_score ? (
            <View style={[styles.relBadge, { backgroundColor: reliability.color + '22', borderColor: reliability.color + '55', marginTop: 4 }]}>
              <View style={[styles.relDot, { backgroundColor: reliability.color }]} />
              <Text style={[styles.relBadgeText, { color: reliability.color }]}>{reliability.label} responder</Text>
            </View>
          ) : null}
          {bondProfile?.is_online && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineTxt}>Online now</Text>
            </View>
          )}
        </View>

        {/* ── Twitter-style stats — sits just below profile info ── */}
        <View style={styles.twitterStats}>
          <View style={styles.twitterStat}>
            <Text style={styles.twitterStatNum}>{followCounts.followers}</Text>
            <Text style={styles.twitterStatLabel}> Bonds</Text>
          </View>
          <Text style={styles.twitterDot}>·</Text>
          <View style={styles.twitterStat}>
            <Text style={styles.twitterStatNum}>{followCounts.following}</Text>
            <Text style={styles.twitterStatLabel}> Bonding</Text>
          </View>
          <Text style={styles.twitterDot}>·</Text>
          <View style={styles.twitterStat}>
            <Text style={styles.twitterStatNum}>{countryFlagCount ?? '—'}</Text>
            <Text style={styles.twitterStatLabel}> Countries</Text>
          </View>
          {hasBondPass && bondProfile?.rank != null && (
            <>
              <Text style={styles.twitterDot}>·</Text>
              <View style={styles.twitterStat}>
                <Text style={[styles.twitterStatNum, { color: '#FFB700' }]}>#{bondProfile.rank}</Text>
                <Text style={styles.twitterStatLabel}> Rank</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Body content ──────────────────────────────────── */}
        <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {loadingBond && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={BOND_PINK} size="small" />
              <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
          )}

          {profileNotFound && !loadingBond && (
            <View style={styles.notFoundCard}>
              <Text style={styles.notFoundText}>Profile not available</Text>
            </View>
          )}

          {!loadingBond && !profileNotFound && (
            <>
              {/* Voice note */}
              {bondProfile?.voice_note_url && (
                <VoiceNotePlayer url={bondProfile.voice_note_url} />
              )}

              {/* About */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.bioCard}>
                  {bondProfile?.bio ? (
                    <Text style={styles.bioText}>{bondProfile.bio}</Text>
                  ) : (
                    <Text style={styles.bioEmpty}>No bio added yet</Text>
                  )}
                </View>
              </View>

              {/* World Impressions */}
              {IMPRESSION_PROMPTS.some(p => bondProfile?.impressions?.[p.key]) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>World Impressions</Text>
                  {IMPRESSION_PROMPTS.map(p => {
                    const answer = bondProfile?.impressions?.[p.key];
                    if (!answer?.trim()) return null;
                    return (
                      <View key={p.key} style={styles.impressionCard}>
                        <View style={[styles.impressionBar, { backgroundColor: p.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.impressionPrompt}>{p.prompt}</Text>
                          <Text style={styles.impressionAnswer}>{answer}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Here For */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Here For</Text>
                {connectionTypesData.length > 0 ? (
                  <View style={styles.ctWrap}>
                    {connectionTypesData.map(ct => (
                      <View key={ct.key} style={[styles.ctBadge, { backgroundColor: ct.color + '18', borderColor: ct.color + '55' }]}>
                        <View style={[styles.relDot, { backgroundColor: ct.color }]} />
                        <Text style={[styles.ctLabel, { color: ct.color }]}>{ct.label}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>Nothing specified yet</Text>
                  </View>
                )}
              </View>

              {/* Countries Bonded */}
              {(bondProfile?.stamps || []).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Countries Bonded</Text>
                  <View style={styles.stampWrap}>
                    {bondProfile.stamps.slice(0, 20).map((flag, i) => (
                      <Text key={i} style={styles.stampFlag}>{flag}</Text>
                    ))}
                    {bondProfile.stamps.length > 20 && (
                      <View style={styles.stampMore}>
                        <Text style={styles.stampMoreTxt}>+{bondProfile.stamps.length - 20}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Photos */}
              {(bondProfile?.gallery_photos || []).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Photos</Text>
                  <View style={styles.galleryGrid}>
                    {bondProfile.gallery_photos.map((url, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.gallerySlot}
                        onPress={() => setViewingPhoto(url)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: url }} style={styles.galleryImg} />
                      </TouchableOpacity>
                    ))}
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
                  <Text style={styles.sectionTitle}>Experiences</Text>
                  {experiences.map(exp => {
                    const ct = CONNECTION_TYPES.find(c => c.key === exp.connection_type);
                    return (
                      <View key={exp.id} style={styles.expCard}>
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                          {ct && (
                            <View style={[styles.expIcon, { backgroundColor: ct.color + '20' }]}>
                              <View style={[styles.relDot, { backgroundColor: ct.color, width: 10, height: 10, borderRadius: 5 }]} />
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
                        <View style={styles.socialBadge}>
                          <Text style={styles.socialBadgeTxt}>{p.label[0]}</Text>
                        </View>
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
            </>
          )}

          {/* Bottom spacer for action bar */}
          <View style={{ height: 110 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Full-screen photo viewer ─────────────────────────── */}
      <Modal visible={!!viewingPhoto} transparent animationType="fade" onRequestClose={() => setViewingPhoto(null)}>
        <View style={styles.photoModal}>
          <Image source={{ uri: viewingPhoto }} style={styles.photoModalImg} resizeMode="contain" />
          <TouchableOpacity style={styles.photoModalClose} onPress={() => setViewingPhoto(null)}>
            <Text style={styles.photoModalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Floating action bar ──────────────────────────────── */}
      {!isOwnProfile && (
        <View style={styles.actionBar}>

          {/* Bond Gift button */}
          <TouchableOpacity
            style={styles.giftActionBtn}
            onPress={() => setShowGiftPicker(true)}
            activeOpacity={0.8}
          >
            <WorldMark size={18} color="#FFB700" bondColor="#FFB700" />
            <Text style={styles.giftActionTxt}>Gift</Text>
          </TouchableOpacity>

          {/* Message button */}
          {bondUserId && (
            <TouchableOpacity
              style={styles.messageActionBtn}
              onPress={() => navigation.navigate('Chat', {
                otherUser: { ...profileUser, userId: bondUserId || profileUser?.userId || profileUser?.user_id },
                currentUser: null,
              })}
              activeOpacity={0.8}
            >
              <Text style={styles.messageActionTxt}>Message</Text>
            </TouchableOpacity>
          )}

          {/* Bond button */}
          {bondUserId && (
            connected ? (
              <View style={styles.bondedBtn}>
                <Text style={styles.bondedBtnText}>✓ Bonded</Text>
              </View>
            ) : (
              <LinearGradient
                colors={[BOND_PINK, '#CC0060']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.bondBtn}
              >
                <TouchableOpacity
                  onPress={() => hasBondPass ? setShowBondSheet(true) : handleConnect()}
                  disabled={connecting}
                  style={styles.bondBtnInner}
                >
                  {connecting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.bondBtnText}>Bond</Text>
                  }
                </TouchableOpacity>
              </LinearGradient>
            )
          )}
        </View>
      )}

      {/* ── Bond Request Sheet (Plus / Pro) ─────────────────────────── */}
      <Modal
        visible={showBondSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBondSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowBondSheet(false)}
        />
        <View style={styles.bondSheet}>
          {/* Sheet handle */}
          <View style={styles.sheetHandle} />

          {/* Bond Pass badge header */}
          <View style={[styles.sheetTierBadge, { backgroundColor: BOND_PINK + '22', borderColor: BOND_PINK + '55' }]}>
            <Text style={[styles.sheetTierLabel, { color: BOND_PINK }]}>Bond Pass</Text>
          </View>

          <Text style={styles.sheetTitle}>Send a Bond Request</Text>
          <Text style={styles.sheetSub}>
            Introduce yourself to <Text style={{ color: '#fff', fontWeight: '700' }}>{displayName}</Text>
          </Text>

          {/* Note input */}
          <View style={[styles.sheetInputWrap, { borderColor: BOND_PINK + '55' }]}>
            <TextInput
              style={styles.sheetInput}
              placeholder="Write a personal note… (150 chars)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={bondNote}
              onChangeText={t => setBondNote(t.slice(0, 150))}
              multiline
              maxLength={150}
            />
            <Text style={styles.sheetCharCount}>
              {bondNote.length}/150
            </Text>
          </View>

          {/* Send button */}
          <LinearGradient
            colors={[BOND_PINK, '#CC0060']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.sheetSendBtn}
          >
            <TouchableOpacity
              style={styles.sheetSendInner}
              onPress={() => handleConnect(bondNote)}
              disabled={connecting}
            >
              {connecting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.sheetSendTxt}>Send Bond</Text>
              }
            </TouchableOpacity>
          </LinearGradient>

          {/* Skip note option */}
          <TouchableOpacity style={styles.sheetSkip} onPress={() => handleConnect('')}>
            <Text style={styles.sheetSkipTxt}>Send without a note</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Bond Gift Picker ── */}
      <GiftPicker
        visible={showGiftPicker}
        onClose={() => setShowGiftPicker(false)}
        onSend={sendGift}
        hostName={displayName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000000' },
  scroll:          { paddingBottom: 0 },

  // ── Banner ──
  banner:          { height: 190, overflow: 'hidden', backgroundColor: '#05000a' },
  bannerBg:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bannerFade:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 },
  bannerNav:       { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  bannerNavRight:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 14 },
  backBtn:         { margin: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backIcon:        { color: '#fff', fontSize: 20, fontWeight: '300' },
  liveBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeTxt:    { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  editCoverBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  editCoverDots:   { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },

  // ── Avatar action row — overlaps banner seam ──
  avatarActionRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -42, paddingBottom: 10 },
  avatarRing:      { width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: '#000', backgroundColor: '#000', overflow: 'hidden' },
  avatar:          { width: '100%', height: '100%' },
  avatarFallback:  { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:   { color: '#fff', fontSize: 32, fontWeight: '900' },

  // ── Profile info ──
  profileInfo:     { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, gap: 4 },
  nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  heroName:        { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  heroLoc:         { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  heroGender:      { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  verifyBadge:     { width: 20, height: 20, borderRadius: 10, backgroundColor: '#1d9bf0', alignItems: 'center', justifyContent: 'center' },
  verifyTxt:       { color: '#fff', fontSize: 10, fontWeight: '900' },
  bpBadge:         { flexDirection: 'row', alignItems: 'center', backgroundColor: BOND_PINK + '18', borderRadius: 8, borderWidth: 1, borderColor: BOND_PINK + '55', paddingHorizontal: 8, paddingVertical: 3 },
  bpBadgeTxt:      { color: BOND_PINK, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  relBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginTop: 4 },
  relBadgeText:    { fontSize: 12, fontWeight: '700' },
  relDot:          { width: 7, height: 7, borderRadius: 4 },

  body:            { paddingTop: 0, gap: 24, paddingHorizontal: 16 },

  galleryGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gallerySlot:      { width: (width - 40 - 16) / 3, aspectRatio: 1, borderRadius: 16, overflow: 'hidden' },
  galleryImg:       { width: '100%', height: '100%' },

  photoModal:          { flex: 1, backgroundColor: '#000000f2', alignItems: 'center', justifyContent: 'center' },
  photoModalImg:       { width, height: width },
  photoModalClose:     { position: 'absolute', top: 60, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff18', borderWidth: 1, borderColor: '#ffffff30', alignItems: 'center', justifyContent: 'center' },
  photoModalCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Twitter-style inline stats
  twitterStats:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 2 },
  twitterStat:     { flexDirection: 'row', alignItems: 'baseline' },
  twitterStatNum:  { color: '#fff', fontSize: 15, fontWeight: '800' },
  twitterStatLabel:{ color: 'rgba(255,255,255,0.42)', fontSize: 14, fontWeight: '400' },
  twitterDot:      { color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: '300' },

  followBtn:       { paddingVertical: 9, paddingHorizontal: 22, borderRadius: 20, alignItems: 'center', borderWidth: 1.5 },
  followBtnText:   { fontSize: 13, fontWeight: '800' },

  loadingRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  loadingText:     { color: '#555', fontSize: 13 },

  notFoundCard:    { alignItems: 'center', gap: 10, paddingVertical: 32 },
  notFoundText:    { color: '#444', fontSize: 14 },

  section:         { gap: 10 },
  sectionTitle:    { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },

  ctWrap:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ctBadge:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1 },
  ctLabel:         { fontSize: 13, fontWeight: '700' },

  emptyRow:        { backgroundColor: '#111316', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#222527', alignItems: 'center' },
  emptyText:       { color: '#3a3f44', fontSize: 14, fontStyle: 'italic' },

  bioCard:         { backgroundColor: '#111316', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#222527' },
  bioText:         { color: '#bbb', fontSize: 15, lineHeight: 26 },
  bioEmpty:        { color: '#3a3f44', fontSize: 15, lineHeight: 26, fontStyle: 'italic' },

  expCard:         { backgroundColor: '#111316', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#222527' },
  expIcon:         { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expTitle:        { color: '#fff', fontSize: 15, fontWeight: '700' },
  expDesc:         { color: '#666', fontSize: 13, marginTop: 4, lineHeight: 18 },
  interestBtn:     { backgroundColor: BOND_PINK, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  interestBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  socialCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111316', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#222527', gap: 12 },
  socialBadge:     { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1e2128', alignItems: 'center', justifyContent: 'center' },
  socialBadgeTxt:  { color: '#888', fontSize: 15, fontWeight: '800' },
  socialPlatform:  { color: '#555', fontSize: 11, marginBottom: 2 },
  socialHandle:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  socialArrow:     { color: BOND_PINK, fontSize: 20, fontWeight: '700' },

  actionBar:       { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 34, backgroundColor: '#000000f2', borderTopWidth: 1, borderTopColor: '#1C1F23' },
  giftActionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, backgroundColor: 'rgba(255,183,0,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,183,0,0.3)' },
  giftActionTxt:   { color: '#FFB700', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  bondBtn:         { flex: 1, borderRadius: 18, overflow: 'hidden' },
  bondBtnInner:    { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  bondBtnText:     { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  bondedBtn:       { flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#57f28720', borderWidth: 1, borderColor: '#57f287' },
  bondedBtnText:   { color: '#57f287', fontSize: 15, fontWeight: '700' },

  // Online badge
  onlineBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 2 },
  onlineDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: '#57f287' },
  onlineTxt:        { color: '#57f287', fontSize: 12, fontWeight: '600' },

  // Stamps
  stampWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stampFlag:        { fontSize: 28 },
  stampMore:        { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1C1F23', borderWidth: 1, borderColor: '#2F3336', alignItems: 'center', justifyContent: 'center' },
  stampMoreTxt:     { color: '#888', fontSize: 11, fontWeight: '700' },

  // World Impressions
  impressionCard:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#111316', borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: '#222527' },
  impressionBar:    { width: 3, borderRadius: 2, alignSelf: 'stretch', minHeight: 36 },
  impressionPrompt: { color: '#555', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  impressionAnswer: { color: '#ccc', fontSize: 14, lineHeight: 20 },

  // Message action button
  messageActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  messageActionTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Bond Request Sheet
  sheetOverlay:    { flex: 1, backgroundColor: '#000000aa' },
  bondSheet:       { backgroundColor: '#0d0f14', borderTopLeftRadius: 28, borderTopRightRadius: 28,
                     paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12, gap: 16,
                     borderTopWidth: 1, borderColor: '#1e2028' },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginBottom: 8 },
  sheetTierBadge:  { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                     paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  sheetTierLabel:  { fontSize: 13, fontWeight: '800' },

  sheetTitle:      { color: '#fff', fontSize: 20, fontWeight: '900' },
  sheetSub:        { color: '#666', fontSize: 14, lineHeight: 20 },
  sheetInputWrap:  { backgroundColor: '#111318', borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  sheetInput:      { color: '#fff', fontSize: 15, lineHeight: 22, minHeight: 80, textAlignVertical: 'top' },
  sheetCharCount:  { color: '#333', fontSize: 11, textAlign: 'right' },
  sheetSendBtn:    { borderRadius: 18, overflow: 'hidden' },
  sheetSendInner:  { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  sheetSendTxt:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  sheetSkip:       { alignItems: 'center', paddingVertical: 8 },
  sheetSkipTxt:    { color: '#444', fontSize: 13 },
});
