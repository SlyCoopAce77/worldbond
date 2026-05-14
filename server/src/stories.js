const { v4: uuidv4 } = require('uuid');

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours

const stories = [];

function addStory({ userId, username, country, language, mood, imageUrl, caption, filter }) {
  const story = {
    id: uuidv4(),
    userId,
    username,
    country,
    language,
    mood: mood || '',
    imageUrl,
    caption: caption || '',
    filter: filter || 'normal',
    viewers: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + STORY_TTL,
  };
  stories.unshift(story);
  return story;
}

function getStories() {
  const now = Date.now();
  // Remove expired stories in place
  for (let i = stories.length - 1; i >= 0; i--) {
    if (stories[i].expiresAt < now) stories.splice(i, 1);
  }
  return stories;
}

function getStoryById(id) {
  return stories.find(s => s.id === id && s.expiresAt > Date.now()) || null;
}

function viewStory(storyId, userId) {
  const story = getStoryById(storyId);
  if (!story) return null;
  if (!story.viewers.includes(userId)) story.viewers.push(userId);
  return story;
}

function deleteStory(storyId, userId) {
  const idx = stories.findIndex(s => s.id === storyId && s.userId === userId);
  if (idx === -1) return false;
  stories.splice(idx, 1);
  return true;
}

// Group stories by user so each user's bubble shows their latest
function getStoriesGrouped() {
  const active = getStories();
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
