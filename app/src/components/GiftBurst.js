import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import GiftIcon from './GiftIcon';

const { width: W } = Dimensions.get('window');
// Cards sit in the bottom-left corner — narrow enough that the streamer
// stays fully visible on the right side of the screen.
const CARD_W = Math.min(W * 0.68, 268);

// ── Gift personality map ──────────────────────────────────────────────────────
// style: which burst animation to use
// hold:  how long the card stays on screen (ms) — scales with gift tier
// tier:  label shown inside the card
const GIFT_META = {
  world_hello:      { style: 'slide',  hold: 1800, tier: 'STARTER'  },
  bond_shake:       { style: 'pulse',  hold: 1800, tier: 'STARTER'  },
  postcard:         { style: 'slide',  hold: 1800, tier: 'STARTER'  },
  map_pin:          { style: 'drop',   hold: 2000, tier: 'STARTER'  },
  passport:         { style: 'orbit',  hold: 2200, tier: 'EXPLORER' },
  world_map:        { style: 'pulse',  hold: 2200, tier: 'EXPLORER' },
  first_class:      { style: 'orbit',  hold: 2200, tier: 'EXPLORER' },
  globe_spin:       { style: 'pulse',  hold: 2200, tier: 'EXPLORER' },
  heritage:         { style: 'rise',   hold: 2600, tier: 'VOYAGER'  },
  culture_crown:    { style: 'rise',   hold: 2600, tier: 'VOYAGER'  },
  embassy_seal:     { style: 'drop',   hold: 2600, tier: 'VOYAGER'  },
  bond_satellite:   { style: 'orbit',  hold: 3000, tier: 'ELITE'    },
  world_ambassador: { style: 'pulse',  hold: 3000, tier: 'ELITE'    },
  bond_atlas:       { style: 'rise',   hold: 3000, tier: 'ELITE'    },
};

function getMeta(id) {
  return GIFT_META[id] || { style: 'drop', hold: 2000, tier: 'STARTER' };
}

