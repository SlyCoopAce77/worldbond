import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const SERVER_URL = 'https://worldbond-server-production.up.railway.app';

async function reportChallengeWin(winType, targetId) {
  try {
    const authRaw = await AsyncStorage.getItem('worldbond_auth');
    const auth    = authRaw ? JSON.parse(authRaw) : null;
    if (!auth?.token) return;
    await fetch(`${SERVER_URL}/challenge/record-win`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ winType, targetId }),
    });
  } catch {}
}

const KEY = 'wb_monument_challenges';

// ── Anti-spam daily limits (per user, per challenge, per day) ─────────────────
export const DAILY_LIMITS = {
  gifts:     500,  // max Bond Coins gifted toward region streams per day
  bonds:     3,    // max new bonds with region users counted per day
  liveHours: 2,    // max hours streaming from that region per day
};

// ── Points earned per unit of each contribution type ─────────────────────────
export const POINT_RATES = {
  gifts:     1,    // 1 pt per coin (hard-capped to prevent whale dominance)
  bonds:     150,  // 150 pts per unique region bond
  liveHours: 300,  // 300 pts per hour streaming from that region
  votes:     75,   // 75 pts per community vote (once per user per contest)
};

export const ENTRY_FEE       = 250;             // Bond Coins burned to initiate a challenge
export const FEATURED_FEE   = 125;             // 50% off for the featured stamp
export const CHALLENGE_MS   = 7  * 86400000;   // 7 days per challenge window
export const COOLDOWN_MS    = 30 * 86400000;   // 30-day cooldown after a challenge resolves
export const INACTIVE_DROP_MS = 30 * 86400000; // holder drops stamp after 30 days no activity

// Weekly featured stamp rotation — cycles every 7 days deterministically (no server needed).
// Only includes countries with active 18+ streaming communities (Tier 1 + Tier 2 global markets).
// Tier 1: highest streaming volume  |  Tier 2: strong and growing
export const STAMP_ROTATION = [
  // Tier 1 — most contested
  '🇺🇸','🇧🇷','🇰🇷','🇯🇵','🇩🇪','🇬🇧','🇫🇷','🇪🇸','🇷🇺','🇨🇦','🇲🇽',
  // Tier 2 — strong and growing
  '🇦🇷','🇵🇭','🇮🇳','🇮🇩','🇹🇷','🇦🇺','🇸🇦','🇵🇱','🇹🇭','🇸🇪','🇳🇱','🇵🇹','🇨🇴',
];

export function getFeaturedFlag() {
  const week = Math.floor(Date.now() / (7 * 86400000));
  return STAMP_ROTATION[week % STAMP_ROTATION.length];
}

export function getNextFeaturedFlag() {
  const week = Math.floor(Date.now() / (7 * 86400000)) + 1;
  return STAMP_ROTATION[week % STAMP_ROTATION.length];
}

// Returns true when holder exists but hasn't been active for INACTIVE_DROP_MS
export function isStampDropped(stamp) {
  if (!stamp?.holder) return false;
  const lastActive = stamp.lastActivity ?? stamp.since ?? 0;
  return Date.now() - lastActive > INACTIVE_DROP_MS;
}

const ChallengeContext = createContext(null);

