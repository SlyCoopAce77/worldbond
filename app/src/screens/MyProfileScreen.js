import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, FlatList,
  TouchableOpacity, TextInput, Modal, Image, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

Sound.setCategory('Playback');
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { logout, getAccessToken } from '../services/authApi';
import { SERVER_URL } from '../services/socket';
import { usePremium, TIERS } from '../context/PremiumContext';
import { useTheme } from '../context/ThemeContext';
import { getCountryFlag } from '../utils/countryUtils';

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
  const [loading,  setLoading]  = useState(true);
  const [playing,  setPlaying]  = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [loadErr,  setLoadErr]  = useState(false);
  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const bars     = useRef(Array.from({ length: 30 }, () => 4 + Math.random() * 22)).current;

  useEffect(() => {
    if (!url) { setLoading(false); setLoadErr(true); return; }
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
    <TouchableOpacity
      style={vStyles.container}
      onPress={togglePlay}
      activeOpacity={0.85}
      disabled={loading || loadErr}
    >
      {loading ? (
        <ActivityIndicator color="#6C47FF" size="small" />
      ) : (
        <View style={[vStyles.btn, playing && vStyles.btnActive]}>
          <Text style={vStyles.btnIcon}>{playing ? '⏸' : '▶'}</Text>
        </View>
      )}
      <View style={vStyles.waveform}>
        {bars.map((h, i) => (
          <View key={i} style={[vStyles.bar, { height: h, opacity: playing ? 1 : 0.35 }]} />
        ))}
      </View>
      <Text style={vStyles.dur}>{loadErr ? '--:--' : fmt(playing ? position : duration)}</Text>
    </TouchableOpacity>
  );
}
const vStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C47FF12', borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: '#6C47FF30' },
  btn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: '#6C47FF', alignItems: 'center', justifyContent: 'center' },
  btnActive: { backgroundColor: '#5533DD' },
  btnIcon:   { color: '#fff', fontSize: 14 },
  waveform:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar:       { width: 3, borderRadius: 2, backgroundColor: '#6C47FF' },
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
            {saving ? <ActivityIndicator color="#6C47FF" /> : <Text style={eStyles.save}>Save</Text>}
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
                    <Text style={[eStyles.chipText, form.language === l.code && { color: '#6C47FF', fontWeight: '700' }]}>{l.label}</Text>
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
  container: { flex: 1, backgroundColor: '#000000' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2F3336' },
  cancel:    { color: '#555', fontSize: 16, fontWeight: '600' },
  title:     { color: '#fff', fontSize: 18, fontWeight: '900' },
  save:      { color: '#6C47FF', fontSize: 16, fontWeight: '800' },
  body:      { padding: 20, gap: 22, paddingBottom: 60 },
  row:       { flexDirection: 'row', gap: 12 },
  group:     { gap: 8 },
  label:     { color: '#555', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:     { backgroundColor: '#16181C', color: '#fff', fontSize: 15, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2F3336' },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2F3336' },
  chipOn:    { backgroundColor: '#6C47FF18', borderColor: '#6C47FF55' },
  chipText:  { color: '#666', fontSize: 13, fontWeight: '600' },
  ctGrid:    { gap: 10 },
  ctCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2F3336' },
  ctLabel:   { color: '#666', fontSize: 14, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MyProfileScreen({ navigation, user, onLogout }) {
  const { tier, tierInfo, isPremium } = usePremium();
  const { colors } = useTheme();
  const socket = getSocket();

  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [myExps, setMyExps]           = useState([]);
  const [matchCount, setMatchCount]   = useState(0);
  const [showEdit, setShowEdit]       = useState(false);
  const [tab, setTab]                 = useState('bond');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);

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
      form.append('photo',    { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'photo.jpg' });
      form.append('userId',   user?.userId || '');
      form.append('username', profile?.display_name || user?.username || '');
      form.append('country',  profile?.country || user?.country || '');
      form.append('language', profile?.language || 'en');
      const uploadRes = await fetch(`${SERVER_URL}/api/photos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!uploadRes.ok) throw new Error('upload failed');
      const data = await uploadRes.json();
      await fetch(`${SERVER_URL}/api/profiles/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: data.imageUrl }),
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

  async function addGalleryPhoto() {
    const gallery = profile?.gallery_photos || [];
    if (gallery.length >= 9) return Alert.alert('Gallery full', 'Remove a photo to add a new one.');
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.85 });
    if (!result.assets?.[0]) return;
    const asset = result.assets[0];
    setGalleryUploading(true);
    try {
      const token = await getAccessToken();
      const form  = new FormData();
      form.append('photo', { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'photo.jpg' });
      form.append('userId', user?.userId || '');
      form.append('username', profile?.display_name || user?.username || '');
      form.append('country', profile?.country || user?.country || '');
      form.append('language', profile?.language || 'en');
      const uploadRes = await fetch(`${SERVER_URL}/api/photos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!uploadRes.ok) throw new Error('upload failed');
      const data = await uploadRes.json();
      const addRes = await fetch(`${SERVER_URL}/api/profiles/me/gallery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: data.imageUrl }),
      });
      if (!addRes.ok) throw new Error('gallery update failed');
      const { gallery_photos } = await addRes.json();
      setProfile(p => ({ ...p, gallery_photos }));
    } catch {
      Alert.alert('Error', 'Could not upload photo. Try again.');
    } finally {
      setGalleryUploading(false);
    }
  }

  async function removeGalleryPhoto(index) {
    Alert.alert('Remove photo', 'Remove this photo from your gallery?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          const token = await getAccessToken();
          const res = await fetch(`${SERVER_URL}/api/profiles/me/gallery/${index}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('delete failed');
          const { gallery_photos } = await res.json();
          setProfile(p => ({ ...p, gallery_photos }));
        } catch {
          Alert.alert('Error', 'Could not remove photo.');
        }
      }},
    ]);
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
  const tierColor   = tierInfo?.color || '#6C47FF';

  return (
    <LinearGradient
      colors={['#1e0025', '#110018', '#070010', '#000000']}
      locations={[0, 0.3, 0.65, 1]}
      style={{ flex: 1 }}
    >
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
              colors={[tierColor + '80', tierColor + '35', 'transparent']}
              style={styles.bannerGradient}
            />
            {/* Ambient glow blob behind avatar */}
            <View style={[styles.avatarGlow, { backgroundColor: tierColor }]} />

            <View style={styles.avatarArea}>
              {/* Outer decorative ring */}
              <View style={[styles.avatarOuterRing, { borderColor: tierColor + '45' }]}>
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
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.heroName}>
              {displayName}{profile?.age ? `, ${profile.age}` : ''}
            </Text>
            {profile?.gender ? <Text style={styles.heroGender}>{profile.gender}</Text> : null}
            <Text style={styles.heroLocation}>
              {(() => {
                const country = profile?.country || user?.country;
                const flag = getCountryFlag(country);
                const parts = [profile?.city, country].filter(Boolean);
                return parts.length ? `${parts.join(', ')}${flag ? ` ${flag}` : ''}` : '';
              })()}
            </Text>

            <View style={[styles.tierPill, { borderColor: tierColor + '60', backgroundColor: tierColor + '18' }]}>
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
              { value: matchCount,      label: 'Bonds' },
              { value: myExps.length,   label: 'Experiences' },
              { value: rel.label,       label: 'Reliability', color: rel.color },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
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
            <LinearGradient colors={['#380808', '#200404']} style={styles.goLiveCard}>
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

          {/* ── Photo Gallery ────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Text style={styles.galleryCount}>{(profile?.gallery_photos || []).length}/9</Text>
            </View>
            <View style={styles.galleryGrid}>
              {Array.from({ length: 9 }).map((_, i) => {
                const url = (profile?.gallery_photos || [])[i];
                return url ? (
                  <TouchableOpacity
                    key={i}
                    style={styles.gallerySlot}
                    onPress={() => setViewingPhoto(url)}
                    onLongPress={() => removeGalleryPhoto(i)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: url }} style={styles.galleryImg} />
                    <TouchableOpacity style={styles.galleryRemoveBtn} onPress={() => removeGalleryPhoto(i)}>
                      <Text style={styles.galleryRemoveIcon}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={i}
                    style={styles.gallerySlotEmpty}
                    onPress={addGalleryPhoto}
                    disabled={galleryUploading}
                    activeOpacity={0.7}
                  >
                    {galleryUploading && i === (profile?.gallery_photos || []).length ? (
                      <ActivityIndicator color="#6C47FF" size="small" />
                    ) : (
                      <Text style={styles.galleryAddIcon}>+</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.galleryHint}>Hold a photo to remove it</Text>
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
                colors={tier === 'pro' ? ['#1C1F23', '#1C1F23'] : ['#000000', '#16181C']}
                style={[styles.subCard, { borderColor: tierColor + '55' }]}
              >
                <View>
                  <Text style={[styles.subTierName, { color: tierColor }]}>
                    {tier === 'plus' ? '💜 Bond Plus' : '⭐ Bond Pro'}
                  </Text>
                  <Text style={styles.subPrice}>Free during beta</Text>
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
                  colors={['#6C47FF', '#5533DD']}
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
              placeholderTextColor="rgba(255,255,255,0.2)"
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
            keyExtractor={p => String(p.id)}
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
              <Text style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40, fontSize: 15 }}>
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
          <ActivityIndicator color="#6C47FF" size="large" />
        </View>
      )}

      <Modal visible={!!viewingPhoto} transparent animationType="fade" onRequestClose={() => setViewingPhoto(null)}>
        <View style={styles.photoModal}>
          <Image source={{ uri: viewingPhoto }} style={styles.photoModalImg} resizeMode="contain" />
          <TouchableOpacity style={styles.photoModalClose} onPress={() => setViewingPhoto(null)}>
            <Text style={styles.photoModalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
    </LinearGradient>
  );
}

const GLASS   = 'rgba(255,255,255,0.06)';
const BORDER  = 'rgba(255,255,255,0.1)';
const BORDER2 = 'rgba(255,255,255,0.07)';

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },

  topBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 10 },
  topBarTitle:      { color: '#ffffff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  topBarActions:    { flexDirection: 'row', gap: 8 },
  editBtn:          { backgroundColor: 'rgba(232,0,61,0.15)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(232,0,61,0.35)' },
  editBtnText:      { color: '#6C47FF', fontSize: 13, fontWeight: '800' },
  logoutBtn:        { backgroundColor: 'rgba(229,57,53,0.12)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(229,57,53,0.25)' },
  logoutBtnText:    { color: '#e53935', fontSize: 13, fontWeight: '700' },
  settingsBtn:      { width: 40, height: 40, borderRadius: 14, backgroundColor: GLASS, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  settingsBtnText:  { fontSize: 18 },

  tabBar:           { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER2, marginHorizontal: 20 },
  tab:              { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:        { borderBottomWidth: 2, borderBottomColor: '#6C47FF' },
  tabText:          { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '700' },
  tabTextActive:    { color: '#6C47FF' },

  scroll:           { paddingBottom: 80, gap: 24 },

  heroBanner:       { alignItems: 'center', paddingTop: 38, paddingBottom: 34, paddingHorizontal: 20 },
  bannerGradient:   { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },

  avatarGlow:       { position: 'absolute', width: 240, height: 240, borderRadius: 120, top: 0, opacity: 0.14 },
  avatarArea:       { marginBottom: 18 },
  avatarOuterRing:  { width: 150, height: 150, borderRadius: 75, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarRing:       { width: 132, height: 132, borderRadius: 66, borderWidth: 3.5, padding: 3, backgroundColor: 'rgba(0,0,0,0.6)' },
  avatar:           { width: '100%', height: '100%', borderRadius: 59 },
  avatarFallback:   { width: '100%', height: '100%', borderRadius: 59, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:    { color: '#fff', fontSize: 52, fontWeight: '900' },
  cameraBtn:        { position: 'absolute', bottom: 2, right: 2, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(10,0,15,0.9)', borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  cameraIcon:       { fontSize: 14 },
  moodDot:          { position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(10,0,15,0.9)', borderRadius: 14, padding: 3, borderWidth: 2, borderColor: BORDER },

  heroName:         { color: '#ffffff', fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  heroGender:       { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 3 },
  heroLocation:     { color: 'rgba(255,255,255,0.32)', fontSize: 14, marginTop: 4 },
  tierPill:         { marginTop: 14, borderWidth: 1, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 7 },
  tierPillText:     { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

  completionCard:   { marginHorizontal: 20, backgroundColor: 'rgba(232,0,61,0.1)', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(232,0,61,0.25)' },
  completionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionLabel:  { color: '#6C47FF', fontSize: 14, fontWeight: '800' },
  completionHint:   { color: 'rgba(232,0,61,0.7)', fontSize: 11, fontWeight: '600' },
  completionTrack:  { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  completionFill:   { height: '100%', backgroundColor: '#6C47FF', borderRadius: 3 },

  statsRow:         { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  statCard:         { flex: 1, backgroundColor: GLASS, borderRadius: 20, padding: 16, alignItems: 'center', gap: 5, borderWidth: 1, borderColor: BORDER },
  statEmoji:        { fontSize: 22 },
  statValue:        { color: '#ffffff', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  statLabel:        { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },

  section:          { paddingHorizontal: 20, gap: 12 },
  sectionTitle:     { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4, color: 'rgba(255,255,255,0.38)' },
  sectionRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink:         { color: '#6C47FF', fontSize: 13, fontWeight: '700' },

  voiceEmpty:       { backgroundColor: GLASS, borderRadius: 18, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: BORDER },
  voiceEmptyTitle:  { color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: '700' },
  voiceEmptyHint:   { color: 'rgba(255,255,255,0.28)', fontSize: 13 },
  ghostBtn:         { backgroundColor: GLASS, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  ghostBtnText:     { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '700' },

  relLabel:         { fontSize: 13, fontWeight: '700' },
  relTrack:         { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  relFill:          { height: '100%', borderRadius: 3 },
  relHint:          { color: 'rgba(255,255,255,0.28)', fontSize: 11 },

  bioCard:          { backgroundColor: GLASS, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: BORDER },
  bioText:          { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 24 },
  dashedCard:       { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, paddingVertical: 20, alignItems: 'center', borderWidth: 1, borderColor: BORDER2, borderStyle: 'dashed' },
  dashedCardText:   { color: 'rgba(255,255,255,0.28)', fontSize: 14, fontWeight: '600' },

  ctWrap:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ctBadge:          { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  ctBadgeText:      { fontSize: 13, fontWeight: '700' },

  galleryCount:     { color: 'rgba(255,255,255,0.28)', fontSize: 12, fontWeight: '700' },
  galleryGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gallerySlot:      { width: (width - 40 - 16) / 3, aspectRatio: 1, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  galleryImg:       { width: '100%', height: '100%' },
  galleryRemoveBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  galleryRemoveIcon:{ color: '#fff', fontSize: 11, fontWeight: '900' },
  gallerySlotEmpty: { width: (width - 40 - 16) / 3, aspectRatio: 1, borderRadius: 16, backgroundColor: GLASS, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  galleryAddIcon:   { color: 'rgba(255,255,255,0.3)', fontSize: 28, fontWeight: '200' },
  galleryHint:      { color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center' },

  expCard:          { backgroundColor: GLASS, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, gap: 8 },
  expTitle:         { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  expCat:           { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  expStatus:        { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  expStatusText:    { fontSize: 11, fontWeight: '700' },

  subCard:          { borderRadius: 20, padding: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTierName:      { fontSize: 17, fontWeight: '900' },
  subPrice:         { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 },
  manageBtn:        { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1 },
  manageBtnText:    { fontSize: 13, fontWeight: '700' },
  upgradeCard:      { borderRadius: 20, overflow: 'hidden' },
  upgradeCardInner: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  upgradeCardTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  upgradeCardSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, lineHeight: 18 },
  upgradeCardArrow: { color: '#fff', fontSize: 24, fontWeight: '200' },

  cultureForm:      { backgroundColor: GLASS, margin: 16, borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: BORDER },
  cultureFormTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  emojiBtn:         { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER2 },
  emojiBtnOn:       { backgroundColor: 'rgba(232,0,61,0.22)', borderColor: 'rgba(232,0,61,0.5)' },
  catChip:          { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: BORDER2 },
  catChipOn:        { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  catChipText:      { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
  cultureInput:     { backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: 14, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: BORDER2 },
  postBtn:          { backgroundColor: '#6C47FF', borderRadius: 16, padding: 15, alignItems: 'center' },
  postBtnOff:       { backgroundColor: 'rgba(255,255,255,0.08)' },
  postBtnText:      { color: '#fff', fontSize: 15, fontWeight: '800' },

  postCard:         { backgroundColor: GLASS, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER, gap: 12 },
  postHeader:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  postUser:         { color: '#fff', fontWeight: '800', fontSize: 13 },
  postCatBadge:     { backgroundColor: 'rgba(232,0,61,0.15)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 5, borderWidth: 1, borderColor: 'rgba(232,0,61,0.28)' },
  postCatText:      { color: '#6C47FF', fontSize: 10, fontWeight: '800' },
  postText:         { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 },

  goLiveRow:        { marginHorizontal: 20, marginBottom: 4 },
  goLiveCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(229,57,53,0.25)' },
  goLiveBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  goLiveDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  goLiveBadgeText:  { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  goLiveTitle:      { color: '#fff', fontWeight: '800', fontSize: 15 },
  goLiveSub:        { color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2 },
  goLiveArrow:      { color: 'rgba(255,255,255,0.3)', fontSize: 26 },

  photoModal:          { flex: 1, backgroundColor: '#000000f2', alignItems: 'center', justifyContent: 'center' },
  photoModalImg:       { width: width, height: width },
  photoModalClose:     { position: 'absolute', top: 60, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff18', borderWidth: 1, borderColor: '#ffffff30', alignItems: 'center', justifyContent: 'center' },
  photoModalCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
