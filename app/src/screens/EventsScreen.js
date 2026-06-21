import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, SafeAreaView, StyleSheet, Alert, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';
import { usePremium } from '../context/PremiumContext';

// ── Stage type categories (cultural experiences) ──────────────────────────────
const STAGE_TYPES = {
  cultural: { icon: '🌍', label: 'Cultural',    color: '#FF0080' },
  language: { icon: '🗣️',  label: 'Language',    color: '#26c6da' },
  music:    { icon: '🎵', label: 'Music',        color: '#f06292' },
  kitchen:  { icon: '🍳', label: 'Kitchen',      color: '#ff9800' },
  comedy:   { icon: '😂', label: 'Comedy',       color: '#ffd600' },
  gaming:   { icon: '🎮', label: 'Gaming',       color: '#ab47bc' },
  fitness:  { icon: '💪', label: 'Fitness',      color: '#ff7043' },
  mindful:  { icon: '🧘', label: 'Mindfulness',  color: '#a5d6a7' },
  travel:   { icon: '✈️',  label: 'Travel Live', color: '#42a5f5' },
  create:   { icon: '🎨', label: 'Create',       color: '#ce93d8' },
  tech:     { icon: '💻', label: 'Tech',         color: '#00bcd4' },
  stories:  { icon: '📖', label: 'Stories',      color: '#ffcc02' },
};

const NOW = Date.now();

