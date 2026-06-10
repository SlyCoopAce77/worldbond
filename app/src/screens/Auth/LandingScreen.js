import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function LandingScreen({ onGetStarted, onSignIn }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.04] });

  return (
    <LinearGradient colors={['#06061a', '#09091f', '#0d0d26']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* ── Logo ── */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoWrap}>
            <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
            <Animated.View style={[styles.logoCircle, { transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient colors={['#7B5CFF', '#5533DD']} style={styles.logoGrad}>
                <Text style={styles.logoEmoji}>❤️‍🔥</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          <Text style={styles.appName}>Bond</Text>
          <Text style={styles.tagline}>Real people.{'\n'}Real connections.</Text>
        </Animated.View>

        {/* ── Trust line ── */}
        <Animated.View style={[styles.trustRow, { opacity: fadeAnim }]}>
          <View style={styles.dot} />
          <Text style={styles.trustText}>150+ countries</Text>
          <View style={styles.dot} />
          <Text style={styles.trustText}>Verified only</Text>
          <View style={styles.dot} />
          <Text style={styles.trustText}>No bots</Text>
        </Animated.View>

        {/* ── CTAs ── */}
        <Animated.View style={[styles.ctas, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={onGetStarted} activeOpacity={0.85} style={styles.primaryBtn}>
            <LinearGradient
              colors={['#7B5CFF', '#5533DD']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.primaryGrad}
            >
              <Text style={styles.primaryText}>Find your Bond</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSignIn} activeOpacity={0.7} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const LOGO = 110;

const styles = StyleSheet.create({
  container:   { flex: 1 },
  safe:        { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 52, paddingHorizontal: 28 },

  hero:        { alignItems: 'center' },
  logoWrap:    { alignItems: 'center', justifyContent: 'center', marginBottom: 28, width: LOGO * 2, height: LOGO * 2 },
  glow:        { position: 'absolute', width: LOGO * 1.9, height: LOGO * 1.9, borderRadius: LOGO, backgroundColor: '#6C47FF' },
  logoCircle:  { width: LOGO, height: LOGO, borderRadius: LOGO / 2, overflow: 'hidden', shadowColor: '#6C47FF', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  logoGrad:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoEmoji:   { fontSize: 48 },

  appName:     { fontSize: 62, fontWeight: '900', color: '#fff', letterSpacing: -2.5 },
  tagline:     { fontSize: 20, color: '#7a7aaa', marginTop: 10, textAlign: 'center', lineHeight: 28, fontWeight: '400', letterSpacing: 0.1 },

  trustRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:         { width: 3, height: 3, borderRadius: 2, backgroundColor: '#3a3a5c' },
  trustText:   { color: '#3a3a5c', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  ctas:        { width: '100%', gap: 14 },
  primaryBtn:  { borderRadius: 20, overflow: 'hidden', shadowColor: '#6C47FF', shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
  primaryGrad: { paddingVertical: 20, alignItems: 'center', borderRadius: 20 },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  secondaryBtn:  { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: '#5a5a8a', fontSize: 15, fontWeight: '500' },
});
