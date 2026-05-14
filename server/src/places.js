const { v4: uuidv4 } = require('uuid');

const PLACE_TYPES = {
  bar: { icon: '🍺', label: 'Bar' },
  club: { icon: '🎉', label: 'Nightclub' },
  karaoke: { icon: '🎤', label: 'Karaoke' },
  gaming: { icon: '🎮', label: 'Gaming Cafe' },
  restaurant: { icon: '🍜', label: 'Restaurant' },
  park: { icon: '🌳', label: 'Park / Hangout' },
  beach: { icon: '🏖️', label: 'Beach' },
  sports: { icon: '⚽', label: 'Sports Bar' },
  lounge: { icon: '🛋️', label: 'Lounge' },
  arcade: { icon: '🕹️', label: 'Arcade' },
};

const PLACES = [
  // ─── UNITED STATES ───
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'New York',
    name: 'Times Square Bar Crawl', type: 'bar',
    description: 'NYC\'s iconic bar scene — neon lights, rooftop bars, and people from every country.',
    vibe: '🔥 Electric', bestTime: 'Friday & Saturday nights',
    tags: ['nightlife', 'tourists', 'rooftop'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'New York',
    name: 'Central Park Hangout Zone', type: 'park',
    description: 'Musicians, chess players, food vendors — the ultimate free hangout.',
    vibe: '😎 Chill', bestTime: 'Weekends, afternoons',
    tags: ['free', 'music', 'outdoors'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Los Angeles',
    name: 'Venice Beach Boardwalk', type: 'beach',
    description: 'Street performers, skate park, food stalls, and sunset vibes.',
    vibe: '🌊 Laid-back', bestTime: 'Afternoons & weekends',
    tags: ['beach', 'skating', 'food'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Las Vegas',
    name: 'Fremont Street Experience', type: 'club',
    description: 'Outdoor nightclub energy, live music, LED canopy light shows.',
    vibe: '🎊 Wild', bestTime: 'Every night after 9pm',
    tags: ['nightlife', 'music', 'lights'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Chicago',
    name: 'Wrigleyville Sports Bars', type: 'sports',
    description: 'Packed sports bars around Wrigley Field — Cubs fans, great food, big screens.',
    vibe: '🏟️ Hype', bestTime: 'Game days',
    tags: ['sports', 'beer', 'food'],
  },

  // ─── JAPAN ───
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo',
    name: 'Shinjuku Golden Gai', type: 'bar',
    description: 'Hundreds of tiny bars packed into narrow alleys — super unique Tokyo experience.',
    vibe: '🍶 Cozy', bestTime: 'Evenings & late nights',
    tags: ['locals', 'unique', 'drinks'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo',
    name: 'Akihabara Gaming Cafes', type: 'gaming',
    description: 'Multi-floor gaming cafes with every console, manga, and anime merch you can imagine.',
    vibe: '🎮 Geeky', bestTime: 'Anytime',
    tags: ['gaming', 'anime', 'manga'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo',
    name: 'Shibuya Karaoke Box', type: 'karaoke',
    description: 'Private rooms, all-you-can-drink, thousands of songs in every language.',
    vibe: '🎶 Fun', bestTime: 'Nights, especially weekends',
    tags: ['karaoke', 'drinking', 'friends'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Osaka',
    name: 'Dotonbori Strip', type: 'restaurant',
    description: 'The food capital of Japan — takoyaki, ramen, neon signs everywhere.',
    vibe: '🍜 Delicious', bestTime: 'Evenings',
    tags: ['food', 'streetfood', 'neon'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Kyoto',
    name: 'Gion Night Walk', type: 'lounge',
    description: 'Traditional tea houses, geisha district, lantern-lit streets.',
    vibe: '🏮 Magical', bestTime: 'After sunset',
    tags: ['culture', 'traditional', 'peaceful'],
  },

  // ─── SOUTH KOREA ───
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul',
    name: 'Hongdae Club Street', type: 'club',
    description: 'Seoul\'s youth nightlife hub — K-pop clubs, indie bars, street performers.',
    vibe: '💜 Vibrant', bestTime: 'Friday & Saturday nights',
    tags: ['kpop', 'nightlife', 'young'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul',
    name: 'PC Bang (PC Cafe) Gangnam', type: 'gaming',
    description: 'High-end PC cafes open 24/7 — ultra-fast PCs, food delivery, gaming all night.',
    vibe: '🖥️ Intense', bestTime: '24/7',
    tags: ['gaming', 'esports', 'latenight'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul',
    name: 'Norebang (Karaoke) Sinchon', type: 'karaoke',
    description: 'Private karaoke rooms with tambourines, mood lighting, and great song selection.',
    vibe: '🎵 Hype', bestTime: 'Nights',
    tags: ['karaoke', 'kpop', 'fun'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Busan',
    name: 'Haeundae Beach Scene', type: 'beach',
    description: 'Korea\'s most famous beach with beach bars, volleyball, and summer festivals.',
    vibe: '🌊 Fun', bestTime: 'Summer evenings',
    tags: ['beach', 'summer', 'sports'],
  },

  // ─── BRAZIL ───
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Rio de Janeiro',
    name: 'Lapa Arches Bar Scene', type: 'bar',
    description: 'Rio\'s legendary nightlife under the famous arches — samba, street parties, all night.',
    vibe: '💃 Electric', bestTime: 'Friday nights',
    tags: ['samba', 'dancing', 'street party'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Rio de Janeiro',
    name: 'Ipanema Beach Sunset', type: 'beach',
    description: 'World-famous beach — everyone claps at sunset, caipirinhas everywhere.',
    vibe: '🌅 Beautiful', bestTime: 'Late afternoon & sunset',
    tags: ['beach', 'sunset', 'social'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'São Paulo',
    name: 'Vila Madalena Nightlife', type: 'club',
    description: 'SP\'s artsy nightlife neighborhood — underground clubs, street art, live music.',
    vibe: '🎨 Artsy', bestTime: 'Weekends after midnight',
    tags: ['art', 'music', 'underground'],
  },

  // ─── UNITED KINGDOM ───
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'London',
    name: 'Shoreditch Bar Hop', type: 'bar',
    description: 'East London\'s trendy nightlife — craft beer, rooftops, vintage bars.',
    vibe: '🎸 Cool', bestTime: 'Thursday–Saturday nights',
    tags: ['craft beer', 'rooftop', 'hipster'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'London',
    name: 'Camden Market Hangout', type: 'park',
    description: 'Outdoor market, street food, live music, street performers — super diverse crowd.',
    vibe: '🌈 Diverse', bestTime: 'Weekends',
    tags: ['market', 'food', 'music'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Manchester',
    name: 'Northern Quarter Pubs', type: 'bar',
    description: 'Manchester\'s indie pub scene — live sports, real ales, friendly locals.',
    vibe: '🍺 Local', bestTime: 'Evenings',
    tags: ['pubs', 'sports', 'indie'],
  },

  // ─── FRANCE ───
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Paris',
    name: 'Canal Saint-Martin Hangout', type: 'lounge',
    description: 'Parisians picnic by the canal with wine, cheese, and music.',
    vibe: '🥂 Romantic', bestTime: 'Summer evenings',
    tags: ['picnic', 'wine', 'locals'],
  },
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Paris',
    name: 'Pigalle Bar District', type: 'bar',
    description: 'Cocktail bars, cabarets, and late-night energy in the Pigalle neighborhood.',
    vibe: '🌙 Lively', bestTime: 'Nights',
    tags: ['cocktails', 'nightlife', 'cabaret'],
  },

  // ─── GERMANY ───
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Berlin',
    name: 'Berghain Club Area', type: 'club',
    description: 'World-famous techno club district — underground, raw, legendary nightlife.',
    vibe: '🖤 Underground', bestTime: 'Friday night to Monday morning',
    tags: ['techno', 'underground', 'legendary'],
  },
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Munich',
    name: 'Oktoberfest Beer Halls', type: 'bar',
    description: 'Giant beer halls, traditional music, pretzels, and thousands of people.',
    vibe: '🍻 Epic', bestTime: 'Oktoberfest season (Sept–Oct)',
    tags: ['beer', 'traditional', 'festival'],
  },

  // ─── MEXICO ───
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Mexico City',
    name: 'Condesa Rooftop Bars', type: 'bar',
    description: 'Hip rooftop bars in tree-lined Condesa — mezcal, tacos, city views.',
    vibe: '🌮 Vibrant', bestTime: 'Evenings',
    tags: ['rooftop', 'mezcal', 'food'],
  },
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Cancún',
    name: 'Hotel Zone Beach Clubs', type: 'beach',
    description: 'Massive beach clubs with pools, DJs, and turquoise Caribbean water.',
    vibe: '🏝️ Party', bestTime: 'All day',
    tags: ['beach', 'DJ', 'pool'],
  },

  // ─── INDIA ───
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Mumbai',
    name: 'Bandra Bar Street', type: 'bar',
    description: 'Mumbai\'s coolest neighborhood for bars, live music, and Bollywood stars.',
    vibe: '✨ Glamorous', bestTime: 'Evenings',
    tags: ['bollywood', 'cocktails', 'music'],
  },
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Goa',
    name: 'Anjuna Beach Parties', type: 'beach',
    description: 'Famous full-moon beach parties, trance music, and bonfires.',
    vibe: '🔥 Wild', bestTime: 'Full moon nights',
    tags: ['beach', 'trance', 'bonfire'],
  },

  // ─── AUSTRALIA ───
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Sydney',
    name: 'Bondi Beach BBQ Hangout', type: 'beach',
    description: 'Aussies BBQing by the beach — very social, everyone\'s welcome.',
    vibe: '🦘 Friendly', bestTime: 'Weekends',
    tags: ['bbq', 'beach', 'social'],
  },
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Melbourne',
    name: 'Fitzroy Bar Laneways', type: 'bar',
    description: 'Hidden laneway bars, craft beer, live jazz, very Melbourne.',
    vibe: '🎷 Artsy', bestTime: 'Evenings',
    tags: ['laneway', 'craft beer', 'jazz'],
  },

  // ─── NIGERIA ───
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos',
    name: 'Victoria Island Club Scene', type: 'club',
    description: 'Afrobeats, Amapiano, big energy — Lagos knows how to party.',
    vibe: '🎵 Fire', bestTime: 'Weekends',
    tags: ['afrobeats', 'dancing', 'energy'],
  },
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos',
    name: 'Lekki Rooftop Lounges', type: 'lounge',
    description: 'Upscale rooftop lounges with ocean views, great cocktails, live music.',
    vibe: '🌴 Luxe', bestTime: 'Friday evenings',
    tags: ['rooftop', 'cocktails', 'ocean'],
  },

  // ─── SAUDI ARABIA ───
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh',
    name: 'Boulevard World', type: 'park',
    description: 'Huge entertainment district — food from around the world, live shows, family fun.',
    vibe: '🌍 Global', bestTime: 'Evenings & weekends',
    tags: ['food', 'entertainment', 'family'],
  },
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Jeddah',
    name: 'Corniche Waterfront', type: 'lounge',
    description: 'Red Sea waterfront with cafes, restaurants, and beautiful sunset views.',
    vibe: '🌊 Peaceful', bestTime: 'Evenings',
    tags: ['waterfront', 'food', 'sunset'],
  },

  // ─── SOUTH AFRICA ───
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town',
    name: 'Long Street Bar Scene', type: 'bar',
    description: 'Cape Town\'s most vibrant street — pubs, clubs, live music, all night.',
    vibe: '🌈 Alive', bestTime: 'Weekends',
    tags: ['nightlife', 'diverse', 'live music'],
  },
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town',
    name: 'Camps Bay Beach Sundowners', type: 'beach',
    description: 'Upmarket beach with mountain backdrop, sundowner cocktails, fire pits.',
    vibe: '🔥 Stunning', bestTime: 'Sunset',
    tags: ['beach', 'cocktails', 'sunset'],
  },

  // ─── CANADA ───
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Toronto',
    name: 'King West Entertainment District', type: 'club',
    description: 'Toronto\'s nightlife hub — bottle service clubs, rooftop patios, DJ nights.',
    vibe: '🎊 Premium', bestTime: 'Weekends',
    tags: ['clubs', 'rooftop', 'DJ'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Vancouver',
    name: 'Granville Street Nightlife', type: 'bar',
    description: 'High energy bar strip, diverse crowd, great craft cocktails.',
    vibe: '🍹 Fun', bestTime: 'Thursday–Saturday nights',
    tags: ['nightlife', 'cocktails', 'diverse'],
  },
];

