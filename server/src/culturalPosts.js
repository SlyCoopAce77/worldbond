const { v4: uuidv4 } = require('uuid');

const CATEGORIES = ['food', 'tradition', 'music', 'humor', 'language', 'places', 'daily life', 'celebration'];

const posts = [];

function createCulturalPost({ userId, username, country, language, text, emoji, category }) {
  const post = {
    id: uuidv4(),
    userId,
    username,
    country,
    language,
    text,
    emoji: emoji || '🌍',
    category: category || 'daily life',
    likes: 0,
    likedBy: [],
    createdAt: Date.now(),
  };
  posts.unshift(post);
  if (posts.length > 200) posts.pop();
  return post;
}

function likePost(postId, userId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return null;
  if (post.likedBy.includes(userId)) {
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes++;
  }
  return post;
}

function getCulturalPosts() {
  return posts.map(p => ({ ...p, likedBy: undefined }));
}

module.exports = { CATEGORIES, createCulturalPost, likePost, getCulturalPosts };
