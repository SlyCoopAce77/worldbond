import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, FlatList, RefreshControl,
  ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { WorldWordmark, WorldMark } from '../components/BondLogo';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { getSocket } from '../services/socket';
import { getAccessToken } from '../services/authApi';
import { stringToColor } from '../utils/apiUtils';
import { SERVER_URL } from '../services/socket';
import { useNotifications } from '../context/NotificationsContext';
import { usePremium } from '../context/PremiumContext';
import { useStreak } from '../context/StreakContext';
import { BOND_MONUMENTS, DEMO_STAMPS } from '../context/WalletContext';
import { getCountryFlag } from '../utils/countryUtils';

const { width } = Dimensions.get('window');
const CARD_W = 160;

// ─── Brand colors ─────────────────────────────────────────────────────────────
const BOND_AMBER = '#FF0080';   // 1-of-1 — not Discord/Telegram/WhatsApp

// ─── Tier visual themes ───────────────────────────────────────────────────────
const HERO_THEMES = {
  free: {
    grad:       ['#020202', '#040404', '#020202'],
    nodeColor:  BOND_AMBER,
    badge:      null,
    greetLabel: null,
  },
  plus: {
    grad:       ['#020202', '#040404', '#020202'],
    nodeColor:  BOND_AMBER,
    badge:      { label: 'WorldBond Plus', color: '#F0A420', bg: '#FF008020', border: '#FF008045' },
    greetLabel: null,
  },
  pro: {
    grad:       ['#060400', '#0a0700', '#050300'],
    nodeColor:  '#FFB700',
    badge:      { label: 'WorldBond Pro',  color: '#FFB700', bg: '#FFB70018', border: '#FFB70040' },
    greetLabel: null,
  },
};

// ─── Static star field for hero header ────────────────────────────────────────
const HERO_STARS = [...Array(38)].map(() => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 0.9 + 0.4,
  o: Math.random() * 0.4 + 0.15,
}));

// ─── Constellation node positions (% of hero w/h) ────────────────────────────
// Each node: [x%, y%], size in px. Edges connect node indices.
const C_NODES = [
  [0.08, 0.12], [0.42, 0.06], [0.78, 0.18], [0.92, 0.52],
  [0.72, 0.85], [0.38, 0.90], [0.12, 0.68], [0.55, 0.48],
];
const C_EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[1,7],[7,3],[7,5]];

// ─── Helper: line between two absolute points ─────────────────────────────────
function AbsLine({ x1, y1, x2, y2, color, opacity = 0.12, thickness = 1 }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return (
    <View pointerEvents="none" style={{
      position: 'absolute',
      width: len, height: thickness,
      backgroundColor: color, opacity,
      left: (x1 + x2) / 2 - len / 2,
      top:  (y1 + y2) / 2 - thickness / 2,
      transform: [{ rotate: `${angle}deg` }],
    }} />
  );
}

// ─── Constellation background ─────────────────────────────────────────────────
// Subtle network of dots + lines, one hub node gently pulses.
function ConstellationField({ heroW, heroH, color }) {
  const hubFade = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(hubFade, { toValue: 0.65, duration: 2800, useNativeDriver: true }),
      Animated.timing(hubFade, { toValue: 0.35, duration: 2800, useNativeDriver: true }),
    ])).start();
  }, []);

  const pts = C_NODES.map(([px, py]) => ({ x: px * heroW, y: py * heroH }));
  const hubIdx = 7; // central node pulses

  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: heroW, height: heroH }}>
      {C_EDGES.map(([a, b], i) => (
        <AbsLine key={i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} color={color} opacity={0.11} />
      ))}
      {pts.map((p, i) => {
        const isHub = i === hubIdx;
        const dotSize = isHub ? 5 : 3;
        if (isHub) {
          return (
            <Animated.View key={i} style={{
              position: 'absolute', width: dotSize, height: dotSize,
              borderRadius: dotSize / 2, backgroundColor: color,
              left: p.x - dotSize / 2, top: p.y - dotSize / 2,
              opacity: hubFade,
            }} />
          );
        }
        return (
          <View key={i} style={{
            position: 'absolute', width: dotSize, height: dotSize,
            borderRadius: dotSize / 2, backgroundColor: color,
            left: p.x - dotSize / 2, top: p.y - dotSize / 2,
            opacity: 0.22,
          }} />
        );
      })}
    </View>
  );
}

// ─── Home logo mark — stacked layout matching the landing screen top logo ────
const HOME_MARK_SIZE = 42;
const HOME_GLOW_R    = 14;
// eye Y is ~46% down the mark
const HOME_EYE_Y     = HOME_MARK_SIZE * 0.46;

function HomeLogoMark() {
  const breathe = useRef(new Animated.Value(1)).current;
  const glow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a1 = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1.07, duration: 4500, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 1.00, duration: 4500, useNativeDriver: true }),
    ]));
    const a2 = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 2400, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 2400, useNativeDriver: true }),
    ]));
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.28] });

  return (
    <View style={{ alignItems: 'center', gap: 0 }}>
      <View style={{ width: HOME_MARK_SIZE, height: HOME_MARK_SIZE }}>
        <Animated.View style={{
          position: 'absolute',
          width: HOME_GLOW_R * 2, height: HOME_GLOW_R * 2, borderRadius: HOME_GLOW_R,
          backgroundColor: '#FF0080',
          left: HOME_MARK_SIZE / 2 - HOME_GLOW_R,
          top:  HOME_EYE_Y - HOME_GLOW_R,
          opacity: glowOpacity,
        }} />
        <Animated.View style={{ transform: [{ scale: breathe }] }}>
          <WorldMark size={HOME_MARK_SIZE} color="#fff" bondColor="#FF0080" />
        </Animated.View>
      </View>
      <Text style={{ color: '#fff', opacity: 0.65, fontSize: 7, fontWeight: '600', letterSpacing: 4.5, marginTop: 4 }}>WORLD</Text>
      <Text style={{ color: '#FF0080', fontSize: 14, fontWeight: '900', letterSpacing: -0.5, marginTop: -1 }}>BOND</Text>
    </View>
  );
}

// ─── Tier quick-tile configs ──────────────────────────────────────────────────
const QUICK_TILES = {
  free: [
    { icon: '✨', label: 'Matches',  sub: 'Daily picks for you',  grad: ['#031418','#041c22'], accent: '#FF0080', nav: 'Bond'     },
    { icon: '💬', label: 'Chats',    sub: 'Your conversations',   grad: ['#041226','#020b1a'], accent: '#4fc3f7', nav: 'Groups'   },
    { icon: '🎉', label: 'Events',   sub: 'Go live or join',      grad: ['#1a0c04','#100804'], accent: '#ff9800', nav: 'Events'   },
    { icon: '🌍', label: 'Explore',  sub: 'Discover the world',   grad: ['#031a10','#011008'], accent: '#57f287', nav: 'Discover' },
  ],
  plus: [
    { icon: '💎', label: 'Bond+',       sub: 'Priority matches',    grad: ['#031418','#041c22'], accent: '#FF0080', nav: 'Bond'     },
    { icon: '💬', label: 'Chats',       sub: 'Message anyone',      grad: ['#031418','#041c22'], accent: '#F0A420', nav: 'Groups'   },
    { icon: '🎉', label: 'Events',      sub: 'Unlimited joins',     grad: ['#1a0c04','#100804'], accent: '#ff9800', nav: 'Events'   },
    { icon: '👁',  label: 'Who Viewed', sub: 'See who looked',      grad: ['#031418','#041c22'], accent: '#67e8f9', nav: 'Me'       },
  ],
  pro: [
    { icon: '⭐', label: 'Priority Bond', sub: 'Top of every list',   grad: ['#1a0e00','#120900'], accent: '#FFB700', nav: 'Bond'     },
    { icon: '💬', label: 'Chats',         sub: 'Priority inbox',      grad: ['#1a1100','#100b00'], accent: '#fbbf24', nav: 'Groups'   },
    { icon: '📡', label: 'Go Live',       sub: 'Create your stream',  grad: ['#1a0000','#100000'], accent: '#ef4444', nav: 'Events'   },
    { icon: '🌐', label: 'Explore',       sub: 'Full world access',   grad: ['#031a10','#011008'], accent: '#57f287', nav: 'Discover' },
  ],
};

