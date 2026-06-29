import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const _D = Date.now();
export const DEMO_STAMPS = {
  // ── Active holders ──────────────────────────────────────────────────────────
  '🇺🇸': { holder: 'DeShawn_ATL',   coinsEarned: 14200, since: _D - 86400000 * 12, lastActivity: _D - 86400000 * 12 },
  '🇧🇷': { holder: 'Lucas_SP',      coinsEarned: 9800,  since: _D - 86400000 * 3,  lastActivity: _D - 86400000 * 3  },
  '🇰🇷': { holder: 'JiMin_Seoul',   coinsEarned: 21000, since: _D - 86400000 * 20, lastActivity: _D - 86400000 * 20 },
  '🇯🇵': { holder: 'Yuki_Tokyo',    coinsEarned: 15600, since: _D - 86400000 * 5,  lastActivity: _D - 86400000 * 5  },
  '🇬🇧': { holder: 'Sarah_London',  coinsEarned: 5400,  since: _D - 86400000 * 8,  lastActivity: _D - 86400000 * 8  },
  '🇲🇽': { holder: 'Carlos_CDMX',   coinsEarned: 6300,  since: _D - 86400000 * 14, lastActivity: _D - 86400000 * 14 },
  '🇦🇺': { holder: 'Kai_Sydney',    coinsEarned: 4700,  since: _D - 86400000 * 9,  lastActivity: _D - 86400000 * 9  },
  '🇮🇩': { holder: 'Budi_Jakarta',  coinsEarned: 5100,  since: _D - 86400000 * 7,  lastActivity: _D - 86400000 * 7  },
  '🇹🇷': { holder: 'Zeynep_IST',    coinsEarned: 3900,  since: _D - 86400000 * 11, lastActivity: _D - 86400000 * 11 },
  // ── Dropped — holder went inactive (> 30 days no activity) ─────────────────
  '🇩🇪': { holder: 'Hans_Berlin',   coinsEarned: 2800,  since: _D - 86400000 * 38, lastActivity: _D - 86400000 * 35 },
  '🇦🇷': { holder: 'Mateo_BA',      coinsEarned: 1900,  since: _D - 86400000 * 45, lastActivity: _D - 86400000 * 33 },
  '🇷🇺': { holder: 'Viktor_MSK',    coinsEarned: 3200,  since: _D - 86400000 * 40, lastActivity: _D - 86400000 * 31 },
  // ── Unclaimed ───────────────────────────────────────────────────────────────
  '🇫🇷': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇪🇸': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇨🇦': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇮🇳': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇵🇭': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇸🇦': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇵🇱': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇹🇭': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇸🇪': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇳🇱': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇵🇹': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
  '🇨🇴': { holder: null, coinsEarned: 0, since: null, lastActivity: null },
};

