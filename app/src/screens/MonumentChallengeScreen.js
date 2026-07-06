import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Animated, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useBondPass } from '../context/PremiumContext';
import { useWallet, MONUMENT_CAP } from '../context/WalletContext';
import { useChallenge, DAILY_LIMITS, POINT_RATES, ENTRY_FEE, COOLDOWN_MS } from '../context/ChallengeContext';
import { authHeader } from '../utils/apiUtils';
import { SERVER_URL } from '../services/socket';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCountdown(ms) {
  if (ms <= 0) return 'ENDED';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}D ${h}H ${String(m).padStart(2, '0')}M`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function timeAgoShort(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Scoreboard side ───────────────────────────────────────────────────────────
function ScoreSide({ label, username, scores, accent, isLeading }) {
  return (
    <View style={[sc.side, isLeading && { borderColor: accent + '55' }]}>
      {isLeading && (
        <LinearGradient colors={[accent + '18', 'transparent']} style={sc.leadGlow} />
      )}
      <Text style={[sc.sideLabel, { color: accent }]}>{label}</Text>
      <Text style={sc.sideUser} numberOfLines={1}>@{username}</Text>
      <Text style={[sc.sideTotal, { color: accent }]}>{scores.total.toLocaleString()}</Text>
      <Text style={sc.sideTotalLabel}>POINTS</Text>
      <View style={sc.breakdown}>
        {[
          { label: 'Gifts',    val: scores.gifts     },
          { label: 'Bonds',    val: scores.bonds     },
          { label: 'Live hrs', val: scores.liveHours },
          { label: 'Votes',    val: scores.votes     },
        ].map(row => (
          <View key={row.label} style={sc.breakRow}>
            <Text style={sc.breakLabel}>{row.label}</Text>
            <Text style={[sc.breakVal, { color: accent }]}>{row.val.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const sc = StyleSheet.create({
  side:           { flex: 1, backgroundColor: '#0d0f1a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#ffffff10', overflow: 'hidden' },
  leadGlow:       { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  sideLabel:      { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  sideUser:       { color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  sideTotal:      { fontSize: 26, fontWeight: '900' },
  sideTotalLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 1, marginBottom: 10 },
  breakdown:      { gap: 5 },
  breakRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  breakLabel:     { color: 'rgba(255,255,255,0.45)', fontSize: 11, flex: 1 },
  breakVal:       { fontSize: 11, fontWeight: '700' },
});

// ── Contribution card (Pro only) ──────────────────────────────────────────────
function ContribCard({ title, rateLine, used, cap, unit, amounts, onContrib, disabled }) {
  const pct = Math.min(1, used / cap);
  return (
    <View style={cc.card}>
      <Text style={cc.title}>{title}</Text>
      <Text style={cc.rate}>{rateLine}</Text>
      <View style={cc.barBg}>
        <View style={[cc.barFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={cc.usage}>{used}/{cap} {unit} today</Text>
      <View style={cc.btns}>
        {amounts.map(a => (
          <TouchableOpacity
            key={a}
            style={[cc.btn, disabled && cc.btnOff]}
            onPress={() => !disabled && onContrib(a)}
            activeOpacity={0.8}
          >
            <Text style={[cc.btnTxt, disabled && { color: '#444' }]}>+{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const cc = StyleSheet.create({
  card:   { flex: 1, backgroundColor: '#0d0f1a', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#ffffff08', gap: 4 },
  title:  { color: '#fff', fontSize: 12, fontWeight: '800' },
  rate:   { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  barBg:  { height: 3, backgroundColor: '#1a1a2e', borderRadius: 2, overflow: 'hidden' },
  barFill:{ height: '100%', backgroundColor: '#FFB700', borderRadius: 2 },
  usage:  { color: '#444', fontSize: 9 },
  btns:   { flexDirection: 'row', gap: 5, marginTop: 4 },
  btn:    { flex: 1, backgroundColor: '#FFB70015', borderRadius: 8, borderWidth: 1, borderColor: '#FFB70035', alignItems: 'center', paddingVertical: 6 },
  btnOff: { backgroundColor: '#ffffff05', borderColor: '#ffffff08' },
  btnTxt: { color: '#FFB700', fontSize: 11, fontWeight: '800' },
});

// ── Comments section (Plus + Pro) ─────────────────────────────────────────────
function CommentsSection({ comments = [], onPost, username }) {
  const [draft, setDraft] = useState('');
  function submit() {
    if (!draft.trim()) return;
    onPost(draft);
    setDraft('');
  }
  return (
    <View style={cm.wrap}>
      <Text style={cm.title}>COMMENTS  <Text style={cm.count}>{comments.length}</Text></Text>
      {comments.length === 0 && (
        <Text style={cm.empty}>No comments yet. Be the first!</Text>
      )}
      {comments.map(c => (
        <View key={c.id} style={cm.row}>
          <View style={cm.avatar}>
            <Text style={cm.avatarTxt}>{c.username[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={cm.meta}>
              <Text style={cm.user}>@{c.username}</Text>
              <Text style={cm.time}>{timeAgoShort(c.ts)}</Text>
            </View>
            <Text style={cm.text}>{c.text}</Text>
          </View>
        </View>
      ))}
      <View style={cm.inputRow}>
        <TextInput
          style={cm.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline={false}
          maxLength={180}
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        <TouchableOpacity
          style={[cm.sendBtn, !draft.trim() && cm.sendBtnOff]}
          onPress={submit}
          activeOpacity={0.8}
          disabled={!draft.trim()}
        >
          <Text style={cm.sendTxt}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const cm = StyleSheet.create({
  wrap:       { backgroundColor: '#0a0a12', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#ffffff08', gap: 12 },
  title:      { color: '#FFB700', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  count:      { color: 'rgba(255,255,255,0.4)', fontWeight: '400', letterSpacing: 0 },
  empty:      { color: '#444', fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  row:        { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avatar:     { width: 32, height: 32, borderRadius: 10, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:  { color: '#FFB700', fontSize: 14, fontWeight: '800' },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  user:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  time:       { color: '#444', fontSize: 10 },
  text:       { color: '#aaa', fontSize: 13, lineHeight: 18 },
  inputRow:   { flexDirection: 'row', gap: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ffffff08', paddingTop: 12 },
  input:      { flex: 1, backgroundColor: '#111218', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#ffffff0c' },
  sendBtn:    { backgroundColor: '#FFB700', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sendBtnOff: { backgroundColor: '#1a1a1a' },
  sendTxt:    { color: '#000', fontSize: 12, fontWeight: '900' },
});

// ── Free-tier gate ────────────────────────────────────────────────────────────
function FreeGate({ navigation }) {
  return (
    <View style={gt.wrap}>
      <View style={gt.lockBox}><Text style={gt.lockTxt}>PRO ONLY</Text></View>
      <Text style={gt.title}>Bond Pro Exclusive</Text>
      <Text style={gt.sub}>Monument challenges are available to WorldBond Plus and Pro members only.</Text>
      <TouchableOpacity style={gt.btn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
        <LinearGradient colors={['#FFB700', '#FF8C00']} style={gt.btnGrad}>
          <Text style={gt.btnTxt}>Upgrade Now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
const gt = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  lockBox: { backgroundColor: '#FFB70018', borderRadius: 10, borderWidth: 1, borderColor: '#FFB70050', paddingHorizontal: 14, paddingVertical: 7 },
  lockTxt: { color: '#FFB700', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title:   { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  sub:     { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btn:     { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnGrad: { paddingHorizontal: 32, paddingVertical: 14 },
  btnTxt:  { color: '#000', fontSize: 15, fontWeight: '900' },
});

// ── Plus upgrade nudge (shown instead of contribution cards) ──────────────────
function PlusViewBanner({ navigation }) {
  return (
    <View style={pb.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={pb.title}>Viewing as WorldBond Plus</Text>
        <Text style={pb.sub}>Upgrade to Pro to contribute, vote, and initiate challenges.</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Subscription')} style={pb.btn} activeOpacity={0.85}>
        <Text style={pb.btnTxt}>Upgrade →</Text>
      </TouchableOpacity>
    </View>
  );
}
const pb = StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0d0f1a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFB70020' },
  title:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  sub:    { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  btn:    { backgroundColor: '#FFB70020', borderRadius: 10, borderWidth: 1, borderColor: '#FFB70045', paddingHorizontal: 12, paddingVertical: 8 },
  btnTxt: { color: '#FFB700', fontSize: 12, fontWeight: '800' },
});

// ── Rules ─────────────────────────────────────────────────────────────────────
function RulesSection() {
  const [open, setOpen] = useState(false);
  const RULES = [
    ['Gift Coins',       'Gift coins during streams from that region',  `+1 pt per coin · max ${DAILY_LIMITS.gifts} coins/day · prevents single buyers from dominating`],
    ['Bond Region',      'Bond with users from that region',            `+${POINT_RATES.bonds} pts per bond · max ${DAILY_LIMITS.bonds}/day · real connections, not repeat bonding`],
    ['Stream Live',      'Stream live from that region',                `+${POINT_RATES.liveHours} pts per hr · max ${DAILY_LIMITS.liveHours} hrs/day · requires genuine live presence`],
    ['Community Vote',   'Vote for challenger or holder',               `+${POINT_RATES.votes} pts · once per user per contest · community sentiment, cannot be gamed`],
    ['7-Day Contest',    'Challenge runs for 7 days',                   `${ENTRY_FEE} Bond Coins to initiate (burned) · highest total points after 7 days wins the monument`],
    ['30-Day Cooldown',  'Cooldown between challenges',                 'The same monument can only be challenged once every 30 days'],
  ];
  return (
    <View style={rl.wrap}>
      <TouchableOpacity style={rl.toggle} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <Text style={rl.toggleTxt}>HOW CHALLENGES WORK</Text>
        <Text style={rl.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={rl.body}>
          {RULES.map(([label, title, desc], i) => (
            <View key={i} style={rl.row}>
              <View style={rl.rowNum}><Text style={rl.rowNumTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={rl.rowLabel}>{label}</Text>
                <Text style={rl.rowTitle}>{title}</Text>
                <Text style={rl.rowDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const rl = StyleSheet.create({
  wrap:       { backgroundColor: '#0a0a12', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff08' },
  toggle:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  toggleTxt:  { color: '#FFB700', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  arrow:      { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  body:       { paddingHorizontal: 14, paddingBottom: 14, gap: 14, borderTopWidth: 1, borderTopColor: '#ffffff08', paddingTop: 14 },
  row:        { flexDirection: 'row', gap: 12 },
  rowNum:     { width: 22, height: 22, borderRadius: 6, backgroundColor: '#FFB70018', borderWidth: 1, borderColor: '#FFB70040', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  rowNumTxt:  { color: '#FFB700', fontSize: 10, fontWeight: '900' },
  rowLabel:   { color: '#FFB700', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  rowTitle:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  rowDesc:    { color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 16 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MonumentChallengeScreen({ route, navigation }) {
  const { monument, currentUser } = route.params || {};
  const { hasBondPass } = useBondPass();
  const { myMonuments, balance, spendCoins } = useWallet();
  const monumentCap   = hasBondPass ? MONUMENT_CAP.bond_pass : MONUMENT_CAP.standard;
  const atMonumentCap = myMonuments.length >= monumentCap;
  const canView    = hasBondPass;
  const canContrib = hasBondPass;

  const { getActiveChallenge, getCooldown, initiateChallenge, contribute, addComment, vote } = useChallenge();

  const [timeLeft, setTimeLeft] = useState(0);
  const [myVoted,  setMyVoted]  = useState(false);
  const myUsername = currentUser?.username || 'you';

  const activeChallenge = monument ? getActiveChallenge(monument.id) : null;
  const cooldownUntil   = monument ? getCooldown(monument.id)        : null;
  const isUnclaimed     = !monument?.holder;

  // Live countdown
  useEffect(() => {
    if (!activeChallenge) return;
    const tick = () => setTimeLeft(Math.max(0, activeChallenge.endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeChallenge?.id]);

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (!activeChallenge) return;
    const { challenger, holder } = activeChallenge.scores;
    const total = challenger.total + holder.total;
    const pct   = total === 0 ? 0.5 : challenger.total / total;
    Animated.spring(progressAnim, { toValue: pct, friction: 8, useNativeDriver: false }).start();
  }, [activeChallenge]);

  const myUsage = activeChallenge
    ? (activeChallenge.dailyUsage[`${myUsername}_${new Date().toISOString().slice(0, 10)}`]
       || { gifts: 0, bonds: 0, liveHours: 0, voted: false })
    : null;

  function handleInitiate() {
    if (!canContrib || !monument?.holder) return;

    if (atMonumentCap) {
      const upgradeNote = hasBondPass ? '' : '\n\nUpgrade to Bond Pass to hold up to 3 monuments.';
      Alert.alert(
        'Monument Slots Full',
        `You are holding ${myMonuments.length}/${monumentCap} monuments. Drop one before challenging for a new one.${upgradeNote}`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (balance < ENTRY_FEE) {
      Alert.alert(
        'Not Enough Coins',
        `You need ${ENTRY_FEE} Bond Coins to start a challenge. You have ${balance.toLocaleString()}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Start Challenge',
      `Challenge @${monument.holder} for ${monument.name}?\n\n${ENTRY_FEE} Bond Coins will be burned immediately and a 7-day contest begins. Cannot be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Start — ${ENTRY_FEE} Coins`,
          style: 'destructive',
          onPress: async () => {
            // Real, Bond Pass-gated, server-verified charge — replaces the old
            // local-only spendCoins() that never touched real coin_balance.
            try {
              const headers = await authHeader();
              const res = await fetch(`${SERVER_URL}/challenge/entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ winType: 'monument', targetId: monument.id }),
              });
              const data = await res.json();
              if (!res.ok) {
                Alert.alert('Could not start challenge', data.error || 'Please try again.');
                return;
              }
              spendCoins(data.feeCharged, 'challenge_entry', { monument: monument.name });
              const result = initiateChallenge(monument.id, myUsername, monument.holder);
              if (result.error) {
                Alert.alert('Challenge Error', result.error);
              }
            } catch {
              Alert.alert('Network Error', 'Could not reach the server. Try again.');
            }
          },
        },
      ]
    );
  }

  function handleContrib(type, amount) {
    if (!activeChallenge || !canContrib) return;
    const res = contribute(activeChallenge.id, 'challenger', type, amount, myUsername);
    if (res.error) Alert.alert('Daily limit reached', res.error);
  }

  function handleVote(side) {
    if (!activeChallenge || !canContrib) return;
    const res = vote(activeChallenge.id, side, myUsername);
    if (res.error) { Alert.alert('Already voted', res.error); return; }
    setMyVoted(true);
  }

  function handleComment(text) {
    if (!activeChallenge) return;
    addComment(activeChallenge.id, myUsername, text);
  }

  if (!monument) {
    return (
      <SafeAreaView style={s.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={s.centered}><Text style={s.emptyTxt}>Monument not found.</Text></View>
      </SafeAreaView>
    );
  }

  const { challenger, holder } = activeChallenge?.scores || {};
  const challengerLeading = activeChallenge && challenger.total >= holder.total;
  const totalPts          = activeChallenge ? challenger.total + holder.total : 0;
  const challengerPct     = totalPts === 0 ? 50 : Math.round(challenger.total / totalPts * 100);
  const comments          = activeChallenge?.comments || [];

  return (
    <SafeAreaView style={s.safe}>
      <Header onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Monument hero ── */}
          <LinearGradient colors={['#1a1200', '#100c00', '#08090d']} style={s.hero}>
            <LinearGradient colors={['#FFB700', '#FF8C00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.goldBar} />
            <Text style={s.heroIcon}>{monument.icon}</Text>
            <Text style={s.heroName}>{monument.name}</Text>
            <Text style={s.heroLoc}>{monument.location}  {monument.country}</Text>
            {monument.holder && !activeChallenge && !isUnclaimed && (
              <View style={s.holderRow}>
                <Text style={s.holderLabel}>HELD BY</Text>
                <Text style={s.holderName}>@{monument.holder}</Text>
                <Text style={s.holderCoins}>{monument.coinsEarned.toLocaleString()} BC earned</Text>
              </View>
            )}
          </LinearGradient>

          {/* ── Free tier gate ── */}
          {!canView ? (
            <FreeGate navigation={navigation} />
          ) : isUnclaimed ? (

            /* ── Unclaimed ── */
            <View style={s.section}>
              <View style={s.card}>
                <View style={s.cardBadge}><Text style={s.cardBadgeTxt}>UNCLAIMED</Text></View>
                <Text style={s.cardTitle}>Unclaimed Monument</Text>
                <Text style={s.cardSub}>
                  Be the first to own {monument.name} and earn +2% royalty on every gift sent during streams from {monument.location}.
                </Text>
                {canContrib ? (
                  <TouchableOpacity
                    style={s.primaryBtn}
                    onPress={() => Alert.alert(
                      'Claim Monument',
                      `Claim ${monument.name}?\n\nYou'll earn +2% royalty on all gifts from ${monument.location} streams.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Claim Free', onPress: () => navigation.goBack() },
                      ]
                    )}
                    activeOpacity={0.88}
                  >
                    <LinearGradient colors={['#FFB700', '#FF8C00']} style={s.primaryGrad}>
                      <Text style={s.primaryTxt}>CLAIM FREE</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <PlusViewBanner navigation={navigation} />
                )}
              </View>
            </View>

          ) : cooldownUntil && !activeChallenge ? (

            /* ── Cooldown ── */
            <View style={s.section}>
              <View style={s.card}>
                <View style={s.cardBadge}><Text style={s.cardBadgeTxt}>COOLDOWN</Text></View>
                <Text style={s.cardTitle}>Challenge Cooldown</Text>
                <Text style={s.cardSub}>
                  Next challenge opens on{' '}
                  <Text style={{ color: '#FFB700' }}>{new Date(cooldownUntil).toLocaleDateString()}</Text>.
                </Text>
              </View>
            </View>

          ) : activeChallenge ? (

            /* ── Active challenge ── */
            <>
              {/* Timer */}
              <View style={s.section}>
                <LinearGradient colors={['#0d0f1a', '#08090d']} style={s.timerCard}>
                  <View style={s.timerDot} />
                  <Text style={s.timerLabel}>CHALLENGE ACTIVE</Text>
                  <Text style={s.timerValue}>{formatCountdown(timeLeft)}</Text>
                  <Text style={s.timerSub}>remaining</Text>
                </LinearGradient>
              </View>

              {/* Scoreboard */}
              <View style={[s.section, { gap: 8 }]}>
                <Text style={s.sectionTitle}>LIVE SCOREBOARD</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <ScoreSide label="CHALLENGER" username={activeChallenge.challengerUsername} scores={challenger} accent="#ef4444" isLeading={challengerLeading} />
                  <ScoreSide label="HOLDER"     username={activeChallenge.holderUsername}     scores={holder}     accent="#FFB700" isLeading={!challengerLeading} />
                </View>
                {/* Progress bar */}
                <View style={s.progressWrap}>
                  <Text style={[s.progressLabel, { color: '#ef4444' }]}>{challengerPct}%</Text>
                  <View style={s.progressBg}>
                    <Animated.View style={[s.progressFill, {
                      width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    }]} />
                  </View>
                  <Text style={[s.progressLabel, { color: '#FFB700' }]}>{100 - challengerPct}%</Text>
                </View>
                <Text style={s.leadingTxt}>
                  {challengerLeading
                    ? `@${activeChallenge.challengerUsername} leading by ${(challenger.total - holder.total).toLocaleString()} pts`
                    : `@${activeChallenge.holderUsername} defending with ${(holder.total - challenger.total).toLocaleString()} pts lead`}
                </Text>
              </View>

              {/* Pro contribution panel OR Plus view banner */}
              {canContrib ? (
                <View style={[s.section, { gap: 10 }]}>
                  <Text style={s.sectionTitle}>SUPPORT THE CHALLENGER</Text>
                  <Text style={s.sectionSub}>Daily caps prevent spam — all types count equally.</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <ContribCard title="Gift Coins"   rateLine={`+1pt/coin · max ${DAILY_LIMITS.gifts}/day`}     used={myUsage?.gifts || 0}     cap={DAILY_LIMITS.gifts}     unit="coins" amounts={[50, 250]} onContrib={a => handleContrib('gifts', a)}     disabled={(myUsage?.gifts || 0) >= DAILY_LIMITS.gifts} />
                    <ContribCard title="Bond Region"  rateLine={`+${POINT_RATES.bonds}pts/bond · max ${DAILY_LIMITS.bonds}/day`} used={myUsage?.bonds || 0}     cap={DAILY_LIMITS.bonds}     unit="bonds" amounts={[1, 3]}   onContrib={a => handleContrib('bonds', a)}     disabled={(myUsage?.bonds || 0) >= DAILY_LIMITS.bonds} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <ContribCard title="Stream Live"  rateLine={`+${POINT_RATES.liveHours}pts/hr · max ${DAILY_LIMITS.liveHours}hrs/day`} used={myUsage?.liveHours || 0} cap={DAILY_LIMITS.liveHours} unit="hrs"   amounts={[0.5, 1]} onContrib={a => handleContrib('liveHours', a)} disabled={(myUsage?.liveHours || 0) >= DAILY_LIMITS.liveHours} />
                    {/* Vote card */}
                    <View style={cc.card}>
                      <Text style={cc.title}>Community Vote</Text>
                      <Text style={cc.rate}>+{POINT_RATES.votes} pts · once per contest</Text>
                      {myVoted || myUsage?.voted ? (
                        <Text style={[cc.rate, { color: '#57f287', marginTop: 8 }]}>✓ Vote cast</Text>
                      ) : (
                        <View style={{ gap: 5, marginTop: 6 }}>
                          <TouchableOpacity style={[cc.btn, { borderColor: '#ef444435', backgroundColor: '#ef444415' }]} onPress={() => handleVote('challenger')}>
                            <Text style={[cc.btnTxt, { color: '#ef4444' }]}>Challenger</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={cc.btn} onPress={() => handleVote('holder')}>
                            <Text style={cc.btnTxt}>Holder</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={s.section}>
                  <PlusViewBanner navigation={navigation} />
                </View>
              )}

              {/* Comments — Plus + Pro */}
              <View style={s.section}>
                <CommentsSection
                  comments={comments}
                  onPost={handleComment}
                  username={myUsername}
                />
              </View>
            </>

          ) : (

            /* ── No active challenge: initiate CTA (Pro) or Plus view ── */
            <View style={s.section}>
              {canContrib ? (
                <View style={s.card}>
                  <View style={s.cardBadge}><Text style={s.cardBadgeTxt}>CHALLENGE</Text></View>
                  <Text style={s.cardTitle}>Challenge for this Monument</Text>
                  <Text style={s.cardSub}>
                    @{monument.holder} currently holds {monument.name} and earns +2% royalty from {monument.location} streams. Win a 7-day contest to take it.
                  </Text>
                  <View style={s.rulesList}>
                    {[
                      `Entry fee: ${ENTRY_FEE} Bond Coins (burned)`,
                      'Contest: 7 days of multi-dimension scoring',
                      'Spam-protected: daily caps per contribution type',
                      '30-day cooldown between challenges',
                    ].map((txt, i) => (
                      <View key={i} style={s.ruleRow}>
                        <View style={s.ruleDot} />
                        <Text style={s.ruleItem}>{txt}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={s.primaryBtn} onPress={handleInitiate} activeOpacity={0.88}>
                    <LinearGradient colors={['#ef4444', '#b91c1c']} style={s.primaryGrad}>
                      <Text style={s.primaryTxt}>INITIATE CHALLENGE — {ENTRY_FEE} COINS</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.card}>
                  <View style={s.cardBadge}><Text style={s.cardBadgeTxt}>OPEN</Text></View>
                  <Text style={s.cardTitle}>No Active Challenge</Text>
                  <Text style={s.cardSub}>@{monument.holder} is the current holder. A Pro member can initiate a 7-day challenge to try to claim this monument.</Text>
                  <PlusViewBanner navigation={navigation} />
                </View>
              )}
            </View>
          )}

          {/* ── Rules (Plus + Pro) ── */}
          {canView && (
            <View style={s.section}>
              <RulesSection />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ onBack }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} style={s.back}>
        <Text style={s.backTxt}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={s.headerTitle}>MONUMENT CHALLENGE</Text>
      <View style={{ width: 60 }} />
    </View>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#08090d' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  back:           { paddingVertical: 4, paddingRight: 12 },
  backTxt:        { color: '#FFB700', fontSize: 16, fontWeight: '700' },
  headerTitle:    { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  scroll:         { paddingBottom: 60, gap: 0 },
  section:        { padding: 16, gap: 10 },
  sectionTitle:   { color: '#FFB700', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  sectionSub:     { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:       { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  // Hero
  hero:           { padding: 24, alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#FFB70020' },
  goldBar:        { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  heroIcon:       { fontSize: 52, marginTop: 8 },
  heroName:       { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 },
  heroLoc:        { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  holderRow:      { alignItems: 'center', marginTop: 8, gap: 2 },
  holderLabel:    { color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 2 },
  holderName:     { color: '#FFB700', fontSize: 15, fontWeight: '800' },
  holderCoins:    { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  // Generic card
  card:           { backgroundColor: '#0d0f1a', borderRadius: 16, padding: 20, gap: 12, borderWidth: 1, borderColor: '#ffffff08' },
  cardBadge:      { alignSelf: 'flex-start', backgroundColor: '#FFB70015', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FFB70040' },
  cardBadgeTxt:   { color: '#FFB700', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  cardTitle:      { color: '#fff', fontSize: 18, fontWeight: '900' },
  cardSub:        { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 20 },
  rulesList:      { gap: 8 },
  ruleRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFB700', marginTop: 6, flexShrink: 0 },
  ruleItem:       { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18, flex: 1 },

  // Primary button
  primaryBtn:     { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  primaryGrad:    { paddingVertical: 14, alignItems: 'center' },
  primaryTxt:     { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  // Timer
  timerCard:      { borderRadius: 14, padding: 16, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#ef444430' },
  timerDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginBottom: 4 },
  timerLabel:     { color: '#ef4444', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  timerValue:     { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  timerSub:       { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  // Progress
  progressWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel:  { fontSize: 11, fontWeight: '800', width: 32, textAlign: 'center' },
  progressBg:     { flex: 1, height: 6, backgroundColor: '#FFB70030', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: '#ef4444', borderRadius: 3 },
  leadingTxt:     { color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'center' },
});