export function ChallengeProvider({ children }) {
  const [challenges, setChallenges] = useState({});
  const stateRef = useRef({});

  useEffect(() => { stateRef.current = challenges; }, [challenges]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      let base = {};
      if (raw) {
        try { base = JSON.parse(raw); } catch {}
      }
      // Auto-resolve any expired active challenges
      const now = Date.now();
      const patched = {};
      Object.values(base).forEach(ch => {
        patched[ch.id] = (ch.status === 'active' && ch.endsAt <= now)
          ? _resolve(ch)
          : ch;
      });
      setChallenges(patched);
    });
  }, []);

  function persist(next) {
    try { AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function _resolve(ch) {
    const cTotal = ch.scores.challenger.total;
    const hTotal = ch.scores.holder.total;
    const winner = cTotal > hTotal ? 'challenger' : 'holder';

    // Report win to server for Globe Trotter yearly tracking.
    // Also notify WalletContext if local user lost so the stamp falls off their passport.
    const winType        = ch.monumentId?.startsWith('stamp_') ? 'stamp' : 'monument';
    const targetId       = winType === 'stamp'
      ? ch.monumentId.replace('stamp_', '')
      : ch.monumentId;
    const winnerUsername = winner === 'challenger' ? ch.challengerUsername : ch.holderUsername;
    const loserUsername  = winner === 'challenger' ? ch.holderUsername     : ch.challengerUsername;
    AsyncStorage.getItem('worldbond_auth').then(raw => {
      const auth = raw ? JSON.parse(raw) : null;
      if (auth?.username === winnerUsername) {
        reportChallengeWin(winType, targetId);
      }
      if (auth?.username === loserUsername) {
        // Tell WalletContext to remove this stamp/monument immediately
        DeviceEventEmitter.emit('wb_stamp_lost', { monumentId: ch.monumentId });
      }
    }).catch(() => {});

    return {
      ...ch,
      status:        'resolved',
      winner,
      cooldownUntil: Date.now() + COOLDOWN_MS,
    };
  }

  function _todayKey(username) {
    return `${username}_${new Date().toISOString().slice(0, 10)}`;
  }

  function _getUsage(ch, username) {
    return ch.dailyUsage[_todayKey(username)] || { gifts: 0, bonds: 0, liveHours: 0, voted: false };
  }

  // ── Public: get active challenge for a monument ──────────────────────────
  function getActiveChallenge(monumentId) {
    return Object.values(stateRef.current).find(
      c => c.monumentId === monumentId && c.status === 'active'
    ) || null;
  }

  // ── Public: get cooldown expiry timestamp (null if none) ─────────────────
  function getCooldown(monumentId) {
    const last = Object.values(stateRef.current)
      .filter(c => c.monumentId === monumentId && c.status === 'resolved')
      .sort((a, b) => b.endsAt - a.endsAt)[0];
    return (last && last.cooldownUntil > Date.now()) ? last.cooldownUntil : null;
  }

  // ── Public: start a challenge (Pro only — caller must verify tier) ────────
  function initiateChallenge(monumentId, challengerUsername, holderUsername) {
    const current = stateRef.current;
    if (Object.values(current).some(c => c.monumentId === monumentId && c.status === 'active'))
      return { error: 'A challenge is already in progress for this monument.' };
    const cd = getCooldown(monumentId);
    if (cd) return { error: `On cooldown until ${new Date(cd).toLocaleDateString()}.` };

    const id = `ch_${Date.now()}`;
    const now = Date.now();
    const ch = {
      id, monumentId, challengerUsername, holderUsername,
      startedAt: now, endsAt: now + CHALLENGE_MS,
      status: 'active', cooldownUntil: null, winner: null,
      scores: {
        challenger: { gifts: 0, bonds: 0, liveHours: 0, votes: 0, total: 0 },
        holder:     { gifts: 0, bonds: 0, liveHours: 0, votes: 0, total: 0 },
      },
      dailyUsage: {},
    };
    const next = { ...current, [id]: ch };
    setChallenges(next);
    persist(next);
    return { success: true, challenge: ch };
  }

  // ── Public: contribute to one side (Pro only — caller must verify tier) ───
  // type: 'gifts' | 'bonds' | 'liveHours'
  // amount: numeric (coins, bond count, or fractional hours)
  function contribute(challengeId, side, type, amount, username) {
    const current = stateRef.current;
    const ch = current[challengeId];
    if (!ch || ch.status !== 'active') return { error: 'No active challenge.' };
    if (Date.now() > ch.endsAt)        return { error: 'Challenge has ended.' };

    const usageKey = _todayKey(username);
    const usage    = _getUsage(ch, username);
    const cap      = DAILY_LIMITS[type];
    const used     = usage[type] || 0;
    const remaining = cap - used;
    if (remaining <= 0) return { error: `Daily ${type} limit reached (${cap}/day).` };

    const actual = Math.min(amount, remaining);
    const pts    = actual * POINT_RATES[type];

    const updatedScore = {
      ...ch.scores[side],
      [type]: ch.scores[side][type] + pts,
      total:  ch.scores[side].total + pts,
    };
    const updatedUsage = { ...usage, [type]: used + actual };
    const updatedCh = {
      ...ch,
      scores:     { ...ch.scores, [side]: updatedScore },
      dailyUsage: { ...ch.dailyUsage, [usageKey]: updatedUsage },
    };

    const finalCh = Date.now() >= updatedCh.endsAt ? _resolve(updatedCh) : updatedCh;
    const next = { ...current, [challengeId]: finalCh };
    setChallenges(next);
    persist(next);
    return { success: true, pointsEarned: pts };
  }

  // ── Public: add a comment (Plus and Pro) ─────────────────────────────────
  function addComment(challengeId, username, text) {
    const current = stateRef.current;
    const ch = current[challengeId];
    if (!ch) return { error: 'Challenge not found.' };
    if (!text?.trim()) return { error: 'Comment cannot be empty.' };
    const comment = { id: `c_${Date.now()}`, username, text: text.trim(), ts: Date.now() };
    const updatedCh = { ...ch, comments: [...(ch.comments || []), comment] };
    const next = { ...current, [challengeId]: updatedCh };
    setChallenges(next);
    persist(next);
    return { success: true };
  }

  // ── Public: cast a community vote (once per user per challenge) ───────────
  function vote(challengeId, side, username) {
    const current = stateRef.current;
    const ch = current[challengeId];
    if (!ch || ch.status !== 'active') return { error: 'No active challenge.' };

    const usageKey = _todayKey(username);
    const usage    = _getUsage(ch, username);
    if (usage.voted) return { error: 'You already voted in this challenge.' };

    const pts = POINT_RATES.votes;
    const updatedScore = {
      ...ch.scores[side],
      votes: ch.scores[side].votes + pts,
      total: ch.scores[side].total + pts,
    };
    const updatedUsage = { ...usage, voted: true };
    const updatedCh = {
      ...ch,
      scores:     { ...ch.scores, [side]: updatedScore },
      dailyUsage: { ...ch.dailyUsage, [usageKey]: updatedUsage },
    };
    const next = { ...current, [challengeId]: updatedCh };
    setChallenges(next);
    persist(next);
    return { success: true };
  }

  // ── Stamp wrappers (use 'stamp_🇺🇸' prefix to avoid id collision) ──────────
  const getActiveStampChallenge = (flag) =>
    Object.values(stateRef.current).find(
      c => c.monumentId === `stamp_${flag}` && c.status === 'active'
    ) || null;

  const getStampCooldown = (flag) => getCooldown(`stamp_${flag}`);

  const initiateStampChallenge = (flag, challengerUsername, holderUsername) =>
    initiateChallenge(`stamp_${flag}`, challengerUsername, holderUsername);

  const addStampComment = (flag, username, text) => {
    const ch = getActiveStampChallenge(flag);
    if (!ch) return { error: 'No active challenge.' };
    return addComment(ch.id, username, text);
  };

  const contributeStamp = (flag, side, type, amount, username) => {
    const ch = getActiveStampChallenge(flag);
    if (!ch) return { error: 'No active challenge.' };
    return contribute(ch.id, side, type, amount, username);
  };

  const voteStamp = (flag, side, username) => {
    const ch = getActiveStampChallenge(flag);
    if (!ch) return { error: 'No active challenge.' };
    return vote(ch.id, side, username);
  };

  return (
    <ChallengeContext.Provider value={{
      challenges,
      // Monument challenge
      getActiveChallenge,
      getCooldown,
      initiateChallenge,
      contribute,
      addComment,
      vote,
      // Stamp challenge
      getActiveStampChallenge,
      getStampCooldown,
      initiateStampChallenge,
      contributeStamp,
      addStampComment,
      voteStamp,
    }}>
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallenge() {
  const ctx = useContext(ChallengeContext);
  if (!ctx) throw new Error('useChallenge must be inside ChallengeProvider');
  return ctx;
}
