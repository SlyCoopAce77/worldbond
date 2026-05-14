const GROUP_CATEGORIES = [
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    description: 'Talk about games, find teammates worldwide',
    rooms: ['fps-shooters', 'rpg-fans', 'mobile-gaming', 'retro-games', 'esports'],
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: '⚽',
    description: 'Football, basketball, soccer and more',
    rooms: ['football', 'basketball', 'soccer', 'baseball', 'tennis'],
  },
  {
    id: 'bars-nightlife',
    name: 'Bars & Nightlife',
    icon: '🍻',
    description: 'Bar recommendations, night out stories',
    rooms: ['cocktails', 'craft-beer', 'wine', 'nightclubs', 'karaoke'],
  },
  {
    id: 'music',
    name: 'Music',
    icon: '🎵',
    description: 'Share your favorite artists and discover new music',
    rooms: ['hip-hop', 'rock', 'kpop', 'jazz', 'electronic'],
  },
  {
    id: 'food',
    name: 'Food & Cooking',
    icon: '🍜',
    description: 'Share recipes and food culture across countries',
    rooms: ['asian-cuisine', 'street-food', 'vegetarian', 'desserts', 'bbq'],
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    description: 'Travel tips, hidden gems, trip planning',
    rooms: ['backpacking', 'city-guides', 'solo-travel', 'food-travel', 'adventure'],
  },
  {
    id: 'language-learning',
    name: 'Language Learning',
    icon: '📚',
    description: 'Practice languages with native speakers',
    rooms: ['english', 'japanese', 'spanish', 'korean', 'french'],
  },
  {
    id: 'movies-tv',
    name: 'Movies & TV',
    icon: '🎬',
    description: 'Reviews, recommendations, fan discussions',
    rooms: ['anime', 'kdrama', 'hollywood', 'documentaries', 'horror'],
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
