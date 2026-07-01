import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY        = 'worldbond_streak_v1';
const SERVER_URL = 'https://worldbond-server-production.up.railway.app';

// ─── Streak tiers — evolves as the streak grows ───────────────────────────────
// Each tier is a "1-of-1" footprint milestone unique to the user's journey.
export const STREAK_TIERS = [
  {
    id:      'spark',
    name:    'Bond Spark',
    grade:   'BRONZE',
    minDays: 1,
    color:   '#fb923c',
    grad:    ['#431407', '#7c2d12'],
    glowColor: '#fb923c',
  },
  {
    id:      'flame',
    name:    'Bond Flame',
    grade:   'SILVER',
    minDays: 7,
    color:   '#fbbf24',
    grad:    ['#451a03', '#92400e'],
    glowColor: '#fbbf24',
  },
  {
    id:      'blaze',
    name:    'Bond Blaze',
    grade:   'GOLD',
    minDays: 30,
    color:   '#f87171',
    grad:    ['#450a0a', '#991b1b'],
    glowColor: '#ef4444',
  },
  {
    id:      'torch',
    name:    'Bond Torch',
    grade:   'PLATINUM',
    minDays: 90,
    color:   '#c084fc',
    grad:    ['#2e1065', '#4c1d95'],
    glowColor: '#a855f7',
  },
  {
    id:      'inferno',
    name:    'Bond Inferno',
    grade:   'DIAMOND',
    minDays: 180,
    color:   '#818cf8',
    grad:    ['#0f0a2e', '#1e1b4b'],
    glowColor: '#FF0080',
  },
  {
    id:      'eternal',
    name:    'Bond Eternal',
    grade:   '1 OF 1',
    minDays: 365,
    color:   '#fde68a',
    grad:    ['#1c0a00', '#451a03'],
    glowColor: '#fbbf24',
  },
];

export function getStreakTier(days) {
  if (days < 1) return null;
  let tier = STREAK_TIERS[0];
  for (const t of STREAK_TIERS) {
    if (days >= t.minDays) tier = t;
  }
  return tier;
}

// Milestone nodes shown on the badge progression strip
export function getStreakMilestones(days) {
  return [
    {
      label: 'DAYS',
      threshold: 1,
      display: days >= 1 ? `${days}` : '—',
      unit: 'D',
      done: days >= 1,
    },
    {
      label: 'WEEKS',
      threshold: 7,
      display: days >= 7 ? `${Math.floor(days / 7)}` : '—',
      unit: 'W',
      done: days >= 7,
    },
    {
      label: 'MONTHS',
      threshold: 30,
      display: days >= 30 ? `${Math.floor(days / 30)}` : '—',
      unit: 'M',
      done: days >= 30,
    },
    {
      label: 'YEARS',
      threshold: 365,
      display: days >= 365 ? `${Math.floor(days / 365)}` : '—',
      unit: 'Y',
      done: days >= 365,
    },
  ];
}

// Primary display value — shows the highest meaningful unit
export function formatStreakPrimary(days) {
  if (days >= 365) {
    const yrs = (days / 365);
    return { value: yrs >= 10 ? Math.floor(yrs).toString() : yrs.toFixed(1).replace('.0', ''), unit: days >= 730 ? 'YRS' : 'YR' };
  }
  if (days >= 30) return { value: Math.floor(days / 30).toString(), unit: Math.floor(days / 30) > 1 ? 'MOS' : 'MO' };
  if (days >= 7)  return { value: Math.floor(days / 7).toString(),  unit: Math.floor(days / 7) > 1  ? 'WKS' : 'WK' };
  return { value: days.toString(), unit: days === 1 ? 'DAY' : 'DAYS' };
}

const SHIELD_KEY = 'worldbond_streak_shield_v1';
const BP_KEY     = 'worldbond_bond_pass';

// ─── Context ──────────────────────────────────────────────────────────────────
const StreakContext = createContext(null);

