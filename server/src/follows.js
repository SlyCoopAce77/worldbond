const { query: db } = require('./database/db');

async function followUser(followerId, targetUserId) {
  await db(
    `INSERT INTO user_follows (follower_id, followee_id) VALUES ($1, $2)
     ON CONFLICT (follower_id, followee_id) DO NOTHING`,
    [followerId, targetUserId]
  );
}

async function unfollowUser(followerId, targetUserId) {
  await db(`DELETE FROM user_follows WHERE follower_id = $1 AND followee_id = $2`, [followerId, targetUserId]);
}

async function isFollowing(followerId, targetUserId) {
  const { rows } = await db(
    `SELECT 1 FROM user_follows WHERE follower_id = $1 AND followee_id = $2`,
    [followerId, targetUserId]
  );
  return rows.length > 0;
}

async function getFollowing(userId) {
  const { rows } = await db(`SELECT followee_id FROM user_follows WHERE follower_id = $1`, [userId]);
  return rows.map(r => r.followee_id);
}

async function getFollowers(userId) {
  const { rows } = await db(`SELECT follower_id FROM user_follows WHERE followee_id = $1`, [userId]);
  return rows.map(r => r.follower_id);
}

module.exports = { followUser, unfollowUser, isFollowing, getFollowing, getFollowers };
