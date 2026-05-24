import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, FlatList,
  TouchableOpacity, TextInput, Modal, Image, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { logout, getAccessToken } from '../services/authApi';
import { SERVER_URL } from '../services/socket';
import { usePremium, TIERS } from '../context/PremiumContext';

const { width } = Dimensions.get('window');

const CONNECTION_TYPES = [
  { key: 'dating',     emoji: '❤️',  label: 'Dating',           color: '#e91e63' },
  { key: 'friendship', emoji: '🤝',  label: 'Friendship',       color: '#2196f3' },
  { key: 'travel',     emoji: '✈️',  label: 'Travel Buddy',     color: '#ff9800' },
  { key: 'language',   emoji: '💬',  label: 'Language Exchange', color: '#9c27b0' },
  { key: 'mentorship', emoji: '🎓',  label: 'Mentorship',       color: '#4caf50' },
];

const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ja', flag: '🇯🇵', label: 'Japanese' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'ko', flag: '🇰🇷', label: 'Korean' },
  { code: 'zh', flag: '🇨🇳', label: 'Chinese' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'pt', flag: '🇧🇷', label: 'Portuguese' },
  { code: 'th', flag: '🇹🇭', label: 'Thai' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic' },
  { code: 'hi', flag: '🇮🇳', label: 'Hindi' },
  { code: 'id', flag: '🇮🇩', label: 'Indonesian' },
];

const MOODS = [
  { emoji: '😊', label: 'Happy' },   { emoji: '🔥', label: 'Hyped' },
  { emoji: '✈️', label: 'Traveling' },{ emoji: '🎵', label: 'Vibing' },
  { emoji: '📚', label: 'Studying' }, { emoji: '🍜', label: 'Eating' },
  { emoji: '💪', label: 'Training' }, { emoji: '🌙', label: 'Night owl' },
  { emoji: '☕', label: 'Chillin' },  { emoji: '🎨', label: 'Creating' },
];

const CULTURE_CATS = ['food', 'tradition', 'music', 'humor', 'language', 'places', 'daily life', 'celebration'];
const CULTURE_EMOJIS = ['🌍', '🍜', '🎵', '😂', '🏛️', '🗺️', '🎉', '🤝', '🏠', '👨‍👩‍👧‍👦', '🎭', '🌺'];

function completionPct(profile) {
  const fields = ['photo_url', 'voice_note_url', 'bio', 'age', 'city'];
  const filled = fields.filter(f => profile?.[f]).length;
  const hasTypes = (profile?.connection_types || []).length > 0;
  return Math.round(((filled + (hasTypes ? 1 : 0)) / (fields.length + 1)) * 100);
}

function getReliability(score) {
  if (!score) return { label: 'New', color: '#888', pct: 0 };
  const pct = ((score - 1) / 4) * 100;
  if (score >= 4.5) return { label: 'Excellent', color: '#ffd700', pct };
  if (score >= 3.5) return { label: 'Great',     color: '#57f287', pct };
  if (score >= 2.5) return { label: 'Good',      color: '#57c4ff', pct };
  if (score >= 1.5) return { label: 'Fair',      color: '#fee75c', pct };
  return               { label: 'Low',       color: '#f04747', pct };
}

// ─── Voice note player ────────────────────────────────────────────────────────
function VoiceNotePlayer({ url }) {
  const [playing, setPlaying] = useState(false);
  const bars = useRef(Array.from({ length: 30 }, () => 4 + Math.random() * 22)).current;
  return (
    <TouchableOpacity
      style={vStyles.container}
      onPress={() => setPlaying(p => !p)}
      activeOpacity={0.85}
    >
      <View style={[vStyles.btn, playing && vStyles.btnActive]}>
        <Text style={vStyles.btnIcon}>{playing ? '⏸' : '▶'}</Text>
      </View>
      <View style={vStyles.waveform}>
        {bars.map((h, i) => (
          <View key={i} style={[vStyles.bar, { height: h, opacity: playing ? 1 : 0.35 }]} />
        ))}
      </View>
      <Text style={vStyles.dur}>0:30</Text>
    </TouchableOpacity>
  );
}
const vStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#5865f212', borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: '#5865f230' },
  btn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: '#5865f2', alignItems: 'center', justifyContent: 'center' },
  btnActive: { backgroundColor: '#4752c4' },
  btnIcon:   { color: '#fff', fontSize: 14 },
  waveform:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar:       { width: 3, borderRadius: 2, backgroundColor: '#5865f2' },
  dur:       { color: '#666', fontSize: 12 },
});

