const { query: db, pool } = require('./database/db');
const { sendPush } = require('./push');

// Must match the display copy in app/src/screens/LiveHubScreen.js
const YEARLY_CHALLENGES = {
  worldStreamer: { goal: 52,     prize: 30000, buyIn: 3000 },
  globeTrotter:  { goal: 24,     prize: 20000, buyIn: 2000 },
  bondMarathon:  { goal: 365,    prize: 25000, buyIn: 2500 },
  bondElite:     { goal: 25000,  prize: 22000, buyIn: 2000 },
  giftLegend:    { goal: 500000, prize: 30000, buyIn: 2500 },
  bondInferno:   { goal: 75000,  prize: 80000, buyIn: 6000 },
};

function currentYear() { return new Date().getFullYear(); }

function metricFor(challengeKey, row) {
  switch (challengeKey) {
    case 'worldStreamer': return row.streams_completed || 0;
    case 'globeTrotter':  return (row.stamp_wins || 0) + (row.monument_wins || 0);
    case 'bondMarathon':  return parseFloat(row.stream_hours || 0);
    case 'bondElite':     return row.total_viewers || 0;
    case 'giftLegend':    return row.gifts_received_bc || 0;
    case 'bondInferno':   return row.total_bond_heat || 0;
    default: return 0;
  }
}

// Bond Pass required at the moment of buy-in (not re-checked later — once
// you've locked in, a lapsed subscription doesn't undo it). Snapshots current
// progress so only post-buy-in gains count toward the goal.
async function buyIntoChallenge(userId, challengeKey) {
  const def = YEARLY_CHALLENGES[challengeKey];
  if (!def) return { ok: false, reason: 'invalid_challenge' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const profileRes = await client.query(
      `SELECT has_bond_pass FROM profiles WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );
    if (!profileRes.rows.length) { await client.query('ROLLBACK'); return { ok: false, reason: 'not_found' }; }
    if (!profileRes.rows[0].has_bond_pass) { await client.query('ROLLBACK'); return { ok: false, reason: 'bond_pass_required' }; }

    const year = currentYear();
    const existing = await client.query(
      `SELECT 1 FROM yearly_challenge_entries WHERE user_id = $1 AND year = $2 AND challenge_key = $3`,
      [userId, year, challengeKey]
    );
    if (existing.rows.length) { await client.query('ROLLBACK'); return { ok: false, reason: 'already_entered' }; }

    const debit = await client.query(
      `UPDATE profiles SET coin_balance = coin_balance - $1 WHERE user_id = $2 AND coin_balance >= $1 RETURNING coin_balance`,
      [def.buyIn, userId]
    );
    if (!debit.rows.length) { await client.query('ROLLBACK'); return { ok: false, reason: 'insufficient_balance' }; }

    const progressRes = await client.query(
      `SELECT * FROM yearly_challenge_progress WHERE user_id = $1 AND year = $2`,
      [userId, year]
    );
    const currentMetric = progressRes.rows.length ? metricFor(challengeKey, progressRes.rows[0]) : 0;

    await client.query(
      `INSERT INTO yearly_challenge_entries (user_id, year, challenge_key, progress_at_entry)
       VALUES ($1, $2, $3, $4)`,
      [userId, year, challengeKey, currentMetric]
    );
    await client.query(
      `INSERT INTO coin_burns (user_id, amount, reason, meta) VALUES ($1, $2, 'yearly_buyin', $3)`,
      [userId, def.buyIn, JSON.stringify({ challengeKey })]
    );

    await client.query('COMMIT');
    return { ok: true, buyIn: def.buyIn };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Yearly] buy-in error:', err.message);
    return { ok: false, reason: 'server_error' };
  } finally {
    client.release();
  }
}

// { worldStreamer: true/false, ... } — which challenges this user bought into this year.
async function getMyEntries(userId) {
  const year = currentYear();
  const { rows } = await db(
    `SELECT challenge_key FROM yearly_challenge_entries WHERE user_id = $1 AND year = $2`,
    [userId, year]
  );
  const bought = {};
  for (const key of Object.keys(YEARLY_CHALLENGES)) bought[key] = false;
  for (const r of rows) bought[r.challenge_key] = true;
  return bought;
}

// Pays out a challenge's prize the moment the post-buy-in delta crosses its
// goal. Safe to call unconditionally after any progress update — no-ops for
// challenges never bought into, already paid, or not yet met. The
// prize_paid_at guard makes this race-safe under concurrent updates.
async function checkAndPayPrizes(userId, progressRow) {
  const year = currentYear();
  for (const [key, def] of Object.entries(YEARLY_CHALLENGES)) {
    const entry = await db(
      `SELECT progress_at_entry, prize_paid_at FROM yearly_challenge_entries
       WHERE user_id = $1 AND year = $2 AND challenge_key = $3`,
      [userId, year, key]
    );
    if (!entry.rows.length || entry.rows[0].prize_paid_at) continue;

    const current  = metricFor(key, progressRow);
    const eligible = current - (parseFloat(entry.rows[0].progress_at_entry) || 0);
    if (eligible < def.goal) continue;

    const marked = await db(
      `UPDATE yearly_challenge_entries SET prize_paid_at = NOW()
       WHERE user_id = $1 AND year = $2 AND challenge_key = $3 AND prize_paid_at IS NULL
       RETURNING challenge_key`,
      [userId, year, key]
    );
    if (!marked.rows.length) continue; // lost a concurrent race — already paid elsewhere

    await db(`UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + $1 WHERE user_id = $2`, [def.prize, userId]);
    console.log(`[Yearly] Paid ${def.prize} BC prize for ${key} to user ${userId}`);
    sendPush(userId, { title: 'Yearly Challenge won!', body: `You just earned ${def.prize.toLocaleString()} BC for completing a yearly challenge` });
  }
}

// Buy-in-aware replacement for the old unconditional upsert. `updates` is a
// partial row of yearly_challenge_progress columns to increment.
async function upsertYearlyProgress(userId, updates) {
  if (!userId) return;
  const cols = Object.keys(updates || {});
  if (!cols.length) return;
  const year = currentYear();
  const incs = cols.map((c, i) => `${c} = COALESCE(yearly_challenge_progress.${c}, 0) + $${i + 3}`).join(', ');
  const vals = cols.map(c => updates[c]);

  try {
    const { rows } = await db(
      `INSERT INTO yearly_challenge_progress (user_id, year, ${cols.join(', ')}, updated_at)
       VALUES ($1, $2, ${vals.map((_, i) => `$${i + 3}`).join(', ')}, NOW())
       ON CONFLICT (user_id, year) DO UPDATE SET ${incs}, updated_at = NOW()
       RETURNING *`,
      [userId, year, ...vals]
    );
    if (rows[0]) await checkAndPayPrizes(userId, rows[0]);
  } catch (e) {
    console.warn('[Yearly] upsert error:', e.message);
  }
}

module.exports = { YEARLY_CHALLENGES, buyIntoChallenge, getMyEntries, upsertYearlyProgress };
