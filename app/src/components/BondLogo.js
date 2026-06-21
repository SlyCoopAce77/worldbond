import React from 'react';
import { View, Text, Animated } from 'react-native';

// ─── WorldMark — "The World Is A Person" ─────────────────────────────────────
//
// A complete optical illusion. Globe lines are also facial features:
//
//   Equatorial oval (tilted)   → latitude line   AND   upper face structure
//   Two short tilted lines     → latitude arcs   AND   eyebrows
//   Meridian oval (scaleX)     → prime meridian  AND   nose bridge
//   Amber dots (large)         → cities           AND   eyes  (amber = human warmth)
//   Dark pupils                → depth            AND   the blank stare
//   Horizontal mouth line      → equator          AND   flat expression
//
// Neither reading wins. Your brain flips between them and can't stop.
// That's the stamp.
//
export function WorldMark({
  size = 40,
  color = '#fff',
  strokeWidth,
  bondColor,
  worldColor,
  drawProgress,
  bondScale,
  style,
}) {
  const sw    = strokeWidth ?? Math.max(1.6, size * 0.044);
  const arcC  = worldColor ?? color;
  const bondC = bondColor  ?? color;

  const globeR = size * 0.430;
  const cx     = size / 2;
  const cy     = size / 2;

  // ── Face geometry ─────────────────────────────────────────────────────
  // Eyes — human upper-third face position
  const eyeR  = Math.max(3.8, size * 0.128);
  const eyeY  = cy - globeR * 0.14;
  const eyeXL = cx - globeR * 0.285;
  const eyeXR = cx + globeR * 0.285;

  // Pupil — the blank in the blank stare
  const pupilR = eyeR * 0.30;

  // Eye halo
  const haloR  = eyeR * 1.58;

  // Eyebrows — short angled lines just above each eye (also read as latitude arcs)
  const browW  = eyeR * 1.30;
  const browH  = Math.max(0.8, sw * 0.44);
  const browY  = eyeY - eyeR * 1.52;

  // Mouth — thin horizontal line in lower-face zone (also reads as equator)
  const mouthY  = cy + globeR * 0.40;
  const mouthW  = globeR * 1.18;

  // Ambient depth fill behind eyes
  const depthR  = globeR * 0.58;

  // ── Animation ─────────────────────────────────────────────────────────
  const outerAlpha = drawProgress
    ? drawProgress[0].interpolate({ inputRange: [0, 1], outputRange: [0, 0.76] })
    : 0.76;
  const eqAlpha = drawProgress
    ? drawProgress[0].interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] })
    : 0.18;
  const meridAlpha = drawProgress
    ? drawProgress[1].interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] })
    : 0.22;
  const faceAlpha = drawProgress
    ? drawProgress[1].interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] })
    : 0.28;

  const eyeTransform = bondScale ? [{ scale: bondScale }] : [];

  const ringGlow = {
    shadowColor: arcC,
    shadowRadius: size * 0.060,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 0 },
  };
  const eyeGlow = {
    shadowColor: bondC,
    shadowRadius: size * 0.10,
    shadowOpacity: 0.88,
    shadowOffset: { width: 0, height: 0 },
  };

  return (
    <View style={[{ width: size, height: size }, style]}>

      {/* Ambient warm fill — the light within */}
      <View style={{
        position: 'absolute',
        width: depthR * 2, height: depthR * 2, borderRadius: depthR,
        backgroundColor: bondC, opacity: 0.06,
        left: cx - depthR, top: cy - depthR,
      }} />

      {/* Equatorial oval — tilted (latitude line / upper face depth) */}
      <Animated.View style={{
        position: 'absolute',
        width: globeR * 2, height: globeR * 2, borderRadius: globeR,
        borderWidth: sw * 0.46, borderColor: arcC,
        left: cx - globeR, top: cy - globeR,
        opacity: eqAlpha,
        transform: [{ scaleY: 0.28 }, { rotate: '18deg' }],
      }} />

      {/* Meridian oval — vertical (prime meridian / nose bridge) */}
      <Animated.View style={{
        position: 'absolute',
        width: globeR * 2, height: globeR * 2, borderRadius: globeR,
        borderWidth: sw * 0.46, borderColor: arcC,
        left: cx - globeR, top: cy - globeR,
        opacity: meridAlpha,
        transform: [{ scaleX: 0.28 }],
      }} />

      {/* Outer globe ring — the face/world outline */}
      <Animated.View style={[{
        position: 'absolute',
        width: globeR * 2, height: globeR * 2, borderRadius: globeR,
        borderWidth: sw, borderColor: arcC,
        left: cx - globeR, top: cy - globeR,
        opacity: outerAlpha,
      }, ringGlow]} />

      {/* Eyebrows — angled latitude arcs / brow structure */}
      <Animated.View style={{ position: 'absolute', width: size, height: size, opacity: faceAlpha }}>
        {/* Left brow — angles down-left to up-right (natural brow angle) */}
        <View style={{
          position: 'absolute',
          width: browW, height: browH,
          backgroundColor: arcC, borderRadius: browH / 2,
          left: eyeXL - browW * 0.52, top: browY,
          transform: [{ rotate: '-9deg' }],
        }} />
        {/* Right brow — mirrors */}
        <View style={{
          position: 'absolute',
          width: browW, height: browH,
          backgroundColor: arcC, borderRadius: browH / 2,
          left: eyeXR - browW * 0.48, top: browY,
          transform: [{ rotate: '9deg' }],
        }} />
      </Animated.View>

      {/* Mouth line — flat expression / equatorial line */}
      <Animated.View style={{
        position: 'absolute',
        width: mouthW, height: Math.max(0.8, sw * 0.42),
        backgroundColor: arcC, borderRadius: 1,
        left: cx - mouthW / 2, top: mouthY,
        opacity: faceAlpha,
      }} />

      {/* Eye glow halos */}
      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: eyeTransform }}>
        <View style={{
          position: 'absolute',
          width: haloR * 2, height: haloR * 2, borderRadius: haloR,
          backgroundColor: bondC, opacity: 0.15,
          left: eyeXL - haloR, top: eyeY - haloR,
        }} />
        <View style={{
          position: 'absolute',
          width: haloR * 2, height: haloR * 2, borderRadius: haloR,
          backgroundColor: bondC, opacity: 0.15,
          left: eyeXR - haloR, top: eyeY - haloR,
        }} />
      </Animated.View>

      {/* Amber eyes */}
      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: eyeTransform }}>
        <View style={[{
          position: 'absolute',
          width: eyeR * 2, height: eyeR * 2, borderRadius: eyeR,
          backgroundColor: bondC,
          left: eyeXL - eyeR, top: eyeY - eyeR,
        }, eyeGlow]} />
        <View style={[{
          position: 'absolute',
          width: eyeR * 2, height: eyeR * 2, borderRadius: eyeR,
          backgroundColor: bondC,
          left: eyeXR - eyeR, top: eyeY - eyeR,
        }, eyeGlow]} />
      </Animated.View>

      {/* Pupils — the blank stare */}
      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: eyeTransform }}>
        <View style={{
          position: 'absolute',
          width: pupilR * 2, height: pupilR * 2, borderRadius: pupilR,
          backgroundColor: '#030202', opacity: 0.72,
          left: eyeXL - pupilR, top: eyeY - pupilR,
        }} />
        <View style={{
          position: 'absolute',
          width: pupilR * 2, height: pupilR * 2, borderRadius: pupilR,
          backgroundColor: '#030202', opacity: 0.72,
          left: eyeXR - pupilR, top: eyeY - pupilR,
        }} />
      </Animated.View>

    </View>
  );
}

