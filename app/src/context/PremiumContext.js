import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOND_PASS_KEY = 'worldbond_bond_pass';

const BondPassContext = createContext(null);

export function BondPassProvider({ children }) {
  const [hasBondPass, setHasBondPass] = useState(false);

  useEffect(() => {
    async function restore() {
      const val = await AsyncStorage.getItem(BOND_PASS_KEY);
      if (val === 'true') { setHasBondPass(true); return; }
      // Migrate users who were on plus/pro tiers before the simplification
      const oldTier = await AsyncStorage.getItem('worldbond_tier');
      if (oldTier === 'plus' || oldTier === 'pro') {
        setHasBondPass(true);
        await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
      }
    }
    restore();
  }, []);

  async function subscribeToBondPass() {
    setHasBondPass(true);
    await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
  }

  async function cancelBondPass() {
    setHasBondPass(false);
    await AsyncStorage.removeItem(BOND_PASS_KEY);
  }

  return (
    <BondPassContext.Provider value={{ hasBondPass, subscribeToBondPass, cancelBondPass }}>
      {children}
    </BondPassContext.Provider>
  );
}

export function useBondPass() {
  return useContext(BondPassContext);
}

// ─── Backward-compat shim ─────────────────────────────────────────────────────
// Screens that haven't been migrated yet still call usePremium().
// This maps hasBondPass → the shape they expect so nothing breaks.
export function usePremium() {
  const { hasBondPass, subscribeToBondPass, cancelBondPass } = useBondPass();
  const tierInfo = {
    id:                  hasBondPass ? 'plus' : 'free',
    label:               hasBondPass ? 'Bond Pass' : 'Free',
    color:               hasBondPass ? '#FF0080' : '#555555',
    bondLabel:           'Bond',
    bondIcon:            '🌍',
    bondGradColors:      ['#FF0080', '#CC0060'],
    bondBorderColor:     '#FF0080',
    canSendBondNote:     hasBondPass,
    bondNoteLimit:       hasBondPass ? 150 : 0,
    bondPriority:        false,
    followLabel:         'Follow',
    followIcon:          '➕',
    followBadge:         null,
    canMessageAnyone:    hasBondPass,
    icebreakerResponses: Infinity,
    randomConnectsPerDay:Infinity,
    bondsPerDay:         Infinity,
    canFilterGender:     hasBondPass,
    canFilterCountry:    false,
    canFilterVibe:       hasBondPass,
    canCreateEvents:     hasBondPass,
    premiumBadge:        hasBondPass,
    verifiedBadge:       false,
    signalColor:         '#FF0080',
    signalRings:         hasBondPass ? 3 : 1,
    signalName:          hasBondPass ? 'Bond Pass Signal' : 'Basic Signal',
    signalEmoji:         '📶',
    cardOrder:           'random',
    messageGradColors:   hasBondPass ? ['#FF008044', '#CC006022'] : null,
    messageBorderColor:  '#FF0080',
  };

  return {
    hasBondPass,
    tier:              hasBondPass ? 'plus' : 'free',
    tierInfo,
    isPremium:         hasBondPass,
    isPro:             false,
    isPlus:            hasBondPass,
    upgradeTo:         subscribeToBondPass,
    cancelSubscription:cancelBondPass,
  };
}

// Re-export under the old name so App.js doesn't need to change
export { BondPassProvider as PremiumProvider };