// ── Demo stages ───────────────────────────────────────────────────────────────
const DEMO_STAGES = [
  // Live now
  {
    id: 'stage_001', title: 'Bollywood Dance Party 🕺',
    type: 'cultural', hostUsername: 'Priya_Mumbai', hostCountry: '🇮🇳',
    viewerCount: 1832, giftTotal: 14200,
    isPro: true, isFeatured: true, isLive: true,
    startedAt: NOW - 35 * 60000, scheduledFor: null, stampCountry: '🇮🇳',
  },
  {
    id: 'stage_002', title: 'Seoul Street Kitchen 🍜',
    type: 'kitchen', hostUsername: 'JiMin_Seoul', hostCountry: '🇰🇷',
    viewerCount: 1247, giftTotal: 9800,
    isPro: true, isFeatured: true, isLive: true,
    startedAt: NOW - 58 * 60000, scheduledFor: null, stampCountry: '🇰🇷',
  },
  {
    id: 'stage_003', title: 'Afrobeats Session 🎶',
    type: 'music', hostUsername: 'Amara_Lagos', hostCountry: '🇳🇬',
    viewerCount: 847, giftTotal: 6100,
    isPro: true, isFeatured: false, isLive: true,
    startedAt: NOW - 22 * 60000, scheduledFor: null, stampCountry: '🇳🇬',
  },
  {
    id: 'stage_004', title: 'Tango Masterclass 💃',
    type: 'cultural', hostUsername: 'Sofia_Buenos', hostCountry: '🇦🇷',
    viewerCount: 709, giftTotal: 5300,
    isPro: true, isFeatured: false, isLive: true,
    startedAt: NOW - 45 * 60000, scheduledFor: null, stampCountry: '🇦🇷',
  },
  {
    id: 'stage_005', title: 'Japanese Calligraphy 🖌️',
    type: 'create', hostUsername: 'Yuki_Tokyo', hostCountry: '🇯🇵',
    viewerCount: 612, giftTotal: 3900,
    isPro: false, isFeatured: false, isLive: true,
    startedAt: NOW - 70 * 60000, scheduledFor: null, stampCountry: '🇯🇵',
  },
  {
    id: 'stage_006', title: 'Istanbul Street Tour 🕌',
    type: 'travel', hostUsername: 'Emre_Istanbul', hostCountry: '🇹🇷',
    viewerCount: 445, giftTotal: 2800,
    isPro: false, isFeatured: false, isLive: true,
    startedAt: NOW - 15 * 60000, scheduledFor: null, stampCountry: '🇹🇷',
  },
  {
    id: 'stage_007', title: 'Tea Ceremony Live 🍵',
    type: 'cultural', hostUsername: 'Wei_Shanghai', hostCountry: '🇨🇳',
    viewerCount: 567, giftTotal: 3200,
    isPro: false, isFeatured: false, isLive: true,
    startedAt: NOW - 90 * 60000, scheduledFor: null, stampCountry: '🇨🇳',
  },
  {
    id: 'stage_008', title: 'Samba Workshop 🥁',
    type: 'music', hostUsername: 'Lucas_Rio', hostCountry: '🇧🇷',
    viewerCount: 389, giftTotal: 2400,
    isPro: true, isFeatured: false, isLive: true,
    startedAt: NOW - 30 * 60000, scheduledFor: null, stampCountry: '🇧🇷',
  },
  {
    id: 'stage_009', title: 'French Cooking Class 🥐',
    type: 'kitchen', hostUsername: 'Amélie_Paris', hostCountry: '🇫🇷',
    viewerCount: 241, giftTotal: 1600,
    isPro: false, isFeatured: false, isLive: true,
    startedAt: NOW - 50 * 60000, scheduledFor: null, stampCountry: '🇫🇷',
  },
  {
    id: 'stage_010', title: 'Spanish Exchange Night 🗣️',
    type: 'language', hostUsername: 'Carlos_CDMX', hostCountry: '🇲🇽',
    viewerCount: 334, giftTotal: 2100,
    isPro: false, isFeatured: false, isLive: true,
    startedAt: NOW - 25 * 60000, scheduledFor: null, stampCountry: '🇲🇽',
  },
  {
    id: 'stage_011', title: 'Kente Weaving Live 🧵',
    type: 'create', hostUsername: 'Ama_Accra', hostCountry: '🇬🇭',
    viewerCount: 223, giftTotal: 1400,
    isPro: false, isFeatured: false, isLive: true,
    startedAt: NOW - 40 * 60000, scheduledFor: null, stampCountry: '🇬🇭',
  },
  {
    id: 'stage_012', title: 'Ubuntu Philosophy Talk 📖',
    type: 'stories', hostUsername: 'Thabo_Joburg', hostCountry: '🇿🇦',
    viewerCount: 198, giftTotal: 1100,
    isPro: false, isFeatured: false, isLive: true,
    startedAt: NOW - 65 * 60000, scheduledFor: null, stampCountry: '🇿🇦',
  },
  // Upcoming
  {
    id: 'stage_013', title: 'Cairo Night Market 🌙',
    type: 'travel', hostUsername: 'Ahmed_Cairo', hostCountry: '🇪🇬',
    viewerCount: 0, giftTotal: 0,
    isPro: false, isFeatured: false, isLive: false,
    startedAt: null, scheduledFor: NOW + 2 * 3600000, stampCountry: '🇪🇬',
  },
  {
    id: 'stage_014', title: 'Nairobi Code Night 💻',
    type: 'tech', hostUsername: 'Wanjiru_Nairobi', hostCountry: '🇰🇪',
    viewerCount: 0, giftTotal: 0,
    isPro: true, isFeatured: false, isLive: false,
    startedAt: null, scheduledFor: NOW + 4 * 3600000, stampCountry: '🇰🇪',
  },
  {
    id: 'stage_015', title: 'Bali Sunrise Yoga 🧘',
    type: 'mindful', hostUsername: 'Dewi_Bali', hostCountry: '🇮🇩',
    viewerCount: 0, giftTotal: 0,
    isPro: false, isFeatured: false, isLive: false,
    startedAt: null, scheduledFor: NOW + 8 * 3600000, stampCountry: '🇮🇩',
  },
  {
    id: 'stage_016', title: 'Lisbon Jazz Night 🎷',
    type: 'music', hostUsername: 'Pedro_Lisboa', hostCountry: '🇵🇹',
    viewerCount: 0, giftTotal: 0,
    isPro: true, isFeatured: false, isLive: false,
    startedAt: null, scheduledFor: NOW + 24 * 3600000, stampCountry: '🇵🇹',
  },
  {
    id: 'stage_017', title: 'Montreal Comedy Night 😂',
    type: 'comedy', hostUsername: 'Marie_Montreal', hostCountry: '🇨🇦',
    viewerCount: 0, giftTotal: 0,
    isPro: false, isFeatured: false, isLive: false,
    startedAt: null, scheduledFor: NOW + 28 * 3600000, stampCountry: '🇨🇦',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function fmtScheduled(ts) {
  const diff = ts - Date.now();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return 'Tomorrow';
  if (h > 0)   return `In ${h}h ${m}m`;
  return `In ${m}m`;
}

function mapServerStage(e) {
  return {
    id:           e.id,
    title:        e.title || 'Live Stage',
    type:         STAGE_TYPES[e.type] ? e.type : 'cultural',
    hostUsername: e.hostName || e.username || 'Anonymous',
    hostCountry:  e.hostCountry || '🌍',
    viewerCount:  e.viewerCount || 0,
    giftTotal:    e.giftTotal || 0,
    isPro:        e.isPro || false,
    isFeatured:   e.isPro || false,
    isLive:       e.isLive !== false,
    startedAt:    e.startedAt || Date.now(),
    scheduledFor: e.scheduledFor || null,
    stampCountry: e.hostCountry || '🌍',
  };
}

// ── LivePulse ─────────────────────────────────────────────────────────────────
function LivePulse() {
  return (
    <View style={lp.row}>
      <View style={lp.dot} />
      <Text style={lp.txt}>LIVE</Text>
    </View>
  );
}
const lp = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  txt: { color: '#ef4444', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});

// ── ProBadge ──────────────────────────────────────────────────────────────────
function ProBadge() {
  return (
    <View style={pb.wrap}>
      <Text style={pb.txt}>⭐ PRO</Text>
    </View>
  );
}
const pb = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFB70020', borderWidth: 1, borderColor: '#FFB700',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  txt: { color: '#FFB700', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

// ── FeaturedCard ──────────────────────────────────────────────────────────────
function FeaturedCard({ stage, onPress }) {
  const meta = STAGE_TYPES[stage.type] || STAGE_TYPES.cultural;
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => onPress(stage)} style={fc.wrap}>
      <LinearGradient
        colors={[`${meta.color}28`, '#0d1117cc', '#050507']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={fc.grad}
      >
        <View style={fc.topRow}>
          <View style={fc.left}>
            <Text style={fc.flag}>{stage.hostCountry}</Text>
            <View style={fc.badgeRow}>
              {stage.isPro && <ProBadge />}
              <View style={[fc.typePill, { backgroundColor: `${meta.color}20`, borderColor: meta.color }]}>
                <Text style={[fc.typeLabel, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
              </View>
            </View>
          </View>
          <View style={fc.right}>
            <LivePulse />
            <Text style={fc.stat}>👁 {fmtNum(stage.viewerCount)}</Text>
            <Text style={fc.stat}>🪙 {fmtNum(stage.giftTotal)}</Text>
          </View>
        </View>

        <Text style={fc.title} numberOfLines={2}>{stage.title}</Text>
        <Text style={fc.host}>@{stage.hostUsername}</Text>

        <View style={fc.bottomRow}>
          <Text style={fc.royalty}>🪙 Gifts → stamp holder {stage.stampCountry}</Text>
          <TouchableOpacity
            style={[fc.joinBtn, { borderColor: meta.color }]}
            onPress={() => onPress(stage)}
          >
            <Text style={[fc.joinTxt, { color: meta.color }]}>JOIN STAGE</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const fc = StyleSheet.create({
  wrap:     { marginHorizontal: 16, marginBottom: 16, borderRadius: 18, overflow: 'hidden' },
  grad:     { padding: 18, minHeight: 200 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  left:     { gap: 8 },
  flag:     { fontSize: 40 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  typePill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeLabel:{ fontSize: 10, fontWeight: '700' },
  right:    { alignItems: 'flex-end', gap: 5 },
  stat:     { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  title:    { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 29, marginBottom: 4 },
  host:     { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 },
  bottomRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  royalty:  { color: 'rgba(255,255,255,0.35)', fontSize: 11, flex: 1 },
  joinBtn:  { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9, marginLeft: 12 },
  joinTxt:  { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});

// ── StageCard — compact 2-column grid card ────────────────────────────────────
function StageCard({ stage, onPress }) {
  const meta = STAGE_TYPES[stage.type] || STAGE_TYPES.cultural;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(stage)} style={sc.wrap}>
      <LinearGradient
        colors={[`${meta.color}18`, '#0d111700', '#050507']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={sc.grad}
      >
        <View style={sc.topRow}>
          <Text style={sc.flag}>{stage.hostCountry}</Text>
          {stage.isPro && <ProBadge />}
        </View>
        <Text style={sc.typeIcon}>{meta.icon}</Text>
        <Text style={sc.title} numberOfLines={2}>{stage.title}</Text>
        <Text style={sc.host} numberOfLines={1}>@{stage.hostUsername}</Text>
        <View style={sc.bottomRow}>
          <LivePulse />
          <Text style={sc.viewers}>👁 {fmtNum(stage.viewerCount)}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const sc = StyleSheet.create({
  wrap:     {
    flex: 1, margin: 4, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  grad:     { padding: 12, minHeight: 158 },
  topRow:   {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  flag:     { fontSize: 24 },
  typeIcon: { fontSize: 22, marginBottom: 6 },
  title:    { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 3 },
  host:     { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 8 },
  bottomRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewers:  { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' },
});

// ── UpcomingCard — scheduled stage row ───────────────────────────────────────
function UpcomingCard({ stage, onPress }) {
  const meta = STAGE_TYPES[stage.type] || STAGE_TYPES.cultural;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(stage)} style={uc.wrap}>
      <View style={[uc.accent, { backgroundColor: meta.color }]} />
      <View style={uc.body}>
        <View style={uc.topRow}>
          <Text style={uc.flag}>{stage.hostCountry}</Text>
          <Text style={[uc.typeLabel, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
          {stage.isPro && <ProBadge />}
        </View>
        <Text style={uc.title} numberOfLines={2}>{stage.title}</Text>
        <Text style={uc.host}>@{stage.hostUsername}</Text>
        <Text style={uc.time}>⏰ {fmtScheduled(stage.scheduledFor)}</Text>
      </View>
    </TouchableOpacity>
  );
}
const uc = StyleSheet.create({
  wrap:     {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  accent:   { width: 4 },
  body:     { flex: 1, padding: 14 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  flag:     { fontSize: 18 },
  typeLabel:{ fontSize: 11, fontWeight: '700' },
  title:    { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  host:     { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 },
  time:     { color: '#42a5f5', fontSize: 11, fontWeight: '600' },
});

// ── CreateStageModal ──────────────────────────────────────────────────────────
function CreateStageModal({ visible, onClose, onSubmit, isPro }) {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState('cultural');

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), type: selectedType });
    setTitle('');
    setSelectedType('cultural');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={cm.overlay}>
        <View style={cm.sheet}>
          <LinearGradient colors={['#1a1f2e', '#0d1117']} style={cm.grad}>
            <Text style={cm.heading}>Start a World Stage</Text>

            {isPro && (
              <View style={cm.proBanner}>
                <Text style={cm.proBannerTxt}>⭐ Your Pro stage gets featured placement at the top</Text>
              </View>
            )}

            <Text style={cm.label}>Stage Title</Text>
            <TextInput
              style={cm.input}
              placeholder="What's happening on your stage?"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={title}
              onChangeText={setTitle}
              maxLength={60}
            />

            <Text style={cm.label}>Stage Type</Text>
            <View style={cm.typeGrid}>
              {Object.keys(STAGE_TYPES).map(key => {
                const meta = STAGE_TYPES[key];
                const sel = selectedType === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      cm.typeChip,
                      sel && { backgroundColor: `${meta.color}25`, borderColor: meta.color },
                    ]}
                    onPress={() => setSelectedType(key)}
                  >
                    <Text style={cm.typeChipIcon}>{meta.icon}</Text>
                    <Text style={[cm.typeChipLabel, sel && { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={cm.royaltyNote}>
              🪙 Gifts from your stage flow to you + your country's stamp holder
            </Text>

            <View style={cm.actions}>
              <TouchableOpacity style={cm.cancelBtn} onPress={onClose}>
                <Text style={cm.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cm.goBtn, !title.trim() && cm.goBtnDisabled]}
                onPress={handleSubmit}
                disabled={!title.trim()}
              >
                <LinearGradient
                  colors={['#FF0080', '#9B00FF']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={cm.goBtnGrad}
                >
                  <Text style={cm.goTxt}>GO LIVE NOW</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  grad:         { padding: 24, paddingBottom: 44 },
  heading:      { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 14 },
  proBanner:    {
    backgroundColor: '#FFB70015', borderWidth: 1, borderColor: '#FFB70050',
    borderRadius: 10, padding: 10, marginBottom: 4,
  },
  proBannerTxt: { color: '#FFB700', fontSize: 12, fontWeight: '700' },
  label:        {
    color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 18,
  },
  input:        {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    padding: 14, color: '#fff', fontSize: 14,
  },
  typeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:     {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  typeChipIcon: { fontSize: 14 },
  typeChipLabel:{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600' },
  royaltyNote:  { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 18, lineHeight: 17 },
  actions:      { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:    {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelTxt:    { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700' },
  goBtn:        { flex: 2, borderRadius: 14, overflow: 'hidden' },
  goBtnDisabled:{ opacity: 0.4 },
  goBtnGrad:    { paddingVertical: 14, alignItems: 'center' },
  goTxt:        { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function EventsScreen({ navigation, route }) {
  const { isPro, isPlus } = usePremium();
  const user = route?.params?.currentUser || route?.params?.user || null;
  const [stages, setStages] = useState(DEMO_STAGES);
  const [filter, setFilter] = useState('all');
  const [createVisible, setCreateVisible] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (socket.connected) socket.emit('get_events');
    else socket.once('connect', () => socket.emit('get_events'));

    socket.on('events_list', list => {
      if (list?.length) {
        setStages(prev => {
          const serverIds = new Set(list.map(e => e.id));
          const demos = prev.filter(d => !serverIds.has(d.id));
          return [...list.map(mapServerStage), ...demos];
        });
      }
    });
    socket.on('event_updated', updated => {
      setStages(prev =>
        prev.map(st => st.id === updated.id ? { ...st, ...mapServerStage(updated) } : st)
      );
    });
    return () => {
      socket.off('events_list');
      socket.off('event_updated');
    };
  }, []);

  const filteredStages = useMemo(() => {
    const list = filter === 'all' ? stages : stages.filter(st => st.type === filter);
    return [...list].sort((a, b) => {
      if (a.isLive && !b.isLive)   return -1;
      if (!a.isLive && b.isLive)   return 1;
      if (a.isPro && !b.isPro)     return -1;
      if (!a.isPro && b.isPro)     return 1;
      return b.viewerCount - a.viewerCount;
    });
  }, [stages, filter]);

  const liveStages     = useMemo(() => filteredStages.filter(st => st.isLive),  [filteredStages]);
  const upcomingStages = useMemo(() => filteredStages.filter(st => !st.isLive), [filteredStages]);
  const featuredStage  = useMemo(
    () => liveStages.find(st => st.isPro && st.isFeatured) || liveStages[0],
    [liveStages]
  );
  const totalViewers = useMemo(
    () => stages.filter(st => st.isLive).reduce((acc, st) => acc + st.viewerCount, 0),
    [stages]
  );

  function openStage(stage) {
    if (!stage.isLive) {
      Alert.alert(stage.title, 'This stage hasn\'t started yet.');
      return;
    }
    navigation.navigate('LiveWatch', {
      stream: {
        streamId:    stage.id,
        title:       stage.title,
        hostName:    stage.hostUsername,
        hostCountry: stage.hostCountry,
        startedAt:   stage.startedAt,
        viewerCount: stage.viewerCount,
      },
      currentUser: user,
    });
  }

  function handleGoLive() {
    if (!isPro && !isPlus) {
      Alert.alert(
        'Upgrade to Host',
        'Host live stages with Plus or Pro. Pro hosts get featured placement.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }
    setCreateVisible(true);
  }

  function handleCreateSubmit({ title, type }) {
    setCreateVisible(false);
    navigation.navigate('Live', { preTitle: title, preType: type, currentUser: user });
  }

  const typeFilterKeys = ['all', ...Object.keys(STAGE_TYPES)];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>{'←'}</Text>
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>WORLD STAGES</Text>
          <Text style={s.headerSub}>
            🔴 {liveStages.length} live · 👁 {fmtNum(totalViewers)} watching
          </Text>
        </View>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro priority banner */}
        {isPro && (
          <TouchableOpacity style={s.proBanner} onPress={handleGoLive}>
            <LinearGradient
              colors={['#FFB70018', '#FFB70008']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.proBannerGrad}
            >
              <View style={s.proBannerLeft}>
                <Text style={s.proBannerStar}>⭐</Text>
                <View>
                  <Text style={s.proBannerTitle}>GO LIVE FIRST</Text>
                  <Text style={s.proBannerSub}>Your Pro stage gets featured at the top</Text>
                </View>
              </View>
              <Text style={s.proBannerCTA}>Start →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Featured stage */}
        {featuredStage && (
          <>
            <Text style={s.sectionLabel}>⭐ FEATURED STAGE</Text>
            <FeaturedCard stage={featuredStage} onPress={openStage} />
          </>
        )}

        {/* Type filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterRow}
          contentContainerStyle={s.filterContent}
        >
          {typeFilterKeys.map(key => {
            const meta = STAGE_TYPES[key];
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  s.filterChip,
                  active && s.filterChipActive,
                  active && meta && { borderColor: meta.color },
                ]}
                onPress={() => setFilter(key)}
              >
                <Text style={[s.filterChipTxt, active && { color: meta ? meta.color : '#fff' }]}>
                  {key === 'all' ? '🌐 All' : `${meta.icon} ${meta.label}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Live Now grid */}
        {liveStages.length > 0 && (
          <>
            <Text style={s.sectionLabel}>🔴 LIVE NOW ({liveStages.length})</Text>
            <View style={s.stageGrid}>
              {liveStages
                .filter(st => st.id !== featuredStage?.id)
                .map(stage => (
                  <StageCard key={stage.id} stage={stage} onPress={openStage} />
                ))}
            </View>
          </>
        )}

        {/* Coming Up */}
        {upcomingStages.length > 0 && (
          <>
            <Text style={s.sectionLabel}>🕐 COMING UP</Text>
            {upcomingStages.map(stage => (
              <UpcomingCard key={stage.id} stage={stage} onPress={openStage} />
            ))}
          </>
        )}

        <View style={s.bottomPad} />
      </ScrollView>

      {/* Go Live FAB */}
      <TouchableOpacity style={s.fab} onPress={handleGoLive}>
        <LinearGradient
          colors={['#FF0080', '#9B00FF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.fabGrad}
        >
          <Text style={s.fabIcon}>📡</Text>
          <Text style={s.fabTxt}>GO LIVE</Text>
        </LinearGradient>
      </TouchableOpacity>

      <CreateStageModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreateSubmit}
        isPro={isPro}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#050507' },
  header:         {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:      { color: '#fff', fontSize: 22 },
  headerMid:      { flex: 1, alignItems: 'center' },
  headerTitle:    { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  headerSub:      { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  headerSpacer:   { width: 36 },
  scroll:         { flex: 1 },
  scrollContent:  { paddingTop: 16 },
  proBanner:      {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#FFB70030',
  },
  proBannerGrad:  {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  proBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  proBannerStar:  { fontSize: 24 },
  proBannerTitle: { color: '#FFB700', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  proBannerSub:   { color: 'rgba(255,183,0,0.55)', fontSize: 11, marginTop: 2 },
  proBannerCTA:   { color: '#FFB700', fontSize: 14, fontWeight: '800' },
  sectionLabel:   {
    color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800',
    letterSpacing: 1, marginHorizontal: 16, marginBottom: 12, marginTop: 4,
  },
  filterRow:      { marginBottom: 16 },
  filterContent:  { paddingHorizontal: 16, gap: 8 },
  filterChip:     {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  filterChipTxt:  { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '700' },
  stageGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 8 },
  bottomPad:      { height: 110 },
  fab:            {
    position: 'absolute', bottom: 28, right: 24,
    borderRadius: 28, overflow: 'hidden',
    shadowColor: '#FF0080', shadowOpacity: 0.5,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  fabGrad:        {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 14, gap: 8,
  },
  fabIcon:        { fontSize: 18 },
  fabTxt:         { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});
