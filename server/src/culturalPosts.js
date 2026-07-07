const { v4: uuidv4 } = require('uuid');
const { query: db } = require('./database/db');

const CATEGORIES = ['food', 'tradition', 'music', 'humor', 'language', 'places', 'daily life', 'celebration'];

async function createCulturalPost({ userId, username, country, language, text, emoji, category }) {
  const id = uuidv4();
  await db(
    `INSERT INTO cultural_posts (id, user_id, username, country, language, text, emoji, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, userId, username, country, language, text, emoji || '🌍', category || 'daily life']
  );
  const { rows } = await db(`SELECT *, 0 AS likes FROM cultural_posts WHERE id = $1`, [id]);
  return rows[0];
}

async function likePost(postId, userId) {
  const existing = await db(`SELECT 1 FROM cultural_post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
  if (existing.rows.length) {
    await db(`DELETE FROM cultural_post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
  } else {
    await db(
      `INSERT INTO cultural_post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [postId, userId]
    );
  }
  const { rows } = await db(
    `SELECT p.*, COUNT(l.user_id)::INTEGER AS likes
     FROM cultural_posts p LEFT JOIN cultural_post_likes l ON l.post_id = p.id
     WHERE p.id = $1 GROUP BY p.id`,
    [postId]
  );
  return rows[0] || null;
}

async function getCulturalPosts() {
  const { rows } = await db(
    `SELECT p.*, COUNT(l.user_id)::INTEGER AS likes
     FROM cultural_posts p LEFT JOIN cultural_post_likes l ON l.post_id = p.id
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT 200`
  );
  return rows;
}

module.exports = { CATEGORIES, createCulturalPost, likePost, getCulturalPosts };
