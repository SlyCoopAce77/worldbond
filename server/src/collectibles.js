const { query: db } = require('./database/db');

// Must match INACTIVE_DROP_MS in app/src/context/ChallengeContext.js
const INACTIVE_DROP_MS = 30 * 86400000;

async function getAllStamps() {
  const { rows } = await db(`
    SELECT s.flag, s.holder_id, s.coins_earned, s.claimed_at, s.last_activity,
           p.display_name AS holder_name
    FROM country_stamps s
    LEFT JOIN profiles p ON p.user_id = s.holder_id
    ORDER BY s.flag
  `);
  return rows;
}

async function getAllMonuments() {
  const { rows } = await db(`
    SELECT m.monument_id, m.holder_id, m.coins_earned, m.claimed_at, m.last_activity,
           p.display_name AS holder_name
    FROM bond_monuments m
    LEFT JOIN profiles p ON p.user_id = m.holder_id
    ORDER BY m.monument_id
  `);
  return rows;
}

// Atomically transfers a stamp/monument to userId if it's unclaimed, the
// current holder has gone inactive (30+ days), or userId already holds it
// (renewal). Returns { ok: true } or { ok: false, reason: 'already_held' }.
async function claimCollectible(table, idColumn, id, userId) {
  const { rows } = await db(
    `UPDATE ${table}
     SET holder_id = $1, claimed_at = NOW(), last_activity = NOW(), coins_earned = 0
     WHERE ${idColumn} = $2
       AND (holder_id IS NULL OR holder_id = $1 OR last_activity < NOW() - INTERVAL '${INACTIVE_DROP_MS / 86400000} days')
     RETURNING ${idColumn}`,
    [userId, id]
  );
  return rows.length ? { ok: true } : { ok: false, reason: 'already_held' };
}

const claimStamp    = (flag, userId)       => claimCollectible('country_stamps', 'flag', flag, userId);
const claimMonument = (monumentId, userId) => claimCollectible('bond_monuments', 'monument_id', monumentId, userId);

module.exports = { getAllStamps, getAllMonuments, claimStamp, claimMonument };
