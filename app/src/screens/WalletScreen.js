import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useWallet, coinsToUSD,
  DEMO_TOP_CREATORS, BOND_MONUMENTS, PAYOUT_RATES,
} from '../context/WalletContext';

const TABS = ['Earnings', 'Spending', 'Creators', 'Footprints'];

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

// ── Top 3 Podium ──────────────────────────────────────────────────────────────
function bonusPct(creator) {
  return Math.round((creator.payoutRate - 0.70) * 100);
}

function CreatorPodium({ creators }) {
  const [first, second, third] = creators;
  return (
    <View style={p.wrap}>
      {/* 2nd */}
      <View style={[p.podiumCol, { marginTop: 28 }]}>
        <View style={[p.avatar, { backgroundColor: '#555555' }]}>
          <Text style={p.avatarTxt}>{second.username[0]}</Text>
        </View>
        <Text style={p.rank}>{second.badge.icon}</Text>
        <Text style={p.name} numberOfLines={1}>{second.username}</Text>
        <Text style={p.flag}>{second.country}</Text>
        <LinearGradient colors={['#555555', '#444444']} style={[p.plinth, { height: 60 }]}>
          <Text style={p.plinthCoins}>🪙 {(second.coinsEarned / 1000).toFixed(1)}k</Text>
          <Text style={p.plinthBonus}>+{bonusPct(second)}%</Text>
        </LinearGradient>
      </View>

      {/* 1st */}
      <View style={p.podiumCol}>
        <View style={[p.avatar, p.avatarGold]}>
          <Text style={p.avatarTxt}>{first.username[0]}</Text>
        </View>
        <Text style={p.rank}>{first.badge.icon}</Text>
        <Text style={p.name} numberOfLines={1}>{first.username}</Text>
        <Text style={p.flag}>{first.country}</Text>
        <LinearGradient colors={['#c8a600', '#a07800']} style={[p.plinth, { height: 90 }]}>
          <Text style={p.plinthCoins}>🪙 {(first.coinsEarned / 1000).toFixed(1)}k</Text>
          <Text style={p.plinthBonus}>+{bonusPct(first)}%</Text>
        </LinearGradient>
      </View>

      {/* 3rd */}
      <View style={[p.podiumCol, { marginTop: 48 }]}>
        <View style={[p.avatar, { backgroundColor: '#7c4a1e' }]}>
          <Text style={p.avatarTxt}>{third.username[0]}</Text>
        </View>
        <Text style={p.rank}>{third.badge.icon}</Text>
        <Text style={p.name} numberOfLines={1}>{third.username}</Text>
        <Text style={p.flag}>{third.country}</Text>
        <LinearGradient colors={['#7c4a1e', '#5a3210']} style={[p.plinth, { height: 40 }]}>
          <Text style={p.plinthCoins}>🪙 {(third.coinsEarned / 1000).toFixed(1)}k</Text>
          <Text style={p.plinthBonus}>+{bonusPct(third)}%</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const p = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 },
  podiumCol:  { alignItems: 'center', flex: 1 },
  avatar:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarGold: { backgroundColor: '#b8860b', borderWidth: 2, borderColor: '#ffd700' },
  avatarTxt:  { color: '#fff', fontSize: 22, fontWeight: '900' },
  rank:       { fontSize: 20, marginBottom: 2 },
  name:       { color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  flag:       { fontSize: 16, marginTop: 2, marginBottom: 6 },
  plinth:     { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  plinthCoins:{ color: '#fff', fontSize: 11, fontWeight: '800' },
  plinthBonus:{ color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WalletScreen({ navigation, route }) {
  const currentUser = route?.params?.currentUser || null;
  const {
    balance, spent, transactions, stamps, myStamps, myMonuments, monthlyEarned,
    earnCoins,
  } = useWallet();
  const [activeTab, setActiveTab] = useState('Earnings');

  const earned  = transactions.filter(t => t.type === 'earn');
  const spends  = transactions.filter(t => t.type === 'spend');
  const totalEarned = earned.reduce((s, t) => s + t.amount, 0);

  function handleGetCoins() {
    earnCoins(500, 'demo_seed', {});
    Alert.alert('🪙 500 coins added!', 'In the full app, purchase coins here via Apple Pay or card.');
  }

  function handleCashOut() {
    if (balance < 1000) {
      Alert.alert('Minimum 1,000 coins', 'Keep earning through live gifts and footprint royalties!');
      return;
    }
    Alert.alert(
      '💸 Cash Out',
      `${balance.toLocaleString()} coins ≈ $${coinsToUSD(balance)}\n\nWithdraw via PayPal or bank transfer in the full app.`,
      [{ text: 'Got it' }],
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Balance card */}
        <LinearGradient colors={['#1a1060', '#0d0a2e']} style={s.balanceCard}>
          <Text style={s.balanceLbl}>Bond Coins</Text>
          <View style={s.balanceRow}>
            <Text style={s.coinEmoji}>🪙</Text>
            <Text style={s.balanceNum}>{balance.toLocaleString()}</Text>
          </View>
          <Text style={s.balanceUSD}>≈ ${coinsToUSD(balance)} USD after 30% platform fee</Text>
          <View style={s.cardBtns}>
            <TouchableOpacity style={s.getBtn} onPress={handleGetCoins}>
              <Text style={s.getBtnTxt}>+ Get Coins</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.cashBtn, balance < 1000 && { opacity: 0.5 }]}
              onPress={handleCashOut}
            >
              <Text style={s.cashBtnTxt}>💸 Cash Out</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>🪙 {totalEarned.toLocaleString()}</Text>
            <Text style={s.statLbl}>Total Earned</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>📅 {monthlyEarned.toLocaleString()}</Text>
            <Text style={s.statLbl}>This Month</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>🌍 {myStamps.length + myMonuments.length}</Text>
            <Text style={s.statLbl}>Footprints</Text>
          </View>
        </View>

        {/* Tabs */}
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

        {/* ── Earnings ── */}
        {activeTab === 'Earnings' && (
          <View style={s.list}>
            {earned.length === 0
              ? <Text style={s.emptyTxt}>No earnings yet — go live and receive gifts!</Text>
              : earned.map(tx => (
                <View key={tx.id} style={s.txRow}>
                  <View>
                    <Text style={s.txSource}>{sourceLabel(tx.source)}</Text>
                    <Text style={s.txTime}>{relTime(tx.ts)}</Text>
                  </View>
                  <Text style={s.txEarn}>+{tx.amount.toLocaleString()} 🪙</Text>
                </View>
              ))
            }
          </View>
        )}

        {/* ── Spending ── */}
        {activeTab === 'Spending' && (
          <View style={s.list}>
            {spends.length === 0
              ? <Text style={s.emptyTxt}>No gifts sent yet — join a live event!</Text>
              : spends.map(tx => (
                <View key={tx.id} style={s.txRow}>
                  <View>
                    <Text style={s.txSource}>{sourceLabel(tx.source)}</Text>
                    <Text style={s.txTime}>{relTime(tx.ts)}</Text>
                  </View>
                  <Text style={s.txSpend}>-{tx.amount.toLocaleString()} 🪙</Text>
                </View>
              ))
            }
          </View>
        )}

        {/* ── Top Creators ── */}
        {activeTab === 'Creators' && (
          <View>
            {/* Podium */}
            <View style={s.creatorHeader}>
              <Text style={s.creatorTitle}>Top Creators — June 2026</Text>
              <Text style={s.creatorSub}>Ranking resets every calendar month. Top 3 earn a bonus payout on top of the standard 70%.</Text>
            </View>
            <CreatorPodium creators={DEMO_TOP_CREATORS} />

            {/* Creator cards */}
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
                    <Text style={s.creatorStats}>🪙 {c.coinsEarned.toLocaleString()} coins gifted</Text>
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

            {/* Payout comparison */}
            <View style={s.howCard}>
              <Text style={s.howTitle}>WorldBond vs Other Platforms</Text>
              <Text style={s.howSub}>What creators keep per $1 in gifts received</Text>
              {[
                { label: 'Bigo Live',        pct: '35%',  color: '#555',    you: false },
                { label: 'TikTok LIVE',      pct: '50%',  color: '#555',    you: false },
                { label: 'YouTube SuperChat', pct: '70%',  color: '#888',    you: false },
                { label: 'Twitch Bits',       pct: '71%',  color: '#888',    you: false },
                { label: 'WorldBond Base',    pct: '70%',  color: '#6C47FF', you: true  },
                { label: 'WorldBond Plus',    pct: '75%',  color: '#7c5cfc', you: true  },
                { label: 'WorldBond Pro',     pct: '80%',  color: '#9b7eff', you: true  },
                { label: '🥇 Top Creator',    pct: '85%',  color: '#ffd700', you: true  },
                { label: '+ Stamp Royalty',   pct: '+3%',  color: '#4ade80', you: true  },
                { label: '+ Monument Royalty',pct: '+2%',  color: '#4ade80', you: true  },
              ].map(row => (
                <View key={row.label} style={[s.compareRow, row.you && s.compareRowYou]}>
                  <Text style={[s.compareLabel, row.you && { color: '#fff' }]}>{row.label}</Text>
                  <Text style={[s.comparePct, { color: row.color }]}>{row.pct}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Footprints (Stamps + Monuments) ── */}
        {activeTab === 'Footprints' && (
          <View style={s.list}>

            {/* Country Stamps section */}
            <View style={s.footprintSection}>
              <Text style={s.footprintSectionTitle}>🌍 Country Stamps</Text>
              <Text style={s.footprintSectionSub}>1-of-1 per country · 195 worldwide · earn 3% royalty on all gifts to your country's streamers</Text>
            </View>
            {Object.entries(stamps).map(([flag, stamp]) => {
              const isMine = myStamps.includes(flag);
              return (
                <View key={flag} style={[s.fpRow, isMine && s.fpRowMine]}>
                  <Text style={s.fpIcon}>{flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fpHolder}>@{stamp.holder}</Text>
                    <Text style={s.fpEarned}>🪙 {stamp.coinsEarned.toLocaleString()} earned</Text>
                  </View>
                  {isMine && <View style={s.mineBadge}><Text style={s.mineBadgeTxt}>Yours</Text></View>}
                </View>
              );
            })}

            {/* Bond Monuments section */}
            <View style={[s.footprintSection, { marginTop: 20 }]}>
              <Text style={s.footprintSectionTitle}>🏛️ Bond Monuments</Text>
              <Text style={s.footprintSectionSub}>1-of-1 per landmark · 500 worldwide · earn 2% royalty from all gifts during streams in that region · claim free or challenge via 7-day gifting contest</Text>
            </View>
            {BOND_MONUMENTS.map(m => {
              const isMine = myMonuments.includes(m.id);
              const unclaimed = !m.holder;
              return (
                <View key={m.id} style={[s.fpRow, isMine && s.fpRowMine]}>
                  <Text style={s.fpIcon}>{m.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fpHolder}>{m.name}</Text>
                    <Text style={s.fpSub}>{m.location} {m.country}</Text>
                    {m.holder
                      ? <Text style={s.fpEarned}>@{m.holder} · 🪙 {m.coinsEarned.toLocaleString()}</Text>
                      : <Text style={[s.fpEarned, { color: '#4ade80' }]}>Unclaimed — tap to claim!</Text>
                    }
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

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#08090d' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: '#111318',
                    alignItems: 'center', justifyContent: 'center' },
  backIcon:       { color: '#fff', fontSize: 20 },
  title:          { color: '#fff', fontSize: 20, fontWeight: '900' },

  balanceCard:    { margin: 16, borderRadius: 24, padding: 24, alignItems: 'center', gap: 8 },
  balanceLbl:     { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700' },
  balanceRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinEmoji:      { fontSize: 36 },
  balanceNum:     { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  balanceUSD:     { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  cardBtns:       { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  getBtn:         { flex: 1, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#6C47FF', borderRadius: 16, paddingVertical: 13 },
  getBtnTxt:      { color: '#fff', fontSize: 15, fontWeight: '800' },
  cashBtn:        { flex: 1, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 13,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  cashBtnTxt:     { color: '#fff', fontSize: 15, fontWeight: '700' },

  statsRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard:       { flex: 1, backgroundColor: '#0f1116', borderRadius: 16, padding: 14,
                    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#1e2028' },
  statNum:        { color: '#fff', fontSize: 13, fontWeight: '800' },
  statLbl:        { color: '#555', fontSize: 11 },

  tabsRow:        { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  tab:            { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22,
                    backgroundColor: '#0f1116', borderWidth: 1, borderColor: '#1e2028' },
  tabActive:      { backgroundColor: '#6C47FF22', borderColor: '#6C47FF55' },
  tabTxt:         { color: '#555', fontSize: 13, fontWeight: '700' },
  tabTxtActive:   { color: '#7c5cfc' },

  list:           { paddingHorizontal: 16, gap: 8 },
  txRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: '#0f1116', borderRadius: 14, padding: 14,
                    borderWidth: 1, borderColor: '#1e2028' },
  txSource:       { color: '#fff', fontSize: 14, fontWeight: '700' },
  txTime:         { color: '#444', fontSize: 12, marginTop: 3 },
  txEarn:         { color: '#4ade80', fontSize: 14, fontWeight: '800' },
  txSpend:        { color: '#f87171', fontSize: 14, fontWeight: '800' },
  emptyTxt:       { color: '#444', fontSize: 14, textAlign: 'center', paddingVertical: 40, paddingHorizontal: 16 },

  // Creators tab
  creatorHeader:  { paddingHorizontal: 16, paddingBottom: 8 },
  creatorTitle:   { color: '#fff', fontSize: 17, fontWeight: '900' },
  creatorSub:     { color: '#555', fontSize: 13, marginTop: 4, lineHeight: 18 },
  creatorCard:    { borderRadius: 16, padding: 16, flexDirection: 'row',
                    alignItems: 'center', borderWidth: 1, borderColor: '#1e2028' },
  creatorLeft:    { flex: 1, gap: 3 },
  creatorBadge:   { color: '#ffd700', fontSize: 12, fontWeight: '800' },
  creatorName:    { color: '#fff', fontSize: 15, fontWeight: '800' },
  creatorStats:   { color: '#555', fontSize: 12 },
  creatorRight:   { alignItems: 'center', minWidth: 70 },
  creatorPayout:  { color: '#4ade80', fontSize: 22, fontWeight: '900' },
  creatorPayoutLbl:{ color: '#555', fontSize: 11 },
  creatorUSD:     { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  howCard:        { margin: 16, backgroundColor: '#0f1116', borderRadius: 18, padding: 18,
                    borderWidth: 1, borderColor: '#1e2028', gap: 12 },
  howTitle:       { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 2 },
  howSub:         { color: '#555', fontSize: 12, marginBottom: 8 },
  howRow:         { gap: 3 },
  howLabel:       { color: '#c0c4dc', fontSize: 13, fontWeight: '800' },
  howDesc:        { color: '#555', fontSize: 12, lineHeight: 17 },
  compareRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: 8, borderBottomWidth: 1, borderColor: '#1a1c28' },
  compareRowYou:  { backgroundColor: '#6C47FF0a', marginHorizontal: -18, paddingHorizontal: 18 },
  compareLabel:   { color: '#777', fontSize: 13 },
  comparePct:     { fontSize: 14, fontWeight: '900' },

  // Footprints tab
  footprintSection:   { backgroundColor: '#0f1116', borderRadius: 16, padding: 16,
                        borderWidth: 1, borderColor: '#1e2028', gap: 6, marginBottom: 4 },
  footprintSectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  footprintSectionSub:   { color: '#555', fontSize: 12, lineHeight: 18 },
  fpRow:          { flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: '#0f1116', borderRadius: 14, padding: 14,
                    borderWidth: 1, borderColor: '#1e2028' },
  fpRowMine:      { borderColor: '#6C47FF55', backgroundColor: '#6C47FF0a' },
  fpIcon:         { fontSize: 26 },
  fpHolder:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  fpSub:          { color: '#555', fontSize: 11, marginTop: 1 },
  fpEarned:       { color: '#FFB700', fontSize: 12, marginTop: 2 },
  mineBadge:      { backgroundColor: '#6C47FF33', borderRadius: 8, paddingHorizontal: 10,
                    paddingVertical: 4, borderWidth: 1, borderColor: '#6C47FF66' },
  mineBadgeTxt:   { color: '#7c5cfc', fontSize: 11, fontWeight: '800' },
  claimBtn:       { backgroundColor: '#4ade8022', borderRadius: 10, paddingHorizontal: 12,
                    paddingVertical: 6, borderWidth: 1, borderColor: '#4ade8055' },
  claimBtnTxt:    { color: '#4ade80', fontSize: 12, fontWeight: '800' },
  challengeBtn:   { backgroundColor: '#FFB70018', borderRadius: 10, paddingHorizontal: 10,
                    paddingVertical: 6, borderWidth: 1, borderColor: '#FFB70044' },
  challengeBtnTxt:{ color: '#FFB700', fontSize: 11, fontWeight: '700' },
});
