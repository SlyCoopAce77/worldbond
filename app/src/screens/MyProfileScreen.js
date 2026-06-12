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
import { getAccessToken } from '../services/authApi';
import { SERVER_URL } from '../services/socket';
import { usePremium } from '../context/PremiumContext';
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

const CULTURE_CATS   = ['food', 'tradition', 'music', 'humor', 'language', 'places', 'daily life', 'celebration'];
const CULTURE_EMOJIS = ['🌍', '🍜', '🎵', '😂', '🏛️', '🗺️', '🎉', '🤝', '🏠', '👨‍👩‍👧‍👦', '🎭', '🌺'];

// World Impressions — the 3 footprint prompts
const IMPRESSION_PROMPTS = [
  { key: 'give',    icon: '🌍', prompt: 'One thing my country gave the world…' },
  { key: 'draw',    icon: '🤝', prompt: 'What draws me to meeting new people…' },
  { key: 'moment',  icon: '👣', prompt: 'The moment that left the biggest footprint on me…' },
];

function completionPct(profile) {
  const fields = ['photo_url', 'voice_note_url', 'bio', 'age', 'city'];
  const filled = fields.filter(f => profile?.[f]).length;
  const hasTypes = (profile?.connection_types || []).length > 0;
  return Math.round(((filled + (hasTypes ? 1 : 0)) / (fields.length + 1)) * 100);
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
    <TouchableOpacity style={vStyles.container} onPress={togglePlay} activeOpacity={0.85} disabled={loading || loadErr}>
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
          <TouchableOpacity onPress={onClose}><Text style={eStyles.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={eStyles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#6C47FF" /> : <Text style={eStyles.save}>Save</Text>}
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={eStyles.body} showsVerticalScrollIndicator={false}>
            <View style={eStyles.group}>
              <Text style={eStyles.label}>Display Name</Text>
              <TextInput style={eStyles.input} value={form.display_name} onChangeText={t => setForm(f => ({ ...f, display_name: t }))} maxLength={30} placeholderTextColor="#555" />
            </View>
            <View style={eStyles.row}>
              <View style={[eStyles.group, { flex: 1 }]}>
                <Text style={eStyles.label}>Age</Text>
                <TextInput style={eStyles.input} value={form.age} onChangeText={t => setForm(f => ({ ...f, age: t }))} keyboardType="number-pad" maxLength={3} placeholderTextColor="#555" />
              </View>
              <View style={[eStyles.group, { flex: 2 }]}>
                <Text style={eStyles.label}>City</Text>
                <TextInput style={eStyles.input} value={form.city} onChangeText={t => setForm(f => ({ ...f, city: t }))} placeholder="Your city" placeholderTextColor="#555" />
              </View>
            </View>
            <View style={eStyles.group}>
              <Text style={eStyles.label}>Bio <Text style={{ color: '#555', fontWeight: '400' }}>(optional)</Text></Text>
              <TextInput style={[eStyles.input, { minHeight: 90 }]} value={form.bio} onChangeText={t => setForm(f => ({ ...f, bio: t }))} placeholder="What makes you interesting?" placeholderTextColor="#555" multiline maxLength={200} textAlignVertical="top" />
              <Text style={{ color: '#555', fontSize: 11, textAlign: 'right' }}>{(form.bio || '').length}/200</Text>
            </View>
            <View style={eStyles.group}>
              <Text style={eStyles.label}>Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {LANGUAGES.map(l => (
                  <TouchableOpacity key={l.code} style={[eStyles.chip, form.language === l.code && eStyles.chipOn]} onPress={() => setForm(f => ({ ...f, language: l.code }))}>
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
                    <TouchableOpacity key={ct.key} style={[eStyles.ctCard, on && { borderColor: ct.color, backgroundColor: ct.color + '15' }]} onPress={() => toggleType(ct.key)}>
                      <Text style={{ fontSize: 18 }}>{ct.emoji}</Text>
                      <Text style={[eStyles.ctLabel, on && { color: ct.color }]}>{ct.label}</Text>
                      {on && <Text style={{ fontSize: 11, fontWeight: '800', color: ct.color, marginLeft: 'auto' }}>✓</Text>}
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

// ─── World Impression card ─────────────────────────────────────────────────
function ImpressionCard({ data, onEdit }) {
  return (
    <TouchableOpacity style={imp.card} onPress={onEdit} activeOpacity={0.85}>
      <View style={imp.topRow}>
        <Text style={imp.icon}>{data.icon}</Text>
        <Text style={imp.prompt}>{data.prompt}</Text>
      </View>
      {data.answer ? (
        <Text style={imp.answer}>"{data.answer}"</Text>
      ) : (
        <View style={imp.emptyRow}>
          <Text style={imp.emptyText}>Tap to leave your impression…</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const imp = StyleSheet.create({
  card:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10 },
  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon:      { fontSize: 20 },
  prompt:    { color: 'rgba(255,255,255,0.38)', fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 17 },
  answer:    { color: '#fff', fontSize: 15, fontStyle: 'italic', lineHeight: 23, paddingLeft: 30 },
  emptyRow:  { paddingLeft: 30 },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic' },
});

// ─── Impression edit modal ─────────────────────────────────────────────────
function ImpressionEditModal({ visible, item, onSave, onClose }) {
  const [text, setText] = useState('');
  useEffect(() => { if (visible) setText(item?.answer || ''); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={impEdit.sheet}>
          <View style={impEdit.handle} />
          <Text style={impEdit.icon}>{item?.icon}</Text>
          <Text style={impEdit.prompt}>{item?.prompt}</Text>
          <TextInput
            style={impEdit.input}
            value={text}
            onChangeText={setText}
            placeholder="Write your impression…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
            maxLength={180}
            autoFocus
          />
          <Text style={impEdit.count}>{text.length}/180</Text>
          <TouchableOpacity
            style={[impEdit.saveBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={() => { onSave(text.trim()); onClose(); }}
            disabled={!text.trim()}
          >
            <Text style={impEdit.saveTxt}>Save Impression</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const impEdit = StyleSheet.create({
  sheet:   { backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, paddingBottom: 40 },
  handle:  { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  icon:    { fontSize: 28, textAlign: 'center' },
  prompt:  { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  input:   { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 16, padding: 16, fontSize: 15, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2a2a2a', lineHeight: 23 },
  count:   { color: '#333', fontSize: 11, textAlign: 'right' },
  saveBtn: { backgroundColor: '#6C47FF', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
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
  const [flagsPlanted, setFlagsPlanted]   = useState([]);   // array of country strings
  const [showEdit, setShowEdit]       = useState(false);
  const [tab, setTab]                 = useState('profile');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  const [culturePosts, setCulturePosts] = useState([]);
  const [cultureText, setCultureText]   = useState('');
  const [cultureEmoji, setCultureEmoji] = useState('🌍');
  const [cultureCat, setCultureCat]     = useState('daily life');

  // World Impressions
  const [impressions, setImpressions]       = useState({ give: '', draw: '', moment: '' });
  const [editingImp,  setEditingImp]        = useState(null); // the prompt object being edited

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

      // Load footprint countries
      const raw = await AsyncStorage.getItem('bond_saved_countries');
      setFlagsPlanted(raw ? JSON.parse(raw) : []);

      // Load World Impressions
      const impRaw = await AsyncStorage.getItem('world_impressions');
      if (impRaw) setImpressions(JSON.parse(impRaw));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    if (socket.connected) socket.emit('get_cultural_posts');
    else socket.once('connect', () => socket.emit('get_cultural_posts'));
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
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!uploadRes.ok) throw new Error('upload failed');
      const data = await uploadRes.json();
      await fetch(`${SERVER_URL}/api/profiles/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: data.imageUrl }),
      });
      setProfile(p => ({ ...p, photo_url: data.imageUrl }));
    } catch { Alert.alert('Error', 'Could not upload photo. Try again.'); }
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
    if (gallery.length >= 6) return Alert.alert('Gallery full', 'Remove a photo to add a new one.');
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
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
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
    } catch { Alert.alert('Error', 'Could not upload photo. Try again.'); }
    finally { setGalleryUploading(false); }
  }

  async function removeGalleryPhoto(index) {
    Alert.alert('Remove photo', 'Remove this photo from your gallery?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          const token = await getAccessToken();
          const res = await fetch(`${SERVER_URL}/api/profiles/me/gallery/${index}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('delete failed');
          const { gallery_photos } = await res.json();
          setProfile(p => ({ ...p, gallery_photos }));
        } catch { Alert.alert('Error', 'Could not remove photo.'); }
      }},
    ]);
  }

  async function saveImpression(key, text) {
    const updated = { ...impressions, [key]: text };
    setImpressions(updated);
    await AsyncStorage.setItem('world_impressions', JSON.stringify(updated));
  }

  function submitCulturePost() {
    if (!cultureText.trim()) return;
    socket.emit('submit_cultural_post', { text: cultureText.trim(), emoji: cultureEmoji, category: cultureCat });
    setCultureText('');
  }

  const pct         = completionPct(profile);
  const displayName = profile?.display_name || user?.username || 'You';
  const tierColor   = tierInfo?.color || '#6C47FF';

  const countryStr = profile?.country || user?.country || '';
  const countryFlag = getCountryFlag(countryStr);
  const countryCity = [profile?.city, countryStr].filter(Boolean).join(', ');

  return (
    <LinearGradient colors={['#1e0025', '#110018', '#070010', '#000000']} locations={[0, 0.3, 0.65, 1]} style={{ flex: 1 }}>
    <SafeAreaView style={s.container}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>Me</Text>
        <View style={s.topBarActions}>
          <TouchableOpacity style={s.editBtn} onPress={() => setShowEdit(true)}>
            <Text style={s.editBtnTxt}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        {[{ key: 'profile', label: '👤 Profile' }, { key: 'culture', label: '🌍 My World' }].map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.tabTxt, tab === t.key && s.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ════════════════════════ PROFILE TAB ════════════════════════ */}
      {tab === 'profile' && (
        <Animated.ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── Hero ── */}
          <View style={s.hero}>
            <LinearGradient colors={[tierColor + '70', tierColor + '25', 'transparent']} style={s.heroGrad} />
            <View style={[s.avatarGlow, { backgroundColor: tierColor }]} />

            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={s.avatarWrap}>
              <View style={[s.avatarRing, { borderColor: tierColor }]}>
                {profile?.photo_url ? (
                  <Image source={{ uri: profile.photo_url }} style={s.avatar} />
                ) : (
                  <LinearGradient colors={[tierColor, tierColor + 'aa']} style={s.avatarFallback}>
                    <Text style={s.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={s.cameraBtn}><Text style={{ fontSize: 13 }}>📷</Text></View>
            </TouchableOpacity>

            <Text style={s.heroName}>{displayName}{profile?.age ? `, ${profile.age}` : ''}</Text>
            {countryCity ? <Text style={s.heroLoc}>{countryCity} {countryFlag}</Text> : null}
            {profile?.gender ? <Text style={s.heroGender}>{profile.gender}</Text> : null}

            <View style={[s.tierPill, { borderColor: tierColor + '60', backgroundColor: tierColor + '18' }]}>
              <Text style={[s.tierPillTxt, { color: tierColor }]}>
                {tier === 'free' ? '🆓 Bond Free' : tier === 'plus' ? '💜 Bond Plus' : '⭐ Bond Pro'}
              </Text>
            </View>

            {/* Footprint strip — pinned countries */}
            {flagsPlanted.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fpStrip} contentContainerStyle={s.fpStripContent}>
                <Text style={s.fpLabel}>👣</Text>
                {flagsPlanted.map((c, i) => (
                  <View key={i} style={s.fpFlag}>
                    <Text style={s.fpFlagEmoji}>{getCountryFlag(c)}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── Profile completion ── */}
          {pct < 100 && (
            <TouchableOpacity style={s.completionBar} onPress={() => setShowEdit(true)} activeOpacity={0.85}>
              <View style={{ flex: 1, gap: 5 }}>
                <View style={s.completionRow}>
                  <Text style={s.completionLbl}>Profile {pct}% complete</Text>
                  <Text style={s.completionHint}>Finish for 2× more matches →</Text>
                </View>
                <View style={s.completionTrack}>
                  <View style={[s.completionFill, { width: `${pct}%` }]} />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Stats ── */}
          <View style={s.statsRow}>
            {[
              { value: matchCount,         label: 'Bonds',       icon: '🤝' },
              { value: flagsPlanted.length, label: 'Footprints',  icon: '👣' },
              { value: myExps.length,      label: 'Experiences', icon: '✨' },
            ].map(st => (
              <View key={st.label} style={s.statCard}>
                <Text style={s.statIcon}>{st.icon}</Text>
                <Text style={s.statValue}>{st.value ?? '—'}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Voice Signature ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>🎙 Voice Signature</Text>
            </View>
            {profile?.voice_note_url ? (
              <VoiceNotePlayer url={profile.voice_note_url} />
            ) : (
              <TouchableOpacity
                style={s.voiceEmpty}
                onPress={() => Alert.alert('Coming soon', 'Voice recording will be available in the next update.')}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 30 }}>🎙️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.voiceEmptyTitle}>Record your voice</Text>
                  <Text style={s.voiceEmptyHint}>Let people hear you before they Bond</Text>
                </View>
                <Text style={s.voiceArrow}>+</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── My Story (bio) ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>📖 My Story</Text>
              <TouchableOpacity onPress={() => setShowEdit(true)}><Text style={s.editLink}>Edit</Text></TouchableOpacity>
            </View>
            {profile?.bio ? (
              <LinearGradient colors={['rgba(108,71,255,0.08)', 'rgba(108,71,255,0.03)']} style={s.storyCard}>
                <Text style={s.storyQuote}>"</Text>
                <Text style={s.storyText}>{profile.bio}</Text>
              </LinearGradient>
            ) : (
              <TouchableOpacity style={s.dashedCard} onPress={() => setShowEdit(true)}>
                <Text style={s.dashedTxt}>+ Tell your story</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── World Impressions (1 of 1 footprint feature) ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>👣 World Impressions</Text>
              <Text style={s.sectionSub}>3 questions · your permanent mark</Text>
            </View>
            {IMPRESSION_PROMPTS.map(p => (
              <ImpressionCard
                key={p.key}
                data={{ ...p, answer: impressions[p.key] }}
                onEdit={() => setEditingImp(p)}
              />
            ))}
          </View>

          {/* ── Mission Stamps (Here For) ── */}
          {(profile?.connection_types || []).length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionLabel}>🎯 Mission</Text>
                <TouchableOpacity onPress={() => setShowEdit(true)}><Text style={s.editLink}>Edit</Text></TouchableOpacity>
              </View>
              <View style={s.stampsGrid}>
                {profile.connection_types.map(key => {
                  const ct = CONNECTION_TYPES.find(c => c.key === key);
                  if (!ct) return null;
                  return (
                    <View key={key} style={[s.stamp, { borderColor: ct.color + '60', backgroundColor: ct.color + '12' }]}>
                      <Text style={s.stampEmoji}>{ct.emoji}</Text>
                      <Text style={[s.stampLabel, { color: ct.color }]}>{ct.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          {(profile?.connection_types || []).length === 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>🎯 Mission</Text>
              <TouchableOpacity style={s.dashedCard} onPress={() => setShowEdit(true)}>
                <Text style={s.dashedTxt}>+ What are you here for?</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Go Live ── */}
          <View style={s.section}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Live', { user: { username: profile?.display_name || user?.username, userId: user?.userId, photo_url: profile?.photo_url || user?.photo_url } })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#380808', '#200404']} style={s.liveCard}>
                <View style={s.liveBadge}><View style={s.liveDot} /><Text style={s.liveBadgeTxt}>LIVE</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.liveTitle}>Go Live</Text>
                  <Text style={s.liveSub}>Broadcast to the world in real time</Text>
                </View>
                <Text style={s.liveArrow}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Photo Strip (horizontal polaroids) ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>📸 Moments</Text>
              <Text style={s.galleryCount}>{(profile?.gallery_photos || []).length}/6</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.polaroidRow}>
              {/* Add button */}
              <TouchableOpacity style={s.polaroidAdd} onPress={addGalleryPhoto} disabled={galleryUploading} activeOpacity={0.8}>
                {galleryUploading ? <ActivityIndicator color="#6C47FF" size="small" /> : <Text style={s.polaroidAddIcon}>+</Text>}
              </TouchableOpacity>
              {(profile?.gallery_photos || []).map((url, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.polaroid}
                  onPress={() => setViewingPhoto(url)}
                  onLongPress={() => removeGalleryPhoto(i)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: url }} style={s.polaroidImg} />
                  <TouchableOpacity style={s.polaroidRemove} onPress={() => removeGalleryPhoto(i)}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.galleryHint}>Hold a photo to remove it</Text>
          </View>

          {/* ── Subscription ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>💎 Subscription</Text>
            {isPremium ? (
              <LinearGradient colors={['#1C1F23', '#1C1F23']} style={[s.subCard, { borderColor: tierColor + '55' }]}>
                <View>
                  <Text style={[s.subName, { color: tierColor }]}>{tier === 'plus' ? '💜 Bond Plus' : '⭐ Bond Pro'}</Text>
                  <Text style={s.subPrice}>Free during beta</Text>
                </View>
                <TouchableOpacity style={[s.manageBtn, { backgroundColor: tierColor + '22', borderColor: tierColor + '66' }]} onPress={() => navigation.navigate('Subscription')}>
                  <Text style={[s.manageTxt, { color: tierColor }]}>Manage</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity style={s.upgradeCard} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
                <LinearGradient colors={['#6C47FF', '#5533DD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.upgradeInner}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.upgradeTitle}>Upgrade to Bond Plus</Text>
                    <Text style={s.upgradeSub}>Unlimited gifts · See who viewed you · Priority listing</Text>
                  </View>
                  <Text style={s.upgradeArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

        </Animated.ScrollView>
      )}

      {/* ════════════════════════ MY WORLD TAB ════════════════════════ */}
      {tab === 'culture' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.cultureForm}>
            <Text style={s.cultureFormTitle}>🌍 Share something about your culture</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {CULTURE_EMOJIS.map(e => (
                <TouchableOpacity key={e} style={[s.emojiBtn, cultureEmoji === e && s.emojiBtnOn]} onPress={() => setCultureEmoji(e)}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CULTURE_CATS.map(c => (
                <TouchableOpacity key={c} style={[s.catChip, cultureCat === c && s.catChipOn]} onPress={() => setCultureCat(c)}>
                  <Text style={[s.catChipTxt, cultureCat === c && { color: '#fff', fontWeight: '700' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={s.cultureInput}
              placeholder={`${cultureEmoji} Tell the world something about your culture...`}
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={cultureText} onChangeText={setCultureText} multiline maxLength={280}
            />
            <TouchableOpacity style={[s.postBtn, !cultureText.trim() && s.postBtnOff]} onPress={submitCulturePost} disabled={!cultureText.trim()}>
              <Text style={s.postBtnTxt}>Post to the World 🌍</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={culturePosts}
            keyExtractor={p => String(p.id)}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}
            renderItem={({ item }) => (
              <View style={s.postCard}>
                <View style={s.postHeader}>
                  <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.postUser}>{item.username} · {item.country}</Text>
                    <View style={s.postCatBadge}><Text style={s.postCatTxt}>{item.category}</Text></View>
                  </View>
                  <TouchableOpacity onPress={() => socket.emit('like_cultural_post', { postId: item.id })} style={{ alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 18 }}>❤️</Text>
                    <Text style={{ color: '#e57373', fontSize: 11, fontWeight: '700' }}>{item.likes}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.postTxt}>{item.text}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40, fontSize: 15 }}>No posts yet — be the first! 🌍</Text>}
          />
        </ScrollView>
      )}

      <EditModal visible={showEdit} profile={profile} onSave={saveProfile} onClose={() => setShowEdit(false)} />

      <ImpressionEditModal
        visible={!!editingImp}
        item={editingImp}
        onSave={text => saveImpression(editingImp?.key, text)}
        onClose={() => setEditingImp(null)}
      />

      {loading && (
        <View style={s.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color="#6C47FF" size="large" />
        </View>
      )}

      <Modal visible={!!viewingPhoto} transparent animationType="fade" onRequestClose={() => setViewingPhoto(null)}>
        <View style={s.photoModal}>
          <Image source={{ uri: viewingPhoto }} style={s.photoModalImg} resizeMode="contain" />
          <TouchableOpacity style={s.photoModalClose} onPress={() => setViewingPhoto(null)}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GLASS  = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.09)';

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },

  topBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 10 },
  topBarTitle:     { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  topBarActions:   { flexDirection: 'row', gap: 10 },
  editBtn:         { backgroundColor: 'rgba(108,71,255,0.15)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(108,71,255,0.35)' },
  editBtnTxt:      { color: '#6C47FF', fontSize: 13, fontWeight: '800' },
  settingsBtn:     { width: 40, height: 40, borderRadius: 14, backgroundColor: GLASS, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },

  tabBar:          { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', marginHorizontal: 20, marginBottom: 2 },
  tab:             { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: '#6C47FF' },
  tabTxt:          { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '700' },
  tabTxtActive:    { color: '#6C47FF' },

  scroll:          { paddingBottom: 90, gap: 26 },

  // Hero
  hero:            { alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 20 },
  heroGrad:        { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  avatarGlow:      { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: 0, opacity: 0.12 },
  avatarWrap:      { marginBottom: 16, position: 'relative' },
  avatarRing:      { width: 128, height: 128, borderRadius: 64, borderWidth: 3, padding: 3, backgroundColor: 'rgba(0,0,0,0.5)' },
  avatar:          { width: '100%', height: '100%', borderRadius: 56 },
  avatarFallback:  { width: '100%', height: '100%', borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:   { color: '#fff', fontSize: 46, fontWeight: '900' },
  cameraBtn:       { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  heroName:        { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  heroLoc:         { color: 'rgba(255,255,255,0.38)', fontSize: 13, marginTop: 4 },
  heroGender:      { color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 2 },
  tierPill:        { marginTop: 12, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 7 },
  tierPillTxt:     { fontSize: 13, fontWeight: '800' },

  // Footprint strip
  fpStrip:         { marginTop: 16, maxHeight: 44 },
  fpStripContent:  { alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  fpLabel:         { fontSize: 16, marginRight: 4 },
  fpFlag:          { width: 34, height: 34, borderRadius: 17, backgroundColor: GLASS, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  fpFlagEmoji:     { fontSize: 18 },

  // Completion
  completionBar:   { marginHorizontal: 20, backgroundColor: 'rgba(108,71,255,0.08)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(108,71,255,0.2)' },
  completionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  completionLbl:   { color: '#6C47FF', fontSize: 13, fontWeight: '800' },
  completionHint:  { color: 'rgba(108,71,255,0.6)', fontSize: 11, fontWeight: '600' },
  completionTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  completionFill:  { height: '100%', backgroundColor: '#6C47FF', borderRadius: 2 },

  // Stats
  statsRow:        { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  statCard:        { flex: 1, backgroundColor: GLASS, borderRadius: 20, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: BORDER },
  statIcon:        { fontSize: 18 },
  statValue:       { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabel:       { color: 'rgba(255,255,255,0.32)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },

  // Sections
  section:         { paddingHorizontal: 20, gap: 12 },
  sectionRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel:    { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionSub:      { color: 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: '600' },
  editLink:        { color: '#6C47FF', fontSize: 13, fontWeight: '700' },

  // Voice
  voiceEmpty:      { flexDirection: 'row', alignItems: 'center', backgroundColor: GLASS, borderRadius: 18, padding: 18, gap: 14, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed' },
  voiceEmptyTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700' },
  voiceEmptyHint:  { color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 3 },
  voiceArrow:      { color: '#6C47FF', fontSize: 22, fontWeight: '300' },

  // Story card
  storyCard:       { borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(108,71,255,0.18)' },
  storyQuote:      { color: '#6C47FF', fontSize: 36, fontWeight: '900', lineHeight: 36, marginBottom: -8 },
  storyText:       { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },

  dashedCard:      { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, paddingVertical: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderStyle: 'dashed' },
  dashedTxt:       { color: 'rgba(255,255,255,0.28)', fontSize: 14, fontWeight: '600' },

  // Mission Stamps
  stampsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stamp:           { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22, borderWidth: 1.5 },
  stampEmoji:      { fontSize: 16 },
  stampLabel:      { fontSize: 13, fontWeight: '800' },

  // Go Live
  liveCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(229,57,53,0.25)' },
  liveBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  liveDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeTxt:    { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  liveTitle:       { color: '#fff', fontWeight: '800', fontSize: 15 },
  liveSub:         { color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2 },
  liveArrow:       { color: 'rgba(255,255,255,0.3)', fontSize: 26 },

  // Polaroid photo strip
  polaroidRow:     { gap: 10, paddingVertical: 4 },
  polaroid:        { width: 120, height: 130, borderRadius: 12, backgroundColor: '#111', overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: BORDER },
  polaroidImg:     { width: '100%', height: '100%', borderRadius: 10 },
  polaroidRemove:  { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  polaroidAdd:     { width: 120, height: 130, borderRadius: 12, backgroundColor: GLASS, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  polaroidAddIcon: { color: 'rgba(255,255,255,0.3)', fontSize: 32, fontWeight: '200' },
  galleryCount:    { color: 'rgba(255,255,255,0.28)', fontSize: 12, fontWeight: '700' },
  galleryHint:     { color: 'rgba(255,255,255,0.18)', fontSize: 11, textAlign: 'center' },

  // Subscription
  subCard:         { borderRadius: 20, padding: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subName:         { fontSize: 16, fontWeight: '900' },
  subPrice:        { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 },
  manageBtn:       { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1 },
  manageTxt:       { fontSize: 13, fontWeight: '700' },
  upgradeCard:     { borderRadius: 20, overflow: 'hidden' },
  upgradeInner:    { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  upgradeTitle:    { color: '#fff', fontSize: 15, fontWeight: '900' },
  upgradeSub:      { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, lineHeight: 18 },
  upgradeArrow:    { color: '#fff', fontSize: 24, fontWeight: '200' },

  // Culture / My World tab
  cultureForm:     { backgroundColor: GLASS, margin: 16, borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: BORDER },
  cultureFormTitle:{ color: '#fff', fontSize: 15, fontWeight: '800' },
  emojiBtn:        { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  emojiBtnOn:      { backgroundColor: 'rgba(108,71,255,0.22)', borderColor: 'rgba(108,71,255,0.5)' },
  catChip:         { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  catChipOn:       { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  catChipTxt:      { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
  cultureInput:    { backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: 14, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  postBtn:         { backgroundColor: '#6C47FF', borderRadius: 16, padding: 15, alignItems: 'center' },
  postBtnOff:      { backgroundColor: 'rgba(255,255,255,0.08)' },
  postBtnTxt:      { color: '#fff', fontSize: 15, fontWeight: '800' },
  postCard:        { backgroundColor: GLASS, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER, gap: 12 },
  postHeader:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  postUser:        { color: '#fff', fontWeight: '800', fontSize: 13 },
  postCatBadge:    { backgroundColor: 'rgba(108,71,255,0.15)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 5, borderWidth: 1, borderColor: 'rgba(108,71,255,0.28)' },
  postCatTxt:      { color: '#6C47FF', fontSize: 10, fontWeight: '800' },
  postTxt:         { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 },

  // Photo modal
  photoModal:      { flex: 1, backgroundColor: '#000000f2', alignItems: 'center', justifyContent: 'center' },
  photoModalImg:   { width, height: width },
  photoModalClose: { position: 'absolute', top: 60, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff18', borderWidth: 1, borderColor: '#ffffff30', alignItems: 'center', justifyContent: 'center' },
});
