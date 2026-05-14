import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { usePremium, TIERS } from '../context/PremiumContext';

const TIER_FEATURES = {
  free: [
    '✓ Direct messaging with translation',
    '✓ Group chats (8 categories)',
    '✓ Explore spots worldwide',
    '✓ 3 gifts per day',
    '✓ 1 Random Connect per day',
    '✓ Join up to 3 events',
    '✓ Read 5 icebreaker responses',
    '✗ Premium badge',
    '✗ Create events',
    '✗ Verified badge',
  ],
  plus: [
    '✓ Everything in Free',
    '✓ Unlimited gifts',
    '✓ 5 Random Connects per day',
    '✓ Join unlimited events',
    '✓ Read all icebreaker responses',
    '✓ 💜 Premium badge on profile',
    '✓ Priority in People list',
    '✓ See who viewed your profile',
    '✗ Create your own events',
    '✗ Verified ✓ badge',
  ],
  pro: [
    '✓ Everything in Plus',
    '✓ Unlimited Random Connects',
    '✓ Create & host virtual events',
    '✓ Language Exchange matching',
    '✓ 🌟 Verified ✓ badge',
    '✓ Custom profile themes',
    '✓ Voice translation in calls',
    '✓ Pin 5 favorite spots',
    '✓ Priority support',
    '✓ Early access to new features',
  ],
};

export default function SubscriptionScreen({ navigation }) {
  const { tier, upgradeTo, cancelSubscription } = usePremium();
  const [loading, setLoading] = useState(null);

  async function handleUpgrade(tierId) {
    if (tierId === tier) return;
    if (tierId === 'free') {
      Alert.alert(
        'Cancel Subscription',
        'Are you sure you want to go back to the free plan?',
        [
          { text: 'Keep Premium', style: 'cancel' },
          { text: 'Cancel', style: 'destructive', onPress: async () => { await cancelSubscription(); } },
        ],
      );
      return;
    }
    setLoading(tierId);
    // Simulate payment delay
    await new Promise(r => setTimeout(r, 1200));
    await upgradeTo(tierId);
    setLoading(null);
    Alert.alert('Success! 🎉', `You are now on ${TIERS[tierId].label}!`, [{ text: 'Let\'s go!', onPress: () => navigation.goBack() }]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🌍</Text>
          <Text style={styles.heroTitle}>Bond Without Limits</Text>
          <Text style={styles.heroSubtitle}>Upgrade to connect deeper with people around the world</Text>
        </View>

        {['free', 'plus', 'pro'].map(tierId => {
          const t = TIERS[tierId];
          const features = TIER_FEATURES[tierId];
          const isCurrentTier = tier === tierId;
          const isLoading = loading === tierId;

          return (
            <View
              key={tierId}
              style={[
                styles.tierCard,
                isCurrentTier && { borderColor: t.color, borderWidth: 2 },
                tierId === 'pro' && styles.tierCardFeatured,
              ]}
            >
              {tierId === 'pro' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>⭐ MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.tierHeader}>
                <View>
                  <Text style={[styles.tierName, { color: t.color }]}>{t.label}</Text>
                  <Text style={styles.tierPrice}>{t.price}</Text>
                </View>
                {isCurrentTier && (
                  <View style={[styles.currentBadge, { backgroundColor: t.color + '33' }]}>
                    <Text style={[styles.currentBadgeText, { color: t.color }]}>Current Plan</Text>
                  </View>
                )}
              </View>

              <View style={styles.featureList}>
                {features.map((f, i) => (
                  <Text
                    key={i}
                    style={[styles.featureItem, f.startsWith('✗') && styles.featureItemDisabled]}
                  >
                    {f}
                  </Text>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.tierBtn,
                  { backgroundColor: isCurrentTier ? '#1a1a2e' : t.color },
                  isCurrentTier && { borderWidth: 1, borderColor: t.color },
                ]}
                onPress={() => handleUpgrade(tierId)}
                disabled={isCurrentTier}
              >
                <Text style={[styles.tierBtnText, isCurrentTier && { color: t.color }]}>
                  {isLoading ? 'Processing...' : isCurrentTier ? 'Current Plan' : tierId === 'free' ? 'Downgrade to Free' : `Get ${t.label}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          * In production, payments are processed securely via the App Store / Google Play. Cancel anytime.
          {'\n\n'}Built on WorldBond — connecting humanity, one conversation at a time 🌍
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e', gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: '#6c63ff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, gap: 20 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  heroEmoji: { fontSize: 56 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 12, textAlign: 'center' },
  heroSubtitle: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  tierCard: {
    backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#2a2a4a', gap: 16,
  },
  tierCardFeatured: { borderColor: '#f59e0b', borderWidth: 1 },
  popularBadge: {
    backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 4, alignSelf: 'flex-start',
  },
  popularBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierName: { fontSize: 20, fontWeight: 'bold' },
  tierPrice: { color: '#aaa', fontSize: 14, marginTop: 2 },
  currentBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  currentBadgeText: { fontSize: 12, fontWeight: '700' },
  featureList: { gap: 8 },
  featureItem: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  featureItemDisabled: { color: '#444' },
  tierBtn: { borderRadius: 14, padding: 14, alignItems: 'center' },
  tierBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disclaimer: { color: '#444', fontSize: 11, textAlign: 'center', lineHeight: 18, paddingBottom: 20 },
});
