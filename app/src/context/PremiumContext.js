import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import * as RNIap from 'react-native-iap';

const BOND_PASS_KEY = 'worldbond_bond_pass';
export const BOND_PASS_SKU = 'com.worldbond.bondpass.monthly';

const BondPassContext = createContext(null);

export function BondPassProvider({ children }) {
  const [hasBondPass, setHasBondPass] = useState(false);
  const [product, setProduct] = useState(null);
  const purchaseUpdateSub = useRef(null);
  const purchaseErrorSub  = useRef(null);

  useEffect(() => {
    async function init() {
      // Restore cached state immediately so UI doesn't flash
      const cached = await AsyncStorage.getItem(BOND_PASS_KEY);
      if (cached === 'true') setHasBondPass(true);

      // Migrate users who were on plus/pro tiers before the simplification
      const oldTier = await AsyncStorage.getItem('worldbond_tier');
      if (oldTier === 'plus' || oldTier === 'pro') {
        setHasBondPass(true);
        await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
      }

      try {
        await RNIap.initConnection();

        const subs = await RNIap.getSubscriptions({ skus: [BOND_PASS_SKU] });
        if (subs.length > 0) setProduct(subs[0]);

        // Validate active subscription state against the store
        const purchases = await RNIap.getAvailablePurchases();
        const active = purchases.some(p => p.productId === BOND_PASS_SKU);
        if (active) {
          setHasBondPass(true);
          await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
        } else if (cached !== 'true') {
          setHasBondPass(false);
          await AsyncStorage.removeItem(BOND_PASS_KEY);
        }

        purchaseUpdateSub.current = RNIap.purchaseUpdatedListener(async (purchase) => {
          if (purchase.productId !== BOND_PASS_SKU) return;
          await RNIap.finishTransaction({ purchase, isConsumable: false });
          setHasBondPass(true);
          await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
        });

        purchaseErrorSub.current = RNIap.purchaseErrorListener((error) => {
          if (error.code !== 'E_USER_CANCELLED') {
            console.warn('Bond Pass IAP error:', error.message);
          }
        });
      } catch (e) {
        console.warn('Bond Pass IAP init error:', e);
      }
    }

    init();

    return () => {
      purchaseUpdateSub.current?.remove();
      purchaseErrorSub.current?.remove();
      RNIap.endConnection();
    };
  }, []);

  async function subscribeToBondPass() {
    await RNIap.requestSubscription({ sku: BOND_PASS_SKU });
  }

  function cancelBondPass() {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  }

  return (
    <BondPassContext.Provider value={{ hasBondPass, product, subscribeToBondPass, cancelBondPass }}>
      {children}
    </BondPassContext.Provider>
  );
}

export function useBondPass() {
  return useContext(BondPassContext);
}

// ─── Backward-compat shim ─────────────────────────────────────────────────────
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
