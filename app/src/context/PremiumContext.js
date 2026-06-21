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
    signalColor:  '#555555',
    signalRings:  1,
    canFilterVibe:    false,
    canFilterGender:  false,
    canFilterCountry: false,
    cardOrder:    'random',
    // ── Bond / Follow / Message identity ──────────────────────────────
    // Bond button
    bondLabel:       'Bond',
    bondIcon:        '🤝',
    bondGradColors:  ['#2a2e38', '#1a1e28'],
    bondBorderColor: '#3a3e48',
    canSendBondNote: false,   // no personal intro with bond request
    bondNoteLimit:   0,
    bondPriority:    false,   // request appears normally in recipient list
    // Follow button
    followLabel:     'Follow',
    followIcon:      '➕',
    followBadge:     null,    // no badge on follow notification
    // Message button
    messageLabel:    'Message',
    messageGradColors:  null, // null = plain border style
    messageBorderColor: '#FF0080',
    canMessageAnyone:   false, // free: can only DM bonded users
  },
  plus: {
    id: 'plus',
    label: 'WorldBond Plus',
    price: '$4.99/mo',
    color: '#FF0080',
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
    signalColor:  '#FF0080',
    signalRings:  3,
    canFilterVibe:    true,
    canFilterGender:  true,
    canFilterCountry: false,
    cardOrder:    'filtered',
    // ── Bond / Follow / Message identity ──────────────────────────────
    bondLabel:       'Bond+',
    bondIcon:        '💜',
    bondGradColors:  ['#FF0080', '#CC0060'],
    bondBorderColor: '#FF0080',
    canSendBondNote: true,    // can write a personal note with bond request
    bondNoteLimit:   150,
    bondPriority:    false,
    followLabel:     'Follow+',
    followIcon:      '💜',
    followBadge:     '💜',   // recipient sees 💜 badge on the follow notification
    messageLabel:    'Message+',
    messageGradColors:  ['#FF008044', '#CC006022'],
    messageBorderColor: '#FF0080',
    canMessageAnyone:   true,  // plus: can DM anyone, bonded or not
  },
  pro: {
    id: 'pro',
    label: 'WorldBond Pro',
    price: '$9.99/mo',
    color: '#FFB700',
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
    signalColor:  '#FFB700',
    signalRings:  5,
    canFilterVibe:    true,
    canFilterGender:  true,
    canFilterCountry: true,
    cardOrder:    'priority',
    // ── Bond / Follow / Message identity ──────────────────────────────
    bondLabel:       'Priority Bond',
    bondIcon:        '⚡',
    bondGradColors:  ['#FFB700', '#D99500'],
    bondBorderColor: '#FFB700',
    canSendBondNote: true,
    bondNoteLimit:   300,
    bondPriority:    true,
    followLabel:     'Priority Follow',
    followIcon:      '⚡',
    followBadge:     '⚡',
    messageLabel:    'Priority Message',
    messageGradColors:  ['#FFB70033', '#D9950022'],
    messageBorderColor: '#FFB700',
    canMessageAnyone:   true,
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
