import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, Modal, Linking, ActivityIndicator,
} from 'react-native';
import * as RNIap from 'react-native-iap';
import LinearGradient from 'react-native-linear-gradient';
import { WorldMark } from '../components/BondLogo';
import { useBondPass } from '../context/PremiumContext';
import {
  useWallet, coinsToUSD,
  DEMO_TOP_CREATORS, BOND_MONUMENTS,
  getPayoutCooldownMs, getPayoutCooldownDays,
} from '../context/WalletContext';
import { getFeaturedFlag, isStampDropped, getNextFeaturedFlag } from '../context/ChallengeContext';
import { getAccessToken } from '../services/authApi';

const BOND_PINK   = '#FF0080';
const BOND_GOLD   = '#FFB700';

const BASE_PAYOUT      = 0.70;
const PASS_PAYOUT      = 0.75;
const MIN_PAYOUT_COINS = 2500;
const TOP_CREATOR_COINS_THRESHOLD = 40000;

const SERVER_URL = 'https://worldbond-server-production.up.railway.app';

const COIN_PACKS = [
  { sku: 'com.worldbond.coins.100',  coins: 100,  price: '$0.99',  bonus: null,          popular: false },
  { sku: 'com.worldbond.coins.500',  coins: 500,  price: '$3.99',  bonus: '+50 bonus',   popular: false },
  { sku: 'com.worldbond.coins.1200', coins: 1200, price: '$8.99',  bonus: '+200 bonus',  popular: true  },
  { sku: 'com.worldbond.coins.3000', coins: 3000, price: '$19.99', bonus: '+600 bonus',  popular: false },
];

const TABS = ['Earnings', 'Spending', 'Creators', 'Footprints'];

// ── BondCoin — WorldMark as the in-app currency icon ─────────────────────────
function BondCoin({ size = 18 }) {
  return <WorldMark size={size} color={BOND_GOLD} bondColor={BOND_GOLD} />;
}

// ── CoinRow ───────────────────────────────────────────────────────────────────
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
    gift_received: 'Gift received',
    stamp_royalty: 'Stamp royalty',
    live_gift:     'Gift sent',
    demo_seed:     'Welcome bonus',
    challenge_win: 'Challenge win',
  };
  return map[source] || source;
}

// ── Payout requirements ───────────────────────────────────────────────────────
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
  actionBtn: { backgroundColor: BOND_GOLD + '20', borderWidth: 1, borderColor: BOND_GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  actionTxt: { color: BOND_GOLD, fontSize: 11, fontWeight: '800' },
});

// ── Creator Podium ─────────────────────────────────────────────────────────────
function bonusPct(creator) {
  return Math.round((creator.payoutRate - BASE_PAYOUT) * 100);
}

