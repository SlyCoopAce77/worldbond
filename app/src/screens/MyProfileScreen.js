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
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { getAccessToken } from '../services/authApi';
import { SERVER_URL } from '../services/socket';
import { useTheme } from '../context/ThemeContext';
import { useWallet, BOND_MONUMENTS, STAMP_CAP, MONUMENT_CAP } from '../context/WalletContext';
import { useChallenge, isStampDropped } from '../context/ChallengeContext';
import { useBondPass } from '../context/PremiumContext';
import { getCountryFlag } from '../utils/countryUtils';
import { stringToColor } from '../utils/apiUtils';
const { width } = Dimensions.get('window');
const BOND_PINK = '#FF0080';

const STREAM_REGIONS = [
  { id: 'all',      label: 'All'          },
  { id: 'africa',   label: 'Africa'       },
  { id: 'asia',     label: 'Asia'         },
  { id: 'europe',   label: 'Europe'       },
  { id: 'americas', label: 'Americas'     },
  { id: 'mideast',  label: 'Middle East'  },
  { id: 'pacific',  label: 'Pacific'      },
];

const STREAM_CATS = [
  { id: 'all',     label: 'All'     },
  { id: 'music',   label: 'Music'   },
  { id: 'food',    label: 'Food'    },
  { id: 'talk',    label: 'Talk'    },
  { id: 'dance',   label: 'Dance'   },
  { id: 'travel',  label: 'Travel'  },
  { id: 'gaming',  label: 'Gaming'  },
  { id: 'art',     label: 'Art'     },
  { id: 'sport',   label: 'Sport'   },
  { id: 'culture', label: 'Culture' },
];

const STREAM_REGION_CODES = {
  africa:   ['NG','GH','ZA','KE','EG','SN','CI','TZ','ET','MA','CM','TN','DZ','SD','UG','RW'],
  asia:     ['CN','JP','KR','IN','PH','TH','ID','VN','MY','SG','BD','PK','MM','KH','LK','NP'],
  europe:   ['GB','FR','DE','IT','ES','NL','SE','NO','PL','UA','RU','TR','PT','GR','RO','HU'],
  americas: ['US','CA','MX','BR','CO','AR','PE','CL','EC','DO','CU','JM','HT','BO','VE'],
  mideast:  ['SA','AE','OM','QA','KW','BH','IQ','LB','JO','IL','SY','YE','PS','IR'],
  pacific:  ['AU','NZ','FJ','PG','WS','TO','VU','KI','FM','PW'],
};

const IMPRESSION_PROMPTS = [
  { key: 'give',   color: '#4fc3f7', prompt: 'One thing my country gave the world…'            },
  { key: 'draw',   color: '#81c784', prompt: 'What draws me to meeting new people…'            },
  { key: 'moment', color: '#ffb74d', prompt: 'The moment that left the biggest footprint on me…' },
];


const VIBE_TAGS = [
  'Deep Talks', 'Travel Plans', 'Language Swap', 'Night Owl',
  'Music Heads', 'Daily Bond', 'Foodie', 'Creator',
  'Adventure', 'Book Club', 'Gamer', 'Fitness',
];

const BOND_STYLES = [
  { key: 'open_book',   label: 'Open Book',    desc: 'You share freely and love transparency' },
  { key: 'observer',    label: 'Observer',      desc: 'You listen first, then open up slowly' },
  { key: 'hype_person', label: 'Hype Person',   desc: 'You bring energy and lift everyone up' },
  { key: 'philosopher', label: 'Philosopher',   desc: 'You go deep on ideas and big questions' },
  { key: 'adventurer',  label: 'Adventurer',    desc: 'You push for new experiences constantly' },
];

const INTERESTS = [
  'Sports', 'Tech', 'Art', 'Music', 'Food', 'Travel',
  'Gaming', 'Fitness', 'Fashion', 'Anime', 'Film', 'Science',
  'Business', 'Politics', 'Spirituality', 'Nature',
];

function completionPct(profile) {
  const checks = [
    profile?.photo_url,
    profile?.voice_note_url,
    profile?.bio,
    profile?.age,
    profile?.city,
    profile?.tagline,
    profile?.bond_style,
    (profile?.connection_types || []).length > 0,
    (profile?.vibe_tags || []).length > 0,
    (profile?.interests || []).length > 0,
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

// ─── VoiceNotePlayer ──────────────────────────────────────────────────────────
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
    <TouchableOpacity style={vn.container} onPress={togglePlay} activeOpacity={0.85} disabled={loading || loadErr}>
      {loading ? (
        <ActivityIndicator color={BOND_PINK} size="small" />
      ) : (
        <View style={[vn.btn, playing && vn.btnActive]}>
          {playing ? (
            <View style={vn.pauseIcon}>
              <View style={vn.pauseBar} />
              <View style={vn.pauseBar} />
            </View>
          ) : (
            <View style={vn.playIcon} />
          )}
        </View>
      )}
      <View style={vn.waveform}>
        {bars.map((h, i) => (
          <View key={i} style={[vn.bar, { height: h, opacity: playing ? 1 : 0.35 }]} />
        ))}
      </View>
      <Text style={vn.dur}>{loadErr ? '--:--' : fmt(playing ? position : duration)}</Text>
    </TouchableOpacity>
  );
}
const vn = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: BOND_PINK + '12', borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: BOND_PINK + '30' },
  btn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: BOND_PINK, alignItems: 'center', justifyContent: 'center' },
  btnActive: { backgroundColor: '#CC0060' },
  playIcon:  { width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 11, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 2 },
  pauseIcon: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  pauseBar:  { width: 3, height: 13, borderRadius: 1.5, backgroundColor: '#fff' },
  waveform:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar:       { width: 3, borderRadius: 2, backgroundColor: BOND_PINK },
  dur:       { color: '#666', fontSize: 12 },
});

