import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import * as RNIap from 'react-native-iap';
import { SERVER_URL } from '../services/socket';

const BOND_PASS_KEY = 'worldbond_bond_pass';
export const BOND_PASS_SKU = 'com.worldbond.bondpass.monthly';

const BondPassContext = createContext(null);

// ── Server is the source of truth for Bond Pass status ───────────────────────
// Local AsyncStorage / RNIap.getAvailablePurchases() are only used to avoid a UI
// flash on cold start and to know *which* receipt to submit — the actual
// has_bond_pass flag that other server routes (payout rate, streak shield, etc.)
// rely on is only ever set by the server after it verifies the receipt with Apple.
async function authHeaders() {
  const raw  = await AsyncStorage.getItem('worldbond_auth');
  const auth = raw ? JSON.parse(raw) : null;
  if (!auth?.token) return null;
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` };
}

// Submits a receipt for server-side Apple verification. Returns the server's
// authoritative has_bond_pass boolean, or null if the request couldn't complete
// (e.g. offline) — callers should fall back to cached state, not assume true.
async function verifyBondPassReceipt(receipt) {
  try {
    const headers = await authHeaders();
    if (!headers) return null;
    const res = await fetch(`${SERVER_URL}/subscriptions/verify-bond-pass`, {
      method: 'POST', headers,
      body: JSON.stringify({ receipt }),
    });
    if (!res.ok) return false; // server explicitly rejected the receipt
    const data = await res.json();
    return !!data.has_bond_pass;
  } catch {
    return null; // network error — unknown, don't clobber cached state
  }
}

// Fetches the current server-side subscription status (no receipt needed).
async function fetchBondPassStatus() {
  try {
    const headers = await authHeaders();
    if (!headers) return null;
    const res = await fetch(`${SERVER_URL}/subscriptions/status`, { method: 'GET', headers });
    if (!res.ok) return null;
    const data = await res.json();
    return !!data.has_bond_pass;
  } catch {
    return null;
  }
}

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
        // Optimistic local update so the UI responds immediately...
        setHasBondPass(true);
        await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
        // ...but the server's verdict (after verifying the receipt with Apple) wins.
        const serverActive = await verifyBondPassReceipt(purchase.transactionReceipt);
        if (serverActive === false) {
          setHasBondPass(false);
          await AsyncStorage.removeItem(BOND_PASS_KEY);
        } else if (serverActive === true) {
          setHasBondPass(true);
          await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
        }
        // serverActive === null (offline) — keep the optimistic local value;
        // it will be reconciled against /subscriptions/status next launch.
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

        // The store telling us a purchase exists locally is not sufficient on its
        // own (it doesn't reflect refunds/chargebacks and can be tampered with on a
        // compromised device) — always reconcile against the server, which holds
        // the Apple-verified truth in profiles.has_bond_pass.
        const purchases  = await RNIap.getAvailablePurchases();
        const localMatch = purchases.find(p => p.productId === BOND_PASS_SKU);

        let serverActive = await fetchBondPassStatus();

        // Server has no record yet (e.g. verify call never completed after a
        // previous purchase) but the store has a live purchase — submit it now
        // so the server can catch up.
        if (serverActive !== true && localMatch?.transactionReceipt) {
          const verified = await verifyBondPassReceipt(localMatch.transactionReceipt);
          if (verified !== null) serverActive = verified;
        }

        if (serverActive === true) {
          setHasBondPass(true);
          await AsyncStorage.setItem(BOND_PASS_KEY, 'true');
        } else if (serverActive === false) {
          // Server explicitly says no active subscription — trust it over any
          // stale local cache.
          setHasBondPass(false);
          await AsyncStorage.removeItem(BOND_PASS_KEY);
        }
        // serverActive === null (offline/unreachable) — keep whatever was
        // restored from cache above; don't downgrade the user while offline.
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
