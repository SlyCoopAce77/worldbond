import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { isStampDropped } from './ChallengeContext';
import { getSavedWalletState } from '../services/authApi';
import { SERVER_URL } from '../services/socket';

const STORAGE_KEY = 'worldbond_wallet';
const STAMPS_KEY  = 'worldbond_stamps';

// 100 coins = $1 face value. Payout rates (see PAYOUT_RATES) determine creator share.
export const COINS_PER_DOLLAR = 100;
export const PLATFORM_CUT     = 0.30; // platform's share at base rate (1 - 0.70)

// Pure conversion — payout rate is applied separately in the wallet screen.
export function coinsToUSD(coins) {
  return (coins / COINS_PER_DOLLAR).toFixed(2);
}
export function usdToCoins(usd) {
  return Math.ceil(usd * COINS_PER_DOLLAR);
}

// ─── Holding Caps ────────────────────────────────────────────────────────────
export const STAMP_CAP    = { standard: 3, bond_pass: 4 };
export const MONUMENT_CAP = { standard: 2, bond_pass: 3 };

// ─── Payout Cooldown Tiers ────────────────────────────────────────────────────
// Standard: 30 days  |  Bond Pass: 14 days  |  Top Creator (#1–3): 7 days
export const PAYOUT_COOLDOWNS = {
  standard:    30 * 86400000,
  bond_pass:   14 * 86400000,
  top_creator:  7 * 86400000,
};

export function getPayoutCooldownMs(hasBondPass, isTopCreator) {
  if (isTopCreator) return PAYOUT_COOLDOWNS.top_creator;
  if (hasBondPass)  return PAYOUT_COOLDOWNS.bond_pass;
  return PAYOUT_COOLDOWNS.standard;
}

export function getPayoutCooldownDays(hasBondPass, isTopCreator) {
  if (isTopCreator) return 7;
  if (hasBondPass)  return 14;
  return 30;
}

// ─── Country Stamps — 1-of-1 per country ─────────────────────────────────────
// Only countries with active streaming communities (18+, Tier 1 + Tier 2 global markets).
// Holder earns 3% passive royalty on all gifts sent to streamers from their country.
// lastActivity tracks when the holder last contributed — if > 30 days ago, stamp is DROPPED.
// Holder/coinsEarned/since/lastActivity are NOT hardcoded here anymore — real
// current holders come from GET /collectibles (server/src/collectibles.js) and
// are merged in below, so ownership is globally consistent instead of each
// device simulating its own fake winners.
export const STAMP_COUNTRIES = [
  '🇺🇸','🇧🇷','🇰🇷','🇯🇵','🇬🇧','🇲🇽','🇦🇺','🇮🇩','🇹🇷','🇩🇪',
  '🇦🇷','🇷🇺','🇫🇷','🇪🇸','🇨🇦','🇮🇳','🇵🇭','🇸🇦','🇵🇱','🇹🇭',
  '🇸🇪','🇳🇱','🇵🇹','🇨🇴',
];
const EMPTY_STAMP = { holder: null, coinsEarned: 0, since: null, lastActivity: null };

