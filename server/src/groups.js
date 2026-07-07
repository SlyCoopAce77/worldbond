const { query: db } = require('./database/db');

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
    id: 'language-learning',
    name: 'Language Learning',
    icon: '📚',
    description: 'Practice languages with native speakers',
    rooms: ['english', 'japanese', 'spanish', 'korean', 'french'],
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: '⚽',
    description: 'Football, basketball, soccer and more',
    rooms: ['football', 'basketball', 'soccer', 'baseball', 'tennis'],
  },
];

// Message history is real/persisted (below). "Who's currently in the room"
// is live presence, not durable data — that's still derived on demand from
// the socket.io room membership in socket.js, same as before.

async function addMessageToRoom(categoryId, roomName, message) {
  await db(
    `INSERT INTO group_messages (id, category_id, room_name, sender_id, sender_name, sender_country, sender_language, sender_photo, text, image_url, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, to_timestamp($11 / 1000.0))`,
    [message.id, categoryId, roomName, message.senderUserId || null, message.senderName, message.senderCountry,
     message.senderLanguage, message.senderPhoto || null, message.originalText, message.imageUrl || null, message.timestamp]
  );
}

async function getRoomHistory(categoryId, roomName) {
  const { rows } = await db(
    `SELECT id, sender_id AS "senderUserId", sender_name AS "senderName", sender_country AS "senderCountry",
            sender_language AS "senderLanguage", sender_photo AS "senderPhoto", text AS "originalText",
            image_url AS "imageUrl", EXTRACT(EPOCH FROM created_at) * 1000 AS timestamp
     FROM group_messages
     WHERE category_id = $1 AND room_name = $2
     ORDER BY created_at ASC
     LIMIT 100`,
    [categoryId, roomName]
  );
  return rows.map(r => ({ ...r, timestamp: Number(r.timestamp) }));
}

module.exports = { GROUP_CATEGORIES, addMessageToRoom, getRoomHistory };