function CreatorPodium({ creators }) {
  const [first, second, third] = creators;
  return (
    <View style={pod.wrap}>
      <View style={[pod.col, { marginTop: 28 }]}>
        <View style={[pod.avatar, { backgroundColor: '#555555' }]}>
          <Text style={pod.avatarTxt}>{second.username[0]}</Text>
        </View>
        <Text style={pod.rank}>#2</Text>
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
        <Text style={pod.rank}>#1</Text>
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
        <Text style={pod.rank}>#3</Text>
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
  wrap:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  col:        { alignItems: 'center', flex: 1 },
  avatar:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarGold: { backgroundColor: '#b8860b', borderWidth: 2, borderColor: '#ffd700' },
  avatarTxt:  { color: '#fff', fontSize: 22, fontWeight: '900' },
  rank:       { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  name:       { color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  flag:       { fontSize: 16, marginTop: 2, marginBottom: 6 },
  plinth:     { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 2 },
  plinthCoins:{ color: '#fff', fontSize: 11, fontWeight: '800' },
  plinthBonus:{ color: 'rgba(255,255,255,0.75)', fontSize: 10 },
});

// ── CooldownTierBadge ─────────────────────────────────────────────────────────
function CooldownTierBadge({ hasBondPass, isTopCreator }) {
  const tiers = [
    { label: 'Standard',    days: 30, active: !hasBondPass && !isTopCreator, color: 'rgba(255,255,255,0.7)' },
    { label: 'Bond Pass',   days: 14, active: hasBondPass && !isTopCreator,  color: BOND_PINK },
    { label: 'Top Creator', days: 7,  active: isTopCreator,                  color: BOND_GOLD },
  ];
  return (
    <View style={ct.wrap}>
      <Text style={ct.header}>Payout cooldown tier</Text>
      <View style={ct.row}>
        {tiers.map(tier => (
          <View
            key={tier.label}
            style={[
              ct.tier,
              tier.active && { borderColor: tier.color + '55', backgroundColor: tier.color + '10' },
            ]}
          >
            <Text style={[ct.days, { color: tier.active ? tier.color : 'rgba(255,255,255,0.18)' }]}>
              {tier.days}d
            </Text>
            <Text style={[ct.tierLabel, { color: tier.active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.18)' }]}>
              {tier.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const ct = StyleSheet.create({
  wrap:     { gap: 8 },
  header:   { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  row:      { flexDirection: 'row', gap: 8 },
  tier:     { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', gap: 4 },
  days:     { fontSize: 17, fontWeight: '900' },
  tierLabel:{ fontSize: 10, fontWeight: '700', textAlign: 'center' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function WalletScreen({ navigation, route }) {
  const currentUser     = route?.params?.currentUser || null;
  const { hasBondPass } = useBondPass();
  const {
    balance, transactions, myStamps, myMonuments, monthlyEarned,
    stamps, lastPayoutTs, recordPayout,
  } = useWallet();

  const [activeTab,      setActiveTab]      = useState('Earnings');
  const [idVerified,     setIdVerified]     = useState(false);
  const [showCoinModal,  setShowCoinModal]  = useState(false);
  const [purchasing,     setPurchasing]     = useState(false);
  const [payingOut,      setPayingOut]      = useState(false);

  const payoutRate    = hasBondPass ? PASS_PAYOUT : BASE_PAYOUT;
  const availableUSD  = coinsToUSD(Math.floor(balance * payoutRate));
  const earned        = transactions.filter(t => t.type === 'earn');
  const spends        = transactions.filter(t => t.type === 'spend');
  const totalEarned   = earned.reduce((sum, t) => sum + t.amount, 0);

  const isTopCreator   = monthlyEarned >= TOP_CREATOR_COINS_THRESHOLD;
  const cooldownMs     = getPayoutCooldownMs(hasBondPass, isTopCreator);
  const cooldownDays   = getPayoutCooldownDays(hasBondPass, isTopCreator);
  const elapsed        = lastPayoutTs ? Date.now() - lastPayoutTs : Infinity;
  const cooldownMet    = elapsed >= cooldownMs;
  const daysUntilNext  = cooldownMet ? 0 : Math.ceil((cooldownMs - elapsed) / 86400000);

  const reqs = [
    { id: 'age', label: 'Account 30+ days old', met: currentUser?.created_at ? Date.now() - new Date(currentUser.created_at).getTime() >= 30 * 86400000 : false },
    {
      id: 'verify', label: 'Identity verified', met: idVerified,
      actionLabel: 'Verify ID',
      onAction: () => Alert.alert(
        'Identity Verification',
        'Identity verification will be available in an upcoming update.',
        [{ text: 'OK' }],
      ),
    },
    { id: 'min',      label: `Minimum ${MIN_PAYOUT_COINS.toLocaleString()} coins`, met: balance >= MIN_PAYOUT_COINS },
    {
      id: 'cooldown',
      label: cooldownMet
        ? `No payout in last ${cooldownDays} days`
        : `${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''} until next payout`,
      met: cooldownMet,
    },
  ];
  const allReqsMet = reqs.every(r => r.met);

  function handleBuyCoins() {
    setShowCoinModal(true);
  }

  async function purchasePack(pack) {
    try {
      setPurchasing(true);
      await RNIap.initConnection();
      const purchase = await RNIap.requestPurchase({ sku: pack.sku });
      await RNIap.finishTransaction({ purchase, isConsumable: true });
      const token = await getAccessToken();
      const creditRes = await fetch(`${SERVER_URL}/coins/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: currentUser?.userId,
          sku: pack.sku,
          receipt: purchase.transactionReceipt,
        }),
      });
      const creditData = await creditRes.json();
      setShowCoinModal(false);
      const credited = creditData.credited ?? pack.coins;
      Alert.alert('Coins Added', `${credited.toLocaleString()} Bond Coins added to your wallet.`);
    } catch (err) {
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
      RNIap.endConnection();
    }
  }

  async function handleConnectStripe() {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${SERVER_URL}/creator/connect-stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: currentUser?.userId, email: currentUser?.email }),
      });
      const { url } = await res.json();
      if (url) Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not connect to Stripe. Please try again.');
    }
  }

  async function handleRequestPayout() {
    if (!allReqsMet) return;
    if (!currentUser?.stripeAccountId) {
      Alert.alert(
        'Connect Your Bank First',
        'You need to connect your bank account before cashing out. It only takes 2 minutes.',
        [
          { text: 'Connect Bank', onPress: handleConnectStripe },
          { text: 'Not Now', style: 'cancel' },
        ],
      );
      return;
    }
    Alert.alert(
      'Request Payout',
      `You'll receive $${availableUSD} USD (${Math.round(payoutRate * 100)}% of ${balance.toLocaleString()} BC).\n\nWorldBond keeps ${Math.round((1 - payoutRate) * 100)}% to cover platform costs.\n\nFunds arrive in 3–5 business days via Stripe.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            if (!currentUser?.userId) {
              Alert.alert('Error', 'User session expired. Please log in again.');
              return;
            }
            try {
              setPayingOut(true);
              const token = await getAccessToken();
              const res = await fetch(`${SERVER_URL}/creator/payout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: currentUser.userId }),
              });
              const data = await res.json();
              if (data.transfer) {
                recordPayout();
                const usd = (data.amountCents / 100).toFixed(2);
                Alert.alert('Payout Sent', `$${usd} USD is on the way (${data.coinsDeducted.toLocaleString()} BC). Funds arrive in 3–5 business days.`);
              } else {
                Alert.alert('Payout Failed', data.error || 'Please try again.');
              }
            } catch {
              Alert.alert('Error', 'Could not process payout. Please try again.');
            } finally {
              setPayingOut(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Bond Wallet</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Balance card ── */}
        <LinearGradient colors={['#0f0a1a', '#07080f']} style={s.balanceCard}>
          <Text style={s.balanceLbl}>Bond Coins</Text>
          <View style={s.balanceRow}>
            <WorldMark size={52} color={BOND_GOLD} bondColor={BOND_GOLD} />
            <Text style={s.balanceNum}>{balance.toLocaleString()}</Text>
          </View>
          <Text style={s.balanceUSD}>
            ≈ ${coinsToUSD(balance)} USD · {Math.round(payoutRate * 100)}% {hasBondPass ? 'Bond Pass' : 'standard'} rate
          </Text>
          <TouchableOpacity style={s.buyBtn} onPress={handleBuyCoins}>
            <Text style={s.buyBtnTxt}>+ Buy Bond Coins</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Bond Pass payout notice ── */}
        {!hasBondPass && (
          <TouchableOpacity style={s.passNudge} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
            <Text style={s.passNudgeText}>Bond Pass — 75% payout rate + 14-day cooldown →</Text>
          </TouchableOpacity>
        )}

        {/* ── Payout card ── */}
        <View style={s.payoutCard}>
          <View style={s.payoutTop}>
            <View>
              <Text style={s.payoutLbl}>Available to cash out</Text>
              <Text style={s.payoutAmount}>${availableUSD} USD</Text>
              <Text style={s.payoutSub}>
                {balance.toLocaleString()} BC × {Math.round(payoutRate * 100)}% ({hasBondPass ? 'Bond Pass' : 'standard'} rate)
              </Text>
            </View>
            <View style={s.payoutRateBadge}>
              <Text style={s.payoutRatePct}>{Math.round(payoutRate * 100)}%</Text>
              <Text style={s.payoutRateLabel}>yours</Text>
            </View>
          </View>

          <CooldownTierBadge hasBondPass={hasBondPass} isTopCreator={isTopCreator} />

          <PayoutRequirements reqs={reqs} />

          {/* Connect bank account if not yet connected */}
          {!currentUser?.stripeAccountId && (
            <TouchableOpacity style={s.connectBankBtn} onPress={handleConnectStripe} activeOpacity={0.85}>
              <View style={s.connectBankDot} />
              <Text style={s.connectBankTxt}>Connect Bank Account</Text>
              <Text style={s.connectBankArrow}>→</Text>
            </TouchableOpacity>
          )}
          {currentUser?.stripeAccountId && (
            <View style={s.bankConnectedRow}>
              <View style={s.bankConnectedDot} />
              <Text style={s.bankConnectedTxt}>Bank account connected</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.payoutBtn, (!allReqsMet || payingOut) && s.payoutBtnLocked]}
            onPress={handleRequestPayout}
            disabled={!allReqsMet || payingOut}
          >
            <LinearGradient
              colors={allReqsMet ? ['#4ade80', '#16a34a'] : ['#222222', '#1a1a1a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.payoutBtnGrad}
            >
              {payingOut
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={[s.payoutBtnTxt, !allReqsMet && { color: 'rgba(255,255,255,0.3)' }]}>
                    {allReqsMet ? 'Request Payout' : 'Complete requirements to unlock'}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.payoutNote}>
            {cooldownDays}-day cooldown · payouts via Stripe · 3–5 business days
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
            <Text style={s.statNum}>{myStamps.length + myMonuments.length}</Text>
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
              <Text style={s.creatorTitle}>Top Creators — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
              <Text style={s.creatorSub}>
                Ranking resets every calendar month. Top 3 earn a bonus payout above the base 70%.
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
                    <Text style={s.creatorBadge}>#{c.rank} {c.badge.label}</Text>
                    <Text style={s.creatorName}>{c.username} {c.country}</Text>
                    <Text style={s.creatorStats}>{c.streams} streams · ~{c.avgViewers} avg viewers</Text>
                    <CoinRow amount={`${c.coinsEarned.toLocaleString()} earned`} textStyle={s.creatorStats} size={13} />
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
                { label: 'Bigo Live',            pct: '35%', color: 'rgba(255,255,255,0.4)', you: false },
                { label: 'TikTok LIVE',           pct: '50%', color: 'rgba(255,255,255,0.4)', you: false },
                { label: 'YouTube SuperChat',     pct: '70%', color: '#888888', you: false },
                { label: 'Twitch Bits',           pct: '71%', color: '#888888', you: false },
                { label: 'WorldBond Standard',    pct: '70%', color: BOND_PINK,  you: true  },
                { label: 'WorldBond Bond Pass',   pct: '75%', color: BOND_PINK,  you: true  },
                { label: 'Top Creator',            pct: '85%', color: '#ffd700', you: true  },
                { label: '+ Stamp Royalty',       pct: '+3%', color: '#4ade80', you: true  },
                { label: '+ Monument Royalty',    pct: '+2%', color: '#4ade80', you: true  },
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

            {(() => {
              const featuredFlag = getFeaturedFlag();
              const nextFlag     = getNextFeaturedFlag();
              return (
                <>
                  <LinearGradient
                    colors={['#1a0a2e', '#0d0820']}
                    style={s.featuredBanner}
                  >
                    <View style={s.featuredRow}>
                      <Text style={s.featuredFlag}>{featuredFlag}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={s.featuredLabelRow}>
                          <View style={s.featuredPill}><Text style={s.featuredPillTxt}>FEATURED THIS WEEK</Text></View>
                        </View>
                        <Text style={s.featuredDesc}>
                          Challenge or claim {featuredFlag} for{' '}
                          <Text style={{ color: BOND_PINK, fontWeight: '800' }}>50% off</Text>
                          {' '}the entry fee · resets Sunday
                        </Text>
                        <Text style={s.featuredNext}>Next up: {nextFlag}</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  <View style={s.fpSection}>
                    <Text style={s.fpSectionTitle}>Country Stamps</Text>
                    <Text style={s.fpSectionSub}>
                      1-of-1 per country · earn +3% royalty on all gifts to your country's streamers · holders drop after 30 days inactive
                    </Text>
                  </View>

                  {Object.entries(stamps).map(([flag, stamp]) => {
                    const isMine    = myStamps.includes(flag);
                    const unclaimed = !stamp.holder;
                    const dropped   = isStampDropped(stamp);
                    const featured  = flag === featuredFlag;
                    return (
                      <View
                        key={flag}
                        style={[
                          s.fpRow,
                          isMine    && s.fpRowMine,
                          featured  && s.fpRowFeatured,
                          dropped   && s.fpRowDropped,
                        ]}
                      >
                        <Text style={s.fpIcon}>{flag}</Text>
                        <View style={{ flex: 1 }}>
                          {dropped ? (
                            <>
                              <Text style={s.droppedLabel}>DROPPED</Text>
                              <Text style={[s.fpHolderName, { marginTop: 0 }]}>@{stamp.holder} went inactive</Text>
                            </>
                          ) : unclaimed ? (
                            <Text style={[s.fpHolder, { color: '#4ade80' }]}>Unclaimed</Text>
                          ) : (
                            <Text style={s.fpHolder}>@{stamp.holder}</Text>
                          )}
                          {isMine && (
                            <CoinRow amount={`${stamp.coinsEarned.toLocaleString()} earned`} textStyle={s.fpEarned} size={13} />
                          )}
                          {featured && !isMine && (
                            <Text style={s.featuredRowHint}>50% off entry fee this week</Text>
                          )}
                        </View>
                        {featured && <View style={s.featuredDot}><Text style={s.featuredDotTxt}>HOT</Text></View>}
                        {isMine
                          ? <View style={s.mineBadge}><Text style={s.mineBadgeTxt}>Yours</Text></View>
                          : (
                            <TouchableOpacity
                              style={dropped || unclaimed ? s.claimBtn : s.challengeBtn}
                              onPress={() => navigation.navigate('CountryStampChallenge', { stamp: { flag, ...stamp }, currentUser })}
                            >
                              <Text style={dropped || unclaimed ? s.claimBtnTxt : s.challengeBtnTxt}>
                                {dropped ? 'Claim Free' : unclaimed ? 'Claim' : 'Challenge'}
                              </Text>
                            </TouchableOpacity>
                          )
                        }
                      </View>
                    );
                  })}
                </>
              );
            })()}

            <View style={[s.fpSection, { marginTop: 20 }]}>
              <Text style={s.fpSectionTitle}>Bond Monuments</Text>
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
                    {m.holder && !isMine && <Text style={s.fpHolderName}>@{m.holder}</Text>}
                    {isMine && (
                      <CoinRow amount={`${m.coinsEarned.toLocaleString()} earned`} textStyle={s.fpEarned} size={13} />
                    )}
                    {unclaimed && <Text style={[s.fpHolderName, { color: '#4ade80' }]}>Unclaimed — tap to claim!</Text>}
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

      {/* ── Coin Purchase Modal ── */}
      <Modal visible={showCoinModal} animationType="slide" transparent onRequestClose={() => setShowCoinModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowCoinModal(false)} />
        <View style={s.coinSheet}>
          <View style={s.coinSheetHandle} />
          <Text style={s.coinSheetTitle}>Buy Bond Coins</Text>
          <Text style={s.coinSheetSub}>Coins let you send gifts during live streams</Text>

          {COIN_PACKS.map(pack => (
            <TouchableOpacity
              key={pack.sku}
              style={[s.coinPack, pack.popular && s.coinPackPopular]}
              onPress={() => purchasePack(pack)}
              disabled={purchasing}
              activeOpacity={0.85}
            >
              {pack.popular && (
                <View style={s.popularBadge}><Text style={s.popularBadgeTxt}>Most Popular</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <CoinRow amount={pack.coins} textStyle={s.coinPackAmount} size={20} />
                {pack.bonus && <Text style={s.coinPackBonus}>{pack.bonus}</Text>}
              </View>
              <Text style={s.coinPackPrice}>{pack.price}</Text>
            </TouchableOpacity>
          ))}

          {purchasing && (
            <View style={s.purchasingRow}>
              <ActivityIndicator color={BOND_GOLD} size="small" />
              <Text style={s.purchasingTxt}>Processing purchase…</Text>
            </View>
          )}

          <Text style={s.coinSheetNote}>Purchases are processed through Apple. Coins are non-refundable.</Text>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#08090d' },
  scroll: { paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#111318', alignItems: 'center', justifyContent: 'center' },
  backIcon:{ color: '#fff', fontSize: 20 },
  title:  { color: '#fff', fontSize: 20, fontWeight: '900' },

  // Balance card
  balanceCard: { margin: 16, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: BOND_PINK + '20' },
  balanceLbl:  { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  balanceRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  balanceNum:  { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  balanceUSD:  { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  buyBtn:      { backgroundColor: BOND_PINK, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 32, marginTop: 4 },
  buyBtnTxt:   { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Bond Pass nudge
  passNudge:    { marginHorizontal: 16, marginBottom: 4, backgroundColor: BOND_PINK + '12', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: BOND_PINK + '30' },
  passNudgeText:{ color: BOND_PINK, fontSize: 13, fontWeight: '700' },

  // Payout card
  payoutCard:      { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#0f1116', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e2028' },
  payoutTop:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  payoutLbl:       { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  payoutAmount:    { color: '#fff', fontSize: 28, fontWeight: '900' },
  payoutSub:       { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  payoutRateBadge: { alignItems: 'center', backgroundColor: '#4ade8015', borderWidth: 1, borderColor: '#4ade8040', borderRadius: 14, padding: 12 },
  payoutRatePct:   { color: '#4ade80', fontSize: 22, fontWeight: '900' },
  payoutRateLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  payoutBtn:       { borderRadius: 14, overflow: 'hidden' },
  payoutBtnLocked: { opacity: 0.6 },
  payoutBtnGrad:   { paddingVertical: 14, alignItems: 'center' },
  payoutBtnTxt:    { color: '#fff', fontSize: 14, fontWeight: '800' },
  payoutNote:      { color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16 },

  // Connect bank
  connectBankBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#4ade8015', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: '#4ade8044', marginBottom: 14 },
  connectBankDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  connectBankTxt:    { flex: 1, color: '#4ade80', fontSize: 14, fontWeight: '700' },
  connectBankArrow:  { color: '#4ade80', fontSize: 16, fontWeight: '700' },
  bankConnectedRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  bankConnectedDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4ade80' },
  bankConnectedTxt:  { color: '#4ade80', fontSize: 12, fontWeight: '600' },

  // Coin purchase modal
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  coinSheet:         { backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12, paddingBottom: 44 },
  coinSheetHandle:   { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  coinSheetTitle:    { color: '#fff', fontSize: 20, fontWeight: '900' },
  coinSheetSub:      { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: -4 },
  coinPack:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  coinPackPopular:   { borderColor: BOND_GOLD + '88', backgroundColor: BOND_GOLD + '10' },
  popularBadge:      { position: 'absolute', top: -10, right: 14, backgroundColor: BOND_GOLD, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  popularBadgeTxt:   { color: '#000', fontSize: 10, fontWeight: '900' },
  coinPackAmount:    { color: '#fff', fontSize: 18, fontWeight: '900' },
  coinPackBonus:     { color: '#4ade80', fontSize: 11, fontWeight: '700', marginTop: 2 },
  coinPackPrice:     { color: BOND_GOLD, fontSize: 17, fontWeight: '900' },
  purchasingRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  purchasingTxt:     { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  coinSheetNote:     { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#0f1116', borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#1e2028' },
  statNum:  { color: '#fff', fontSize: 13, fontWeight: '800' },
  statLbl:  { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  // Tabs
  tabsRow:     { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  tab:         { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: '#0f1116', borderWidth: 1, borderColor: '#1e2028' },
  tabActive:   { backgroundColor: BOND_PINK + '18', borderColor: BOND_PINK + '40' },
  tabTxt:      { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '700' },
  tabTxtActive:{ color: BOND_PINK },

  // Transaction list
  list:    { paddingHorizontal: 16, gap: 8 },
  txRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f1116', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1e2028' },
  txSource:{ color: '#fff', fontSize: 14, fontWeight: '700' },
  txTime:  { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 3 },
  txEarn:  { color: '#4ade80', fontSize: 14, fontWeight: '800' },
  txSpend: { color: '#f87171', fontSize: 14, fontWeight: '800' },
  emptyTxt:{ color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center', paddingVertical: 40, paddingHorizontal: 16 },

  // Creators tab
  creatorHeader:    { paddingHorizontal: 16, paddingBottom: 8 },
  creatorTitle:     { color: '#fff', fontSize: 17, fontWeight: '900' },
  creatorSub:       { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  creatorCard:      { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1e2028' },
  creatorLeft:      { flex: 1, gap: 3 },
  creatorBadge:     { color: '#ffd700', fontSize: 12, fontWeight: '800' },
  creatorName:      { color: '#fff', fontSize: 15, fontWeight: '800' },
  creatorStats:     { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  creatorRight:     { alignItems: 'center', minWidth: 70 },
  creatorPayout:    { fontSize: 22, fontWeight: '900' },
  creatorPayoutLbl: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  creatorUSD:       { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },

  // Platform comparison
  compareCard:   { margin: 16, backgroundColor: '#0f1116', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#1e2028' },
  compareTitle:  { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  compareSub:    { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 },
  compareRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#1a1c1a' },
  compareRowYou: { backgroundColor: BOND_PINK + '0a', marginHorizontal: -18, paddingHorizontal: 18 },
  compareLabel:  { color: '#777777', fontSize: 13 },
  comparePct:    { fontSize: 14, fontWeight: '900' },

  // Footprints tab
  fpSection:      { backgroundColor: '#0f1116', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e2028', gap: 6, marginBottom: 4 },
  fpSectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  fpSectionSub:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 18 },
  fpRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0f1116', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1e2028' },
  fpRowMine:      { borderColor: BOND_PINK + '40', backgroundColor: BOND_PINK + '08' },
  fpRowFeatured:  { borderColor: BOND_PINK + '55', backgroundColor: BOND_PINK + '06' },
  fpRowDropped:   { borderColor: '#ff6b0040', backgroundColor: '#ff6b0008' },
  fpIcon:         { fontSize: 26 },
  fpHolder:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  fpHolderName:   { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  fpSub:          { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 },
  fpEarned:       { color: BOND_GOLD, fontSize: 12, marginTop: 2 },
  droppedLabel:   { color: '#ff6b00', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  featuredRowHint:{ color: BOND_PINK, fontSize: 10, fontWeight: '700', marginTop: 2 },
  featuredDot:    { backgroundColor: BOND_PINK, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4 },
  featuredDotTxt: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  mineBadge:      { backgroundColor: BOND_PINK + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: BOND_PINK + '40' },
  mineBadgeTxt:   { color: BOND_PINK, fontSize: 11, fontWeight: '800' },
  claimBtn:       { backgroundColor: '#4ade8022', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#4ade8055' },
  claimBtnTxt:    { color: '#4ade80', fontSize: 12, fontWeight: '800' },
  challengeBtn:   { backgroundColor: BOND_GOLD + '18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: BOND_GOLD + '44' },
  challengeBtnTxt:{ color: BOND_GOLD, fontSize: 11, fontWeight: '700' },

  // Featured banner
  featuredBanner:   { borderRadius: 16, padding: 16, marginBottom: 4, borderWidth: 1, borderColor: BOND_PINK + '30' },
  featuredRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featuredFlag:     { fontSize: 38 },
  featuredLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  featuredPill:     { backgroundColor: BOND_PINK, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  featuredPillTxt:  { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  featuredDesc:     { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 17 },
  featuredNext:     { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },
});
