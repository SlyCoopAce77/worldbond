import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  FlatList, ScrollView, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWallet } from '../context/WalletContext';

const { width } = Dimensions.get('window');

// ─── WorldBond-exclusive gifts (no generic food/love/emoji filler) ───────────
// Tiers: Starter → Explorer → Voyager → Elite → Legend
export const GIFTS = [
  // ── Starter — connection openers ──────────────────────────────────────────
  { id: 'world_hello',    symbol: '👋', name: 'World Hello',      tagline: 'Open a bond',           tier: 'starter',  coins: 5,     grad: ['#1b5e20', '#2e7d32'] },
  { id: 'bond_shake',     symbol: '🤝', name: 'Bond Shake',       tagline: 'Seal the connection',   tier: 'starter',  coins: 15,    grad: ['#1b5e20', '#2e7d32'] },
  { id: 'postcard',       symbol: '📮', name: 'Postcard',         tagline: 'Sent from your world',  tier: 'starter',  coins: 30,    grad: ['#1b5e20', '#2e7d32'] },
  { id: 'map_pin',        symbol: '📍', name: 'Map Pin',          tagline: 'You were here',         tier: 'starter',  coins: 50,    grad: ['#1b5e20', '#2e7d32'] },

  // ── Explorer — travel prestige ─────────────────────────────────────────────
  { id: 'passport',       symbol: '🛂', name: 'Passport',         tagline: 'Enter their world',     tier: 'explorer', coins: 100,   grad: ['#0d47a1', '#1565c0'] },
  { id: 'world_map',      symbol: '🗺️', name: 'World Map',        tagline: 'Chart new territory',   tier: 'explorer', coins: 200,   grad: ['#0d47a1', '#1565c0'] },
  { id: 'first_class',    symbol: '✈️', name: 'First Class',      tagline: 'Upgrade their stream',  tier: 'explorer', coins: 350,   grad: ['#0d47a1', '#1565c0'] },
  { id: 'globe_spin',     symbol: '🌏', name: 'Globe Spin',       tagline: 'The world is watching', tier: 'explorer', coins: 500,   grad: ['#0d47a1', '#1565c0'] },

  // ── Voyager — cultural ceremony ────────────────────────────────────────────
  { id: 'heritage',       symbol: '🏛️', name: 'Heritage',         tagline: 'Honor their culture',   tier: 'voyager',  coins: 750,   grad: ['#4a148c', '#6a1b9a'] },
  { id: 'culture_crown',  symbol: '👑', name: 'Culture Crown',    tagline: 'Crowned by the world',  tier: 'voyager',  coins: 1000,  grad: ['#4a148c', '#6a1b9a'] },
  { id: 'embassy_seal',   symbol: '🔏', name: 'Embassy Seal',     tagline: 'Official recognition',  tier: 'voyager',  coins: 1500,  grad: ['#4a148c', '#6a1b9a'] },

  // ── Elite — WorldBond ceremonies ───────────────────────────────────────────
  // Research: at this level gifts should feel like STATUS EVENTS, not objects.
  // TikTok's top gifts are animated characters (Lion, Universe, Drama Queen).
  // WorldBond's equivalents are diplomatic/cosmic ceremonies.
  { id: 'bond_satellite',     symbol: '🛸', name: 'Bond Satellite',   tagline: 'Connected from orbit',    tier: 'elite',  coins: 2500,  grad: ['#0a0e2e', '#283593'] },
  { id: 'world_ambassador',   symbol: '🎖️', name: 'World Ambassador', tagline: 'Highest diplomatic honor', tier: 'elite',  coins: 5000,  grad: ['#7b4f00', '#c8860a'] },
  { id: 'bond_atlas',         symbol: '🌐', name: 'Bond Atlas',       tagline: 'Holding the whole world',  tier: 'elite',  coins: 8000,  grad: ['#004d40', '#00897b'] },

  // ── Legend — once-in-a-stream moments ─────────────────────────────────────
  // These should feel like a ceremony that stops the stream.
  // The entire live room should react when one of these lands.
  { id: 'bond_sovereign',     symbol: '🫅', name: 'Bond Sovereign',   tagline: 'Crown them before the world',   tier: 'legend', coins: 15000, grad: ['#7f0000', '#b71c1c'] },
  { id: 'planet_bond',        symbol: '🪐', name: 'Planet Bond',      tagline: 'They have their own gravity',   tier: 'legend', coins: 30000, grad: ['#1a0050', '#6a1b9a'] },
  { id: 'bond_eternal',       symbol: '♾️', name: 'Bond Eternal',     tagline: 'This bond lasts forever',       tier: 'legend', coins: 100000,grad: ['#000000', '#0d0d1f'] },
];

