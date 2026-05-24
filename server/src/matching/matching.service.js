const { query } = require('../database/db');

const DAILY_MATCH_LIMIT = 5;

// ── Scoring weights ───────────────────────────────────────────────────────────
const WEIGHTS = {
  connection_type:  0.30,
  experience_align: 0.25,
  language:         0.20,
  location:         0.15,
  ghost_score:      0.10,
};

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreLocationProximity(p1, p2) {
  if (p1.lat && p1.lng && p2.lat && p2.lng) {
    const km = haversine(p1.lat, p1.lng, p2.lat, p2.lng);
    if (km < 10)  return 1.0;
    if (km < 50)  return 0.8;
    if (km < 200) return 0.6;
    if (km < 1000)return 0.4;
    return 0.2;
  }
  return p1.country === p2.country ? 0.6 : 0.2;
}

function scoreLanguage(p1, p2) {
  const langs1 = new Set([p1.language, ...(p1.languages_spoken || [])]);
  const langs2 = new Set([p2.language, ...(p2.languages_spoken || [])]);
  const shared = [...langs1].filter(l => langs2.has(l)).length;
  if (shared === 0) return 0.1;
  if (shared === 1) return 0.7;
  return 1.0;
}

function scoreConnectionType(p1, p2) {
  const types1 = new Set(p1.connection_types || []);
  const types2 = new Set(p2.connection_types || []);
  const shared = [...types1].filter(t => types2.has(t)).length;
  if (shared === 0) return 0;
  return Math.min(1, shared * 0.4);
}

// Compare active experience categories to find alignment
function scoreExperienceAlign(exps1, exps2) {
  if (!exps1.length || !exps2.length) return 0.5;
  const cats1 = new Set(exps1.map(e => e.category));
  const cats2 = new Set(exps2.map(e => e.category));
  const shared = [...cats1].filter(c => cats2.has(c)).length;
  return Math.min(1, shared * 0.35);
}

function scoreGhostCompatibility(p1, p2) {
  const diff = Math.abs((p1.ghost_score || 5) - (p2.ghost_score || 5));
  // Low diff = compatible reliability levels
  return Math.max(0, 1 - diff / 4);
}

function computeScore(p1, p2, exps1, exps2) {
  const breakdown = {
    connection_type:  scoreConnectionType(p1, p2),
    experience_align: scoreExperienceAlign(exps1, exps2),
    language:         scoreLanguage(p1, p2),
    location:         scoreLocationProximity(p1, p2),
    ghost_score:      scoreGhostCompatibility(p1, p2),
  };

  // Activity recency multiplier (0.8–1.0)
  const daysSinceActive = (Date.now() - new Date(p2.last_active).getTime()) / (1000 * 60 * 60 * 24);
  const activityMult = daysSinceActive < 1 ? 1.0 : daysSinceActive < 7 ? 0.95 : 0.85;

  const raw = Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * breakdown[k], 0);
  const total = parseFloat((raw * activityMult * 100).toFixed(2));

  return { score: total, breakdown };
}

// ── Load user's active experiences ───────────────────────────────────────────
async function getActiveExperiences(userId) {
  const { rows } = await query(
    "SELECT * FROM experiences WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()",
    [userId]
  );
  return rows;
}

// ── Candidate pool: profiles not yet shown today, not blocked ─────────────────
async function getCandidateProfiles(userId, myProfile) {
  const { rows } = await query(`
    SELECT p.*
    FROM profiles p
    WHERE p.user_id != $1
      AND p.last_active > NOW() - INTERVAL '7 days'
      AND p.voice_note_url IS NOT NULL
      AND p.photo_url IS NOT NULL
      AND array_length(p.connection_types, 1) > 0
      AND p.user_id NOT IN (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
      )
      AND p.user_id NOT IN (
        SELECT matched_user_id FROM daily_matches
        WHERE user_id = $1 AND shown_date >= CURRENT_DATE - 14
      )
    ORDER BY p.last_active DESC
    LIMIT 200
  `, [userId]);
  return rows;
}

// ── Main: get or generate today's 5 matches ───────────────────────────────────
async function getDailyMatches(userId) {
  // Return cached matches for today if they exist
  const { rows: existing } = await query(`
    SELECT dm.*, p.display_name, p.photo_url, p.voice_note_url, p.bio,
           p.country, p.city, p.language, p.languages_spoken,
           p.connection_types, p.ghost_score, p.age, p.gender
    FROM daily_matches dm
    JOIN profiles p ON p.user_id = dm.matched_user_id
    WHERE dm.user_id = $1 AND dm.shown_date = CURRENT_DATE
    ORDER BY dm.compatibility_score DESC
  `, [userId]);

  if (existing.length > 0) return existing;

  // Generate fresh matches
  const myProfile = await query('SELECT * FROM profiles WHERE user_id = $1', [userId]).then(r => r.rows[0]);
  if (!myProfile) return [];

  const myExps   = await getActiveExperiences(userId);
  const candidates = await getCandidateProfiles(userId, myProfile);
  if (!candidates.length) return [];

  // Score all candidates
  const scored = await Promise.all(
    candidates.map(async (candidate) => {
      const candExps = await getActiveExperiences(candidate.user_id);
      const { score, breakdown } = computeScore(myProfile, candidate, myExps, candExps);
      return { candidate, score, breakdown };
    })
  );

  // Top DAILY_MATCH_LIMIT by score
  const top = scored.sort((a, b) => b.score - a.score).slice(0, DAILY_MATCH_LIMIT);

  // Persist to daily_matches
  for (const { candidate, score, breakdown } of top) {
    await query(`
      INSERT INTO daily_matches (user_id, matched_user_id, compatibility_score, score_breakdown)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [userId, candidate.user_id, score, breakdown]);
  }

  return getDailyMatches(userId); // re-fetch with profile joins
}

// ── Create a real match after mutual interest ─────────────────────────────────
async function createMatch(userId, targetUserId, connectionType, experienceId) {
  const [u1, u2] = [userId, targetUserId].sort();
  const { rows } = await query(`
    INSERT INTO matches (user1_id, user2_id, connection_type, experience_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING *
  `, [u1, u2, connectionType, experienceId || null]);

  if (rows[0]) {
    // Seed interaction tracking for both users
    await query(`
      INSERT INTO interaction_tracking (user_id, match_id) VALUES ($1,$2),($3,$2)
    `, [u1, rows[0].id, u2]);
  }
  return rows[0] || null;
}

async function getMatches(userId) {
  const { rows } = await query(`
    SELECT m.*,
      p.display_name, p.photo_url, p.voice_note_url, p.country,
      p.city, p.language, p.connection_types, p.age, p.gender
    FROM matches m
    JOIN profiles p ON p.user_id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
    WHERE (m.user1_id = $1 OR m.user2_id = $1)
      AND m.status = 'active'
    ORDER BY m.matched_at DESC
  `, [userId]);
  return rows;
}

module.exports = { getDailyMatches, createMatch, getMatches };