// ─── EditModal ────────────────────────────────────────────────────────────────
function EditModal({ visible, profile, onSave, onClose }) {
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && visible) {
      setForm({
        display_name:     profile.display_name || '',
        age:              profile.age ? String(profile.age) : '',
        city:             profile.city || '',
        tagline:          profile.tagline || '',
        bond_style:       profile.bond_style || '',
        vibe_tags:        profile.vibe_tags || [],
        interests:        profile.interests || [],
      });
    }
  }, [profile, visible]);

  function toggleVibe(tag) {
    setForm(f => {
      const cur = f.vibe_tags || [];
      if (cur.includes(tag)) return { ...f, vibe_tags: cur.filter(t => t !== tag) };
      if (cur.length >= 5) return f;
      return { ...f, vibe_tags: [...cur, tag] };
    });
  }

  function toggleInterest(tag) {
    setForm(f => {
      const cur = f.interests || [];
      return { ...f, interests: cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag] };
    });
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

  const completionChecks = [
    form.display_name?.trim(),
    form.age,
    form.city?.trim(),
    form.tagline?.trim(),
    form.bond_style,
    (form.vibe_tags || []).length > 0,
    (form.interests || []).length > 0,
  ];
  const formPct = Math.round(completionChecks.filter(Boolean).length / completionChecks.length * 100);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={em.container}>

        {/* Header */}
        <View style={em.header}>
          <TouchableOpacity onPress={onClose}><Text style={em.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={em.title}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={BOND_PINK} /> : <Text style={em.save}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Profile strength bar */}
        <View style={em.strengthWrap}>
          <View style={em.strengthRow}>
            <Text style={em.strengthLabel}>Profile strength</Text>
            <Text style={em.strengthPct}>{formPct}%</Text>
          </View>
          <View style={em.strengthTrack}>
            <View style={[em.strengthFill, { width: `${formPct}%` }]} />
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={em.body} showsVerticalScrollIndicator={false}>

            {/* Display Name */}
            <View style={em.group}>
              <Text style={em.label}>Display Name</Text>
              <TextInput
                style={em.input}
                value={form.display_name}
                onChangeText={t => setForm(f => ({ ...f, display_name: t }))}
                maxLength={30}
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>

            {/* Age + City */}
            <View style={em.row}>
              <View style={[em.group, { flex: 1 }]}>
                <Text style={em.label}>Age</Text>
                <TextInput
                  style={em.input}
                  value={form.age}
                  onChangeText={t => setForm(f => ({ ...f, age: t }))}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>
              <View style={[em.group, { flex: 2 }]}>
                <Text style={em.label}>City</Text>
                <TextInput
                  style={em.input}
                  value={form.city}
                  onChangeText={t => setForm(f => ({ ...f, city: t }))}
                  placeholder="Your city"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>
            </View>

            {/* Tagline */}
            <View style={em.group}>
              <View style={em.labelRow}>
                <Text style={em.label}>Tagline</Text>
                <Text style={em.sublabel}>One punchy line — shows everywhere your name does</Text>
              </View>
              <TextInput
                style={em.input}
                value={form.tagline}
                onChangeText={t => setForm(f => ({ ...f, tagline: t }))}
                placeholder="e.g. Deep talks at 2am preferred"
                placeholderTextColor="rgba(255,255,255,0.2)"
                maxLength={50}
              />
              <Text style={em.charCount}>{(form.tagline || '').length}/50</Text>
            </View>

            {/* Bond Style */}
            <View style={em.group}>
              <View style={em.labelRow}>
                <Text style={em.label}>Bond Style</Text>
                <Text style={em.sublabel}>How you naturally connect</Text>
              </View>
              <View style={em.styleGrid}>
                {BOND_STYLES.map(bs => {
                  const on = form.bond_style === bs.key;
                  return (
                    <TouchableOpacity
                      key={bs.key}
                      style={[em.styleCard, on && em.styleCardOn]}
                      onPress={() => setForm(f => ({ ...f, bond_style: bs.key }))}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[em.styleLabel, on && { color: BOND_PINK }]}>{bs.label}</Text>
                        <Text style={em.styleDesc}>{bs.desc}</Text>
                      </View>
                      <View style={[em.radioOuter, on && em.radioOuterOn]}>
                        {on && <View style={em.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Vibe Tags */}
            <View style={em.group}>
              <View style={em.labelRow}>
                <Text style={em.label}>Vibe Tags</Text>
                <Text style={em.sublabel}>Pick up to 5 · {(form.vibe_tags || []).length}/5 selected</Text>
              </View>
              <View style={em.chipWrap}>
                {VIBE_TAGS.map(tag => {
                  const on    = (form.vibe_tags || []).includes(tag);
                  const maxed = (form.vibe_tags || []).length >= 5 && !on;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[em.chip, on && em.chipOn, maxed && em.chipDim]}
                      onPress={() => toggleVibe(tag)}
                      activeOpacity={0.8}
                    >
                      <Text style={[em.chipText, on && { color: BOND_PINK, fontWeight: '700' }]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Interests */}
            <View style={em.group}>
              <View style={em.labelRow}>
                <Text style={em.label}>Interests</Text>
                <Text style={em.sublabel}>Shown under your bio · feeds Discovery</Text>
              </View>
              <View style={em.chipWrap}>
                {INTERESTS.map(tag => {
                  const on = (form.interests || []).includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[em.chip, on && em.chipOn]}
                      onPress={() => toggleInterest(tag)}
                      activeOpacity={0.8}
                    >
                      <Text style={[em.chipText, on && { color: BOND_PINK, fontWeight: '700' }]}>{tag}</Text>
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
const em = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#000' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  cancel:        { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '600' },
  title:         { color: '#fff', fontSize: 18, fontWeight: '900' },
  save:          { color: BOND_PINK, fontSize: 16, fontWeight: '800' },
  strengthWrap:  { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e1e', gap: 6 },
  strengthRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strengthLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  strengthPct:   { color: BOND_PINK, fontSize: 11, fontWeight: '800' },
  strengthTrack: { height: 3, backgroundColor: '#1e1e1e', borderRadius: 2, overflow: 'hidden' },
  strengthFill:  { height: '100%', backgroundColor: BOND_PINK, borderRadius: 2 },
  body:          { padding: 20, gap: 24, paddingBottom: 60 },
  row:           { flexDirection: 'row', gap: 12 },
  group:         { gap: 8 },
  labelRow:      { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  label:         { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  sublabel:      { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '500' },
  charCount:     { color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'right' },
  input:         { backgroundColor: '#16181C', color: '#fff', fontSize: 15, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2a2a2a' },
  chipWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2a2a2a' },
  chipOn:        { backgroundColor: BOND_PINK + '18', borderColor: BOND_PINK + '55' },
  chipDim:       { opacity: 0.35 },
  chipText:      { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  styleGrid:     { gap: 8 },
  styleCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2a2a2a' },
  styleCardOn:   { borderColor: BOND_PINK + '60', backgroundColor: BOND_PINK + '10' },
  styleLabel:    { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  styleDesc:     { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '500' },
  radioOuter:    { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#555', alignItems: 'center', justifyContent: 'center' },
  radioOuterOn:  { borderColor: BOND_PINK },
  radioDot:      { width: 9, height: 9, borderRadius: 5, backgroundColor: BOND_PINK },
});

// ─── ImpressionCard ───────────────────────────────────────────────────────────
function ImpressionCard({ data, onEdit }) {
  return (
    <TouchableOpacity style={imp.card} onPress={onEdit} activeOpacity={0.85}>
      <View style={imp.topRow}>
        <View style={[imp.dot, { backgroundColor: data.color }]} />
        <Text style={imp.prompt}>{data.prompt}</Text>
      </View>
      {data.answer
        ? <Text style={imp.answer}>"{data.answer}"</Text>
        : <Text style={imp.emptyText}>Tap to leave your impression…</Text>}
    </TouchableOpacity>
  );
}
const imp = StyleSheet.create({
  card:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10 },
  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:       { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  prompt:    { color: 'rgba(255,255,255,0.38)', fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 17 },
  answer:    { color: '#fff', fontSize: 15, fontStyle: 'italic', lineHeight: 23, paddingLeft: 30 },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic', paddingLeft: 30 },
});

// ─── ImpressionEditModal ──────────────────────────────────────────────────────
function ImpressionEditModal({ visible, item, onSave, onClose }) {
  const [text, setText] = useState('');
  useEffect(() => { if (visible) setText(item?.answer || ''); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={ie.sheet}>
          <View style={ie.handle} />
          {item?.color && <View style={[ie.colorBar, { backgroundColor: item.color }]} />}
          <Text style={ie.prompt}>{item?.prompt}</Text>
          <TextInput
            style={ie.input}
            value={text}
            onChangeText={setText}
            placeholder="Write your impression…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
            maxLength={180}
            autoFocus
          />
          <Text style={ie.count}>{text.length}/180</Text>
          <TouchableOpacity
            style={[ie.saveBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={() => { onSave(text.trim()); onClose(); }}
            disabled={!text.trim()}
          >
            <Text style={ie.saveTxt}>Save Impression</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const ie = StyleSheet.create({
  sheet:    { backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, paddingBottom: 40 },
  handle:   { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  colorBar: { height: 3, width: 40, borderRadius: 2, alignSelf: 'center' },
  prompt:   { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  input:   { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 16, padding: 16, fontSize: 15, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2a2a2a', lineHeight: 23 },
  count:   { color: '#333', fontSize: 11, textAlign: 'right' },
  saveBtn: { backgroundColor: BOND_PINK, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── BioEditModal ─────────────────────────────────────────────────────────────
function BioEditModal({ visible, currentBio, onSave, onClose }) {
  const [text, setText] = useState('');
  useEffect(() => { if (visible) setText(currentBio || ''); }, [visible, currentBio]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={be.sheet}>
          <View style={be.handle} />
          <Text style={be.title}>Bio</Text>
          <TextInput
            style={be.input}
            value={text}
            onChangeText={setText}
            placeholder="What makes you interesting?"
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
            maxLength={200}
            autoFocus
            textAlignVertical="top"
          />
          <Text style={be.count}>{text.length}/200</Text>
          <TouchableOpacity
            style={be.saveBtn}
            onPress={() => { onSave(text.trim()); onClose(); }}
          >
            <Text style={be.saveTxt}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const be = StyleSheet.create({
  sheet:   { backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, paddingBottom: 40 },
  handle:  { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  title:   { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  input:   { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 16, padding: 16, fontSize: 15, minHeight: 110, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2a2a2a', lineHeight: 23 },
  count:   { color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'right' },
  saveBtn: { backgroundColor: BOND_PINK, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── PassportSection ──────────────────────────────────────────────────────────
const STAMP_ROTATIONS = [-6, -3, 0, 3, 6];
const MRZ_1 = 'P<WBONDHOLDER<<<<<<<<<<<<<<<<<<<<<<<<<<';
const MRZ_2 = 'BC0000000<7WB<<<<<<<<<<<<<<<0000000000';

function PassportSection({ bondCount, countries, myStamps, myMonuments, hasBondPass, onViewAll }) {
  const allUnlocked    = bondCount >= 3;
  const contentOpacity = allUnlocked ? 1 : 0.3 + (bondCount / 3) * 0.7;
  const stampCap       = hasBondPass ? STAMP_CAP.bond_pass    : STAMP_CAP.standard;
  const monumentCap    = hasBondPass ? MONUMENT_CAP.bond_pass : MONUMENT_CAP.standard;
  const heldMonuments  = myMonuments.map(id => BOND_MONUMENTS.find(m => m.id === id)).filter(Boolean);

  return (
    <View style={{ marginHorizontal: 20 }}>
      {/* Passport — always visible, brightens with each bond */}
      <View style={{ opacity: contentOpacity }}>
        <LinearGradient colors={['#0d1528', '#06091400']} style={ps.passport}>
          <View style={ps.watermark} pointerEvents="none">
            <View style={ps.wmRing1} />
            <View style={ps.wmRing2} />
            <View style={ps.wmRing3} />
          </View>
          <View style={ps.phRow}>
            <View style={{ flex: 1 }}>
              <Text style={ps.phNation}>WORLDBOND</Text>
              <Text style={ps.phTitle}>WORLD PASSPORT</Text>
              <Text style={ps.phIssued}>International Division · All Borders</Text>
            </View>
            <View style={ps.sealOuter}>
              <View style={ps.sealMiddle}>
                <View style={ps.sealInner}>
                  <Text style={ps.sealTxt}>WB</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={ps.phDivider} />
          <View style={ps.phBlock}>
            <View style={ps.phLabelRow}>
              <Text style={ps.phSectionLabel}>Country Stamps</Text>
              <Text style={ps.phCap}>{myStamps.length} / {stampCap}</Text>
            </View>
            <View style={ps.stampGrid}>
              {myStamps.map((flag, i) => (
                <View key={flag} style={[ps.stampOuter, { transform: [{ rotate: `${STAMP_ROTATIONS[i % STAMP_ROTATIONS.length]}deg` }] }]}>
                  <View style={ps.stampInner}>
                    <Text style={ps.stampFlag}>{flag}</Text>
                    <Text style={ps.stampCert}>CERTIFIED</Text>
                  </View>
                </View>
              ))}
              {Array.from({ length: stampCap - myStamps.length }).map((_, i) => (
                <View key={`es-${i}`} style={ps.stampEmpty} />
              ))}
            </View>
            {myStamps.length === 0 && (
              <Text style={ps.phHint}>Win a country stamp challenge to add your first seal</Text>
            )}
          </View>
          <View style={ps.phDivider} />
          <View style={ps.phBlock}>
            <View style={ps.phLabelRow}>
              <Text style={ps.phSectionLabel}>Monuments</Text>
              <Text style={ps.phCap}>{heldMonuments.length} / {monumentCap}</Text>
            </View>
            <View style={ps.monumentList}>
              {heldMonuments.map(m => (
                <View key={m.id} style={ps.monumentBadge}>
                  <View style={ps.monumentAccent} />
                  <Text style={ps.monumentIcon}>{m.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={ps.monumentName}>{m.name}</Text>
                    <Text style={ps.monumentLoc}>{m.country}  {m.location}</Text>
                  </View>
                  <Text style={ps.visaStamp}>VISA</Text>
                </View>
              ))}
              {Array.from({ length: monumentCap - heldMonuments.length }).map((_, i) => (
                <View key={`em-${i}`} style={ps.monumentEmpty} />
              ))}
            </View>
            {heldMonuments.length === 0 && (
              <Text style={ps.phHint}>Win a monument challenge to earn your first visa</Text>
            )}
          </View>
          <View style={ps.mrz}>
            <Text style={ps.mrzLine}>{MRZ_1}</Text>
            <Text style={ps.mrzLine}>{MRZ_2}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Lock overlay — fades away with each bond, gone at 3 */}
      {!allUnlocked && (
        <View style={ps.lockOverlay} pointerEvents="none">
          <View style={ps.lockBox}>
            <Text style={ps.lockLabel}>
              {bondCount === 0 ? 'Make your first bond to begin' : `${3 - bondCount} more bond${3 - bondCount !== 1 ? 's' : ''} to unlock`}
            </Text>
            <View style={ps.lockBar}>
              <View style={[ps.lockFill, { width: `${(bondCount / 3) * 100}%` }]} />
            </View>
            <Text style={ps.lockCount}>{bondCount} / 3</Text>
          </View>
        </View>
      )}
    </View>
  );
}
const ps = StyleSheet.create({
  // ── Pre-unlock card ────────────────────────────────────────────────────────
  card:             { backgroundColor: '#0d0d0d', borderRadius: 22, padding: 18, gap: 16, borderWidth: 1, borderColor: BOND_PINK + '25', marginHorizontal: 20 },
  cardHeader:       { flexDirection: 'row', alignItems: 'center' },
  cardTitle:        { color: '#fff', fontSize: 17, fontWeight: '900' },
  cardSub:          { color: BOND_PINK, fontSize: 12, marginTop: 2, fontWeight: '600' },
  viewAllBtn:       { backgroundColor: BOND_PINK + '18', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: BOND_PINK + '40' },
  viewAllTxt:       { color: BOND_PINK, fontSize: 12, fontWeight: '700' },
  flagGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flagChip:         { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: BOND_PINK + '25', alignItems: 'center', justifyContent: 'center' },
  flagChipTxt:      { fontSize: 24 },
  flagChipExtra:    { backgroundColor: BOND_PINK + '15' },
  flagChipExtraTxt: { color: BOND_PINK, fontSize: 13, fontWeight: '800' },
  emptyTxt:         { color: 'rgba(255,255,255,0.25)', fontSize: 13, lineHeight: 19 },
  progressWrap:     { gap: 6 },
  progressTrack:    { height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' },
  progressFill:     { height: '100%', backgroundColor: BOND_PINK, borderRadius: 2 },
  progressLabel:    { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  gatesRow:         { flexDirection: 'row', gap: 8 },
  gate:             { flex: 1, alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  gateOn:           { backgroundColor: BOND_PINK + '12', borderColor: BOND_PINK + '35' },
  gateDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 2 },
  gateLabel:        { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  gateLabelOn:      { color: BOND_PINK },
  gateCheck:        { color: BOND_PINK, fontSize: 10, fontWeight: '900' },
  gateThreshold:    { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '700' },
  // ── Unlocked passport ─────────────────────────────────────────────────────
  passport:         { borderRadius: 22, overflow: 'hidden', marginHorizontal: 20, borderWidth: 1.5, borderColor: '#1e3a5f' },
  // Watermark
  watermark:        { position: 'absolute', top: 20, right: 20, width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  wmRing1:          { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.04)' },
  wmRing2:          { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1,   borderColor: 'rgba(255,255,255,0.04)' },
  wmRing3:          { position: 'absolute', width: 64,  height: 64,  borderRadius: 32, borderWidth: 1,   borderColor: 'rgba(255,255,255,0.04)' },
  // Header
  phRow:            { flexDirection: 'row', alignItems: 'center', padding: 18, paddingBottom: 14 },
  phNation:         { color: BOND_PINK, fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 3 },
  phTitle:          { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  phIssued:         { color: 'rgba(255,255,255,0.28)', fontSize: 10, marginTop: 4, fontWeight: '500', letterSpacing: 0.4 },
  // Seal (3 rings)
  sealOuter:        { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: BOND_PINK + '45', alignItems: 'center', justifyContent: 'center' },
  sealMiddle:       { width: 50, height: 50, borderRadius: 25, borderWidth: 1,   borderColor: BOND_PINK + '28', alignItems: 'center', justifyContent: 'center' },
  sealInner:        { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: BOND_PINK + '70', alignItems: 'center', justifyContent: 'center', backgroundColor: BOND_PINK + '14' },
  sealTxt:          { color: BOND_PINK, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  // Dividers & blocks
  phDivider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 18 },
  phBlock:          { paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  phLabelRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phSectionLabel:   { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  phCap:            { color: 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: '700' },
  phHint:           { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  // Country stamps
  stampGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  stampOuter:       { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: BOND_PINK + '55', alignItems: 'center', justifyContent: 'center', backgroundColor: BOND_PINK + '07' },
  stampInner:       { width: 74, height: 74, borderRadius: 37, borderWidth: 1, borderColor: BOND_PINK + '28', alignItems: 'center', justifyContent: 'center', gap: 3 },
  stampFlag:        { fontSize: 38 },
  stampCert:        { color: BOND_PINK, fontSize: 7, fontWeight: '900', letterSpacing: 1.5 },
  stampEmpty:       { width: 88, height: 88, borderRadius: 44, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' },
  // Monuments
  monumentList:     { gap: 8 },
  monumentBadge:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, paddingLeft: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  monumentAccent:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: BOND_PINK + '80' },
  monumentIcon:     { fontSize: 22 },
  monumentName:     { color: '#fff', fontSize: 13, fontWeight: '800' },
  monumentLoc:      { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 },
  visaStamp:        { color: BOND_PINK + '55', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, transform: [{ rotate: '-12deg' }] },
  monumentEmpty:    { height: 46, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.015)' },
  // Machine-readable zone
  mrz:              { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 18, paddingVertical: 12, gap: 3 },
  mrzLine:          { color: 'rgba(255,255,255,0.09)', fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  // Lock overlay (shown before 3 bonds)
  lockOverlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  lockBox:          { alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  lockLabel:        { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  lockBar:          { height: 4, width: 140, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  lockFill:         { height: 4, backgroundColor: BOND_PINK, borderRadius: 2 },
  lockCount:        { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },
});

// ─── MyProfileScreen ──────────────────────────────────────────────────────────
export default function MyProfileScreen({ navigation, user, onLogout }) {
  const { colors } = useTheme();
  const { hasBondPass } = useBondPass();
  const { myStamps, myMonuments, stamps, totalStampWins, totalMonumentWins } = useWallet();
  const { challenges } = useChallenge();
  const socket = getSocket();

  const [profile,         setProfile]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [matchCount,      setMatchCount]      = useState(0);
  const [flagsPlanted,    setFlagsPlanted]    = useState([]);
  const [showEdit,        setShowEdit]        = useState(false);
  const [tab,             setTab]             = useState('profile');
  const [galleryUploading,setGalleryUploading]= useState(false);
  const [viewingPhoto,    setViewingPhoto]    = useState(null);
  const [coverPhotoUrl,   setCoverPhotoUrl]   = useState(null);
  const [liveStreams,   setLiveStreams]  = useState([]);
  const [liveRegion,   setLiveRegion]  = useState('all');
  const [filterCat,    setFilterCat]   = useState('all');
  const [searchQuery,  setSearchQuery] = useState('');
  const [filterOpen,   setFilterOpen]  = useState(null);
  const [impressions,     setImpressions]     = useState({ give: '', draw: '', moment: '' });
  const [editingImp,      setEditingImp]      = useState(null);
  const [showBioEdit,     setShowBioEdit]     = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const loadData = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) { setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, mRes] = await Promise.allSettled([
        axios.get(`${SERVER_URL}/api/profiles/me`, { headers, timeout: 8000 }),
        axios.get(`${SERVER_URL}/api/matches`,      { headers, timeout: 8000 }),
      ]);
      if (pRes.status === 'fulfilled') setProfile(pRes.value.data);
      if (mRes.status === 'fulfilled') setMatchCount(mRes.value.data.length);

      const raw    = await AsyncStorage.getItem('bond_saved_countries');
      const impRaw = await AsyncStorage.getItem('world_impressions');
      setFlagsPlanted(raw ? JSON.parse(raw) : []);
      if (impRaw) setImpressions(JSON.parse(impRaw));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    if (socket.connected) socket.emit('get_live_streams');
    else socket.once('connect', () => socket.emit('get_live_streams'));
    socket.on('live_streams', setLiveStreams);
    return () => socket.off('live_streams', setLiveStreams);
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
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

  async function pickCoverPhoto() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.85 });
    if (!result.assets?.[0]) return;
    const asset = result.assets[0];
    try {
      const token = await getAccessToken();
      const form  = new FormData();
      form.append('photo',    { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'cover.jpg' });
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
        body: JSON.stringify({ cover_photo_url: data.imageUrl }),
      });
      setCoverPhotoUrl(data.imageUrl);
      setProfile(p => ({ ...p, cover_photo_url: data.imageUrl }));
    } catch { Alert.alert('Error', 'Could not upload background. Try again.'); }
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

  const pct         = completionPct(profile);
  const displayName = profile?.display_name || user?.username || 'You';
  const countryStr  = profile?.country || user?.country || '';
  const countryFlag = getCountryFlag(countryStr);
  const countryCity = [profile?.city, countryStr].filter(Boolean).join(', ');

  // Filter stamps/monuments: remove any that are dropped (30-day inactivity) or lost in a challenge
  const activeStamps = myStamps.filter(flag => {
    if (isStampDropped(stamps[flag])) return false;
    return !Object.values(challenges).some(
      ch => ch.monumentId === `stamp_${flag}` &&
            ch.status === 'resolved' &&
            ch.winner === 'challenger' &&
            ch.holderUsername === displayName,
    );
  });
  const activeMonuments = myMonuments.filter(id =>
    !Object.values(challenges).some(
      ch => ch.monumentId === id &&
            ch.status === 'resolved' &&
            ch.winner === 'challenger' &&
            ch.holderUsername === displayName,
    ),
  );

  return (
    <LinearGradient colors={['#080a10', '#07080f', '#050608']} style={{ flex: 1 }}>
    <SafeAreaView style={s.container}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>Profile</Text>
        <View style={s.topBarActions}>
          <TouchableOpacity style={s.editBtn} onPress={() => setShowEdit(true)}>
            <Text style={s.editBtnTxt}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <View style={s.slidersIcon}>
              <View style={s.sliderRow}>
                <View style={s.sliderTrack} />
                <View style={s.sliderKnob} />
                <View style={[s.sliderTrack, { flex: 0.5 }]} />
              </View>
              <View style={s.sliderRow}>
                <View style={[s.sliderTrack, { flex: 0.5 }]} />
                <View style={s.sliderKnob} />
                <View style={s.sliderTrack} />
              </View>
              <View style={s.sliderRow}>
                <View style={s.sliderTrack} />
                <View style={s.sliderKnob} />
                <View style={[s.sliderTrack, { flex: 0.3 }]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        {[{ key: 'profile', label: 'Profile' }, { key: 'culture', label: 'My World' }].map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.tabTxt, tab === t.key && s.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ════════════════════ PROFILE TAB ════════════════════ */}
      {tab === 'profile' && (
        <Animated.ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >

          {/* ── Banner ── */}
          <View style={s.banner}>
            {(coverPhotoUrl || profile?.cover_photo_url) ? (
              <Image source={{ uri: coverPhotoUrl || profile.cover_photo_url }} style={s.bannerBg} resizeMode="cover" />
            ) : (
              <LinearGradient colors={[BOND_PINK + 'cc', BOND_PINK + '55', BOND_PINK + '22']} style={s.bannerBg} />
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={s.bannerFade} />
            <TouchableOpacity style={s.editBgBtn} onPress={pickCoverPhoto} activeOpacity={0.75}>
              <Text style={s.editBgDots}>•••</Text>
            </TouchableOpacity>
          </View>

          {/* ── Avatar ── */}
          <View style={s.avatarRow}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={s.avatarWrap}>
              <View style={s.avatarRing}>
                {profile?.photo_url ? (
                  <Image source={{ uri: profile.photo_url }} style={s.avatar} />
                ) : (
                  <LinearGradient colors={[BOND_PINK, BOND_PINK + 'aa']} style={s.avatarFallback}>
                    <Text style={s.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={s.cameraBtn}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>+</Text></View>
            </TouchableOpacity>
          </View>

          {/* ── Name + location ── */}
          <View style={s.profileInfo}>
            <Text style={s.heroName} numberOfLines={1}>{displayName}{profile?.age ? `, ${profile.age}` : ''}</Text>
            {countryCity ? <Text style={s.heroLoc}>{countryCity} {countryFlag}</Text> : null}
            {profile?.gender ? <Text style={s.heroGender}>{profile.gender}</Text> : null}
          </View>

          {/* ── Bio ── */}
          <TouchableOpacity style={s.bioWrap} onPress={() => setShowBioEdit(true)} activeOpacity={0.7}>
            {profile?.bio
              ? <Text style={s.bioText}>{profile.bio}</Text>
              : <Text style={s.bioPlaceholder}>Add a bio</Text>}
          </TouchableOpacity>

          {/* ── Stats ── */}
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statNum}>{matchCount ?? '—'}</Text>
              <Text style={s.statLabel}> Bonds</Text>
            </View>
            <Text style={s.statDot}>·</Text>
            <View style={s.stat}>
              <Text style={s.statNum}>{totalStampWins}</Text>
              <Text style={s.statLabel}> Stamps</Text>
            </View>
            <Text style={s.statDot}>·</Text>
            <View style={s.stat}>
              <Text style={s.statNum}>{totalMonumentWins}</Text>
              <Text style={s.statLabel}> Monuments</Text>
            </View>
          </View>

          {/* ── World Passport ── */}
          <PassportSection
            bondCount={matchCount}
            countries={flagsPlanted}
            myStamps={activeStamps}
            myMonuments={activeMonuments}
            hasBondPass={hasBondPass}
            onViewAll={() => navigation.navigate('CountryStampChallenge', {
              stamp: flagsPlanted.length > 0 ? { flag: getCountryFlag(flagsPlanted[0]) } : {},
            })}
          />

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

          {/* ── Moments ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>Moments</Text>
              <Text style={s.galleryCount}>{(profile?.gallery_photos || []).length}/6</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.polaroidRow}>
              <TouchableOpacity style={s.polaroidAdd} onPress={addGalleryPhoto} disabled={galleryUploading} activeOpacity={0.8}>
                {galleryUploading
                  ? <ActivityIndicator color={BOND_PINK} size="small" />
                  : <Text style={s.polaroidAddIcon}>+</Text>}
              </TouchableOpacity>
              {(profile?.gallery_photos || []).map((url, i) => (
                <TouchableOpacity key={i} style={s.polaroid} onPress={() => setViewingPhoto(url)} onLongPress={() => removeGalleryPhoto(i)} activeOpacity={0.9}>
                  <Image source={{ uri: url }} style={s.polaroidImg} />
                  <TouchableOpacity style={s.polaroidRemove} onPress={() => removeGalleryPhoto(i)}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.galleryHint}>Hold a photo to remove it</Text>
          </View>

          {/* ── Voice Signature ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>Voice Signature</Text>
            </View>
            {profile?.voice_note_url ? (
              <VoiceNotePlayer url={profile.voice_note_url} />
            ) : (
              <View style={s.voiceEmpty}>
                <View style={s.voiceMicIcon}>
                  <View style={s.voiceMicHead} />
                  <View style={s.voiceMicStand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.voiceEmptyTitle}>Voice Signature</Text>
                  <Text style={s.voiceEmptyHint}>Coming soon — let people hear you before they Bond</Text>
                </View>
              </View>
            )}
          </View>

          {/* ── World Impressions ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>World Impressions</Text>
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

          {/* ── Go Live ── */}
          <View style={s.section}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Live', {
                user: { username: profile?.display_name || user?.username, userId: user?.userId, photo_url: profile?.photo_url || user?.photo_url },
              })}
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

          {/* ── Bond Wallet ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Bond Wallet</Text>
            <TouchableOpacity style={s.walletCard} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.85}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.walletTitle}>Bond Coins & Earnings</Text>
                <Text style={s.walletSub}>View gifts, stamps, and cash out</Text>
              </View>
              <Text style={s.walletArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* ── Bond Pass ── */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Bond Pass</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85} style={s.passCard}>
              <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.passInner}>
                <View style={{ flex: 1 }}>
                  <Text style={s.passTitle}>Bond Pass — $4.99/month</Text>
                  <Text style={s.passSub}>Unlimited daily connects · Priority matching</Text>
                </View>
                <Text style={s.passArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </Animated.ScrollView>
      )}

      {/* ════════════════════ MY WORLD TAB ════════════════════ */}
      {tab === 'culture' && (() => {
        const q = searchQuery.trim().toLowerCase();
        let visible = liveStreams.filter(st => {
          if (q && !(st.hostName || '').toLowerCase().includes(q) && !(st.title || '').toLowerCase().includes(q)) return false;
          if (filterCat !== 'all' && (st.category || '').toLowerCase() !== filterCat) return false;
          if (liveRegion !== 'all' && !(STREAM_REGION_CODES[liveRegion] || []).includes((st.hostCountry || '').toUpperCase())) return false;
          return true;
        });
        visible.sort((a, b) => ((b.viewerCount || 0) + (b.giftCount || 0) * 5) - ((a.viewerCount || 0) + (a.giftCount || 0) * 5));

        const catLabel    = STREAM_CATS.find(c => c.id === filterCat)?.label || 'Category';
        const regionLabel = STREAM_REGIONS.find(r => r.id === liveRegion)?.label || 'Region';
        const hasFilter   = filterCat !== 'all' || liveRegion !== 'all';

        return (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Search */}
            <View style={s.searchWrap}>
              <View style={s.searchBar}>
                <View style={s.searchDot} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search streamers or topics..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={s.searchClear}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Combined filter bar */}
            <View style={s.filterBar}>
              <TouchableOpacity
                style={[s.filterPill, filterCat !== 'all' && s.filterPillOn]}
                onPress={() => setFilterOpen(filterOpen === 'cat' ? null : 'cat')}
                activeOpacity={0.8}
              >
                <Text style={[s.filterPillTxt, filterCat !== 'all' && s.filterPillTxtOn]}>
                  {catLabel}  {filterOpen === 'cat' ? '▲' : '▾'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.filterPill, liveRegion !== 'all' && s.filterPillOn]}
                onPress={() => setFilterOpen(filterOpen === 'region' ? null : 'region')}
                activeOpacity={0.8}
              >
                <Text style={[s.filterPillTxt, liveRegion !== 'all' && s.filterPillTxtOn]}>
                  {regionLabel}  {filterOpen === 'region' ? '▲' : '▾'}
                </Text>
              </TouchableOpacity>

              {hasFilter && (
                <TouchableOpacity
                  style={s.clearBtn}
                  onPress={() => { setFilterCat('all'); setLiveRegion('all'); setFilterOpen(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={s.clearTxt}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown panels */}
            {filterOpen === 'cat' && (
              <View style={s.dropPanel}>
                {STREAM_CATS.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.dropItem, filterCat === c.id && s.dropItemOn]}
                    onPress={() => { setFilterCat(c.id); setFilterOpen(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.dropTxt, filterCat === c.id && s.dropTxtOn]}>{c.label}</Text>
                    {filterCat === c.id && <View style={s.dropCheck} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {filterOpen === 'region' && (
              <View style={s.dropPanel}>
                {STREAM_REGIONS.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[s.dropItem, liveRegion === r.id && s.dropItemOn]}
                    onPress={() => { setLiveRegion(r.id); setFilterOpen(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.dropTxt, liveRegion === r.id && s.dropTxtOn]}>{r.label}</Text>
                    {liveRegion === r.id && <View style={s.dropCheck} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Stream count header */}
            {visible.length > 0 && (
              <View style={s.streamHeader}>
                <View style={s.streamHeaderDot} />
                <Text style={s.streamHeaderTxt}>
                  {visible.length} live {visible.length === 1 ? 'stream' : 'streams'}
                </Text>
              </View>
            )}

            {/* Empty state */}
            {visible.length === 0 && (
              <View style={s.worldEmpty}>
                <Text style={s.worldEmptyTitle}>No streams right now</Text>
                <Text style={s.worldEmptyTxt}>
                  {liveStreams.length === 0
                    ? 'Nobody is live yet — be the first.'
                    : 'Try changing your filters.'}
                </Text>
                {liveStreams.length === 0 && (
                  <TouchableOpacity onPress={() => navigation.navigate('Live', { user })} activeOpacity={0.85} style={s.worldGoLive}>
                    <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.worldGoLiveGrad}>
                      <Text style={s.worldGoLiveTxt}>Go Live</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Stream list */}
            {visible.map(st => {
              const col = stringToColor(st.hostName || '');
              return (
                <TouchableOpacity
                  key={st.streamId}
                  style={s.streamRow}
                  onPress={() => navigation.navigate('LiveWatch', { stream: st, currentUser: user })}
                  activeOpacity={0.85}
                >
                  <View style={[s.streamAvatar, { backgroundColor: col }]}>
                    <Text style={s.streamAvatarTxt}>{(st.hostName || '?')[0].toUpperCase()}</Text>
                    {st.hostCountry ? (
                      <View style={s.streamFlagBadge}>
                        <Text style={s.streamFlagTxt}>{getCountryFlag(st.hostCountry)}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={s.streamInfo}>
                    <View style={s.streamNameRow}>
                      <Text style={s.streamName} numberOfLines={1}>{st.hostName}</Text>
                      <View style={s.streamLiveBadge}>
                        <View style={s.streamLiveDot} />
                        <Text style={s.streamLiveTxt}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={s.streamTitle} numberOfLines={1}>{st.title || 'Live on WorldBond'}</Text>
                    <View style={s.streamMeta}>
                      <Text style={s.streamViewers}>{st.viewerCount || 0} watching</Text>
                      {st.category ? (
                        <View style={s.streamCatBadge}>
                          <Text style={s.streamCatTxt}>{st.category}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.joinBtn}>
                    <Text style={s.joinTxt}>Join</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}

            <View style={{ height: 40 }} />
          </ScrollView>
        );
      })()}

      <EditModal visible={showEdit} profile={profile} onSave={saveProfile} onClose={() => setShowEdit(false)} />

      <BioEditModal
        visible={showBioEdit}
        currentBio={profile?.bio}
        onSave={bio => saveProfile({ bio })}
        onClose={() => setShowBioEdit(false)}
      />

      <ImpressionEditModal
        visible={!!editingImp}
        item={editingImp}
        onSave={text => saveImpression(editingImp?.key, text)}
        onClose={() => setEditingImp(null)}
      />

      {loading && (
        <View style={s.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={BOND_PINK} size="large" />
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
  container:      { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },

  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 10 },
  topBarTitle:   { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  topBarActions: { flexDirection: 'row', gap: 10 },
  editBtn:       { backgroundColor: BOND_PINK + '18', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: BOND_PINK + '40' },
  editBtnTxt:    { color: BOND_PINK, fontSize: 13, fontWeight: '800' },
  settingsBtn:   { width: 40, height: 40, borderRadius: 14, backgroundColor: GLASS, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  slidersIcon:   { gap: 4, width: 20 },
  sliderRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sliderTrack:   { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 1 },
  sliderKnob:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },

  tabBar:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', marginHorizontal: 20, marginBottom: 2 },
  tab:         { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive:   { borderBottomWidth: 2, borderBottomColor: BOND_PINK },
  tabTxt:      { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '700' },
  tabTxtActive:{ color: BOND_PINK },

  scroll: { paddingBottom: 90, gap: 24 },

  // Banner
  banner:    { height: 185, overflow: 'hidden', backgroundColor: '#05000a' },
  bannerBg:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bannerFade:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 85 },
  editBgBtn: { position: 'absolute', top: 12, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', zIndex: 10 },
  editBgDots:{ color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },

  // Avatar
  avatarRow:      { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: -42, paddingBottom: 8 },
  avatarWrap:     { position: 'relative' },
  avatarRing:     { width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: '#000', backgroundColor: '#000', overflow: 'hidden' },
  avatar:         { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { color: '#fff', fontSize: 32, fontWeight: '900' },
  cameraBtn:      { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },

  // Profile info
  profileInfo: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, gap: 3 },
  heroName:    { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  heroLoc:     { color: 'rgba(255,255,255,0.42)', fontSize: 13 },
  heroGender:  { color: 'rgba(255,255,255,0.28)', fontSize: 12 },

  // Bio
  bioWrap:      { marginHorizontal: 16, marginBottom: 4 },
  bioText:      { color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 21 },
  bioPlaceholder:{ color: 'rgba(255,255,255,0.22)', fontSize: 14, lineHeight: 21 },

  // Stats
  statsRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  stat:      { flexDirection: 'row', alignItems: 'baseline' },
  statNum:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.42)', fontSize: 14, fontWeight: '400' },
  statDot:   { color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: '300' },

  // Completion
  completionBar:  { marginHorizontal: 20, backgroundColor: BOND_PINK + '10', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BOND_PINK + '25' },
  completionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  completionLbl:  { color: BOND_PINK, fontSize: 13, fontWeight: '800' },
  completionHint: { color: BOND_PINK + '88', fontSize: 11, fontWeight: '600' },
  completionTrack:{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  completionFill: { height: '100%', backgroundColor: BOND_PINK, borderRadius: 2 },

  // Sections
  section:    { paddingHorizontal: 20, gap: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel:{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionSub: { color: 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: '600' },

  // Voice
  voiceEmpty:      { flexDirection: 'row', alignItems: 'center', backgroundColor: GLASS, borderRadius: 18, padding: 18, gap: 14, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed' },
  voiceEmptyTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700' },
  voiceEmptyHint:  { color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 3 },
  voiceMicIcon:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  voiceMicHead:    { width: 16, height: 20, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  voiceMicStand:   { width: 2, height: 8, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Go Live
  liveCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(229,57,53,0.25)' },
  liveBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeTxt:{ color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  liveTitle:   { color: '#fff', fontWeight: '800', fontSize: 15 },
  liveSub:     { color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2 },
  liveArrow:   { color: 'rgba(255,255,255,0.3)', fontSize: 26 },

  // Gallery
  polaroidRow:    { gap: 10, paddingVertical: 4 },
  polaroid:       { width: 120, height: 130, borderRadius: 12, backgroundColor: '#111', overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: BORDER },
  polaroidImg:    { width: '100%', height: '100%', borderRadius: 10 },
  polaroidRemove: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  polaroidAdd:    { width: 120, height: 130, borderRadius: 12, backgroundColor: GLASS, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  polaroidAddIcon:{ color: 'rgba(255,255,255,0.3)', fontSize: 32, fontWeight: '200' },
  galleryCount:   { color: 'rgba(255,255,255,0.28)', fontSize: 12, fontWeight: '700' },
  galleryHint:    { color: 'rgba(255,255,255,0.18)', fontSize: 11, textAlign: 'center' },

  // Wallet
  walletCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1116', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FFB70033' },
  walletTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  walletSub:   { color: '#555', fontSize: 12 },
  walletArrow: { color: '#FFB700', fontSize: 18, fontWeight: '800' },

  // Bond Pass
  passCard:  { borderRadius: 20, overflow: 'hidden' },
  passInner: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  passTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  passSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, lineHeight: 18 },
  passArrow: { color: '#fff', fontSize: 24, fontWeight: '200' },

  // My World — discovery hub
  searchWrap:       { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  searchBar:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchDot:        { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  searchInput:      { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500', padding: 0 },
  searchClear:      { color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: '700' },

  filterBar:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  filterPill:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterPillOn:     { backgroundColor: BOND_PINK + '22', borderColor: BOND_PINK + '70' },
  filterPillTxt:    { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  filterPillTxtOn:  { color: BOND_PINK },
  clearBtn:         { paddingHorizontal: 12, paddingVertical: 9 },
  clearTxt:         { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700' },

  dropPanel:        { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#0f0f1a', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' },
  dropItem:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropItemOn:       { backgroundColor: 'rgba(255,0,128,0.08)' },
  dropTxt:          { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '600' },
  dropTxtOn:        { color: '#fff', fontWeight: '800' },
  dropCheck:        { width: 8, height: 8, borderRadius: 4, backgroundColor: BOND_PINK },

  streamHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  streamHeaderDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e53935' },
  streamHeaderTxt:  { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  streamRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  streamAvatar:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  streamAvatarTxt:  { color: '#fff', fontSize: 20, fontWeight: '900' },
  streamFlagBadge:  { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0f0f1a', borderRadius: 8, paddingHorizontal: 2, paddingVertical: 1 },
  streamFlagTxt:    { fontSize: 11 },
  streamInfo:       { flex: 1, gap: 3 },
  streamNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streamName:       { color: '#fff', fontSize: 15, fontWeight: '800', flex: 1 },
  streamLiveBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e5393530', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  streamLiveDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#e53935' },
  streamLiveTxt:    { color: '#e57373', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  streamTitle:      { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  streamMeta:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streamViewers:    { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' },
  streamCatBadge:   { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  streamCatTxt:     { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  joinBtn:          { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, flexShrink: 0 },
  joinTxt:          { color: '#fff', fontSize: 13, fontWeight: '900' },

  worldEmpty:       { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32, gap: 10 },
  worldEmptyTitle:  { color: 'rgba(255,255,255,0.7)', fontSize: 17, fontWeight: '800' },
  worldEmptyTxt:    { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  worldGoLive:      { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  worldGoLiveGrad:  { paddingHorizontal: 32, paddingVertical: 13 },
  worldGoLiveTxt:   { color: '#fff', fontSize: 15, fontWeight: '900' },

  // Photo modal
  photoModal:      { flex: 1, backgroundColor: '#000000f2', alignItems: 'center', justifyContent: 'center' },
  photoModalImg:   { width, height: width },
  photoModalClose: { position: 'absolute', top: 60, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff18', borderWidth: 1, borderColor: '#ffffff30', alignItems: 'center', justifyContent: 'center' },
});
