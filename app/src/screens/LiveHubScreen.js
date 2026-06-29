import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Animated, RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';
import { stringToColor } from '../utils/apiUtils';
import { getCountryFlag } from '../utils/countryUtils';

const BOND_PINK = '#FF0080';

const YEARLY_CHALLENGES = [
  { key: 'worldStreamer', title: 'World Streamer',  description: 'Go live 52+ times this year — once a week. Each stream must be at least 5 hours.',                          prize: '500,000 BC',   goal: 52,     unit: 'streams'   },
  { key: 'globeTrotter',  title: 'Globe Trotter',   description: 'Win 12 Country Stamps AND 12 Bond Monuments this year — one of each per month. Conquer the globe.',          prize: '750,000 BC',   goal: 24,     unit: 'wins'      },
  { key: 'bondMarathon',  title: 'Bond Marathon',   description: 'Accumulate 365+ total hours of live streaming this year — roughly 1 hour a day.',                            prize: '1,000,000 BC', goal: 365,    unit: 'hours'     },
  { key: 'bondElite',     title: 'Bond Elite',      description: 'Reach 10,000 total viewers across all your streams this year.',                                               prize: '1,500,000 BC', goal: 10000,  unit: 'viewers'   },
  { key: 'giftLegend',    title: 'Earned Legend',   description: 'Earn 500,000+ BC in viewer support across your streams this year.',                                          prize: '2,000,000 BC', goal: 500000, unit: 'BC'        },
  { key: 'bondInferno',   title: 'Bond Inferno',    description: 'Accumulate 50,000 Bond Heat this year. Heat = viewers + support ×5. You need both a crowd and their energy.', prize: '2,500,000 BC', goal: 50000,  unit: 'heat'      },
];

function bondHeat(stream) {
  return (stream.viewerCount || 0) + (stream.giftCount || 0) * 5;
}

function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function daysLeftInYear() {
  const now     = new Date();
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  return Math.ceil((yearEnd - now) / (1000 * 60 * 60 * 24));
}

function pctOfYearElapsed() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end   = new Date(now.getFullYear() + 1, 0, 1);
  return Math.round(((now - start) / (end - start)) * 100);
}

// ── Heat bar ──────────────────────────────────────────────────────────────────
function HeatBar({ heat }) {
  const pct = Math.min(heat / 5000, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
      <View style={{ height: 3, borderRadius: 2, flex: 1, backgroundColor: '#ffffff0f' }}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: BOND_PINK, width: `${Math.max(pct * 100, 4)}%` }} />
      </View>
      <Text style={{ color: BOND_PINK, fontSize: 10, fontWeight: '800' }}>{fmtNum(heat)}</Text>
    </View>
  );
}