// Live state: checkins and message history per place
const placeState = {};

function getPlaceState(placeId) {
  if (!placeState[placeId]) {
    placeState[placeId] = { checkins: new Map(), messages: [], reviews: [] };
  }
  return placeState[placeId];
}

function checkIn(placeId, user) {
  const state = getPlaceState(placeId);
  state.checkins.set(user.socketId, { ...user, checkedInAt: Date.now() });
}

function checkOut(placeId, socketId) {
  const state = getPlaceState(placeId);
  state.checkins.delete(socketId);
}

function getCheckins(placeId) {
  return Array.from(getPlaceState(placeId).checkins.values());
}

function addPlaceMessage(placeId, message) {
  const state = getPlaceState(placeId);
  state.messages.push(message);
  if (state.messages.length > 100) state.messages.shift();
}

function getPlaceMessages(placeId) {
  return getPlaceState(placeId).messages;
}

// ── REVIEWS & RATINGS ──

function addReview(placeId, review) {
  const state = getPlaceState(placeId);
  // One review per user (update if exists)
  const existing = state.reviews.findIndex(r => r.userId === review.userId);
  if (existing !== -1) {
    state.reviews[existing] = { ...state.reviews[existing], ...review, updatedAt: Date.now() };
  } else {
    state.reviews.push({ id: uuidv4(), ...review, createdAt: Date.now() });
  }
}

function getReviews(placeId) {
  return getPlaceState(placeId).reviews.slice().reverse();
}

function getAverageRating(placeId) {
  const reviews = getPlaceState(placeId).reviews;
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function getPlaceById(id) {
  return PLACES.find(p => p.id === id) || null;
}

function getCountries() {
  const seen = new Set();
  const result = [];
  for (const p of PLACES) {
    if (!seen.has(p.country)) {
      seen.add(p.country);
      result.push(p.country);
    }
  }
  return result.sort();
}

function getCitiesInCountry(country) {
  const seen = new Set();
  for (const p of PLACES) {
    if (p.country === country) seen.add(p.city);
  }
  return Array.from(seen).sort();
}

function getPlacesInCity(country, city) {
  return PLACES.filter(p => p.country === country && p.city === city);
}

module.exports = {
  PLACES, PLACE_TYPES,
  checkIn, checkOut, getCheckins,
  addPlaceMessage, getPlaceMessages,
  addReview, getReviews, getAverageRating,
  getPlaceById, getCountries, getCitiesInCountry, getPlacesInCity,
};
