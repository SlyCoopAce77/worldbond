import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Animated, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useBondPass } from '../context/PremiumContext';
import { useWallet, STAMP_CAP } from '../context/WalletContext';
import {
  useChallenge, DAILY_LIMITS, POINT_RATES, ENTRY_FEE, FEATURED_FEE,
  getFeaturedFlag, getNextFeaturedFlag, isStampDropped,
} from '../context/ChallengeContext';
import { getFlagName } from '../utils/countryUtils';

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
          { label: 'Gifts',   val: scores.gifts     },
          { label: 'Bonds',   val: scores.bonds     },
          { label: 'Live',    val: scores.liveHours },
          { label: 'Votes',   val: scores.votes     },
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
  breakRow:       { flexDirection: 'row', alignItems: 'center' },
  breakLabel:     { color: 'rgba(255,255,255,0.4)', fontSize: 11, flex: 1 },
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
            <Text style={[cc.btnTxt, disabled && { color: 'rgba(255,255,255,0.2)' }]}>+{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const cc = StyleSheet.create({
  card:   { flex: 1, backgroundColor: '#0d0f1a', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#ffffff08', gap: 5 },
  title:  { color: '#fff', fontSize: 12, fontWeight: '800' },
  rate:   { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  barBg:  { height: 3, backgroundColor: '#1a1a2e', borderRadius: 2, overflow: 'hidden' },
  barFill:{ height: '100%', backgroundColor: '#4fc3f7', borderRadius: 2 },
  usage:  { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  btns:   { flexDirection: 'row', gap: 5, marginTop: 4 },
  btn:    { flex: 1, backgroundColor: '#4fc3f715', borderRadius: 8, borderWidth: 1, borderColor: '#4fc3f735', alignItems: 'center', paddingVertical: 6 },
  btnOff: { backgroundColor: '#ffffff05', borderColor: '#ffffff08' },
  btnTxt: { color: '#4fc3f7', fontSize: 11, fontWeight: '800' },
});

// ── Comments section (Plus + Pro) ─────────────────────────────────────────────
function CommentsSection({ comments = [], onPost }) {
  const [draft, setDraft] = useState('');
  function submit() {
    if (!draft.trim()) return;
    onPost(draft);
    setDraft('');
  }
  return (
    <View style={cm.wrap}>
      <Text style={cm.title}>
        COMMENTS  <Text style={cm.count}>{comments.length}</Text>
      </Text>
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
          placeholderTextColor="rgba(255,255,255,0.25)"
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
  title:      { color: '#4fc3f7', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  count:      { color: 'rgba(255,255,255,0.4)', fontWeight: '400', letterSpacing: 0 },
  empty:      { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  row:        { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avatar:     { width: 32, height: 32, borderRadius: 10, backgroundColor: '#0d1a20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:  { color: '#4fc3f7', fontSize: 14, fontWeight: '800' },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  user:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  time:       { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  text:       { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 },
  inputRow:   { flexDirection: 'row', gap: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ffffff08', paddingTop: 12 },
  input:      { flex: 1, backgroundColor: '#111218', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#ffffff0c' },
  sendBtn:    { backgroundColor: '#4fc3f7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sendBtnOff: { backgroundColor: '#1a1a1a' },
  sendTxt:    { color: '#000', fontSize: 12, fontWeight: '900' },
});

// ── Free-tier gate ────────────────────────────────────────────────────────────
function FreeGate({ navigation }) {
  return (
    <View style={gt.wrap}>
      <View style={gt.lockBox}>
        <Text style={gt.lockTxt}>PLUS ONLY</Text>
      </View>
      <Text style={gt.title}>Bond Plus &amp; Pro Only</Text>
      <Text style={gt.sub}>Country Stamp challenges are available to WorldBond Plus and Pro members.</Text>
      <TouchableOpacity style={gt.btn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
        <LinearGradient colors={['#4fc3f7', '#0288d1']} style={gt.btnGrad}>
          <Text style={gt.btnTxt}>Upgrade Now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
const gt = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  lockBox: { backgroundColor: 'rgba(79,195,247,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#4fc3f740' },
  lockTxt: { color: '#4fc3f7', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title:   { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  sub:     { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btn:     { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnGrad: { paddingHorizontal: 32, paddingVertical: 14 },
  btnTxt:  { color: '#000', fontSize: 15, fontWeight: '900' },
});

// ── Plus view banner ──────────────────────────────────────────────────────────
function PlusViewBanner({ navigation }) {
  return (
    <View style={pb.wrap}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={pb.title}>Viewing as WorldBond Plus</Text>
        <Text style={pb.sub}>Upgrade to Pro to contribute, vote, and initiate challenges.</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Subscription')} style={pb.btn} activeOpacity={0.85}>
        <Text style={pb.btnTxt}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}
const pb = StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0d0f1a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#4fc3f720' },
  title:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  sub:    { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  btn:    { backgroundColor: '#4fc3f720', borderRadius: 10, borderWidth: 1, borderColor: '#4fc3f745', paddingHorizontal: 12, paddingVertical: 8 },
  btnTxt: { color: '#4fc3f7', fontSize: 12, fontWeight: '800' },
});

// ── Rules ─────────────────────────────────────────────────────────────────────
function RulesSection() {
  const [open, setOpen] = useState(false);
  const RULES = [
    ['Gift Coins during country streams',  `+1 pt per coin · max ${DAILY_LIMITS.gifts} coins/day\nPrevents whales from buying the win`],
    ['Bond with users from that country',  `+${POINT_RATES.bonds} pts per bond · max ${DAILY_LIMITS.bonds}/day\nReal connections, not repeat bonding`],
    ['Stream live from that country',      `+${POINT_RATES.liveHours} pts per hour · max ${DAILY_LIMITS.liveHours} hrs/day\nRequires genuine presence in that country`],
    ['Community vote',                     `+${POINT_RATES.votes} pts · once per user per contest\nCommunity sentiment — cannot be gamed`],
    ['7-day contest',                      `${ENTRY_FEE} Bond Coins to initiate (burned)\nHighest total points after 7 days wins the stamp`],
    ['30-day cooldown',                    'Same stamp can only be challenged once every 30 days'],
  ];
  return (
    <View style={rl.wrap}>
      <TouchableOpacity style={rl.toggle} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <Text style={rl.toggleTxt}>HOW STAMP CHALLENGES WORK</Text>
        <Text style={rl.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={rl.body}>
          {RULES.map(([title, desc], i) => (
            <View key={i} style={rl.row}>
              <View style={rl.rowNum}>
                <Text style={rl.rowNumTxt}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
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
  wrap:      { backgroundColor: '#0a0a12', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff08' },
  toggle:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  toggleTxt: { color: '#4fc3f7', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  arrow:     { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  body:      { paddingHorizontal: 14, paddingBottom: 14, gap: 14, borderTopWidth: 1, borderTopColor: '#ffffff08', paddingTop: 14 },
  row:       { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowNum:    { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4fc3f720', borderWidth: 1, borderColor: '#4fc3f740', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  rowNumTxt: { color: '#4fc3f7', fontSize: 10, fontWeight: '900' },
  rowTitle:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  rowDesc:   { color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 16 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CountryStampChallengeScreen({ route, navigation }) {
  const { stamp, currentUser } = route.params || {};

  const { hasBondPass } = useBondPass();
  const { myStamps } = useWallet();
  const stampCap   = hasBondPass ? STAMP_CAP.bond_pass : STAMP_CAP.standard;
  const atStampCap = myStamps.length >= stampCap;
  const canView    = hasBondPass;
  const canContrib = hasBondPass;

  const {
    getActiveStampChallenge, getStampCooldown,
    initiateStampChallenge, contributeStamp,
    addStampComment, voteStamp,
  } = useChallenge();

  const [timeLeft, setTimeLeft] = useState(0);
  const [myVoted,  setMyVoted]  = useState(false);
  const myUsername   = currentUser?.username || 'you';
  const flag         = stamp?.flag;
  const countryName  = flag ? getFlagName(flag) : '';
  const isDropped    = isStampDropped(stamp);
  const isUnclaimed  = !stamp?.holder || isDropped;
  const isFeatured   = flag === getFeaturedFlag();
  const nextFeatured = getNextFeaturedFlag();
  const effectiveFee = isFeatured ? FEATURED_FEE : ENTRY_FEE;

  const activeChallenge = flag ? getActiveStampChallenge(flag)  : null;
  const cooldownUntil   = flag ? getStampCooldown(flag)         : null;

  useEffect(() => {
    if (!activeChallenge) return;
    const tick = () => setTimeLeft(Math.max(0, activeChallenge.endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeChallenge?.id]);

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
    if (!canContrib || !stamp?.holder) return;
    if (atStampCap) {
      const upgradeNote = hasBondPass ? '' : '\n\nUpgrade to Bond Pass to hold up to 4 stamps.';
      Alert.alert(
        'Stamp Slots Full',
        `You are holding ${myStamps.length}/${stampCap} stamps. Drop a stamp before challenging for a new one.${upgradeNote}`,
        [{ text: 'OK' }]
      );
      return;
    }
    const feeNote = isFeatured
      ? `Burns ${effectiveFee} Bond Coins (50% off — featured this week).`
      : `Burns ${effectiveFee} Bond Coins.`;
    Alert.alert(
      'Start Stamp Challenge',
      `Challenge @${stamp.holder} for the ${countryName} stamp?\n\n${feeNote} Win a 7-day contest to take it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Start — ${effectiveFee} Coins`,
          style: 'destructive',
          onPress: () => {
            const res = initiateStampChallenge(flag, myUsername, stamp.holder);
            if (res.error) Alert.alert('Error', res.error);
          },
        },
      ]
    );
  }

  function handleContrib(type, amount) {
    if (!canContrib) return;
    const res = contributeStamp(flag, 'challenger', type, amount, myUsername);
    if (res.error) Alert.alert('Daily limit reached', res.error);
  }

  function handleVote(side) {
    if (!canContrib) return;
    const res = voteStamp(flag, side, myUsername);
    if (res.error) { Alert.alert('Already voted', res.error); return; }
    setMyVoted(true);
  }

  function handleComment(text) {
    addStampComment(flag, myUsername, text);
  }

  if (!stamp || !flag) {
    return (
      <SafeAreaView style={s.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={s.centered}><Text style={s.emptyTxt}>Stamp not found.</Text></View>
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

          {/* ── Featured banner ── */}
          {isFeatured && (
            <LinearGradient colors={['#2a0018', '#1a0010']} style={s.featuredBanner}>
              <View style={s.featuredBannerRow}>
                <View style={s.featuredPill}><Text style={s.featuredPillTxt}>FEATURED THIS WEEK</Text></View>
                <Text style={s.featuredBannerDesc}>
                  50% off entry fee · next up {nextFeatured} Sunday
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* ── Country stamp hero ── */}
          <LinearGradient colors={['#001a2e', '#001018', '#08090d']} style={s.hero}>
            <LinearGradient colors={['#4fc3f7', '#0288d1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.blueBar} />
            <Text style={s.heroFlag}>{flag}</Text>
            <Text style={s.heroName}>{countryName}</Text>
            <Text style={s.heroSub}>Country Stamp · 1 of 195 · +3% royalty</Text>
            {isDropped && (
              <View style={[s.holderRow, { borderColor: '#ff6b0030' }]}>
                <Text style={[s.holderLabel, { color: '#ff6b00' }]}>DROPPED</Text>
                <Text style={s.holderName}>@{stamp.holder} went inactive</Text>
                <Text style={s.holderCoins}>30+ days no activity — free to claim</Text>
              </View>
            )}
            {stamp.holder && !isDropped && !activeChallenge && !isUnclaimed && (
              <View style={s.holderRow}>
                <Text style={s.holderLabel}>HELD BY</Text>
                <Text style={s.holderName}>@{stamp.holder}</Text>
                <Text style={s.holderCoins}>{stamp.coinsEarned?.toLocaleString()} BC earned</Text>
              </View>
            )}
          </LinearGradient>

          {/* ── Free gate ── */}
          {!canView ? (
            <FreeGate navigation={navigation} />

          ) : isUnclaimed ? (
            /* ── Unclaimed or Dropped ── */
            <View style={s.section}>
              <View style={s.card}>
                <View style={[s.cardBadge, isDropped && { backgroundColor: '#ff6b0018', borderColor: '#ff6b0040' }]}>
                  <Text style={[s.cardBadgeTxt, isDropped && { color: '#ff6b00' }]}>
                    {isDropped ? 'DROPPED' : 'UNCLAIMED'}
                  </Text>
                </View>
                <Text style={s.cardTitle}>
                  {isDropped ? `${countryName} Stamp — Up for Grabs` : `Unclaimed Country Stamp`}
                </Text>
                <Text style={s.cardSub}>
                  {isDropped
                    ? `@${stamp.holder} held this stamp but went inactive for 30+ days. It's now free to claim — no coins required.`
                    : `Be the first to own the ${countryName} stamp and earn +3% royalty on every gift sent during streams from ${countryName}.`
                  }
                </Text>
                {canContrib ? (
                  <TouchableOpacity
                    style={s.primaryBtn}
                    onPress={() => Alert.alert(
                      isDropped ? 'Claim Dropped Stamp' : 'Claim Stamp',
                      `Claim the ${countryName} stamp?\n\nYou'll earn +3% royalty on all gifts sent during ${countryName} streams.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Claim Free', onPress: () => navigation.goBack() },
                      ]
                    )}
                    activeOpacity={0.88}
                  >
                    <LinearGradient colors={['#4fc3f7', '#0288d1']} style={s.primaryGrad}>
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
                  <Text style={{ color: '#4fc3f7' }}>{new Date(cooldownUntil).toLocaleDateString()}</Text>.
                </Text>
              </View>
            </View>

          ) : activeChallenge ? (
            /* ── Active challenge ── */
            <>
              {/* Timer */}
              <View style={s.section}>
                <LinearGradient colors={['#001a2e', '#08090d']} style={s.timerCard}>
                  <View style={s.timerDot} />
                  <Text style={s.timerLabel}>STAMP CHALLENGE ACTIVE</Text>
                  <Text style={s.timerValue}>{formatCountdown(timeLeft)}</Text>
                  <Text style={s.timerSub}>remaining · {countryName}</Text>
                </LinearGradient>
              </View>

              {/* Scoreboard */}
              <View style={[s.section, { gap: 8 }]}>
                <Text style={s.sectionTitle}>LIVE SCOREBOARD</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <ScoreSide label="CHALLENGER" username={activeChallenge.challengerUsername} scores={challenger} accent="#ef4444" isLeading={challengerLeading} />
                  <ScoreSide label="HOLDER"     username={activeChallenge.holderUsername}     scores={holder}     accent="#4fc3f7" isLeading={!challengerLeading} />
                </View>
                <View style={s.progressWrap}>
                  <Text style={[s.progressLabel, { color: '#ef4444' }]}>{challengerPct}%</Text>
                  <View style={s.progressBg}>
                    <Animated.View style={[s.progressFill, {
                      width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    }]} />
                  </View>
                  <Text style={[s.progressLabel, { color: '#4fc3f7' }]}>{100 - challengerPct}%</Text>
                </View>
                <Text style={s.leadingTxt}>
                  {challengerLeading
                    ? `@${activeChallenge.challengerUsername} leading by ${(challenger.total - holder.total).toLocaleString()} pts`
                    : `@${activeChallenge.holderUsername} defending with ${(holder.total - challenger.total).toLocaleString()} pts lead`}
                </Text>
              </View>

              {/* Contribution panel (Pro) or Plus banner */}
              {canContrib ? (
                <View style={[s.section, { gap: 10 }]}>
                  <Text style={s.sectionTitle}>SUPPORT THE CHALLENGER</Text>
                  <Text style={s.sectionSub}>Daily caps prevent spam — all types count equally.</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <ContribCard title="Gift Coins"  rateLine={`+1pt/coin · max ${DAILY_LIMITS.gifts}/day`}                             used={myUsage?.gifts || 0}     cap={DAILY_LIMITS.gifts}     unit="coins" amounts={[50, 250]} onContrib={a => handleContrib('gifts', a)}     disabled={(myUsage?.gifts || 0) >= DAILY_LIMITS.gifts} />
                    <ContribCard title="Bond Region" rateLine={`+${POINT_RATES.bonds}pts/bond · max ${DAILY_LIMITS.bonds}/day`}         used={myUsage?.bonds || 0}     cap={DAILY_LIMITS.bonds}     unit="bonds" amounts={[1, 3]}   onContrib={a => handleContrib('bonds', a)}     disabled={(myUsage?.bonds || 0) >= DAILY_LIMITS.bonds} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <ContribCard title="Stream Live" rateLine={`+${POINT_RATES.liveHours}pts/hr · max ${DAILY_LIMITS.liveHours}hrs/day`} used={myUsage?.liveHours || 0} cap={DAILY_LIMITS.liveHours} unit="hrs"   amounts={[0.5, 1]} onContrib={a => handleContrib('liveHours', a)} disabled={(myUsage?.liveHours || 0) >= DAILY_LIMITS.liveHours} />
                    {/* Vote card */}
                    <View style={cc.card}>
                      <Text style={cc.title}>Community Vote</Text>
                      <Text style={cc.rate}>+{POINT_RATES.votes} pts · once per contest</Text>
                      {myVoted || myUsage?.voted ? (
                        <Text style={[cc.rate, { color: '#57f287', marginTop: 8 }]}>Vote cast</Text>
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
                <CommentsSection comments={comments} onPost={handleComment} />
              </View>
            </>

          ) : (
            /* ── No active challenge ── */
            <View style={s.section}>
              {canContrib ? (
                <View style={s.card}>
                  <View style={s.cardBadge}><Text style={s.cardBadgeTxt}>CHALLENGE</Text></View>
                  <Text style={s.cardTitle}>Challenge for {countryName}</Text>
                  <Text style={s.cardSub}>
                    @{stamp.holder} holds this stamp and earns +3% royalty on every gift sent during {countryName} streams. Win a 7-day contest to claim it.
                  </Text>
                  {isFeatured && (
                    <View style={s.featuredDiscount}>
                      <Text style={s.featuredDiscountTxt}>
                        Featured this week — entry fee halved to {FEATURED_FEE} coins
                      </Text>
                    </View>
                  )}
                  <View style={s.rulesList}>
                    {[
                      `Entry fee: ${effectiveFee} Bond Coins${isFeatured ? ` (50% off, was ${ENTRY_FEE})` : ' (burned)'}`,
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
                      <Text style={[s.primaryTxt, { color: '#fff' }]}>INITIATE CHALLENGE — {effectiveFee} COINS</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.card}>
                  <View style={s.cardBadge}><Text style={s.cardBadgeTxt}>OPEN</Text></View>
                  <Text style={s.cardTitle}>No Active Challenge</Text>
                  <Text style={s.cardSub}>
                    @{stamp.holder} holds the {countryName} stamp. A Pro member can initiate a 7-day challenge to claim it.
                  </Text>
                  <PlusViewBanner navigation={navigation} />
                </View>
              )}
            </View>
          )}

          {/* Rules — Plus + Pro */}
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
      <Text style={s.headerTitle}>COUNTRY STAMP CHALLENGE</Text>
      <View style={{ width: 60 }} />
    </View>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#08090d' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  back:           { paddingVertical: 4, paddingRight: 12 },
  backTxt:        { color: '#4fc3f7', fontSize: 16, fontWeight: '700' },
  headerTitle:    { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  scroll:         { paddingBottom: 60 },
  section:        { padding: 16, gap: 10 },
  sectionTitle:   { color: '#4fc3f7', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  sectionSub:     { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:       { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  // Hero
  hero:           { padding: 28, alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#4fc3f720' },
  blueBar:        { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  heroFlag:       { fontSize: 64, marginTop: 8 },
  heroName:       { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 },
  heroSub:        { color: '#4fc3f7', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  holderRow:      { alignItems: 'center', marginTop: 8, gap: 2 },
  holderLabel:    { color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 2 },
  holderName:     { color: '#4fc3f7', fontSize: 15, fontWeight: '800' },
  holderCoins:    { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  // Card
  card:           { backgroundColor: '#0d0f1a', borderRadius: 16, padding: 20, gap: 12, borderWidth: 1, borderColor: '#ffffff08' },
  cardBadge:      { alignSelf: 'flex-start', backgroundColor: 'rgba(79,195,247,0.12)', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#4fc3f730' },
  cardBadgeTxt:   { color: '#4fc3f7', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  cardTitle:      { color: '#fff', fontSize: 18, fontWeight: '900' },
  cardSub:        { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 20 },
  rulesList:      { gap: 8 },
  ruleRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4fc3f7', marginTop: 5, flexShrink: 0 },
  ruleItem:       { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18, flex: 1 },

  // Primary button
  primaryBtn:     { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  primaryGrad:    { paddingVertical: 14, alignItems: 'center' },
  primaryTxt:     { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  // Timer
  timerCard:      { borderRadius: 14, padding: 16, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#4fc3f730' },
  timerDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4fc3f7', marginBottom: 4 },
  timerLabel:     { color: '#4fc3f7', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  timerValue:     { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  timerSub:       { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  // Progress
  progressWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel:  { fontSize: 11, fontWeight: '800', width: 32, textAlign: 'center' },
  progressBg:     { flex: 1, height: 6, backgroundColor: '#4fc3f730', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: '#ef4444', borderRadius: 3 },
  leadingTxt:     { color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'center' },

  // Featured banner (top of screen)
  featuredBanner:     { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FF008025' },
  featuredBannerRow:  { gap: 6 },
  featuredPill:       { alignSelf: 'flex-start', backgroundColor: '#FF0080', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  featuredPillTxt:    { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  featuredBannerDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },

  // Featured discount callout inside challenge card
  featuredDiscount:    { backgroundColor: '#FF008015', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#FF008030' },
  featuredDiscountTxt: { color: '#FF0080', fontSize: 12, fontWeight: '700' },
});
