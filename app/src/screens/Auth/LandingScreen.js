import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: '🎙️', label: 'Voice profiles' },
  { icon: '✨',  label: '5 daily Bonds' },
  { icon: '🌍',  label: '150+ countries' },
  { icon: '🔒',  label: 'Verified only' },
];

const STEPS = [
  { icon: '📝', text: 'Create your profile' },
  { icon: '✨', text: 'Get your daily matches' },
  { icon: '🫂', text: 'Bond with real people' },
];

export default function LandingScreen({ onGetStarted, onSignIn }) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(50)).current;
  const scaleAnim  = useRef(new Animated.Value(0.8)).current;
  const ring1Anim  = useRef(new Animated.Value(0)).current;
  const ring2Anim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ring1Anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(ring1Anim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ring2Anim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(ring2Anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(ring2Anim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const ring1Scale   = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const ring1Opacity = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.08] });
  const ring2Scale   = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.04] });

  return (
    <LinearGradient colors={['#07071a', '#000000', '#0d0d22']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* ── Logo hero ──────────────────────────────── */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          <View style={styles.logoWrap}>
            {/* Pulse rings */}
            <Animated.View style={[styles.pulseRing, styles.pulseRing2, {
              transform: [{ scale: ring2Scale }], opacity: ring2Opacity,
            }]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRing1, {
              transform: [{ scale: ring1Scale }], opacity: ring1Opacity,
            }]} />

            <Animated.View style={[styles.logoOuter, { transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient
                colors={['#E8003D', '#E8003D', '#C7003A']}
                style={styles.logoInner}
              >
                <Text style={styles.logoEmoji}>🫂</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          <Text style={styles.appName}>Bond</Text>
          <Text style={styles.tagline}>Meet someone worth meeting</Text>
        </Animated.View>

        {/* ── Feature pills ──────────────────────────── */}
        <Animated.View style={[styles.pills, { opacity: fadeAnim }]}>
          {FEATURES.map(f => (
            <View key={f.label} style={styles.pill}>
              <Text style={styles.pillIcon}>{f.icon}</Text>
              <Text style={styles.pillLabel}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── How it works ───────────────────────────── */}
        <Animated.View style={[styles.stepsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <Text style={styles.stepIcon}>{s.icon}</Text>
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
              {i < STEPS.length - 1 && <View style={styles.stepConnector} />}
            </View>
          ))}
        </Animated.View>

        {/* ── CTAs ───────────────────────────────────── */}
        <Animated.View style={[styles.ctas, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onGetStarted} activeOpacity={0.87}>
            <LinearGradient
              colors={['#E8003D', '#E8003D', '#C7003A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.primaryGrad}
            >
              <Text style={styles.primaryBtnText}>Get Started — It's Free</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onSignIn} activeOpacity={0.75}>
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>No bots · No paywalled matches · Real people</Text>

      </SafeAreaView>
    </LinearGradient>
  );
}

const LOGO_SIZE = 100;

const styles = StyleSheet.create({
  container:    { flex: 1 },
  safe:         { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 36, paddingHorizontal: 28 },

  hero:         { alignItems: 'center', marginTop: 10 },
  logoWrap:     { alignItems: 'center', justifyContent: 'center', marginBottom: 22, width: LOGO_SIZE * 2.2, height: LOGO_SIZE * 2.2 },

  pulseRing:    { position: 'absolute', borderRadius: 999, backgroundColor: '#E8003D' },
  pulseRing1:   { width: LOGO_SIZE * 1.6, height: LOGO_SIZE * 1.6 },
  pulseRing2:   { width: LOGO_SIZE * 2.0, height: LOGO_SIZE * 2.0 },

  logoOuter:    { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE / 2, padding: 3, backgroundColor: '#E8003D30' },
  logoInner:    { flex: 1, borderRadius: LOGO_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  logoEmoji:    { fontSize: 44 },

  appName:      { fontSize: 58, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  tagline:      { fontSize: 17, color: '#8888bb', marginTop: 6, textAlign: 'center', fontWeight: '400' },

  pills:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#16181C', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#2F3336' },
  pillIcon:     { fontSize: 13 },
  pillLabel:    { color: '#888', fontSize: 12, fontWeight: '600' },

  stepsCard:    { width: '100%', backgroundColor: '#16181C', borderRadius: 20, padding: 20, gap: 0, borderWidth: 1, borderColor: '#2F3336' },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 2 },
  stepIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E8003D15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8003D30' },
  stepIcon:     { fontSize: 16 },
  stepText:     { color: '#c0c0e0', fontSize: 14, fontWeight: '600', flex: 1 },
  stepConnector:{ position: 'absolute', left: 17, top: 38, width: 2, height: 16, backgroundColor: '#2F3336' },

  ctas:         { width: '100%', gap: 12 },
  primaryBtn:   { borderRadius: 18, overflow: 'hidden' },
  primaryGrad:  { paddingVertical: 19, alignItems: 'center', borderRadius: 18 },
  primaryBtnText:   { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  secondaryBtn:     { paddingVertical: 13, alignItems: 'center' },
  secondaryBtnText: { color: '#E8003D', fontSize: 16, fontWeight: '600' },

  footer:   { color: '#2F3336', fontSize: 12, textAlign: 'center' },
});
