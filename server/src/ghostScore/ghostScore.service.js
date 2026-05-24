const { query } = require('../database/db');

// Called when a user sends their first message in a match
async function recordResponse(userId, matchId) {
  const { rows } = await query(`
    SELECT id, responded, created_at FROM interaction_tracking
    WHERE user_id = $1 AND match_id = $2
  `, [userId, matchId]);

  if (!rows.length || rows[0].responded) return;

  const hoursToRespond = (Date.now() - new Date(rows[0].created_at).getTime()) / (1000 * 60 * 60);

  await query(`
    UPDATE interaction_tracking
    SET responded = TRUE, response_time_hours = $3
    WHERE user_id = $1 AND match_id = $2
  `, [userId, matchId, parseFloat(hoursToRespond.toFixed(2))]);

  await recomputeGhostScore(userId);
}

// Recomputes ghost score from last 30 interactions
async function recomputeGhostScore(userId) {
  const { rows } = await query(`
    SELECT responded, response_time_hours
    FROM interaction_tracking
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 30
  `, [userId]);

  if (!rows.length) return;

  const total      = rows.length;
  const responded  = rows.filter(r => r.responded).length;
  const responseRate = responded / total;

  // Avg response time among those who responded (lower = better)
  const responseTimes = rows.filter(r => r.responded && r.response_time_hours != null).map(r => +r.response_time_hours);
  const avgResponseTime = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 72; // default to 3 days if no data

  // Time score: <1h = 1.0, <6h = 0.85, <24h = 0.7, <72h = 0.5, >= 72h = 0.2
  let timeScore = 0.2;
  if (avgResponseTime < 1)       timeScore = 1.0;
  else if (avgResponseTime < 6)  timeScore = 0.85;
  else if (avgResponseTime < 24) timeScore = 0.7;
  else if (avgResponseTime < 72) timeScore = 0.5;

  // Final score: weighted 70% response rate, 30% speed
  const rawScore = responseRate * 0.7 + timeScore * 0.3;
  // Scale to 1–5
  const ghostScore = parseFloat((1 + rawScore * 4).toFixed(2));

  await query(
    'UPDATE profiles SET ghost_score = $2 WHERE user_id = $1',
    [userId, ghostScore]
  );

  return ghostScore;
}

module.exports = { recordResponse, recomputeGhostScore };
