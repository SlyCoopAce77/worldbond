import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { WorldMark } from '../components/BondLogo';
import { usePremium } from '../context/PremiumContext';
import {
  useWallet, coinsToUSD,
  DEMO_TOP_CREATORS, BOND_MONUMENTS,
} from '../context/WalletContext';

// ── Payout system constants ───────────────────────────────────────────────────
// Free is intentionally low to drive upgrades — the 20% gap vs Plus is the hook
const TIER_PAYOUT_RATE = { free: 0.50, plus: 0.70, pro: 0.80 };
const MIN_PAYOUT_COINS = 5000;   // ~$14 minimum; keeps transaction costs manageable
const TOP_CREATOR_RATE = 0.85;   // top 3 monthly creators earn this

const TABS = ['Earnings', 'Spending', 'Creators', 'Footprints'];

// ── BondCoin — WorldMark as the in-app currency icon ─────────────────────────
function BondCoin({ size = 18 }) {
  return <WorldMark size={size} color="#FFB700" bondColor="#FFB700" />;
}

// ── CoinRow — Bond logo + amount side by side ─────────────────────────────────
function CoinRow({ amount, textStyle, size = 18 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <BondCoin size={size} />
      <Text style={textStyle}>
        {typeof amount === 'number' ? amount.toLocaleString() : amount}
      </Text>
    </View>
  );
}

function relTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sourceLabel(source) {
  const map = {
    gift_received: '🎁 Gift received',
    stamp_royalty: '🌍 Stamp royalty',
    live_gift:     '🎁 Gift sent',
    demo_seed:     '🎉 Welcome bonus',
    challenge_win: '🏆 Challenge win',
  };
  return map[source] || source;
}