// ─── Bond Monuments — 1-of-1 per famous world location ───────────────────────
// Holder earns 2% of all gifts sent during any stream from that region.
// Can be claimed (if empty) or challenged via 7-day gifting contest.
// Static metadata only (id/name/icon/country/location) — holder/coinsEarned
// come from the server, merged reactively in WalletProvider below.
export const BOND_MONUMENTS = [
  { id: 'liberty',      name: 'Statue of Liberty',    icon: '🗽', country: '🇺🇸', location: 'New York, USA'          },
  { id: 'grand_canyon', name: 'Grand Canyon',         icon: '🏜️', country: '🇺🇸', location: 'Arizona, USA'           },
  { id: 'christ',       name: 'Christ the Redeemer',  icon: '⛪', country: '🇧🇷', location: 'Rio de Janeiro, Brazil' },
  { id: 'amazon',       name: 'Amazon River',         icon: '🌿', country: '🇧🇷', location: 'Amazon, Brazil'         },
  { id: 'gyeongbok',    name: 'Gyeongbokgung Palace', icon: '🏯', country: '🇰🇷', location: 'Seoul, South Korea'     },
  { id: 'fuji',         name: 'Mount Fuji',           icon: '🗻', country: '🇯🇵', location: 'Shizuoka, Japan'        },
  { id: 'fushimi',      name: 'Fushimi Inari Shrine', icon: '⛩️', country: '🇯🇵', location: 'Kyoto, Japan'           },
  { id: 'gate',         name: 'Brandenburg Gate',     icon: '🏛️', country: '🇩🇪', location: 'Berlin, Germany'        },
  { id: 'bigben',       name: 'Big Ben',              icon: '🕰️', country: '🇬🇧', location: 'London, UK'             },
  { id: 'eiffel',       name: 'Eiffel Tower',         icon: '🗼', country: '🇫🇷', location: 'Paris, France'          },
  { id: 'sagrada',      name: 'Sagrada Família',      icon: '🕍', country: '🇪🇸', location: 'Barcelona, Spain'       },
  { id: 'red_square',   name: 'Red Square',           icon: '🏰', country: '🇷🇺', location: 'Moscow, Russia'         },
  { id: 'niagara',      name: 'Niagara Falls',        icon: '🌊', country: '🇨🇦', location: 'Ontario, Canada'        },
  { id: 'chichen',      name: 'Chichen Itza',         icon: '🗿', country: '🇲🇽', location: 'Yucatán, Mexico'        },
  { id: 'taj',          name: 'Taj Mahal',            icon: '🕌', country: '🇮🇳', location: 'Agra, India'            },
  { id: 'borobudur',    name: 'Borobudur',            icon: '☸️', country: '🇮🇩', location: 'Java, Indonesia'        },
  { id: 'hagia',        name: 'Hagia Sophia',         icon: '🌙', country: '🇹🇷', location: 'Istanbul, Turkey'       },
  { id: 'opera',        name: 'Sydney Opera House',   icon: '🎭', country: '🇦🇺', location: 'Sydney, Australia'      },
  { id: 'colosseum',    name: 'Colosseum',            icon: '🏟️', country: '🇮🇹', location: 'Rome, Italy'            },
  { id: 'great_wall',   name: 'Great Wall',           icon: '🧱', country: '🇨🇳', location: 'Beijing, China'         },
];

// ─── Payout Structure ─────────────────────────────────────────────────────────
//
// Platform research (what others pay creators on gifts):
//   Bigo Live    → ~35%   (worst in industry)
//   TikTok LIVE  → ~50%   (heavy diamond conversion loss)
//   Instagram    → ~70%   (Stars, after Meta's cut)
//   YouTube      → ~70%   (SuperChat, after Google's 30%)
//   Twitch       →  71%   (Bits effective rate)
//   Kick.com     →  95%   (industry disruptor, VC-subsidized)
//
// WorldBond positioning: beat TikTok/Bigo on day one, match YouTube,
// top creators approach Kick with monthly bonus + passive royalties.
//
//   Base (all users)     →  70%  — matches YouTube
//   WorldBond Plus       →  75%  — +5% subscriber bonus
//   WorldBond Pro        →  80%  — +10% subscriber bonus
//   🥇 #1 monthly        →  85%  — best mainstream rate in industry
//   🥈 #2 monthly        →  80%
//   🥉 #3 monthly        →  75%
//   + Country Stamp      →  +3%  passive royalty (on gifted streams from your country)
//   + Bond Monument      →  +2%  passive royalty (on gifted streams from your landmark region)

export const PAYOUT_RATES = {
  base:             0.70,
  bond_pass:        0.75,
  monthly_1:        0.85,
  monthly_2:        0.80,
  monthly_3:        0.75,
  stamp_royalty:    0.03,
  monument_royalty: 0.02,
  platform_cut:     PLATFORM_CUT,
};

// Real top-creator data now comes from GET /creators/top-monthly
// (server/src/creators.js), backed by the gift_earnings ledger — see
// WalletScreen.js's Creators tab. No more hardcoded demo leaderboard here.

