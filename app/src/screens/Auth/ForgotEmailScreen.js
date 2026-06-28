import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Animated, Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const BOND_PINK = '#FF0080';
const SUPPORT_EMAIL = 'support@worldbond.app';

export default function ForgotEmailScreen({ onBack }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <View style={s.backBtnInner}>
            <Text style={s.backIcon}>‹</Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <View style={s.iconWrap}>
            <LinearGradient colors={[BOND_PINK + '30', BOND_PINK + '10']} style={s.iconBg}>
              <Text style={s.iconText}>@</Text>
            </LinearGradient>
          </View>

          <View style={s.header}>
            <Text style={s.title}>Forgot your email?</Text>
            <Text style={s.subtitle}>
              We can help you recover your account. Contact our support team and we'll verify your identity and get you back in.
            </Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardLabel}>What to include in your message</Text>
            {[
              'Your display name on WorldBond',
              'The country you signed up from',
              'Approximate date you created your account',
              'Any email addresses you may have used',
            ].map((item, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.bullet} />
                <Text style={s.bulletText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.emailBtn}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account Recovery - Forgot Email`)}
            activeOpacity={0.87}
          >
            <LinearGradient
              colors={[BOND_PINK, '#CC0060']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.emailGrad}
            >
              <Text style={s.emailBtnText}>Email Support</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.hint}>We typically respond within 24 hours</Text>

          <TouchableOpacity style={s.backLink} onPress={onBack}>
            <Text style={s.backLinkText}>‹ Back to sign in</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll:    { flexGrow: 1, padding: 24, paddingTop: 16 },

  backBtn:      { marginBottom: 28, alignSelf: 'flex-start' },
  backBtnInner: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#2F3336', alignItems: 'center', justifyContent: 'center' },
  backIcon:     { color: '#fff', fontSize: 26, lineHeight: 30 },

  iconWrap: { alignItems: 'center', marginBottom: 24 },
  iconBg:   { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BOND_PINK + '40' },
  iconText: { color: BOND_PINK, fontSize: 36, fontWeight: '900' },

  header:   { marginBottom: 28, alignItems: 'center' },
  title:    { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#536471', marginTop: 10, textAlign: 'center', lineHeight: 22 },

  card:      { backgroundColor: '#16181C', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#2F3336', gap: 14, marginBottom: 28 },
  cardLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  bullet:    { width: 6, height: 6, borderRadius: 3, backgroundColor: BOND_PINK, marginTop: 7, flexShrink: 0 },
  bulletText:{ color: '#888', fontSize: 14, flex: 1, lineHeight: 20 },

  emailBtn:     { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  emailGrad:    { paddingVertical: 19, alignItems: 'center', borderRadius: 18 },
  emailBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  hint:      { color: '#444', fontSize: 12, textAlign: 'center', marginBottom: 32 },
  backLink:  { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { color: BOND_PINK, fontSize: 14, fontWeight: '600' },
});
