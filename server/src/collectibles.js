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

// profiles.country is stored as a plain name (e.g. "Japan") — see
// OnboardingScreen.js PUT /api/profiles/me. Only covers the ~26 countries
// that actually have a stamp or monument; nothing to look up otherwise.
const COUNTRY_NAME_TO_FLAG = {
  'united states': '🇺🇸', 'brazil': '🇧🇷', 'south korea': '🇰🇷', 'japan': '🇯🇵',
  'united kingdom': '🇬🇧', 'mexico': '🇲🇽', 'australia': '🇦🇺', 'indonesia': '🇮🇩',
  'turkey': '🇹🇷', 'germany': '🇩🇪', 'argentina': '🇦🇷', 'russia': '🇷🇺',
  'france': '🇫🇷', 'spain': '🇪🇸', 'canada': '🇨🇦', 'india': '🇮🇳',
  'philippines': '🇵🇭', 'saudi arabia': '🇸🇦', 'poland': '🇵🇱', 'thailand': '🇹🇭',
  'sweden': '🇸🇪', 'netherlands': '🇳🇱', 'portugal': '🇵🇹', 'colombia': '🇨🇴',
  'italy': '🇮🇹', 'china': '🇨🇳',
};

// Pays the active Country Stamp holder 3% and every currently-held Bond
// Monument in that country 2% each, real coins credited straight to their
// coin_balance. This is the real replacement for the dead client-side
// applyStampRoyalty — best-effort, called after a gift transfer already
// succeeded, so failures here must never roll back the underlying gift.
async function payCollectibleRoyalties(recipientId, giftCoins) {
  if (!recipientId || !giftCoins) return;
  const { rows } = await db(`SELECT country FROM profiles WHERE user_id = $1`, [recipientId]);
  const countryName = rows[0]?.country?.trim().toLowerCase();
  const flag = countryName ? COUNTRY_NAME_TO_FLAG[countryName] : null;
  if (!flag) return;

  // Country Stamp — 3%, only pays if the holder is still "active"
  // (matches isStampDropped in ChallengeContext.js: >30 days idle = dropped).
  const stampCut = Math.floor(giftCoins * 0.03);
  if (stampCut > 0) {
    const stamp = await db(
      `UPDATE country_stamps
       SET coins_earned = coins_earned + $1, last_activity = NOW()
       WHERE flag = $2 AND holder_id IS NOT NULL AND holder_id != $3
         AND last_activity > NOW() - INTERVAL '30 days'
       RETURNING holder_id`,
      [stampCut, flag, recipientId]
    );
    if (stamp.rows[0]?.holder_id) {
      await db(`UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + $1 WHERE user_id = $2`,
        [stampCut, stamp.rows[0].holder_id]);
    }
  }

  // Bond Monuments — 2% each, to every currently-held monument in that country
  const monumentCut = Math.floor(giftCoins * 0.02);
  if (monumentCut > 0) {
    const monuments = await db(
      `UPDATE bond_monuments
       SET coins_earned = coins_earned + $1, last_activity = NOW()
       WHERE country = $2 AND holder_id IS NOT NULL AND holder_id != $3
       RETURNING holder_id`,
      [monumentCut, flag, recipientId]
    );
    for (const m of monuments.rows) {
      await db(`UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + $1 WHERE user_id = $2`,
        [monumentCut, m.holder_id]);
    }
  }
}

module.exports = { getAllStamps, getAllMonuments, claimStamp, claimMonument, payCollectibleRoyalties };