// ── DEMO MODE — must match flag in App.js ─────────────────────────────────────
const DEMO_MODE = false;
// ─────────────────────────────────────────────────────────────────────────────

// ─── Context ──────────────────────────────────────────────────────────────────
const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [balance,        setBalance]        = useState(0);
  const [spent,          setSpent]          = useState(0);
  const [transactions,   setTransactions]   = useState([]);
  const [stamps,         setStamps]         = useState({});
  const [myStamps,       setMyStamps]       = useState([]);
  const [myMonuments,    setMyMonuments]    = useState([]);
  const [lastPayoutTs,   setLastPayoutTs]   = useState(null);
  // All-time win counts — never go down, survive losing a stamp
  const [totalStampWins,    setTotalStampWins]    = useState(0);
  const [totalMonumentWins, setTotalMonumentWins] = useState(0);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(STAMPS_KEY),
      getSavedWalletState(), // FIX BUG #1: Load server-synced coin balance
    ]).then(([walletRaw, stampsRaw, savedWalletState]) => {
      if (walletRaw) {
        const w = JSON.parse(walletRaw);
        // FIX BUG #1: If we have server-synced coin_balance, use it; otherwise use stored local balance
        const serverCoinBalance = savedWalletState?.coin_balance;
        const localBalance = w.balance ?? 0;
        const balance = serverCoinBalance !== undefined && serverCoinBalance !== null ? serverCoinBalance : localBalance;
        
        setBalance(balance);
        setSpent(w.spent ?? 0);
        setTransactions(w.transactions ?? []);
        setMyStamps(w.myStamps ?? []);
        setMyMonuments(w.myMonuments ?? []);
        setLastPayoutTs(w.lastPayoutTs ?? null);
        // Migrate existing users: seed from current holdings if no saved counts yet
        setTotalStampWins(w.totalStampWins    ?? (w.myStamps    ?? []).length);
        setTotalMonumentWins(w.totalMonumentWins ?? (w.myMonuments ?? []).length);
      } else if (DEMO_MODE) {
        // Seed demo wallet so all screens have something to show
        setBalance(5000);
        setSpent(1200);
        setMyStamps(['🇺🇸', '🇯🇵']);
        setMyMonuments(['fuji']);
        setTotalStampWins(2);
        setTotalMonumentWins(1);
        setTransactions([
          { id: 1, type: 'earn',  amount: 3000, source: 'stream_gift',   ts: Date.now() - 86400000 * 2 },
          { id: 2, type: 'spend', amount: 500,  source: 'gift_sent',     ts: Date.now() - 86400000 },
          { id: 3, type: 'earn',  amount: 2000, source: 'stamp_royalty', ts: Date.now() - 3600000 },
          { id: 4, type: 'spend', amount: 700,  source: 'gift_sent',     ts: Date.now() - 1800000 },
        ]);
      } else if (savedWalletState?.coin_balance !== undefined) {
        // First login: no local storage but server has coins - sync them
        setBalance(savedWalletState.coin_balance);
      }
      const saved = stampsRaw ? JSON.parse(stampsRaw) : {};
      const blank = Object.fromEntries(STAMP_COUNTRIES.map(flag => [flag, EMPTY_STAMP]));
      setStamps({ ...blank, ...saved });
    });
  }, []);

  const [monumentHolders, setMonumentHolders] = useState({}); // id -> { holder, coinsEarned }

  // Real, server-authoritative ownership — replaces the old hardcoded fake
  // holders. Two different devices can no longer each believe they own the
  // same 1-of-1 collectible, since this reflects the single DB row for it.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${SERVER_URL}/collectibles`);
        const data = await res.json();
        if (data.stamps) {
          setStamps(prev => {
            const next = { ...prev };
            for (const s of data.stamps) {
              next[s.flag] = {
                holder:       s.holder_name || null,
                coinsEarned:  s.coins_earned || 0,
                since:        s.claimed_at ? new Date(s.claimed_at).getTime() : null,
                lastActivity: s.last_activity ? new Date(s.last_activity).getTime() : null,
              };
            }
            return next;
          });
        }
        if (data.monuments) {
          const map = {};
          for (const m of data.monuments) {
            map[m.monument_id] = { holder: m.holder_name || null, coinsEarned: m.coins_earned || 0 };
          }
          setMonumentHolders(map);
        }
      } catch (err) {
        console.warn('[Wallet] collectibles fetch error:', err.message);
      }
    })();
  }, []);

  // BOND_MONUMENTS metadata merged with real, live holder data.
  const monuments = BOND_MONUMENTS.map(m => ({
    ...m,
    holder:      monumentHolders[m.id]?.holder ?? null,
    coinsEarned: monumentHolders[m.id]?.coinsEarned ?? 0,
  }));

  const persist = useCallback((bal, sp, txs, ms, mm, lp, tsw, tmw) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      balance: bal, spent: sp, transactions: txs,
      myStamps: ms, myMonuments: mm, lastPayoutTs: lp,
      totalStampWins: tsw, totalMonumentWins: tmw,
    }));
  }, []);

  // Mirror all wallet state into a ref so functional updaters always read
  // the latest values — prevents stale closures in earnCoins/claimStamp/claimMonument.
  const stateRef = useRef({ balance, spent, transactions, myStamps, myMonuments, lastPayoutTs, totalStampWins, totalMonumentWins });
  useEffect(() => {
    stateRef.current = { balance, spent, transactions, myStamps, myMonuments, lastPayoutTs, totalStampWins, totalMonumentWins };
  }, [balance, spent, transactions, myStamps, myMonuments, lastPayoutTs, totalStampWins, totalMonumentWins]);

  function earnCoins(amount, source, meta = {}) {
    const tx = { id: Date.now(), type: 'earn', amount, source, ...meta, ts: Date.now() };
    setBalance(b => {
      const nb = b + amount;
      const { spent: sp, myStamps: ms, myMonuments: mm, lastPayoutTs: lp, totalStampWins: tsw, totalMonumentWins: tmw } = stateRef.current;
      setTransactions(prev => {
        const nt = [tx, ...prev].slice(0, 200);
        persist(nb, sp, nt, ms, mm, lp, tsw, tmw);
        return nt;
      });
      return nb;
    });
  }

  function spendCoins(amount, source, meta = {}) {
    const currentBalance = stateRef.current.balance;
    if (currentBalance < amount) return false;

    const tx = { id: Date.now(), type: 'spend', amount, source, ...meta, ts: Date.now() };
    setBalance(b => {
      if (b < amount) return b;
      const nb = b - amount;
      const { myStamps: ms, myMonuments: mm, lastPayoutTs: lp, totalStampWins: tsw, totalMonumentWins: tmw } = stateRef.current;
      setSpent(s => {
        const ns = s + amount;
        setTransactions(prev => {
          const nt = [tx, ...prev].slice(0, 200);
          persist(nb, ns, nt, ms, mm, lp, tsw, tmw);
          return nt;
        });
        return ns;
      });
      return nb;
    });
    return true;
  }

  function removeStamp(flag) {
    setMyStamps(prev => {
      const next = prev.filter(f => f !== flag);
      const { balance: b, spent: sp, transactions: txs, myMonuments: mm, lastPayoutTs: lp, totalStampWins: tsw, totalMonumentWins: tmw } = stateRef.current;
      persist(b, sp, txs, next, mm, lp, tsw, tmw);
      return next;
    });
  }

  function removeMonument(id) {
    setMyMonuments(prev => {
      const next = prev.filter(m => m !== id);
      const { balance: b, spent: sp, transactions: txs, myStamps: ms, lastPayoutTs: lp, totalStampWins: tsw, totalMonumentWins: tmw } = stateRef.current;
      persist(b, sp, txs, ms, next, lp, tsw, tmw);
      return next;
    });
  }

  function claimStamp(countryFlag, username) {
    const now = Date.now();
    const newStamp = { holder: username, coinsEarned: 0, since: now, lastActivity: now };
    setStamps(prev => {
      const next = { ...prev, [countryFlag]: newStamp };
      AsyncStorage.setItem(STAMPS_KEY, JSON.stringify(next));
      return next;
    });
    setMyStamps(prev => {
      const isNew = !prev.includes(countryFlag);
      const next  = isNew ? [...prev, countryFlag] : prev;
      const { balance: b, spent: sp, transactions: txs, myMonuments: mm, lastPayoutTs: lp, totalMonumentWins: tmw } = stateRef.current;
      if (isNew) {
        // Increment all-time win counter
        setTotalStampWins(w => {
          const nw = w + 1;
          persist(b, sp, txs, next, mm, lp, nw, tmw);
          return nw;
        });
      } else {
        const { totalStampWins: tsw } = stateRef.current;
        persist(b, sp, txs, next, mm, lp, tsw, tmw);
      }
      return next;
    });
  }

  function claimMonument(monumentId) {
    setMyMonuments(prev => {
      const isNew = !prev.includes(monumentId);
      const next  = isNew ? [...prev, monumentId] : prev;
      const { balance: b, spent: sp, transactions: txs, myStamps: ms, lastPayoutTs: lp, totalStampWins: tsw } = stateRef.current;
      if (isNew) {
        setTotalMonumentWins(w => {
          const nw = w + 1;
          persist(b, sp, txs, ms, next, lp, tsw, nw);
          return nw;
        });
      } else {
        const { totalMonumentWins: tmw } = stateRef.current;
        persist(b, sp, txs, ms, next, lp, tsw, tmw);
      }
      return next;
    });
  }

  // Subscribe to challenge events emitted by ChallengeContext._resolve()
  useEffect(() => {
    const wonSub = DeviceEventEmitter.addListener('wb_stamp_won', ({ monumentId, username }) => {
      if (monumentId?.startsWith('stamp_')) {
        claimStamp(monumentId.replace('stamp_', ''), username);
      } else if (monumentId) {
        claimMonument(monumentId);
      }
    });
    const lostSub = DeviceEventEmitter.addListener('wb_stamp_lost', ({ monumentId }) => {
      if (monumentId?.startsWith('stamp_')) {
        removeStamp(monumentId.replace('stamp_', ''));
      } else if (monumentId) {
        removeMonument(monumentId);
      }
    });
    return () => { wonSub.remove(); lostSub.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function recordPayout() {
    const now = Date.now();
    setLastPayoutTs(now);
    const { balance: b, spent: sp, transactions: txs, myStamps: ms, myMonuments: mm, totalStampWins: tsw, totalMonumentWins: tmw } = stateRef.current;
    persist(b, sp, txs, ms, mm, now, tsw, tmw);
  }

  function applyStampRoyalty(giftCoins, recipientCountry) {
    const stamp = stamps[recipientCountry];
    if (!stamp || !myStamps.includes(recipientCountry)) return;
    if (isStampDropped(stamp)) return; // holder went inactive — no royalties
    const royalty = Math.floor(giftCoins * 0.03);
    if (royalty > 0) {
      // Refresh lastActivity so the stamp stays alive while holder earns
      setStamps(prev => {
        const next = { ...prev, [recipientCountry]: { ...prev[recipientCountry], lastActivity: Date.now() } };
        AsyncStorage.setItem(STAMPS_KEY, JSON.stringify(next));
        return next;
      });
      earnCoins(royalty, 'stamp_royalty', { country: recipientCountry });
    }
  }

  const totalEarned = transactions
    .filter(t => t.type === 'earn')
    .reduce((s, t) => s + t.amount, 0);

  // Monthly earnings (current calendar month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthlyEarned = transactions
    .filter(t => t.type === 'earn' && t.ts >= monthStart)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <WalletContext.Provider value={{
      balance, spent, transactions, stamps, monuments, myStamps, myMonuments,
      totalStampWins, totalMonumentWins,
      totalEarned, monthlyEarned, lastPayoutTs,
      earnCoins, spendCoins, claimStamp, claimMonument, removeStamp, removeMonument, applyStampRoyalty, recordPayout,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
