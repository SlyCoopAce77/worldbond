import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import GiftIcon from './GiftIcon';

const { width: W, height: H } = Dimensions.get('window');

const ICON_SIZE     = 40;
const ICON_REST_TOP = H * 0.34;
const RING_SIZE     = Math.min(W, H) * 0.65;
const CARD_W        = Math.min(W - 40, 340);

const LEGEND_IDS = new Set(['bond_sovereign', 'planet_bond', 'bond_eternal']);

export function isLegendGift(id) {
  return LEGEND_IDS.has(id);
}

// Full-screen takeover for Legend-tier gifts.
// 5 phases: dim+flag watermark → icon rockets from bottom-right → impact flash+shockwave
//           → gift info card slides up + hold → fade out.
export default function WorldDrop({ drop, onDone }) {
  const overlay   = useRef(new Animated.Value(0)).current;
  const flagOp    = useRef(new Animated.Value(0)).current;
  const flagScale = useRef(new Animated.Value(0.6)).current;
  const iconX     = useRef(new Animated.Value(W * 0.42)).current;
  const iconY     = useRef(new Animated.Value(H * 0.44)).current;
  const iconScale = useRef(new Animated.Value(0.2)).current;
  const flashOp   = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.1)).current;
  const ringOp    = useRef(new Animated.Value(0)).current;
  const cardOp    = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(24)).current;
  const exitOp    = useRef(new Animated.Value(1)).current;

  const c = drop.gift.color || '#FF0080';

  useEffect(() => {
    Animated.sequence([
      // Phase 1 — screen dims, country flag watermark in
      Animated.parallel([
        Animated.timing(overlay,   { toValue: 0.88, duration: 350, useNativeDriver: true }),
        Animated.timing(flagOp,    { toValue: 0.14, duration: 500, useNativeDriver: true }),
        Animated.spring(flagScale, { toValue: 1,    friction: 8, tension: 50, useNativeDriver: true }),
      ]),
      // Phase 2 — icon rockets from bottom-right to rest position
      Animated.parallel([
        Animated.spring(iconX,     { toValue: 0,   friction: 6, tension: 90, useNativeDriver: true }),
        Animated.spring(iconY,     { toValue: 0,   friction: 6, tension: 90, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 3.2, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      // Phase 3 — impact: white flash + shockwave ring + icon settles
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flashOp, { toValue: 0.65, duration: 80,  useNativeDriver: true }),
          Animated.timing(flashOp, { toValue: 0,    duration: 240, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ringOp,    { toValue: 1,   duration: 60,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ringScale, { toValue: 6,   duration: 550, useNativeDriver: true }),
            Animated.timing(ringOp,    { toValue: 0,   duration: 550, useNativeDriver: true }),
          ]),
        ]),
        Animated.spring(iconScale, { toValue: 2.0, friction: 4, tension: 140, useNativeDriver: true }),
      ]),
      // Phase 4 — info card slides up + hold
      Animated.sequence([
        Animated.parallel([
          Animated.timing(cardOp,    { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.spring(cardSlide, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
        ]),
        Animated.delay(2400),
      ]),
      // Phase 5 — fade out
      Animated.timing(exitOp, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start(() => onDone(drop.id));
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, wd.root, { opacity: exitOp }]} pointerEvents="none">
      {/* Dim overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: overlay }]} />

      {/* Country flag — giant watermark behind everything */}
      <Animated.Text style={[wd.bigFlag, { opacity: flagOp, transform: [{ scale: flagScale }] }]}>
        {drop.senderCountry || '🌍'}
      </Animated.Text>

      {/* White flash on impact */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: flashOp }]} />

      {/* Shockwave ring — expands from icon center outward */}
      <Animated.View style={[
        wd.shockRing,
        { borderColor: c, transform: [{ scale: ringScale }], opacity: ringOp },
      ]} />

      {/* Gift icon — flies from bottom-right, lands above card */}
      <Animated.View style={[
        wd.iconWrap,
        { transform: [{ translateX: iconX }, { translateY: iconY }, { scale: iconScale }] },
      ]}>
        <GiftIcon id={drop.gift.id} color={c} size={ICON_SIZE} />
      </Animated.View>

      {/* Gift info card — fades + slides up during hold */}
      <Animated.View style={[
        wd.cardWrap,
        { opacity: cardOp, transform: [{ translateY: cardSlide }] },
      ]}>
        <LinearGradient
          colors={['rgba(10,10,25,0.97)', 'rgba(22,0,44,0.97)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[wd.cardGrad, { borderColor: c + '55' }]}
        >
          {/* Sender row */}
          <View style={wd.senderRow}>
            <Text style={wd.senderFlag}>{drop.senderCountry || '🌍'}</Text>
            <Text style={wd.senderName} numberOfLines={1}>{drop.senderName}</Text>
            {drop.isStampHolder ? (
              <View style={wd.stampBadge}>
                <Text style={wd.stampTxt}>🏅 Stamp Holder</Text>
              </View>
            ) : null}
          </View>

          <View style={[wd.divider, { backgroundColor: c + '30' }]} />

          {/* Gift name + tagline */}
          <View style={wd.giftMeta}>
            <Text style={[wd.giftName, { color: c }]}>{drop.gift.name}</Text>
            {drop.gift.tagline ? (
              <Text style={wd.giftTagline}>{drop.gift.tagline}</Text>
            ) : null}
          </View>

          {/* Coin value */}
          <View style={[wd.coinRow, { borderColor: c + '40', backgroundColor: c + '0e' }]}>
            <View style={[wd.coinDot, { backgroundColor: c }]} />
            <Text style={[wd.coinNum, { color: c }]}>
              {drop.gift.coins >= 1000
                ? `${(drop.gift.coins / 1000).toFixed(drop.gift.coins % 1000 === 0 ? 0 : 1)}k`
                : drop.gift.coins}
            </Text>
            <Text style={wd.coinLabel}>BOND COINS</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const wd = StyleSheet.create({
  root: { zIndex: 999 },

  bigFlag: {
    position: 'absolute',
    fontSize: W * 0.85,
    textAlign: 'center',
    left: 0, right: 0,
    top: H * 0.06,
  },

  shockRing: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    left: W / 2 - RING_SIZE / 2,
    top:  ICON_REST_TOP + ICON_SIZE / 2 - RING_SIZE / 2,
  },

  iconWrap: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    left: W / 2 - ICON_SIZE / 2,
    top:  ICON_REST_TOP,
  },

  cardWrap: {
    position: 'absolute',
    width: CARD_W,
    left: (W - CARD_W) / 2,
    top:  ICON_REST_TOP + ICON_SIZE * 2.0 + 40,
  },
  cardGrad: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 20,
    gap: 14,
  },

  senderRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  senderFlag: { fontSize: 20 },
  senderName: { color: '#fff', fontSize: 15, fontWeight: '800', flex: 1 },
  stampBadge: {
    backgroundColor: '#FFB70018', borderWidth: 1, borderColor: '#FFB70044',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  stampTxt: { color: '#FFB700', fontSize: 10, fontWeight: '800' },

  divider: { height: 1 },

  giftMeta:    { alignItems: 'center', gap: 5 },
  giftName:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.2, textAlign: 'center' },
  giftTagline: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

  coinRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1, borderRadius: 14,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  coinDot:   { width: 7, height: 7, borderRadius: 4 },
  coinNum:   { fontSize: 18, fontWeight: '900' },
  coinLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
