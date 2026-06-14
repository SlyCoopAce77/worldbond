import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';
import { usePremium } from '../context/PremiumContext';

const { width } = Dimensions.get('window');

// ─── Type metadata ────────────────────────────────────────────────────────────
const TYPE_META = {
  watch_party:  { icon: '🎬', label: 'Watch Party',       color: '#e91e63', grad: ['#3d0a1a', '#1a0008', '#050507'] },
  game_night:   { icon: '🎮', label: 'Game Night',        color: '#7b5ea7', grad: ['#1f1040', '#0d0820', '#050507'] },
  cooking:      { icon: '🍳', label: 'Cook Together',     color: '#ff9800', grad: ['#3d2200', '#1a0e00', '#050507'] },
  study:        { icon: '📚', label: 'Study Together',    color: '#2196f3', grad: ['#001a3d', '#000d1a', '#050507'] },
  music:        { icon: '🎵', label: 'Music Sharing',     color: '#f06292', grad: ['#3d0a1c', '#1a0008', '#050507'] },
  language:     { icon: '🗣️', label: 'Language Practice', color: '#26c6da', grad: ['#00222a', '#00101a', '#050507'] },
  travel_talk:  { icon: '✈️', label: 'Travel Stories',   color: '#42a5f5', grad: ['#001838', '#000c18', '#050507'] },
  workout:      { icon: '💪', label: 'Workout Together',  color: '#ff7043', grad: ['#2d0f00', '#180800', '#050507'] },
  art:          { icon: '🎨', label: 'Art & Drawing',     color: '#ab47bc', grad: ['#220030', '#110018', '#050507'] },
  just_chill:   { icon: '😎', label: 'Just Chill',        color: '#57f287', grad: ['#002a14', '#001008', '#050507'] },
};

const FILTERS = ['All', ...Object.keys(TYPE_META)];
const TYPES_LIST = Object.entries(TYPE_META).map(([id, m]) => ({ id, ...m }));

// ─── Demo events ──────────────────────────────────────────────────────────────
const DEMO_EVENTS = [
  {
    id: 'de1', title: 'K-Drama Watch Party 🍜', type: 'watch_party',
    description: 'Watching the latest episode of "When the Stars Fall" together. Bring snacks! 🍿',
    hostName: 'JiMin_Seoul', hostCountry: '🇰🇷',
    attendees: Array.from({ length: 312 }), maxAttendees: 400,
    scheduledFor: null, tags: ['Netflix', 'Korean'],
  },
  {
    id: 'de2', title: 'Global English Practice 🌍', type: 'language',
    description: 'Casual conversation practice. All levels welcome — from beginners to fluent speakers.',
    hostName: 'Sarah_London', hostCountry: '🇬🇧',
    attendees: Array.from({ length: 247 }), maxAttendees: 300,
    scheduledFor: Date.now() + 900000, tags: ['English', 'Beginner OK'],
  },
  {
    id: 'de3', title: 'Friday Night Valorant 🎮', type: 'game_night',
    description: 'Squad up for ranked matches. All ranks welcome, we\'ll make balanced teams.',
    hostName: 'Carlos_MX', hostCountry: '🇲🇽',
    attendees: Array.from({ length: 189 }), maxAttendees: 200,
    scheduledFor: Date.now() + 3600000, tags: ['Valorant', 'FPS'],
  },
  {
    id: 'de4', title: 'African Cuisine Cook-Along 🍛', type: 'cooking',
    description: 'Today: Jollof rice battle — Nigeria vs Ghana. Vote for the best after we cook!',
    hostName: 'Amara_Lagos', hostCountry: '🇳🇬',
    attendees: Array.from({ length: 134 }), maxAttendees: 150,
    scheduledFor: Date.now() + 7200000, tags: ['Jollof', 'West Africa'],
  },
  {
    id: 'de5', title: 'Lo-fi Study Session 📚', type: 'study',
    description: 'Focused 2-hour study block with lo-fi beats in the background. Pomodoro timers shared.',
    hostName: 'Yuki_Tokyo', hostCountry: '🇯🇵',
    attendees: Array.from({ length: 98 }), maxAttendees: 200,
    scheduledFor: Date.now() + 1800000, tags: ['Focus', 'Lo-fi'],
  },
  {
    id: 'de6', title: 'Morning Yoga Flow 💪', type: 'workout',
    description: '30-min beginner-friendly yoga. All you need is a mat and some water. Rise and stretch!',
    hostName: 'Priya_Mumbai', hostCountry: '🇮🇳',
    attendees: Array.from({ length: 76 }), maxAttendees: 100,
    scheduledFor: Date.now() + 10800000, tags: ['Yoga', 'Beginner'],
  },
  {
    id: 'de7', title: 'Digital Art Collab 🎨', type: 'art',
    description: 'We each draw on the same theme and compare results. This week: cityscapes at night.',
    hostName: 'Lucas_SP', hostCountry: '🇧🇷',
    attendees: Array.from({ length: 54 }), maxAttendees: 80,
    scheduledFor: Date.now() + 14400000, tags: ['Digital Art', 'Procreate'],
  },
  {
    id: 'de8', title: 'Chill & Chat Lounge 😎', type: 'just_chill',
    description: 'No agenda — just vibes. Come talk about your week, share music, meet new people.',
    hostName: 'Fatoumata_DK', hostCountry: '🇩🇰',
    attendees: Array.from({ length: 41 }), maxAttendees: 60,
    scheduledFor: null, tags: ['Casual', 'Open mic'],
  },
];

