import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { usePremium, TIERS } from '../context/PremiumContext';

const { width } = Dimensions.get('window');

// Set to false when real StoreKit IAP is integrated
const IS_BETA = true;

const FEATURES = {
  free: [
    { label: 'Direct messaging + translation', has: true },
    { label: 'Group chats (8 categories)', has: true },
    { label: 'Explore spots worldwide', has: true },
    { label: '3 gifts per day', has: true },
    { label: '1 Random Connect per day', has: true },
    { label: 'Join up to 3 events', has: true },
    { label: 'Read 5 icebreaker responses', has: true },
    { label: 'Premium badge on profile', has: false },
    { label: 'See who viewed you', has: false },
    { label: 'Create & host events', has: false },
    { label: 'Verified badge', has: false },
  ],
  plus: [
    { label: 'Everything in Free', has: true },
    { label: 'Unlimited gifts', has: true },
    { label: '5 Random Connects per day', has: true },
    { label: 'Join unlimited events', has: true },
    { label: 'All icebreaker responses', has: true },
    { label: '💜 Premium badge on profile', has: true },
    { label: 'Priority in People list', has: true },
    { label: 'See who viewed your profile', has: true },
    { label: 'Create & host events', has: false },
    { label: 'Verified badge', has: false },
  ],
  pro: [
    { label: 'Everything in Plus', has: true },
    { label: 'Unlimited Random Connects', has: true },
    { label: 'Create & host virtual events', has: true },
    { label: 'Language Exchange matching', has: true },
    { label: '🌟 Verified badge', has: true },
    { label: 'Custom profile themes', has: true },
    { label: 'Voice translation in calls', has: true },
    { label: 'Pin 5 favorite spots', has: true },
    { label: 'Priority support', has: true },
    { label: 'Early access to features', has: true },
  ],
};

const YEARLY_DISCOUNT = 0.35; // 35% off

