import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import GiftIcon from './GiftIcon';

const { width: W } = Dimensions.get('window');
const CARD_W = W * 0.82;

// WorldBond "Global Drop" — 1 of 1 live gift burst.
// Drops from orbit above, lands with an expanding glow ring (shockwave),
// holds so the streamer can react, then shoots back upward to orbit.
export default function GiftBurst({ burst, onDone }) {
  const dropY       = useRef(new Animated.Value(-130)).current;
  const cardScale   = useRef(new Animated.Value(0.12)).current;
  const iconScale   = useRef(new Animated.Value(1)).current;
  const ringScale   = useRef(new Animated.Value(0.4)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const exitY       = useRef(new Animated.Value(0)).current;
  const exitScale   = useRef(new Animated.Value(1)).current;
  const fade        = useRef(new Animated.Value(1)).current;

  const c = burst.gift.color || '#FF0080';

  useEffect(() => {
    Animated.sequence([
      // 1. Drop from orbit + scale from a distant point
      Animated.parallel([
        Animated.spring(dropY,     { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      ]),
      // 2. Impact — icon punches outward + glow ring expands like a shockwave
      Animated.parallel([
        Animated.sequence([
          Animated.timing(iconScale, { toValue: 1.5, duration: 110, useNativeDriver: true }),
          Animated.spring(iconScale, { toValue: 1,   friction: 4,  tension: 130, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, { toValue: 1,   duration: 50,  useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(ringScale,   { toValue: 2.6, duration: 520, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0,   duration: 520, useNativeDriver: true }),
          ]),
        ]),
      ]),
      // 3. Hold — streamer reads it
      Animated.delay(2500),
      // 4. Return to orbit — shoots up and shrinks to a point
      Animated.parallel([
        Animated.timing(exitY,     { toValue: -150, duration: 420, useNativeDriver: true }),
        Animated.timing(exitScale, { toValue: 0.08, duration: 420, useNativeDriver: true }),
        Animated.timing(fade,      { toValue: 0,    duration: 340, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, []);

  return (
    <Animated.View
      style={[
        gb.wrap,
        {
          opacity: fade,
          transform: [
            { translateY: Animated.add(dropY, exitY) },
            { scale: Animated.multiply(cardScale, exitScale) },
          ],
        },
      ]}
    >
      {/* Origin tag — "arrived from here" */}
      <View style={gb.originRow}>
        <Text style={gb.flagText}>{burst.senderCountry || '🌍'}</Text>
        <Text style={gb.dropLabel}>GLOBAL DROP</Text>
      </View>

      <View style={[gb.card, { borderColor: c + '70', shadowColor: c }]}>
        {/* Tier-color accent stripe */}
        <View style={[gb.accentBar, { backgroundColor: c }]} />

        {/* Icon zone — orbit circle + expanding ring */}
        <View style={gb.iconZone}>
          <Animated.View
            style={[gb.glowRing, { borderColor: c, transform: [{ scale: ringScale }], opacity: ringOpacity }]}
          />
          <Animated.View
            style={[
              gb.orbitCircle,
              { backgroundColor: c + '22', borderColor: c + '70' },
              { transform: [{ scale: iconScale }] },
            ]}
          >
            <GiftIcon id={burst.gift.id} color={c} size={30} />
          </Animated.View>
        </View>

        {/* Text */}
        <View style={gb.info}>
          <Text style={gb.senderName} numberOfLines={1}>{burst.senderName}</Text>
          <Text style={gb.giftName} numberOfLines={1}>{burst.gift.name}</Text>
          {burst.gift.tagline ? (
            <Text style={[gb.tagline, { color: c + 'cc' }]} numberOfLines={1}>{burst.gift.tagline}</Text>
          ) : null}
        </View>

        {/* Coin badge */}
        <View style={[gb.coinBadge, { borderColor: c + '50', backgroundColor: c + '18' }]}>
          <View style={[gb.coinDot, { backgroundColor: c }]} />
          <Text style={[gb.coinsNum, { color: c }]}>
            {burst.gift.coins >= 1000
              ? `${(burst.gift.coins / 1000).toFixed(burst.gift.coins % 1000 === 0 ? 0 : 1)}k`
              : burst.gift.coins}
          </Text>
          <Text style={gb.bcLabel}>BC</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const gb = StyleSheet.create({
  wrap: {
    width: CARD_W,
    alignSelf: 'center',
    marginBottom: 10,
  },

  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 76,
    marginBottom: -7,
    zIndex: 2,
  },
  flagText:  { fontSize: 15 },
  dropLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '900', letterSpacing: 2 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5,6,16,0.94)',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'visible',
    paddingVertical: 16,
    paddingRight: 16,
    gap: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 16,
  },

  accentBar: { width: 6, alignSelf: 'stretch', borderRadius: 3 },

  iconZone:    { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  glowRing:    { position: 'absolute', width: 66, height: 66, borderRadius: 33, borderWidth: 2 },
  orbitCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  info:       { flex: 1, gap: 3 },
  senderName: { color: '#fff',              fontSize: 15, fontWeight: '900' },
  giftName:   { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  tagline:    { fontSize: 11, fontStyle: 'italic' },

  coinBadge: {
    borderRadius: 14, paddingHorizontal: 11, paddingVertical: 10,
    borderWidth: 1, alignItems: 'center', gap: 3,
  },
  coinDot:   { width: 8, height: 8, borderRadius: 4 },
  coinsNum:  { fontSize: 14, fontWeight: '900' },
  bcLabel:   { color: 'rgba(255,255,255,0.38)', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
