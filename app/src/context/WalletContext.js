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

// ─── Country Stamps — 1-of-1 per country ─────────────────────────────────────
// Holder earns 3% passive royalty on all gifts sent to streamers from their country
export const DEMO_STAMPS = {
  '🇺🇸': { holder: 'DeShawn_ATL',   coinsEarned: 14200, since: Date.now() - 86400000 * 12 },
  '🇯🇵': { holder: 'Yuki_Tokyo',    coinsEarned: 9800,  since: Date.now() - 86400000 * 5  },
  '🇧🇷': { holder: 'Lucas_SP',      coinsEarned: 7600,  since: Date.now() - 86400000 * 3  },
  '🇰🇷': { holder: 'JiMin_Seoul',   coinsEarned: 21000, since: Date.now() - 86400000 * 20 },
  '🇬🇧': { holder: 'Sarah_London',  coinsEarned: 5400,  since: Date.now() - 86400000 * 8  },
  '🇳🇬': { holder: 'Amara_Lagos',   coinsEarned: 8100,  since: Date.now() - 86400000 * 6  },
};

// ─── Bond Monuments — 1-of-1 per famous world location ───────────────────────
// 500 worldwide. Holder earns 2% of all gifts sent during any stream from that region.
// Can be claimed (if empty) or challenged via 7-day gifting contest.
export const BOND_MONUMENTS = [
  { id: 'eiffel',     name: 'Eiffel Tower',        icon: '🗼', country: '🇫🇷', location: 'Paris, France',        holder: 'Amélie_Paris',  coinsEarned: 12400 },
  { id: 'great_wall', name: 'Great Wall',           icon: '🧱', country: '🇨🇳', location: 'Beijing, China',       holder: null,            coinsEarned: 0     },
  { id: 'colosseum',  name: 'Colosseum',            icon: '🏛️', country: '🇮🇹', location: 'Rome, Italy',          holder: 'Marco_Roma',    coinsEarned: 8900  },
  { id: 'machu',      name: 'Machu Picchu',         icon: '🏔️', country: '🇵🇪', location: 'Cusco, Peru',          holder: null,            coinsEarned: 0     },
  { id: 'fuji',       name: 'Mount Fuji',           icon: '🗻', country: '🇯🇵', location: 'Shizuoka, Japan',      holder: 'Yuki_Tokyo',    coinsEarned: 15600 },
  { id: 'pyramids',   name: 'Great Pyramids',       icon: '🔺', country: '🇪🇬', location: 'Giza, Egypt',          holder: null,            coinsEarned: 0     },
  { id: 'liberty',    name: 'Statue of Liberty',    icon: '🗽', country: '🇺🇸', location: 'New York, USA',        holder: 'DeShawn_ATL',   coinsEarned: 9200  },
  { id: 'serengeti',  name: 'Serengeti Plains',     icon: '🦁', country: '🇹🇿', location: 'Tanzania',             holder: null,            coinsEarned: 0     },
  { id: 'angkor',     name: 'Angkor Wat',           icon: '🏯', country: '🇰🇭', location: 'Siem Reap, Cambodia',  holder: null,            coinsEarned: 0     },
  { id: 'taj',        name: 'Taj Mahal',            icon: '🕌', country: '🇮🇳', location: 'Agra, India',          holder: 'Priya_Mumbai',  coinsEarned: 7300  },
  { id: 'opera',      name: 'Sydney Opera House',   icon: '🎭', country: '🇦🇺', location: 'Sydney, Australia',    holder: null,            coinsEarned: 0     },
  { id: 'amazon',     name: 'Amazon River',         icon: '🌿', country: '🇧🇷', location: 'Amazon, Brazil',       holder: 'Lucas_SP',      coinsEarned: 5100  },
  { id: 'aurora',     name: 'Northern Lights',      icon: '🌌', country: '🇮🇸', location: 'Iceland',              holder: null,            coinsEarned: 0     },
  { id: 'petra',      name: 'Petra',                icon: '🏜️', country: '🇯🇴', location: 'Ma\'an, Jordan',       holder: null,            coinsEarned: 0     },
  { id: 'acropolis',  name: 'Acropolis',            icon: '🏺', country: '🇬🇷', location: 'Athens, Greece',       holder: null,            coinsEarned: 0     },
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

// ─── Context ──────────────────────────────────────────────────────────────────
const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [balance,      setBalance]      = useState(0);
  const [spent,        setSpent]        = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stamps,       setStamps]       = useState({});
  const [myStamps,     setMyStamps]     = useState([]);
  const [myMonuments,  setMyMonuments]  = useState([]);

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
      }
      const saved = stampsRaw ? JSON.parse(stampsRaw) : {};
      setStamps({ ...DEMO_STAMPS, ...saved });
    });
  }, []);

  const persist = useCallback((bal, sp, txs, ms, mm) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      balance: bal, spent: sp, transactions: txs, myStamps: ms, myMonuments: mm,
    }));
  }, []);

  // Mirror all wallet state into a ref so functional updaters always read
  // the latest values — prevents stale closures in earnCoins/claimStamp/claimMonument.
  const stateRef = useRef({ balance, spent, transactions, myStamps, myMonuments });
  useEffect(() => {
    stateRef.current = { balance, spent, transactions, myStamps, myMonuments };
  }, [balance, spent, transactions, myStamps, myMonuments]);

  function earnCoins(amount, source, meta = {}) {
    const tx = { id: Date.now(), type: 'earn', amount, source, ...meta, ts: Date.now() };
    setBalance(b => {
      const nb = b + amount;
      const { spent: sp, myStamps: ms, myMonuments: mm } = stateRef.current;
      setTransactions(prev => {
        const nt = [tx, ...prev].slice(0, 200);
        persist(nb, sp, nt, ms, mm);
        return nt;
      });
      return nb;
    });
  }

  function spendCoins(amount, source, meta = {}) {
    const tx = { id: Date.now(), type: 'spend', amount, source, ...meta, ts: Date.now() };
    setBalance(b => {
      const nb = Math.max(0, b - amount);
      const { myStamps: ms, myMonuments: mm } = stateRef.current;
      setSpent(s => {
        const ns = s + amount;
        setTransactions(prev => {
          const nt = [tx, ...prev].slice(0, 200);
          persist(nb, ns, nt, ms, mm);
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
      const { balance: b, spent: sp, transactions: txs, myMonuments: mm } = stateRef.current;
      persist(b, sp, txs, next, mm);
      return next;
    });
  }

  function claimMonument(monumentId) {
    setMyMonuments(prev => {
      const next = prev.includes(monumentId) ? prev : [...prev, monumentId];
      const { balance: b, spent: sp, transactions: txs, myStamps: ms } = stateRef.current;
      persist(b, sp, txs, ms, next);
      return next;
    });
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
      totalEarned, monthlyEarned,
      earnCoins, spendCoins, claimStamp, claimMonument, applyStampRoyalty,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
