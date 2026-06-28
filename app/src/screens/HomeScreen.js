import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, FlatList, RefreshControl,
  Animated, Dimensions,
} from 'react-native';
import { WorldMark } from '../components/BondLogo';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';
import { stringToColor } from '../utils/apiUtils';
import { useNotifications } from '../context/NotificationsContext';
import { useStreak } from '../context/StreakContext';
import { useWallet, BOND_MONUMENTS } from '../context/WalletContext';
import { getCountryFlag } from '../utils/countryUtils';

const { width } = Dimensions.get('window');
const BOND_PINK = '#FF0080';
const BOND_GOLD = '#FFB700';

// ─── Static star field ────────────────────────────────────────────────────────
const HERO_STARS = [...Array(38)].map(() => ({
  x: Math.random(), y: Math.random(),
  r: Math.random() * 0.9 + 0.4, o: Math.random() * 0.4 + 0.15,
}));

// ─── Constellation data ───────────────────────────────────────────────────────
const C_NODES = [
  [0.08, 0.12], [0.42, 0.06], [0.78, 0.18], [0.92, 0.52],
  [0.72, 0.85], [0.38, 0.90], [0.12, 0.68], [0.55, 0.48],
];
const C_EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[1,7],[7,3],[7,5]];

// ─── AbsLine ──────────────────────────────────────────────────────────────────
function AbsLine({ x1, y1, x2, y2, color, opacity = 0.12, thickness = 1 }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return (
    <View pointerEvents="none" style={{
      position: 'absolute', width: len, height: thickness,
      backgroundColor: color, opacity,
      left: (x1 + x2) / 2 - len / 2,
      top:  (y1 + y2) / 2 - thickness / 2,
      transform: [{ rotate: `${angle}deg` }],
    }} />
  );
}

// ─── ConstellationField ───────────────────────────────────────────────────────
function ConstellationField({ heroW, heroH, color }) {
  const hubFade = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(hubFade, { toValue: 0.65, duration: 2800, useNativeDriver: true }),
      Animated.timing(hubFade, { toValue: 0.35, duration: 2800, useNativeDriver: true }),
    ])).start();
  }, []);
  const pts    = C_NODES.map(([px, py]) => ({ x: px * heroW, y: py * heroH }));
  const hubIdx = 7;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: heroW, height: heroH }}>
      {C_EDGES.map(([a, b], i) => (
        <AbsLine key={i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} color={color} opacity={0.11} />
      ))}
      {pts.map((p, i) => {
        const isHub   = i === hubIdx;
        const dotSize = isHub ? 5 : 3;
        return isHub ? (
          <Animated.View key={i} style={{
            position: 'absolute', width: dotSize, height: dotSize,
            borderRadius: dotSize / 2, backgroundColor: color,
            left: p.x - dotSize / 2, top: p.y - dotSize / 2,
            opacity: hubFade,
          }} />
        ) : (
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

// ─── HomeLogoMark ─────────────────────────────────────────────────────────────
const MARK_SIZE = 42;
const GLOW_R    = 14;
const EYE_Y     = MARK_SIZE * 0.46;

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
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, []);
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.28] });
  return (
    <View style={{ alignItems: 'center', gap: 0 }}>
      <View style={{ width: MARK_SIZE, height: MARK_SIZE }}>
        <Animated.View style={{
          position: 'absolute',
          width: GLOW_R * 2, height: GLOW_R * 2, borderRadius: GLOW_R,
          backgroundColor: BOND_PINK,
          left: MARK_SIZE / 2 - GLOW_R, top: EYE_Y - GLOW_R,
          opacity: glowOpacity,
        }} />
        <Animated.View style={{ transform: [{ scale: breathe }] }}>
          <WorldMark size={MARK_SIZE} color="#fff" bondColor={BOND_PINK} />
        </Animated.View>
      </View>
      <Text style={{ color: '#fff', opacity: 0.65, fontSize: 7, fontWeight: '600', letterSpacing: 4.5, marginTop: 4 }}>WORLD</Text>
      <Text style={{ color: BOND_PINK, fontSize: 14, fontWeight: '900', letterSpacing: -0.5, marginTop: -1 }}>BOND</Text>
    </View>
  );
}

