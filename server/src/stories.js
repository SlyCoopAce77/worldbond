const { v4: uuidv4 } = require('uuid');
const { query: db } = require('./database/db');

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function addStory({ userId, username, country, language, mood, imageUrl, caption, filter }) {
  const id = uuidv4();
  await db(
    `INSERT INTO user_stories (id, user_id, username, country, language, mood, image_url, caption, filter, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '${STORY_TTL / 1000} seconds')`,
    [id, userId, username, country, language, mood || '', imageUrl, caption || '', filter || 'normal']
  );
  return getStoryById(id);
}

async function getStories() {
  const { rows } = await db(
    `SELECT s.id, s.user_id AS "userId", s.username, s.country, s.language, s.mood,
            s.image_url AS "imageUrl", s.caption, s.filter,
            EXTRACT(EPOCH FROM s.created_at) * 1000 AS "createdAt",
            EXTRACT(EPOCH FROM s.expires_at) * 1000 AS "expiresAt",
            COALESCE((SELECT json_agg(v.user_id) FROM story_viewers v WHERE v.story_id = s.id), '[]') AS viewers
     FROM user_stories s
     WHERE s.expires_at > NOW()
     ORDER BY s.created_at DESC`
  );
  return rows.map(r => ({ ...r, createdAt: Number(r.createdAt), expiresAt: Number(r.expiresAt) }));
}

async function getStoryById(id) {
  const { rows } = await db(
    `SELECT s.id, s.user_id AS "userId", s.username, s.country, s.language, s.mood,
            s.image_url AS "imageUrl", s.caption, s.filter,
            EXTRACT(EPOCH FROM s.created_at) * 1000 AS "createdAt",
            EXTRACT(EPOCH FROM s.expires_at) * 1000 AS "expiresAt",
            COALESCE((SELECT json_agg(v.user_id) FROM story_viewers v WHERE v.story_id = s.id), '[]') AS viewers
     FROM user_stories s
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [id]
  );
  if (!rows.length) return null;
  return { ...rows[0], createdAt: Number(rows[0].createdAt), expiresAt: Number(rows[0].expiresAt) };
}

async function viewStory(storyId, userId) {
  const story = await getStoryById(storyId);
  if (!story) return null;
  await db(`INSERT INTO story_viewers (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [storyId, userId]);
  return getStoryById(storyId);
}

async function deleteStory(storyId, userId) {
  const { rowCount } = await db(`DELETE FROM user_stories WHERE id = $1 AND user_id = $2`, [storyId, userId]);
  return rowCount > 0;
}

// Group stories by user so each user's bubble shows their latest
async function getStoriesGrouped() {
  const active = await getStories();
  const map = {};
  for (const s of active) {
    if (!map[s.userId]) {
      map[s.userId] = { userId: s.userId, username: s.username, country: s.country, mood: s.mood, stories: [] };
    }
    map[s.userId].stories.push(s);
  }
  return Object.values(map);
}

module.exports = { addStory, getStories, getStoryById, viewStory, deleteStory, getStoriesGrouped };