// ─── Demo data for tier-locked sections ──────────────────────────────────────
const DEMO_VIEWS = [
  { id: 'v1', username: 'Yuki_Tokyo',  country: '🇯🇵', time: '2 min ago',  interest: '❤️' },
  { id: 'v2', username: 'Carlos_MX',   country: '🇲🇽', time: '18 min ago', interest: '🤝' },
  { id: 'v3', username: 'Fatima_EG',   country: '🇪🇬', time: '1 hr ago',   interest: '✈️' },
  { id: 'v4', username: 'Priya_IN',    country: '🇮🇳', time: '3 hrs ago',  interest: '💬' },
];

const DEMO_PRIORITY_MATCHES = [
  { id: 'pm1', name: 'JiMin',  country: '🇰🇷', score: 94, interest: '❤️' },
  { id: 'pm2', name: 'Amara',  country: '🇳🇬', score: 89, interest: '🤝' },
  { id: 'pm3', name: 'Sophie', country: '🇫🇷', score: 86, interest: '✈️' },
];

const DEMO_TOP_EVENTS = [
  { id: 'dt1', title: 'K-Drama Watch Party 🍜', type: 'watch_party', attendees: { length: 312 }, hostName: 'JiMin',  hostCountry: 'KR' },
  { id: 'dt2', title: 'Global English Practice', type: 'language',    attendees: { length: 247 }, hostName: 'Sarah',  hostCountry: 'GB' },
  { id: 'dt3', title: 'Friday Game Night 🎮',    type: 'game_night',  attendees: { length: 189 }, hostName: 'Carlos', hostCountry: 'MX' },
  { id: 'dt4', title: 'African Cuisine Cook-Along', type: 'cooking',  attendees: { length: 134 }, hostName: 'Amara',  hostCountry: 'NG' },
  { id: 'dt5', title: 'Meditation & Mindfulness',   type: 'just_chill',attendees: { length: 98  }, hostName: 'Aiko',   hostCountry: 'JP' },
];

const EV_TYPE = {
  watch_party: { icon: '🎬', color: '#e91e63' }, game_night: { icon: '🎮', color: '#7b5ea7' },
  cooking:     { icon: '🍳', color: '#ff9800' }, study:      { icon: '📚', color: '#2196f3' },
  music:       { icon: '🎵', color: '#f06292' }, language:   { icon: '🗣️', color: '#26c6da' },
  travel_talk: { icon: '✈️', color: '#42a5f5' }, workout:    { icon: '💪', color: '#ff7043' },
  art:         { icon: '🎨', color: '#ab47bc' }, just_chill: { icon: '😎', color: '#57f287' },
};

const DEMO_STATS = { countries: 147, live: 23, bonds: 1284, views: 14, rank: 7 };