// ─── StatPill ─────────────────────────────────────────────────────────────────
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

// ─── SectionHead ──────────────────────────────────────────────────────────────
function SectionHead({ title, sub, action, onAction }) {
  return (
    <View style={sh.row}>
      <View style={{ flex: 1 }}>
        <Text style={sh.title}>{title}</Text>
        {sub ? <Text style={sh.sub}>{sub}</Text> : null}
      </View>
      {action ? (
        <TouchableOpacity onPress={onAction} style={sh.btn}>
          <Text style={sh.btnTxt}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:  { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, color: '#fff' },
  sub:    { fontSize: 12, marginTop: 2, color: '#555' },
  btn:    { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: BOND_PINK + '18', borderWidth: 1, borderColor: BOND_PINK + '40' },
  btnTxt: { fontSize: 12, fontWeight: '700', color: BOND_PINK },
});

// ─── IcebreakerCard ───────────────────────────────────────────────────────────
function IcebreakerCard({ question, responseCount, onAnswer }) {
  return (
    <LinearGradient colors={['#1C1F23', '#16181C']} style={ic.card}>
      <View style={ic.topRow}>
        <View style={ic.badge}><Text style={ic.badgeTxt}>Daily Icebreaker</Text></View>
        <View style={ic.countRow}>
          <View style={ic.dot} />
          <Text style={ic.countTxt}>{responseCount} answered</Text>
        </View>
      </View>
      <Text style={ic.question}>"{question}"</Text>
      <TouchableOpacity onPress={onAnswer} activeOpacity={0.85}>
        <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ic.btn}>
          <Text style={ic.btnTxt}>Share Your Answer  →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}
const ic = StyleSheet.create({
  card:     { borderRadius: 24, padding: 22, gap: 16, borderWidth: 1, borderColor: BOND_PINK + '40' },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge:    { backgroundColor: BOND_PINK + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: BOND_PINK + '40' },
  badgeTxt: { color: BOND_PINK, fontSize: 12, fontWeight: '700' },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#57f287' },
  countTxt: { color: '#888', fontSize: 12 },
  question: { color: '#fff', fontSize: 18, lineHeight: 28, fontStyle: 'italic', fontWeight: '500' },
  btn:      { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── ConnectTodayCard ─────────────────────────────────────────────────────────
function ConnectTodayCard({ onConnect, onlineCount }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <LinearGradient colors={['#040d08', '#060f0a', '#040d08']} style={ctc.card}>
      <View style={ctc.topRow}>
        <Animated.View style={[ctc.dot, {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
        }]} />
        <Text style={ctc.onlineTxt}>
          {onlineCount > 0 ? onlineCount.toLocaleString() : '—'} people online now
        </Text>
      </View>
      <Text style={ctc.title}>Bond with Someone New Today</Text>
      <Text style={ctc.sub}>Real connections from different countries — real-time, auto-translated.</Text>
      <TouchableOpacity onPress={onConnect} activeOpacity={0.85}>
        <LinearGradient colors={['#57f287', '#43d96d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ctc.btn}>
          <Text style={ctc.btnTxt}>Bond Now  →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}
const ctc = StyleSheet.create({
  card:      { borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: '#4caf5030' },
  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#57f287' },
  onlineTxt: { color: '#57f287', fontSize: 13, fontWeight: '600' },
  title:     { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  sub:       { color: '#555', fontSize: 13, lineHeight: 20 },
  btn:       { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnTxt:    { color: '#000', fontSize: 15, fontWeight: '800' },
});

// ─── PassportTeaser ───────────────────────────────────────────────────────────
function PassportTeaser({ stamps, onPress }) {
  const flags = stamps.slice(0, 6);
  const extra = Math.max(0, stamps.length - 6);
  const count = stamps.length;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={pte.card}>
      <View style={pte.header}>
        <View style={{ flex: 1 }}>
          <Text style={pte.title}>Your World Passport</Text>
          <Text style={pte.sub}>{count} {count === 1 ? 'country' : 'countries'} bonded</Text>
        </View>
        <Text style={pte.arrow}>›</Text>
      </View>
      {count > 0 ? (
        <View style={pte.flagRow}>
          {flags.map((flag, i) => (
            <View key={i} style={pte.chip}>
              <Text style={pte.chipFlag}>{flag}</Text>
            </View>
          ))}
          {extra > 0 && (
            <View style={[pte.chip, pte.extraChip]}>
              <Text style={pte.extraTxt}>+{extra}</Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={pte.emptyTxt}>Bond with someone to earn your first stamp</Text>
      )}
    </TouchableOpacity>
  );
}
const pte = StyleSheet.create({
  card:      { backgroundColor: '#0d0d0d', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: BOND_PINK + '25' },
  header:    { flexDirection: 'row', alignItems: 'center' },
  title:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub:       { color: BOND_PINK, fontSize: 12, marginTop: 2, fontWeight: '600' },
  arrow:     { color: '#444', fontSize: 24, fontWeight: '300' },
  flagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:      { width: 42, height: 42, borderRadius: 12, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: BOND_PINK + '25', alignItems: 'center', justifyContent: 'center' },
  chipFlag:  { fontSize: 22 },
  extraChip: { backgroundColor: BOND_PINK + '15' },
  extraTxt:  { color: BOND_PINK, fontSize: 13, fontWeight: '800' },
  emptyTxt:  { color: '#444', fontSize: 13, lineHeight: 19 },
});

// ─── MonumentTeaser ───────────────────────────────────────────────────────────
function MonumentCard({ monument, onPress }) {
  const unclaimed = !monument.holder;
  const accent    = unclaimed ? '#FFB700' : BOND_PINK;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[mte.card, { borderColor: accent + '30' }]}>
      {unclaimed && (
        <View style={mte.unclaimedBadge}>
          <Text style={mte.unclaimedTxt}>UNCLAIMED</Text>
        </View>
      )}
      <Text style={mte.icon}>{monument.icon}</Text>
      <Text style={mte.name} numberOfLines={1}>{monument.name}</Text>
      <Text style={mte.location} numberOfLines={1}>{monument.location}</Text>
      <View style={mte.divider} />
      {unclaimed ? (
        <View style={{ gap: 8 }}>
          <Text style={mte.freeLabel}>Claim it free</Text>
          <View style={[mte.btn, mte.claimBtn]}>
            <Text style={[mte.btnTxt, { color: '#FFB700' }]}>Claim Free</Text>
          </View>
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          <Text style={mte.holder} numberOfLines={1}>{monument.holder}</Text>
          <Text style={mte.earned}>{(monument.coinsEarned || 0).toLocaleString()} BC earned</Text>
          <View style={[mte.btn, mte.challengeBtn]}>
            <Text style={[mte.btnTxt, { color: BOND_PINK }]}>Challenge</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MonumentTeaser({ onPress, onViewAll }) {
  return (
    <View style={mte.wrap}>
      <TouchableOpacity onPress={onViewAll} activeOpacity={0.8} style={mte.header}>
        <View>
          <Text style={mte.title}>Bond Monuments</Text>
          <Text style={mte.sub}>500 worldwide — win one, earn forever</Text>
        </View>
        <Text style={mte.arrow}>›</Text>
      </TouchableOpacity>
      <FlatList
        horizontal
        data={BOND_MONUMENTS}
        keyExtractor={m => m.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <MonumentCard monument={item} onPress={() => onPress(item)} />
        )}
      />
    </View>
  );
}

const mte = StyleSheet.create({
  wrap:           { gap: 14 },
  header:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:          { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub:            { color: '#555', fontSize: 12, marginTop: 2, fontWeight: '600' },
  arrow:          { color: '#444', fontSize: 24, fontWeight: '300' },

  card:           { width: 162, backgroundColor: '#0d0d18', borderRadius: 18, padding: 16, gap: 8, borderWidth: 1 },
  unclaimedBadge: { backgroundColor: '#FFB70015', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FFB70040' },
  unclaimedTxt:   { color: '#FFB700', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  icon:           { fontSize: 30 },
  name:           { color: '#fff', fontSize: 13, fontWeight: '800' },
  location:       { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  divider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 2 },
  freeLabel:      { color: '#FFB700', fontSize: 11, fontWeight: '600' },
  holder:         { color: '#fff', fontSize: 12, fontWeight: '700' },
  earned:         { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  btn:            { borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  claimBtn:       { borderColor: '#FFB70055', backgroundColor: '#FFB70010' },
  challengeBtn:   { borderColor: BOND_PINK + '45', backgroundColor: BOND_PINK + '0d' },
  btnTxt:         { fontSize: 12, fontWeight: '800' },
});


// ─── StoryRing ────────────────────────────────────────────────────────────────
function StoryRing({ user: u, onPress }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const color = stringToColor(u.username);
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <TouchableOpacity style={sr.wrap} onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[sr.ring, { transform: [{ scale: pulse }] }]}>
        <LinearGradient colors={[BOND_PINK, '#57f287']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sr.gradient}>
          <View style={[sr.avatar, { backgroundColor: color }]}>
            {u.photo_url
              ? <Image source={{ uri: u.photo_url }} style={sr.avatarImg} />
              : <Text style={sr.avatarText}>{u.username[0]?.toUpperCase()}</Text>}
          </View>
        </LinearGradient>
      </Animated.View>
      {u.mood ? <Text style={sr.mood}>{u.mood}</Text> : null}
      <Text style={sr.name} numberOfLines={1}>{u.username.split(' ')[0]}</Text>
      <Text style={sr.flag}>{u.country?.split(' ')[0]}</Text>
    </TouchableOpacity>
  );
}
const sr = StyleSheet.create({
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

// ─── BondStreakBadge ──────────────────────────────────────────────────────────
function BondStreakBadge({ tier, primary, milestones, longest, onPress }) {
  const glow = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1,   duration: 2000, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);
  if (!tier) return null;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={sk.wrap}>
      <LinearGradient colors={['#0d0f1a', '#080a12']} style={sk.card}>
        <LinearGradient colors={tier.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sk.topBar}>
          <View style={sk.topLeft}>
            <Text style={[sk.gradeName, { color: tier.color }]}>{tier.grade}</Text>
            <Text style={sk.tierName}>{tier.name.toUpperCase()}</Text>
          </View>
          <View style={sk.flameMark}>
            <View style={[sk.flameBar, { width: 4,  height: 4, backgroundColor: tier.color, opacity: 0.9, borderRadius: 2 }]} />
            <View style={[sk.flameBar, { width: 8,  height: 4, backgroundColor: tier.color, opacity: 0.7, borderRadius: 2 }]} />
            <View style={[sk.flameBar, { width: 14, height: 4, backgroundColor: tier.color, opacity: 0.5, borderRadius: 2 }]} />
            <View style={[sk.flameBar, { width: 18, height: 4, backgroundColor: tier.color, opacity: 0.3, borderRadius: 2 }]} />
          </View>
        </LinearGradient>
        <View style={sk.body}>
          <View style={sk.countBlock}>
            <Animated.View style={{ opacity: glow }}>
              <Text style={[sk.countNum, { color: tier.color }]}>{primary.value}</Text>
            </Animated.View>
            <Text style={[sk.countUnit, { color: tier.color + 'aa' }]}>{primary.unit}</Text>
            <Text style={sk.countLabel}>CURRENT HEAT</Text>
          </View>
          <View style={[sk.divider, { backgroundColor: tier.color + '25' }]} />
          <View style={sk.milestonesBlock}>
            {milestones.map((m, i) => (
              <View key={i} style={sk.milestoneRow}>
                <View style={[sk.msDot, m.done && { backgroundColor: tier.color, shadowColor: tier.color, shadowRadius: 4, shadowOpacity: 0.6 }]} />
                {i < milestones.length - 1 && (
                  <View style={[sk.msLine, m.done && { backgroundColor: tier.color + '60' }]} />
                )}
                <View style={sk.msText}>
                  <Text style={[sk.msVal, { color: m.done ? tier.color : '#2a2c3a' }]}>{m.display}</Text>
                  <Text style={[sk.msLbl, { color: m.done ? '#8890b0' : '#2a2c3a' }]}>{m.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
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
  wrap:            { marginHorizontal: 0 },
  card:            { borderRadius: 22, borderWidth: 1, borderColor: '#1a1d2e', overflow: 'hidden' },
  topBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topLeft:         { gap: 1 },
  gradeName:       { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  tierName:        { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  flameMark:       { alignItems: 'flex-end', gap: 3 },
  flameBar:        {},
  body:            { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 20, gap: 0 },
  divider:         { width: 1, marginHorizontal: 16, alignSelf: 'stretch' },
  countBlock:      { flex: 1, gap: 2 },
  countNum:        { fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 58 },
  countUnit:       { fontSize: 16, fontWeight: '800', letterSpacing: 1, marginTop: -4 },
  countLabel:      { color: '#4a4e6a', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 6 },
  milestonesBlock: { flex: 1, gap: 0, paddingTop: 2 },
  milestoneRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  msDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1e2030', borderWidth: 1, borderColor: '#2a2c3a', marginTop: 2, flexShrink: 0 },
  msLine:          { position: 'absolute', left: 3.5, top: 10, width: 1, height: 12, backgroundColor: '#1e2030' },
  msText:          { marginLeft: 10, gap: 0 },
  msVal:           { fontSize: 16, fontWeight: '900', lineHeight: 18 },
  msLbl:           { fontSize: 8, fontWeight: '700', letterSpacing: 1.2, marginTop: 1 },
  footer:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  footerBest:      { color: '#6b7090', fontSize: 11, fontWeight: '600' },
  stamp:           { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderStyle: 'dashed' },
  stampTxt:        { fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
});

// ─── greeting ─────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation, user }) {
  const { unreadCount } = useNotifications();
  const { streak, longest, tier: streakTier, milestones, primary } = useStreak();
  const { myStamps, balance } = useWallet();
  const socket = getSocket();

  const [onlineUsers,  setOnlineUsers]  = useState([]);
  const [icebreaker,   setIcebreaker]   = useState({ question: '', responseCount: 0 });
  const [liveStreams,  setLiveStreams]   = useState([]);
  const [refreshing,   setRefreshing]   = useState(false);

  const scrollY     = useRef(new Animated.Value(0)).current;
  const hdrOpacity  = scrollY.interpolate({ inputRange: [0, 80],  outputRange: [0, 1], extrapolate: 'clamp' });
  const heroScale   = scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0.94], extrapolate: 'clamp' });
  const heroOpacity = scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0],   extrapolate: 'clamp' });
  const sectAnim    = useRef([...Array(7)].map(() => new Animated.Value(0))).current;

  const heroStats = [
    { value: onlineUsers.length > 0 ? onlineUsers.length.toLocaleString() : '—', label: 'ONLINE', color: '#57f287' },
    { value: liveStreams.length  > 0 ? liveStreams.length.toString()       : '—', label: 'LIVE',   color: '#ef4444' },
  ];

  const runEntryAnim = useCallback(() => {
    Animated.stagger(100, sectAnim.map(a =>
      Animated.spring(a, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
    )).start();
  }, []);

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

    const onUsers = list => setOnlineUsers(list.filter(u => u.socketId !== socket.id));
    const onIce   = ({ question, responses }) => setIcebreaker({ question, responseCount: responses?.length || 0 });
    const onCall  = ({ from, callerName, callerCountry, offer, callType }) =>
      navigation.navigate('Call', { mode: 'incoming', from, callerName, callerCountry, offer, callType });
    const onLive  = streams => setLiveStreams(streams);

    socket.on('user_list',       onUsers);
    socket.on('icebreaker_data', onIce);
    socket.on('incoming_call',   onCall);
    socket.on('live_streams',    onLive);
    socket.emit('get_live_streams');
    runEntryAnim();

    return () => {
      socket.off('connect',        reg);
      socket.off('user_list',      onUsers);
      socket.off('icebreaker_data',onIce);
      socket.off('incoming_call',  onCall);
      socket.off('live_streams',   onLive);
    };
  }, [runEntryAnim]);

  async function onRefresh() {
    setRefreshing(true);
    if (socket.connected) {
      socket.emit('get_users');
      socket.emit('get_icebreaker');
      socket.emit('get_live_streams');
    }
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  }

  const firstName   = (user?.display_name || user?.username || 'Bond').split(' ')[0];
  const countryFlag = user?.country ? getCountryFlag(user.country) : '';

  function sect(i) {
    return {
      opacity: sectAnim[i],
      transform: [{ translateY: sectAnim[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    };
  }

  return (
    <View style={s.container}>

      {/* Sticky header — fades in as user scrolls */}
      <Animated.View pointerEvents="none" style={[s.stickyBar, { opacity: hdrOpacity }]}>
        <SafeAreaView>
          <View style={s.stickyInner}>
            <HomeLogoMark />
            <View style={s.stickyRight}>
              <View style={s.onlineDot} />
              <Text style={s.stickyOnlineTxt}>
                {onlineUsers.length > 0 ? onlineUsers.length.toLocaleString() : '—'} online
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BOND_PINK} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >

        {/* ── Hero ── */}
        <Animated.View style={{ opacity: heroOpacity, transform: [{ scale: heroScale }] }}>
          <LinearGradient colors={['#020202', '#040404', '#020202']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <View pointerEvents="none" style={s.heroStars}>
              {HERO_STARS.map((star, i) => (
                <View key={i} style={{
                  position: 'absolute',
                  width: star.r * 2, height: star.r * 2, borderRadius: star.r,
                  backgroundColor: '#ffffff', opacity: star.o,
                  left: `${star.x * 100}%`, top: `${star.y * 100}%`,
                }} />
              ))}
            </View>
            <ConstellationField heroW={width} heroH={230} color={BOND_PINK} />
            <View pointerEvents="none" style={s.heroGlow} />
            <SafeAreaView>
              <View style={s.heroInner}>
                <View style={s.heroLogoBar}>
                  <HomeLogoMark />
                  <View style={s.headerRight}>
                  <TouchableOpacity style={s.walletPill} onPress={() => navigation.navigate('Wallet', { currentUser: user })} activeOpacity={0.85}>
                    <WorldMark size={14} color={BOND_GOLD} bondColor={BOND_GOLD} />
                    <Text style={s.walletPillTxt}>{balance.toLocaleString()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.notifBtn, unreadCount > 0 && s.notifBtnActive]} onPress={() => navigation.navigate('Notifications')}>
                    {/* Bell shape */}
                    <View style={s.bellWrap}>
                      <View style={s.bellDome} />
                      <View style={s.bellBody} />
                      <View style={s.bellLedge} />
                    </View>
                    <View style={s.bellClapper} />
                    {/* Inline count */}
                    {unreadCount > 0 && (
                      <>
                        <View style={s.notifDivider} />
                        <Text style={s.notifCount}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  </View>
                </View>
                <View style={s.heroGreetBlock}>
                  <Text style={s.greetLine}>{greeting()}</Text>
                  <Text style={s.heroName}>{firstName} {countryFlag}</Text>
                </View>
                <View style={s.statsBar}>
                  {heroStats.map((stat, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <View style={s.statDivider} />}
                      <StatPill value={stat.value} label={stat.label} color={stat.color} />
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

        {/* ── Bonds Live pill ── */}
        {liveStreams.length > 0 && (() => {
          const sorted = [...liveStreams].sort((a, b) =>
            ((b.viewerCount || 0) + (b.giftCount || 0) * 5) - ((a.viewerCount || 0) + (a.giftCount || 0) * 5)
          );
          const shown = sorted.slice(0, 3);
          const extra = liveStreams.length - 3;
          return (
            <TouchableOpacity
              style={blp.wrap}
              onPress={() => navigation.navigate('LiveHub')}
              activeOpacity={0.85}
            >
              <View style={blp.avatars}>
                {shown.map((st, i) => {
                  const col = stringToColor(st.hostName || '');
                  return (
                    <View key={st.streamId} style={[blp.avatar, { backgroundColor: col, marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i }]}>
                      <Text style={blp.avatarTxt}>{(st.hostName || '?')[0].toUpperCase()}</Text>
                    </View>
                  );
                })}
                {extra > 0 && (
                  <View style={[blp.avatar, blp.overflow, { marginLeft: -10, zIndex: 0 }]}>
                    <Text style={blp.overflowTxt}>+{extra}</Text>
                  </View>
                )}
              </View>
              <View style={blp.liveDot} />
              <Text style={blp.label}>
                {liveStreams.length} {liveStreams.length === 1 ? 'bond' : 'bonds'} live now
              </Text>
              <Text style={blp.chevron}>›</Text>
            </TouchableOpacity>
          );
        })()}

        {/* ── Daily Icebreaker ── */}
        {icebreaker.question ? (
          <Animated.View style={[s.section, sect(0)]}>
            <IcebreakerCard
              question={icebreaker.question}
              responseCount={icebreaker.responseCount}
              onAnswer={() => navigation.navigate('Discover')}
            />
          </Animated.View>
        ) : null}

        {/* ── Connect Today ── */}
        <Animated.View style={[s.section, sect(1)]}>
          <ConnectTodayCard
            onConnect={() => navigation.navigate('Discover', { tab: 'random' })}
            onlineCount={onlineUsers.length}
          />
        </Animated.View>

        {/* ── World Passport ── */}
        <Animated.View style={[s.section, sect(2)]}>
          <PassportTeaser
            stamps={myStamps}
            onPress={() => navigation.navigate('CountryStampChallenge', {
              stamp: myStamps.length > 0 ? { flag: myStamps[0] } : {},
            })}
          />
        </Animated.View>

        {/* ── Bond Monuments ── */}
        <Animated.View style={[s.section, sect(3)]}>
          <MonumentTeaser
            onPress={monument => navigation.navigate('MonumentChallenge', { monument, currentUser: user })}
            onViewAll={() => navigation.navigate('Wallet')}
          />
        </Animated.View>

        {/* ── Live Now — only renders when streams are active ── */}
        {liveStreams.length > 0 && (
          <Animated.View style={[s.section, sect(4)]}>
            <View style={sh.row}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={s.liveSectionDot} />
                  <Text style={sh.title}>Live Now</Text>
                </View>
                <Text style={sh.sub}>{liveStreams.length} stream{liveStreams.length > 1 ? 's' : ''} happening</Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={liveStreams}
              keyExtractor={stream => stream.streamId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item: sv }) => (
                <TouchableOpacity
                  style={s.liveCard}
                  onPress={() => navigation.navigate('LiveWatch', { stream: sv, currentUser: user })}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#2a0a0a', '#1a0606']} style={s.liveCardBg}>
                    <View style={s.liveBadge}>
                      <View style={s.liveDot} />
                      <Text style={s.liveBadgeTxt}>LIVE</Text>
                    </View>
                    <Text style={s.liveEmoji}>{sv.hostCountry?.split(' ')[0] || ''}</Text>
                    <Text style={s.liveName} numberOfLines={1}>{sv.hostName}</Text>
                    <Text style={s.liveStreamTitle} numberOfLines={1}>{sv.title}</Text>
                    <Text style={s.liveViewers}>{sv.viewerCount} watching</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}

        {/* ── Online Now ── */}
        {onlineUsers.length > 0 && (
          <Animated.View style={[s.section, sect(5)]}>
            <SectionHead
              title="Online Now"
              sub={`${onlineUsers.length} people around the world`}
            />
            <FlatList
              horizontal
              data={onlineUsers.slice(0, 15)}
              keyExtractor={u => u.socketId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
              renderItem={({ item }) => <StoryRing user={item} onPress={() => navigation.navigate('Profile', { profileUser: item, bondUserId: item.userId })} />}
            />
          </Animated.View>
        )}

        {/* ── Bond Streak — visible to all users ── */}
        {streak > 0 && streakTier && (
          <Animated.View style={[s.section, sect(6)]}>
            <SectionHead
              title="Your Bond Heat"
              sub="1-of-1 footprint — unique to your journey"
            />
            <BondStreakBadge
              tier={streakTier}
              primary={primary}
              milestones={milestones}
              longest={longest}
              onPress={() => navigation.navigate('Wallet', { currentUser: user })}
            />
          </Animated.View>
        )}

      </Animated.ScrollView>
    </View>
  );
}

const blp = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 14, marginBottom: 4, backgroundColor: '#0f0f1a', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#ffffff10' },
  avatars:     { flexDirection: 'row', alignItems: 'center' },
  avatar:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#07080f' },
  avatarTxt:   { color: '#fff', fontSize: 11, fontWeight: '900' },
  overflow:    { backgroundColor: '#1a1a2e' },
  overflowTxt: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800' },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  label:       { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700' },
  chevron:     { color: 'rgba(255,255,255,0.35)', fontSize: 20, fontWeight: '300' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07080f' },

  // Sticky header
  stickyBar:       { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, backgroundColor: '#07080ff0', borderBottomWidth: 1, borderBottomColor: '#1C1F23' },
  stickyInner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  stickyRight:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  onlineDot:       { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#57f287' },
  stickyOnlineTxt: { color: '#57f287', fontSize: 12, fontWeight: '600' },

  // Hero
  hero:      { overflow: 'hidden', paddingBottom: 28 },
  heroStars: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroGlow:  { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: BOND_PINK, opacity: 0.07, top: -80, right: -60 },
  heroInner: { paddingHorizontal: 22, paddingTop: 6, gap: 20 },

  heroLogoBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 12, backgroundColor: BOND_GOLD + '15', borderRadius: 12, borderWidth: 1, borderColor: BOND_GOLD + '40' },
  walletPillTxt: { color: BOND_GOLD, fontSize: 13, fontWeight: '800' },
  notifBtn:       { flexDirection: 'row', alignItems: 'center', gap: 0, height: 36, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  notifBtnActive: { borderColor: BOND_PINK + '55', backgroundColor: BOND_PINK + '12' },
  bellWrap:       { alignItems: 'center', gap: 0 },
  bellDome:       { width: 11, height: 6, borderRadius: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1.5, borderColor: BOND_PINK, backgroundColor: 'transparent', borderBottomWidth: 0 },
  bellBody:       { width: 13, height: 5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: BOND_PINK, backgroundColor: 'transparent', marginTop: -0.5 },
  bellLedge:      { width: 15, height: 2, borderRadius: 1, backgroundColor: BOND_PINK },
  bellClapper:    { width: 4, height: 4, borderRadius: 2, backgroundColor: BOND_PINK, opacity: 0.7, marginTop: 1 },
  notifDivider:   { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 8 },
  notifCount:     { color: BOND_PINK, fontSize: 13, fontWeight: '900' },

  heroGreetBlock: { gap: 3 },
  greetLine:      { color: 'rgba(255,255,255,0.38)', fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  heroName:       { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },

  statsBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, borderWidth: 1, borderColor: BOND_PINK + '20' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.07)' },

  scroll:  { paddingBottom: 60, gap: 28 },
  section: { paddingHorizontal: 20 },

  // Live now
  liveCard:        { width: 130, borderRadius: 18, overflow: 'hidden' },
  liveCardBg:      { padding: 14, gap: 6, minHeight: 140, justifyContent: 'flex-end', borderWidth: 1, borderColor: '#e5393530' },
  liveBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e53935', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', position: 'absolute', top: 10, left: 10 },
  liveDot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeTxt:    { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  liveEmoji:       { fontSize: 30, marginTop: 28 },
  liveName:        { color: '#fff', fontWeight: '800', fontSize: 13 },
  liveStreamTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  liveViewers:     { color: '#e57373', fontSize: 11, fontWeight: '700' },
  liveSectionDot:  { width: 9, height: 9, borderRadius: 5, backgroundColor: '#ef4444' },
});