// ─── WorldWordmark ─────────────────────────────────────────────────────────────
export function WorldWordmark({ size = 16, color = '#fff', bondColor, bondTextColor, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <WorldMark size={size * 1.9} color={color} bondColor={bondColor} />
      <View style={{ gap: 0 }}>
        <Text style={{
          color, opacity: 0.70,
          fontSize: size * 0.56, fontWeight: '500',
          letterSpacing: 2.8, lineHeight: size * 0.68,
        }}>WORLD</Text>
        <Text style={{
          color: bondTextColor ?? color,
          fontSize: size * 0.84, fontWeight: '900',
          letterSpacing: 0.2, lineHeight: size * 0.96,
        }}>BOND</Text>
      </View>
    </View>
  );
}

// ─── Legacy ───────────────────────────────────────────────────────────────────
export function BondMark({ ringSize = 18, color = '#fff', strokeWidth, style }) {
  const sw = strokeWidth ?? Math.max(1.2, ringSize * 0.08);
  const overlap = ringSize * 0.32;
  const totalW  = ringSize * 2 - overlap;
  const r       = ringSize / 2;
  const dotSize = Math.max(3, ringSize * 0.13);
  return (
    <View style={[{ width: totalW, height: ringSize }, style]}>
      <View style={{ position: 'absolute', left: 0, width: ringSize, height: ringSize, borderRadius: r, borderWidth: sw, borderColor: color }} />
      <View style={{ position: 'absolute', left: totalW - ringSize, width: ringSize, height: ringSize, borderRadius: r, borderWidth: sw, borderColor: color }} />
      <View style={{ position: 'absolute', width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color, opacity: 0.75, left: totalW / 2 - dotSize / 2, top: ringSize / 2 - dotSize / 2 }} />
    </View>
  );
}

export function BondWordmark({ size = 16, color = '#fff', style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <BondMark ringSize={size} color={color} />
      <View style={{ gap: 0 }}>
        <Text style={{ color, opacity: 0.5, fontSize: size * 0.58, fontWeight: '300', letterSpacing: 2.6, lineHeight: size * 0.68 }}>WORLD</Text>
        <Text style={{ color, fontSize: size * 0.85, fontWeight: '900', letterSpacing: 0.2, lineHeight: size * 0.95 }}>BOND</Text>
      </View>
    </View>
  );
}
