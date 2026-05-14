// follows[followerId] = Set of userIds they follow
const follows = {};

function followUser(followerId, targetUserId) {
  if (!follows[followerId]) follows[followerId] = new Set();
  follows[followerId].add(targetUserId);
}

function unfollowUser(followerId, targetUserId) {
  follows[followerId]?.delete(targetUserId);
}

function isFollowing(followerId, targetUserId) {
  return follows[followerId]?.has(targetUserId) ?? false;
}

function getFollowing(userId) {
  return Array.from(follows[userId] || []);
}

function getFollowers(userId) {
  return Object.entries(follows)
    .filter(([, targets]) => targets.has(userId))
    .map(([followerId]) => followerId);
}

module.exports = { followUser, unfollowUser, isFollowing, getFollowing, getFollowers };
