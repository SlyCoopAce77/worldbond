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

  const iapReadyRef = useRef(false);

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

      // Always register purchase listeners first so we never miss a delivery
      purchaseUpdateSub.current = RNIap.purchaseUpdatedListener(async (purchase) => {
        if (purchase.productId !== BOND_PASS_SKU) return;
        try {
          await RNIap.finishTransaction({ purchase, isConsumable: false });
        } catch {}
        setHasBondPass(true);
        await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
      });

      purchaseErrorSub.current = RNIap.purchaseErrorListener((error) => {
        if (error.code !== 'E_USER_CANCELLED') {
          console.warn('[BondPass] IAP error:', error.code, error.message);
        }
      });

      try {
        await RNIap.initConnection();
        iapReadyRef.current = true;

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
      } catch (e) {
        console.warn('[BondPass] IAP init error:', e?.code, e?.message);
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
    if (!iapReadyRef.current) {
      // Attempt to reconnect if init failed earlier
      await RNIap.initConnection();
      iapReadyRef.current = true;
    }
    return RNIap.requestSubscription({ sku: BOND_PASS_SKU });
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
