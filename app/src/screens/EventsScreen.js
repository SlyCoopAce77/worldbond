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
  watch_party:  { icon: '🎬', label: 'Watch Party',      color: '#e91e63', grad: ['#4a0a22', '#1a0008'] },
  game_night:   { icon: '🎮', label: 'Game Night',       color: '#7b5ea7', grad: ['#2d1f4a', '#110a1a'] },
  cooking:      { icon: '🍳', label: 'Cook Together',    color: '#ff9800', grad: ['#3d2200', '#1a0e00'] },
  study:        { icon: '📚', label: 'Study Together',   color: '#2196f3', grad: ['#0a1f3d', '#050e1a'] },
  music:        { icon: '🎵', label: 'Music Sharing',    color: '#f06292', grad: ['#3d0a22', '#1a0008'] },
  language:     { icon: '🗣️', label: 'Language Practice',color: '#26c6da', grad: ['#002f38', '#001218'] },
  travel_talk:  { icon: '✈️', label: 'Travel Stories',  color: '#42a5f5', grad: ['#0a1f38', '#050e18'] },
  workout:      { icon: '💪', label: 'Workout Together', color: '#ff7043', grad: ['#3d1500', '#1a0800'] },
  art:          { icon: '🎨', label: 'Art & Drawing',    color: '#ab47bc', grad: ['#2a0a38', '#110018'] },
  just_chill:   { icon: '😎', label: 'Just Chill',       color: '#57f287', grad: ['#0a2d14', '#041008'] },
};

const FILTER_ALL  = 'All';
const FILTERS     = [FILTER_ALL, ...Object.keys(TYPE_META)];

const TYPES_LIST  = Object.entries(TYPE_META).map(([id, m]) => ({ id, ...m }));

function stringToColor(str = '') {
  const p = ['#e57373','#ba68c8','#4fc3f7','#81c784','#ffb74d','#f06292','#4db6ac','#7986cb'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

function timeLabel(ts) {
  if (!ts) return 'Now';
  const diff = ts - Date.now();
  if (diff < 0) return 'Live now';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `in ${m}m`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `in ${hr}h`;
  return `in ${Math.floor(hr / 24)}d`;
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ id, active, onPress }) {
  const meta = TYPE_META[id];
  const label = meta ? meta.icon + ' ' + meta.label : 'All';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        fc.chip,
        active && meta  && { backgroundColor: meta.color + '20', borderColor: meta.color + '55' },
        active && !meta && { backgroundColor: '#E8003D20', borderColor: '#E8003D55' },
      ]}
    >
      <Text style={[fc.text, active && { color: meta ? meta.color : '#E8003D' }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const fc = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2F3336' },
  text: { color: '#555', fontSize: 12, fontWeight: '700' },
});

