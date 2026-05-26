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
    maxEventJoins: 3,
    canCreateEvents: false,
    premiumBadge: false,
    verifiedBadge: false,
  },
  plus: {
    id: 'plus',
    label: 'WorldBond Plus',
    price: '$4.99/mo',
    color: '#E8003D',
    giftsPerDay: Infinity,
    icebreakerResponses: Infinity,
    randomConnectsPerDay: 5,
    maxEventJoins: Infinity,
    canCreateEvents: false,
    premiumBadge: true,
    verifiedBadge: false,
  },
  pro: {
    id: 'pro',
    label: 'WorldBond Pro',
    price: '$9.99/mo',
    color: '#f59e0b',
    giftsPerDay: Infinity,
    icebreakerResponses: Infinity,
    randomConnectsPerDay: Infinity,
    maxEventJoins: Infinity,
    canCreateEvents: true,
    premiumBadge: true,
    verifiedBadge: true,
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
