import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useBondPass } from '../context/PremiumContext';
import { WorldMark } from '../components/BondLogo';

const BOND_PINK = '#FF0080';

const PASS_FEATURES = [
  { text: 'Unlimited daily connects'                        },
  { text: '150-char personal note with every bond request'  },
  { text: 'Message anyone — bonded or not'                  },
  { text: '75% gift payout rate (vs 70% standard)'          },
  { text: '5 Random Connects per day'                       },
  { text: 'Advanced matching filters (gender, vibe)'        },
  { text: 'Create and host events'                          },
  { text: 'Bond Pass badge on your profile'                 },
];

export default function SubscriptionScreen({ navigation }) {
  const { hasBondPass, product, subscribeToBondPass, cancelBondPass } = useBondPass();
  const [loading, setLoading] = useState(false);
  const prevHasBondPass = useRef(hasBondPass);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
    ]).start();

    if (hasBondPass) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.00, duration: 2000, useNativeDriver: true }),
      ])).start();
    }
  }, [hasBondPass]);

  // Detect successful purchase completing in background listener
  useEffect(() => {
    if (!prevHasBondPass.current && hasBondPass && loading) {
      setLoading(false);
      Alert.alert(
        'Bond Pass Active',
        'Unlimited connects, priority features, and 75% payout rate — all yours.',
        [{ text: "Let's go!", onPress: () => navigation.goBack() }],
      );
    }
    prevHasBondPass.current = hasBondPass;
  }, [hasBondPass, loading, navigation]);

  async function handleSubscribe() {
    setLoading(true);

    // Safety timeout — reset loading if the store never responds
    const timeout = setTimeout(() => setLoading(false), 30000);

    try {
      await subscribeToBondPass();
      // On iOS, requestSubscription resolves before the Apple sheet completes.
      // The actual success arrives via purchaseUpdatedListener → hasBondPass=true → useEffect above.
      // If it returned null (store unavailable), clear the spinner quickly.
      clearTimeout(timeout);
      if (!hasBondPass) setTimeout(() => setLoading(false), 1500);
    } catch (e) {
      clearTimeout(timeout);
      setLoading(false);
      if (e.code === 'E_USER_CANCELLED') return;
      const msg =
        e.code === 'E_ITEM_UNAVAILABLE'  ? 'Bond Pass is not available on this device. Please check your App Store account.' :
        e.code === 'E_NETWORK_ERROR'     ? 'No internet connection. Please try again.' :
        e.code === 'E_SERVICE_ERROR'     ? 'App Store is temporarily unavailable. Try again later.' :
                                           `Something went wrong (${e.code ?? 'unknown'}). Please try again.`;
      Alert.alert('Purchase Failed', msg);
    }
  }

  function handleCancel() {
    Alert.alert(
      'Manage Bond Pass',
      'Subscriptions are managed through Apple. Tap below to open your subscription settings.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: cancelBondPass },
      ],
    );
  }

  const heroTranslate = heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] });
  const cardScale     = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const cardOpacity   = cardAnim;

  return (
    <SafeAreaView style={s.container}>

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bond Pass</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <Animated.View style={[s.hero, { opacity: heroAnim, transform: [{ translateY: heroTranslate }] }]}>
          <LinearGradient colors={[BOND_PINK + '22', BOND_PINK + '08', '#000000']} style={s.heroBg}>
            <WorldMark size={72} color="#ffffff" bondColor={BOND_PINK} />
            <Text style={s.heroTitle}>Bond Without Limits</Text>
            <Text style={s.heroSub}>
              One plan · every feature · no tiers to worry about
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Plan card ── */}
        <Animated.View style={{ opacity: cardOpacity, transform: [{ scale: cardScale }] }}>
          <View style={[s.card, hasBondPass && s.cardActive]}>

            {hasBondPass && (
              <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.activeBadge}>
                <Text style={s.activeBadgeText}>ACTIVE</Text>
              </LinearGradient>
            )}

            <View style={s.priceRow}>
              <Text style={s.planName}>Bond Pass</Text>
              <View style={s.pricePill}>
                <Text style={s.priceAmount}>{product?.localizedPrice ?? '$4.99'}</Text>
                <Text style={s.pricePer}>/month</Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.featureList}>
              {PASS_FEATURES.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <View style={s.featureDot} />
                  <Text style={s.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            <View style={s.divider} />

            {hasBondPass ? (
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <View style={s.activeState}>
                  <Text style={s.activeStateText}>✓  Bond Pass is active</Text>
                </View>
              </Animated.View>
            ) : (
              <TouchableOpacity
                style={[s.ctaWrap, loading && { opacity: 0.6 }]}
                onPress={handleSubscribe}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                  <Text style={s.ctaText}>{loading ? 'Processing…' : 'Get Bond Pass  →'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Free plan comparison ── */}
        <View style={s.freeCard}>
          <Text style={s.freePlanName}>Free Plan — what you get without Bond Pass</Text>
          <View style={s.freeList}>
            {[
              '5 daily connects',
              'Message bonded users only',
              '70% gift payout rate',
              '1 Random Connect per day',
              'Join up to 3 events',
            ].map((line, i) => (
              <View key={i} style={s.freeRow}>
                <Text style={s.freeDot}>·</Text>
                <Text style={s.freeText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Cancel / footer ── */}
        <View style={s.footer}>
          {hasBondPass ? (
            <TouchableOpacity onPress={handleCancel} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel Bond Pass</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.footerNote}>Cancel anytime · Payments secured by App Store</Text>
          )}
          <Text style={s.footerBrand}>WorldBond — connecting humanity, one conversation at a time</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1C1F23',
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center' },
  backArrow:   { color: BOND_PINK, fontSize: 24, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  scroll: { paddingBottom: 48 },

  // Hero
  hero:      { marginBottom: 4 },
  heroBg:    { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 16, textAlign: 'center', letterSpacing: -0.5 },
  heroSub:   { color: '#666666', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 21, maxWidth: 280 },

  // Plan card
  card: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 22, borderWidth: 1.5, padding: 22,
    backgroundColor: '#0f1016', borderColor: '#1e2028', overflow: 'hidden',
  },
  cardActive: { borderColor: BOND_PINK + '55', backgroundColor: '#0f0a12' },

  activeBadge:     { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 14 },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  priceRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  planName:    { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  pricePill:   { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceAmount: { color: BOND_PINK, fontSize: 26, fontWeight: '900' },
  pricePer:    { color: '#555555', fontSize: 14, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#1e2028', marginVertical: 16 },

  featureList: { gap: 13, marginBottom: 4 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: BOND_PINK, flexShrink: 0, marginTop: 1 },
  featureText: { color: '#cccccc', fontSize: 14, lineHeight: 20, flex: 1 },

  ctaWrap: { borderRadius: 16, overflow: 'hidden' },
  ctaGrad: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  activeState:     { backgroundColor: BOND_PINK + '15', borderWidth: 1, borderColor: BOND_PINK + '40', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  activeStateText: { color: BOND_PINK, fontSize: 15, fontWeight: '800' },

  // Free comparison card
  freeCard:    { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#0a0a0a', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#1a1a1a' },
  freePlanName:{ color: '#444444', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  freeList:    { gap: 8 },
  freeRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  freeDot:     { color: '#333333', fontSize: 16, fontWeight: '900', lineHeight: 20 },
  freeText:    { color: '#444444', fontSize: 13, lineHeight: 19 },

  // Footer
  footer:      { alignItems: 'center', gap: 8, paddingHorizontal: 24, marginTop: 4 },
  footerNote:  { color: '#333333', fontSize: 12, textAlign: 'center' },
  footerBrand: { color: 'rgba(255,255,255,0.12)', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
  cancelBtn:   { paddingVertical: 10 },
  cancelText:  { color: '#ef4444', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