// ── Shared card visual ────────────────────────────────────────────────────────
function BurstCard({ burst, c, meta, iconAnim }) {
  const { gift, senderName, senderCountry } = burst;
  const coinStr = gift.coins >= 1000
    ? `${(gift.coins / 1000).toFixed(gift.coins % 1000 === 0 ? 0 : 1)}k`
    : String(gift.coins);

  return (
    <View style={[gb.card, { borderColor: c + '60', shadowColor: c }]}>
      {/* Left color stripe */}
      <View style={[gb.stripe, { backgroundColor: c }]} />

      {/* Icon with animated scale */}
      <Animated.View
        style={[
          gb.iconCircle,
          { borderColor: c + '70', backgroundColor: c + '16' },
          iconAnim ? { transform: [{ scale: iconAnim }] } : null,
        ]}
      >
        <GiftIcon id={gift.id} color={c} size={24} />
      </Animated.View>

      {/* Text block */}
      <View style={gb.info}>
        <View style={gb.senderRow}>
          <Text style={gb.flag}>{senderCountry || '🌍'}</Text>
          <Text style={gb.sender} numberOfLines={1}>{senderName}</Text>
        </View>
        <Text style={gb.giftName} numberOfLines={1}>{gift.name}</Text>
        {gift.tagline
          ? <Text style={[gb.tagline, { color: c + 'bb' }]} numberOfLines={1}>{gift.tagline}</Text>
          : null}
        <Text style={[gb.tierLabel, { color: c }]}>{meta.tier}</Text>
      </View>

      {/* Coin badge */}
      <View style={[gb.coinBadge, { borderColor: c + '44', backgroundColor: c + '12' }]}>
        <View style={[gb.coinDot, { backgroundColor: c }]} />
        <Text style={[gb.coinNum, { color: c }]}>{coinStr}</Text>
        <Text style={gb.bc}>BC</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE A — SLIDE  (world_hello, postcard)
// Sweeps in from the RIGHT side of the screen to its left-corner home.
// On landing: two quick ring pulses radiate from the icon. Exits right.
// (Speed lines off the left edge would fly off-screen given the card is
//  left-anchored, so we use a clean impact ring instead.)
// ─────────────────────────────────────────────────────────────────────────────
function SlideBurst({ burst, onDone }) {
  const c    = burst.gift.color || '#FF0080';
  const meta = getMeta(burst.gift.id);

  const slideX     = useRef(new Animated.Value(W + 20)).current;
  const cardOp     = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0.7)).current;
  const ring1Scale = useRef(new Animated.Value(0.4)).current;
  const ring1Op    = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.4)).current;
  const ring2Op    = useRef(new Animated.Value(0)).current;
  const exitX      = useRef(new Animated.Value(0)).current;
  const fade       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, friction: 7, tension: 85, useNativeDriver: true }),
        Animated.timing(cardOp, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      // Landing impact: icon punch + dual rings
      Animated.parallel([
        Animated.sequence([
          Animated.timing(iconScale, { toValue: 1.3,  duration: 90,  useNativeDriver: true }),
          Animated.spring(iconScale, { toValue: 1,    friction: 5, tension: 160, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring1Op,    { toValue: 1,   duration: 40,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ring1Scale, { toValue: 2.4, duration: 380, useNativeDriver: true }),
            Animated.timing(ring1Op,    { toValue: 0,   duration: 380, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(60),
          Animated.timing(ring2Op,    { toValue: 0.55, duration: 40,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ring2Scale, { toValue: 1.6, duration: 280, useNativeDriver: true }),
            Animated.timing(ring2Op,    { toValue: 0,   duration: 280, useNativeDriver: true }),
          ]),
        ]),
      ]),
      Animated.delay(meta.hold),
      // Exit right — back the way it came
      Animated.parallel([
        Animated.timing(exitX, { toValue: W + 30, duration: 340, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 0,      duration: 240, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, []);

  return (
    <Animated.View style={[
      gb.wrap,
      {
        opacity: Animated.multiply(cardOp, fade),
        transform: [{ translateX: Animated.add(slideX, exitX) }],
      },
    ]}>
      <Animated.View style={[gb.shockRing, { borderColor: c,        transform: [{ scale: ring1Scale }], opacity: ring1Op }]} />
      <Animated.View style={[gb.shockRing, { borderColor: c + '80', borderWidth: 1.5, transform: [{ scale: ring2Scale }], opacity: ring2Op }]} />
      <BurstCard burst={burst} c={c} meta={meta} iconAnim={iconScale} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE B — DROP  (map_pin, embassy_seal)
// Falls from above, lands with a double shockwave ring + 4 diagonal impact
// marks that shoot out from the icon. Exits back up to orbit.
// ─────────────────────────────────────────────────────────────────────────────
function DropBurst({ burst, onDone }) {
  const c    = burst.gift.color || '#FF0080';
  const meta = getMeta(burst.gift.id);

  const dropY      = useRef(new Animated.Value(-150)).current;
  const cardScale  = useRef(new Animated.Value(0.1)).current;
  const iconScale  = useRef(new Animated.Value(1)).current;
  const ring1Scale = useRef(new Animated.Value(0.4)).current;
  const ring1Op    = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.4)).current;
  const ring2Op    = useRef(new Animated.Value(0)).current;
  const exitY      = useRef(new Animated.Value(0)).current;
  const exitScale  = useRef(new Animated.Value(1)).current;
  const fade       = useRef(new Animated.Value(1)).current;

  // Impact marks — 4 diagonal lines
  const m0 = useRef(new Animated.Value(0)).current;
  const m1 = useRef(new Animated.Value(0)).current;
  const m2 = useRef(new Animated.Value(0)).current;
  const m3 = useRef(new Animated.Value(0)).current;

  const MARKS = [
    { val: m0, top: 22, left: -18, width: 26, rotation: '-42deg' },
    { val: m1, top: 48, left: -16, width: 20, rotation: '-60deg' },
    { val: m2, top: 14, left:   8, width: 30, rotation:  '28deg' },
    { val: m3, top: 58, left:  10, width: 16, rotation:  '52deg' },
  ];

  useEffect(() => {
    Animated.sequence([
      // Land
      Animated.parallel([
        Animated.spring(dropY,     { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      ]),
      // Impact
      Animated.parallel([
        Animated.sequence([
          Animated.timing(iconScale, { toValue: 1.5,  duration: 100, useNativeDriver: true }),
          Animated.spring(iconScale, { toValue: 1,    friction: 4, tension: 140, useNativeDriver: true }),
        ]),
        // Primary ring
        Animated.sequence([
          Animated.timing(ring1Op,    { toValue: 1,   duration: 40,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ring1Scale, { toValue: 3.0, duration: 500, useNativeDriver: true }),
            Animated.timing(ring1Op,    { toValue: 0,   duration: 500, useNativeDriver: true }),
          ]),
        ]),
        // Secondary tighter ring
        Animated.sequence([
          Animated.delay(70),
          Animated.timing(ring2Op,    { toValue: 0.65, duration: 40,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ring2Scale, { toValue: 1.8, duration: 340, useNativeDriver: true }),
            Animated.timing(ring2Op,    { toValue: 0,   duration: 340, useNativeDriver: true }),
          ]),
        ]),
        // Impact marks
        Animated.parallel(MARKS.map((m, i) =>
          Animated.sequence([
            Animated.delay(i * 20),
            Animated.timing(m.val, { toValue: 0.8, duration: 55, useNativeDriver: true }),
            Animated.delay(320),
            Animated.timing(m.val, { toValue: 0,   duration: 200, useNativeDriver: true }),
          ]),
        )),
      ]),
      Animated.delay(meta.hold),
      // Return to orbit
      Animated.parallel([
        Animated.timing(exitY,     { toValue: -170, duration: 420, useNativeDriver: true }),
        Animated.timing(exitScale, { toValue: 0.06, duration: 420, useNativeDriver: true }),
        Animated.timing(fade,      { toValue: 0,    duration: 320, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, []);

  return (
    <Animated.View style={[
      gb.wrap,
      {
        opacity: fade,
        transform: [
          { translateY: Animated.add(dropY, exitY) },
          { scale: Animated.multiply(cardScale, exitScale) },
        ],
      },
    ]}>
      {/* Shockwave rings — positioned over icon */}
      <Animated.View style={[gb.shockRing, { borderColor: c,         transform: [{ scale: ring1Scale }], opacity: ring1Op }]} />
      <Animated.View style={[gb.shockRing, { borderColor: c + '80',  borderWidth: 1.5, transform: [{ scale: ring2Scale }], opacity: ring2Op }]} />

      {/* Impact marks */}
      {MARKS.map((m, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          opacity: m.val,
          height: 2.5, borderRadius: 1.5,
          backgroundColor: c,
          width: m.width,
          top: m.top, left: m.left,
          transform: [{ rotate: m.rotation }],
        }} />
      ))}

      <BurstCard burst={burst} c={c} meta={meta} iconAnim={iconScale} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE C — PULSE  (bond_shake, world_map, globe_spin, world_ambassador)
// Materialises from the center outward. Three concentric expanding rings pulse
// out from the icon, and 6 dot particles fire in all directions. Collapses
// back to a point on exit.
// ─────────────────────────────────────────────────────────────────────────────
function PulseBurst({ burst, onDone }) {
  const c    = burst.gift.color || '#FF0080';
  const meta = getMeta(burst.gift.id);

  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOp    = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const fade      = useRef(new Animated.Value(1)).current;

  // Three expanding rings
  const r0s = useRef(new Animated.Value(0.1)).current; const r0o = useRef(new Animated.Value(0)).current;
  const r1s = useRef(new Animated.Value(0.1)).current; const r1o = useRef(new Animated.Value(0)).current;
  const r2s = useRef(new Animated.Value(0.1)).current; const r2o = useRef(new Animated.Value(0)).current;

  // Six dot particles — position via translateX/Y
  const d0x = useRef(new Animated.Value(0)).current; const d0y = useRef(new Animated.Value(0)).current; const d0o = useRef(new Animated.Value(0)).current;
  const d1x = useRef(new Animated.Value(0)).current; const d1y = useRef(new Animated.Value(0)).current; const d1o = useRef(new Animated.Value(0)).current;
  const d2x = useRef(new Animated.Value(0)).current; const d2y = useRef(new Animated.Value(0)).current; const d2o = useRef(new Animated.Value(0)).current;
  const d3x = useRef(new Animated.Value(0)).current; const d3y = useRef(new Animated.Value(0)).current; const d3o = useRef(new Animated.Value(0)).current;
  const d4x = useRef(new Animated.Value(0)).current; const d4y = useRef(new Animated.Value(0)).current; const d4o = useRef(new Animated.Value(0)).current;
  const d5x = useRef(new Animated.Value(0)).current; const d5y = useRef(new Animated.Value(0)).current; const d5o = useRef(new Animated.Value(0)).current;

  const DOTS = [
    { x: d0x, y: d0y, o: d0o, vx:   0, vy: -62 },
    { x: d1x, y: d1y, o: d1o, vx:  54, vy: -38 },
    { x: d2x, y: d2y, o: d2o, vx:  62, vy:  22 },
    { x: d3x, y: d3y, o: d3o, vx:  18, vy:  58 },
    { x: d4x, y: d4y, o: d4o, vx: -46, vy:  50 },
    { x: d5x, y: d5y, o: d5o, vx: -58, vy:  -8 },
  ];

  useEffect(() => {
    const dotAnims = DOTS.map(d =>
      Animated.parallel([
        Animated.timing(d.x, { toValue: d.vx, duration: 430, useNativeDriver: true }),
        Animated.timing(d.y, { toValue: d.vy, duration: 430, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(d.o, { toValue: 1,   duration: 75,  useNativeDriver: true }),
          Animated.timing(d.o, { toValue: 0,   duration: 310, useNativeDriver: true }),
        ]),
      ]),
    );

    Animated.sequence([
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
        Animated.timing(cardOp,    { toValue: 1, duration: 150, useNativeDriver: true }),
        // Three rings fire with staggered delay
        Animated.sequence([
          Animated.timing(r0o,    { toValue: 1,   duration: 45,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(r0s, { toValue: 2.4, duration: 420, useNativeDriver: true }),
            Animated.timing(r0o, { toValue: 0,   duration: 420, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(90),
          Animated.timing(r1o,    { toValue: 0.7, duration: 45,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(r1s, { toValue: 3.0, duration: 500, useNativeDriver: true }),
            Animated.timing(r1o, { toValue: 0,   duration: 500, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(r2o,    { toValue: 0.45, duration: 45,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(r2s, { toValue: 3.8, duration: 580, useNativeDriver: true }),
            Animated.timing(r2o, { toValue: 0,   duration: 580, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel(dotAnims),
      ]),
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.45, duration: 110, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1,    friction: 4, tension: 140, useNativeDriver: true }),
      ]),
      Animated.delay(meta.hold),
      // Collapse inward
      Animated.parallel([
        Animated.timing(cardScale, { toValue: 0, duration: 340, useNativeDriver: true }),
        Animated.timing(fade,      { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, []);

  return (
    <Animated.View style={[
      gb.wrap,
      { opacity: Animated.multiply(cardOp, fade), transform: [{ scale: cardScale }] },
    ]}>
      {/* Expanding rings centered on icon zone */}
      <Animated.View style={[gb.pulseRing, { borderColor: c,         transform: [{ scale: r0s }], opacity: r0o }]} />
      <Animated.View style={[gb.pulseRing, { borderColor: c + 'aa',  transform: [{ scale: r1s }], opacity: r1o }]} />
      <Animated.View style={[gb.pulseRing, { borderColor: c + '66',  transform: [{ scale: r2s }], opacity: r2o }]} />

      {/* Dot particles */}
      {DOTS.map((d, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          width: 7, height: 7, borderRadius: 4,
          backgroundColor: c,
          opacity: d.o,
          left: 46, top: 42,
          transform: [{ translateX: d.x }, { translateY: d.y }],
        }} />
      ))}

      <BurstCard burst={burst} c={c} meta={meta} iconAnim={iconScale} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE D — RISE  (heritage, culture_crown, bond_atlas)
// Drifts up from below with a slow, majestic energy. Five vertical sparkle
// streaks appear above the card as it arrives and drift higher. Continues
// rising on exit.
// ─────────────────────────────────────────────────────────────────────────────
function RiseBurst({ burst, onDone }) {
  const c    = burst.gift.color || '#FF0080';
  const meta = getMeta(burst.gift.id);

  const riseY     = useRef(new Animated.Value(180)).current;
  const cardOp    = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const exitY     = useRef(new Animated.Value(0)).current;
  const fade      = useRef(new Animated.Value(1)).current;

  // Vertical sparkle streaks — 5, each drifts upward
  const k0y = useRef(new Animated.Value(0)).current; const k0o = useRef(new Animated.Value(0)).current;
  const k1y = useRef(new Animated.Value(0)).current; const k1o = useRef(new Animated.Value(0)).current;
  const k2y = useRef(new Animated.Value(0)).current; const k2o = useRef(new Animated.Value(0)).current;
  const k3y = useRef(new Animated.Value(0)).current; const k3o = useRef(new Animated.Value(0)).current;
  const k4y = useRef(new Animated.Value(0)).current; const k4o = useRef(new Animated.Value(0)).current;

  const STREAKS = [
    { x: 18,               ky: k0y, ko: k0o, h: 24 },
    { x: CARD_W * 0.22,    ky: k1y, ko: k1o, h: 16 },
    { x: CARD_W * 0.42,    ky: k2y, ko: k2o, h: 30 },
    { x: CARD_W * 0.62,    ky: k3y, ko: k3o, h: 18 },
    { x: CARD_W * 0.80,    ky: k4y, ko: k4o, h: 22 },
  ];

  const streakAnims = STREAKS.map((sk, i) =>
    Animated.sequence([
      Animated.delay(i * 55),
      Animated.parallel([
        Animated.timing(sk.ko, { toValue: 0.9,   duration: 80,  useNativeDriver: true }),
        Animated.timing(sk.ky, { toValue: -34,   duration: 520, useNativeDriver: true }),
      ]),
      Animated.timing(sk.ko, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]),
  );

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(riseY,     { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.timing(cardOp,    { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 75, useNativeDriver: true }),
        Animated.parallel(streakAnims),
      ]),
      Animated.delay(meta.hold),
      // Rise away
      Animated.parallel([
        Animated.timing(exitY, { toValue: -200, duration: 500, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 0,    duration: 380, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, []);

  return (
    <Animated.View style={[
      gb.wrap,
      {
        opacity: Animated.multiply(cardOp, fade),
        transform: [{ translateY: Animated.add(riseY, exitY) }],
      },
    ]}>
      {/* Sparkle streaks above card */}
      {STREAKS.map((sk, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          width: 2.5, height: sk.h, borderRadius: 1.5,
          backgroundColor: c,
          opacity: sk.ko,
          left: sk.x,
          top: -sk.h - 6,
          transform: [{ translateY: sk.ky }],
        }} />
      ))}

      <BurstCard burst={burst} c={c} meta={meta} iconAnim={iconScale} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE E — ORBIT  (passport, first_class, bond_satellite)
// Sweeps in from the upper-right corner on a curved arc. A trail of 5 fading
// dots marks the path. On arrival, two rings fire from the icon. Exits back
// toward the upper-right corner it came from.
// ─────────────────────────────────────────────────────────────────────────────
function OrbitBurst({ burst, onDone }) {
  const c    = burst.gift.color || '#FF0080';
  const meta = getMeta(burst.gift.id);

  const slideX     = useRef(new Animated.Value(W * 0.48)).current;
  const slideY     = useRef(new Animated.Value(-90)).current;
  const cardScale  = useRef(new Animated.Value(0.2)).current;
  const cardOp     = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(1)).current;
  const ring1Scale = useRef(new Animated.Value(0.3)).current;
  const ring1Op    = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.3)).current;
  const ring2Op    = useRef(new Animated.Value(0)).current;
  const exitX      = useRef(new Animated.Value(0)).current;
  const exitY      = useRef(new Animated.Value(0)).current;
  const fade       = useRef(new Animated.Value(1)).current;

  // Orbit trail dots — 5 fading dots along entry arc
  const t0o = useRef(new Animated.Value(0)).current;
  const t1o = useRef(new Animated.Value(0)).current;
  const t2o = useRef(new Animated.Value(0)).current;
  const t3o = useRef(new Animated.Value(0)).current;
  const t4o = useRef(new Animated.Value(0)).current;
  const trailOps = [t0o, t1o, t2o, t3o, t4o];

  const TRAIL_DEFS = [
    { left: CARD_W * 0.88, top: -52 },
    { left: CARD_W * 0.80, top: -38 },
    { left: CARD_W * 0.72, top: -27 },
    { left: CARD_W * 0.64, top: -17 },
    { left: CARD_W * 0.56, top: -9  },
  ];

  useEffect(() => {
    const trailAnim = Animated.parallel(
      trailOps.map((op, i) =>
        Animated.sequence([
          Animated.delay(i * 24),
          Animated.timing(op, { toValue: 0.7, duration: 55, useNativeDriver: true }),
          Animated.delay(90),
          Animated.timing(op, { toValue: 0,   duration: 280, useNativeDriver: true }),
        ]),
      ),
    );

    Animated.sequence([
      Animated.parallel([
        Animated.spring(slideX,    { toValue: 0, friction: 7, tension: 78, useNativeDriver: true }),
        Animated.spring(slideY,    { toValue: 0, friction: 7, tension: 78, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 78, useNativeDriver: true }),
        Animated.timing(cardOp,    { toValue: 1, duration: 170, useNativeDriver: true }),
        trailAnim,
      ]),
      // Impact rings + icon pop
      Animated.parallel([
        Animated.sequence([
          Animated.timing(iconScale, { toValue: 1.4,  duration: 110, useNativeDriver: true }),
          Animated.spring(iconScale, { toValue: 1,    friction: 4, tension: 140, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring1Op,    { toValue: 1,   duration: 50,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ring1Scale, { toValue: 2.6, duration: 460, useNativeDriver: true }),
            Animated.timing(ring1Op,    { toValue: 0,   duration: 460, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(110),
          Animated.timing(ring2Op,    { toValue: 0.6, duration: 50,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ring2Scale, { toValue: 1.7, duration: 320, useNativeDriver: true }),
            Animated.timing(ring2Op,    { toValue: 0,   duration: 320, useNativeDriver: true }),
          ]),
        ]),
      ]),
      Animated.delay(meta.hold),
      // Return to upper-right
      Animated.parallel([
        Animated.timing(exitX, { toValue: W * 0.42, duration: 380, useNativeDriver: true }),
        Animated.timing(exitY, { toValue: -130,     duration: 380, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 0,        duration: 280, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, []);

  return (
    <Animated.View style={[
      gb.wrap,
      {
        opacity: Animated.multiply(cardOp, fade),
        transform: [
          { translateX: Animated.add(slideX, exitX) },
          { translateY: Animated.add(slideY, exitY) },
          { scale: cardScale },
        ],
      },
    ]}>
      {/* Orbit trail dots */}
      {trailOps.map((op, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: c,
          opacity: op,
          left: TRAIL_DEFS[i].left,
          top:  TRAIL_DEFS[i].top,
        }} />
      ))}

      {/* Impact rings */}
      <Animated.View style={[gb.shockRing, { borderColor: c,         transform: [{ scale: ring1Scale }], opacity: ring1Op }]} />
      <Animated.View style={[gb.shockRing, { borderColor: c + '80',  borderWidth: 1.5, transform: [{ scale: ring2Scale }], opacity: ring2Op }]} />

      <BurstCard burst={burst} c={c} meta={meta} iconAnim={iconScale} />
    </Animated.View>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function GiftBurst({ burst, onDone }) {
  const { style } = getMeta(burst.gift.id);
  switch (style) {
    case 'slide': return <SlideBurst  burst={burst} onDone={onDone} />;
    case 'pulse': return <PulseBurst  burst={burst} onDone={onDone} />;
    case 'rise':  return <RiseBurst   burst={burst} onDone={onDone} />;
    case 'orbit': return <OrbitBurst  burst={burst} onDone={onDone} />;
    default:      return <DropBurst   burst={burst} onDone={onDone} />;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const gb = StyleSheet.create({
  // Left-anchored — gifts appear in the bottom-left so the streamer stays
  // fully visible on the right half of the screen.
  wrap: {
    width: CARD_W,
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 8,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    // Semi-transparent so the stream background still reads through
    backgroundColor: 'rgba(4,5,18,0.82)',
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'visible',
    paddingVertical: 11,
    paddingRight: 12,
    gap: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 16,
  },

  stripe: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },

  iconCircle: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  info:      { flex: 1, gap: 1 },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flag:      { fontSize: 12 },
  sender:    { color: '#fff', fontSize: 12, fontWeight: '900', flex: 1 },
  giftName:  { color: 'rgba(255,255,255,0.84)', fontSize: 11, fontWeight: '700' },
  tagline:   { fontSize: 9, fontStyle: 'italic' },
  tierLabel: { fontSize: 7.5, fontWeight: '900', letterSpacing: 1.6, marginTop: 2 },

  coinBadge: {
    borderRadius: 11, paddingHorizontal: 8, paddingVertical: 7,
    borderWidth: 1, alignItems: 'center', gap: 2,
  },
  coinDot: { width: 6, height: 6, borderRadius: 3 },
  coinNum: { fontSize: 12, fontWeight: '900' },
  bc:      { color: 'rgba(255,255,255,0.34)', fontSize: 7.5, fontWeight: '800', letterSpacing: 0.5 },

  // Shared ring base for Drop and Orbit bursts — sits over the icon area
  shockRing: {
    position: 'absolute',
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2,
    left: 3, top: 3,
  },

  // Ring base for Pulse burst
  pulseRing: {
    position: 'absolute',
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 2,
    left: 3, top: 3,
  },
});