// ── Payout requirements checklist ─────────────────────────────────────────────
function PayoutRequirements({ reqs }) {
  return (
    <View style={pr.wrap}>
      {reqs.map(r => (
        <View key={r.id} style={pr.row}>
          <View style={[pr.dot, r.met ? pr.dotMet : pr.dotUnmet]} />
          <Text style={[pr.label, !r.met && pr.labelUnmet]}>{r.label}</Text>
          {!r.met && r.onAction && (
            <TouchableOpacity style={pr.actionBtn} onPress={r.onAction}>
              <Text style={pr.actionTxt}>{r.actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}
const pr = StyleSheet.create({
  wrap:      { gap: 10, marginVertical: 14 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  dotMet:    { backgroundColor: '#4ade80' },
  dotUnmet:  { backgroundColor: '#ef4444' },
  label:     { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  labelUnmet:{ color: 'rgba(255,255,255,0.45)' },
  actionBtn: { backgroundColor: '#FFB70020', borderWidth: 1, borderColor: '#FFB700',
               borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  actionTxt: { color: '#FFB700', fontSize: 11, fontWeight: '800' },
});

// ── Creator Podium ─────────────────────────────────────────────────────────────
function bonusPct(creator) {
  return Math.round((creator.payoutRate - 0.70) * 100);
}

function CreatorPodium({ creators }) {
  const [first, second, third] = creators;
  return (
    <View style={pod.wrap}>
      <View style={[pod.col, { marginTop: 28 }]}>
        <View style={[pod.avatar, { backgroundColor: '#555555' }]}>
          <Text style={pod.avatarTxt}>{second.username[0]}</Text>
        </View>
        <Text style={pod.rank}>{second.badge.icon}</Text>
        <Text style={pod.name} numberOfLines={1}>{second.username}</Text>
        <Text style={pod.flag}>{second.country}</Text>
        <LinearGradient colors={['#555555', '#444444']} style={[pod.plinth, { height: 60 }]}>
          <CoinRow amount={`${(second.coinsEarned / 1000).toFixed(1)}k`} textStyle={pod.plinthCoins} size={13} />
          <Text style={pod.plinthBonus}>+{bonusPct(second)}%</Text>
        </LinearGradient>
      </View>

      <View style={pod.col}>
        <View style={[pod.avatar, pod.avatarGold]}>
          <Text style={pod.avatarTxt}>{first.username[0]}</Text>
        </View>
        <Text style={pod.rank}>{first.badge.icon}</Text>
        <Text style={pod.name} numberOfLines={1}>{first.username}</Text>
        <Text style={pod.flag}>{first.country}</Text>
        <LinearGradient colors={['#c8a600', '#a07800']} style={[pod.plinth, { height: 90 }]}>
          <CoinRow amount={`${(first.coinsEarned / 1000).toFixed(1)}k`} textStyle={pod.plinthCoins} size={13} />
          <Text style={pod.plinthBonus}>+{bonusPct(first)}%</Text>
        </LinearGradient>
      </View>

      <View style={[pod.col, { marginTop: 48 }]}>
        <View style={[pod.avatar, { backgroundColor: '#7c4a1e' }]}>
          <Text style={pod.avatarTxt}>{third.username[0]}</Text>
        </View>
        <Text style={pod.rank}>{third.badge.icon}</Text>
        <Text style={pod.name} numberOfLines={1}>{third.username}</Text>
        <Text style={pod.flag}>{third.country}</Text>
        <LinearGradient colors={['#7c4a1e', '#5a3210']} style={[pod.plinth, { height: 40 }]}>
          <CoinRow amount={`${(third.coinsEarned / 1000).toFixed(1)}k`} textStyle={pod.plinthCoins} size={13} />
          <Text style={pod.plinthBonus}>+{bonusPct(third)}%</Text>
        </LinearGradient>
      </View>
    </View>
  );
}
const pod = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
                gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  col:        { alignItems: 'center', flex: 1 },
  avatar:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center',
                justifyContent: 'center', marginBottom: 4 },
  avatarGold: { backgroundColor: '#b8860b', borderWidth: 2, borderColor: '#ffd700' },
  avatarTxt:  { color: '#fff', fontSize: 22, fontWeight: '900' },
  rank:       { fontSize: 20, marginBottom: 2 },
  name:       { color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  flag:       { fontSize: 16, marginTop: 2, marginBottom: 6 },
  plinth:     { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10,
                alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 2 },
  plinthCoins:{ color: '#fff', fontSize: 11, fontWeight: '800' },
  plinthBonus:{ color: 'rgba(255,255,255,0.75)', fontSize: 10 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function WalletScreen({ navigation, route }) {
  const currentUser = route?.params?.currentUser || null;
  const { tier } = usePremium();
  const {
    balance, transactions, myStamps, myMonuments, monthlyEarned,
    stamps, earnCoins,
  } = useWallet();

  const [activeTab,  setActiveTab]  = useState('Earnings');
  const [idVerified, setIdVerified] = useState(false);

  const payoutRate    = TIER_PAYOUT_RATE[tier] || 0.70;
  const availableUSD  = coinsToUSD(Math.floor(balance * payoutRate));
  const earned        = transactions.filter(t => t.type === 'earn');
  const spends        = transactions.filter(t => t.type === 'spend');
  const totalEarned   = earned.reduce((s, t) => s + t.amount, 0);

  // ── Payout requirements (anti-spam / anti-fake-account gates) ─────────────
  const reqs = [
    {
      id: 'age',
      label: 'Account 30+ days old',
      met: true,
    },
    {
      id: 'verify',
      label: 'Identity verified',
      met: idVerified,
      actionLabel: 'Verify ID',
      onAction: () =>
        Alert.alert(
          'Identity Verification',
          'Verify your identity to protect the creator community from fraudulent accounts. One verification per person — no multi-accounting.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Start Verification', onPress: () => setIdVerified(true) },
          ]
        ),
    },
    {
      id: 'min',
      label: `Minimum ${MIN_PAYOUT_COINS.toLocaleString()} coins`,
      met: balance >= MIN_PAYOUT_COINS,
    },
    {
      id: 'cooldown',
      label: 'No payout in last 30 days',
      met: true,
    },
  ];
  const allReqsMet = reqs.every(r => r.met);

  function handleBuyCoins() {
    Alert.alert(
      'Buy Bond Coins',
      '500 BC — $4.99\n1,200 BC — $9.99\n2,500 BC — $19.99\n5,000 BC — $39.99\n\nPayment via Apple Pay or card.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy 500 BC  ($4.99)', onPress: () => earnCoins(500, 'demo_seed', {}) },
      ]
    );
  }

  function handleRequestPayout() {
    if (!allReqsMet) return;
    Alert.alert(
      'Request Payout',
      `You'll receive $${availableUSD} USD (${Math.round(payoutRate * 100)}% of ${balance.toLocaleString()} BC).\n\nWorldBond keeps ${Math.round((1 - payoutRate) * 100)}% to cover platform, fraud protection, and payment processing.\n\nPayout via PayPal or bank transfer within 3–5 business days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Payout Requested ✓', 'You\'ll receive your funds within 3–5 business days.') },
      ]
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Bond Wallet</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Balance card ── */}
        <LinearGradient colors={['#1a1060', '#0d0a2e']} style={s.balanceCard}>
          <Text style={s.balanceLbl}>Bond Coins</Text>
          <View style={s.balanceRow}>
            <WorldMark size={52} color="#FFB700" bondColor="#FFB700" />
            <Text style={s.balanceNum}>{balance.toLocaleString()}</Text>
          </View>
          <Text style={s.balanceUSD}>≈ ${coinsToUSD(balance)} USD · {Math.round(payoutRate * 100)}% payout rate</Text>
          <TouchableOpacity style={s.buyBtn} onPress={handleBuyCoins}>
            <Text style={s.buyBtnTxt}>+ Buy Bond Coins</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Payout card ── */}
        <View style={s.payoutCard}>
          <View style={s.payoutTop}>
            <View>
              <Text style={s.payoutLbl}>Available to cash out</Text>
              <Text style={s.payoutAmount}>${availableUSD} USD</Text>
              <Text style={s.payoutSub}>
                {balance.toLocaleString()} BC × {Math.round(payoutRate * 100)}% ({tier} rate)
              </Text>
            </View>
            <View style={s.payoutRateBadge}>
              <Text style={s.payoutRatePct}>{Math.round(payoutRate * 100)}%</Text>
              <Text style={s.payoutRateLabel}>yours</Text>
            </View>
          </View>

          <PayoutRequirements reqs={reqs} />

          <TouchableOpacity
            style={[s.payoutBtn, !allReqsMet && s.payoutBtnLocked]}
            onPress={handleRequestPayout}
            disabled={!allReqsMet}
          >
            <LinearGradient
              colors={allReqsMet ? ['#4ade80', '#16a34a'] : ['#222', '#1a1a1a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.payoutBtnGrad}
            >
              <Text style={[s.payoutBtnTxt, !allReqsMet && { color: 'rgba(255,255,255,0.3)' }]}>
                {allReqsMet ? '💸 Request Payout' : 'Complete requirements to unlock'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.payoutNote}>
            30-day cooldown between payouts · 1 account per identity · earnings from verified sources only
          </Text>
        </View>

        {/* ── Quick stats ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <CoinRow amount={totalEarned.toLocaleString()} textStyle={s.statNum} size={15} />
            <Text style={s.statLbl}>Total Earned</Text>
          </View>
          <View style={s.statCard}>
            <CoinRow amount={monthlyEarned.toLocaleString()} textStyle={s.statNum} size={15} />
            <Text style={s.statLbl}>This Month</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>🌍 {myStamps.length + myMonuments.length}</Text>
            <Text style={s.statLbl}>Footprints</Text>
          </View>
        </View>

        {/* ── Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, activeTab === t && s.tabActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[s.tabTxt, activeTab === t && s.tabTxtActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Earnings tab ── */}
        {activeTab === 'Earnings' && (
          <View style={s.list}>
            {earned.length === 0
              ? <Text style={s.emptyTxt}>No earnings yet — go live and receive gifts!</Text>
              : earned.map(tx => (
                <View key={tx.id} style={s.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txSource}>{sourceLabel(tx.source)}</Text>
                    <Text style={s.txTime}>{relTime(tx.ts)}</Text>
                  </View>
                  <CoinRow amount={`+${tx.amount.toLocaleString()}`} textStyle={s.txEarn} size={15} />
                </View>
              ))
            }
          </View>
        )}

        {/* ── Spending tab ── */}
        {activeTab === 'Spending' && (
          <View style={s.list}>
            {spends.length === 0
              ? <Text style={s.emptyTxt}>No gifts sent yet — join a live stage!</Text>
              : spends.map(tx => (
                <View key={tx.id} style={s.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txSource}>{sourceLabel(tx.source)}</Text>
                    <Text style={s.txTime}>{relTime(tx.ts)}</Text>
                  </View>
                  <CoinRow amount={`-${tx.amount.toLocaleString()}`} textStyle={s.txSpend} size={15} />
                </View>
              ))
            }
          </View>
        )}

        {/* ── Creators tab ── */}
        {activeTab === 'Creators' && (
          <View>
            <View style={s.creatorHeader}>
              <Text style={s.creatorTitle}>Top Creators — June 2026</Text>
              <Text style={s.creatorSub}>
                Ranking resets every calendar month. Top 3 earn a bonus payout on top of the standard 70%.
              </Text>
            </View>
            <CreatorPodium creators={DEMO_TOP_CREATORS} />

            <View style={s.list}>
              {DEMO_TOP_CREATORS.map(c => (
                <LinearGradient
                  key={c.rank}
                  colors={c.rank === 1 ? ['#1a1400', '#0d0a00'] : ['#131520', '#0e1020']}
                  style={[s.creatorCard, c.rank === 1 && { borderColor: '#ffd70055' }]}
                >
                  <View style={s.creatorLeft}>
                    <Text style={s.creatorBadge}>{c.badge.icon} {c.badge.label}</Text>
                    <Text style={s.creatorName}>{c.username} {c.country}</Text>
                    <Text style={s.creatorStats}>{c.streams} streams · ~{c.avgViewers} avg viewers</Text>
                    <CoinRow amount={`${c.coinsEarned.toLocaleString()} gifted`} textStyle={s.creatorStats} size={13} />
                  </View>
                  <View style={s.creatorRight}>
                    <Text style={[s.creatorPayout, { color: c.rank === 1 ? '#ffd700' : '#4ade80' }]}>
                      {Math.round(c.payoutRate * 100)}%
                    </Text>
                    <Text style={s.creatorPayoutLbl}>payout</Text>
                    <Text style={s.creatorUSD}>${c.payoutUSD}</Text>
                  </View>
                </LinearGradient>
              ))}
            </View>

            {/* Platform comparison */}
            <View style={s.compareCard}>
              <Text style={s.compareTitle}>WorldBond vs Other Platforms</Text>
              <Text style={s.compareSub}>What creators keep per $1 in gifts received</Text>
              {[
                { label: 'Bigo Live',          pct: '35%',  color: '#555',    you: false },
                { label: 'TikTok LIVE',         pct: '50%',  color: '#555',    you: false },
                { label: 'YouTube SuperChat',   pct: '70%',  color: '#888',    you: false },
                { label: 'Twitch Bits',         pct: '71%',  color: '#888',    you: false },
                { label: 'WorldBond Free',      pct: '50%',  color: '#6C47FF', you: true  },
                { label: 'WorldBond Plus',      pct: '70%',  color: '#FF0080', you: true  },
                { label: 'WorldBond Pro',       pct: '80%',  color: '#FFB700', you: true  },
                { label: '🥇 Top Creator',      pct: '85%',  color: '#ffd700', you: true  },
                { label: '+ Stamp Royalty',     pct: '+3%',  color: '#4ade80', you: true  },
                { label: '+ Monument Royalty',  pct: '+2%',  color: '#4ade80', you: true  },
              ].map(row => (
                <View key={row.label} style={[s.compareRow, row.you && s.compareRowYou]}>
                  <Text style={[s.compareLabel, row.you && { color: '#fff' }]}>{row.label}</Text>
                  <Text style={[s.comparePct, { color: row.color }]}>{row.pct}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Footprints tab ── */}
        {activeTab === 'Footprints' && (
          <View style={s.list}>

            <View style={s.fpSection}>
              <Text style={s.fpSectionTitle}>🌍 Country Stamps</Text>
              <Text style={s.fpSectionSub}>
                1-of-1 per country · 195 worldwide · earn +3% royalty on all gifts to your country's streamers
              </Text>
            </View>

            {Object.entries(stamps).map(([flag, stamp]) => {
              const isMine    = myStamps.includes(flag);
              const unclaimed = !stamp.holder;
              return (
                <View key={flag} style={[s.fpRow, isMine && s.fpRowMine]}>
                  <Text style={s.fpIcon}>{flag}</Text>
                  <View style={{ flex: 1 }}>
                    {stamp.holder
                      ? <Text style={s.fpHolder}>@{stamp.holder}</Text>
                      : <Text style={[s.fpHolder, { color: '#4ade80' }]}>Unclaimed — tap to claim!</Text>
                    }
                    {isMine && (
                      <CoinRow amount={`${stamp.coinsEarned.toLocaleString()} earned`} textStyle={s.fpEarned} size={13} />
                    )}
                  </View>
                  {isMine
                    ? <View style={s.mineBadge}><Text style={s.mineBadgeTxt}>Yours</Text></View>
                    : (
                      <TouchableOpacity
                        style={unclaimed ? s.claimBtn : s.challengeBtn}
                        onPress={() => navigation.navigate('CountryStampChallenge', {
                          stamp: { flag, ...stamp },
                          currentUser,
                        })}
                      >
                        <Text style={unclaimed ? s.claimBtnTxt : s.challengeBtnTxt}>
                          {unclaimed ? 'Claim' : 'Challenge'}
                        </Text>
                      </TouchableOpacity>
                    )
                  }
                </View>
              );
            })}

            <View style={[s.fpSection, { marginTop: 20 }]}>
              <Text style={s.fpSectionTitle}>🏛️ Bond Monuments</Text>
              <Text style={s.fpSectionSub}>
                1-of-1 per landmark · earn +2% royalty from all gifts during streams in that region
              </Text>
            </View>

            {BOND_MONUMENTS.map(m => {
              const isMine    = myMonuments.includes(m.id);
              const unclaimed = !m.holder;
              return (
                <View key={m.id} style={[s.fpRow, isMine && s.fpRowMine]}>
                  <Text style={s.fpIcon}>{m.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fpHolder}>{m.name}</Text>
                    <Text style={s.fpSub}>{m.location} {m.country}</Text>
                    {m.holder && !isMine && (
                      <Text style={s.fpHolderName}>@{m.holder}</Text>
                    )}
                    {isMine && (
                      <CoinRow amount={`${m.coinsEarned.toLocaleString()} earned`} textStyle={s.fpEarned} size={13} />
                    )}
                    {unclaimed && (
                      <Text style={[s.fpHolderName, { color: '#4ade80' }]}>Unclaimed — tap to claim!</Text>
                    )}
                  </View>
                  {isMine
                    ? <View style={s.mineBadge}><Text style={s.mineBadgeTxt}>Yours</Text></View>
                    : (
                      <TouchableOpacity
                        style={unclaimed ? s.claimBtn : s.challengeBtn}
                        onPress={() => navigation.navigate('MonumentChallenge', { monument: m, currentUser })}
                      >
                        <Text style={unclaimed ? s.claimBtnTxt : s.challengeBtnTxt}>
                          {unclaimed ? 'Claim' : 'Challenge'}
                        </Text>
                      </TouchableOpacity>
                    )
                  }
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#08090d' },
  scroll:          { paddingBottom: 60 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: '#111318',
                     alignItems: 'center', justifyContent: 'center' },
  backIcon:        { color: '#fff', fontSize: 20 },
  title:           { color: '#fff', fontSize: 20, fontWeight: '900' },

  // Balance card
  balanceCard:     { margin: 16, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  balanceLbl:      { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  balanceRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  balanceNum:      { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  balanceUSD:      { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  buyBtn:          { backgroundColor: '#6C47FF', borderRadius: 16, paddingVertical: 13,
                     paddingHorizontal: 32, marginTop: 4 },
  buyBtnTxt:       { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Payout card
  payoutCard:      { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#0f1116',
                     borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e2028' },
  payoutTop:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  payoutLbl:       { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700',
                     letterSpacing: 0.5, marginBottom: 4 },
  payoutAmount:    { color: '#fff', fontSize: 28, fontWeight: '900' },
  payoutSub:       { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  payoutRateBadge: { alignItems: 'center', backgroundColor: '#4ade8015',
                     borderWidth: 1, borderColor: '#4ade8040',
                     borderRadius: 14, padding: 12 },
  payoutRatePct:   { color: '#4ade80', fontSize: 22, fontWeight: '900' },
  payoutRateLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  payoutBtn:       { borderRadius: 14, overflow: 'hidden' },
  payoutBtnLocked: { opacity: 0.6 },
  payoutBtnGrad:   { paddingVertical: 14, alignItems: 'center' },
  payoutBtnTxt:    { color: '#fff', fontSize: 14, fontWeight: '800' },
  payoutNote:      { color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center',
                     marginTop: 12, lineHeight: 16 },

  // Stats row
  statsRow:        { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard:        { flex: 1, backgroundColor: '#0f1116', borderRadius: 16, padding: 14,
                     alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#1e2028' },
  statNum:         { color: '#fff', fontSize: 13, fontWeight: '800' },
  statLbl:         { color: '#555', fontSize: 11 },

  // Tabs
  tabsRow:         { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  tab:             { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22,
                     backgroundColor: '#0f1116', borderWidth: 1, borderColor: '#1e2028' },
  tabActive:       { backgroundColor: '#6C47FF22', borderColor: '#6C47FF55' },
  tabTxt:          { color: '#555', fontSize: 13, fontWeight: '700' },
  tabTxtActive:    { color: '#7c5cfc' },

  // Transaction list
  list:            { paddingHorizontal: 16, gap: 8 },
  txRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     backgroundColor: '#0f1116', borderRadius: 14, padding: 14,
                     borderWidth: 1, borderColor: '#1e2028' },
  txSource:        { color: '#fff', fontSize: 14, fontWeight: '700' },
  txTime:          { color: '#444', fontSize: 12, marginTop: 3 },
  txEarn:          { color: '#4ade80', fontSize: 14, fontWeight: '800' },
  txSpend:         { color: '#f87171', fontSize: 14, fontWeight: '800' },
  emptyTxt:        { color: '#444', fontSize: 14, textAlign: 'center',
                     paddingVertical: 40, paddingHorizontal: 16 },

  // Creators tab
  creatorHeader:   { paddingHorizontal: 16, paddingBottom: 8 },
  creatorTitle:    { color: '#fff', fontSize: 17, fontWeight: '900' },
  creatorSub:      { color: '#555', fontSize: 13, marginTop: 4, lineHeight: 18 },
  creatorCard:     { borderRadius: 16, padding: 16, flexDirection: 'row',
                     alignItems: 'center', borderWidth: 1, borderColor: '#1e2028' },
  creatorLeft:     { flex: 1, gap: 3 },
  creatorBadge:    { color: '#ffd700', fontSize: 12, fontWeight: '800' },
  creatorName:     { color: '#fff', fontSize: 15, fontWeight: '800' },
  creatorStats:    { color: '#555', fontSize: 12 },
  creatorRight:    { alignItems: 'center', minWidth: 70 },
  creatorPayout:   { fontSize: 22, fontWeight: '900' },
  creatorPayoutLbl:{ color: '#555', fontSize: 11 },
  creatorUSD:      { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },

  // Platform comparison
  compareCard:     { margin: 16, backgroundColor: '#0f1116', borderRadius: 18, padding: 18,
                     borderWidth: 1, borderColor: '#1e2028' },
  compareTitle:    { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  compareSub:      { color: '#555', fontSize: 12, marginBottom: 12 },
  compareRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     paddingVertical: 8, borderBottomWidth: 1, borderColor: '#1a1c28' },
  compareRowYou:   { backgroundColor: '#6C47FF0a', marginHorizontal: -18, paddingHorizontal: 18 },
  compareLabel:    { color: '#777', fontSize: 13 },
  comparePct:      { fontSize: 14, fontWeight: '900' },

  // Footprints tab
  fpSection:       { backgroundColor: '#0f1116', borderRadius: 16, padding: 16,
                     borderWidth: 1, borderColor: '#1e2028', gap: 6, marginBottom: 4 },
  fpSectionTitle:  { color: '#fff', fontSize: 16, fontWeight: '900' },
  fpSectionSub:    { color: '#555', fontSize: 12, lineHeight: 18 },
  fpRow:           { flexDirection: 'row', alignItems: 'center', gap: 12,
                     backgroundColor: '#0f1116', borderRadius: 14, padding: 14,
                     borderWidth: 1, borderColor: '#1e2028' },
  fpRowMine:       { borderColor: '#6C47FF55', backgroundColor: '#6C47FF0a' },
  fpIcon:          { fontSize: 26 },
  fpHolder:        { color: '#fff', fontSize: 13, fontWeight: '700' },
  fpHolderName:    { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  fpSub:           { color: '#555', fontSize: 11, marginTop: 1 },
  fpEarned:        { color: '#FFB700', fontSize: 12, marginTop: 2 },
  mineBadge:       { backgroundColor: '#6C47FF33', borderRadius: 8, paddingHorizontal: 10,
                     paddingVertical: 4, borderWidth: 1, borderColor: '#6C47FF66' },
  mineBadgeTxt:    { color: '#7c5cfc', fontSize: 11, fontWeight: '800' },
  claimBtn:        { backgroundColor: '#4ade8022', borderRadius: 10, paddingHorizontal: 12,
                     paddingVertical: 6, borderWidth: 1, borderColor: '#4ade8055' },
  claimBtnTxt:     { color: '#4ade80', fontSize: 12, fontWeight: '800' },
  challengeBtn:    { backgroundColor: '#FFB70018', borderRadius: 10, paddingHorizontal: 10,
                     paddingVertical: 6, borderWidth: 1, borderColor: '#FFB70044' },
  challengeBtnTxt: { color: '#FFB700', fontSize: 11, fontWeight: '700' },
});
