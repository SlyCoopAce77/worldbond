const { v4: uuidv4 } = require('uuid');
const { query: db } = require('./database/db');

async function addPhoto({ userId, username, country, postCountry, language, mood, imageUrl, caption, filter }) {
  const id = uuidv4();
  await db(
    `INSERT INTO user_photos (id, user_id, username, country, post_country, language, mood, image_url, caption, filter)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, userId, username, country, postCountry || null, language, mood || '', imageUrl, caption || '', filter || 'normal']
  );
  return getPhotoById(id);
}

async function getPhotos() {
  const { rows } = await db(
    `SELECT p.id, p.user_id AS "userId", p.username, p.country, p.post_country AS "postCountry",
            p.language, p.mood, p.image_url AS "imageUrl", p.caption, p.filter,
            EXTRACT(EPOCH FROM p.created_at) * 1000 AS "createdAt",
            COALESCE(
              (SELECT json_agg(json_build_object('userId', l.user_id, 'username', l.username)) FROM photo_likes l WHERE l.photo_id = p.id),
              '[]'
            ) AS likes,
            COALESCE(
              (SELECT json_agg(json_build_object('id', c.id, 'userId', c.user_id, 'username', c.username, 'country', c.country, 'text', c.text, 'createdAt', EXTRACT(EPOCH FROM c.created_at) * 1000) ORDER BY c.created_at)
               FROM photo_comments c WHERE c.photo_id = p.id),
              '[]'
            ) AS comments,
            COALESCE(
              (SELECT json_agg(json_build_object('userId', e.user_id, 'username', e.username, 'country', e.country)) FROM photo_echos e WHERE e.photo_id = p.id),
              '[]'
            ) AS echos
     FROM user_photos p
     ORDER BY p.created_at DESC
     LIMIT 500`
  );
  return rows.map(r => ({ ...r, createdAt: Number(r.createdAt) }));
}

async function getPhotoById(id) {
  const { rows } = await db(
    `SELECT p.id, p.user_id AS "userId", p.username, p.country, p.post_country AS "postCountry",
            p.language, p.mood, p.image_url AS "imageUrl", p.caption, p.filter,
            EXTRACT(EPOCH FROM p.created_at) * 1000 AS "createdAt",
            COALESCE(
              (SELECT json_agg(json_build_object('userId', l.user_id, 'username', l.username)) FROM photo_likes l WHERE l.photo_id = p.id),
              '[]'
            ) AS likes,
            COALESCE(
              (SELECT json_agg(json_build_object('id', c.id, 'userId', c.user_id, 'username', c.username, 'country', c.country, 'text', c.text, 'createdAt', EXTRACT(EPOCH FROM c.created_at) * 1000) ORDER BY c.created_at)
               FROM photo_comments c WHERE c.photo_id = p.id),
              '[]'
            ) AS comments,
            COALESCE(
              (SELECT json_agg(json_build_object('userId', e.user_id, 'username', e.username, 'country', e.country)) FROM photo_echos e WHERE e.photo_id = p.id),
              '[]'
            ) AS echos
     FROM user_photos p
     WHERE p.id = $1`,
    [id]
  );
  if (!rows.length) return null;
  return { ...rows[0], createdAt: Number(rows[0].createdAt) };
}

async function toggleLike(photoId, userId, username) {
  const existing = await db(`SELECT 1 FROM photo_likes WHERE photo_id = $1 AND user_id = $2`, [photoId, userId]);
  if (existing.rows.length) {
    await db(`DELETE FROM photo_likes WHERE photo_id = $1 AND user_id = $2`, [photoId, userId]);
  } else {
    await db(`INSERT INTO photo_likes (photo_id, user_id, username) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [photoId, userId, username]);
  }
  return getPhotoById(photoId);
}

async function addComment(photoId, { userId, username, country, text }) {
  if (!text?.trim()) return null;
  await db(
    `INSERT INTO photo_comments (id, photo_id, user_id, username, country, text) VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), photoId, userId, username, country, text.trim()]
  );
  return getPhotoById(photoId);
}

async function toggleEcho(photoId, userId, username, country) {
  const existing = await db(`SELECT 1 FROM photo_echos WHERE photo_id = $1 AND user_id = $2`, [photoId, userId]);
  if (existing.rows.length) {
    await db(`DELETE FROM photo_echos WHERE photo_id = $1 AND user_id = $2`, [photoId, userId]);
  } else {
    await db(`INSERT INTO photo_echos (photo_id, user_id, username, country) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [photoId, userId, username, country]);
  }
  return getPhotoById(photoId);
}

async function deletePhoto(photoId, userId) {
  const { rowCount } = await db(`DELETE FROM user_photos WHERE id = $1 AND user_id = $2`, [photoId, userId]);
  return rowCount > 0;
}

async function adminDeletePhoto(photoId) {
  const { rowCount } = await db(`DELETE FROM user_photos WHERE id = $1`, [photoId]);
  return rowCount > 0;
}

async function deletePhotosByUser(userId) {
  await db(`DELETE FROM user_photos WHERE user_id = $1`, [userId]);
}

module.exports = { addPhoto, getPhotos, getPhotoById, toggleLike, addComment, deletePhoto, toggleEcho, adminDeletePhoto, deletePhotosByUser };