// ─── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({ visible, profile, onSave, onClose }) {
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && visible) {
      setForm({
        display_name:     profile.display_name || '',
        age:              profile.age ? String(profile.age) : '',
        city:             profile.city || '',
        bio:              profile.bio || '',
        language:         profile.language || 'en',
        connection_types: profile.connection_types || [],
      });
    }
  }, [profile, visible]);

  function toggleType(key) {
    setForm(f => ({
      ...f,
      connection_types: f.connection_types.includes(key)
        ? f.connection_types.filter(k => k !== key)
        : [...f.connection_types, key],
    }));
  }

  async function save() {
    if (!form.display_name?.trim()) return Alert.alert('Required', 'Display name cannot be empty');
    setSaving(true);
    try {
      await onSave({ ...form, age: form.age ? parseInt(form.age, 10) : undefined });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not save changes');
    } finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={eStyles.container}>
        <View style={eStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={eStyles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={eStyles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#5865f2" /> : <Text style={eStyles.save}>Save</Text>}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={eStyles.body} showsVerticalScrollIndicator={false}>

            <View style={eStyles.group}>
              <Text style={eStyles.label}>Display Name</Text>
              <TextInput
                style={eStyles.input}
                value={form.display_name}
                onChangeText={t => setForm(f => ({ ...f, display_name: t }))}
                maxLength={30} placeholderTextColor="#555"
              />
            </View>

            <View style={eStyles.row}>
              <View style={[eStyles.group, { flex: 1 }]}>
                <Text style={eStyles.label}>Age</Text>
                <TextInput
                  style={eStyles.input}
                  value={form.age}
                  onChangeText={t => setForm(f => ({ ...f, age: t }))}
                  keyboardType="number-pad" maxLength={3} placeholderTextColor="#555"
                />
              </View>
              <View style={[eStyles.group, { flex: 2 }]}>
                <Text style={eStyles.label}>City</Text>
                <TextInput
                  style={eStyles.input}
                  value={form.city}
                  onChangeText={t => setForm(f => ({ ...f, city: t }))}
                  placeholder="Your city" placeholderTextColor="#555"
                />
              </View>
            </View>

            <View style={eStyles.group}>
              <Text style={eStyles.label}>Bio <Text style={{ color: '#555', fontWeight: '400' }}>(optional)</Text></Text>
              <TextInput
                style={[eStyles.input, { minHeight: 90 }]}
                value={form.bio}
                onChangeText={t => setForm(f => ({ ...f, bio: t }))}
                placeholder="What makes you interesting?"
                placeholderTextColor="#555" multiline maxLength={200} textAlignVertical="top"
              />
              <Text style={{ color: '#555', fontSize: 11, textAlign: 'right' }}>{(form.bio || '').length}/200</Text>
            </View>

            <View style={eStyles.group}>
              <Text style={eStyles.label}>Primary Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {LANGUAGES.map(l => (
                  <TouchableOpacity
                    key={l.code}
                    style={[eStyles.chip, form.language === l.code && eStyles.chipOn]}
                    onPress={() => setForm(f => ({ ...f, language: l.code }))}
                  >
                    <Text>{l.flag}</Text>
                    <Text style={[eStyles.chipText, form.language === l.code && { color: '#5865f2', fontWeight: '700' }]}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={eStyles.group}>
              <Text style={eStyles.label}>Here For</Text>
              <View style={eStyles.ctGrid}>
                {CONNECTION_TYPES.map(ct => {
                  const on = form.connection_types?.includes(ct.key);
                  return (
                    <TouchableOpacity
                      key={ct.key}
                      style={[eStyles.ctCard, on && { borderColor: ct.color, backgroundColor: ct.color + '15' }]}
                      onPress={() => toggleType(ct.key)}
                    >
                      <Text style={{ fontSize: 18 }}>{ct.emoji}</Text>
                      <Text style={[eStyles.ctLabel, on && { color: ct.color }]}>{ct.label}</Text>
                      {on && <Text style={[{ fontSize: 11, fontWeight: '800', color: ct.color, marginLeft: 'auto' }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const eStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a18' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e1e38' },
  cancel:    { color: '#555', fontSize: 16, fontWeight: '600' },
  title:     { color: '#fff', fontSize: 18, fontWeight: '900' },
  save:      { color: '#5865f2', fontSize: 16, fontWeight: '800' },
  body:      { padding: 20, gap: 22, paddingBottom: 60 },
  row:       { flexDirection: 'row', gap: 12 },
  group:     { gap: 8 },
  label:     { color: '#555', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:     { backgroundColor: '#12122a', color: '#fff', fontSize: 15, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1e1e38' },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38' },
  chipOn:    { backgroundColor: '#5865f218', borderColor: '#5865f255' },
  chipText:  { color: '#666', fontSize: 13, fontWeight: '600' },
  ctGrid:    { gap: 10 },
  ctCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38' },
  ctLabel:   { color: '#666', fontSize: 14, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MyProfileScreen({ navigation, user, onLogout }) {
  const { tier, tierInfo, isPremium } = usePremium();
  const socket = getSocket();

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [myExps, setMyExps]         = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const [showEdit, setShowEdit]     = useState(false);
  const [tab, setTab]               = useState('bond');
  const [mood, setMoodState]        = useState(null);

  const [culturePosts, setCulturePosts] = useState([]);
  const [cultureText, setCultureText]   = useState('');
  const [cultureEmoji, setCultureEmoji] = useState('🌍');
  const [cultureCat, setCultureCat]     = useState('daily life');

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const loadData = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) { setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, eRes, mRes] = await Promise.allSettled([
        axios.get(`${SERVER_URL}/api/profiles/me`, { headers, timeout: 8000 }),
        axios.get(`${SERVER_URL}/api/experiences/mine`, { headers, timeout: 8000 }),
        axios.get(`${SERVER_URL}/api/matches`, { headers, timeout: 8000 }),
      ]);
      if (pRes.status === 'fulfilled') setProfile(pRes.value.data);
      if (eRes.status === 'fulfilled') setMyExps(eRes.value.data);
      if (mRes.status === 'fulfilled') setMatchCount(mRes.value.data.length);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    if (socket.connected) {
      socket.emit('get_cultural_posts');
    } else {
      socket.once('connect', () => socket.emit('get_cultural_posts'));
    }
    socket.on('cultural_posts', setCulturePosts);
    return () => socket.off('cultural_posts');
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  async function pickPhoto() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.85 });
    if (!result.assets?.[0]) return;
    const asset = result.assets[0];
    try {
      const token = await getAccessToken();
      const form  = new FormData();
      form.append('photo',    { uri: asset.uri, type: asset.type, name: asset.fileName || 'photo.jpg' });
      form.append('userId',   user?.userId || '');
      form.append('username', profile?.display_name || user?.username || '');
      form.append('country',  profile?.country || user?.country || '');
      form.append('language', profile?.language || 'en');
      const { data } = await axios.post(`${SERVER_URL}/api/photos/upload`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      await axios.put(`${SERVER_URL}/api/profiles/me`, { photo_url: data.imageUrl }, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
      });
      setProfile(p => ({ ...p, photo_url: data.imageUrl }));
    } catch {
      Alert.alert('Error', 'Could not upload photo. Try again.');
    }
  }

  async function saveProfile(updates) {
    const token = await getAccessToken();
    const { data } = await axios.put(`${SERVER_URL}/api/profiles/me`, updates, {
      headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
    });
    setProfile(data);
    if (updates.display_name || updates.language || updates.country) {
      const updated = { ...user, username: data.display_name, language: data.language, country: data.country };
      await AsyncStorage.setItem('worldbond_user', JSON.stringify(updated));
      socket.emit('register', updated);
    }
  }

  function setMood(m) {
    setMoodState(m);
    socket.emit('set_mood', { mood: m.emoji, status: m.label });
  }

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); onLogout?.(); } },
    ]);
  }

  function submitCulturePost() {
    if (!cultureText.trim()) return;
    socket.emit('submit_cultural_post', { text: cultureText.trim(), emoji: cultureEmoji, category: cultureCat });
    setCultureText('');
  }

  const pct         = completionPct(profile);
  const rel         = getReliability(profile?.ghost_score);
  const displayName = profile?.display_name || user?.username || 'You';
  const tierColor   = tierInfo?.color || '#5865f2';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>My Profile</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {[{ key: 'bond', label: '✨ Bond' }, { key: 'culture', label: '🌍 Culture' }].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'bond' && (
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── Hero banner ─────────────────────────────────── */}
          <View style={styles.heroBanner}>
            <LinearGradient
              colors={[tierColor + '55', tierColor + '22', '#0a0a18']}
              style={styles.bannerGradient}
            />

            <View style={styles.avatarArea}>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85}>
                <View style={[styles.avatarRing, { borderColor: tierColor }]}>
                  {profile?.photo_url ? (
                    <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
                  ) : (
                    <LinearGradient colors={[tierColor, tierColor + 'aa']} style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                </View>
                <View style={styles.cameraBtn}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
                {mood && (
                  <View style={styles.moodDot}>
                    <Text style={{ fontSize: 16 }}>{mood.emoji}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.heroName}>
              {displayName}{profile?.age ? `, ${profile.age}` : ''}
            </Text>
            {profile?.gender ? <Text style={styles.heroGender}>{profile.gender}</Text> : null}
            <Text style={styles.heroLocation}>
              {[profile?.city, profile?.country].filter(Boolean).join(', ') || user?.country || ''}
            </Text>

            <View style={[styles.tierPill, { borderColor: tierColor + '66', backgroundColor: tierColor + '15' }]}>
              <Text style={[styles.tierPillText, { color: tierColor }]}>
                {tier === 'free' ? '🆓 Bond Free' : tier === 'plus' ? '💜 Bond Plus' : '⭐ Bond Pro'}
              </Text>
            </View>
          </View>

          {/* ── Profile completion ───────────────────────────── */}
          {pct < 100 && (
            <TouchableOpacity style={styles.completionCard} onPress={() => setShowEdit(true)} activeOpacity={0.85}>
              <View style={styles.completionRow}>
                <Text style={styles.completionLabel}>Profile {pct}% complete</Text>
                <Text style={styles.completionHint}>Finish for 2× more matches →</Text>
              </View>
              <View style={styles.completionTrack}>
                <View style={[styles.completionFill, { width: `${pct}%` }]} />
              </View>
            </TouchableOpacity>
          )}

          {/* ── Stats row ────────────────────────────────────── */}
          <View style={styles.statsRow}>
            {[
              { emoji: '✨', value: matchCount,          label: 'Bonds' },
              { emoji: '🌟', value: myExps.length,       label: 'Experiences' },
              { emoji: '⭐', value: rel.label,            label: 'Reliability', color: rel.color },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={[styles.statValue, s.color && { color: s.color }]}>{s.value ?? '—'}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Go Live ─────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.goLiveRow}
            onPress={() => navigation.navigate('Live', { user: { username: profile?.display_name || user?.username, userId: user?.userId, photo_url: profile?.photo_url || user?.photo_url } })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#2a0a0a', '#1a0606']} style={styles.goLiveCard}>
              <View style={styles.goLiveBadge}>
                <View style={styles.goLiveDot} />
                <Text style={styles.goLiveBadgeText}>LIVE</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.goLiveTitle}>Go Live</Text>
                <Text style={styles.goLiveSub}>Broadcast to people around the world in real time</Text>
              </View>
              <Text style={styles.goLiveArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Voice note ───────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Note</Text>
            {profile?.voice_note_url ? (
              <VoiceNotePlayer url={profile.voice_note_url} />
            ) : (
              <View style={styles.voiceEmpty}>
                <Text style={{ fontSize: 36 }}>🎙️</Text>
                <Text style={styles.voiceEmptyTitle}>No voice note yet</Text>
                <Text style={styles.voiceEmptyHint}>Add one to get 2× more matches</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => Alert.alert('Coming soon', 'Voice recording will be available in the next update.')}
            >
              <Text style={styles.ghostBtnText}>🎙  {profile?.voice_note_url ? 'Record New Note' : 'Record Voice Note'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Reliability bar ──────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Reliability</Text>
              <Text style={[styles.relLabel, { color: rel.color }]}>{rel.label}</Text>
            </View>
            <View style={styles.relTrack}>
              <View style={[styles.relFill, { width: `${rel.pct}%`, backgroundColor: rel.color }]} />
            </View>
            <Text style={styles.relHint}>Based on how quickly you respond to matches</Text>
          </View>

          {/* ── Bio ──────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>About</Text>
              <TouchableOpacity onPress={() => setShowEdit(true)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            {profile?.bio ? (
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.dashedCard} onPress={() => setShowEdit(true)}>
                <Text style={styles.dashedCardText}>+ Add a bio</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Here For ─────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Here For</Text>
              <TouchableOpacity onPress={() => setShowEdit(true)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            {(profile?.connection_types || []).length > 0 ? (
              <View style={styles.ctWrap}>
                {profile.connection_types.map(key => {
                  const ct = CONNECTION_TYPES.find(c => c.key === key);
                  if (!ct) return null;
                  return (
                    <View key={key} style={[styles.ctBadge, { backgroundColor: ct.color + '18', borderColor: ct.color + '55' }]}>
                      <Text style={{ fontSize: 15 }}>{ct.emoji}</Text>
                      <Text style={[styles.ctBadgeText, { color: ct.color }]}>{ct.label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity style={styles.dashedCard} onPress={() => setShowEdit(true)}>
                <Text style={styles.dashedCardText}>+ Choose what you're here for</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Mood ─────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Right Now</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.emoji}
                  style={[styles.moodChip, mood?.emoji === m.emoji && styles.moodChipActive]}
                  onPress={() => setMood(m)}
                >
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                  <Text style={[styles.moodText, mood?.emoji === m.emoji && { color: '#5865f2' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── My Experiences ───────────────────────────────── */}
          {myExps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Experiences</Text>
              {myExps.map(exp => (
                <View key={exp.id} style={styles.expCard}>
                  <Text style={styles.expTitle}>{exp.title}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.expCat}>{exp.category}</Text>
                    <View style={[styles.expStatus, { backgroundColor: exp.status === 'active' ? '#57f28720' : '#88888820' }]}>
                      <Text style={[styles.expStatusText, { color: exp.status === 'active' ? '#57f287' : '#888' }]}>{exp.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Subscription card ────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            {isPremium ? (
              <LinearGradient
                colors={tier === 'pro' ? ['#1a1500', '#2a2000'] : ['#0d0f22', '#141726']}
                style={[styles.subCard, { borderColor: tierColor + '55' }]}
              >
                <View>
                  <Text style={[styles.subTierName, { color: tierColor }]}>
                    {tier === 'plus' ? '💜 Bond Plus' : '⭐ Bond Pro'}
                  </Text>
                  <Text style={styles.subPrice}>{tierInfo?.price}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.manageBtn, { backgroundColor: tierColor + '22', borderColor: tierColor + '66' }]}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Text style={[styles.manageBtnText, { color: tierColor }]}>Manage</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                style={styles.upgradeCard}
                onPress={() => navigation.navigate('Subscription')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#5865f2', '#4752c4']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.upgradeCardInner}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upgradeCardTitle}>Upgrade to Bond Plus</Text>
                    <Text style={styles.upgradeCardSub}>Unlimited gifts · See who viewed you · Priority listing</Text>
                  </View>
                  <Text style={styles.upgradeCardArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

        </Animated.ScrollView>
      )}

      {tab === 'culture' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.cultureForm}>
            <Text style={styles.cultureFormTitle}>🌍 Share something about your culture</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {CULTURE_EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, cultureEmoji === e && styles.emojiBtnOn]}
                  onPress={() => setCultureEmoji(e)}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CULTURE_CATS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, cultureCat === c && styles.catChipOn]}
                  onPress={() => setCultureCat(c)}
                >
                  <Text style={[styles.catChipText, cultureCat === c && { color: '#fff', fontWeight: '700' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.cultureInput}
              placeholder={`${cultureEmoji} Tell the world something about your culture...`}
              placeholderTextColor="#555"
              value={cultureText} onChangeText={setCultureText}
              multiline maxLength={280}
            />
            <TouchableOpacity
              style={[styles.postBtn, !cultureText.trim() && styles.postBtnOff]}
              onPress={submitCulturePost} disabled={!cultureText.trim()}
            >
              <Text style={styles.postBtnText}>Post to the World 🌍</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={culturePosts}
            keyExtractor={p => p.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}
            renderItem={({ item }) => (
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postUser}>{item.username} · {item.country}</Text>
                    <View style={styles.postCatBadge}>
                      <Text style={styles.postCatText}>{item.category}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => socket.emit('like_cultural_post', { postId: item.id })}
                    style={{ alignItems: 'center', gap: 2 }}
                  >
                    <Text style={{ fontSize: 18 }}>❤️</Text>
                    <Text style={{ color: '#e57373', fontSize: 11, fontWeight: '700' }}>{item.likes}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.postText}>{item.text}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: '#555', textAlign: 'center', marginTop: 40, fontSize: 15 }}>
                No posts yet — be the first! 🌍
              </Text>
            }
          />
        </ScrollView>
      )}

      <EditModal
        visible={showEdit}
        profile={profile}
        onSave={saveProfile}
        onClose={() => setShowEdit(false)}
      />

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color="#5865f2" size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0a0a18' },
  loadingOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0a18cc', alignItems: 'center', justifyContent: 'center' },

  topBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  topBarTitle:      { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  topBarActions:    { flexDirection: 'row', gap: 8 },
  editBtn:          { backgroundColor: '#5865f218', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#5865f240' },
  editBtnText:      { color: '#5865f2', fontSize: 13, fontWeight: '700' },
  logoutBtn:        { backgroundColor: '#e5393518', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e5393530' },
  logoutBtnText:    { color: '#e53935', fontSize: 13, fontWeight: '700' },
  settingsBtn:      { width: 38, height: 38, borderRadius: 12, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38', alignItems: 'center', justifyContent: 'center' },
  settingsBtnText:  { fontSize: 18 },

  tabBar:           { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e1e38', marginHorizontal: 20 },
  tab:              { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:        { borderBottomWidth: 2, borderBottomColor: '#5865f2' },
  tabText:          { color: '#444', fontSize: 13, fontWeight: '700' },
  tabTextActive:    { color: '#5865f2' },

  scroll:           { paddingBottom: 80, gap: 24 },

  heroBanner:       { alignItems: 'center', paddingTop: 28, paddingBottom: 28, paddingHorizontal: 20 },
  bannerGradient:   { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },

  avatarArea:       { marginBottom: 14 },
  avatarRing:       { width: 118, height: 118, borderRadius: 59, borderWidth: 3, padding: 3, backgroundColor: '#0a0a18' },
  avatar:           { width: '100%', height: '100%', borderRadius: 53 },
  avatarFallback:   { width: '100%', height: '100%', borderRadius: 53, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:    { color: '#fff', fontSize: 48, fontWeight: '900' },
  cameraBtn:        { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: '#12122a', borderWidth: 2, borderColor: '#0a0a18', alignItems: 'center', justifyContent: 'center' },
  cameraIcon:       { fontSize: 14 },
  moodDot:          { position: 'absolute', top: 0, right: 0, backgroundColor: '#12122a', borderRadius: 14, padding: 3, borderWidth: 2, borderColor: '#0a0a18' },

  heroName:         { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  heroGender:       { color: '#666', fontSize: 14, marginTop: 2 },
  heroLocation:     { color: '#555', fontSize: 14, marginTop: 3 },
  tierPill:         { marginTop: 12, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  tierPillText:     { fontSize: 13, fontWeight: '700' },

  completionCard:   { marginHorizontal: 20, backgroundColor: '#5865f210', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#5865f230' },
  completionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionLabel:  { color: '#5865f2', fontSize: 14, fontWeight: '800' },
  completionHint:   { color: '#5865f2aa', fontSize: 11, fontWeight: '600' },
  completionTrack:  { height: 5, backgroundColor: '#1e1e38', borderRadius: 3, overflow: 'hidden' },
  completionFill:   { height: '100%', backgroundColor: '#5865f2', borderRadius: 3 },

  statsRow:         { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  statCard:         { flex: 1, backgroundColor: '#12122a', borderRadius: 20, padding: 16, alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#1e1e38' },
  statEmoji:        { fontSize: 22 },
  statValue:        { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabel:        { color: '#444', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  section:          { paddingHorizontal: 20, gap: 12 },
  sectionTitle:     { color: '#444', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink:         { color: '#5865f2', fontSize: 13, fontWeight: '700' },

  voiceEmpty:       { backgroundColor: '#12122a', borderRadius: 18, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#1e1e38' },
  voiceEmptyTitle:  { color: '#888', fontSize: 15, fontWeight: '700' },
  voiceEmptyHint:   { color: '#555', fontSize: 13 },
  ghostBtn:         { backgroundColor: '#12122a', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e38' },
  ghostBtnText:     { color: '#666', fontSize: 14, fontWeight: '700' },

  relLabel:         { fontSize: 13, fontWeight: '700' },
  relTrack:         { height: 6, backgroundColor: '#1e1e38', borderRadius: 3, overflow: 'hidden' },
  relFill:          { height: '100%', borderRadius: 3 },
  relHint:          { color: '#444', fontSize: 11 },

  bioCard:          { backgroundColor: '#12122a', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#1e1e38' },
  bioText:          { color: '#bbb', fontSize: 15, lineHeight: 24 },
  dashedCard:       { backgroundColor: '#12122a', borderRadius: 16, paddingVertical: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e38', borderStyle: 'dashed' },
  dashedCardText:   { color: '#444', fontSize: 14, fontWeight: '600' },

  ctWrap:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ctBadge:          { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  ctBadgeText:      { fontSize: 13, fontWeight: '700' },

  moodChip:         { alignItems: 'center', backgroundColor: '#12122a', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#1e1e38', gap: 5 },
  moodChipActive:   { backgroundColor: '#5865f218', borderColor: '#5865f255' },
  moodText:         { color: '#555', fontSize: 10, fontWeight: '700' },

  expCard:          { backgroundColor: '#12122a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e1e38', gap: 8 },
  expTitle:         { color: '#fff', fontSize: 14, fontWeight: '700' },
  expCat:           { color: '#555', fontSize: 12 },
  expStatus:        { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  expStatusText:    { fontSize: 11, fontWeight: '700' },

  subCard:          { borderRadius: 20, padding: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTierName:      { fontSize: 17, fontWeight: '900' },
  subPrice:         { color: '#555', fontSize: 13, marginTop: 4 },
  manageBtn:        { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1 },
  manageBtnText:    { fontSize: 13, fontWeight: '700' },
  upgradeCard:      { borderRadius: 20, overflow: 'hidden' },
  upgradeCardInner: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  upgradeCardTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  upgradeCardSub:   { color: '#ffffff88', fontSize: 12, marginTop: 4, lineHeight: 18 },
  upgradeCardArrow: { color: '#fff', fontSize: 24, fontWeight: '200' },

  cultureForm:      { backgroundColor: '#12122a', margin: 16, borderRadius: 20, padding: 18, gap: 14, borderWidth: 1, borderColor: '#1e1e38' },
  cultureFormTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  emojiBtn:         { width: 42, height: 42, borderRadius: 12, backgroundColor: '#0a0a18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e1e38' },
  emojiBtnOn:       { backgroundColor: '#5865f225', borderColor: '#5865f255' },
  catChip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#0a0a18', borderWidth: 1, borderColor: '#1e1e38' },
  catChipOn:        { backgroundColor: '#5865f2', borderColor: '#5865f2' },
  catChipText:      { color: '#555', fontSize: 12, fontWeight: '600' },
  cultureInput:     { backgroundColor: '#0a0a18', color: '#fff', borderRadius: 14, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#1e1e38' },
  postBtn:          { backgroundColor: '#5865f2', borderRadius: 16, padding: 15, alignItems: 'center' },
  postBtnOff:       { backgroundColor: '#1e1e38' },
  postBtnText:      { color: '#fff', fontSize: 15, fontWeight: '800' },

  postCard:         { backgroundColor: '#12122a', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#1e1e38', gap: 12 },
  postHeader:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  postUser:         { color: '#fff', fontWeight: '800', fontSize: 13 },
  postCatBadge:     { backgroundColor: '#5865f218', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 5, borderWidth: 1, borderColor: '#5865f230' },
  postCatText:      { color: '#5865f2', fontSize: 10, fontWeight: '800' },
  postText:         { color: '#bbb', fontSize: 14, lineHeight: 22 },

  goLiveRow:        { marginHorizontal: 20, marginBottom: 4 },
  goLiveCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#e5393530' },
  goLiveBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  goLiveDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  goLiveBadgeText:  { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  goLiveTitle:      { color: '#fff', fontWeight: '800', fontSize: 15 },
  goLiveSub:        { color: '#555', fontSize: 12, marginTop: 2 },
  goLiveArrow:      { color: '#444', fontSize: 26 },
});
