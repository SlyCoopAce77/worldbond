import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'worldbond_streak_v1';

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

// ─── Context ──────────────────────────────────────────────────────────────────
const StreakContext = createContext(null);

export function StreakProvider({ children }) {
  const [streak,   setStreak]   = useState(0);
  const [longest,  setLongest]  = useState(0);
  const [lastDate, setLastDate] = useState(null); // 'YYYY-MM-DD'
  const [loading,  setLoading]  = useState(true);

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  async function save(data) {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
  }

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      let data = {};
      try { if (raw) data = JSON.parse(raw); } catch {}
      const today = todayStr();
      const last  = data.lastDate;

      let newStreak  = data.streak  || 0;
      let newLongest = data.longest || 0;
      let newDate    = last;

      if (!last) {
        // First checkin
        newStreak = 1;
        newLongest = 1;
        newDate = today;
      } else {
        const diff = Math.round((new Date(today) - new Date(last)) / 86400000);
        if (diff === 0) {
          // Already checked in today — no change
        } else if (diff === 1) {
          // Perfect streak — increment
          newStreak = (data.streak || 0) + 1;
          newLongest = Math.max(newStreak, data.longest || 0);
          newDate = today;
        } else {
          // Missed a day — reset
          newStreak = 1;
          newDate = today;
        }
      }

      const updated = { streak: newStreak, longest: newLongest, lastDate: newDate };
      save(updated);
      setStreak(newStreak);
      setLongest(newLongest);
      setLastDate(newDate);
      setLoading(false);
    });
  }, []);

  const tier       = getStreakTier(streak);
  const milestones = getStreakMilestones(streak);
  const primary    = formatStreakPrimary(streak);

  return (
    <StreakContext.Provider value={{
      streak, longest, lastDate, tier,
      milestones, primary, loading,
    }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  return useContext(StreakContext);
}