const CONNECTION_TYPES = {
  dating:     { emoji: '❤️', color: '#e91e63' }, friendship: { emoji: '🤝', color: '#2196f3' },
  travel:     { emoji: '✈️', color: '#ff9800' }, language:   { emoji: '💬', color: '#9c27b0' },
  mentorship: { emoji: '🎓', color: '#4caf50' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function compatColor(score) {
  return score >= 75 ? '#57f287' : score >= 50 ? '#fee75c' : '#f04747';
}


// ─── Bond Streak Badge — 1-of-1 footprint, Plus/Pro only ─────────────────────
// Evolves through 6 tiers as the streak grows: Spark → Flame → Blaze → Torch → Inferno → Eternal
// The badge is unique to each user's streak history — no two are alike.
function BondStreakBadge({ tier, primary, milestones, longest, onPress }) {
  const glow = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  if (!tier) return null;

  const nextTierDays = (() => {
    const tiers = [1, 7, 30, 90, 180, 365];
    const next = tiers.find(d => d > (primary.value * (primary.unit.includes('YR') ? 365 : primary.unit.includes('MO') ? 30 : primary.unit.includes('WK') ? 7 : 1)));
    return next;
  })();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={sk.wrap}>
      <LinearGradient colors={['#0d0f1a', '#080a12']} style={sk.card}>

        {/* Tier gradient bar at top */}
        <LinearGradient colors={tier.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sk.topBar}>
          <View style={sk.topLeft}>
            <Text style={[sk.gradeName, { color: tier.color }]}>{tier.grade}</Text>
            <Text style={sk.tierName}>{tier.name.toUpperCase()}</Text>
          </View>
          {/* Geometric mark — three stacked bars tapering upward like a flame */}
          <View style={sk.flameMark}>
            <View style={[sk.flameBar, { width: 4,  height: 4,  backgroundColor: tier.color, opacity: 0.9, borderRadius: 2 }]} />
            <View style={[sk.flameBar, { width: 8,  height: 4,  backgroundColor: tier.color, opacity: 0.7, borderRadius: 2 }]} />
            <View style={[sk.flameBar, { width: 14, height: 4,  backgroundColor: tier.color, opacity: 0.5, borderRadius: 2 }]} />
            <View style={[sk.flameBar, { width: 18, height: 4,  backgroundColor: tier.color, opacity: 0.3, borderRadius: 2 }]} />
          </View>
        </LinearGradient>

        {/* Main content */}
        <View style={sk.body}>
          {/* Left: big streak number */}
          <View style={sk.countBlock}>
            <Animated.View style={{ opacity: glow }}>
              <Text style={[sk.countNum, { color: tier.color }]}>{primary.value}</Text>
            </Animated.View>
            <Text style={[sk.countUnit, { color: tier.color + 'aa' }]}>{primary.unit}</Text>
            <Text style={sk.countLabel}>CURRENT STREAK</Text>
          </View>

          {/* Divider */}
          <View style={[sk.divider, { backgroundColor: tier.color + '25' }]} />

          {/* Right: milestone progress */}
          <View style={sk.milestonesBlock}>
            {milestones.map((m, i) => (
              <View key={i} style={sk.milestoneRow}>
                {/* Node dot */}
                <View style={[sk.msDot, m.done && { backgroundColor: tier.color, shadowColor: tier.color, shadowRadius: 4, shadowOpacity: 0.6 }]} />
                {/* Line connecting to next (except last) */}
                {i < milestones.length - 1 && (
                  <View style={[sk.msLine, m.done && { backgroundColor: tier.color + '60' }]} />
                )}
                <View style={sk.msText}>
                  <Text style={[sk.msVal, { color: m.done ? tier.color : '#2a2c3a' }]}>{m.display}</Text>
                  <Text style={[sk.msLbl, { color: m.done ? '#555' : '#1e2030' }]}>{m.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer: longest + 1-of-1 stamp */}
        <View style={[sk.footer, { borderTopColor: tier.color + '18' }]}>
          <Text style={sk.footerBest}>Best  <Text style={{ color: tier.color }}>{longest} days</Text></Text>
          <View style={[sk.stamp, { borderColor: tier.color + '50' }]}>
            <Text style={[sk.stampTxt, { color: tier.color + 'aa' }]}>1 OF 1 FOOTPRINT</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const sk = StyleSheet.create({
  wrap: { marginHorizontal: 0 },
  card: { borderRadius: 22, borderWidth: 1, borderColor: '#1a1d2e', overflow: 'hidden' },

  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topLeft:   { gap: 1 },
  gradeName: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  tierName:  { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  // Geometric flame mark (tapering bars)
  flameMark: { alignItems: 'flex-end', gap: 3 },
  flameBar:  {},

  body:       { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 20, gap: 0 },
  divider:    { width: 1, marginHorizontal: 16, alignSelf: 'stretch' },

  // Left: streak count
  countBlock: { flex: 1, gap: 2 },
  countNum:   { fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 58 },
  countUnit:  { fontSize: 16, fontWeight: '800', letterSpacing: 1, marginTop: -4 },
  countLabel: { color: '#333', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 6 },

  // Right: milestones
  milestonesBlock: { flex: 1, gap: 0, paddingTop: 2 },
  milestoneRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  msDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1e2030', borderWidth: 1, borderColor: '#2a2c3a', marginTop: 2, flexShrink: 0 },
  msLine:          { position: 'absolute', left: 3.5, top: 10, width: 1, height: 12, backgroundColor: '#1e2030' },
  msText:          { marginLeft: 10, gap: 0 },
  msVal:           { fontSize: 16, fontWeight: '900', lineHeight: 18 },
  msLbl:           { fontSize: 8, fontWeight: '700', letterSpacing: 1.2, marginTop: 1 },

  footer:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  footerBest:{ color: '#333', fontSize: 11, fontWeight: '600' },
  stamp:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderStyle: 'dashed' },
  stampTxt:  { fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
});

// ─── Story ring ───────────────────────────────────────────────────────────────
function StoryRing({ user, onPress }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const color = stringToColor(user.username);
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <TouchableOpacity style={st.wrap} onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[st.ring, { transform: [{ scale: pulse }] }]}>
        <LinearGradient colors={['#FF0080', '#57f287']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.gradient}>
          <View style={[st.avatar, { backgroundColor: color }]}>
            {user.photo_url
              ? <Image source={{ uri: user.photo_url }} style={st.avatarImg} />
              : <Text style={st.avatarText}>{user.username[0]?.toUpperCase()}</Text>}
          </View>
        </LinearGradient>
      </Animated.View>
      {user.mood ? <Text style={st.mood}>{user.mood}</Text> : null}
      <Text style={st.name} numberOfLines={1}>{user.username.split(' ')[0]}</Text>
      <Text style={st.flag}>{user.country?.split(' ')[0]}</Text>
    </TouchableOpacity>
  );
}
const st = StyleSheet.create({
  wrap:       { alignItems: 'center', gap: 5, width: 68 },
  ring:       { padding: 2.5, borderRadius: 32 },
  gradient:   { padding: 2.5, borderRadius: 30 },
  avatar:     { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#000' },
  avatarImg:  { width: '100%', height: '100%', borderRadius: 24 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  mood:       { fontSize: 14 },
  name:       { color: '#ddd', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  flag:       { color: '#555', fontSize: 10, textAlign: 'center' },
});

// ─── Match card ───────────────────────────────────────────────────────────────
function MatchCard({ match, onPress, index }) {
  const score   = Math.round(match.compatibility_score || 0);
  const color   = compatColor(score);
  const ct      = CONNECTION_TYPES[(match.connection_types || [])[0]] || CONNECTION_TYPES.friendship;
  const name    = match.display_name || 'Someone';
  const avatarC = stringToColor(name);
  const slide   = useRef(new Animated.Value(40)).current;
  const fade    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 50, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <TouchableOpacity style={mc.card} onPress={onPress} activeOpacity={0.88}>
        {match.photo_url
          ? <Image source={{ uri: match.photo_url }} style={mc.photo} />
          : <LinearGradient colors={[avatarC, avatarC + '88']} style={mc.photo}><Text style={mc.initials}>{name[0]?.toUpperCase()}</Text></LinearGradient>}
        <LinearGradient colors={['transparent', 'transparent', '#000000cc']} style={mc.overlay} />
        <View style={[mc.score, { borderColor: color + '88', backgroundColor: '#000000aa' }]}>
          <Text style={[mc.scoreTxt, { color }]}>{score}%</Text>
        </View>
        <View style={mc.ct}>
          <WorldMark size={24} color="#ffffff" bondColor="#FF0080" />
        </View>
        <View style={mc.info}>
          <View style={mc.nameRow}>
            {match.country ? <Text style={mc.flag}>{getCountryFlag(match.country)}</Text> : null}
            <Text style={mc.name} numberOfLines={1}>{name}{match.age ? `, ${match.age}` : ''}</Text>
          </View>
          <Text style={mc.loc} numberOfLines={1}>{[match.city, match.country].filter(Boolean).join(', ')}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const mc = StyleSheet.create({
  card:     { width: CARD_W, height: 230, borderRadius: 22, overflow: 'hidden', marginRight: 12, backgroundColor: '#1C1F23' },
  photo:    { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontSize: 52, fontWeight: '800', opacity: 0.8 },
  overlay:  { position: 'absolute', width: '100%', height: '100%' },
  score:    { position: 'absolute', top: 10, left: 10, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  scoreTxt: { fontSize: 12, fontWeight: '800' },
  ct:       { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000066' },
  info:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, gap: 2 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flag:     { fontSize: 14 },
  name:     { color: '#fff', fontSize: 15, fontWeight: '800', flex: 1 },
  loc:      { color: '#ffffff99', fontSize: 11 },
});

// ─── Plus: Who Viewed You row ─────────────────────────────────────────────────
function ViewerRow({ item, accentColor, onPress }) {
  const ac = stringToColor(item.username);
  return (
    <TouchableOpacity style={[vw.row, { borderColor: accentColor + '20' }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[vw.avatar, { backgroundColor: ac }]}>
        <Text style={vw.avatarTxt}>{item.username[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={vw.name}>{item.username}</Text>
          <Text style={vw.country}>{item.country}</Text>
        </View>
        <Text style={vw.time}>{item.time}</Text>
      </View>
      <View style={[vw.interestBadge, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
        <WorldMark size={24} color={accentColor} bondColor="#FF0080" />
      </View>
      <Text style={[vw.arrow, { color: accentColor }]}>›</Text>
    </TouchableOpacity>
  );
}
const vw = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  avatar:       { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { color: '#fff', fontWeight: '800', fontSize: 16 },
  name:         { color: '#fff', fontSize: 14, fontWeight: '700' },
  country:      { fontSize: 14 },
  time:         { color: '#555', fontSize: 11 },
  interestBadge:{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  arrow:        { fontSize: 20, fontWeight: '300' },
});

// ─── Pro: Priority match row ──────────────────────────────────────────────────
function PriorityMatchRow({ item, onPress }) {
  const ac = stringToColor(item.name);
  return (
    <TouchableOpacity style={pm.row} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['#FFB70022', '#FFB70008']} style={pm.grad}>
        <View style={pm.left}>
          {item.photo_url
            ? <Image source={{ uri: item.photo_url }} style={pm.avatar} />
            : <View style={[pm.avatarFallback, { backgroundColor: ac }]}>
                <Text style={pm.avatarInitial}>{item.name[0]?.toUpperCase()}</Text>
              </View>}
          <Text style={pm.country}>{item.country}</Text>
          <Text style={pm.name}>{item.name}</Text>
        </View>
        <View style={pm.right}>
          <WorldMark size={28} color="#FFB700" bondColor="#FF0080" />
          <Text style={pm.priorityLabel}>PRIORITY</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const pm = StyleSheet.create({
  row:           { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#FFB70030' },
  grad:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  left:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:        { width: 44, height: 44, borderRadius: 22 },
  avatarFallback:{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '800' },
  country:       { fontSize: 20 },
  name:          { color: '#fff', fontSize: 15, fontWeight: '800' },
  right:         { alignItems: 'flex-end', gap: 6 },
  priorityLabel: { color: '#FFB700', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ title, sub, action, onAction, accentColor }) {
  const accent = accentColor || '#FF0080';
  return (
    <View style={sh.row}>
      <View style={{ flex: 1 }}>
        <Text style={sh.title}>{title}</Text>
        {sub ? <Text style={sh.sub}>{sub}</Text> : null}
      </View>
      {action ? (
        <TouchableOpacity onPress={onAction} style={[sh.actionBtn, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
          <Text style={[sh.actionText, { color: accent }]}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const sh = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:     { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, color: '#fff' },
  sub:       { fontSize: 12, marginTop: 2, color: '#555' },
  actionBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  actionText:{ fontSize: 12, fontWeight: '700' },
});

// ─── Quick action card ────────────────────────────────────────────────────────
function QuickCard({ icon, label, sub, grad, accent, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  function press() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    onPress();
  }
  return (
    <Animated.View style={[qc.wrap, { transform: [{ scale }] }]}>
      <TouchableOpacity onPress={press} activeOpacity={0.9} style={{ flex: 1 }}>
        <LinearGradient colors={grad} style={qc.card}>
          <View style={[qc.iconCircle, { backgroundColor: accent + '30', borderColor: accent + '55' }]}>
            <Text style={qc.icon}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={qc.label}>{label}</Text>
            <Text style={qc.sub} numberOfLines={1}>{sub}</Text>
          </View>
          <Text style={[qc.arrow, { color: accent }]}>›</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
const qc = StyleSheet.create({
  wrap:       { flex: 1 },
  card:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#ffffff08', minHeight: 76 },
  iconCircle: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  icon:       { fontSize: 22 },
  label:      { color: '#fff', fontSize: 15, fontWeight: '800' },
  sub:        { color: '#ffffff55', fontSize: 11, marginTop: 2 },
  arrow:      { fontSize: 22, fontWeight: '300', marginLeft: -4, flexShrink: 0 },
});

// ─── Pro: World Footprint Panel — replaces 4-tile quick grid ─────────────────
function ProFootprintPanel({ navigation }) {
  const glow      = useRef(new Animated.Value(0.04)).current;
  const livePulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 0.10, duration: 2800, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.04, duration: 2800, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(livePulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 0, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);

  const featured   = BOND_MONUMENTS.find(m => !m.holder) || BOND_MONUMENTS[0];
  const stampFlags = Object.keys(DEMO_STAMPS).slice(0, 4);
  const extraStamps = Math.max(0, Object.keys(DEMO_STAMPS).length - 4);

  return (
    <View style={fp.wrap}>

      {/* ── Header ── */}
      <View style={fp.head}>
        <View>
          <Text style={fp.headLabel}>WORLD FOOTPRINT</Text>
          <Text style={fp.headSub}>1-of-1 identity across 195 countries</Text>
        </View>
        <View style={fp.goldTag}><Text style={fp.goldTagTxt}>GOLD</Text></View>
      </View>

      {/* ── Bond Monument Feature Card ── */}
      <TouchableOpacity onPress={() => navigation.navigate('MonumentChallenge', { monument: featured })} activeOpacity={0.88} style={fp.monumentCard}>
        <LinearGradient colors={['#1a1200', '#100c00', '#080600']} style={fp.monumentGrad}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFB700', opacity: glow, borderRadius: 16 }]} />
          <LinearGradient colors={['#FFB700', '#FF8C00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={fp.goldBar} />
          <View style={fp.monumentBody}>
            <View style={fp.monumentLeft}>
              <Text style={fp.monumentIcon}>{featured.icon}</Text>
              <View style={fp.monumentMeta}>
                <Text style={fp.monumentName}>{featured.name}</Text>
                <Text style={fp.monumentLocation}>{featured.location}</Text>
              </View>
            </View>
            <View style={[fp.claimBadge, featured.holder ? fp.claimBadgeHeld : fp.claimBadgeFree]}>
              <Text style={[fp.claimTxt, { color: featured.holder ? '#ef4444' : '#57f287' }]}>
                {featured.holder ? 'HELD' : 'CLAIM'}
              </Text>
            </View>
          </View>
          <View style={fp.monumentFooter}>
            <Text style={fp.monumentCountry}>{featured.country}</Text>
            <Text style={fp.oneOfOne}>1 OF 1</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Country Stamps ── */}
      <TouchableOpacity onPress={() => navigation.navigate('CountryStampChallenge', { stamp: { flag: stampFlags[0], ...(DEMO_STAMPS[stampFlags[0]] || {}) } })} activeOpacity={0.88} style={fp.stampsCard}>
        <Text style={fp.stampsTitle}>COUNTRY STAMPS</Text>
        <View style={fp.stampsRow}>
          {stampFlags.map((flag, i) => (
            <View key={i} style={fp.stamp}>
              <Text style={fp.stampFlag}>{flag}</Text>
            </View>
          ))}
          {extraStamps > 0 && (
            <View style={[fp.stamp, fp.stampMore]}>
              <Text style={fp.stampMoreTxt}>+{extraStamps}</Text>
            </View>
          )}
        </View>
        <Text style={fp.stampsArrow}>View your full footprint →</Text>
      </TouchableOpacity>

      {/* ── Go Live Portal ── */}
      <TouchableOpacity onPress={() => navigation.navigate('Events')} activeOpacity={0.88} style={fp.livePortal}>
        <LinearGradient colors={['#1a0000', '#120000', '#080000']} style={fp.liveGrad}>

          {/* Pulsing red ambient glow */}
          <Animated.View style={[StyleSheet.absoluteFill, {
            backgroundColor: '#ef4444',
            borderRadius: 16,
            opacity: livePulse.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.10] }),
          }]} />

          {/* Live indicator row */}
          <View style={fp.liveTopRow}>
            <Animated.View style={[fp.liveDot, {
              opacity: livePulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            }]} />
            <Text style={fp.liveDotTxt}>LIVE</Text>
            <View style={{ flex: 1 }} />
            <Text style={fp.liveReach}>🌍 195 countries</Text>
          </View>

          {/* Center — icon + title */}
          <View style={fp.liveCenter}>
            <Text style={fp.liveBigIcon}>📡</Text>
            <Text style={fp.liveTitle}>WORLD LIVE</Text>
            <Text style={fp.liveSub}>Broadcast to every corner of the world</Text>
          </View>

          {/* Bottom row */}
          <View style={fp.liveBottom}>
            <Text style={fp.liveHint}>Pro members go live first</Text>
            <View style={fp.liveCTA}>
              <Text style={fp.liveCTATxt}>ENTER →</Text>
            </View>
          </View>

        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
const fp = StyleSheet.create({
  wrap:             { gap: 10 },
  head:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  headLabel:        { color: '#FFB700', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  headSub:          { color: '#555555', fontSize: 10, marginTop: 2 },
  goldTag:          { backgroundColor: '#FFB70020', borderRadius: 8, borderWidth: 1, borderColor: '#FFB70050', paddingHorizontal: 8, paddingVertical: 4 },
  goldTagTxt:       { color: '#FFB700', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  monumentCard:     { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#FFB70025' },
  monumentGrad:     { borderRadius: 16 },
  goldBar:          { height: 3 },
  monumentBody:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  monumentLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monumentIcon:     { fontSize: 32 },
  monumentMeta:     { gap: 2 },
  monumentName:     { color: '#fff', fontSize: 14, fontWeight: '800' },
  monumentLocation: { color: '#555555', fontSize: 11 },
  claimBadge:       { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  claimBadgeFree:   { backgroundColor: '#57f28720', borderColor: '#57f28740' },
  claimBadgeHeld:   { backgroundColor: '#ef444420', borderColor: '#ef444440' },
  claimTxt:         { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  monumentFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, marginTop: -4 },
  monumentCountry:  { fontSize: 18 },
  oneOfOne:         { color: '#FFB70099', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  stampsCard:       { backgroundColor: '#0d0d0d', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFB70018', gap: 8 },
  stampsTitle:      { color: '#FFB700', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  stampsRow:        { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stamp:            { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1a1200', borderWidth: 1, borderColor: '#FFB70025', alignItems: 'center', justifyContent: 'center' },
  stampFlag:        { fontSize: 20 },
  stampMore:        { backgroundColor: '#FFB70015' },
  stampMoreTxt:     { color: '#FFB700', fontSize: 12, fontWeight: '800' },
  stampsArrow:      { color: '#555555', fontSize: 11 },

  // Go Live Portal
  livePortal:   { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#ef444430' },
  liveGrad:     { borderRadius: 16, padding: 18, gap: 16 },
  liveTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveDotTxt:   { color: '#ef4444', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  liveReach:    { color: '#555555', fontSize: 11 },
  liveCenter:   { alignItems: 'center', gap: 6, paddingVertical: 10 },
  liveBigIcon:  { fontSize: 44 },
  liveTitle:    { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  liveSub:      { color: '#ffffff44', fontSize: 12, textAlign: 'center' },
  liveBottom:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveHint:     { color: '#555555', fontSize: 11 },
  liveCTA:      { backgroundColor: '#ef444422', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: '#ef444455' },
  liveCTATxt:   { color: '#ef4444', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label, color }) {
  return (
    <View style={sp.pill}>
      <Text style={[sp.val, { color }]}>{value}</Text>
      <Text style={sp.lbl}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: { alignItems: 'center', gap: 1, flex: 1 },
  val:  { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  lbl:  { color: '#444', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});

// ─── Event leaderboard row ────────────────────────────────────────────────────
const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };
function EventLeaderRow({ item, rank, onPress }) {
  const meta  = EV_TYPE[item.type] || EV_TYPE.just_chill;
  const count = item.attendees?.length || 0;
  return (
    <TouchableOpacity style={lb.row} onPress={onPress} activeOpacity={0.8}>
      <Text style={lb.rank}>{RANK_ICONS[rank] ?? `#${rank}`}</Text>
      <View style={[lb.typeIcon, { backgroundColor: meta.color + '22' }]}>
        <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={lb.title} numberOfLines={1}>{item.title}{count >= 150 ? ' 🔥' : ''}</Text>
        <Text style={lb.host}>{item.hostName}{item.hostCountry ? `  ${getCountryFlag(item.hostCountry)}` : ''}</Text>
      </View>
      <View style={lb.countCol}>
        <Text style={[lb.countNum, count >= 150 && { color: '#ff7043' }]}>
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </Text>
        <Text style={lb.countLbl}>going</Text>
      </View>
      <Text style={lb.arrow}>›</Text>
    </TouchableOpacity>
  );
}
const lb = StyleSheet.create({
  card:     { backgroundColor: '#0d0f14', borderRadius: 22, borderWidth: 1, borderColor: '#1e2028', overflow: 'hidden' },
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  divider:  { height: 1, backgroundColor: '#1e2028', marginHorizontal: 16 },
  rank:     { fontSize: 20, width: 28, textAlign: 'center' },
  typeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { color: '#fff', fontSize: 14, fontWeight: '800', flex: 1 },
  host:     { color: '#444', fontSize: 11, fontWeight: '600' },
  countCol: { alignItems: 'flex-end', gap: 1 },
  countNum: { color: '#FF0080', fontSize: 16, fontWeight: '900', lineHeight: 18 },
  countLbl: { color: '#2a2c34', fontSize: 9, fontWeight: '700' },
  arrow:    { color: '#2a2c34', fontSize: 22, fontWeight: '300', marginLeft: -4 },
  seeAllRow:{ borderTopWidth: 1, borderTopColor: '#1e2028', overflow: 'hidden' },
  seeAllGrd:{ paddingVertical: 14, alignItems: 'center' },
  seeAllTxt:{ color: '#FF0080', fontSize: 13, fontWeight: '800' },
});

// ─── Icebreaker ───────────────────────────────────────────────────────────────
function IcebreakerCard({ question, responseCount, onAnswer }) {
  return (
    <LinearGradient colors={['#1C1F23', '#16181C']} style={ic.card}>
      <View style={ic.topRow}>
        <View style={ic.badge}><Text style={ic.badgeTxt}>💡 Daily Icebreaker</Text></View>
        <View style={ic.count}>
          <View style={ic.dot} />
          <Text style={ic.countTxt}>{responseCount} answered</Text>
        </View>
      </View>
      <Text style={ic.question}>"{question}"</Text>
      <TouchableOpacity onPress={onAnswer} activeOpacity={0.85}>
        <LinearGradient colors={['#FF0080', '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ic.btn}>
          <Text style={ic.btnTxt}>Share Your Answer  →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}
const ic = StyleSheet.create({
  card:     { borderRadius: 24, padding: 22, gap: 16, borderWidth: 1, borderColor: '#FF008040' },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge:    { backgroundColor: '#FF008022', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#FF008040' },
  badgeTxt: { color: '#FF0080', fontSize: 12, fontWeight: '700' },
  count:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#57f287' },
  countTxt: { color: '#888', fontSize: 12 },
  question: { color: '#fff', fontSize: 18, lineHeight: 28, fontStyle: 'italic', fontWeight: '500' },
  btn:      { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Random connect ───────────────────────────────────────────────────────────
function RandomConnectCard({ onConnect, onlineCount }) {
  return (
    <LinearGradient colors={['#0e1f14', '#0a180e']} style={rcc.card}>
      <View style={rcc.left}>
        <Text style={rcc.emoji}>🌀</Text>
        <View style={{ flex: 1 }}>
          <Text style={rcc.title}>Random World Connect</Text>
          <Text style={rcc.sub}>Instant chat with someone from a different country. Auto-translated.</Text>
          <View style={rcc.pill}><View style={rcc.dot} /><Text style={rcc.pillTxt}>{onlineCount} people online now</Text></View>
        </View>
      </View>
      <TouchableOpacity onPress={onConnect} activeOpacity={0.85}>
        <LinearGradient colors={['#4caf50', '#388e3c']} style={rcc.btn}>
          <Text style={rcc.btnTxt}>Connect Now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}
const rcc = StyleSheet.create({
  card:    { borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: '#4caf5030' },
  left:    { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  emoji:   { fontSize: 36, marginTop: 2 },
  title:   { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub:     { color: '#888', fontSize: 13, lineHeight: 20, marginTop: 4 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dot:     { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#57f287' },
  pillTxt: { color: '#57f287', fontSize: 12, fontWeight: '600' },
  btn:     { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center' },
  btnTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation, user }) {
  const { unreadCount }  = useNotifications();
  const { tier }         = usePremium();
  const { streak, longest, tier: streakTier, milestones, primary } = useStreak();

  // ── Tier-change flash: brief colored overlay when user upgrades ──────────────
  const tierFlash    = useRef(new Animated.Value(0)).current;
  const prevTierRef  = useRef(tier);
  useEffect(() => {
    if (prevTierRef.current !== tier) {
      prevTierRef.current = tier;
      Animated.sequence([
        Animated.timing(tierFlash, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(tierFlash, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }
  }, [tier]);
  const socket = getSocket();

  const [onlineUsers,  setOnlineUsers]  = useState([]);
  const [dailyMatches, setDailyMatches] = useState([]);
  const [icebreaker,   setIcebreaker]   = useState({ question: '', responseCount: 0 });
  const [liveStreams,  setLiveStreams]   = useState([]);
  const [topEvents,    setTopEvents]    = useState([]);
  const [loadingM,     setLoadingM]     = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const scrollY    = useRef(new Animated.Value(0)).current;
  const hdrOpacity = scrollY.interpolate({ inputRange: [0, 80],  outputRange: [0, 1], extrapolate: 'clamp' });
  const heroScale  = scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0.94], extrapolate: 'clamp' });
  const heroOpacity= scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0],   extrapolate: 'clamp' });
  const sectAnim   = useRef([...Array(7)].map(() => new Animated.Value(0))).current;

  const theme = HERO_THEMES[tier] || HERO_THEMES.free;
  const tiles = QUICK_TILES[tier]  || QUICK_TILES.free;
  const accentColor = tier === 'pro' ? '#FFB700' : tier === 'plus' ? '#FF0080' : '#FF0080';

  const fetchBondData = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) { setLoadingM(false); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [res] = await Promise.allSettled([
        axios.get(`${SERVER_URL}/api/matches/daily`, { headers, timeout: 8000 }),
      ]);
      if (res.status === 'fulfilled') setDailyMatches(res.value.data.slice(0, 5));
    } catch {}
    finally {
      setLoadingM(false);
      Animated.stagger(100, sectAnim.map(a =>
        Animated.spring(a, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
      )).start();
    }
  }, [user?.country]);

  useEffect(() => {
    if (!user) return;
    function reg() {
      socket.emit('register', {
        username: user.username, display_name: user.display_name || user.username,
        language: user.language, country: user.country,
        userId: user.userId, photo_url: user.photo_url,
      });
      socket.emit('get_users');
      socket.emit('get_icebreaker');
    }
    if (socket.connected) reg(); else socket.once('connect', reg);

    const onUsers  = list => setOnlineUsers(list.filter(u => u.socketId !== socket.id));
    const onIce    = ({ question, responses }) => setIcebreaker({ question, responseCount: responses?.length || 0 });
    const onCall   = ({ from, callerName, callerCountry, offer, callType }) =>
      navigation.navigate('Call', { mode: 'incoming', from, callerName, callerCountry, offer, callType });
    const onLive   = s => setLiveStreams(s);
    const onEvents = list => setTopEvents((list || []).slice().sort((a,b) => (b.attendees?.length||0) - (a.attendees?.length||0)).slice(0,5));
    const onEvUpd  = ev => setTopEvents(prev => prev.map(e => e.id === ev?.id ? ev : e).sort((a,b) => (b.attendees?.length||0) - (a.attendees?.length||0)));

    socket.on('user_list',       onUsers);
    socket.on('icebreaker_data', onIce);
    socket.on('incoming_call',   onCall);
    socket.on('live_streams',    onLive);
    socket.on('events_list',     onEvents);
    socket.on('event_updated',   onEvUpd);
    socket.emit('get_live_streams');
    socket.emit('get_events');
    fetchBondData();
    return () => {
      socket.off('connect', reg);
      socket.off('user_list',       onUsers);
      socket.off('icebreaker_data', onIce);
      socket.off('incoming_call',   onCall);
      socket.off('live_streams',    onLive);
      socket.off('events_list',     onEvents);
      socket.off('event_updated',   onEvUpd);
    };
  }, [fetchBondData]);

  async function onRefresh() {
    setRefreshing(true);
    if (socket.connected) {
      socket.emit('get_users');
      socket.emit('get_icebreaker');
      socket.emit('get_live_streams');
      socket.emit('get_events');
    }
    await fetchBondData();
    setRefreshing(false);
  }

  function openMatchProfile(match) {
    navigation.navigate('Profile', {
      profileUser: { username: match.display_name, country: match.country, language: match.language, socials: {} },
      bondUserId: match.matched_user_id,
      compatibilityScore: match.compatibility_score,
      scoreBreakdown: match.score_breakdown,
    });
  }

  const firstName = (user?.display_name || user?.username || 'Bond').split(' ')[0];
  const countryFlag = user?.country ? getCountryFlag(user.country) : '🌍';
  const totalOnline = onlineUsers.length;
  const totalLive   = liveStreams.length || DEMO_STATS.live;

  function sect(i) {
    return {
      opacity: sectAnim[i],
      transform: [{ translateY: sectAnim[i].interpolate({ inputRange: [0,1], outputRange: [24,0] }) }],
    };
  }

  // Per-tier hero stats
  const heroStats = tier === 'pro'
    ? [
        { value: `#${DEMO_STATS.rank}`, label: 'YOUR RANK',   color: '#FFB700' },
        { value: totalLive.toString(),  label: 'LIVE NOW',     color: '#ef4444' },
        { value: '892',                 label: 'COINS TODAY',  color: '#fbbf24' },
      ]
    : tier === 'plus'
    ? [
        { value: totalOnline > 0 ? totalOnline.toLocaleString() : '147', label: 'ONLINE',        color: '#57f287' },
        { value: DEMO_STATS.views.toString(),                             label: 'VIEWED YOU',    color: '#a78bfa' },
        { value: DEMO_STATS.bonds.toLocaleString(),                       label: 'BONDS TODAY',   color: '#FF0080' },
      ]
    : [
        { value: totalOnline > 0 ? totalOnline.toLocaleString() : '147', label: 'ONLINE',        color: '#57f287' },
        { value: totalLive.toString(),                                    label: 'LIVE',          color: '#e53935' },
        { value: DEMO_STATS.bonds.toLocaleString(),                       label: 'BONDS TODAY',   color: '#FF0080' },
      ];

  return (
    <View style={s.container}>
      {/* Floating sticky header */}
      <Animated.View pointerEvents="none" style={[s.stickyBar, { opacity: hdrOpacity }]}>
        <SafeAreaView>
          <View style={s.stickyInner}>
            <HomeLogoMark />
            <View style={s.stickyOnline}>
              {tier !== 'free' && (
                <View style={[s.stickyBadge, { backgroundColor: accentColor + '22', borderColor: accentColor + '50' }]}>
                  <Text style={[s.stickyBadgeTxt, { color: accentColor }]}>{tier === 'pro' ? 'Pro' : 'Plus'}</Text>
                </View>
              )}
              <View style={s.onlineDot} />
              <Text style={s.stickyOnlineTxt}>{totalOnline} online</Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* ── Hero ── */}
        <Animated.View style={{ opacity: heroOpacity, transform: [{ scale: heroScale }] }}>
          <LinearGradient colors={theme.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>

            {/* Star field — static, like the landing screen */}
            <View pointerEvents="none" style={s.heroStars}>
              {HERO_STARS.map((star, i) => (
                <View key={i} style={{
                  position: 'absolute',
                  width: star.r * 2, height: star.r * 2, borderRadius: star.r,
                  backgroundColor: '#ffffff',
                  opacity: star.o,
                  left: `${star.x * 100}%`,
                  top: `${star.y * 100}%`,
                }} />
              ))}
            </View>

            {/* Constellation network background */}
            <ConstellationField heroW={width} heroH={230} color={theme.nodeColor} />

            {/* Soft radial glow centered upper-right — cosmic depth */}
            <View pointerEvents="none" style={s.heroGlow} />

            {/* Tier-upgrade flash overlay */}
            <Animated.View pointerEvents="none" style={[s.tierFlashOverlay, {
              backgroundColor: accentColor,
              opacity: tierFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }),
            }]} />

            <SafeAreaView>
              <View style={s.heroInner}>

                {/* ── Logo bar: mark + wordmark left, notif right ── */}
                <View style={s.heroLogoBar}>
                  <HomeLogoMark />
                  <View style={s.heroLogoRight}>
                    {/* Tier badge pill */}
                    {theme.badge && (
                      <View style={[s.tierBadge, { backgroundColor: theme.badge.bg, borderColor: theme.badge.border }]}>
                        <Text style={[s.tierBadgeTxt, { color: theme.badge.color }]}>{theme.badge.label}</Text>
                      </View>
                    )}
                    <TouchableOpacity style={s.notifBtn} onPress={() => navigation.navigate('Notifications')}>
                      <Text style={s.notifIcon}>🔔</Text>
                      {unreadCount > 0 && <Text style={s.notifCountTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── Greeting + name ── */}
                <View style={s.heroGreetBlock}>
                  <Text style={s.greetLine}>{theme.greetLabel || greeting()}</Text>
                  <Text style={s.heroName}>
                    {firstName} {countryFlag}
                    {tier === 'plus' ? <Text style={{ color: accentColor }}> +</Text> : null}
                  </Text>
                </View>

                {/* ── World stats bar ── */}
                <View style={[s.statsBar, { borderColor: accentColor + '20' }]}>
                  {heroStats.map((stat, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <View style={s.statDivider} />}
                      <StatPill value={stat.value} label={stat.label} color={stat.color} />
                    </React.Fragment>
                  ))}
                </View>

                {/* ── Upgrade nudge (free only) ── */}
                {tier === 'free' && (
                  <TouchableOpacity
                    style={s.upgradeNudge}
                    onPress={() => navigation.navigate('Subscription')}
                    activeOpacity={0.8}
                  >
                    <WorldWordmark size={11} color="#fff" bondColor="#FF0080" bondTextColor="#FF0080" style={{ marginRight: 2 }} />
                    <Text style={s.upgradeNudgeTxt}>  Upgrade — unlock profile views & priority bonds →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

        {/* ── Pro: Priority Matches ── */}
        {tier === 'pro' && (
          <Animated.View style={[s.section, sect(0)]}>
            <SectionHead
              title="Priority Matches"
              sub="Curated above the queue for you"
              action="View All"
              onAction={() => navigation.navigate('Notifications')}
              accentColor="#FFB700"
            />
            <View style={{ gap: 10 }}>
              {DEMO_PRIORITY_MATCHES.map(m => (
                <PriorityMatchRow
                  key={m.id}
                  item={m}
                  onPress={() => navigation.navigate('Profile', {
                    profileUser: { username: m.name, country: m.country, socials: {} },
                    bondUserId: m.id,
                    compatibilityScore: m.score,
                  })}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Quick actions / Pro Footprint ── */}
        <Animated.View style={[s.section, sect(1)]}>
          {tier === 'pro' ? (
            <ProFootprintPanel navigation={navigation} />
          ) : (
            <>
              <View style={s.quickGrid}>
                <QuickCard {...tiles[0]} onPress={() => navigation.navigate(tiles[0].nav)} />
                <QuickCard {...tiles[1]} onPress={() => navigation.navigate(tiles[1].nav)} />
              </View>
              <View style={[s.quickGrid, { marginTop: 10 }]}>
                <QuickCard {...tiles[2]} onPress={() => navigation.navigate(tiles[2].nav)} />
                <QuickCard {...tiles[3]} onPress={() => navigation.navigate(tiles[3].nav)} />
              </View>
            </>
          )}
        </Animated.View>

        {/* ── Live Now ── */}
        {liveStreams.length > 0 && (
          <Animated.View style={[s.section, sect(2)]}>
            <SectionHead title="🔴 Live Now" sub={`${liveStreams.length} stream${liveStreams.length > 1 ? 's' : ''} happening`} accentColor={accentColor} />
            <FlatList
              horizontal data={liveStreams} keyExtractor={s => s.streamId}
              showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}
              renderItem={({ item: sv }) => (
                <TouchableOpacity style={s.liveCard} onPress={() => navigation.navigate('LiveWatch', { stream: sv, currentUser: user })} activeOpacity={0.85}>
                  <LinearGradient colors={['#2a0a0a', '#1a0606']} style={s.liveCardBg}>
                    <View style={s.liveBadge}><View style={s.liveDot} /><Text style={s.liveBadgeTxt}>LIVE</Text></View>
                    <Text style={s.liveEmoji}>{sv.hostCountry?.split(' ')[0] || '🌍'}</Text>
                    <Text style={s.liveName} numberOfLines={1}>{sv.hostName}</Text>
                    <Text style={s.liveTitle} numberOfLines={1}>{sv.title}</Text>
                    <Text style={s.liveViewers}>👁 {sv.viewerCount}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}

        {/* ── Online now ── */}
        {onlineUsers.length > 0 && (
          <Animated.View style={[s.section, sect(3)]}>
            <SectionHead title="Online Now" sub={`${onlineUsers.length} people live around the world`} accentColor={accentColor} />
            <FlatList
              horizontal data={onlineUsers.slice(0, 15)} keyExtractor={u => u.socketId}
              showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}
              renderItem={({ item }) => <StoryRing user={item} onPress={() => navigation.navigate('Chat', { otherUser: item, currentUser: user })} />}
            />
          </Animated.View>
        )}

        {/* ── Daily Bond Matches ── */}
        <Animated.View style={[s.section, sect(4)]}>
          <SectionHead
            title="Your Bond Matches"
            sub={dailyMatches.length ? `${dailyMatches.length} curated for you today` : 'Updated every day'}
            action={dailyMatches.length ? 'See All' : null}
            onAction={() => navigation.navigate('Bond')}
            accentColor={accentColor}
          />
          {loadingM ? (
            <View style={s.loadRow}>
              <ActivityIndicator color={accentColor} />
              <Text style={s.loadTxt}>Finding your matches…</Text>
            </View>
          ) : dailyMatches.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
              {dailyMatches.map((m, i) => <MatchCard key={m.id} match={m} index={i} onPress={() => openMatchProfile(m)} />)}
              <TouchableOpacity style={s.moreCard} onPress={() => navigation.navigate('Bond')}>
                <Text style={[s.moreArrow, { color: accentColor }]}>→</Text>
                <Text style={s.moreLbl}>See{'\n'}All</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <LinearGradient colors={['#130d24', '#0d0820']} style={s.emptyCard}>
              <View style={s.emptyRow}>
                <Text style={{ fontSize: 32 }}>✨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.emptyTitle}>No matches yet</Text>
                  <Text style={s.emptySub}>Complete your profile to unlock your daily 5 curated matches.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Me')}>
                <LinearGradient colors={[accentColor, accentColor + 'bb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyBtn}>
                  <Text style={s.emptyBtnTxt}>Complete Profile →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </Animated.View>

        {/* ── Bond Streak Badge (Plus / Pro only) ── */}
        {(tier === 'plus' || tier === 'pro') && streak > 0 && streakTier && (
          <Animated.View style={[s.section, sect(5)]}>
            <SectionHead
              title="Your Bond Streak"
              sub="1-of-1 footprint — unique to your journey"
              accentColor={streakTier.color}
            />
            <BondStreakBadge
              tier={streakTier}
              primary={primary}
              milestones={milestones}
              longest={longest}
              onPress={() => {}}
            />
          </Animated.View>
        )}

        {/* ── Plus: Who Viewed Your Profile ── */}
        {(tier === 'plus' || tier === 'pro') && (
          <Animated.View style={[s.section, sect(5)]}>
            <SectionHead
              title="Who Viewed You"
              sub={`${DEMO_VIEWS.length} people in the last 24 hours`}
              action="See All"
              onAction={() => navigation.navigate('Notifications')}
              accentColor={accentColor}
            />
            <View style={[s.viewersCard, { borderColor: accentColor + '25' }]}>
              {DEMO_VIEWS.slice(0, 4).map((v, i) => (
                <ViewerRow
                  key={v.id}
                  item={v}
                  accentColor={accentColor}
                  onPress={() => navigation.navigate('Profile', {
                    profileUser: { username: v.username, country: v.country, socials: {} },
                    bondUserId: v.id,
                  })}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Icebreaker ── */}
        {icebreaker.question ? (
          <Animated.View style={[s.section, sect(5)]}>
            <IcebreakerCard question={icebreaker.question} responseCount={icebreaker.responseCount} onAnswer={() => navigation.navigate('Discover')} />
          </Animated.View>
        ) : null}

        {/* ── Random connect ── */}
        <Animated.View style={[s.section, sect(5)]}>
          <RandomConnectCard onConnect={() => navigation.navigate('Discover')} onlineCount={totalOnline} />
        </Animated.View>

        {/* ── Top Events ── */}
        <Animated.View style={[s.section, sect(6)]}>
          <SectionHead title="🔥 Top Events" sub="Most talked about right now" action="See All" onAction={() => navigation.navigate('Events')} accentColor={accentColor} />
          <View style={lb.card}>
            {(topEvents.length > 0 ? topEvents : DEMO_TOP_EVENTS).map((ev, i) => (
              <React.Fragment key={ev.id}>
                {i > 0 && <View style={lb.divider} />}
                <EventLeaderRow item={ev} rank={i + 1} onPress={() => navigation.navigate('Events')} />
              </React.Fragment>
            ))}
            <TouchableOpacity style={lb.seeAllRow} onPress={() => navigation.navigate('Events')} activeOpacity={0.8}>
              <LinearGradient colors={[accentColor + '22', accentColor + '08']} style={lb.seeAllGrd}>
                <Text style={[lb.seeAllTxt, { color: accentColor }]}>See all events  →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Free: upgrade CTA ── */}
        {tier === 'free' && (
          <Animated.View style={[s.section, sect(6)]}>
            <TouchableOpacity onPress={() => navigation.navigate('Subscription')} activeOpacity={0.88}>
              <LinearGradient colors={['#1a0a30', '#0d0621']} style={s.upgradeCta}>
                <View style={s.upgradeCtaLeft}>
                  <Text style={s.upgradeCtaTitle}>Unlock the full world</Text>
                  <Text style={s.upgradeCtaSub}>See who views you · Priority matches · Message anyone · More</Text>
                </View>
                <LinearGradient colors={['#FF0080', '#CC0060']} style={s.upgradeCtaBtn}>
                  <Text style={s.upgradeCtaBtnTxt}>Upgrade</Text>
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07080f' },

  stickyBar:       { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, backgroundColor: '#07080ff0', borderBottomWidth: 1, borderBottomColor: '#1C1F23' },
  stickyInner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  stickyOnline:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stickyBadge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  stickyBadgeTxt:  { fontSize: 11, fontWeight: '800' },
  stickyOnlineTxt: { color: '#57f287', fontSize: 12, fontWeight: '600' },
  onlineDot:       { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#57f287' },

  // ── Hero ──
  hero:            { overflow: 'hidden', paddingBottom: 28 },
  heroStars:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroGlow:          {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#FF0080', opacity: 0.07,
    top: -80, right: -60,
  },
  tierFlashOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroInner:       { paddingHorizontal: 22, paddingTop: 6, gap: 20 },

  // Logo bar (top of hero)
  heroLogoBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLogoRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierBadge:       { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  tierBadgeTxt:    { fontSize: 11, fontWeight: '800' },

  // Notif button
  notifBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 40, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  notifIcon:       { fontSize: 18 },
  notifCountTxt:   { color: '#fff', fontSize: 14, fontWeight: '900' },

  // Greeting block
  heroGreetBlock:  { gap: 3 },
  greetLine:       { color: 'rgba(255,255,255,0.38)', fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  heroName:        { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },

  // Stats bar
  statsBar:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, borderWidth: 1 },
  statDivider:     { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.07)' },

  // Upgrade nudge
  upgradeNudge:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(232,150,12,0.08)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#FF008028' },
  upgradeNudgeTxt: { color: '#a78bfa', fontSize: 12, fontWeight: '600', flex: 1 },

  scroll:  { paddingBottom: 60, gap: 28 },
  section: { paddingHorizontal: 20 },

  quickGrid: { flexDirection: 'row', gap: 10 },

  loadRow:  { alignItems: 'center', paddingVertical: 40, gap: 12, flexDirection: 'row', justifyContent: 'center' },
  loadTxt:  { color: '#555', fontSize: 13 },
  moreCard: { width: 80, height: 230, backgroundColor: '#13132a', borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#2F3336', borderStyle: 'dashed' },
  moreArrow:{ fontSize: 28, fontWeight: '300' },
  moreLbl:  { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  emptyCard: { borderRadius: 22, padding: 20, gap: 16, borderWidth: 1, borderColor: '#FF008020' },
  emptyRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emptyTitle:{ color: '#fff', fontSize: 16, fontWeight: '800' },
  emptySub:  { color: '#555', fontSize: 13, lineHeight: 19, marginTop: 3 },
  emptyBtn:  { borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  emptyBtnTxt:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  viewersCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', backgroundColor: '#0a0c14' },

  liveCard:    { width: 130, borderRadius: 18, overflow: 'hidden' },
  liveCardBg:  { padding: 14, gap: 6, minHeight: 140, justifyContent: 'flex-end', borderWidth: 1, borderColor: '#e5393530' },
  liveBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', position: 'absolute', top: 10, left: 10 },
  liveDot:     { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeTxt:{ color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  liveEmoji:   { fontSize: 30, marginTop: 28 },
  liveName:    { color: '#fff', fontWeight: '800', fontSize: 13 },
  liveTitle:   { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  liveViewers: { color: '#e57373', fontSize: 11, fontWeight: '700' },

  upgradeCta:      { borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#FF008030' },
  upgradeCtaLeft:  { flex: 1, gap: 5 },
  upgradeCtaTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  upgradeCtaSub:   { color: '#555', fontSize: 12, lineHeight: 18 },
  upgradeCtaBtn:   { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  upgradeCtaBtnTxt:{ color: '#fff', fontSize: 14, fontWeight: '800' },
});