// ─── Event card ───────────────────────────────────────────────────────────────
function EventCard({ item, index, onPress }) {
  const meta      = TYPE_META[item.type] || TYPE_META.just_chill;
  const attendees = item.attendees?.length || 0;
  const spotsLeft = (item.maxAttendees || 20) - attendees;
  const isFull    = spotsLeft <= 0;
  const isLive    = item.scheduledFor && item.scheduledFor <= Date.now() + 60000;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 60, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={ec.card} onPress={() => onPress(item)} activeOpacity={0.88}>
        {/* Gradient header strip */}
        <LinearGradient colors={meta.grad} style={ec.header}>
          <Text style={ec.headerIcon}>{meta.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={ec.headerTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={[ec.typeBadge, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <View style={ec.headerRight}>
            {isLive && (
              <View style={ec.liveBadge}>
                <View style={ec.liveDot} />
                <Text style={ec.liveText}>LIVE</Text>
              </View>
            )}
            {!isLive && (
              <Text style={[ec.timeText, { color: meta.color }]}>{timeLabel(item.scheduledFor)}</Text>
            )}
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={ec.body}>
          {item.description ? (
            <Text style={ec.desc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={ec.footer}>
            <View style={ec.footerLeft}>
              {/* Host */}
              <View style={[ec.avatarDot, { backgroundColor: stringToColor(item.hostName || '') }]}>
                <Text style={ec.avatarDotText}>{(item.hostName || '?')[0].toUpperCase()}</Text>
              </View>
              <Text style={ec.hostText}>{item.hostName || 'Anonymous'}</Text>
              {item.hostCountry ? <Text style={ec.hostCountry}>{item.hostCountry}</Text> : null}
            </View>

            <View style={ec.footerRight}>
              {/* Attendees */}
              <View style={ec.attendeeRow}>
                <View style={ec.attendeeDot} />
                <Text style={ec.attendeeCount}>{attendees} going</Text>
              </View>
              {/* Spots */}
              <View style={[ec.spotsBadge, isFull && ec.spotsFull]}>
                <Text style={[ec.spotsText, isFull && ec.spotsTextFull]}>
                  {isFull ? 'Full' : `${spotsLeft} spots left`}
                </Text>
              </View>
            </View>
          </View>

          {/* Join button */}
          <TouchableOpacity
            style={[ec.joinBtn, isFull && ec.joinBtnDisabled]}
            onPress={() => !isFull && onPress(item)}
            activeOpacity={isFull ? 1 : 0.8}
          >
            {!isFull ? (
              <LinearGradient
                colors={[meta.color, meta.color + 'aa']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={ec.joinGrad}
              >
                <Text style={ec.joinText}>Join Event →</Text>
              </LinearGradient>
            ) : (
              <View style={ec.joinGrad}>
                <Text style={[ec.joinText, { color: '#555' }]}>Event Full</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ec = StyleSheet.create({
  card:          { backgroundColor: '#16181C', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#2F3336', marginBottom: 12 },
  header:        { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  headerIcon:    { fontSize: 34 },
  headerTitle:   { color: '#fff', fontSize: 16, fontWeight: '800' },
  typeBadge:     { fontSize: 11, fontWeight: '700', marginTop: 3 },
  headerRight:   { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  liveBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e5393530', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#e5393555' },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e53935' },
  liveText:      { color: '#e53935', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  timeText:      { fontSize: 12, fontWeight: '700' },
  body:          { padding: 16, gap: 12 },
  desc:          { color: '#888', fontSize: 13, lineHeight: 19 },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarDot:     { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarDotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  hostText:      { color: '#aaa', fontSize: 12, fontWeight: '600' },
  hostCountry:   { color: '#555', fontSize: 12 },
  footerRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attendeeRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeeDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#57f287' },
  attendeeCount: { color: '#57f287', fontSize: 11, fontWeight: '700' },
  spotsBadge:    { backgroundColor: '#E8003D18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#E8003D40' },
  spotsFull:     { backgroundColor: '#e5393518', borderColor: '#e5393540' },
  spotsText:     { color: '#E8003D', fontSize: 11, fontWeight: '600' },
  spotsTextFull: { color: '#e53935' },
  joinBtn:       { borderRadius: 14, overflow: 'hidden' },
  joinBtnDisabled:{ borderRadius: 14, overflow: 'hidden', opacity: 0.4 },
  joinGrad:      { paddingVertical: 12, alignItems: 'center' },
  joinText:      { color: '#fff', fontSize: 14, fontWeight: '800' },
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
              {/* Title */}
              <TextInput
                style={cm.input}
                placeholder="Give your event a great name..."
                placeholderTextColor="#444"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />

              {/* Type picker */}
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

              {/* Description */}
              <TextInput
                style={[cm.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Describe the vibe — what can people expect?"
                placeholderTextColor="#444"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={220}
              />

              {/* Max attendees */}
              <View>
                <Text style={cm.label}>Max Attendees</Text>
                <TextInput
                  style={cm.input}
                  placeholder="20"
                  placeholderTextColor="#444"
                  value={maxStr}
                  onChangeText={setMaxStr}
                  keyboardType="numeric"
                />
              </View>

              {/* Submit */}
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
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#000000', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '88%', borderWidth: 1, borderColor: '#2F3336' },
  handle:       { width: 40, height: 4, backgroundColor: '#2F3336', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:        { color: '#fff', fontSize: 22, fontWeight: '900' },
  closeBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: '#16181C', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2F3336' },
  closeIcon:    { color: '#555', fontSize: 14 },
  label:        { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input:        { backgroundColor: '#16181C', color: '#fff', borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#2F3336' },
  typeChip:     { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2F3336', flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeChipText: { color: '#555', fontSize: 12, fontWeight: '700' },
  submitWrap:   { borderRadius: 16, overflow: 'hidden' },
  submitGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  submitIcon:   { fontSize: 20 },
  submitText:   { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── Event chat modal ──────────────────────────────────────────────────────────
function EventChatModal({ visible, event, onClose, user }) {
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [joined,   setJoined]   = useState(false);
  const joinedRef = useRef(false);
  const flatRef   = useRef(null);
  const socket    = getSocket();
  const meta    = event ? (TYPE_META[event.type] || TYPE_META.just_chill) : TYPE_META.just_chill;

  useEffect(() => {
    if (!visible || !event) return;
    if (socket.connected) socket.emit('join_event', { eventId: event.id });
    else socket.once('connect', () => socket.emit('join_event', { eventId: event.id }));
    setJoined(true);
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[chat.container, { flex: 1 }]}>
        {/* Header */}
        <LinearGradient colors={meta.grad} style={chat.header}>
          <TouchableOpacity style={chat.backBtn} onPress={onClose}>
            <Text style={chat.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 28 }}>{meta.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={chat.eventTitle} numberOfLines={1}>{event.title}</Text>
            <Text style={chat.eventSub}>
              {event.attendees?.length || 0} attending · hosted by {event.hostName}
            </Text>
          </View>
          <View style={[chat.typePill, { backgroundColor: meta.color + '30', borderColor: meta.color + '55' }]}>
            <Text style={[chat.typeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </LinearGradient>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={chat.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={chat.emptyWrap}>
              <Text style={{ fontSize: 40 }}>{meta.icon}</Text>
              <Text style={chat.emptyText}>No messages yet</Text>
              <Text style={chat.emptySub}>Be the first to say hello! 👋</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === socket.id;
            return (
              <View style={[chat.msgRow, isMine && chat.msgRowMine]}>
                {!isMine && (
                  <View style={[chat.avatar, { backgroundColor: stringToColor(item.senderName || '') }]}>
                    <Text style={chat.avatarText}>{(item.senderName || '?')[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={[chat.bubble, isMine ? chat.bubbleMine : chat.bubbleOther]}>
                  {!isMine && (
                    <Text style={chat.senderName}>
                      {item.senderName}
                      {item.senderCountry ? ` · ${item.senderCountry}` : ''}
                    </Text>
                  )}
                  <Text style={chat.msgText}>{item.text}</Text>
                  {item.wasTranslated && <Text style={chat.translated}>🌐 translated</Text>}
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={chat.inputRow}>
            <TextInput
              style={chat.input}
              placeholder="Say something..."
              placeholderTextColor="#444"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[chat.sendBtn, { backgroundColor: text.trim() ? meta.color : '#2F3336' }]}
              onPress={send}
              disabled={!text.trim()}
            >
              <Text style={chat.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const chat = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000000' },
  header:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#2F3336' },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: '#00000030', alignItems: 'center', justifyContent: 'center' },
  backIcon:    { color: '#fff', fontSize: 26, lineHeight: 30, marginTop: -2 },
  eventTitle:  { color: '#fff', fontSize: 15, fontWeight: '800' },
  eventSub:    { color: '#ffffff88', fontSize: 11, marginTop: 2 },
  typePill:    { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1 },
  typeText:    { fontSize: 11, fontWeight: '700' },
  list:        { padding: 16, gap: 8, flexGrow: 1 },
  emptyWrap:   { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:   { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySub:    { color: '#555', fontSize: 14 },
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMine:  { justifyContent: 'flex-end' },
  avatar:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:  { color: '#fff', fontSize: 11, fontWeight: '800' },
  bubble:      { maxWidth: width * 0.72, borderRadius: 18, padding: 12, gap: 4 },
  bubbleMine:  { backgroundColor: '#E8003D', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#16181C', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#2F3336' },
  senderName:  { color: '#ffffff66', fontSize: 10, fontWeight: '700' },
  msgText:     { color: '#fff', fontSize: 14, lineHeight: 20 },
  translated:  { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 },
  inputRow:    { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#2F3336', gap: 10, alignItems: 'flex-end' },
  input:       { flex: 1, backgroundColor: '#16181C', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#2F3336', maxHeight: 100 },
  sendBtn:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendIcon:    { color: '#fff', fontSize: 18 },
});

// ─── Pro upgrade card ──────────────────────────────────────────────────────────
function ProGate({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={pg.wrap}>
      <LinearGradient colors={['#2a1800', '#1a0e00']} style={pg.card}>
        <Text style={{ fontSize: 28 }}>🌟</Text>
        <View style={{ flex: 1 }}>
          <Text style={pg.title}>Create your own events</Text>
          <Text style={pg.sub}>Host watch parties, game nights, language exchanges and more</Text>
        </View>
        <View style={pg.badge}>
          <Text style={pg.badgeText}>Pro</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const pg = StyleSheet.create({
  wrap:      { marginHorizontal: 20, marginBottom: 4 },
  card:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#f59e0b33' },
  title:     { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  sub:       { color: '#f59e0b88', fontSize: 12, marginTop: 3, lineHeight: 17 },
  badge:     { backgroundColor: '#f59e0b22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#f59e0b55' },
  badgeText: { color: '#f59e0b', fontSize: 12, fontWeight: '800' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EventsScreen({ navigation, user }) {
  const [events,        setEvents]        = useState([]);
  const [filter,        setFilter]        = useState(FILTER_ALL);
  const [showCreate,    setShowCreate]    = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { isPro } = usePremium();
  const socket     = getSocket();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (socket.connected) socket.emit('get_events');
    else socket.once('connect', () => socket.emit('get_events'));
    socket.on('events_list', list => setEvents(list || []));
    socket.on('event_updated', updated => {
      setEvents(prev => prev.map(e => e.id === updated?.id ? updated : e));
    });
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return () => { socket.off('events_list'); socket.off('event_updated'); };
  }, []);

  const filtered = useMemo(() => {
    if (filter === FILTER_ALL) return events;
    return events.filter(e => e.type === filter);
  }, [events, filter]);

  const liveCount = useMemo(() =>
    events.filter(e => e.scheduledFor && e.scheduledFor <= Date.now() + 60000).length,
  [events]);

  const headerSlide = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerSlide }] }]}>
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
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreate(true)}
          >
            <LinearGradient colors={['#E8003D', '#C7003A']} style={styles.createGrad}>
              <Text style={styles.createText}>+ Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </Animated.View>

      {/* ── Pro gate ── */}
      {!isPro && <ProGate onPress={() => navigation.navigate('Subscription')} />}

      {/* ── Filters ── */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={f => f}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <FilterChip id={item} active={filter === item} onPress={() => setFilter(item)} />
        )}
        style={{ flexGrow: 0, marginBottom: 8 }}
      />

      {/* ── Stats row ── */}
      {events.length > 0 && (
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</Text>
          {filter !== FILTER_ALL && (
            <TouchableOpacity onPress={() => setFilter(FILTER_ALL)}>
              <Text style={styles.clearFilter}>Clear filter ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 52 }}>🎉</Text>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySub}>
              {isPro
                ? 'Create the first event and bring people together!'
                : 'Check back soon or upgrade to Pro to host your own.'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <EventCard
            item={item}
            index={index}
            onPress={ev => setSelectedEvent(ev)}
          />
        )}
      />

      <CreateEventModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        user={user}
      />
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
  container:     { flex: 1, backgroundColor: '#000000' },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  backBtn:       { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16181C', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2F3336' },
  backIcon:      { color: '#fff', fontSize: 26, lineHeight: 30, marginTop: -2 },
  headerCenter:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:         { color: '#fff', fontSize: 22, fontWeight: '900' },
  livePill:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e5393518', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#e5393540' },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e53935' },
  livePillText:  { color: '#e53935', fontSize: 11, fontWeight: '700' },
  createBtn:     { borderRadius: 14, overflow: 'hidden' },
  createGrad:    { paddingHorizontal: 16, paddingVertical: 9 },
  createText:    { color: '#fff', fontSize: 14, fontWeight: '800' },

  filtersRow:    { paddingHorizontal: 20, gap: 8, marginBottom: 4 },

  statsRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8, marginTop: 4 },
  statsText:     { color: '#555', fontSize: 13 },
  clearFilter:   { color: '#E8003D', fontSize: 12, fontWeight: '700' },

  list:          { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },

  empty:         { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle:    { color: '#fff', fontSize: 22, fontWeight: '800' },
  emptySub:      { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
