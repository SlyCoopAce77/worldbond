// likes[fromId] = Set of toIds they liked
// superLikes[fromId] = Set of toIds they super liked
// matches[userId] = Set of matched userIds

const likes = {};
const superLikes = {};
const matches = {};
const passed = {};

function getLikes(userId) {
  return likes[userId] || new Set();
}

function getSuperLikes(userId) {
  return superLikes[userId] || new Set();
}

function getMatches(userId) {
  return Array.from(matches[userId] || new Set());
}

function hasPassed(fromId, toId) {
  return (passed[fromId] || new Set()).has(toId);
}

function pass(fromId, toId) {
  if (!passed[fromId]) passed[fromId] = new Set();
  passed[fromId].add(toId);
}

// Returns { isMatch, isSuperLike } after recording a like
function like(fromId, toId) {
  if (!likes[fromId]) likes[fromId] = new Set();
  likes[fromId].add(toId);

  // Check if toId already liked fromId (mutual = match)
  const theyLikedMe = (likes[toId] || new Set()).has(fromId) || (superLikes[toId] || new Set()).has(fromId);
  if (theyLikedMe) {
    if (!matches[fromId]) matches[fromId] = new Set();
    if (!matches[toId]) matches[toId] = new Set();
    matches[fromId].add(toId);
    matches[toId].add(fromId);
    return { isMatch: true };
  }
  return { isMatch: false };
}

// Super like — always notifies the target, better match priority
function superLike(fromId, toId) {
  if (!superLikes[fromId]) superLikes[fromId] = new Set();
  superLikes[fromId].add(toId);

  const theyLikedMe = (likes[toId] || new Set()).has(fromId) || (superLikes[toId] || new Set()).has(fromId);
  if (theyLikedMe) {
    if (!matches[fromId]) matches[fromId] = new Set();
    if (!matches[toId]) matches[toId] = new Set();
    matches[fromId].add(toId);
    matches[toId].add(fromId);
    return { isMatch: true, isSuperLike: true };
  }
  return { isMatch: false, isSuperLike: true };
}

// Filter out users already liked/passed
function getPotentialMatches(userId, allUsers) {
  const myLikes = likes[userId] || new Set();
  const mySuperLikes = superLikes[userId] || new Set();
  const myPassed = passed[userId] || new Set();
  const myMatches = matches[userId] || new Set();

  return allUsers.filter(u =>
    u.socketId !== userId &&
    !myLikes.has(u.socketId) &&
    !mySuperLikes.has(u.socketId) &&
    !myPassed.has(u.socketId) &&
    !myMatches.has(u.socketId)
  );
}

// Did fromId get a super like from toId?
function hasSuperLikeFrom(toId, fromId) {
  return (superLikes[fromId] || new Set()).has(toId);
}

module.exports = { like, superLike, pass, getMatches, getPotentialMatches, hasSuperLikeFrom };