function timeLabel(ts) {
  if (!ts) return 'Live now';
  const diff = ts - Date.now();
  if (diff <= 0) return 'Live now';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `in ${m}m`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `in ${hr}h`;
  return `in ${Math.floor(hr / 24)}d`;
}

function isLive(ev) {
  return !ev.scheduledFor || ev.scheduledFor <= Date.now() + 60000;
}

function stringToColor(str = '') {
  const p = ['#e57373', '#ba68c8', '#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#4db6ac', '#7986cb'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

// ─── Featured hero card ───────────────────────────────────────────────────────
function FeaturedCard({ item, onPress }) {
  const meta    = TYPE_META[item.type] || TYPE_META.just_chill;
  const count   = item.attendees?.length || 0;
  const live    = isLive(item);
  const spotsL  = (item.maxAttendees || 50) - count;
  const isFull  = spotsL <= 0;
  const scaleA  = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.spring(scaleA, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleA }], marginHorizontal: 20, marginBottom: 24 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={fe.wrap}>
        <LinearGradient colors={meta.grad} style={fe.grad}>

          {/* Top badges */}
          <View style={fe.topRow}>
            <View style={[fe.typePill, { backgroundColor: meta.color + '25', borderColor: meta.color + '55' }]}>
              <Text style={fe.typePillIcon}>{meta.icon}</Text>
              <Text style={[fe.typePillTxt, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {live ? (
              <View style={fe.liveBadge}>
                <View style={fe.liveDot} />
                <Text style={fe.liveTxt}>LIVE</Text>
              </View>
            ) : (
              <View style={[fe.timeBadge, { backgroundColor: meta.color + '20' }]}>
                <Text style={[fe.timeTxt, { color: meta.color }]}>{timeLabel(item.scheduledFor)}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={fe.title}>{item.title}</Text>
          {item.description ? (
            <Text style={fe.desc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          {/* Tags */}
          {item.tags?.length > 0 && (
            <View style={fe.tagRow}>
              {item.tags.map(t => (
                <View key={t} style={fe.tag}>
                  <Text style={fe.tagTxt}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={fe.footer}>
            <View style={fe.hostRow}>
              <View style={[fe.hostAvatar, { backgroundColor: stringToColor(item.hostName) }]}>
                <Text style={fe.hostInitial}>{(item.hostName || '?')[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={fe.hostName}>{item.hostName}</Text>
                <Text style={fe.hostFlag}>{item.hostCountry}</Text>
              </View>
            </View>
            <View style={fe.goingBadge}>
              <Text style={[fe.goingNum, { color: meta.color }]}>{count >= 1000 ? `${(count/1000).toFixed(1)}k` : count}</Text>
              <Text style={fe.goingLabel}>going</Text>
            </View>
          </View>

          {/* Join button */}
          <TouchableOpacity
            style={[fe.joinBtn, { backgroundColor: isFull ? '#2a2c34' : meta.color }]}
            onPress={onPress}
            activeOpacity={0.85}
            disabled={isFull}
          >
            <Text style={[fe.joinTxt, isFull && { color: '#444' }]}>
              {isFull ? 'Event Full' : live ? '🔴  Join Live' : '📅  RSVP Now'}
            </Text>
            {!isFull && <Text style={fe.joinArrow}>›</Text>}
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
const fe = StyleSheet.create({
  wrap:        { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff10',
                 shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  grad:        { padding: 22, gap: 14 },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20,
                 borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  typePillIcon:{ fontSize: 14 },
  typePillTxt: { fontSize: 12, fontWeight: '800' },
  liveBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e5393530',
                 borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#e5393555' },
  liveDot:     { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#e53935' },
  liveTxt:     { color: '#e53935', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  timeBadge:   { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  timeTxt:     { fontSize: 12, fontWeight: '800' },
  title:       { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  desc:        { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 20 },
  tagRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag:         { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
                 paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  tagTxt:      { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hostRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hostAvatar:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  hostInitial: { color: '#fff', fontSize: 14, fontWeight: '800' },
  hostName:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  hostFlag:    { fontSize: 12, marginTop: 1 },
  goingBadge:  { alignItems: 'flex-end' },
  goingNum:    { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  goingLabel:  { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700' },
  joinBtn:     { borderRadius: 18, paddingVertical: 15, flexDirection: 'row',
                 alignItems: 'center', justifyContent: 'center', gap: 8 },
  joinTxt:     { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  joinArrow:   { color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: '300' },
});

// ─── Event list card ──────────────────────────────────────────────────────────
function EventCard({ item, index, onPress }) {
  const meta    = TYPE_META[item.type] || TYPE_META.just_chill;
  const count   = item.attendees?.length || 0;
  const max     = item.maxAttendees || 50;
  const spotsL  = max - count;
  const isFull  = spotsL <= 0;
  const live    = isLive(item);
  const isHot   = count >= 100;
  const pct     = Math.min(1, count / max);

  const fadeA  = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 1, duration: 340, delay: index * 55, useNativeDriver: true }),
      Animated.spring(slideA, { toValue: 0, friction: 9, tension: 60, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeA, transform: [{ translateY: slideA }] }}>
      <TouchableOpacity style={ec.card} onPress={() => onPress(item)} activeOpacity={0.85}>
        {/* Left accent strip */}
        <View style={[ec.accentStrip, { backgroundColor: meta.color }]} />

        <View style={ec.inner}>
          {/* Top row */}
          <View style={ec.topRow}>
            <View style={[ec.iconWrap, { backgroundColor: meta.color + '20' }]}>
              <Text style={ec.icon}>{meta.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ec.title} numberOfLines={1}>{item.title}</Text>
              <View style={ec.metaRow}>
                <Text style={ec.hostTxt}>{item.hostName}</Text>
                {item.hostCountry ? <Text style={ec.hostFlag}>{item.hostCountry}</Text> : null}
                {isHot ? <Text style={{ fontSize: 11 }}>🔥</Text> : null}
              </View>
            </View>
            <View style={ec.rightCol}>
              {live ? (
                <View style={ec.livePill}>
                  <View style={ec.liveDot} />
                  <Text style={ec.liveTxt}>LIVE</Text>
                </View>
              ) : (
                <Text style={[ec.timeTxt, { color: meta.color }]}>{timeLabel(item.scheduledFor)}</Text>
              )}
              <Text style={[ec.countTxt, isHot && { color: '#ff7043' }]}>{count >= 1000 ? `${(count/1000).toFixed(1)}k` : count} going</Text>
            </View>
          </View>

          {/* Description */}
          {item.description ? (
            <Text style={ec.desc} numberOfLines={1}>{item.description}</Text>
          ) : null}

          {/* Fill bar + tags */}
          <View style={ec.bottomRow}>
            <View style={ec.barTrack}>
              <View style={[ec.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: isFull ? '#e53935' : meta.color }]} />
            </View>
            <Text style={[ec.spotsLabel, isFull && { color: '#e53935' }]}>
              {isFull ? 'Full' : `${spotsL} spots`}
            </Text>
            <TouchableOpacity
              style={[ec.joinBtn, { backgroundColor: isFull ? '#1e2028' : meta.color + 'ee' }, isFull && { opacity: 0.5 }]}
              onPress={() => !isFull && onPress(item)}
              activeOpacity={isFull ? 1 : 0.8}
              disabled={isFull}
            >
              <Text style={[ec.joinTxt, isFull && { color: '#444' }]}>
                {isFull ? 'Full' : live ? 'Join' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ec = StyleSheet.create({
  card:       { backgroundColor: '#0d0f14', borderRadius: 20, overflow: 'hidden',
                flexDirection: 'row', borderWidth: 1, borderColor: '#1e2028', marginBottom: 10 },
  accentStrip:{ width: 4, borderRadius: 0 },
  inner:      { flex: 1, padding: 14, gap: 8 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap:   { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:       { fontSize: 20 },
  title:      { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 20 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  hostTxt:    { color: '#444', fontSize: 11, fontWeight: '700' },
  hostFlag:   { fontSize: 11 },
  rightCol:   { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  livePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e5393520',
                borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#e5393540' },
  liveDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#e53935' },
  liveTxt:    { color: '#e53935', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  timeTxt:    { fontSize: 12, fontWeight: '800' },
  countTxt:   { color: '#6C47FF', fontSize: 11, fontWeight: '700' },
  desc:       { color: '#333', fontSize: 12, lineHeight: 17 },
  bottomRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barTrack:   { flex: 1, height: 4, backgroundColor: '#1e2028', borderRadius: 2, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 2 },
  spotsLabel: { color: '#333', fontSize: 10, fontWeight: '700', minWidth: 36 },
  joinBtn:    { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  joinTxt:    { color: '#fff', fontSize: 12, fontWeight: '900' },
});

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ icon, title, count }) {
  return (
    <View style={sl.row}>
      <Text style={sl.icon}>{icon}</Text>
      <Text style={sl.title}>{title}</Text>
      {count != null && <View style={sl.badge}><Text style={sl.badgeTxt}>{count}</Text></View>}
    </View>
  );
}
const sl = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 14, marginTop: 4 },
  icon:     { fontSize: 16 },
  title:    { color: '#fff', fontSize: 16, fontWeight: '900', flex: 1 },
  badge:    { backgroundColor: '#1e2028', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { color: '#555', fontSize: 11, fontWeight: '800' },
});

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ id, active, onPress }) {
  const meta  = TYPE_META[id];
  const label = meta ? `${meta.icon} ${meta.label}` : 'All';
  const color = meta?.color || '#6C47FF';
  return (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.75}
      style={[fc.chip, active && { backgroundColor: color + '22', borderColor: color + '66' }]}
    >
      <Text style={[fc.text, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const fc = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
          backgroundColor: '#0d0f14', borderWidth: 1.5, borderColor: '#1e2028' },
  text: { color: '#444', fontSize: 12, fontWeight: '800' },
});

// ─── Create event modal ────────────────────────────────────────────────────────
function CreateEventModal({ visible, onClose, user }) {
  const [title,       setTitle]       = useState('');
  const [type,        setType]        = useState('just_chill');
  const [description, setDescription] = useState('');
  const [maxStr,      setMaxStr]      = useState('20');
  const socket = getSocket();
  const meta   = TYPE_META[type] || TYPE_META.just_chill;

  function submit() {
    if (!title.trim()) return;
    socket.emit('create_event', {
      title: title.trim(), type, description: description.trim(),
      scheduledFor: Date.now(),
      maxAttendees: Math.max(2, parseInt(maxStr) || 20),
      language: user?.language || 'any',
    });
    setTitle(''); setDescription(''); setType('just_chill'); setMaxStr('20');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cm.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={cm.sheet}>
            <View style={cm.handle} />
            <View style={cm.headerRow}>
              <Text style={cm.title}>Create Event</Text>
              <TouchableOpacity style={cm.closeBtn} onPress={onClose}>
                <Text style={cm.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18 }}>
              <TextInput
                style={cm.input}
                placeholder="Give your event a great name..."
                placeholderTextColor="#333"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
              <View>
                <Text style={cm.label}>Event Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {TYPES_LIST.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[cm.typeChip, type === t.id && { backgroundColor: t.color + '25', borderColor: t.color + '66' }]}
                      onPress={() => setType(t.id)}
                    >
                      <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                      <Text style={[cm.typeChipText, type === t.id && { color: t.color }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TextInput
                style={[cm.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Describe the vibe — what can people expect?"
                placeholderTextColor="#333"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={220}
              />
              <View>
                <Text style={cm.label}>Max Attendees</Text>
                <TextInput
                  style={cm.input}
                  placeholder="20"
                  placeholderTextColor="#333"
                  value={maxStr}
                  onChangeText={setMaxStr}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={[cm.submitWrap, !title.trim() && { opacity: 0.4 }]}
                onPress={submit}
                disabled={!title.trim()}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[meta.color, meta.color + 'bb']} style={cm.submitGrad}>
                  <Text style={cm.submitIcon}>{meta.icon}</Text>
                  <Text style={cm.submitText}>Create Event</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#0d0f14', borderTopLeftRadius: 30, borderTopRightRadius: 30,
                  padding: 24, maxHeight: '88%', borderWidth: 1, borderColor: '#1e2028' },
  handle:       { width: 36, height: 4, backgroundColor: '#2a2c34', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:        { color: '#fff', fontSize: 22, fontWeight: '900' },
  closeBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: '#111318',
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2028' },
  closeIcon:    { color: '#555', fontSize: 14 },
  label:        { color: '#333', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input:        { backgroundColor: '#111318', color: '#fff', borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#1e2028' },
  typeChip:     { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111318',
                  borderWidth: 1, borderColor: '#1e2028', flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeChipText: { color: '#444', fontSize: 12, fontWeight: '700' },
  submitWrap:   { borderRadius: 16, overflow: 'hidden' },
  submitGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  submitIcon:   { fontSize: 20 },
  submitText:   { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── Event chat modal ──────────────────────────────────────────────────────────
function EventChatModal({ visible, event, onClose, user }) {
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const joinedRef = useRef(false);
  const flatRef   = useRef(null);
  const socket    = getSocket();
  const meta    = event ? (TYPE_META[event.type] || TYPE_META.just_chill) : TYPE_META.just_chill;

  useEffect(() => {
    if (!visible || !event) return;
    if (socket.connected) socket.emit('join_event', { eventId: event.id });
    else socket.once('connect', () => socket.emit('join_event', { eventId: event.id }));
    joinedRef.current = true;
    socket.on('event_history', ({ messages: hist }) => setMessages(hist || []));
    socket.on('event_message', msg => setMessages(prev => [...prev, msg]));
    return () => {
      if (joinedRef.current) socket.emit('leave_event', { eventId: event?.id });
      joinedRef.current = false;
      socket.off('event_history');
      socket.off('event_message');
    };
  }, [visible, event?.id]);

  useEffect(() => {
    if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  function send() {
    if (!text.trim()) return;
    socket.emit('event_message', { eventId: event.id, text: text.trim() });
    setText('');
  }

  if (!event) return null;
  const count = event.attendees?.length || 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#050507' }}>
        <LinearGradient colors={meta.grad} style={ev.header}>
          <TouchableOpacity style={ev.backBtn} onPress={onClose}>
            <Text style={ev.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={[ev.headerIcon, { backgroundColor: meta.color + '30' }]}>
            <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ev.eventTitle} numberOfLines={1}>{event.title}</Text>
            <Text style={ev.eventSub}>{count} attending · {event.hostName}</Text>
          </View>
          <View style={[ev.typePill, { backgroundColor: meta.color + '30', borderColor: meta.color + '55' }]}>
            <Text style={[ev.typeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </LinearGradient>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => String(m.id)}
          contentContainerStyle={ev.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={ev.emptyWrap}>
              <Text style={{ fontSize: 44 }}>{meta.icon}</Text>
              <Text style={ev.emptyTitle}>Be the first to say hello!</Text>
              <Text style={ev.emptySub}>The chat is open — start the conversation 👋</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === socket.id;
            return (
              <View style={[ev.msgRow, isMine && ev.msgRowMine]}>
                {!isMine && (
                  <View style={[ev.avatar, { backgroundColor: stringToColor(item.senderName || '') }]}>
                    <Text style={ev.avatarText}>{(item.senderName || '?')[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={[ev.bubble, isMine ? ev.bubbleMine : ev.bubbleOther]}>
                  {!isMine && (
                    <Text style={ev.senderName}>
                      {item.senderName}{item.senderCountry ? ` · ${item.senderCountry}` : ''}
                    </Text>
                  )}
                  <Text style={ev.msgText}>{item.text}</Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={ev.inputRow}>
            <TextInput
              style={ev.input}
              placeholder="Say something..."
              placeholderTextColor="#333"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[ev.sendBtn, { backgroundColor: text.trim() ? meta.color : '#1e2028' }]}
              onPress={send}
              disabled={!text.trim()}
            >
              <Text style={ev.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const ev = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10,
                borderBottomWidth: 1, borderBottomColor: '#1e2028' },
  backBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: '#00000030',
                alignItems: 'center', justifyContent: 'center' },
  backIcon:   { color: '#fff', fontSize: 26, lineHeight: 30, marginTop: -2 },
  headerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  eventSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  typePill:   { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1 },
  typeText:   { fontSize: 11, fontWeight: '700' },
  list:       { padding: 16, gap: 8, flexGrow: 1 },
  emptyWrap:  { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySub:   { color: '#444', fontSize: 14, textAlign: 'center' },
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  avatar:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bubble:     { maxWidth: width * 0.72, borderRadius: 18, padding: 12, gap: 4 },
  bubbleMine: { backgroundColor: '#6C47FF', borderBottomRightRadius: 4 },
  bubbleOther:{ backgroundColor: '#111318', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#1e2028' },
  senderName: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  msgText:    { color: '#fff', fontSize: 14, lineHeight: 20 },
  inputRow:   { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1e2028', gap: 10, alignItems: 'flex-end' },
  input:      { flex: 1, backgroundColor: '#111318', color: '#fff', borderRadius: 20, paddingHorizontal: 16,
                paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#1e2028', maxHeight: 100 },
  sendBtn:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendIcon:   { color: '#fff', fontSize: 18 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EventsScreen({ navigation, user }) {
  const [events,        setEvents]        = useState([]);
  const [filter,        setFilter]        = useState('All');
  const [showCreate,    setShowCreate]    = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { isPro } = usePremium();
  const socket     = getSocket();

  useEffect(() => {
    if (socket.connected) socket.emit('get_events');
    else socket.once('connect', () => socket.emit('get_events'));
    socket.on('events_list',   list    => setEvents(list || []));
    socket.on('event_updated', updated => {
      setEvents(prev => prev.map(e => e.id === updated?.id ? updated : e));
    });
    return () => { socket.off('events_list'); socket.off('event_updated'); };
  }, []);

  // Use real events if any, otherwise demo
  const sourceEvents = events.length > 0 ? events : DEMO_EVENTS;

  const sorted = useMemo(() =>
    [...sourceEvents].sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0)),
  [sourceEvents]);

  const filtered = useMemo(() => {
    if (filter === 'All') return sorted;
    return sorted.filter(e => e.type === filter);
  }, [sorted, filter]);

  const featuredEvent = filtered[0] || null;
  const listEvents    = filtered.slice(1);

  const liveEvents    = listEvents.filter(e => isLive(e));
  const upcomingEvents= listEvents.filter(e => !isLive(e));

  const liveCount = sourceEvents.filter(e => isLive(e)).length;

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Events</Text>
          {liveCount > 0 && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>{liveCount} live</Text>
            </View>
          )}
        </View>
        {isPro ? (
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <LinearGradient colors={['#6C47FF', '#5533DD']} style={styles.createGrad}>
              <Text style={styles.createText}>+ Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.proHint} onPress={() => navigation.navigate('Subscription')}>
            <Text style={styles.proHintTxt}>🌟 Host</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={{ flexGrow: 0, marginBottom: 16 }}
      >
        {FILTERS.map(f => (
          <FilterChip key={f} id={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Featured ── */}
        {featuredEvent && (
          <>
            <SectionLabel icon="⭐" title="Featured" count={null} />
            <FeaturedCard item={featuredEvent} onPress={() => setSelectedEvent(featuredEvent)} />
          </>
        )}

        {/* ── Live now ── */}
        {liveEvents.length > 0 && (
          <>
            <SectionLabel icon="🔴" title="Happening Now" count={liveEvents.length} />
            <View style={styles.listBlock}>
              {liveEvents.map((item, i) => (
                <EventCard key={item.id} item={item} index={i} onPress={ev => setSelectedEvent(ev)} />
              ))}
            </View>
          </>
        )}

        {/* ── Upcoming ── */}
        {upcomingEvents.length > 0 && (
          <>
            <SectionLabel icon="📅" title="Upcoming" count={upcomingEvents.length} />
            <View style={styles.listBlock}>
              {upcomingEvents.map((item, i) => (
                <EventCard key={item.id} item={item} index={i} onPress={ev => setSelectedEvent(ev)} />
              ))}
            </View>
          </>
        )}

        {/* ── Empty ── */}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 52 }}>🎉</Text>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySub}>
              {isPro ? 'Create the first event and bring people together!' : 'Check back soon or upgrade to host your own.'}
            </Text>
          </View>
        )}

        {/* ── Pro create prompt ── */}
        {!isPro && (
          <TouchableOpacity style={styles.proCard} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
            <LinearGradient colors={['#1a0e2a', '#0d0820']} style={styles.proGrad}>
              <Text style={{ fontSize: 28 }}>🌟</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.proTitle}>Host your own events</Text>
                <Text style={styles.proSub}>Watch parties, game nights, study sessions and more</Text>
              </View>
              <View style={styles.proBadge}><Text style={styles.proBadgeTxt}>Pro</Text></View>
            </LinearGradient>
          </TouchableOpacity>
        )}

      </ScrollView>

      <CreateEventModal visible={showCreate} onClose={() => setShowCreate(false)} user={user} />
      <EventChatModal
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        user={user}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#050507' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  backBtn:      { width: 40, height: 40, borderRadius: 13, backgroundColor: '#0d0f14',
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2028' },
  backIcon:     { color: '#fff', fontSize: 26, lineHeight: 30, marginTop: -2 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:        { color: '#fff', fontSize: 22, fontWeight: '900' },
  livePill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e5393518',
                  borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#e5393540' },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e53935' },
  livePillText: { color: '#e53935', fontSize: 11, fontWeight: '700' },
  createBtn:    { borderRadius: 14, overflow: 'hidden' },
  createGrad:   { paddingHorizontal: 16, paddingVertical: 9 },
  createText:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  proHint:      { backgroundColor: '#f59e0b18', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
                  borderWidth: 1, borderColor: '#f59e0b33' },
  proHintTxt:   { color: '#f59e0b', fontSize: 13, fontWeight: '800' },

  filtersRow:   { paddingHorizontal: 20, gap: 8 },

  scroll:       { paddingBottom: 60 },
  listBlock:    { paddingHorizontal: 20, marginBottom: 8 },

  empty:        { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle:   { color: '#fff', fontSize: 22, fontWeight: '800' },
  emptySub:     { color: '#444', fontSize: 14, textAlign: 'center', lineHeight: 21 },

  proCard:      { marginHorizontal: 20, marginTop: 24, borderRadius: 22, overflow: 'hidden' },
  proGrad:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18,
                  borderWidth: 1, borderColor: '#f59e0b22', borderRadius: 22 },
  proTitle:     { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  proSub:       { color: '#f59e0b66', fontSize: 12, marginTop: 3, lineHeight: 17 },
  proBadge:     { backgroundColor: '#f59e0b22', borderRadius: 10, paddingHorizontal: 10,
                  paddingVertical: 5, borderWidth: 1, borderColor: '#f59e0b55' },
  proBadgeTxt:  { color: '#f59e0b', fontSize: 12, fontWeight: '800' },
});
