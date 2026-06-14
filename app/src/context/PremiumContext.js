import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TIERS = {
  free: {
    id: 'free',
    label: 'Free',
    price: '$0',
    color: '#555555',
    giftsPerDay: 3,
    icebreakerResponses: 5,
    randomConnectsPerDay: 1,
    bondsPerDay: 5,
    maxEventJoins: 3,
    canCreateEvents: false,
    premiumBadge: false,
    verifiedBadge: false,
    // Signal config
    signalName:   'Basic Signal',
    signalEmoji:  '📶',
    signalColor:  '#555',
    signalRings:  1,
    canFilterVibe:    false,
    canFilterGender:  false,
    canFilterCountry: false,
    cardOrder:    'random',
  },
  plus: {
    id: 'plus',
    label: 'WorldBond Plus',
    price: '$4.99/mo',
    color: '#6C47FF',
    giftsPerDay: Infinity,
    icebreakerResponses: Infinity,
    randomConnectsPerDay: 5,
    bondsPerDay: 30,
    maxEventJoins: Infinity,
    canCreateEvents: false,
    premiumBadge: true,
    verifiedBadge: false,
    // Signal config
    signalName:   'Enhanced Signal',
    signalEmoji:  '📶',
    signalColor:  '#6C47FF',
    signalRings:  3,
    canFilterVibe:    true,
    canFilterGender:  true,
    canFilterCountry: false,
    cardOrder:    'filtered',
  },
  pro: {
    id: 'pro',
    label: 'WorldBond Pro',
    price: '$9.99/mo',
    color: '#f59e0b',
    giftsPerDay: Infinity,
    icebreakerResponses: Infinity,
    randomConnectsPerDay: Infinity,
    bondsPerDay: Infinity,
    maxEventJoins: Infinity,
    canCreateEvents: true,
    premiumBadge: true,
    verifiedBadge: true,
    // Signal config
    signalName:   'Priority Signal',
    signalEmoji:  '📡',
    signalColor:  '#f59e0b',
    signalRings:  5,
    canFilterVibe:    true,
    canFilterGender:  true,
    canFilterCountry: true,
    cardOrder:    'priority',
  },
};

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [tier, setTier] = useState('free');

  useEffect(() => {
    AsyncStorage.getItem('worldbond_tier').then(t => {
      if (t && TIERS[t]) setTier(t);
    });
  }, []);

  async function upgradeTo(tierId) {
    // In production: integrate RevenueCat or StoreKit/Play Billing here
    // For now we simulate a successful purchase
    setTier(tierId);
    await AsyncStorage.setItem('worldbond_tier', tierId);
  }

  async function cancelSubscription() {
    setTier('free');
    await AsyncStorage.setItem('worldbond_tier', 'free');
  }

  const tierInfo = TIERS[tier];
  const isPremium = tier !== 'free';
  const isPro = tier === 'pro';

  return (
    <PremiumContext.Provider value={{ tier, tierInfo, isPremium, isPro, upgradeTo, cancelSubscription }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