// ── Go Live broadcast card ────────────────────────────────────────────────────
function GoLiveCard({ liveCount, onPress }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function pulse(anim, delay) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          ]),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    }
    pulse(ring1, 0);
    pulse(ring2, 500);
    pulse(ring3, 1000);
  }, []);

  function ringStyle(anim) {
    return {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 1.5,
      borderColor: BOND_PINK,
      opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.6, 0.2, 0] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
    };
  }

  return (
    <LinearGradient
      colors={['#1a0020', '#0f0018', '#07080f']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={gl.card}
    >
      <LinearGradient
        colors={[BOND_PINK, '#CC0060']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={gl.topBar}
      />

      <View style={gl.body}>
        {/* Pulsing broadcast rings */}
        <View style={gl.orb}>
          <Animated.View style={ringStyle(ring1)} />
          <Animated.View style={ringStyle(ring2)} />
          <Animated.View style={ringStyle(ring3)} />
          <LinearGradient colors={[BOND_PINK, '#CC0060']} style={gl.orbCore}>
            <View style={gl.orbDot} />
          </LinearGradient>
        </View>

        {/* Text */}
        <View style={gl.text}>
          <View style={gl.statusRow}>
            <View style={gl.statusDot} />
            <Text style={gl.statusTxt}>
              {liveCount > 0 ? `${liveCount} people streaming now` : 'Be the first live today'}
            </Text>
          </View>
          <Text style={gl.headline}>Share Your World</Text>
          <Text style={gl.sub}>
            Go live and connect with viewers from every corner of the globe.
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={gl.btnWrap}>
        <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={gl.btn}>
          <View style={gl.btnDot} />
          <Text style={gl.btnTxt}>Start Broadcast</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const gl = StyleSheet.create({
  card:      { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#FF008030' },
  topBar:    { height: 3 },
  body:      { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 22, paddingBottom: 18 },
  orb:       { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  orbCore:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  orbDot:    { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff' },
  text:      { flex: 1, gap: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  statusTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
  headline:  { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  sub:       { color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 17 },
  btnWrap:   { marginHorizontal: 22, marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  btn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  btnDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  btnTxt:    { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
});

// ── Yearly Challenges ─────────────────────────────────────────────────────────
function YearlyChallenge({ challenges, progress }) {
  const year = new Date().getFullYear();
  const days = daysLeftInYear();
  const pct  = pctOfYearElapsed();
  const list = challenges || YEARLY_CHALLENGES;

  return (
    <View style={wc.card}>
      <LinearGradient colors={['#1a0030', '#28000f', '#0d001a']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={wc.grad}>
        <View style={wc.header}>
          <View style={wc.iconBox}>
            <View style={wc.diamond} />
            <View style={wc.diamondCore} />
          </View>
          <View style={wc.headerInfo}>
            <View style={wc.yearPill}>
              <Text style={wc.yearPillTxt}>{year} CHALLENGES</Text>
            </View>
            <Text style={wc.headerSub}>Complete any to earn BC</Text>
          </View>
          <Text style={wc.ends}>{days}d left</Text>
        </View>

        {list.map((c, i) => {
          const current = progress?.[c.key] ?? 0;
          const goalPct = Math.min((current / c.goal) * 100, 100);
          const done    = current >= c.goal;
          return (
            <View key={c.key} style={[wc.row, i < list.length - 1 && wc.rowBorder]}>
              <Text style={[wc.num, i < 3 && wc.numTop]}>{i + 1}</Text>
              <View style={wc.info}>
                <View style={wc.titleRow}>
                  <Text style={wc.title}>{c.title}</Text>
                  {done && <View style={wc.donePill}><Text style={wc.doneTxt}>DONE</Text></View>}
                </View>
                <Text style={wc.desc}>{c.description}</Text>
                <View style={wc.progressRow}>
                  <View style={wc.progressBg}>
                    <View style={[wc.progressFill, { width: `${goalPct}%`, backgroundColor: done ? '#22c55e' : BOND_PINK }]} />
                  </View>
                  <Text style={[wc.progressTxt, done && { color: '#22c55e' }]}>
                    {fmtNum(current)}/{fmtNum(c.goal)} {c.unit}
                  </Text>
                </View>
              </View>
              <View style={wc.prizeBox}>
                <Text style={wc.prizeLabel}>PRIZE</Text>
                <Text style={[wc.prizeVal, done && { color: '#22c55e' }]}>{c.prize}</Text>
              </View>
            </View>
          );
        })}

        <View style={wc.yearBar}>
          <View style={[wc.yearFill, { width: `${pct}%` }]} />
        </View>
        <Text style={wc.yearCaption}>{pct}% of the year gone — new challenges drop Jan 1</Text>
      </LinearGradient>
    </View>
  );
}

const wc = StyleSheet.create({
  card:        { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#FF008025' },
  grad:        { padding: 18, gap: 14 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  diamond:     { position: 'absolute', width: 26, height: 26, backgroundColor: '#FF008025', borderWidth: 1.5, borderColor: BOND_PINK, transform: [{ rotate: '45deg' }], borderRadius: 4 },
  diamondCore: { position: 'absolute', width: 9, height: 9, backgroundColor: BOND_PINK, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  headerInfo:  { flex: 1, gap: 3 },
  yearPill:    { alignSelf: 'flex-start', backgroundColor: '#FF008015', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#FF008035' },
  yearPillTxt: { color: BOND_PINK, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  headerSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  ends:        { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', flexShrink: 0 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowBorder:   { borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  num:         { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '900', width: 18, textAlign: 'center', flexShrink: 0 },
  numTop:      { color: BOND_PINK },
  info:        { flex: 1, gap: 2 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:       { color: '#fff', fontSize: 13, fontWeight: '800' },
  donePill:    { backgroundColor: '#22c55e20', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: '#22c55e50' },
  doneTxt:     { color: '#22c55e', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  desc:        { color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  progressBg:  { flex: 1, height: 3, backgroundColor: '#ffffff0f', borderRadius: 2 },
  progressFill:{ height: 3, borderRadius: 2 },
  progressTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', flexShrink: 0 },
  prizeBox:    { alignItems: 'flex-end', flexShrink: 0 },
  prizeLabel:  { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  prizeVal:    { color: BOND_PINK, fontSize: 13, fontWeight: '900' },
  yearBar:     { height: 3, backgroundColor: '#ffffff0f', borderRadius: 2 },
  yearFill:    { height: 3, backgroundColor: BOND_PINK, borderRadius: 2 },
  yearCaption: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600' },
});

// ── Leaderboard (top streamers only) ─────────────────────────────────────────
function Leaderboard({ streams }) {
  const topStreamers = [...streams].sort((a, b) => bondHeat(b) - bondHeat(a)).slice(0, 10);

  return (
    <View style={lb.wrap}>
      <View style={lb.headingRow}>
        <Text style={lb.heading}>Top Streamers</Text>
        <Text style={lb.headingSub}>Ranked by viewers and support</Text>
      </View>

      {topStreamers.length > 0
        ? topStreamers.map((st, i) => {
            const flag  = st.hostCountry ? getCountryFlag(st.hostCountry) : '';
            const color = stringToColor(st.hostName || '');
            return (
              <View key={st.streamId} style={[lb.row, i === topStreamers.length - 1 && lb.rowLast]}>
                <Text style={[lb.rank, i < 3 && lb.rankTop]}>{i + 1}</Text>
                <View style={[lb.avatar, { backgroundColor: color }]}>
                  <Text style={lb.avatarTxt}>{(st.hostName || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={lb.info}>
                  <Text style={lb.name}>{flag ? `${flag} ` : ''}{st.hostName}</Text>
                  <HeatBar heat={bondHeat(st)} />
                </View>
                <View style={lb.viewerPill}>
                  <Text style={lb.viewerTxt}>{fmtNum(st.viewerCount || 0)}</Text>
                  <Text style={lb.viewerLabel}>viewers</Text>
                </View>
              </View>
            );
          })
        : (
          <View style={lb.empty}>
            <Text style={lb.emptyTxt}>No streams live right now</Text>
            <Text style={lb.emptySub}>Be the first to go live today</Text>
          </View>
        )
      }
    </View>
  );
}

const lb = StyleSheet.create({
  wrap:        { marginHorizontal: 20, marginBottom: 48 },
  headingRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 16 },
  heading:     { color: '#fff', fontSize: 20, fontWeight: '900' },
  headingSub:  { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#ffffff07' },
  rowLast:     { borderBottomWidth: 0 },
  rank:        { color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: '900', width: 20, textAlign: 'center' },
  rankTop:     { color: BOND_PINK },
  avatar:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:   { color: '#fff', fontWeight: '900', fontSize: 15 },
  info:        { flex: 1, gap: 5 },
  name:        { color: '#fff', fontSize: 13, fontWeight: '700' },
  viewerPill:  { alignItems: 'flex-end', gap: 1, flexShrink: 0 },
  viewerTxt:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  viewerLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700' },
  empty:       { alignItems: 'center', paddingVertical: 36, gap: 6 },
  emptyTxt:    { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700' },
  emptySub:    { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
});

// ── LiveHubScreen ─────────────────────────────────────────────────────────────
export default function LiveHubScreen({ navigation, user }) {
  const socket = getSocket();
  const [streams,           setStreams]           = useState([]);
  const [challenge,         setChallenge]         = useState(null);
  const [challengeProgress, setChallengeProgress] = useState({});
  const [refreshing,        setRefreshing]        = useState(false);
  const livePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(livePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 0, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    function fetchAll() {
      socket.emit('get_live_streams');
      socket.emit('get_yearly_challenge');
      socket.emit('get_challenge_progress');
    }
    if (socket.connected) fetchAll();
    else socket.once('connect', fetchAll);

    socket.on('live_streams',       setStreams);
    socket.on('yearly_challenge',   setChallenge);
    socket.on('challenge_progress', setChallengeProgress);

    return () => {
      socket.off('connect',            fetchAll);
      socket.off('live_streams',       setStreams);
      socket.off('yearly_challenge',   setChallenge);
      socket.off('challenge_progress', setChallengeProgress);
    };
  }, []);

  function onRefresh() {
    setRefreshing(true);
    socket.emit('get_live_streams');
    socket.emit('get_challenge_progress');
    setTimeout(() => setRefreshing(false), 900);
  }

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BOND_PINK} />}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Animated.View style={[s.liveDot, {
                opacity: livePulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
              }]} />
              <Text style={s.title}>Live</Text>
              {streams.length > 0 && (
                <View style={s.countPill}>
                  <Text style={s.countTxt}>{streams.length} live now</Text>
                </View>
              )}
            </View>
          </View>

          {/* Go Live broadcast card */}
          <GoLiveCard
            liveCount={streams.length}
            onPress={() => navigation.navigate('Live', { user })}
          />

          {/* Yearly Challenges */}
          <YearlyChallenge challenges={challenge} progress={challengeProgress} />

          {/* Top Streamers */}
          <Leaderboard streams={streams} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#08090d' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: BOND_PINK },
  title:      { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  countPill:  { backgroundColor: BOND_PINK + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: BOND_PINK + '28' },
  countTxt:   { color: BOND_PINK, fontSize: 12, fontWeight: '800' },
});
