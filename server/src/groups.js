const GROUP_CATEGORIES = [
  {
    id: 'daily-chat',
    name: 'Daily Chat',
    icon: '🌅',
    description: 'Morning check-ins, late nights, and everything in between',
    rooms: ['morning-check-in', 'late-night-thoughts', 'confessions', 'today-i-learned', 'whats-good'],
  },
  {
    id: 'hot-takes',
    name: 'Hot Takes',
    icon: '🔥',
    description: 'Say it with your chest. Debate respectfully.',
    rooms: ['split-the-bill', 'unpopular-opinions', 'change-my-mind', 'would-you-rather', 'ai-is-overrated'],
  },
  {
    id: 'love-dating',
    name: 'Love & Dating',
    icon: '❤️‍🔥',
    description: 'Hot take dating era — values first, small talk never',
    rooms: ['red-flags', 'dealbreakers', 'situationships', 'solo-vs-dating', 'first-date-rules'],
  },
  {
    id: 'money-talk',
    name: 'Money Talk',
    icon: '💸',
    description: 'Financial transparency is the new intimacy',
    rooms: ['money-and-love', 'salary-sharing', 'broke-to-rich', 'side-hustles', 'financial-goals'],
  },
  {
    id: 'mind-soul',
    name: 'Mind & Soul',
    icon: '🧠',
    description: 'Real talk, no filters — mental health and growth',
    rooms: ['vent-freely', 'daily-wins', 'therapy-talk', 'anxiety-corner', 'glow-up'],
  },
  {
    id: 'culture-clash',
    name: 'Culture Clash',
    icon: '🌍',
    description: 'How different is life where you\'re from?',
    rooms: ['food-opinions', 'family-values', 'country-stereotypes', 'traditions', 'city-vs-village'],
  },
  {
    id: 'pop-culture',
    name: 'Pop Culture',
    icon: '🎧',
    description: 'Music, drama, shows — current obsessions',
    rooms: ['now-playing', 'celebrity-drama', 'show-recs', 'lyrics-that-hit', 'guilty-pleasures'],
  },
  {
    id: 'tech-ai',
    name: 'Tech & AI',
    icon: '🤖',
    description: 'The future everyone\'s arguing about right now',
    rooms: ['ai-hot-takes', 'kids-and-phones', 'influencer-culture', 'digital-detox', 'future-predictions'],
  },
];

const activeRooms = {};

function getOrCreateRoom(categoryId, roomName) {
  const key = `${categoryId}:${roomName}`;
  if (!activeRooms[key]) {
    activeRooms[key] = { members: new Set(), messages: [] };
  }
  return activeRooms[key];
}

function addMessageToRoom(categoryId, roomName, message) {
  const room = getOrCreateRoom(categoryId, roomName);
  room.messages.push(message);
  if (room.messages.length > 100) room.messages.shift();
}

function getRoomHistory(categoryId, roomName) {
  const key = `${categoryId}:${roomName}`;
  return activeRooms[key]?.messages || [];
}

module.exports = { GROUP_CATEGORIES, getOrCreateRoom, addMessageToRoom, getRoomHistory };
