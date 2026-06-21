import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Animated, Dimensions, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../services/socket';
import { usePremium } from '../context/PremiumContext';
import GiftPicker, { GIFTS } from '../components/GiftPicker';
import { useWallet } from '../context/WalletContext';
import { stringToColor } from '../utils/apiUtils';
import FloatingReaction from '../components/FloatingReaction';

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
  comedy:       { icon: '😂', label: 'Comedy Night',      color: '#ffd600', grad: ['#2a2000', '#141000', '#050507'] },
  tech_talk:    { icon: '💻', label: 'Tech Talk',         color: '#00bcd4', grad: ['#001f24', '#000f12', '#050507'] },
  meditation:   { icon: '🧘', label: 'Mindfulness',       color: '#a5d6a7', grad: ['#0a1f0a', '#050f05', '#050507'] },
};

const FILTERS = ['All', ...Object.keys(TYPE_META)];
const TYPES_LIST = Object.entries(TYPE_META).map(([id, m]) => ({ id, ...m }));

// ─── Country → region map ─────────────────────────────────────────────────────
const COUNTRY_REGIONS = {
  '🌎 Americas':    ['🇺🇸','🇨🇦','🇲🇽','🇧🇷','🇦🇷','🇨🇴','🇵🇪','🇨🇱','🇻🇪','🇨🇺','🇯🇲','🇵🇷'],
  '🌍 Europe':      ['🇬🇧','🇩🇰','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇵🇹','🇳🇱','🇸🇪','🇳🇴','🇵🇱','🇷🇺','🇺🇦','🇹🇷','🇬🇷','🇨🇭','🇧🇪','🇦🇹'],
  '🌏 Asia':        ['🇯🇵','🇰🇷','🇨🇳','🇮🇳','🇮🇩','🇵🇭','🇻🇳','🇹🇭','🇲🇾','🇸🇬','🇵🇰','🇧🇩','🇱🇰','🇳🇵','🇰🇭','🇲🇲'],
  '🕌 Middle East': ['🇸🇦','🇦🇪','🇪🇬','🇮🇷','🇮🇶','🇮🇱','🇯🇴','🇱🇧','🇰🇼','🇶🇦','🇴🇲','🇾🇪'],
  '🌍 Africa':      ['🇳🇬','🇿🇦','🇰🇪','🇬🇭','🇪🇹','🇹🇿','🇲🇦','🇸🇳','🇨🇲','🇺🇬','🇦🇴','🇿🇲'],
  '🌏 Oceania':     ['🇦🇺','🇳🇿','🇫🇯','🇵🇬'],
};

function getRegion(flag) {
  for (const [region, flags] of Object.entries(COUNTRY_REGIONS)) {
    if (flags.includes(flag)) return region;
  }
  return '🌐 Other';
}

