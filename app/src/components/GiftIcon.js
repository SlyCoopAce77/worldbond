import React from 'react';
import { View } from 'react-native';

// WorldBond gift icons — 100% geometry, zero emoji, zero images.
// Design language: orbits, arcs, rings, radar, bonds, world-connections.
// None of these mimic standard emoji shapes — each is unique to WorldBond.

function GiftIcon({ id, color, size = 38 }) {
  const c = color;
  const s = size;

  switch (id) {

    // ── Starter ───────────────────────────────────────────────────────────────

    case 'world_hello': {
      // Two orbit rings overlapping — the moment two worlds meet
      const r = s * 0.34;
      const off = r * 0.58;
      return (
        <View style={{ width: s, height: s }}>
          <View style={[ring(r * 2, c, 2.5, c + '18'), { position: 'absolute', left: s / 2 - r - off / 2, top: s / 2 - r }]} />
          <View style={[ring(r * 2, c, 2.5, c + '18'), { position: 'absolute', left: s / 2 - r + off / 2, top: s / 2 - r }]} />
          <View style={[dot(s * 0.13, c), { position: 'absolute', left: s / 2 - s * 0.065, top: s / 2 - s * 0.065 }]} />
        </View>
      );
    }

    case 'bond_shake': {
      // ( ● ) — two arcs reaching inward to a bond node at center
      const d = s * 0.46;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            position: 'absolute', width: d, height: d, borderRadius: d / 2,
            borderWidth: 2.5, borderColor: c,
            borderTopColor: 'transparent', borderRightColor: 'transparent',
            left: s * 0.04, top: s / 2 - d / 2,
          }} />
          <View style={{
            position: 'absolute', width: d, height: d, borderRadius: d / 2,
            borderWidth: 2.5, borderColor: c,
            borderBottomColor: 'transparent', borderLeftColor: 'transparent',
            right: s * 0.04, top: s / 2 - d / 2,
          }} />
          <View style={[dot(s * 0.14, c)]} />
        </View>
      );
    }

    case 'postcard': {
      // Signal waves — three concentric arcs radiating from corner origin
      // overflow:hidden clips each ring to its visible quarter-arc
      return (
        <View style={{ width: s, height: s, overflow: 'hidden' }}>
          {[0.44, 0.72, 1.0].map((ratio, i) => {
            const d = s * ratio;
            return (
              <View key={i} style={{
                position: 'absolute',
                width: d, height: d, borderRadius: d / 2,
                borderWidth: 2, borderColor: c,
                opacity: 1 - i * 0.28,
                left: -d / 2, bottom: -d / 2,
              }} />
            );
          })}
          <View style={[dot(s * 0.1, c), { position: 'absolute', bottom: s * 0.04, left: s * 0.04 }]} />
        </View>
      );
    }

    case 'map_pin': {
      // Bond Radar — concentric rings pulsing from a fixed bond point
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[ring(s * 0.86, c + '38', 1.5), { position: 'absolute' }]} />
          <View style={[ring(s * 0.56, c + '66', 2), { position: 'absolute' }]} />
          <View style={[ring(s * 0.28, c, 2.5), { position: 'absolute' }]} />
          <View style={[dot(s * 0.12, c)]} />
        </View>
      );
    }

    // ── Explorer ──────────────────────────────────────────────────────────────

    case 'passport': {
      // Gateway arch — the portal you walk through to enter their world
      const archD = s * 0.58;
      const gap = (s - archD) / 2;
      const pillarW = s * 0.12;
      const pillarH = s * 0.5;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Arch: top half of ring, clipped by overflow:hidden */}
          <View style={{ position: 'absolute', width: archD, height: archD / 2, top: s * 0.1, left: gap, overflow: 'hidden' }}>
            <View style={{ width: archD, height: archD, borderRadius: archD / 2, borderWidth: 2.5, borderColor: c }} />
          </View>
          <View style={[rect(pillarW, pillarH, c, 2), { position: 'absolute', bottom: s * 0.06, left: gap }]} />
          <View style={[rect(pillarW, pillarH, c, 2), { position: 'absolute', bottom: s * 0.06, right: gap }]} />
          <View style={[rect(s * 0.8, 2.5, c, 1), { position: 'absolute', bottom: s * 0.06 }]} />
        </View>
      );
    }

    case 'world_map': {
      // Globe disk — clean circular world with latitude and meridian lines
      const d = s * 0.82;
      const r = d / 2;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[ring(d, c, 2, c + '18'), { position: 'absolute', overflow: 'hidden' }]}>
            <View style={[rect(d, 2, c + '80', 0), { position: 'absolute', top: r - 1 }]} />
            <View style={[rect(d, 1.5, c + '44', 0), { position: 'absolute', top: r * 0.58 }]} />
            <View style={[rect(d, 1.5, c + '44', 0), { position: 'absolute', top: r * 1.42 }]} />
          </View>
          <View style={[rect(2, d, c + '60', 0), { position: 'absolute' }]} />
          <View style={{ position: 'absolute', width: d * 0.5, height: d, borderRadius: d * 0.25, borderWidth: 1.5, borderColor: c + '42', left: s / 2 - d * 0.25, top: s / 2 - d / 2 }} />
        </View>
      );
    }

    case 'first_class': {
      // Bond Ascent — the orbital arc that breaks into a higher tier
      const d = s * 0.74;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            position: 'absolute', width: d, height: d, borderRadius: d / 2,
            borderWidth: 2.5,
            borderTopColor: c, borderRightColor: c,
            borderBottomColor: 'transparent', borderLeftColor: 'transparent',
            transform: [{ rotate: '-45deg' }],
          }} />
          <View style={[dot(s * 0.14, c), { position: 'absolute', top: s * 0.07, right: s * 0.07 }]} />
          {[0, 1, 2].map(i => (
            <View key={i} style={[rect(s * (0.32 - i * 0.07), 2, c, 1), {
              position: 'absolute', opacity: 0.88 - i * 0.27,
              bottom: s * (0.15 + i * 0.07), left: s * 0.09,
            }]} />
          ))}
        </View>
      );
    }

    case 'globe_spin': {
      // Spinning globe — latitude grid + longitude meridian
      const d = s * 0.8;
      const r = d / 2;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[ring(d, c, 2, c + '15'), { position: 'absolute', overflow: 'hidden' }]}>
            {[-0.3, 0, 0.3].map((o, i) => (
              <View key={i} style={[rect(d, 1.5, c + (i === 1 ? '88' : '44'), 0), { position: 'absolute', top: r + o * r * 2 - 0.75 }]} />
            ))}
          </View>
          <View style={[rect(1.5, d, c + '70', 0), { position: 'absolute' }]} />
          <View style={{ position: 'absolute', width: d * 0.46, height: d, borderRadius: d * 0.23, borderWidth: 1.5, borderColor: c + '48', left: s / 2 - d * 0.23, top: s / 2 - d / 2 }} />
        </View>
      );
    }

    // ── Voyager ───────────────────────────────────────────────────────────────

    case 'heritage': {
      // Temple columns — ancient heritage, the mark of enduring culture
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[rect(s * 0.8, s * 0.09, c, 2)]} />
          <View style={{ flexDirection: 'row', gap: s * 0.06, alignItems: 'flex-end' }}>
            {[s * 0.48, s * 0.38, s * 0.48].map((h, i) => (
              <View key={i} style={[rect(s * 0.14, h, i === 1 ? c + 'bb' : c, 2)]} />
            ))}
          </View>
          <View style={[rect(s * 0.88, s * 0.09, c, 2)]} />
        </View>
      );
    }

    case 'culture_crown': {
      // Radiant — 8 rays of light in all directions, you shine before the world
      const len = s * 0.37;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((deg, i) => (
            <View key={i} style={{
              position: 'absolute',
              width: len, height: 2.5, borderRadius: 2,
              backgroundColor: c,
              opacity: i % 2 === 0 ? 1 : 0.48,
              left: s / 2 - len / 2,
              top: s / 2 - 1.25,
              transform: [{ rotate: `${deg}deg` }],
            }} />
          ))}
          <View style={[ring(s * 0.25, c, 2.5, c + '30'), { position: 'absolute' }]} />
          <View style={[dot(s * 0.1, c)]} />
        </View>
      );
    }

    case 'embassy_seal': {
      // Embassy Seal — official concentric rings with notch dots
      const outer = s * 0.84;
      const mid = s * 0.54;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[ring(outer, c, 2, c + '18'), { position: 'absolute' }]} />
          <View style={[ring(mid, c, 1.5, c + '28'), { position: 'absolute' }]} />
          <View style={[dot(s * 0.1, c)]} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const r = outer / 2;
            return (
              <View key={i} style={[dot(s * 0.04, c), {
                position: 'absolute',
                left: s / 2 - s * 0.02 + Math.cos(rad) * (r - 3),
                top:  s / 2 - s * 0.02 + Math.sin(rad) * (r - 3),
              }]} />
            );
          })}
        </View>
      );
    }

    // ── Elite ─────────────────────────────────────────────────────────────────

    case 'bond_satellite': {
      // Satellite with solar wings — connected from orbit
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: s * 0.04, width: s * 0.24, height: s * 0.34, borderRadius: 3, borderColor: c, borderWidth: 1.5, backgroundColor: c + '45' }}>
            {[0, 1, 2].map(i => <View key={i} style={[rect('100%', 1, c + '80', 0), { marginVertical: s * 0.05 }]} />)}
          </View>
          <View style={{ width: s * 0.3, height: s * 0.3, borderRadius: 4, borderColor: c, borderWidth: 2, backgroundColor: c + '28' }} />
          <View style={{ position: 'absolute', right: s * 0.04, width: s * 0.24, height: s * 0.34, borderRadius: 3, borderColor: c, borderWidth: 1.5, backgroundColor: c + '45' }}>
            {[0, 1, 2].map(i => <View key={i} style={[rect('100%', 1, c + '80', 0), { marginVertical: s * 0.05 }]} />)}
          </View>
          <View style={[ring(s * 0.14, c, 2), { position: 'absolute', top: s * 0.08 }]} />
          <View style={[rect(1.5, s * 0.16, c, 0), { position: 'absolute', top: s * 0.08 }]} />
        </View>
      );
    }

    case 'world_ambassador': {
      // Bond Diamond — the geometric mark of world-class distinction
      const d = s * 0.54;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            position: 'absolute',
            width: d, height: d,
            backgroundColor: c + '18', borderColor: c, borderWidth: 2.5,
            transform: [{ rotate: '45deg' }],
          }} />
          <View style={[ring(d * 0.44, c + 'aa', 1.5), { position: 'absolute' }]} />
          <View style={[dot(s * 0.09, c)]} />
        </View>
      );
    }

    case 'bond_atlas': {
      // Globe with crosshair axes — Atlas holding the whole world
      const d = s * 0.76;
      const r = d / 2;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[ring(d, c, 2.5, c + '18'), { position: 'absolute', overflow: 'hidden' }]}>
            {[-0.35, 0, 0.35].map((o, i) => (
              <View key={i} style={[rect(d, 1.5, c + (i === 1 ? '70' : '42'), 0), { position: 'absolute', top: r + o * r * 2 - 0.75 }]} />
            ))}
          </View>
          <View style={[rect(1.5, d, c + '60', 0), { position: 'absolute' }]} />
          <View style={[dot(s * 0.07, c), { position: 'absolute', top: s / 2 - r - 1 }]} />
          <View style={[dot(s * 0.07, c), { position: 'absolute', bottom: s / 2 - r - 1 }]} />
        </View>
      );
    }

    // ── Legend ────────────────────────────────────────────────────────────────

    case 'bond_sovereign': {
      // Five-point sovereign crown — the highest WorldBond honor
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
            <View style={tri(s * 0.16, s * 0.22, c + 'cc')} />
            <View style={tri(s * 0.16, s * 0.32, c)} />
            <View style={tri(s * 0.18, s * 0.42, c)} />
            <View style={tri(s * 0.16, s * 0.32, c)} />
            <View style={tri(s * 0.16, s * 0.22, c + 'cc')} />
          </View>
          <View style={[rect(s * 0.82, s * 0.22, c + '35', 3), { borderColor: c, borderWidth: 2, marginTop: -2, alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ flexDirection: 'row', gap: s * 0.1 }}>
              {[0.9, 1, 0.9].map((op, i) => <View key={i} style={[dot(s * 0.07, c), { opacity: op }]} />)}
            </View>
          </View>
          <View style={[rect(s * 0.82, s * 0.08, c + '50', 2), { borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }]} />
        </View>
      );
    }

    case 'planet_bond': {
      // Planet Bond — they have their own gravity, their own orbit
      const rp = (s * 0.46) / 2;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: s * 0.88, height: s * 0.32, borderRadius: s * 0.16, borderWidth: 2.5, borderColor: c + '80', transform: [{ rotateX: '60deg' }] }} />
          <View style={[ring(rp * 2, c, 3, c + '28'), { position: 'absolute', overflow: 'hidden' }]}>
            <View style={[rect(rp * 2, 1.5, c + '55', 0), { position: 'absolute', top: rp * 0.72 }]} />
          </View>
          <View style={{ position: 'absolute', bottom: s * 0.11, width: s * 0.88, height: s * 0.16, borderRadius: s * 0.08, borderWidth: 2.5, borderColor: c, borderTopColor: 'transparent' }} />
        </View>
      );
    }

    case 'bond_eternal': {
      // Infinity — this bond lasts forever
      const re = s * 0.22;
      const overlap = re * 0.6;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[ring(re * 2, c, 3.5)]} />
            <View style={[ring(re * 2, c, 3.5), { marginLeft: -overlap }]} />
          </View>
          <View style={[dot(s * 0.09, c), { position: 'absolute', left: s * 0.03 }]} />
          <View style={[dot(s * 0.09, c), { position: 'absolute', right: s * 0.03 }]} />
        </View>
      );
    }

    default:
      return <View style={[dot(s * 0.8, c), { opacity: 0.4 }]} />;
  }
}

// ── Shape helpers ─────────────────────────────────────────────────────────────

function ring(diameter, color, borderW = 2, bg = 'transparent') {
  return { width: diameter, height: diameter, borderRadius: diameter / 2, borderWidth: borderW, borderColor: color, backgroundColor: bg };
}

function dot(diameter, color) {
  return { width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: color };
}

function rect(w, h, color, radius = 0) {
  return { width: w, height: h, backgroundColor: color, borderRadius: radius };
}

function tri(w, h, color) {
  return { width: 0, height: 0, borderLeftWidth: w / 2, borderRightWidth: w / 2, borderBottomWidth: h, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color };
}

export default GiftIcon;