// ─── Bond Monuments — 1-of-1 per famous world location ───────────────────────
// Holder earns 2% of all gifts sent during any stream from that region.
// Can be claimed (if empty) or challenged via 7-day gifting contest.
export const BOND_MONUMENTS = [
  // ── United States ──────────────────────────────────────────────────────────
  { id: 'liberty',     name: 'Statue of Liberty',    icon: '🗽', country: '🇺🇸', location: 'New York, USA',              holder: 'DeShawn_ATL',  coinsEarned: 9200  },
  { id: 'grand_canyon',name: 'Grand Canyon',          icon: '🏜️', country: '🇺🇸', location: 'Arizona, USA',               holder: null,           coinsEarned: 0     },
  // ── Brazil ─────────────────────────────────────────────────────────────────
  { id: 'christ',      name: 'Christ the Redeemer',   icon: '⛪', country: '🇧🇷', location: 'Rio de Janeiro, Brazil',     holder: null,           coinsEarned: 0     },
  { id: 'amazon',      name: 'Amazon River',          icon: '🌿', country: '🇧🇷', location: 'Amazon, Brazil',             holder: 'Lucas_SP',     coinsEarned: 5100  },
  // ── South Korea ────────────────────────────────────────────────────────────
  { id: 'gyeongbok',   name: 'Gyeongbokgung Palace',  icon: '🏯', country: '🇰🇷', location: 'Seoul, South Korea',         holder: 'JiMin_Seoul',  coinsEarned: 11400 },
  // ── Japan ──────────────────────────────────────────────────────────────────
  { id: 'fuji',        name: 'Mount Fuji',            icon: '🗻', country: '🇯🇵', location: 'Shizuoka, Japan',            holder: 'Yuki_Tokyo',   coinsEarned: 15600 },
  { id: 'fushimi',     name: 'Fushimi Inari Shrine',  icon: '⛩️', country: '🇯🇵', location: 'Kyoto, Japan',               holder: null,           coinsEarned: 0     },
  // ── Germany ────────────────────────────────────────────────────────────────
  { id: 'gate',        name: 'Brandenburg Gate',      icon: '🏛️', country: '🇩🇪', location: 'Berlin, Germany',            holder: null,           coinsEarned: 0     },
  // ── United Kingdom ─────────────────────────────────────────────────────────
  { id: 'bigben',      name: 'Big Ben',               icon: '🕰️', country: '🇬🇧', location: 'London, UK',                 holder: 'Sarah_London', coinsEarned: 7800  },
  // ── France ─────────────────────────────────────────────────────────────────
  { id: 'eiffel',      name: 'Eiffel Tower',          icon: '🗼', country: '🇫🇷', location: 'Paris, France',              holder: 'Amélie_Paris', coinsEarned: 12400 },
  // ── Spain ──────────────────────────────────────────────────────────────────
  { id: 'sagrada',     name: 'Sagrada Família',       icon: '🕍', country: '🇪🇸', location: 'Barcelona, Spain',           holder: null,           coinsEarned: 0     },
  // ── Russia ─────────────────────────────────────────────────────────────────
  { id: 'red_square',  name: 'Red Square',            icon: '🏰', country: '🇷🇺', location: 'Moscow, Russia',             holder: null,           coinsEarned: 0     },
  // ── Canada ─────────────────────────────────────────────────────────────────
  { id: 'niagara',     name: 'Niagara Falls',         icon: '🌊', country: '🇨🇦', location: 'Ontario, Canada',            holder: null,           coinsEarned: 0     },
  // ── Mexico ─────────────────────────────────────────────────────────────────
  { id: 'chichen',     name: 'Chichen Itza',          icon: '🗿', country: '🇲🇽', location: 'Yucatán, Mexico',            holder: 'Carlos_CDMX',  coinsEarned: 4400  },
  // ── India ──────────────────────────────────────────────────────────────────
  { id: 'taj',         name: 'Taj Mahal',             icon: '🕌', country: '🇮🇳', location: 'Agra, India',                holder: 'Priya_Mumbai', coinsEarned: 7300  },
  // ── Indonesia ──────────────────────────────────────────────────────────────
  { id: 'borobudur',   name: 'Borobudur',             icon: '☸️', country: '🇮🇩', location: 'Java, Indonesia',            holder: null,           coinsEarned: 0     },
  // ── Turkey ─────────────────────────────────────────────────────────────────
  { id: 'hagia',       name: 'Hagia Sophia',          icon: '🌙', country: '🇹🇷', location: 'Istanbul, Turkey',           holder: null,           coinsEarned: 0     },
  // ── Australia ──────────────────────────────────────────────────────────────
  { id: 'opera',       name: 'Sydney Opera House',    icon: '🎭', country: '🇦🇺', location: 'Sydney, Australia',          holder: null,           coinsEarned: 0     },
  // ── Italy ──────────────────────────────────────────────────────────────────
  { id: 'colosseum',   name: 'Colosseum',             icon: '🏟️', country: '🇮🇹', location: 'Rome, Italy',                holder: 'Marco_Roma',   coinsEarned: 8900  },
  // ── China ──────────────────────────────────────────────────────────────────
  { id: 'great_wall',  name: 'Great Wall',            icon: '🧱', country: '🇨🇳', location: 'Beijing, China',             holder: null,           coinsEarned: 0     },
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

export const CREATOR_BADGE = {
  1: { label: 'Bond Creator of the Month', color: '#ffd700', icon: '🥇' },
  2: { label: 'Bond Elite Creator',         color: '#c0c0c0', icon: '🥈' },
  3: { label: 'Rising Bond Star',           color: '#cd7f32', icon: '🥉' },
};

// Demo data: coins × payout_rate / COINS_PER_DOLLAR = USD
export const DEMO_TOP_CREATORS = [
  {
    rank: 1, username: 'JiMin_Seoul',  country: '🇰🇷',
    coinsEarned: 87400, streams: 23, avgViewers: 1240,
    payoutRate: 0.85, badge: CREATOR_BADGE[1],
    payoutUSD: +(87400 * 0.85 / 100).toFixed(2),
  },
  {
    rank: 2, username: 'Amara_Lagos',  country: '🇳🇬',
    coinsEarned: 62100, streams: 18, avgViewers: 890,
    payoutRate: 0.80, badge: CREATOR_BADGE[2],
    payoutUSD: +(62100 * 0.80 / 100).toFixed(2),
  },
  {
    rank: 3, username: 'DeShawn_ATL',  country: '🇺🇸',
    coinsEarned: 45800, streams: 15, avgViewers: 670,
    payoutRate: 0.75, badge: CREATOR_BADGE[3],
    payoutUSD: +(45800 * 0.75 / 100).toFixed(2),
  },
];

// ── DEMO MODE — must match flag in App.js ─────────────────────────────────────
const DEMO_MODE = false;
// ─────────────────────────────────────────────────────────────────────────────

// ─── Context ──────────────────────────────────────────────────────────────────
const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [balance,      setBalance]      = useState(0);
  const [spent,        setSpent]        = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stamps,        setStamps]        = useState({});
  const [myStamps,      setMyStamps]      = useState([]);
  const [myMonuments,   setMyMonuments]   = useState([]);
  const [lastPayoutTs,  setLastPayoutTs]  = useState(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(STAMPS_KEY),
    ]).then(([walletRaw, stampsRaw]) => {
      if (walletRaw) {
        const w = JSON.parse(walletRaw);
        setBalance(w.balance ?? 0);
        setSpent(w.spent ?? 0);
        setTransactions(w.transactions ?? []);
        setMyStamps(w.myStamps ?? []);
        setMyMonuments(w.myMonuments ?? []);
        setLastPayoutTs(w.lastPayoutTs ?? null);
      } else if (DEMO_MODE) {
        // Seed demo wallet so all screens have something to show
        setBalance(5000);
        setSpent(1200);
        setMyStamps(['🇺🇸', '🇯🇵']);
        setMyMonuments(['fuji']);
        setTransactions([
          { id: 1, type: 'earn',  amount: 3000, source: 'stream_gift',   ts: Date.now() - 86400000 * 2 },
          { id: 2, type: 'spend', amount: 500,  source: 'gift_sent',     ts: Date.now() - 86400000 },
          { id: 3, type: 'earn',  amount: 2000, source: 'stamp_royalty', ts: Date.now() - 3600000 },
          { id: 4, type: 'spend', amount: 700,  source: 'gift_sent',     ts: Date.now() - 1800000 },
        ]);
      }
      const saved = stampsRaw ? JSON.parse(stampsRaw) : {};
      setStamps({ ...DEMO_STAMPS, ...saved });
    });
  }, []);

  const persist = useCallback((bal, sp, txs, ms, mm, lp) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      balance: bal, spent: sp, transactions: txs,
      myStamps: ms, myMonuments: mm, lastPayoutTs: lp,
    }));
  }, []);

  // Mirror all wallet state into a ref so functional updaters always read
  // the latest values — prevents stale closures in earnCoins/claimStamp/claimMonument.
  const stateRef = useRef({ balance, spent, transactions, myStamps, myMonuments, lastPayoutTs });
  useEffect(() => {
    stateRef.current = { balance, spent, transactions, myStamps, myMonuments, lastPayoutTs };
  }, [balance, spent, transactions, myStamps, myMonuments, lastPayoutTs]);

  function earnCoins(amount, source, meta = {}) {
    const tx = { id: Date.now(), type: 'earn', amount, source, ...meta, ts: Date.now() };
    setBalance(b => {
      const nb = b + amount;
      const { spent: sp, myStamps: ms, myMonuments: mm, lastPayoutTs: lp } = stateRef.current;
      setTransactions(prev => {
        const nt = [tx, ...prev].slice(0, 200);
        persist(nb, sp, nt, ms, mm, lp);
        return nt;
      });
      return nb;
    });
  }

  function spendCoins(amount, source, meta = {}) {
    const currentBalance = stateRef.current.balance;
    if (currentBalance < amount) return false; // not enough coins — caller handles this

    const tx = { id: Date.now(), type: 'spend', amount, source, ...meta, ts: Date.now() };
    setBalance(b => {
      if (b < amount) return b; // double-check inside updater (handles race conditions)
      const nb = b - amount;
      const { myStamps: ms, myMonuments: mm, lastPayoutTs: lp } = stateRef.current;
      setSpent(s => {
        const ns = s + amount;
        setTransactions(prev => {
          const nt = [tx, ...prev].slice(0, 200);
          persist(nb, ns, nt, ms, mm, lp);
          return nt;
        });
        return ns;
      });
      return nb;
    });
    return true;
  }

  function claimStamp(countryFlag, username) {
    const newStamp = { holder: username, coinsEarned: 0, since: Date.now() };
    setStamps(prev => {
      const next = { ...prev, [countryFlag]: newStamp };
      AsyncStorage.setItem(STAMPS_KEY, JSON.stringify(next));
      return next;
    });
    setMyStamps(prev => {
      const next = prev.includes(countryFlag) ? prev : [...prev, countryFlag];
      const { balance: b, spent: sp, transactions: txs, myMonuments: mm, lastPayoutTs: lp } = stateRef.current;
      persist(b, sp, txs, next, mm, lp);
      return next;
    });
  }

  function claimMonument(monumentId) {
    setMyMonuments(prev => {
      const next = prev.includes(monumentId) ? prev : [...prev, monumentId];
      const { balance: b, spent: sp, transactions: txs, myStamps: ms, lastPayoutTs: lp } = stateRef.current;
      persist(b, sp, txs, ms, next, lp);
      return next;
    });
  }

  function recordPayout() {
    const now = Date.now();
    setLastPayoutTs(now);
    const { balance: b, spent: sp, transactions: txs, myStamps: ms, myMonuments: mm } = stateRef.current;
    persist(b, sp, txs, ms, mm, now);
  }

  function applyStampRoyalty(giftCoins, recipientCountry) {
    const stamp = stamps[recipientCountry];
    if (!stamp || !myStamps.includes(recipientCountry)) return;
    const royalty = Math.floor(giftCoins * 0.03);
    if (royalty > 0) earnCoins(royalty, 'stamp_royalty', { country: recipientCountry });
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
      balance, spent, transactions, stamps, myStamps, myMonuments,
      totalEarned, monthlyEarned, lastPayoutTs,
      earnCoins, spendCoins, claimStamp, claimMonument, applyStampRoyalty, recordPayout,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