// ─── Demo events ──────────────────────────────────────────────────────────────
const DEMO_EVENTS = [
  // ── Live now ──
  {
    id: 'de1', title: 'K-Drama Watch Party 🍜', type: 'watch_party',
    description: 'Watching the latest episode of "When the Stars Fall" together. Bring snacks! 🍿',
    hostId: 'host_de1', hostName: 'JiMin_Seoul', hostCountry: '🇰🇷',
    attendees: Array.from({ length: 312 }), maxAttendees: 400,
    scheduledFor: null, tags: ['Netflix', 'Korean'],
  },
  {
    id: 'de2', title: 'Global English Practice 🌍', type: 'language',
    description: 'Casual conversation practice. All levels welcome.',
    hostId: 'host_de2', hostName: 'Sarah_London', hostCountry: '🇬🇧',
    attendees: Array.from({ length: 247 }), maxAttendees: 300,
    scheduledFor: null, tags: ['English', 'Beginner OK'],
  },
  {
    id: 'de9', title: 'Hip-Hop Freestyle Cypher 🎤', type: 'music',
    description: 'Spit bars, drop beats, vibe out. All skill levels welcome — bars only, no hate.',
    hostId: 'host_de9', hostName: 'DeShawn_ATL', hostCountry: '🇺🇸',
    attendees: Array.from({ length: 203 }), maxAttendees: 250,
    scheduledFor: null, tags: ['Hip-hop', 'Freestyle'],
  },
  {
    id: 'de10', title: 'Afrobeats Dance Party 🕺', type: 'just_chill',
    description: 'Turn up with the hottest Afrobeats, Amapiano, and Afropop. Cameras on, let\'s dance!',
    hostId: 'host_de10', hostName: 'Kofi_Accra', hostCountry: '🇬🇭',
    attendees: Array.from({ length: 178 }), maxAttendees: 200,
    scheduledFor: null, tags: ['Afrobeats', 'Dance'],
  },
  {
    id: 'de8', title: 'Chill & Chat Lounge 😎', type: 'just_chill',
    description: 'No agenda — just vibes. Come talk about your week, share music, meet new people.',
    hostId: 'host_de8', hostName: 'Fatoumata_DK', hostCountry: '🇩🇰',
    attendees: Array.from({ length: 41 }), maxAttendees: 60,
    scheduledFor: null, tags: ['Casual', 'Open mic'],
  },
  // ── Upcoming ──
  {
    id: 'de3', title: 'Friday Night Valorant 🎮', type: 'game_night',
    description: 'Squad up for ranked matches. All ranks welcome, we\'ll make balanced teams.',
    hostName: 'Carlos_MX', hostCountry: '🇲🇽',
    attendees: Array.from({ length: 189 }), maxAttendees: 200,
    scheduledFor: Date.now() + 1800000, tags: ['Valorant', 'FPS'],
  },
  {
    id: 'de4', title: 'African Cuisine Cook-Along 🍛', type: 'cooking',
    description: 'Today: Jollof rice battle — Nigeria vs Ghana. Vote for the best after we cook!',
    hostName: 'Amara_Lagos', hostCountry: '🇳🇬',
    attendees: Array.from({ length: 134 }), maxAttendees: 150,
    scheduledFor: Date.now() + 3600000, tags: ['Jollof', 'West Africa'],
  },
  {
    id: 'de5', title: 'Lo-fi Study Session 📚', type: 'study',
    description: 'Focused 2-hour study block with lo-fi beats. Pomodoro timers shared.',
    hostName: 'Yuki_Tokyo', hostCountry: '🇯🇵',
    attendees: Array.from({ length: 98 }), maxAttendees: 200,
    scheduledFor: Date.now() + 5400000, tags: ['Focus', 'Lo-fi'],
  },
  {
    id: 'de6', title: 'Morning Yoga Flow 💪', type: 'workout',
    description: '30-min beginner-friendly yoga. All you need is a mat and water.',
    hostName: 'Priya_Mumbai', hostCountry: '🇮🇳',
    attendees: Array.from({ length: 76 }), maxAttendees: 100,
    scheduledFor: Date.now() + 7200000, tags: ['Yoga', 'Beginner'],
  },
  {
    id: 'de7', title: 'Digital Art Collab 🎨', type: 'art',
    description: 'This week: cityscapes at night. Draw your city, share, compare!',
    hostName: 'Lucas_SP', hostCountry: '🇧🇷',
    attendees: Array.from({ length: 54 }), maxAttendees: 80,
    scheduledFor: Date.now() + 10800000, tags: ['Digital Art', 'Procreate'],
  },
  {
    id: 'de11', title: 'French Language Café ☕', type: 'language',
    description: 'Practice French in a relaxed setting. Débutants bienvenus!',
    hostName: 'Amélie_Paris', hostCountry: '🇫🇷',
    attendees: Array.from({ length: 67 }), maxAttendees: 80,
    scheduledFor: Date.now() + 14400000, tags: ['French', 'Débutant OK'],
  },
  {
    id: 'de12', title: 'Anime Watch Night 🌸', type: 'watch_party',
    description: 'Watching Attack on Titan finale together. Spoiler-free reactions welcome.',
    hostName: 'Chen_Shanghai', hostCountry: '🇨🇳',
    attendees: Array.from({ length: 155 }), maxAttendees: 200,
    scheduledFor: Date.now() + 18000000, tags: ['Anime', 'Attack on Titan'],
  },
  {
    id: 'de13', title: 'K-Pop Stans Unite 🎵', type: 'music',
    description: 'React to new drops, share fancams, talk comebacks. All fandoms welcome!',
    hostName: 'Sofia_PH', hostCountry: '🇵🇭',
    attendees: Array.from({ length: 89 }), maxAttendees: 120,
    scheduledFor: Date.now() + 21600000, tags: ['K-Pop', 'Fancam'],
  },
  {
    id: 'de14', title: 'Startup Pitch Night 🚀', type: 'just_chill',
    description: '60-second pitches, open feedback, meet cofounders. No VC gatekeeping.',
    hostName: 'Amir_Dubai', hostCountry: '🇦🇪',
    attendees: Array.from({ length: 112 }), maxAttendees: 150,
    scheduledFor: Date.now() + 25200000, tags: ['Startup', 'Networking'],
  },
  {
    id: 'de15', title: 'Flamenco & Spanish Culture 💃', type: 'music',
    description: 'Live flamenco performance + Q&A about Spanish culture. ¡Vamos!',
    hostName: 'Isabella_Madrid', hostCountry: '🇪🇸',
    attendees: Array.from({ length: 73 }), maxAttendees: 100,
    scheduledFor: Date.now() + 28800000, tags: ['Flamenco', 'Spanish'],
  },
  {
    id: 'de16', title: 'Toronto Chill Sessions 🍁', type: 'just_chill',
    description: 'Canada\'s most chill weekly hangout. Bring your coffee, bring good vibes.',
    hostName: 'Marcus_TO', hostCountry: '🇨🇦',
    attendees: Array.from({ length: 48 }), maxAttendees: 75,
    scheduledFor: Date.now() + 32400000, tags: ['Chill', 'Canada'],
  },
  {
    id: 'de17', title: 'Sydney Morning Workout 🏋️', type: 'workout',
    description: 'HIIT workout to start your day right. 30 mins, all levels welcome.',
    hostName: 'Jake_Sydney', hostCountry: '🇦🇺',
    attendees: Array.from({ length: 61 }), maxAttendees: 80,
    scheduledFor: Date.now() + 36000000, tags: ['HIIT', 'Morning'],
  },
  {
    id: 'de18', title: 'Bollywood Karaoke Night 🎤', type: 'music',
    description: 'Sing your heart out to Bollywood classics and new hits. Hindi & English OK.',
    hostName: 'Riya_Delhi', hostCountry: '🇮🇳',
    attendees: Array.from({ length: 92 }), maxAttendees: 120,
    scheduledFor: Date.now() + 39600000, tags: ['Bollywood', 'Karaoke'],
  },
  {
    id: 'de19', title: 'Turkish Coffee & Conversation ☕', type: 'just_chill',
    description: 'Easy conversation over coffee. Turkish, English, or mix — all welcome.',
    hostName: 'Zeynep_Istanbul', hostCountry: '🇹🇷',
    attendees: Array.from({ length: 38 }), maxAttendees: 50,
    scheduledFor: Date.now() + 43200000, tags: ['Coffee', 'Turkish'],
  },
  {
    id: 'de20', title: 'Minecraft World Build 🎮', type: 'game_night',
    description: 'Building a fantasy city together. Join the server and grab a plot!',
    hostName: 'Erik_Stockholm', hostCountry: '🇸🇪',
    attendees: Array.from({ length: 44 }), maxAttendees: 60,
    scheduledFor: Date.now() + 46800000, tags: ['Minecraft', 'Build'],
  },
  {
    id: 'de21', title: 'Kenyan Cooking Class 🍲', type: 'cooking',
    description: 'Making Nyama Choma and Ugali from scratch. Ingredients list in description.',
    hostName: 'Wanjiku_Nairobi', hostCountry: '🇰🇪',
    attendees: Array.from({ length: 29 }), maxAttendees: 40,
    scheduledFor: Date.now() + 50400000, tags: ['Kenyan', 'Ugali'],
  },
  {
    id: 'de22', title: 'Buenos Aires Tango Night 💃', type: 'music',
    description: 'Learn the basics of tango with live music. No partner needed!',
    hostName: 'Valentina_BA', hostCountry: '🇦🇷',
    attendees: Array.from({ length: 56 }), maxAttendees: 70,
    scheduledFor: Date.now() + 54000000, tags: ['Tango', 'Dance'],
  },
  {
    id: 'de23', title: 'German Board Game Night 🎲', type: 'game_night',
    description: 'Playing Catan, Ticket to Ride, and more. German & English both fine.',
    hostName: 'Hans_Berlin', hostCountry: '🇩🇪',
    attendees: Array.from({ length: 33 }), maxAttendees: 48,
    scheduledFor: Date.now() + 57600000, tags: ['Board Games', 'Catan'],
  },
  {
    id: 'de24', title: 'Saudi Arabian Cultural Night 🌙', type: 'just_chill',
    description: 'Share traditions, food stories, and culture from across the Gulf region.',
    hostName: 'Khalid_Riyadh', hostCountry: '🇸🇦',
    attendees: Array.from({ length: 51 }), maxAttendees: 80,
    scheduledFor: Date.now() + 61200000, tags: ['Gulf', 'Culture'],
  },
  {
    id: 'de25', title: 'Cape Town Art Share 🎨', type: 'art',
    description: 'South African artists sharing work and giving feedback. All styles welcome.',
    hostName: 'Naledi_CT', hostCountry: '🇿🇦',
    attendees: Array.from({ length: 27 }), maxAttendees: 40,
    scheduledFor: Date.now() + 64800000, tags: ['Art', 'South Africa'],
  },
  {
    id: 'de26', title: 'Stand-Up Open Mic Night 😂', type: 'comedy',
    description: 'Got jokes? Come test your material or just enjoy the laughs. All topics welcome.',
    hostName: 'Tyler_NYC', hostCountry: '🇺🇸',
    attendees: Array.from({ length: 143 }), maxAttendees: 200,
    scheduledFor: null, tags: ['Stand-up', 'Open mic'],
  },
  {
    id: 'de27', title: 'Roast Battle 🔥😂', type: 'comedy',
    description: 'Friendly roast battles — all in good fun. Thick skin required, tears optional.',
    hostName: 'Jamie_London', hostCountry: '🇬🇧',
    attendees: Array.from({ length: 88 }), maxAttendees: 120,
    scheduledFor: Date.now() + 7200000, tags: ['Roast', 'Comedy'],
  },
  {
    id: 'de28', title: 'AI & Future Tech Chat 💻', type: 'tech_talk',
    description: 'Weekly deep-dive on AI news, tools, and what\'s coming next. No jargon gatekeeping.',
    hostName: 'Priya_Bangalore', hostCountry: '🇮🇳',
    attendees: Array.from({ length: 176 }), maxAttendees: 250,
    scheduledFor: null, tags: ['AI', 'Tech'],
  },
  {
    id: 'de29', title: 'Build in Public Session 💻', type: 'tech_talk',
    description: 'Share what you\'re building, get feedback, stay accountable. Devs & designers welcome.',
    hostName: 'Yuto_Osaka', hostCountry: '🇯🇵',
    attendees: Array.from({ length: 64 }), maxAttendees: 100,
    scheduledFor: Date.now() + 10800000, tags: ['Dev', 'Build in Public'],
  },
  {
    id: 'de30', title: 'Morning Meditation Circle 🧘', type: 'meditation',
    description: '20-min guided meditation to start your day with clarity. Silence your notifications.',
    hostName: 'Aiko_Kyoto', hostCountry: '🇯🇵',
    attendees: Array.from({ length: 98 }), maxAttendees: 150,
    scheduledFor: null, tags: ['Meditation', 'Morning'],
  },
  {
    id: 'de31', title: 'Breathwork & Mindfulness 🧘', type: 'meditation',
    description: 'Guided breathwork session for stress relief and focus. Beginners very welcome.',
    hostName: 'Lena_Oslo', hostCountry: '🇳🇴',
    attendees: Array.from({ length: 52 }), maxAttendees: 80,
    scheduledFor: Date.now() + 14400000, tags: ['Breathwork', 'Mindfulness'],
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

// ─── Featured hero card ───────────────────────────────────────────────────────
function FeaturedCard({ item, onPress, onHostPress }) {
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
            <TouchableOpacity style={fe.hostRow} onPress={onHostPress} activeOpacity={0.75}>
              <View style={[fe.hostAvatar, { backgroundColor: stringToColor(item.hostName) }]}>
                <Text style={fe.hostInitial}>{(item.hostName || '?')[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={fe.hostName}>{item.hostName}</Text>
                <Text style={fe.hostFlag}>{item.hostCountry}</Text>
              </View>
            </TouchableOpacity>
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
function EventCard({ item, index, onPress, onHostPress }) {
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
              <TouchableOpacity style={ec.metaRow} onPress={onHostPress} activeOpacity={0.7} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <Text style={ec.hostTxt}>{item.hostName}</Text>
                {item.hostCountry ? <Text style={ec.hostFlag}>{item.hostCountry}</Text> : null}
                {isHot ? <Text style={{ fontSize: 11 }}>🔥</Text> : null}
              </TouchableOpacity>
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
  text: { color: '#888', fontSize: 12, fontWeight: '800' },
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

// ─── Floating reaction ────────────────────────────────────────────────────────
const REACTIONS = ['❤️', '🔥', '😂', '🙌', '😮', '💯', '🎉', '🌍'];

// ─── Event live modal (full-screen video room + chat) ─────────────────────────
function EventChatModal({ visible, event, onClose, user, navigation }) {
  const [messages,   setMessages]   = useState([]);
  const [text,       setText]       = useState('');
  const [floats,     setFloats]     = useState([]);
  const [showGifts,  setShowGifts]  = useState(false);
  const joinedRef  = useRef(false);
  const flatRef    = useRef(null);
  const socket     = getSocket();
  const meta       = event ? (TYPE_META[event.type] || TYPE_META.just_chill) : TYPE_META.just_chill;
  const { spendCoins, balance } = useWallet();

  useEffect(() => {
    if (!visible || !event) return;
    if (socket.connected) socket.emit('join_event', { eventId: event.id });
    else socket.once('connect', () => socket.emit('join_event', { eventId: event.id }));
    joinedRef.current = true;
    socket.on('event_history', ({ messages: hist }) => setMessages(hist || []));
    socket.on('event_message', msg => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    });
    socket.on('event_reaction', ({ emoji }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setFloats(prev => [...prev, { emoji, id }]);
    });
    return () => {
      if (joinedRef.current) socket.emit('leave_event', { eventId: event?.id });
      joinedRef.current = false;
      socket.off('event_history');
      socket.off('event_message');
      socket.off('event_reaction');
    };
  }, [visible, event?.id]);

  function send() {
    if (!text.trim()) return;
    const msg = {
      id: `local-${Date.now()}`,
      senderId: 'local',
      senderName: user?.username || 'You',
      senderCountry: user?.country || '',
      text: text.trim(),
      ts: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    if (socket.connected) {
      socket.emit('event_message', { eventId: event.id, text: text.trim() });
    }
    setText('');
  }

  function sendReaction(emoji) {
    const id = `${Date.now()}-${Math.random()}`;
    setFloats(prev => [...prev, { emoji, id }]);
    if (socket.connected) socket.emit('event_reaction', { eventId: event.id, emoji });
  }

  function sendGift(gift) {
    if (balance < gift.coins) return;
    spendCoins(gift.coins, 'live_gift', { eventId: event.id, giftId: gift.id });
    // Float the gift symbol — no chat message, just the animation
    const floatId = `gift-${Date.now()}`;
    setFloats(prev => [...prev, { emoji: gift.symbol, id: floatId }]);
    if (socket.connected) {
      socket.emit('event_gift', { eventId: event.id, gift, senderId: socket.id, senderName: user?.username });
    }
  }

  function removeFloat(id) { setFloats(prev => prev.filter(f => f.id !== id)); }

  if (!event) return null;
  const count   = event.attendees?.length || 0;
  const live    = isLive(event);
  const hostBg  = stringToColor(event.hostName || '');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar hidden />
      <View style={lv.container}>

        {/* ── Full-bleed background ── */}
        <LinearGradient
          colors={[meta.color + '55', meta.color + '22', '#000000', '#050507']}
          style={StyleSheet.absoluteFill}
        />

        {/* ── Host "video" area ── */}
        <View style={lv.videoArea}>
          {/* Ambient glow rings */}
          <View style={[lv.glowRing, lv.glowRing1, { borderColor: meta.color + '30' }]} />
          <View style={[lv.glowRing, lv.glowRing2, { borderColor: meta.color + '18' }]} />
          {/* Host avatar — tappable to view profile */}
          <TouchableOpacity
            onPress={() => navigation?.navigate('Profile', { profileUser: { userId: event.hostId, username: event.hostName, country: event.hostCountry } })}
            activeOpacity={0.8}
            style={{ alignItems: 'center', gap: 4 }}
          >
            <View style={[lv.hostAvatar, { backgroundColor: hostBg }]}>
              <Text style={lv.hostInitial}>{(event.hostName || '?')[0].toUpperCase()}</Text>
            </View>
            <Text style={lv.hostName}>{event.hostName}</Text>
            {event.hostCountry ? <Text style={lv.hostFlag}>{event.hostCountry}</Text> : null}
          </TouchableOpacity>
          <View style={[lv.typePill, { backgroundColor: meta.color + '30', borderColor: meta.color + '55' }]}>
            <Text style={lv.typePillIcon}>{meta.icon}</Text>
            <Text style={[lv.typePillTxt, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* ── Floating reactions ── */}
        {floats.map(f => (
          <FloatingReaction key={f.id} emoji={f.emoji} id={f.id} onDone={removeFloat} rise={260} duration={2000} bottom={200} fontSize={34} />
        ))}

        <SafeAreaView style={lv.overlay}>

          {/* ── Top bar ── */}
          <View style={lv.topBar}>
            <TouchableOpacity style={lv.backBtn} onPress={onClose}>
              <Text style={lv.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={lv.eventTitle} numberOfLines={1}>{event.title}</Text>
              <Text style={lv.eventSub} numberOfLines={1}>{count} attending</Text>
            </View>
            {live ? (
              <View style={lv.liveBadge}>
                <View style={lv.liveDot} />
                <Text style={lv.liveTxt}>LIVE</Text>
              </View>
            ) : (
              <View style={[lv.timeBadge, { backgroundColor: meta.color + '25', borderColor: meta.color + '50' }]}>
                <Text style={[lv.timeTxt, { color: meta.color }]}>{timeLabel(event.scheduledFor)}</Text>
              </View>
            )}
          </View>

          {/* ── Bottom section: chat + reactions + input, all shift up with keyboard ── */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            {/* Chat messages */}
            <View style={lv.chatWrap}>
              <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={m => String(m.id)}
                contentContainerStyle={lv.chatList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={lv.chatEmpty}>
                    <Text style={lv.chatEmptyTxt}>Say hello to everyone 👋</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isMine = item.senderId === 'local' || item.senderId === socket.id;
                  const avatarC = stringToColor(item.senderName || '');
                  const goProfile = () => navigation?.navigate('Profile', {
                    profileUser: { userId: item.senderId, username: item.senderName, country: item.senderCountry },
                  });
                  return (
                    <View style={[lv.msgRow, isMine && lv.msgRowMine]}>
                      {!isMine && (
                        <TouchableOpacity onPress={goProfile} activeOpacity={0.75}>
                          <View style={[lv.msgAvatar, { backgroundColor: avatarC }]}>
                            <Text style={lv.msgAvatarTxt}>{(item.senderName || '?')[0].toUpperCase()}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      <View style={[lv.msgBubble, isMine && lv.msgBubbleMine]}>
                        {!isMine && (
                          <TouchableOpacity onPress={goProfile} activeOpacity={0.75}>
                            <Text style={[lv.msgSender, { color: avatarC }]}>
                              {item.senderName}
                              {item.senderCountry ? ` · ${item.senderCountry}` : ''}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <Text style={lv.msgText}>{item.text}</Text>
                      </View>
                    </View>
                  );
                }}
                onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
              />
            </View>

            {/* Reaction bar */}
            <View style={lv.reactBar}>
              {REACTIONS.map(e => (
                <TouchableOpacity key={e} style={lv.reactBtn} onPress={() => sendReaction(e)} activeOpacity={0.7}>
                  <Text style={lv.reactEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input bar */}
            <View style={lv.inputBar}>
              <View style={[lv.inputAvatar, { backgroundColor: stringToColor(user?.username || '') }]}>
                <Text style={lv.inputAvatarTxt}>{(user?.username || '?')[0].toUpperCase()}</Text>
              </View>
              <TextInput
                style={lv.input}
                placeholder="Say something..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={text}
                onChangeText={setText}
                onSubmitEditing={send}
                returnKeyType="send"
                maxLength={300}
              />
              <TouchableOpacity
                style={lv.giftBtn}
                onPress={() => setShowGifts(true)}
              >
                <Text style={lv.giftBtnIcon}>🎁</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[lv.sendBtn, { backgroundColor: text.trim() ? meta.color : 'rgba(255,255,255,0.12)' }]}
                onPress={send}
                disabled={!text.trim()}
              >
                <Text style={lv.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Gift Picker */}
        <GiftPicker
          visible={showGifts}
          onClose={() => setShowGifts(false)}
          onSend={sendGift}
          hostName={event.hostName}
        />
      </View>
    </Modal>
  );
}

const lv = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  overlay:      { flex: 1 },

  // Video area
  videoArea:    { position: 'absolute', top: 0, left: 0, right: 0, height: '52%',
                  alignItems: 'center', justifyContent: 'center', gap: 10 },
  glowRing:     { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  glowRing1:    { width: 220, height: 220 },
  glowRing2:    { width: 300, height: 300 },
  hostAvatar:   { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)' },
  hostInitial:  { color: '#fff', fontSize: 48, fontWeight: '900' },
  hostName:     { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 4 },
  hostFlag:     { fontSize: 18 },
  typePill:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20,
                  borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4 },
  typePillIcon: { fontSize: 14 },
  typePillTxt:  { fontSize: 13, fontWeight: '800' },


  // Top bar
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
                  paddingTop: 10, paddingBottom: 12, gap: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)',
                  alignItems: 'center', justifyContent: 'center' },
  backIcon:     { color: '#fff', fontSize: 20 },
  eventTitle:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  eventSub:     { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 },
  liveBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e53935',
                  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveTxt:      { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  timeBadge:    { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  timeTxt:      { fontSize: 12, fontWeight: '800' },

  // Chat
  chatWrap:     { maxHeight: '38%', paddingBottom: 4 },
  chatList:     { paddingHorizontal: 12, paddingBottom: 6, gap: 6 },
  chatEmpty:    { paddingHorizontal: 16, paddingVertical: 8 },
  chatEmptyTxt: { color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic' },
  msgRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  msgRowMine:   { justifyContent: 'flex-end' },
  msgAvatar:    { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  msgBubble:    { maxWidth: width * 0.74, backgroundColor: 'rgba(0,0,0,0.52)',
                  borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 3,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  msgBubbleMine:{ backgroundColor: 'rgba(108,71,255,0.55)', borderColor: 'rgba(108,71,255,0.3)' },
  msgSender:    { fontSize: 10, fontWeight: '800' },
  msgText:      { color: '#fff', fontSize: 13, lineHeight: 19 },

  // Reactions
  reactBar:     { flexDirection: 'row', justifyContent: 'space-around',
                  paddingHorizontal: 12, paddingVertical: 10 },
  reactBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)',
                  alignItems: 'center', justifyContent: 'center' },
  reactEmoji:   { fontSize: 20 },

  // Input
  inputBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                  paddingVertical: 10, gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  inputAvatar:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  inputAvatarTxt:{ color: '#fff', fontSize: 13, fontWeight: '800' },
  input:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff',
                  borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11,
                  fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  giftBtn:      { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.10)',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  giftBtnIcon:  { fontSize: 20 },
  sendBtn:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendIcon:     { color: '#fff', fontSize: 18 },
  // Coins earned badge on host
});

// ─── Vibe filter sheet ────────────────────────────────────────────────────────
function VibeSheet({ visible, value, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={fs.overlay} activeOpacity={1} onPress={onClose} />
      <View style={fs.sheet}>
        <View style={fs.handle} />
        <Text style={fs.sheetTitle}>Choose a Vibe</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* All */}
          <TouchableOpacity
            style={[fs.item, !value || value === 'All' ? fs.itemActive : null]}
            onPress={() => { onSelect('All'); onClose(); }}
          >
            <View style={[fs.itemIcon, { backgroundColor: '#1e2028' }]}>
              <Text style={{ fontSize: 20 }}>✨</Text>
            </View>
            <View style={fs.itemInfo}>
              <Text style={[fs.itemLabel, (!value || value === 'All') && { color: '#fff' }]}>All Vibes</Text>
              <Text style={fs.itemSub}>Show every type of event</Text>
            </View>
            {(!value || value === 'All') && <Text style={fs.check}>✓</Text>}
          </TouchableOpacity>
          {TYPES_LIST.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[fs.item, value === t.id && { backgroundColor: t.color + '15', borderColor: t.color + '44' }]}
              onPress={() => { onSelect(t.id); onClose(); }}
            >
              <View style={[fs.itemIcon, { backgroundColor: t.color + '25' }]}>
                <Text style={{ fontSize: 20 }}>{t.icon}</Text>
              </View>
              <View style={fs.itemInfo}>
                <Text style={[fs.itemLabel, value === t.id && { color: t.color }]}>{t.label}</Text>
              </View>
              {value === t.id && <Text style={[fs.check, { color: t.color }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Country filter sheet ─────────────────────────────────────────────────────
function CountrySheet({ visible, value, countries, sorted, onSelect, onClose }) {
  // Group countries by region
  const grouped = useMemo(() => {
    const map = {};
    for (const flag of countries) {
      const region = getRegion(flag);
      if (!map[region]) map[region] = [];
      map[region].push(flag);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [countries]);

  const useGrouped = countries.length > 5;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={fs.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[fs.sheet, { maxHeight: '85%' }]}>
        <View style={fs.handle} />
        <Text style={fs.sheetTitle}>Choose a Country</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Worldwide */}
          <TouchableOpacity
            style={[fs.item, !value && fs.itemActive]}
            onPress={() => { onSelect(null); onClose(); }}
          >
            <View style={[fs.itemIcon, { backgroundColor: '#1e2028' }]}>
              <Text style={{ fontSize: 22 }}>🌍</Text>
            </View>
            <View style={fs.itemInfo}>
              <Text style={[fs.itemLabel, !value && { color: '#fff' }]}>Worldwide</Text>
              <Text style={fs.itemSub}>{sorted.length} events total</Text>
            </View>
            {!value && <Text style={fs.check}>✓</Text>}
          </TouchableOpacity>

          {useGrouped ? (
            // Grouped by region
            grouped.map(([region, flags]) => (
              <View key={region}>
                <Text style={fs.regionHeader}>{region}</Text>
                {flags.map(flag => {
                  const count = sorted.filter(e => e.hostCountry === flag).length;
                  return (
                    <TouchableOpacity
                      key={flag}
                      style={[fs.item, value === flag && { backgroundColor: '#6C47FF18', borderColor: '#6C47FF44' }]}
                      onPress={() => { onSelect(flag); onClose(); }}
                    >
                      <View style={[fs.itemIcon, { backgroundColor: '#1e2028' }]}>
                        <Text style={{ fontSize: 26 }}>{flag}</Text>
                      </View>
                      <View style={fs.itemInfo}>
                        <Text style={[fs.itemLabel, value === flag && { color: '#6C47FF' }]}>
                          {count} event{count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      {value === flag && <Text style={[fs.check, { color: '#6C47FF' }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          ) : (
            // Flat list (5 or fewer)
            countries.map(flag => {
              const count = sorted.filter(e => e.hostCountry === flag).length;
              return (
                <TouchableOpacity
                  key={flag}
                  style={[fs.item, value === flag && { backgroundColor: '#6C47FF18', borderColor: '#6C47FF44' }]}
                  onPress={() => { onSelect(flag); onClose(); }}
                >
                  <View style={[fs.itemIcon, { backgroundColor: '#1e2028' }]}>
                    <Text style={{ fontSize: 26 }}>{flag}</Text>
                  </View>
                  <View style={fs.itemInfo}>
                    <Text style={[fs.itemLabel, value === flag && { color: '#6C47FF' }]}>
                      {count} event{count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {value === flag && <Text style={[fs.check, { color: '#6C47FF' }]}>✓</Text>}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const fs = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:      { backgroundColor: '#0d0f14', borderTopLeftRadius: 32, borderTopRightRadius: 32,
                padding: 24, maxHeight: '75%', borderTopWidth: 1, borderColor: '#1e2028' },
  handle:     { width: 40, height: 4, backgroundColor: '#2a2c34', borderRadius: 2,
                alignSelf: 'center', marginBottom: 22 },
  sheetTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 18 },
  item:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,
                paddingHorizontal: 4, borderRadius: 16, marginBottom: 4,
                borderWidth: 1, borderColor: 'transparent' },
  itemActive: { backgroundColor: '#ffffff0a', borderColor: '#ffffff15' },
  itemIcon:   { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemInfo:   { flex: 1 },
  itemLabel:  { color: '#888', fontSize: 15, fontWeight: '700' },
  itemSub:    { color: '#444', fontSize: 12, marginTop: 2 },
  check:        { color: '#fff', fontSize: 16, fontWeight: '900' },
  regionHeader: { color: '#444', fontSize: 11, fontWeight: '800', textTransform: 'uppercase',
                  letterSpacing: 1, marginTop: 20, marginBottom: 6, paddingHorizontal: 4 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EventsScreen({ navigation, user }) {
  const [events,        setEvents]        = useState([]);
  const [filter,        setFilter]        = useState('All');
  const [search,        setSearch]        = useState('');
  const [countryFilter, setCountryFilter] = useState(null);
  const [liveOnly,         setLiveOnly]         = useState(false);
  const [showVibeFilter,   setShowVibeFilter]   = useState(false);
  const [showCountryFilter,setShowCountryFilter] = useState(false);
  const [showCreate,       setShowCreate]       = useState(false);
  const [selectedEvent,    setSelectedEvent]    = useState(null);
  const [savedCountries,   setSavedCountries]   = useState([]);
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

  // Load countries the user follows (pinned in Bond Feed)
  useEffect(() => {
    AsyncStorage.getItem('bond_saved_countries').then(raw => {
      if (raw) setSavedCountries(JSON.parse(raw));
    });
  }, []);

  // Use real events if any, otherwise demo
  const sourceEvents = events.length > 0 ? events : DEMO_EVENTS;

  const sorted = useMemo(() =>
    [...sourceEvents].sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0)),
  [sourceEvents]);

  // Countries that actually have events (for the world row)
  const availableCountries = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const ev of sorted) {
      if (ev.hostCountry && !seen.has(ev.hostCountry)) {
        seen.add(ev.hostCountry);
        result.push(ev.hostCountry);
      }
    }
    return result;
  }, [sorted]);

  // Live events from countries the user follows
  const followingLiveEvents = useMemo(() =>
    savedCountries.length > 0
      ? sorted.filter(e => isLive(e) && savedCountries.includes(e.hostCountry))
      : [],
  [sorted, savedCountries]);

  // Countries that have following live events (for the strip)
  const followingLiveCountries = useMemo(() =>
    [...new Set(followingLiveEvents.map(e => e.hostCountry))],
  [followingLiveEvents]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (liveOnly)         list = list.filter(e => isLive(e));
    if (filter !== 'All') list = list.filter(e => e.type === filter);
    if (countryFilter)    list = list.filter(e => e.hostCountry === countryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.hostName?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sorted, filter, countryFilter, search, liveOnly]);

  const featuredEvent  = filtered[0] || null;
  const listEvents     = filtered.slice(1);
  const liveEvents     = listEvents.filter(e => isLive(e));
  const upcomingEvents = listEvents.filter(e => !isLive(e));
  const liveCount      = sourceEvents.filter(e => isLive(e)).length;
  const hasFilters     = filter !== 'All' || countryFilter || search.trim() || liveOnly;

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
            <View style={styles.liveHeaderPill}>
              <View style={styles.liveHeaderDot} />
              <Text style={styles.liveHeaderTxt}>{liveCount} live</Text>
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

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, hosts, topics..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Live Around the World toggle ── */}
      <TouchableOpacity
        style={[styles.liveToggle, liveOnly && styles.liveToggleOn]}
        onPress={() => setLiveOnly(v => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.livePulseDot, liveOnly && styles.livePulseDotOn]} />
        <Text style={[styles.liveToggleTxt, liveOnly && styles.liveToggleTxtOn]}>
          {liveOnly ? `${liveCount} Live Now — tap to clear` : 'Live Around the World'}
        </Text>
        <Text style={[styles.liveToggleChev, liveOnly && { color: '#e53935' }]}>
          {liveOnly ? '✕' : '›'}
        </Text>
      </TouchableOpacity>

      {/* ── Countries you follow with live events ── */}
      {followingLiveCountries.length > 0 && (
        <View style={styles.followingStrip}>
          <Text style={styles.followingStripLabel}>🌍 Following Live</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
            {followingLiveCountries.map(flag => {
              const count = followingLiveEvents.filter(e => e.hostCountry === flag).length;
              const isActive = countryFilter === flag;
              return (
                <TouchableOpacity
                  key={flag}
                  style={[styles.followingPill, isActive && styles.followingPillOn]}
                  onPress={() => setCountryFilter(isActive ? null : flag)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.followingPillFlag}>{flag}</Text>
                  <View style={styles.followingPillDot} />
                  <Text style={[styles.followingPillCount, isActive && { color: '#fff' }]}>{count} live</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Vibe + Country filter buttons ── */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter !== 'All' && { borderColor: (TYPE_META[filter]?.color || '#6C47FF') + '88', backgroundColor: (TYPE_META[filter]?.color || '#6C47FF') + '18' }]}
          onPress={() => setShowVibeFilter(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterBtnIcon}>
            {filter !== 'All' ? TYPE_META[filter]?.icon : '🎭'}
          </Text>
          <View style={styles.filterBtnText}>
            <Text style={styles.filterBtnLabel}>Vibe</Text>
            <Text style={[styles.filterBtnValue, filter !== 'All' && { color: TYPE_META[filter]?.color }]}>
              {filter !== 'All' ? TYPE_META[filter]?.label : 'All types'}
            </Text>
          </View>
          <Text style={styles.filterBtnChev}>▾</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, countryFilter && { borderColor: '#6C47FF88', backgroundColor: '#6C47FF18' }]}
          onPress={() => setShowCountryFilter(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterBtnIcon}>{countryFilter || '🌍'}</Text>
          <View style={styles.filterBtnText}>
            <Text style={styles.filterBtnLabel}>Country</Text>
            <Text style={[styles.filterBtnValue, countryFilter && { color: '#6C47FF' }]}>
              {countryFilter
                ? `${sorted.filter(e => e.hostCountry === countryFilter).length} events`
                : 'Worldwide'}
            </Text>
          </View>
          <Text style={styles.filterBtnChev}>▾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Live in countries you follow ── */}
        {followingLiveEvents.length > 0 && !countryFilter && (
          <>
            <SectionLabel icon="🌍" title="Live in Countries You Follow" count={followingLiveEvents.length} />
            <View style={styles.listBlock}>
              {followingLiveEvents.map((item, i) => (
                <EventCard
                  key={item.id} item={item} index={i}
                  onPress={ev => setSelectedEvent(ev)}
                  onHostPress={() => navigation.navigate('Profile', { profileUser: { userId: item.hostId, username: item.hostName, country: item.hostCountry } })}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Featured ── */}
        {featuredEvent && (
          <>
            <SectionLabel icon="⭐" title="Featured" count={null} />
            <FeaturedCard
              item={featuredEvent}
              onPress={() => setSelectedEvent(featuredEvent)}
              onHostPress={() => navigation.navigate('Profile', { profileUser: { userId: featuredEvent.hostId, username: featuredEvent.hostName, country: featuredEvent.hostCountry } })}
            />
          </>
        )}

        {/* ── Live now ── */}
        {liveEvents.length > 0 && (
          <>
            <SectionLabel icon="🔴" title="Happening Now" count={liveEvents.length} />
            <View style={styles.listBlock}>
              {liveEvents.map((item, i) => (
                <EventCard
                  key={item.id} item={item} index={i}
                  onPress={ev => setSelectedEvent(ev)}
                  onHostPress={() => navigation.navigate('Profile', { profileUser: { userId: item.hostId, username: item.hostName, country: item.hostCountry } })}
                />
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
                <EventCard
                  key={item.id} item={item} index={i}
                  onPress={ev => setSelectedEvent(ev)}
                  onHostPress={() => navigation.navigate('Profile', { profileUser: { userId: item.hostId, username: item.hostName, country: item.hostCountry } })}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Empty ── */}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 52 }}>{hasFilters ? '🔍' : '🎉'}</Text>
            <Text style={styles.emptyTitle}>{hasFilters ? 'No matches' : 'No events yet'}</Text>
            <Text style={styles.emptySub}>
              {hasFilters
                ? 'Try a different search, type, or country.'
                : isPro
                ? 'Create the first event and bring people together!'
                : 'Check back soon or upgrade to host your own.'}
            </Text>
            {hasFilters && (
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => { setSearch(''); setFilter('All'); setCountryFilter(null); setLiveOnly(false); }}
              >
                <Text style={styles.clearFiltersTxt}>Clear all filters</Text>
              </TouchableOpacity>
            )}
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
        navigation={navigation}
      />
      <VibeSheet
        visible={showVibeFilter}
        value={filter}
        onSelect={v => setFilter(v)}
        onClose={() => setShowVibeFilter(false)}
      />
      <CountrySheet
        visible={showCountryFilter}
        value={countryFilter}
        countries={availableCountries}
        sorted={sorted}
        onSelect={v => setCountryFilter(v)}
        onClose={() => setShowCountryFilter(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#050507' },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerCenter:   { flex: 1, alignItems: 'center' },
  liveHeaderPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5,
                    backgroundColor: '#e5393520', borderRadius: 10, paddingHorizontal: 10,
                    paddingVertical: 4, borderWidth: 1, borderColor: '#e5393540' },
  liveHeaderDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e53935' },
  liveHeaderTxt:  { color: '#e53935', fontSize: 11, fontWeight: '700' },
  backBtn:        { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0d0f14',
                    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2028' },
  backIcon:       { color: '#fff', fontSize: 26, lineHeight: 30, marginTop: -2 },

  // Filter row (Vibe + Country buttons)
  filterRow:      { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  filterBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: '#0d0f14', borderRadius: 16, paddingHorizontal: 14,
                    paddingVertical: 13, borderWidth: 1, borderColor: '#1e2028' },
  filterBtnIcon:  { fontSize: 20 },
  filterBtnText:  { flex: 1 },
  filterBtnLabel: { color: '#555', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  filterBtnValue: { color: '#ccc', fontSize: 13, fontWeight: '700', marginTop: 1 },
  filterBtnChev:  { color: '#444', fontSize: 14 },

  // Search
  searchWrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14,
                  backgroundColor: '#0d0f14', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
                  borderWidth: 1, borderColor: '#1e2028', gap: 10 },
  searchIcon:   { fontSize: 15 },
  searchInput:  { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500', padding: 0 },
  searchClear:  { color: '#444', fontSize: 13, fontWeight: '700', paddingLeft: 4 },

  // Country pills
  countryRow:   { paddingHorizontal: 16, gap: 8, paddingBottom: 12, paddingTop: 4 },
  countryPill:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12,
                  paddingVertical: 8, borderRadius: 20, backgroundColor: '#0d0f14',
                  borderWidth: 1, borderColor: '#1e2028' },
  countryPillActive: { backgroundColor: '#6C47FF22', borderColor: '#6C47FF66' },
  countryPillFlag:   { fontSize: 16 },
  countryPillTxt:    { color: '#888', fontSize: 12, fontWeight: '700' },
  countryPillTxtActive: { color: '#6C47FF' },

  // Clear filters
  clearFiltersBtn: { marginTop: 8, backgroundColor: '#111318', borderRadius: 14,
                     paddingHorizontal: 22, paddingVertical: 11, borderWidth: 1, borderColor: '#1e2028' },
  clearFiltersTxt: { color: '#6C47FF', fontSize: 14, fontWeight: '700' },
  title:        { color: '#fff', fontSize: 26, fontWeight: '900' },

  // Live Around the World toggle
  liveToggle:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16,
                     marginBottom: 14, backgroundColor: '#0d0f14', borderRadius: 16,
                     paddingHorizontal: 16, paddingVertical: 15,
                     borderWidth: 1, borderColor: '#e5393530' },
  liveToggleOn:    { backgroundColor: '#1a0505', borderColor: '#e5393580' },
  livePulseDot:    { width: 9, height: 9, borderRadius: 5, backgroundColor: '#e53935' },
  livePulseDotOn:  { backgroundColor: '#ff1a1a' },
  liveToggleTxt:   { flex: 1, color: '#888', fontSize: 14, fontWeight: '700' },
  liveToggleTxtOn: { color: '#e53935' },
  liveToggleChev:  { color: '#444', fontSize: 18, fontWeight: '300' },
  createBtn:    { borderRadius: 14, overflow: 'hidden' },
  createGrad:   { paddingHorizontal: 16, paddingVertical: 9 },
  createText:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  proHint:      { backgroundColor: '#FFB70018', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
                  borderWidth: 1, borderColor: '#FFB70033' },
  proHintTxt:   { color: '#FFB700', fontSize: 13, fontWeight: '800' },

  filtersRow:   { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },

  scroll:       { paddingBottom: 60 },
  listBlock:    { paddingHorizontal: 20, marginBottom: 8 },

  empty:        { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle:   { color: '#fff', fontSize: 22, fontWeight: '800' },
  emptySub:     { color: '#444', fontSize: 14, textAlign: 'center', lineHeight: 21 },

  proCard:      { marginHorizontal: 20, marginTop: 24, borderRadius: 22, overflow: 'hidden' },
  proGrad:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18,
                  borderWidth: 1, borderColor: '#FFB70022', borderRadius: 22 },
  proTitle:     { color: '#FFB700', fontSize: 14, fontWeight: '800' },
  proSub:       { color: '#FFB70066', fontSize: 12, marginTop: 3, lineHeight: 17 },
  proBadge:     { backgroundColor: '#FFB70022', borderRadius: 10, paddingHorizontal: 10,
                  paddingVertical: 5, borderWidth: 1, borderColor: '#FFB70055' },
  proBadgeTxt:  { color: '#FFB700', fontSize: 12, fontWeight: '800' },

  // Following live strip
  followingStrip:      { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  followingStripLabel: { color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                         letterSpacing: 0.8, marginBottom: 6 },
  followingPill:       { flexDirection: 'row', alignItems: 'center', gap: 6,
                         backgroundColor: '#161820', borderRadius: 20, paddingHorizontal: 12,
                         paddingVertical: 7, borderWidth: 1, borderColor: '#e5393530' },
  followingPillOn:     { backgroundColor: '#e5393520', borderColor: '#e53935' },
  followingPillFlag:   { fontSize: 18 },
  followingPillDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e53935' },
  followingPillCount:  { color: '#e53935', fontSize: 12, fontWeight: '700' },
});
