import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ── WorldBond gift icons — pure View compositions, no emoji, no WorldMark repeat ──
// Each icon is a unique geometric design themed to the gift name.

function GiftIcon({ id, color, size = 38 }) {
  const c = color;
  const s = size;

  switch (id) {

    // ── Starter ──────────────────────────────────────────────────────────────

    case 'world_hello': {
      // Two overlapping circles = two worlds meeting for the first time
      const r = s * 0.36;
      return (
        <View style={{ width: s, height: s }}>
          <View style={[circle(r, c, 0.18), { position: 'absolute', left: 0, top: s * 0.12 }]} />
          <View style={[circle(r, c, 0.18), { position: 'absolute', right: 0, top: s * 0.12 }]} />
          {/* Connection dot at the overlap center */}
          <View style={[circle(s * 0.1, c, 1), { position: 'absolute', left: s * 0.5 - s * 0.05, top: s * 0.26 }]} />
        </View>
      );
    }

    case 'bond_shake': {
      // Two rectangular "hands" gripping each other — the Bond Shake
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end' }}>
            <View style={[rect(s * 0.28, s * 0.46, c, 4), { opacity: 0.9 }]} />
            <View style={rect(s * 0.28, s * 0.46, c, 4)} />
          </View>
          <View style={rect(s * 0.72, s * 0.1, c, 3)} />
        </View>
      );
    }

    case 'postcard': {
      // Envelope/postcard: rectangle + stamp square + address lines
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[rect(s * 0.86, s * 0.62, 'transparent', 3), { borderColor: c, borderWidth: 2, alignItems: 'flex-end', padding: s * 0.06 }]}>
            {/* Stamp */}
            <View style={[rect(s * 0.22, s * 0.22, c + '30', 2), { borderColor: c, borderWidth: 1.5 }]} />
            {/* Address lines */}
            <View style={{ position: 'absolute', left: s * 0.08, top: s * 0.16, gap: 4 }}>
              <View style={rect(s * 0.4, 2, c, 1)} />
              <View style={rect(s * 0.28, 2, c, 1)} />
              <View style={rect(s * 0.34, 2, c, 1)} />
            </View>
          </View>
        </View>
      );
    }

    case 'map_pin': {
      // Classic location pin: filled circle on top, inverted triangle below
      const pinW = s * 0.44;
      const pinH = s * 0.44;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[circle(pinW / 2, c, 1)]} />
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: pinW / 2,
            borderRightWidth: pinW / 2,
            borderTopWidth: s * 0.3,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: c,
            marginTop: -2,
          }} />
          {/* Inner white dot */}
          <View style={[circle(pinW * 0.3, '#08090d', 1), { position: 'absolute', top: s * 0.15 }]} />
        </View>
      );
    }

    // ── Explorer ─────────────────────────────────────────────────────────────

    case 'passport': {
      // Passport booklet: rectangle with inner globe circle + lines
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[rect(s * 0.62, s * 0.78, 'transparent', 5), { borderColor: c, borderWidth: 2, alignItems: 'center', paddingTop: s * 0.1, gap: 4 }]}>
            {/* Small globe circle */}
            <View style={[circle(s * 0.16, 'transparent', 1), { borderColor: c, borderWidth: 1.5 }]} />
            {/* Lines under globe */}
            <View style={{ gap: 3, alignItems: 'center' }}>
              <View style={rect(s * 0.36, 1.5, c, 1)} />
              <View style={rect(s * 0.24, 1.5, c, 1)} />
            </View>
            {/* Bottom bar */}
            <View style={[rect(s * 0.5, s * 0.08, c + '40', 2), { marginTop: 4 }]} />
          </View>
        </View>
      );
    }

    case 'world_map': {
      // Abstract continent blob: irregular polygon made with border-radius tricks
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: s * 0.72, height: s * 0.56,
            backgroundColor: c + '30',
            borderColor: c, borderWidth: 2,
            borderTopLeftRadius: s * 0.3,
            borderTopRightRadius: s * 0.12,
            borderBottomLeftRadius: s * 0.18,
            borderBottomRightRadius: s * 0.35,
          }} />
          {/* Small islands */}
          <View style={[circle(s * 0.08, c, 1), { position: 'absolute', right: s * 0.08, bottom: s * 0.14 }]} />
          <View style={[circle(s * 0.05, c, 0.6), { position: 'absolute', left: s * 0.1, bottom: s * 0.16 }]} />
        </View>
      );
    }

    case 'first_class': {
      // Minimalist airplane profile: fuselage + wings + tail
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Fuselage */}
          <View style={[rect(s * 0.78, s * 0.14, c, s * 0.07), { position: 'absolute' }]} />
          {/* Main wing */}
          <View style={{
            position: 'absolute',
            width: 0, height: 0,
            borderRightWidth: s * 0.28,
            borderTopWidth: s * 0.22,
            borderBottomWidth: 0,
            borderRightColor: c,
            borderTopColor: 'transparent',
            left: s * 0.2, top: s * 0.3,
          }} />
          {/* Tail fin */}
          <View style={{
            position: 'absolute',
            width: 0, height: 0,
            borderRightWidth: s * 0.14,
            borderTopWidth: s * 0.14,
            borderRightColor: c,
            borderTopColor: 'transparent',
            left: s * 0.06, top: s * 0.22,
          }} />
          {/* Nose cone */}
          <View style={{
            position: 'absolute', right: s * 0.04,
            width: s * 0.14, height: s * 0.14,
            borderRadius: s * 0.07,
            backgroundColor: c,
          }} />
        </View>
      );
    }

    case 'globe_spin': {
      // Circle with latitude/longitude lines = spinning globe
      const r2 = (s * 0.78) / 2;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer circle */}
          <View style={[circle(r2, 'transparent', 1), { borderColor: c, borderWidth: 2, position: 'absolute', overflow: 'hidden' }]}>
            {/* Latitude lines */}
            {[-0.28, 0, 0.28].map((offset, i) => (
              <View key={i} style={[rect(r2 * 2, 1.5, c + '80', 0), { position: 'absolute', top: r2 + offset * r2 * 2 - 0.75 }]} />
            ))}
            {/* Longitude lines (ellipses approximated) */}
            <View style={[circle(r2 * 0.55, 'transparent', 1), { borderColor: c + '80', borderWidth: 1.5, position: 'absolute', left: r2 - r2 * 0.55, top: r2 - r2 * 0.55 }]} />
          </View>
          {/* Vertical axis */}
          <View style={[rect(1.5, r2 * 2, c + '80', 0), { position: 'absolute' }]} />
        </View>
      );
    }

    // ── Voyager ───────────────────────────────────────────────────────────────

    case 'heritage': {
      // Three columns = ancient heritage / monument
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Capital / top beam */}
          <View style={rect(s * 0.8, s * 0.1, c, 2)} />
          {/* Three columns */}
          <View style={{ flexDirection: 'row', gap: s * 0.06, alignItems: 'flex-end' }}>
            {[s * 0.5, s * 0.42, s * 0.5].map((h, i) => (
              <View key={i} style={rect(s * 0.14, h, c + (i === 1 ? 'cc' : 'ff'), 2)} />
            ))}
          </View>
          {/* Base step */}
          <View style={rect(s * 0.88, s * 0.1, c, 2)} />
        </View>
      );
    }

    case 'culture_crown': {
      // Crown: three triangular points on a rectangular base
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 0 }}>
            {/* Left point */}
            <View style={tri(s * 0.22, s * 0.3, c)} />
            {/* Center point (taller) */}
            <View style={tri(s * 0.22, s * 0.42, c)} />
            {/* Right point */}
            <View style={tri(s * 0.22, s * 0.3, c)} />
          </View>
          {/* Crown band */}
          <View style={[rect(s * 0.66, s * 0.22, c + '30', 3), { borderColor: c, borderWidth: 2, marginTop: -2 }]} />
          {/* Gem dots */}
          <View style={{ position: 'absolute', bottom: s * 0.22, flexDirection: 'row', gap: s * 0.12 }}>
            {[1, 1, 1].map((_, i) => <View key={i} style={[circle(s * 0.06, c, 1)]} />)}
          </View>
        </View>
      );
    }

    case 'embassy_seal': {
      // Concentric circles with a dot = official embassy seal / wax seal
      const outer = (s * 0.84) / 2;
      const mid   = (s * 0.58) / 2;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[circle(outer, c + '20', 1), { borderColor: c, borderWidth: 2, position: 'absolute' }]} />
          <View style={[circle(mid, c + '30', 1), { borderColor: c, borderWidth: 1.5, position: 'absolute' }]} />
          {/* Center star / dot cluster */}
          <View style={[circle(s * 0.1, c, 1), { position: 'absolute' }]} />
          {/* Seal notches around outer ring */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <View key={i} style={[circle(s * 0.04, c, 1), {
                position: 'absolute',
                left: s / 2 - s * 0.02 + Math.cos(rad) * (outer - 3),
                top:  s / 2 - s * 0.02 + Math.sin(rad) * (outer - 3),
              }]} />
            );
          })}
        </View>
      );
    }

    // ── Elite ─────────────────────────────────────────────────────────────────

    case 'bond_satellite': {
      // Satellite body (rectangle) + two solar panel wings + dish circle
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Left solar panel */}
          <View style={[rect(s * 0.24, s * 0.36, c + '60', 2), { borderColor: c, borderWidth: 1.5, position: 'absolute', left: s * 0.04 }]}>
            {[0, 1, 2].map(i => <View key={i} style={[rect('100%', 1, c + '80', 0), { marginVertical: s * 0.05 }]} />)}
          </View>
          {/* Body */}
          <View style={[rect(s * 0.3, s * 0.3, c + '30', 3), { borderColor: c, borderWidth: 2 }]} />
          {/* Right solar panel */}
          <View style={[rect(s * 0.24, s * 0.36, c + '60', 2), { borderColor: c, borderWidth: 1.5, position: 'absolute', right: s * 0.04 }]}>
            {[0, 1, 2].map(i => <View key={i} style={[rect('100%', 1, c + '80', 0), { marginVertical: s * 0.05 }]} />)}
          </View>
          {/* Dish antenna */}
          <View style={[circle(s * 0.14, 'transparent', 1), { borderColor: c, borderWidth: 2, position: 'absolute', top: s * 0.08 }]} />
          <View style={rect(1.5, s * 0.16, c, 0, { position: 'absolute', top: s * 0.08 })} />
        </View>
      );
    }

    case 'world_ambassador': {
      // Shield shape: rectangle with pointed bottom
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Shield body */}
          <View style={{
            width: s * 0.62, height: s * 0.5,
            backgroundColor: c + '25',
            borderColor: c, borderWidth: 2,
            borderTopLeftRadius: s * 0.08,
            borderTopRightRadius: s * 0.08,
          }} />
          {/* Shield point */}
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: s * 0.31,
            borderRightWidth: s * 0.31,
            borderTopWidth: s * 0.24,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: c,
            marginTop: -2,
          }} />
          {/* Inner emblem: small globe lines */}
          <View style={[circle(s * 0.14, 'transparent', 1), { borderColor: c + 'aa', borderWidth: 1.5, position: 'absolute', top: s * 0.2 }]} />
          <View style={[rect(s * 0.28, 1.5, c + 'aa', 0), { position: 'absolute', top: s * 0.27 }]} />
        </View>
      );
    }

    case 'bond_atlas': {
      // Globe with crosshair axes = Atlas holding the world
      const ra = (s * 0.74) / 2;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[circle(ra, c + '18', 1), { borderColor: c, borderWidth: 2.5, position: 'absolute', overflow: 'hidden' }]}>
            {/* Latitude lines */}
            {[-0.35, 0, 0.35].map((o, i) => (
              <View key={i} style={[rect(ra * 2, 1.5, c + '60', 0), { position: 'absolute', top: ra + o * ra * 2 - 0.75 }]} />
            ))}
          </View>
          {/* Meridian lines */}
          <View style={[rect(1.5, ra * 2, c + '60', 0), { position: 'absolute' }]} />
          {/* Pole dots */}
          <View style={[circle(s * 0.07, c, 1), { position: 'absolute', top: s / 2 - ra - 2 }]} />
          <View style={[circle(s * 0.07, c, 1), { position: 'absolute', bottom: s / 2 - ra - 2 }]} />
        </View>
      );
    }

    // ── Legend ────────────────────────────────────────────────────────────────

    case 'bond_sovereign': {
      // Elaborate 5-point sovereign crown with gems
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Five crown points */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
            <View style={tri(s * 0.16, s * 0.22, c + 'cc')} />
            <View style={tri(s * 0.16, s * 0.32, c)} />
            <View style={tri(s * 0.18, s * 0.42, c)} />
            <View style={tri(s * 0.16, s * 0.32, c)} />
            <View style={tri(s * 0.16, s * 0.22, c + 'cc')} />
          </View>
          {/* Crown band */}
          <View style={[rect(s * 0.82, s * 0.24, c + '35', 3), { borderColor: c, borderWidth: 2, marginTop: -2, alignItems: 'center', justifyContent: 'center' }]}>
            {/* Band gems */}
            <View style={{ flexDirection: 'row', gap: s * 0.1 }}>
              {[0.9, 1, 0.9].map((op, i) => <View key={i} style={[circle(s * 0.07, c, op)]} />)}
            </View>
          </View>
          {/* Base */}
          <View style={[rect(s * 0.82, s * 0.08, c + '50', 2), { borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }]} />
        </View>
      );
    }

    case 'planet_bond': {
      // Planet with orbital ring = Planet Bond
      const rp = (s * 0.48) / 2;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Ring (behind planet) */}
          <View style={{
            position: 'absolute',
            width: s * 0.86, height: s * 0.34,
            borderRadius: s * 0.17,
            borderWidth: 2.5, borderColor: c + '99',
            transform: [{ rotateX: '60deg' }],
          }} />
          {/* Planet */}
          <View style={[circle(rp, c + '30', 1), { borderColor: c, borderWidth: 3, position: 'absolute', overflow: 'hidden' }]}>
            {/* Surface line */}
            <View style={[rect(rp * 2, 1.5, c + '55', 0), { position: 'absolute', top: rp * 0.7 }]} />
          </View>
          {/* Ring (front half — overlapping planet) */}
          <View style={{
            position: 'absolute', bottom: s * 0.12,
            width: s * 0.86, height: s * 0.17,
            borderRadius: s * 0.085,
            borderWidth: 2.5, borderColor: c,
            borderTopColor: 'transparent',
          }} />
        </View>
      );
    }

    case 'bond_eternal': {
      // Infinity ∞ symbol — drawn with two overlapping circles
      const re = s * 0.22;
      return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Left loop */}
            <View style={[circle(re, 'transparent', 1), { borderColor: c, borderWidth: 3.5 }]} />
            {/* Center crossover */}
            <View style={{ width: 6, height: 3.5, backgroundColor: 'transparent', marginHorizontal: -re * 0.6 }} />
            {/* Right loop */}
            <View style={[circle(re, 'transparent', 1), { borderColor: c, borderWidth: 3.5 }]} />
          </View>
          {/* Glow dots at loops' outer edges */}
          <View style={[circle(s * 0.08, c, 1), { position: 'absolute', left: s * 0.03 }]} />
          <View style={[circle(s * 0.08, c, 1), { position: 'absolute', right: s * 0.03 }]} />
        </View>
      );
    }

    default:
      return <View style={[circle(s * 0.4, c, 0.4)]} />;
  }
}

// ── Shape helpers ─────────────────────────────────────────────────────────────
function circle(r, color, opacity = 1) {
  return {
    width: r * 2, height: r * 2, borderRadius: r,
    backgroundColor: color,
    opacity,
  };
}

function rect(w, h, color, radius = 0, extra = {}) {
  return { width: w, height: h, backgroundColor: color, borderRadius: radius, ...extra };
}

function tri(w, h, color) {
  return {
    width: 0, height: 0,
    borderLeftWidth: w / 2,
    borderRightWidth: w / 2,
    borderBottomWidth: h,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: color,
  };
}

export default GiftIcon;