export function StreakProvider({ children }) {
  const [streak,         setStreak]         = useState(0);
  const [longest,        setLongest]        = useState(0);
  const [lastDate,       setLastDate]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [shieldAvailable, setShieldAvailable] = useState(false);

  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function monthStr() { return new Date().toISOString().slice(0, 7); }

  async function save(data) {
    try { await AsyncStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }

  async function loadShieldState() {
    const bpRaw     = await AsyncStorage.getItem(BP_KEY);
    const hasBP     = bpRaw === 'true';
    if (!hasBP) { setShieldAvailable(false); return false; }
    const raw  = await AsyncStorage.getItem(SHIELD_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const avail = data.monthUsed !== monthStr();
    setShieldAvailable(avail);
    return avail;
  }

  async function markShieldUsed() {
    await AsyncStorage.setItem(SHIELD_KEY, JSON.stringify({ monthUsed: monthStr() }));
    setShieldAvailable(false);
  }

  useEffect(() => {
    async function init() {
      await loadShieldState();

      // Try server-side validated streak first (tamper-proof)
      try {
        const authRaw = await AsyncStorage.getItem('worldbond_auth');
        const auth    = authRaw ? JSON.parse(authRaw) : null;
        if (auth?.token && auth?.userId) {
          const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` };

          // If exactly 1 day was missed and shield is available, apply it before checkin
          const localRaw  = await AsyncStorage.getItem(KEY);
          const localData = localRaw ? JSON.parse(localRaw) : {};
          const today     = todayStr();
          if (localData.lastDate) {
            const diff = Math.round((new Date(today) - new Date(localData.lastDate)) / 86400000);
            const bpRaw = await AsyncStorage.getItem(BP_KEY);
            const shieldRaw = await AsyncStorage.getItem(SHIELD_KEY);
            const shieldData = shieldRaw ? JSON.parse(shieldRaw) : {};
            const shieldAvail = bpRaw === 'true' && shieldData.monthUsed !== monthStr();
            if (diff === 2 && shieldAvail) {
              try {
                const sr = await fetch(`${SERVER_URL}/streak/use-shield`, {
                  method: 'POST', headers,
                  body: JSON.stringify({ userId: auth.userId }),
                });
                if (sr.ok) await markShieldUsed();
              } catch {}
            }
          }

          const res = await fetch(`${SERVER_URL}/streak/checkin`, {
            method: 'POST', headers,
            body: JSON.stringify({ userId: auth.userId }),
          });
          if (res.ok) {
            const { streak: s, longest: l } = await res.json();
            setStreak(s); setLongest(l); setLastDate(today); setLoading(false);
            await save({ streak: s, longest: l, lastDate: today });
            return;
          }
        }
      } catch {
        // Network offline — fall back to local
      }

      // Offline fallback
      const raw = await AsyncStorage.getItem(KEY);
      let data = {};
      try { if (raw) data = JSON.parse(raw); } catch {}
      const today = todayStr();
      const last  = data.lastDate;
      let newStreak  = data.streak  || 0;
      let newLongest = data.longest || 0;
      let newDate    = last;

      if (!last) {
        newStreak = 1; newLongest = 1; newDate = today;
      } else {
        const diff = Math.round((new Date(today) - new Date(last)) / 86400000);
        if (diff === 1) {
          newStreak  = (data.streak || 0) + 1;
          newLongest = Math.max(newStreak, data.longest || 0);
          newDate    = today;
        } else if (diff === 2) {
          const bpRaw = await AsyncStorage.getItem(BP_KEY);
          const shieldRaw = await AsyncStorage.getItem(SHIELD_KEY);
          const shieldData = shieldRaw ? JSON.parse(shieldRaw) : {};
          if (bpRaw === 'true' && shieldData.monthUsed !== monthStr()) {
            // Shield absorbs the missed day
            newStreak  = (data.streak || 0) + 1;
            newLongest = Math.max(newStreak, data.longest || 0);
            newDate    = today;
            await markShieldUsed();
          } else {
            newStreak = 1; newDate = today;
          }
        } else if (diff > 2) {
          newStreak = 1; newDate = today;
        }
      }

      const updated = { streak: newStreak, longest: newLongest, lastDate: newDate };
      await save(updated);
      setStreak(newStreak); setLongest(newLongest); setLastDate(newDate); setLoading(false);
    }

    init();
  }, []);

  const tier       = getStreakTier(streak);
  const milestones = getStreakMilestones(streak);
  const primary    = formatStreakPrimary(streak);

  return (
    <StreakContext.Provider value={{
      streak, longest, lastDate, tier,
      milestones, primary, loading,
      shieldAvailable,
    }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  return useContext(StreakContext);
}
