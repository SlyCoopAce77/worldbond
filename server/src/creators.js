const { query: db, pool } = require('./database/db');

// Must match PAYOUT_RATES in app/src/context/WalletContext.js
const PAYOUT_RATES = {
  base:      0.70,
  bond_pass: 0.75,
  monthly_1: 0.85,
  monthly_2: 0.80,
  monthly_3: 0.75,
};

const CREATOR_BADGE = {
  1: { label: 'Bond Creator of the Month', color: '#ffd700', icon: '🥇' },
  2: { label: 'Bond Elite Creator',         color: '#c0c0c0', icon: '🥈' },
  3: { label: 'Rising Bond Star',           color: '#cd7f32', icon: '🥉' },
};

function yearMonthOf(date) {
  return date.toISOString().slice(0, 7); // 'YYYY-MM'
}
function currentYearMonth() { return yearMonthOf(new Date()); }
function previousYearMonth() {
  const d = new Date();
  d.setUTCDate(1);            // avoid day-count rollover issues (e.g. Mar 31 -> Mar 3)
  d.setUTCMonth(d.getUTCMonth() - 1);
  return yearMonthOf(d);
}

// Atomically moves real coins from sender to recipient and writes a ledger
// row. Returns { ok: true } or { ok: false, reason }. Never trusts client
// input for the coin amount — callers must resolve it from GIFT_CATALOG first.
async function transferGiftCoins({ senderId, recipientId, coins, giftId, streamSessionId }) {
  if (!senderId || !recipientId || senderId === recipientId) {
    return { ok: false, reason: 'invalid_parties' };
  }
  if (!Number.isInteger(coins) || coins <= 0) {
    return { ok: false, reason: 'invalid_amount' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const debit = await client.query(
      `UPDATE profiles SET coin_balance = coin_balance - $1
       WHERE user_id = $2 AND coin_balance >= $1
       RETURNING coin_balance`,
      [coins, senderId]
    );
    if (!debit.rows.length) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'insufficient_balance' };
    }

    await client.query(
      `UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + $1 WHERE user_id = $2`,
      [coins, recipientId]
    );

    await client.query(
      `INSERT INTO gift_earnings (recipient_user_id, sender_user_id, stream_session_id, gift_id, coins)
       VALUES ($1, $2, $3, $4, $5)`,
      [recipientId, senderId, streamSessionId || null, giftId, coins]
    );

    await client.query('COMMIT');
    return { ok: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Creators] gift transfer error:', err.message);
    return { ok: false, reason: 'server_error' };
  } finally {
    client.release();
  }
}

// Live (unlocked) leaderboard for the current, still-in-progress month —
// display only, never used to set a payout rate.
async function getLiveMonthlyLeaderboard(limit = 3) {
  const { rows } = await db(
    `SELECT p.user_id, p.display_name AS username, p.country, p.photo_url,
            SUM(g.coins)::INTEGER AS coins_earned,
            COUNT(DISTINCT g.stream_session_id) AS streams
     FROM gift_earnings g
     JOIN profiles p ON p.user_id = g.recipient_user_id
     WHERE g.created_at >= date_trunc('month', NOW())
     GROUP BY p.user_id, p.display_name, p.country, p.photo_url
     ORDER BY coins_earned DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r, i) => {
    const rank = i + 1;
    const rateKey = rank === 1 ? 'monthly_1' : rank === 2 ? 'monthly_2' : rank === 3 ? 'monthly_3' : 'base';
    return {
      rank,
      userId: r.user_id,
      username: r.username,
      country: r.country,
      photoUrl: r.photo_url,
      coinsEarned: r.coins_earned,
      streams: Number(r.streams),
      payoutRate: PAYOUT_RATES[rateKey],
      badge: CREATOR_BADGE[rank] || null,
    };
  });
}

// Returns the locked top 3 for a completed month, computing + freezing it on
// first read if it hasn't been locked yet. Returns [] for the current
// (still in-progress) month or a month with no gift activity.
async function getLockedTopCreators(yearMonth) {
  if (yearMonth >= currentYearMonth()) return []; // never lock an in-progress month

  const existing = await db(
    `SELECT rank, user_id, coins_earned FROM monthly_top_creators WHERE year_month = $1 ORDER BY rank`,
    [yearMonth]
  );
  if (existing.rows.length) return existing.rows;

  const { rows } = await db(
    `SELECT recipient_user_id AS user_id, SUM(coins)::INTEGER AS coins_earned
     FROM gift_earnings
     WHERE to_char(created_at, 'YYYY-MM') = $1
     GROUP BY recipient_user_id
     ORDER BY coins_earned DESC
     LIMIT 3`,
    [yearMonth]
  );
  if (!rows.length) return [];

  const ranked = rows.map((r, i) => ({ rank: i + 1, user_id: r.user_id, coins_earned: r.coins_earned }));
  for (const r of ranked) {
    await db(
      `INSERT INTO monthly_top_creators (year_month, rank, user_id, coins_earned)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (year_month, rank) DO NOTHING`,
      [yearMonth, r.rank, r.user_id, r.coins_earned]
    );
  }
  return ranked;
}

// The payout rate + cooldown tier a user has earned for cash-outs happening
// *this* month, based on their locked rank from *last* month.
async function getPayoutTierFor(userId, hasBondPass) {
  const locked = await getLockedTopCreators(previousYearMonth());
  const mine   = locked.find(r => r.user_id === userId);

  if (mine) {
    const rateKey = mine.rank === 1 ? 'monthly_1' : mine.rank === 2 ? 'monthly_2' : 'monthly_3';
    return { rank: mine.rank, payoutRate: PAYOUT_RATES[rateKey], cooldownDays: 7 };
  }
  if (hasBondPass) return { rank: null, payoutRate: PAYOUT_RATES.bond_pass, cooldownDays: 14 };
  return { rank: null, payoutRate: PAYOUT_RATES.base, cooldownDays: 30 };
}

module.exports = {
  PAYOUT_RATES,
  CREATOR_BADGE,
  currentYearMonth,
  previousYearMonth,
  transferGiftCoins,
  getLiveMonthlyLeaderboard,
  getLockedTopCreators,
  getPayoutTierFor,
};