const TIERS = [
  { id: 'all',      label: 'All',       color: '#7c5cfc' },
  { id: 'starter',  label: '🌱 Starter',  color: '#4caf50' },
  { id: 'explorer', label: '✈️ Explorer', color: '#42a5f5' },
  { id: 'voyager',  label: '🏛️ Voyager',  color: '#ab47bc' },
  { id: 'elite',    label: '🏆 Elite',    color: '#ef5350' },
  { id: 'legend',   label: '⭐ Legend',   color: '#ffa726' },
];

const TIER_LABEL = {
  starter:  'STARTER',
  explorer: 'EXPLORER',
  voyager:  'VOYAGER',
  elite:    'ELITE',
  legend:   'LEGEND',
};

function formatCoins(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

export default function GiftPicker({ visible, onClose, onSend, hostName }) {
  const [activeTier, setActiveTier] = useState('all');
  const { balance } = useWallet();

  const filtered = activeTier === 'all'
    ? GIFTS
    : GIFTS.filter(g => g.tier === activeTier);

  const activeColor = TIERS.find(t => t.id === activeTier)?.color || '#7c5cfc';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />

      <View style={s.sheet}>
        <View style={s.handle} />

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.titleRow}>
            <View>
              <Text style={s.title}>Send a Gift</Text>
              {hostName ? <Text style={s.hostLine}>to  {hostName}</Text> : null}
            </View>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Coin balance */}
          <LinearGradient colors={['#6C47FF', '#4a2bd4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.balanceCard}>
            <View>
              <Text style={s.balanceTop}>YOUR COINS</Text>
              <Text style={s.balanceNum}>{balance.toLocaleString()}</Text>
            </View>
            <Text style={s.balanceCoin}>🪙</Text>
          </LinearGradient>
        </View>

        {/* ── Tier filter ── */}
        <View style={s.tierSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tierRow}>
            {TIERS.map(tier => {
              const active = activeTier === tier.id;
              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    s.tierChip,
                    active
                      ? { backgroundColor: tier.color, borderColor: tier.color }
                      : { backgroundColor: '#222538', borderColor: '#363950' },
                  ]}
                  onPress={() => setActiveTier(tier.id)}
                >
                  <Text style={[s.tierChipLabel, active ? { color: '#fff', fontWeight: '800' } : { color: '#c0c4dc' }]}>
                    {tier.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Gift grid ── */}
        <FlatList
          data={filtered}
          numColumns={3}
          keyExtractor={g => g.id}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const canAfford = balance >= item.coins;
            const isLegend = item.tier === 'legend';
            const isElite  = item.tier === 'elite';
            return (
              <TouchableOpacity
                style={[
                  s.card,
                  isLegend && s.cardLegend,
                  isElite  && s.cardElite,
                  !canAfford && s.cardLocked,
                ]}
                onPress={() => canAfford && (onSend(item), onClose())}
                activeOpacity={canAfford ? 0.75 : 1}
              >
                {/* Gradient top */}
                <LinearGradient colors={item.grad} style={[s.cardTop, isLegend && s.cardTopLegend]}>
                  <View style={[s.tierBadge, isLegend && s.tierBadgeLegend, isElite && s.tierBadgeElite]}>
                    <Text style={s.tierBadgeTxt}>{TIER_LABEL[item.tier]}</Text>
                  </View>
                  <Text style={[s.cardSymbol, isLegend && s.cardSymbolLegend, !canAfford && { opacity: 0.25 }]}>
                    {item.symbol}
                  </Text>
                </LinearGradient>

                {/* Info bottom */}
                <View style={[s.cardBottom, isLegend && s.cardBottomLegend]}>
                  <Text style={[s.cardName, !canAfford && { color: '#444' }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.tagline ? (
                    <Text style={[s.cardTagline, !canAfford && { opacity: 0.3 }]} numberOfLines={1}>
                      {item.tagline}
                    </Text>
                  ) : null}
                  <View style={[s.priceRow, isLegend && s.priceRowLegend]}>
                    <Text style={s.priceCoin}>🪙</Text>
                    <Text style={[s.priceNum, isLegend && { color: '#ffd700' }, !canAfford && { color: '#333' }]}>
                      {formatCoins(item.coins)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {balance < 100 && (
          <View style={s.lowBanner}>
            <Text style={s.lowBannerTxt}>🪙 Low coins — earn more by going live or receiving gifts</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const CARD_SIZE = Math.floor((width - 52) / 3);

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },

  sheet: {
    backgroundColor: '#13151f',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    paddingBottom: 44,
    borderTopWidth: 1,
    borderColor: '#252840',
  },

  handle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: '#363950',
    alignSelf: 'center', marginTop: 14,
  },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  hostLine: { color: '#7c80a0', fontSize: 14, marginTop: 4 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#222538', borderWidth: 1, borderColor: '#363950',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { color: '#9096b8', fontSize: 14, fontWeight: '700' },

  balanceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 18, paddingHorizontal: 22, paddingVertical: 16,
  },
  balanceTop: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  balanceNum: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginTop: 2 },
  balanceCoin: { fontSize: 44 },

  // Tier filter
  tierSection: {
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1f2235',
  },
  tierRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tierChip: {
    paddingHorizontal: 15, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1,
  },
  tierChipLabel: { fontSize: 13 },

  // Gift cards
  grid: { padding: 12, gap: 8 },
  card: {
    width: CARD_SIZE,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1a1d2e',
    borderWidth: 1,
    borderColor: '#252840',
  },
  cardElite:  { borderColor: '#c8860a55', borderWidth: 1.5 },
  cardLegend: { borderColor: '#ffd700', borderWidth: 2 },
  cardLocked: { opacity: 0.35 },

  cardTop: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  cardTopLegend: { height: 110 },

  tierBadge: {
    position: 'absolute', top: 7, left: 7,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  tierBadgeElite:  { backgroundColor: 'rgba(200,134,10,0.5)' },
  tierBadgeLegend: { backgroundColor: 'rgba(255,215,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.5)' },
  tierBadgeTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },

  cardSymbol:       { fontSize: 38, marginTop: 10 },
  cardSymbolLegend: { fontSize: 48, marginTop: 12 },

  cardBottom: {
    paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: '#1a1d2e',
    gap: 4,
  },
  cardBottomLegend: { backgroundColor: '#0d0a00', paddingVertical: 12 },
  cardName: { color: '#dce0f0', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  cardTagline: { color: '#6b6f8a', fontSize: 9, textAlign: 'center', fontStyle: 'italic' },

  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#0e1020', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, marginTop: 2,
  },
  priceRowLegend: { backgroundColor: '#1a1200', borderWidth: 1, borderColor: '#ffd70044' },
  priceCoin: { fontSize: 11 },
  priceNum:  { color: '#e0e4f8', fontSize: 12, fontWeight: '800' },

  lowBanner: {
    marginHorizontal: 16, marginTop: 10, backgroundColor: '#1a1300',
    borderRadius: 14, borderWidth: 1, borderColor: '#ffa72644',
    paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center',
  },
  lowBannerTxt: { color: '#ffa726', fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