function TierCard({ tierId, currentTier, billing, onPress, loading, animValue }) {
  const t = TIERS[tierId];
  const features = FEATURES[tierId];
  const isActive = currentTier === tierId;
  const isLoading = loading === tierId;
  const isFree = tierId === 'free';
  const isPro = tierId === 'pro';

  const monthlyPrice = isFree ? 0 : parseFloat(t.price.replace('$', '').replace('/mo', ''));
  const displayPrice = isFree
    ? 'Free'
    : IS_BETA
    ? 'Free during beta'
    : billing === 'yearly'
    ? `$${(monthlyPrice * (1 - YEARLY_DISCOUNT)).toFixed(2)}/mo`
    : t.price;
  const yearlyTotal = (isFree || IS_BETA) ? null : billing === 'yearly'
    ? `$${(monthlyPrice * (1 - YEARLY_DISCOUNT) * 12).toFixed(0)}/yr`
    : null;

  const scale = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const opacity = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const cardBorderColor = isActive ? t.color : isPro ? t.color + '55' : '#2F3336';
  const cardBg = isPro ? '#1C1F23' : '#16181C';

  const btnLabel = isLoading
    ? 'Processing…'
    : isActive
    ? 'Current Plan'
    : isFree
    ? 'Downgrade to Free'
    : IS_BETA
    ? `Activate ${t.label.replace('WorldBond ', 'Bond ')} Free`
    : `Get ${t.label.replace('WorldBond ', '')}`;

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.card, { borderColor: cardBorderColor, backgroundColor: cardBg }]}
        onPress={() => onPress(tierId)}
        activeOpacity={0.85}
        disabled={isActive}
      >
        {isPro && (
          <LinearGradient
            colors={['#f59e0b', '#e07b00']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.popularBadge}
          >
            <Text style={styles.popularBadgeText}>⭐  MOST POPULAR</Text>
          </LinearGradient>
        )}

        <View style={styles.cardTop}>
          <View>
            <Text style={[styles.tierName, { color: t.color }]}>
              {t.label.replace('WorldBond ', 'Bond ')}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{displayPrice}</Text>
              {yearlyTotal && (
                <Text style={styles.yearlyTotal}>{yearlyTotal}</Text>
              )}
            </View>
            {!isFree && billing === 'yearly' && (
              <Text style={styles.savingsBadge}>Save 35%</Text>
            )}
          </View>

          {isActive && (
            <View style={[styles.activePill, { backgroundColor: t.color + '22', borderColor: t.color }]}>
              <Text style={[styles.activePillText, { color: t.color }]}>Active</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.featureList}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={[styles.featureIcon, f.has ? { color: t.color } : styles.featureIconNo]}>
                {f.has ? '✓' : '✕'}
              </Text>
              <Text style={[styles.featureLabel, !f.has && styles.featureLabelNo]}>
                {f.label}
              </Text>
            </View>
          ))}
        </View>

        {isActive ? (
          <View style={[styles.btn, { backgroundColor: t.color + '18', borderWidth: 1, borderColor: t.color }]}>
            <Text style={[styles.btnText, { color: t.color }]}>Current Plan</Text>
          </View>
        ) : isPro ? (
          <LinearGradient
            colors={['#f59e0b', '#e07b00']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>{btnLabel}</Text>
          </LinearGradient>
        ) : isFree ? (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#2F3336', borderWidth: 1, borderColor: '#333' }]}
            onPress={() => onPress(tierId)}
            disabled={isActive}
          >
            <Text style={[styles.btnText, { color: '#666' }]}>{btnLabel}</Text>
          </TouchableOpacity>
        ) : (
          <LinearGradient
            colors={['#E8003D', '#C7003A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>{btnLabel}</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SubscriptionScreen({ navigation }) {
  const { tier, upgradeTo, cancelSubscription } = usePremium();
  const [loading, setLoading] = useState(null);
  const [billing, setBilling] = useState('monthly');

  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const toggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.stagger(120, cardAnims.map(a =>
        Animated.spring(a, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true })
      )),
    ]).start();
  }, []);

  function toggleBilling(b) {
    setBilling(b);
    Animated.timing(toggleAnim, {
      toValue: b === 'yearly' ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }

  async function handlePress(tierId) {
    if (tierId === tier) return;
    if (tierId === 'free') {
      Alert.alert(
        'Cancel Subscription',
        'Are you sure you want to go back to the free plan?',
        [
          { text: 'Keep Premium', style: 'cancel' },
          { text: 'Downgrade', style: 'destructive', onPress: async () => { await cancelSubscription(); } },
        ],
      );
      return;
    }
    setLoading(tierId);
    await new Promise(r => setTimeout(r, 1200));
    await upgradeTo(tierId);
    setLoading(null);
    const t = TIERS[tierId];
    Alert.alert(
      '🎉 Welcome!',
      `You're now on ${t.label.replace('WorldBond ', 'Bond ')}. Enjoy your new perks!`,
      [{ text: "Let's go!", onPress: () => navigation.goBack() }],
    );
  }

  const heroTranslate = heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });
  const heroOpacity = heroAnim;

  const toggleKnobX = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 98] });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }]}>
          <LinearGradient
            colors={['#E8003D22', '#f59e0b11', '#000000']}
            style={styles.heroBg}
          >
            <Text style={styles.heroGlobe}>🌍</Text>
            <Text style={styles.heroTitle}>Bond Without Limits</Text>
            <Text style={styles.heroSub}>
              Connect deeper with people around the world — get more gifts, events, and features
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Billing Toggle (hidden during beta) */}
        {!IS_BETA && (
          <View style={styles.toggleWrap}>
            <TouchableOpacity onPress={() => toggleBilling('monthly')} style={styles.toggleLabel}>
              <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleTrack}
              onPress={() => toggleBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
              activeOpacity={0.8}
            >
              <Animated.View style={[styles.toggleKnob, { transform: [{ translateX: toggleKnobX }] }]} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => toggleBilling('yearly')} style={styles.toggleLabel}>
              <Text style={[styles.toggleText, billing === 'yearly' && styles.toggleTextActive]}>
                Yearly
              </Text>
              <View style={styles.savePill}>
                <Text style={styles.savePillText}>-35%</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {IS_BETA && (
          <View style={styles.betaBanner}>
            <Text style={styles.betaBannerText}>All features are free during beta!</Text>
          </View>
        )}

        {/* Cards */}
        {['free', 'plus', 'pro'].map((tierId, i) => (
          <TierCard
            key={tierId}
            tierId={tierId}
            currentTier={tier}
            billing={billing}
            onPress={handlePress}
            loading={loading}
            animValue={cardAnims[i]}
          />
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          {IS_BETA
            ? <Text style={styles.footerLine}>Free during beta · Subscription pricing coming soon</Text>
            : <Text style={styles.footerLine}>🔒  Payments secured by App Store · Cancel anytime</Text>
          }
          <Text style={styles.footerBrand}>Bond — connecting humanity, one conversation at a time 🌍</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1C1F23',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { color: '#E8003D', fontSize: 24, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  scroll: { paddingBottom: 40 },

  hero: { marginBottom: 8 },
  heroBg: {
    alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24,
  },
  heroGlobe: { fontSize: 64 },
  heroTitle: {
    color: '#fff', fontSize: 26, fontWeight: '800',
    marginTop: 12, textAlign: 'center', letterSpacing: -0.5,
  },
  heroSub: {
    color: '#888', fontSize: 14, marginTop: 10,
    textAlign: 'center', lineHeight: 21, maxWidth: 300,
  },

  toggleWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginBottom: 20,
  },
  toggleLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { color: '#555', fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  toggleTrack: {
    width: 52, height: 28, backgroundColor: '#2F3336',
    borderRadius: 14, justifyContent: 'center',
    borderWidth: 1, borderColor: '#2F3336',
  },
  toggleKnob: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E8003D', position: 'absolute', left: 2,
  },
  savePill: {
    backgroundColor: '#E8003D', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  savePillText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  card: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 20,
    borderWidth: 1.5, padding: 20, overflow: 'hidden',
  },

  popularBadge: {
    alignSelf: 'flex-start', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12,
  },
  popularBadgeText: { color: '#000', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tierName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  priceText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  yearlyTotal: { color: '#666', fontSize: 13 },
  savingsBadge: {
    color: '#4ade80', fontSize: 11, fontWeight: '700', marginTop: 3,
  },

  activePill: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1,
  },
  activePillText: { fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#2F3336', marginVertical: 14 },

  featureList: { gap: 9, marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureIcon: { fontSize: 13, fontWeight: '700', width: 16, marginTop: 1 },
  featureIconNo: { color: '#333' },
  featureLabel: { color: '#ccc', fontSize: 13, lineHeight: 19, flex: 1 },
  featureLabelNo: { color: '#444' },

  btn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  betaBanner: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#E8003D18',
    borderWidth: 1, borderColor: '#E8003D40', borderRadius: 14,
    paddingVertical: 10, alignItems: 'center',
  },
  betaBannerText: { color: '#E8003D', fontSize: 13, fontWeight: '700' },

  footer: { alignItems: 'center', gap: 6, paddingHorizontal: 24, marginTop: 8 },
  footerLine: { color: '#444', fontSize: 12, textAlign: 'center' },
  footerBrand: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 6, fontStyle: 'italic' },
});
