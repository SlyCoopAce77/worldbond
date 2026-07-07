const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { translateText } = require('./translate');
const { query: dbQuery } = require('./database/db');
const { transferGiftCoins } = require('./creators');
const { payCollectibleRoyalties } = require('./collectibles');
const { upsertYearlyProgress } = require('./yearlyChallenges');

// ── Block-list enforcement for the real-time layer ────────────────────────────
// The REST API (profiles.routes.js /blocks) has always respected user_blocks.
// The socket layer never checked it — a blocked (or any) user could grab
// someone's socketId from a shared group room / live stream and DM or call
// them directly, completely bypassing the block. This check is used by
// direct_message and call_user below.
async function isBlockedEitherWay(userIdA, userIdB) {
  if (!userIdA || !userIdB) return false; // can't verify — fail open, no worse than before
  try {
    const { rows } = await dbQuery(
      `SELECT 1 FROM user_blocks
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [userIdA, userIdB]
    );
    return rows.length > 0;
  } catch (e) {
    console.warn('[Blocks] check error:', e.message);
    return false; // DB hiccup shouldn't silently break messaging
  }
}

// ── Yearly challenge helpers ───────────────────────────────────────────────────
// upsertYearlyProgress now lives in yearlyChallenges.js (buy-in-aware + pays
// prizes automatically) — imported above.
function currentYear() { return new Date().getFullYear(); }

// ── Whitelisted gift types — server is the source of truth for coin values ────
// Matches GiftPicker.js GIFTS exactly. Client sends gift.id; server resolves coin value.
const GIFT_CATALOG = {
  world_hello:       { id: 'world_hello',       name: 'World Hello',       coins: 10,     color: '#4ade80', tier: 'starter'  },
  bond_shake:        { id: 'bond_shake',         name: 'Bond Shake',        coins: 25,     color: '#4ade80', tier: 'starter'  },
  postcard:          { id: 'postcard',            name: 'Postcard',          coins: 50,     color: '#4ade80', tier: 'starter'  },
  map_pin:           { id: 'map_pin',             name: 'Map Pin',           coins: 100,    color: '#4ade80', tier: 'starter'  },
  passport:          { id: 'passport',            name: 'Passport',          coins: 200,    color: '#60a5fa', tier: 'explorer' },
  world_map:         { id: 'world_map',           name: 'World Map',         coins: 500,    color: '#60a5fa', tier: 'explorer' },
  first_class:       { id: 'first_class',         name: 'First Class',       coins: 1000,   color: '#60a5fa', tier: 'explorer' },
  globe_spin:        { id: 'globe_spin',          name: 'Globe Spin',        coins: 1500,   color: '#60a5fa', tier: 'explorer' },
  heritage:          { id: 'heritage',            name: 'Heritage',          coins: 2500,   color: '#c084fc', tier: 'voyager'  },
  culture_crown:     { id: 'culture_crown',       name: 'Culture Crown',     coins: 4000,   color: '#c084fc', tier: 'voyager'  },
  embassy_seal:      { id: 'embassy_seal',        name: 'Embassy Seal',      coins: 6000,   color: '#c084fc', tier: 'voyager'  },
  bond_satellite:    { id: 'bond_satellite',      name: 'Bond Satellite',    coins: 10000,  color: '#FFB700', tier: 'elite'    },
  world_ambassador:  { id: 'world_ambassador',    name: 'World Ambassador',  coins: 20000,  color: '#FFB700', tier: 'elite'    },
  bond_atlas:        { id: 'bond_atlas',          name: 'Bond Atlas',        coins: 35000,  color: '#FFB700', tier: 'elite'    },
  bond_sovereign:    { id: 'bond_sovereign',      name: 'Bond Sovereign',    coins: 50000,  color: '#FF0080', tier: 'legend'   },
  planet_bond:       { id: 'planet_bond',         name: 'Planet Bond',       coins: 100000, color: '#FF0080', tier: 'legend'   },
  bond_eternal:      { id: 'bond_eternal',        name: 'Bond Eternal',      coins: 250000, color: '#FF0080', tier: 'legend'   },
};

// ── Per-socket rate limiter (in-memory, resets on disconnect) ─────────────────
const socketGiftCounts = {}; // socketId -> { count, windowStart }
const GIFT_RATE_LIMIT  = 30; // max 30 gifts per minute per sender
const GIFT_WINDOW_MS   = 60000;

function checkGiftRate(socketId) {
  const now   = Date.now();
  const entry = socketGiftCounts[socketId];
  if (!entry || now - entry.windowStart > GIFT_WINDOW_MS) {
    socketGiftCounts[socketId] = { count: 1, windowStart: now };
    return true;
  }
  if (entry.count >= GIFT_RATE_LIMIT) return false;
  entry.count++;
  return true;
}
const { GROUP_CATEGORIES, addMessageToRoom, getRoomHistory } = require('./groups');
const {
  checkIn, checkOut, getCheckins,
  addPlaceMessage, getPlaceMessages, getPlaceById,
  addReview, getReviews, getAverageRating,
  getCountries, getCitiesInCountry, getPlacesInCity, PLACE_TYPES,
  getPlacesInCountry, getPlacesByType,
  postVenueEvent, getVenueEvents, getAllUpcomingEvents,
  setVenueLive, getVenueLiveStatus, getAllLiveVenues,
} = require('./places');
const { getTodaysQuestion, addResponse, getResponses, likeResponse, addComment: addIcebreakerComment, likeComment: likeIcebreakerComment, deleteComment: deleteIcebreakerComment, deleteResponse: deleteIcebreakerResponse, getResponseOwner, getCommentOwner } = require('./icebreaker');
const { createEvent, getEvents, getEventById, joinEvent, leaveEvent, addEventMessage, getEventMessages } = require('./events');
const { createCulturalPost, likePost, getCulturalPosts } = require('./culturalPosts');
const { createPulse, getActivePulsesForSpot, getAllActivePulses, removePulse } = require('./pulses');
const { toggleLike, addComment, deletePhoto, getPhotos, getPhotoById, toggleEcho } = require('./photos');
const { getStoriesGrouped, viewStory, deleteStory, getStoryById } = require('./stories');
const { followUser, unfollowUser, getFollowing, getFollowers, isFollowing } = require('./follows');

// Bond ghost score — only loaded when DB is available
let recordResponse = null;
if (process.env.DATABASE_URL) {
  try { ({ recordResponse } = require('./ghostScore/ghostScore.service')); } catch {}
}

const connectedUsers  = {};

// Find a connected socket by userId (returns socketId string or undefined)
function findSocketId(userId) {
  if (!userId) return undefined;
  return Object.keys(connectedUsers).find(sid => connectedUsers[sid].userId === userId);
}

const countryFlags    = {};   // country -> Set of socketIds who planted flag
const socketCountries = {};   // socketId -> Set of countries (for cleanup on disconnect)
const randomConnectQueue = []; // users waiting for a random match
const randomConnectTimers = {}; // socketId -> timeout handle
const liveStreams = {};        // streamId -> stream object

// Direct messages persist to the real `messages` table now (previously kept
// only in memory, keyed by ephemeral socket.id — history was lost on every
// reconnect, and messages to an offline recipient were silently dropped
// since connectedUsers[toSocketId] didn't exist for them).
// A `matches` row is the FK messages hangs off; DMs implicitly create one
// between the two real users the first time they message each other, same
// as swiping right in Discover does explicitly.
async function getOrCreateMatchId(userIdA, userIdB) {
  const [u1, u2] = [userIdA, userIdB].sort();
  const existing = await dbQuery(`SELECT id FROM matches WHERE user1_id = $1 AND user2_id = $2`, [u1, u2]);
  if (existing.rows.length) return existing.rows[0].id;
  const inserted = await dbQuery(
    `INSERT INTO matches (user1_id, user2_id, connection_type) VALUES ($1, $2, 'friendship')
     ON CONFLICT (user1_id, user2_id) DO NOTHING RETURNING id`,
    [u1, u2]
  );
  if (inserted.rows.length) return inserted.rows[0].id;
  // Race: another concurrent message from the same pair inserted first
  const retry = await dbQuery(`SELECT id FROM matches WHERE user1_id = $1 AND user2_id = $2`, [u1, u2]);
  return retry.rows[0]?.id || null;
}

// Strip leading flag emoji so "🇯🇵 Japan" and "Japan" key the same bucket
function normalizeCountry(str = '') {
  return str.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]\s*/g, '').trim();
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register user with name, language, and optional social links
    // `token` is optional (older app builds don't send one yet) — when present
    // and valid, the server-verified userId is used instead of whatever the
    // client claims, closing the identity-spoofing gap for updated clients.
    socket.on('register', ({ username, display_name, language, country, socials, userId, photo_url, gender, token }) => {
      const finalName = (display_name || username || '').trim();
      if (!finalName) {
        socket.emit('register_error', { reason: 'empty_name' });
        return;
      }
      let verifiedUserId = null;
      if (token) {
        try {
          verifiedUserId = jwt.verify(token, process.env.JWT_SECRET).sub;
        } catch {
          // invalid/expired token — fall back to the unverified claimed userId below
        }
      }
      connectedUsers[socket.id] = {
        username:     finalName,
        display_name: finalName,
        language, country,
        socials:    socials || {},
        socketId:   socket.id,
        userId:     verifiedUserId || userId,
        verified:   !!verifiedUserId,
        photo_url,
        gender,
      };
      socket.emit('registered', { socketId: socket.id });
      io.emit('user_list', Object.values(connectedUsers));
      console.log(`Registered: ${finalName} (${language}, ${country})`);
    });

    // Get list of online users
    socket.on('get_users', () => {
      socket.emit('user_list', Object.values(connectedUsers));
    });

    // Get group categories
    socket.on('get_groups', () => {
      socket.emit('group_list', GROUP_CATEGORIES);
    });

    // Join a group room
    socket.on('join_group', async ({ categoryId, roomName }) => {
      const roomKey = `${categoryId}:${roomName}`;
      socket.join(roomKey);
      const history = await getRoomHistory(categoryId, roomName);
      socket.emit('group_history', { categoryId, roomName, messages: history });

      // Broadcast updated member list to everyone in the room
      const sockets  = await io.in(roomKey).fetchSockets();
      const members  = sockets.map(s => connectedUsers[s.id]).filter(Boolean);
      io.to(roomKey).emit('room_members', { categoryId, roomName, members });
    });

    // Leave a group room
    socket.on('leave_group', async ({ categoryId, roomName }) => {
      const roomKey = `${categoryId}:${roomName}`;
      socket.leave(roomKey);
      // Broadcast updated member list after leave
      const sockets = await io.in(roomKey).fetchSockets();
      const members = sockets.map(s => connectedUsers[s.id]).filter(Boolean);
      io.to(roomKey).emit('room_members', { categoryId, roomName, members });
    });

    // Fetch room members on demand
    socket.on('get_room_members', async ({ categoryId, roomName }) => {
      const roomKey = `${categoryId}:${roomName}`;
      const sockets = await io.in(roomKey).fetchSockets();
      const members = sockets.map(s => connectedUsers[s.id]).filter(Boolean);
      socket.emit('room_members', { categoryId, roomName, members });
    });

    // Group typing indicators
    socket.on('group_typing', ({ categoryId, roomName }) => {
      const sender = connectedUsers[socket.id];
      if (!sender) return;
      const roomKey = `${categoryId}:${roomName}`;
      socket.to(roomKey).emit('group_user_typing', { socketId: socket.id, name: sender.username });
    });
    socket.on('group_stop_typing', ({ categoryId, roomName }) => {
      const roomKey = `${categoryId}:${roomName}`;
      socket.to(roomKey).emit('group_user_stopped_typing', { socketId: socket.id });
    });

    // Send message to group room
    socket.on('group_message', async ({ categoryId, roomName, text, imageUrl }) => {
      const sender = connectedUsers[socket.id];
      if (!sender) return;

      const message = {
        id: uuidv4(),
        senderId: socket.id,
        senderUserId: sender.userId || null,
        senderName: sender.username,
        senderCountry: sender.country,
        senderLanguage: sender.language,
        senderPhoto: sender.photo_url,
        originalText: text,
        timestamp: Date.now(),
        ...(imageUrl && { imageUrl }),
      };

      await addMessageToRoom(categoryId, roomName, message);
      const roomKey = `${categoryId}:${roomName}`;

      // Get all sockets in the room and send each a translated version
      const socketsInRoom = await io.in(roomKey).fetchSockets();
      for (const s of socketsInRoom) {
        const recipient = connectedUsers[s.id];
        if (!recipient) continue;

        let displayText = text;
        if (recipient.language && recipient.language !== sender.language) {
          const result = await translateText(text, recipient.language);
          displayText = result.translatedText;
        }

        s.emit('group_message', {
          ...message,
          text: displayText,
          wasTranslated: displayText !== text,
        });
      }
    });

    // Typing indicators — forward to the target user only
    socket.on('typing', ({ toSocketId }) => {
      io.to(toSocketId).emit('user_typing', { fromSocketId: socket.id });
    });
    socket.on('stop_typing', ({ toSocketId }) => {
      io.to(toSocketId).emit('user_stopped_typing', { fromSocketId: socket.id });
    });

    // Send direct message to another user
    // toUserId is the real, stable recipient identity (new clients send this
    // directly). Older clients only send toSocketId — we resolve their real
    // userId from that if they're currently online, but if they're offline
    // the message used to just vanish (connectedUsers[toSocketId] didn't
    // exist). Now it persists either way and delivers in real time only if
    // they happen to be connected.
    socket.on('direct_message', async ({ toSocketId, toUserId, text, matchId, replyTo, imageUrl }) => {
      const sender = connectedUsers[socket.id];
      if (!sender?.userId || !text?.trim()) return;

      const recipientUserId = toUserId || connectedUsers[toSocketId]?.userId;
      if (!recipientUserId || recipientUserId === sender.userId) return;

      // Respect the block list — same behavior as an offline/unknown recipient
      // so this doesn't leak whether a block exists.
      if (await isBlockedEitherWay(sender.userId, recipientUserId)) return;

      // Update ghost score when a user responds to a match
      if (matchId && recordResponse) {
        recordResponse(sender.userId, matchId).catch(() => {});
      }

      // Recipient's language for translation — from their live session if
      // online, otherwise their saved profile (works even while offline).
      const liveRecipient = connectedUsers[toSocketId]?.userId === recipientUserId
        ? connectedUsers[toSocketId]
        : Object.values(connectedUsers).find(u => u.userId === recipientUserId);
      let recipientLanguage = liveRecipient?.language;
      if (!liveRecipient) {
        const { rows } = await dbQuery(`SELECT language FROM profiles WHERE user_id = $1`, [recipientUserId]);
        recipientLanguage = rows[0]?.language;
      }

      let translatedText = text;
      if (recipientLanguage && recipientLanguage !== sender.language) {
        const result = await translateText(text, recipientLanguage);
        translatedText = result.translatedText;
      }

      const message = {
        id: uuidv4(),
        senderId: socket.id, // matches the currently-live client's isMine check (=== socket.id)
        senderUserId: sender.userId,
        senderName: sender.username,
        senderCountry: sender.country,
        originalText: text,
        text: translatedText,
        wasTranslated: translatedText !== text,
        timestamp: Date.now(),
        ...(replyTo  && { replyTo }),
        ...(imageUrl && { imageUrl }),
      };

      const matchRowId = await getOrCreateMatchId(sender.userId, recipientUserId);
      if (matchRowId) {
        await dbQuery(
          `INSERT INTO messages (id, match_id, sender_id, content, content_type, original_content, meta)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [message.id, matchRowId, sender.userId, translatedText, imageUrl ? 'image' : 'text', text,
           JSON.stringify({ replyTo: replyTo || null, imageUrl: imageUrl || null })]
        ).catch(e => console.warn('[DM] persist error:', e.message));
      }

      // Real-time delivery if the recipient happens to be online right now —
      // the message is already saved regardless, so they'll see it via
      // get_dm_history next time they open the chat either way.
      const recipientSocketId = findSocketId(recipientUserId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('direct_message', message);
        io.to(recipientSocketId).emit('new_message_notif', {
          fromId: socket.id,
          fromName: sender.username,
          fromCountry: sender.country,
          preview: (imageUrl ? '📷 Photo' : text).slice(0, 60),
        });
      }
      socket.emit('direct_message', { ...message, text });
    });

    // Get DM history between two users — real, persisted history now (was
    // in-memory keyed by ephemeral socket.id before, lost on every reconnect).
    // senderId in the response is shimmed to match the CURRENTLY-LIVE app
    // build's isMine check (item.senderId === socket.id): the viewer's own
    // historical messages get the viewer's current socket.id, everyone
    // else's get their real (non-matching) userId. A future client build
    // should switch to comparing senderUserId instead and drop this shim.
    socket.on('get_dm_history', async ({ otherSocketId, otherUserId }) => {
      const viewer = connectedUsers[socket.id];
      if (!viewer?.userId) return socket.emit('dm_history', []);

      const recipientUserId = otherUserId || connectedUsers[otherSocketId]?.userId;
      if (!recipientUserId) return socket.emit('dm_history', []);

      const matchRowId = await getOrCreateMatchId(viewer.userId, recipientUserId);
      if (!matchRowId) return socket.emit('dm_history', []);

      const { rows } = await dbQuery(
        `SELECT m.id, m.sender_id AS "senderUserId", p.display_name AS "senderName", p.country AS "senderCountry",
                m.original_content AS "originalText", m.content AS text, m.meta,
                EXTRACT(EPOCH FROM m.created_at) * 1000 AS timestamp
         FROM messages m
         JOIN profiles p ON p.user_id = m.sender_id
         WHERE m.match_id = $1
         ORDER BY m.created_at ASC
         LIMIT 200`,
        [matchRowId]
      ).catch(() => ({ rows: [] }));

      const history = rows.map(r => ({
        id: r.id,
        senderId: r.senderUserId === viewer.userId ? socket.id : r.senderUserId,
        senderUserId: r.senderUserId,
        senderName: r.senderName,
        senderCountry: r.senderCountry,
        originalText: r.originalText,
        text: r.text,
        wasTranslated: r.originalText !== r.text,
        timestamp: Number(r.timestamp),
        ...(r.meta?.replyTo  && { replyTo: r.meta.replyTo }),
        ...(r.meta?.imageUrl && { imageUrl: r.meta.imageUrl }),
      }));
      socket.emit('dm_history', history);
    });

    // WebRTC signaling for voice/video calls
    socket.on('call_user', async ({ toSocketId, offer, callType }) => {
      const caller   = connectedUsers[socket.id];
      const callee   = connectedUsers[toSocketId];
      if (!caller || !callee) return;

      // Respect the block list — a blocked user shouldn't be able to ring
      // someone with an unwanted voice/video call invite.
      if (await isBlockedEitherWay(caller.userId, callee.userId)) return;

      io.to(toSocketId).emit('incoming_call', {
        from: socket.id,
        callerName: caller?.username,
        callerCountry: caller?.country,
        offer,
        callType,
      });
    });

    socket.on('answer_call', ({ toSocketId, answer }) => {
      io.to(toSocketId).emit('call_answered', { answer });
    });

    socket.on('ice_candidate', ({ toSocketId, candidate }) => {
      io.to(toSocketId).emit('ice_candidate', { candidate });
    });

    socket.on('end_call', ({ toSocketId }) => {
      io.to(toSocketId).emit('call_ended');
    });

    // ── PLACES ──

    socket.on('get_countries', () => {
      socket.emit('countries_list', getCountries());
    });

    socket.on('get_cities', ({ country }) => {
      socket.emit('cities_list', { country, cities: getCitiesInCountry(country) });
    });

    function enrichSpot(p) {
      const activePulses = getActivePulsesForSpot(p.id);
      return {
        ...p,
        typeInfo:     PLACE_TYPES[p.type] || { icon: '📍', label: p.type },
        checkinCount: getCheckins(p.id).length,
        isLive:       getVenueLiveStatus(p.id).isLive,
        eventCount:   getVenueEvents(p.id).length,
        pulseCount:   activePulses.length,
        latestPulse:  activePulses[0] || null,
      };
    }

    socket.on('get_places', ({ country, city }) => {
      const places = getPlacesInCity(country, city).map(enrichSpot);
      socket.emit('places_list', { country, city, places });
    });

    socket.on('get_country_places', ({ country }) => {
      const places = getPlacesInCountry(country).map(enrichSpot);
      socket.emit('country_places_list', { country, places });
    });

    socket.on('get_spots_by_vibe', ({ type }) => {
      const places = getPlacesByType(type).map(enrichSpot);
      socket.emit('vibe_spots_list', { type, places });
    });

    socket.on('get_upcoming_events', () => {
      socket.emit('upcoming_events', getAllUpcomingEvents());
    });

    socket.on('get_live_venues', () => {
      socket.emit('live_venues', getAllLiveVenues());
    });

    socket.on('checkin_place', ({ placeId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      checkIn(placeId, user);
      socket.join(`place:${placeId}`);
      const history = getPlaceMessages(placeId);
      socket.emit('place_history', { placeId, messages: history });
      io.to(`place:${placeId}`).emit('place_checkins', { placeId, checkins: getCheckins(placeId) });
    });

    socket.on('checkout_place', ({ placeId }) => {
      checkOut(placeId, socket.id);
      socket.leave(`place:${placeId}`);
      io.to(`place:${placeId}`).emit('place_checkins', { placeId, checkins: getCheckins(placeId) });
    });

    socket.on('get_place_checkins', ({ placeId }) => {
      socket.emit('place_checkins', { placeId, checkins: getCheckins(placeId) });
    });

    socket.on('place_message', async ({ placeId, text }) => {
      const sender = connectedUsers[socket.id];
      if (!sender) return;

      const message = {
        id: uuidv4(),
        senderId: socket.id,
        senderName: sender.username,
        senderCountry: sender.country,
        senderLanguage: sender.language,
        originalText: text,
        timestamp: Date.now(),
      };

      addPlaceMessage(placeId, message);

      const socketsInRoom = await io.in(`place:${placeId}`).fetchSockets();
      for (const s of socketsInRoom) {
        const recipient = connectedUsers[s.id];
        if (!recipient) continue;

        let displayText = text;
        if (recipient.language && recipient.language !== sender.language) {
          const result = await translateText(text, recipient.language);
          displayText = result.translatedText;
        }

        s.emit('place_message', {
          ...message,
          text: displayText,
          wasTranslated: displayText !== text,
        });
      }
    });

    // ── REVIEWS ──

    socket.on('submit_review', ({ placeId, rating, text }) => {
      const user = connectedUsers[socket.id];
      if (!user || rating < 1 || rating > 5) return;
      addReview(placeId, {
        userId: socket.id,
        username: user.username,
        country: user.country,
        rating,
        text: text?.trim() || '',
      });
      const reviews = getReviews(placeId);
      const avgRating = getAverageRating(placeId);
      io.to(`place:${placeId}`).emit('place_reviews', { placeId, reviews, avgRating });
      // Also emit to the submitter in case they aren't checked in
      socket.emit('place_reviews', { placeId, reviews, avgRating });
    });

    socket.on('get_reviews', ({ placeId }) => {
      socket.emit('place_reviews', {
        placeId,
        reviews: getReviews(placeId),
        avgRating: getAverageRating(placeId),
      });
    });

    // ── VENUE EVENTS ──

    socket.on('post_venue_event', ({ placeId, title, date, type, description, price }) => {
      const user = connectedUsers[socket.id];
      if (!user || !title?.trim() || !date) return;
      postVenueEvent(placeId, {
        title: title.trim(),
        date,
        type: type || 'event',
        description: description?.trim() || '',
        price: price || 'Free',
        postedBy: user.username,
        postedByCountry: user.country,
      });
      const events = getVenueEvents(placeId);
      io.to(`place:${placeId}`).emit('venue_events', { placeId, events });
      socket.emit('venue_events', { placeId, events });
    });

    socket.on('get_venue_events', ({ placeId }) => {
      socket.emit('venue_events', { placeId, events: getVenueEvents(placeId) });
    });

    // ── VENUE PULSE ──

    socket.on('post_pulse', ({ placeId, placeName, placeCountry, placeCity, type, message, eventTime, duration, address }) => {
      const user = connectedUsers[socket.id];
      if (!user || !message?.trim()) return;
      const pulse = createPulse({
        placeId, placeName, placeCountry, placeCity,
        type: type || 'announce',
        message: message.trim(),
        eventTime: eventTime || null,
        duration: duration || '24h',
        address: address || null,
        ownerName: user.username,
        ownerId: user.userId || socket.id,
      });
      // All users currently viewing this spot get the pulse immediately
      io.to(`place:${placeId}`).emit('spot_pulse_added', { placeId, pulse });
      // Broadcast to all so explore lists can show the pulse ring
      io.emit('pulse_dropped', { placeId, pulse });
      socket.emit('spot_pulses', { placeId, pulses: getActivePulsesForSpot(placeId) });
    });

    socket.on('get_spot_pulses', ({ placeId }) => {
      socket.emit('spot_pulses', { placeId, pulses: getActivePulsesForSpot(placeId) });
    });

    socket.on('remove_pulse', ({ pulseId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      const removed = removePulse(pulseId, user.userId || socket.id);
      if (removed) socket.emit('pulse_removed', { pulseId });
    });

    socket.on('get_all_active_pulses', () => {
      socket.emit('all_active_pulses', getAllActivePulses());
    });

    // ── VENUE LIVE ──

    socket.on('venue_go_live', ({ placeId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      setVenueLive(placeId, true, { username: user.username, country: user.country, socketId: socket.id });
      io.emit('venue_live_update', { placeId, isLive: true, host: user.username, country: user.country });
    });

    socket.on('venue_end_live', ({ placeId }) => {
      setVenueLive(placeId, false);
      io.emit('venue_live_update', { placeId, isLive: false });
    });

    // ── GIFTS ──

    socket.on('send_gift', async ({ toSocketId, gift }) => {
      const sender = connectedUsers[socket.id];
      const recipient = connectedUsers[toSocketId];
      if (!sender || !recipient) return;

      const giftMessage = {
        id: uuidv4(),
        type: 'gift',
        senderId: sender.userId || socket.id,
        senderName: sender.username,
        senderCountry: sender.country,
        gift,
        timestamp: Date.now(),
      };

      // Notify recipient
      io.to(toSocketId).emit('gift_received', giftMessage);
      // Confirm back to sender
      socket.emit('gift_sent', giftMessage);
    });

    socket.on('send_group_gift', async ({ categoryId, roomName, gift }) => {
      const sender = connectedUsers[socket.id];
      if (!sender) return;
      const roomKey = `${categoryId}:${roomName}`;
      io.to(roomKey).emit('group_gift', {
        id: uuidv4(),
        type: 'gift',
        senderId: socket.id,
        senderName: sender.username,
        senderCountry: sender.country,
        gift,
        timestamp: Date.now(),
      });
    });

    // ── UPDATE SOCIAL LINKS ──

    socket.on('update_socials', ({ socials }) => {
      if (connectedUsers[socket.id]) {
        connectedUsers[socket.id].socials = socials || {};
        io.emit('user_list', Object.values(connectedUsers));
      }
    });

    // ── MOOD STATUS ──

    socket.on('set_mood', ({ mood, status }) => {
      if (connectedUsers[socket.id]) {
        connectedUsers[socket.id].mood = mood || '';
        connectedUsers[socket.id].status = status || '';
        io.emit('user_list', Object.values(connectedUsers));
      }
    });

    // ── DAILY ICEBREAKER ──

    socket.on('get_icebreaker', async () => {
      const user = connectedUsers[socket.id];
      const { index, question } = getTodaysQuestion();
      const viewerId = user?.userId || socket.id;
      const responses = await getResponses(index, viewerId);
      socket.emit('icebreaker_data', { index, question, responses });
    });

    socket.on('submit_icebreaker', async ({ text }) => {
      const user = connectedUsers[socket.id];
      if (!user || !text?.trim()) return;
      const { index } = getTodaysQuestion();
      await addResponse(index, {
        userId:    user.userId || socket.id,
        username:  user.username,
        country:   user.country,
        language:  user.language,
        photo_url: user.photo_url || null,
        text:      text.trim(),
      });
      const responses = await getResponses(index);
      io.emit('icebreaker_responses', { index, responses });
    });

    socket.on('like_icebreaker_response', async ({ responseId }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId) return;
      const ownerId = await getResponseOwner(responseId);
      if (ownerId && user.userId && await isBlockedEitherWay(user.userId, ownerId)) return;
      const { index } = getTodaysQuestion();
      await likeResponse(index, responseId, user.userId || socket.id);
      const responses = await getResponses(index);
      io.emit('icebreaker_responses', { index, responses });
      // Notify response owner
      const resp = responses.find(r => r.id === responseId);
      if (resp?.userId && resp.userId !== (user.userId || socket.id)) {
        const ownerSid = findSocketId(resp.userId);
        if (ownerSid) {
          io.to(ownerSid).emit('icebreaker_response_liked', {
            fromId: user.userId || socket.id,
            fromName: user.username,
            fromCountry: user.country,
          });
        }
      }
    });

    socket.on('add_icebreaker_comment', async ({ responseId, text }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId || !text?.trim()) return;
      const ownerId = await getResponseOwner(responseId);
      if (ownerId && user.userId && await isBlockedEitherWay(user.userId, ownerId)) return;
      const { index } = getTodaysQuestion();
      await addIcebreakerComment(index, responseId, {
        userId:    user.userId || socket.id,
        username:  user.username,
        country:   user.country,
        language:  user.language,
        photo_url: user.photo_url || null,
        text:      text.trim(),
      });
      const responses = await getResponses(index);
      io.emit('icebreaker_responses', { index, responses });
      // Notify response owner
      const resp = responses.find(r => r.id === responseId);
      if (resp?.userId && resp.userId !== (user.userId || socket.id)) {
        const ownerSid = findSocketId(resp.userId);
        if (ownerSid) {
          io.to(ownerSid).emit('icebreaker_response_commented', {
            fromId: user.userId || socket.id,
            fromName: user.username,
            fromCountry: user.country,
            preview: text.trim().slice(0, 60),
          });
        }
      }
    });

    socket.on('like_icebreaker_comment', async ({ responseId, commentId }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId || !commentId) return;
      const ownerId = await getCommentOwner(commentId);
      if (ownerId && user.userId && await isBlockedEitherWay(user.userId, ownerId)) return;
      const { index } = getTodaysQuestion();
      await likeIcebreakerComment(index, responseId, commentId, user.userId || socket.id);
      const responses = await getResponses(index);
      io.emit('icebreaker_responses', { index, responses });
    });

    socket.on('delete_icebreaker_comment', async ({ responseId, commentId }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId || !commentId) return;
      const { index } = getTodaysQuestion();
      const deleted = await deleteIcebreakerComment(index, responseId, commentId, user.userId || socket.id);
      if (deleted) {
        const responses = await getResponses(index);
        io.emit('icebreaker_responses', { index, responses });
      }
    });

    socket.on('delete_icebreaker_response', async ({ responseId }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId) return;
      const { index } = getTodaysQuestion();
      const deleted = await deleteIcebreakerResponse(index, responseId, user.userId || socket.id);
      if (deleted) {
        const responses = await getResponses(index);
        io.emit('icebreaker_responses', { index, responses });
      }
    });

    // ── RANDOM WORLD CONNECT ──

    function cancelRandomSearch(id) {
      const idx = randomConnectQueue.indexOf(id);
      if (idx !== -1) randomConnectQueue.splice(idx, 1);
      clearTimeout(randomConnectTimers[id]);
      delete randomConnectTimers[id];
    }

    socket.on('join_random_connect', ({ genderPref = 'any' } = {}) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      user.genderPref = genderPref; // store on session for mutual check

      function normGender(s) {
        const v = (s || '').toLowerCase().trim();
        if (v === 'male' || v === 'man') return 'male';
        if (v === 'female' || v === 'woman') return 'female';
        return null;
      }
      function prefOk(pref, gender) {
        if (!pref || pref === 'any') return true;
        const g = normGender(gender);
        return !g || g === pref; // if no gender set, don't exclude
      }

      // Find someone in the queue from a different country whose gender prefs align mutually
      const matchIndex = randomConnectQueue.findIndex(id => {
        const other = connectedUsers[id];
        if (!other || other.country === user.country || id === socket.id) return false;
        return prefOk(user.genderPref, other.gender) && prefOk(other.genderPref, user.gender);
      });

      if (matchIndex !== -1) {
        const matchedId = randomConnectQueue.splice(matchIndex, 1)[0];
        clearTimeout(randomConnectTimers[matchedId]);
        delete randomConnectTimers[matchedId];

        const matched = connectedUsers[matchedId];
        if (!matched) {
          if (!randomConnectQueue.includes(socket.id)) randomConnectQueue.push(socket.id);
          socket.emit('random_waiting');
          return;
        }

        const roomKey = `random:${[socket.id, matchedId].sort().join(':')}`;
        socket.join(roomKey);
        io.sockets.sockets.get(matchedId)?.join(roomKey);

        socket.emit('random_match', { matchedUser: { ...matched, userId: matched.userId }, roomKey });
        io.to(matchedId).emit('random_match', { matchedUser: { ...user, userId: user.userId }, roomKey });
      } else {
        // Add to queue and start a 30-second timeout
        if (!randomConnectQueue.includes(socket.id)) randomConnectQueue.push(socket.id);
        socket.emit('random_waiting');

        randomConnectTimers[socket.id] = setTimeout(() => {
          cancelRandomSearch(socket.id);
          socket.emit('random_timeout');
        }, 30000);
      }
    });

    socket.on('leave_random_connect', () => {
      cancelRandomSearch(socket.id);
      socket.emit('random_cancelled');
    });

    socket.on('random_message', async ({ roomKey, text }) => {
      const sender = connectedUsers[socket.id];
      if (!sender) return;

      const socketsInRoom = await io.in(roomKey).fetchSockets();
      const message = {
        id: uuidv4(),
        senderId: socket.id,
        senderName: sender.username,
        senderCountry: sender.country,
        senderLanguage: sender.language,
        originalText: text,
        timestamp: Date.now(),
      };

      for (const s of socketsInRoom) {
        const recipient = connectedUsers[s.id];
        if (!recipient) continue;
        let displayText = text;
        if (recipient.language && recipient.language !== sender.language) {
          const result = await translateText(text, recipient.language);
          displayText = result.translatedText;
        }
        s.emit('random_message', { ...message, text: displayText, wasTranslated: displayText !== text });
      }
    });

    // ── VIRTUAL EVENTS ──

    socket.on('get_events', async () => {
      socket.emit('events_list', await getEvents());
    });

    socket.on('create_event', async ({ title, type, description, scheduledFor, maxAttendees, language }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId) return;
      const event = await createEvent({ title, type, description, scheduledFor, maxAttendees, language, hostUserId: user.userId, hostName: user.username, hostCountry: user.country });
      io.emit('events_list', await getEvents());
      socket.emit('event_created', event);
    });

    socket.on('join_event', async ({ eventId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId) return;
      const event = await joinEvent(eventId, user);
      if (!event) return socket.emit('event_error', 'Event full or not found');
      socket.join(`event:${eventId}`);
      const history = await getEventMessages(eventId);
      socket.emit('event_history', { eventId, messages: history });
      io.to(`event:${eventId}`).emit('event_updated', event);
      io.emit('events_list', await getEvents());
    });

    socket.on('leave_event', async ({ eventId }) => {
      const userId = connectedUsers[socket.id]?.userId;
      await leaveEvent(eventId, userId);
      socket.leave(`event:${eventId}`);
      io.to(`event:${eventId}`).emit('event_updated', await getEventById(eventId));
      io.emit('events_list', await getEvents());
    });

    socket.on('event_message', async ({ eventId, text }) => {
      const sender = connectedUsers[socket.id];
      if (!sender) return;

      const message = {
        id: uuidv4(),
        senderId: socket.id,
        senderUserId: sender.userId || null,
        senderName: sender.username,
        senderCountry: sender.country,
        senderLanguage: sender.language,
        originalText: text,
        timestamp: Date.now(),
      };
      await addEventMessage(eventId, message);

      const socketsInRoom = await io.in(`event:${eventId}`).fetchSockets();
      for (const s of socketsInRoom) {
        const recipient = connectedUsers[s.id];
        if (!recipient) continue;
        let displayText = text;
        if (recipient.language && recipient.language !== sender.language) {
          const result = await translateText(text, recipient.language);
          displayText = result.translatedText;
        }
        s.emit('event_message', { ...message, text: displayText, wasTranslated: displayText !== text });
      }
    });

    // ── CULTURAL POSTS ──

    socket.on('get_cultural_posts', async () => {
      socket.emit('cultural_posts', await getCulturalPosts());
    });

    // userId must be the real, verified account id (not socket.id) — it's a
    // UUID foreign key into users(id) now that posts are persisted.
    socket.on('submit_cultural_post', async ({ text, emoji, category }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !text?.trim()) return;
      await createCulturalPost({ userId: user.userId, username: user.username, country: user.country, language: user.language, text: text.trim(), emoji, category });
      io.emit('cultural_posts', await getCulturalPosts());
    });

    socket.on('like_cultural_post', async ({ postId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !postId) return;
      await likePost(postId, user.userId);
      io.emit('cultural_posts', await getCulturalPosts());
    });

    // ── PHOTOS ──

    socket.on('get_photos', async () => {
      socket.emit('photos_feed', await getPhotos());
    });

    // All of these require a real, verified userId now — photo_likes/
    // photo_comments/photo_echos are UUID foreign keys into users(id), and a
    // raw socket.id (used previously) would never match on delete/ownership
    // checks anyway.
    socket.on('like_photo', async ({ photoId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !photoId) return;
      const target = await getPhotoById(photoId);
      if (target?.userId && await isBlockedEitherWay(user.userId, target.userId)) return;
      const photo = await toggleLike(photoId, user.userId, user.username);
      if (photo) {
        io.emit('photo_updated', photo);
        // Notify owner (skip self-likes)
        if (photo.userId && photo.userId !== user.userId) {
          const ownerSid = findSocketId(photo.userId);
          if (ownerSid) {
            io.to(ownerSid).emit('photo_liked', {
              fromId: user.userId,
              fromName: user.username,
              fromCountry: user.country,
              photoId,
            });
          }
        }
      }
    });

    socket.on('comment_photo', async ({ photoId, text }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !text?.trim()) return;
      const target = await getPhotoById(photoId);
      if (target?.userId && await isBlockedEitherWay(user.userId, target.userId)) return;
      const photo = await addComment(photoId, {
        userId: user.userId,
        username: user.username,
        country: user.country,
        text: text.trim(),
      });
      if (photo) {
        io.emit('photo_updated', photo);
        // Notify owner (skip self-comments)
        if (photo.userId && photo.userId !== user.userId) {
          const ownerSid = findSocketId(photo.userId);
          if (ownerSid) {
            io.to(ownerSid).emit('photo_commented', {
              fromId: user.userId,
              fromName: user.username,
              fromCountry: user.country,
              photoId,
              preview: text.trim().slice(0, 60),
            });
          }
        }
      }
    });

    socket.on('delete_photo', async ({ photoId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !photoId) return;
      const deleted = await deletePhoto(photoId, user.userId);
      if (deleted) io.emit('photos_feed', await getPhotos());
    });

    socket.on('echo_photo', async ({ photoId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !photoId) return;
      const uid = user.userId;
      const target = await getPhotoById(photoId);
      if (target?.userId && await isBlockedEitherWay(uid, target.userId)) return;
      const photo = await toggleEcho(photoId, uid, user.username, user.country);
      if (photo) {
        io.emit('photo_updated', photo);
        // Notify owner (skip self-echos)
        if (photo.userId && photo.userId !== uid) {
          const ownerSid = findSocketId(photo.userId);
          if (ownerSid) {
            io.to(ownerSid).emit('photo_echoed', {
              fromId: uid,
              fromName: user.username,
              fromCountry: user.country,
              photoId,
            });
          }
        }
      }
    });

    // ── STORIES ──

    socket.on('get_stories', async () => {
      socket.emit('stories_updated', await getStoriesGrouped());
    });

    socket.on('view_story', async ({ storyId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !storyId) return;
      const target = await getStoryById(storyId);
      if (target?.userId && await isBlockedEitherWay(user.userId, target.userId)) return;
      await viewStory(storyId, user.userId);
    });

    socket.on('delete_story', async ({ storyId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !storyId) return;
      const deleted = await deleteStory(storyId, user.userId);
      if (deleted) io.emit('stories_updated', await getStoriesGrouped());
    });

    // ── LIVE STREAMS ──

    socket.on('get_live_streams', () => {
      socket.emit('live_streams', Object.values(liveStreams).map(s => ({
        ...s, viewerCount: s.viewerIds.size,
      })));
    });

    socket.on('go_live', async ({ title, category, thumbnail }) => {
      const user = connectedUsers[socket.id];
      if (!user || !user.username) {
        socket.emit('go_live_error', { reason: 'not_registered' });
        return;
      }

      // End any existing stream from this socket
      if (liveStreams[socket.id]) {
        const prev = liveStreams[socket.id];
        io.to(`live:${socket.id}`).emit('live_ended', { streamId: socket.id });
        delete liveStreams[socket.id];
        // Remove old viewers from room
        const prevSockets = await io.in(`live:${socket.id}`).fetchSockets();
        prevSockets.forEach(s => s.leave(`live:${socket.id}`));
      }

      const sessionId = uuidv4();
      liveStreams[socket.id] = {
        streamId:    socket.id,
        sessionId,
        hostSocketId: socket.id,
        hostName:    user.username,
        hostUserId:  user.userId || null,
        hostCountry: user.country,
        hostPhoto:   user.photo_url || null,
        title:       title || `${user.username}'s Live`,
        category:    category || 'general',
        thumbnail:   thumbnail || null,
        viewerIds:      new Set(),
        uniqueViewerIds:new Set(),
        messages:       [],
        startedAt:      Date.now(),
        peakViewers:    0,
        giftCount:      0,   // incremented on each verified gift received
      };

      // Record session start in DB (tamper-proof — server sets started_at)
      if (user.userId) {
        dbQuery(
          `INSERT INTO stream_sessions (id, user_id, stream_socket_id, started_at, year)
           VALUES ($1, $2, $3, NOW(), $4)`,
          [sessionId, user.userId, socket.id, currentYear()]
        ).catch(e => console.warn('[Stream] session insert error:', e.message));
      }

      socket.join(`live:${socket.id}`);
      io.emit('live_streams', Object.values(liveStreams).map(s => ({
        ...s, viewerCount: s.viewerIds.size,
      })));
      socket.emit('live_started', { streamId: socket.id });
      console.log(`[Live] ${user.username} went live`);
    });

    // Shared stream-end logic — called from end_live and disconnect
    async function finalizeStream(stream) {
      if (!stream) return;
      const userId = stream.hostUserId;
      const durationMs      = Date.now() - stream.startedAt;
      const durationMinutes = Math.floor(durationMs / 60000);
      const durationHours   = durationMinutes / 60;
      const uniqueViewers   = stream.uniqueViewerIds?.size || 0;
      const qualifies       = durationMinutes >= 300; // 5 hours minimum

      if (userId && stream.sessionId) {
        const giftCount = stream.giftCount || 0;
        const bondHeat  = (stream.peakViewers || 0) + giftCount * 5;

        // Update session record with end time, duration, viewer counts, heat
        await dbQuery(
          `UPDATE stream_sessions
           SET ended_at = NOW(), duration_minutes = $1,
               peak_viewers = $2, total_unique_viewers = $3,
               counted_for_yearly = $4, gift_count = $5, bond_heat = $6
           WHERE id = $7`,
          [durationMinutes, stream.peakViewers || 0, uniqueViewers, qualifies,
           giftCount, bondHeat, stream.sessionId]
        ).catch(e => console.warn('[Stream] session update error:', e.message));

        // Always accumulate hours, viewers, and bond heat (all challenges)
        const progressUpdate = {
          stream_hours:    parseFloat(durationHours.toFixed(2)),
          total_viewers:   uniqueViewers,
          total_bond_heat: bondHeat,
        };
        // World Streamer only counts 5+ hr sessions
        if (qualifies) progressUpdate.streams_completed = 1;

        await upsertYearlyProgress(userId, progressUpdate);
      }
    }

    socket.on('end_live', async () => {
      const stream = liveStreams[socket.id];
      if (!stream) return;
      await finalizeStream(stream);
      io.to(`live:${socket.id}`).emit('live_ended', { streamId: socket.id });
      delete liveStreams[socket.id];
      io.emit('live_streams', Object.values(liveStreams).map(s => ({
        ...s, viewerCount: s.viewerIds.size,
      })));
      console.log(`[Live] ${connectedUsers[socket.id]?.username} ended live`);
    });

    socket.on('join_live', async ({ streamId }) => {
      const stream = liveStreams[streamId];
      if (!stream) return socket.emit('live_error', 'Stream not found or ended');
      const viewer = connectedUsers[socket.id];
      if (await isBlockedEitherWay(viewer?.userId, stream.hostUserId)) {
        return socket.emit('live_error', 'Stream not found or ended');
      }
      stream.viewerIds.add(socket.id);
      stream.uniqueViewerIds = stream.uniqueViewerIds || new Set();
      if (viewer?.userId) stream.uniqueViewerIds.add(viewer.userId);
      if (stream.viewerIds.size > (stream.peakViewers || 0)) {
        stream.peakViewers = stream.viewerIds.size;
      }
      socket.join(`live:${streamId}`);

      // Send recent messages + stream info
      socket.emit('live_joined', {
        stream: { ...stream, viewerCount: stream.viewerIds.size },
        messages: stream.messages.slice(-50),
      });

      // Notify everyone of updated viewer count
      io.to(`live:${streamId}`).emit('live_viewer_count', {
        streamId, count: stream.viewerIds.size,
      });

      // Tell host someone joined
      io.to(streamId).emit('live_viewer_joined', {
        viewerId: viewer?.userId || socket.id,
        viewerName: viewer?.username || 'Someone',
        viewerCountry: viewer?.country || '',
        count: stream.viewerIds.size,
      });
    });

    socket.on('leave_live', ({ streamId }) => {
      const stream = liveStreams[streamId];
      if (stream) {
        stream.viewerIds.delete(socket.id);
        io.to(`live:${streamId}`).emit('live_viewer_count', {
          streamId, count: stream.viewerIds.size,
        });
      }
      socket.leave(`live:${streamId}`);
    });

    socket.on('live_message', async ({ streamId, text }) => {
      const sender = connectedUsers[socket.id];
      const stream = liveStreams[streamId];
      if (!sender || !stream || !text?.trim()) return;
      if (await isBlockedEitherWay(sender.userId, stream.hostUserId)) return;

      const message = {
        id:           uuidv4(),
        senderId:     socket.id,
        senderName:   sender.username,
        senderCountry:sender.country,
        originalText: text.trim(),
        timestamp:    Date.now(),
      };

      stream.messages.push(message);
      if (stream.messages.length > 200) stream.messages.shift();

      // Translate for each recipient in the room
      const socketsInRoom = await io.in(`live:${streamId}`).fetchSockets();
      for (const s of socketsInRoom) {
        const recipient = connectedUsers[s.id];
        if (!recipient) continue;
        let displayText = message.originalText;
        if (recipient.language && recipient.language !== sender.language) {
          const result = await translateText(message.originalText, recipient.language);
          displayText = result.translatedText;
        }
        s.emit('live_message', { ...message, text: displayText, wasTranslated: displayText !== message.originalText });
      }
    });

    socket.on('kick_viewer', ({ streamId, viewerSocketId }) => {
      const stream = liveStreams[streamId];
      if (!stream) return;
      if (stream.hostSocketId !== socket.id) return;

      const viewerSocket = io.sockets.sockets.get(viewerSocketId);
      if (viewerSocket) {
        viewerSocket.emit('live_kicked', { streamId });
        viewerSocket.leave(`live:${streamId}`);
      }

      stream.viewerIds.delete(viewerSocketId);

      io.to(`live:${streamId}`).emit('live_viewer_count', {
        streamId, count: stream.viewerIds.size,
      });
    });

    socket.on('live_reaction', ({ streamId, emoji }) => {
      const user = connectedUsers[socket.id];
      if (!user || !liveStreams[streamId]) return;
      io.to(`live:${streamId}`).emit('live_reaction', {
        emoji,
        fromName: user.username,
        fromSocketId: socket.id,
      });
    });

    socket.on('live_gift', async ({ streamId, gift }) => {
      const sender = connectedUsers[socket.id];
      const stream = liveStreams[streamId];
      if (!sender || !stream) return;

      // Rate limit: 30 gifts per minute per sender
      if (!checkGiftRate(socket.id)) return;

      // Validate gift type against server catalog — client cannot set coin values
      const catalogGift = gift?.id ? GIFT_CATALOG[gift.id] : null;
      if (!catalogGift) return; // unknown or tampered gift type — silently drop

      // Always use the server-side coin value, never the client-sent value
      const verifiedGift = { ...catalogGift };

      // Real coins only move for JWT-verified senders gifting a real, distinct
      // host — an unverified socket-claimed identity can't be trusted to debit.
      if (!sender.verified || !sender.userId || !stream.hostUserId || stream.hostUserId === sender.userId) {
        return;
      }

      const transfer = await transferGiftCoins({
        senderId:        sender.userId,
        recipientId:     stream.hostUserId,
        coins:           verifiedGift.coins,
        giftId:          verifiedGift.id,
        streamSessionId: stream.sessionId,
      });
      if (!transfer.ok) {
        if (transfer.reason === 'insufficient_balance') {
          socket.emit('live_gift_error', { reason: 'insufficient_balance', giftId: verifiedGift.id, coins: verifiedGift.coins });
        }
        return;
      }

      io.to(`live:${streamId}`).emit('live_gift_received', {
        senderId:      socket.id,
        senderName:    sender.username,
        senderCountry: sender.country || '',
        gift:          verifiedGift,
      });

      // Count gift toward session Bond Heat (server-tracked, never client-set)
      stream.giftCount = (stream.giftCount || 0) + 1;

      // Track Gift Legend progress: accumulate BC received for the stream host
      upsertYearlyProgress(stream.hostUserId, { gifts_received_bc: verifiedGift.coins });

      // Pay any active Country Stamp / Bond Monument holders their passive
      // royalty on this gift — real coins, credited straight to their balance.
      payCollectibleRoyalties(stream.hostUserId, verifiedGift.coins).catch(e =>
        console.warn('[Collectibles] royalty error:', e.message)
      );
    });

    // ── FOLLOWS ──

    // followerId requires a real, verified userId — a raw socket.id isn't a
    // followable account and can't be stored in user_follows (UUID FK).
    socket.on('follow_user', async ({ targetUserId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !targetUserId || targetUserId === user.userId) return;
      const followerId = user.userId;
      await followUser(followerId, targetUserId);
      socket.emit('follow_status', { targetUserId, following: true, followersCount: (await getFollowers(targetUserId)).length });
      socket.emit('following_list', { following: await getFollowing(followerId) });
      // Notify the target if online
      const targetSocket = Object.values(connectedUsers).find(u => (u.userId || u.socketId) === targetUserId);
      if (targetSocket) {
        io.to(targetSocket.socketId).emit('new_follower', { followerId, followerName: user.username, followerCountry: user.country });
      }
    });

    socket.on('unfollow_user', async ({ targetUserId }) => {
      const user = connectedUsers[socket.id];
      if (!user?.userId || !targetUserId) return;
      const followerId = user.userId;
      await unfollowUser(followerId, targetUserId);
      socket.emit('follow_status', { targetUserId, following: false, followersCount: (await getFollowers(targetUserId)).length });
      socket.emit('following_list', { following: await getFollowing(followerId) });
    });

    socket.on('get_follow_status', async ({ targetUserId }) => {
      const followerId = connectedUsers[socket.id]?.userId;
      if (!followerId || !targetUserId) return;
      socket.emit('follow_status', {
        targetUserId,
        following: await isFollowing(followerId, targetUserId),
        followersCount: (await getFollowers(targetUserId)).length,
        followingCount: (await getFollowing(targetUserId)).length,
      });
    });

    socket.on('get_followers', async ({ userId }) => {
      if (!userId) return;
      socket.emit('followers_list', { userId, followers: await getFollowers(userId) });
    });

    socket.on('get_following', async () => {
      const followerId = connectedUsers[socket.id]?.userId;
      if (!followerId) return;
      socket.emit('following_list', { following: await getFollowing(followerId) });
    });

    // ── COUNTRY FLAGS (Plant / Uproot) ─────────────────────────────────
    socket.on('plant_flag', ({ country }) => {
      if (!country) return;
      const key = normalizeCountry(country);
      if (!countryFlags[key]) countryFlags[key] = new Set();
      countryFlags[key].add(socket.id);
      if (!socketCountries[socket.id]) socketCountries[socket.id] = new Set();
      socketCountries[socket.id].add(key);
      io.emit('country_flag_count', { country, count: countryFlags[key].size });
    });

    socket.on('uproot_flag', ({ country }) => {
      if (!country) return;
      const key = normalizeCountry(country);
      countryFlags[key]?.delete(socket.id);
      socketCountries[socket.id]?.delete(key);
      io.emit('country_flag_count', { country, count: countryFlags[key]?.size || 0 });
    });

    socket.on('get_country_flag_count', ({ country }) => {
      const key = normalizeCountry(country);
      socket.emit('country_flag_count', { country, count: countryFlags[key]?.size || 0 });
    });

    // Disconnect

    // ── Yearly challenge progress (server-authoritative) ──────────────────────
    socket.on('get_yearly_challenge', () => {
      // Challenges are defined client-side; server just confirms the channel is live
      socket.emit('yearly_challenge', null);
    });

    socket.on('get_challenge_progress', async () => {
      const user = connectedUsers[socket.id];
      if (!user?.userId) return socket.emit('challenge_progress', {});
      try {
        const { rows } = await dbQuery(
          `SELECT streams_completed, stream_hours, total_viewers,
                  stamp_wins, monument_wins, gifts_received_bc, total_bond_heat
           FROM yearly_challenge_progress
           WHERE user_id = $1 AND year = $2`,
          [user.userId, currentYear()]
        );
        const row = rows[0] || {};
        socket.emit('challenge_progress', {
          worldStreamer: row.streams_completed   || 0,
          globeTrotter:  (row.stamp_wins || 0) + (row.monument_wins || 0),
          bondMarathon:  parseFloat(row.stream_hours || 0),
          bondElite:     row.total_viewers       || 0,
          giftLegend:    row.gifts_received_bc   || 0,
          bondInferno:   row.total_bond_heat     || 0,
        });
      } catch (e) {
        console.warn('[Yearly] progress fetch error:', e.message);
        socket.emit('challenge_progress', {});
      }
    });

    socket.on('disconnect', async () => {
      delete socketGiftCounts[socket.id]; // clean up rate tracker
      // End live stream if host disconnects — finalize session stats
      if (liveStreams[socket.id]) {
        await finalizeStream(liveStreams[socket.id]);
        io.to(`live:${socket.id}`).emit('live_ended', { streamId: socket.id });
        delete liveStreams[socket.id];
        io.emit('live_streams', Object.values(liveStreams).map(s => ({
          ...s, viewerCount: s.viewerIds.size,
        })));
      }
      // Remove as viewer from any stream
      Object.values(liveStreams).forEach(stream => {
        if (stream.viewerIds.has(socket.id)) {
          stream.viewerIds.delete(socket.id);
          io.to(`live:${stream.streamId}`).emit('live_viewer_count', {
            streamId: stream.streamId, count: stream.viewerIds.size,
          });
        }
      });
      delete connectedUsers[socket.id];
      io.emit('user_list', Object.values(connectedUsers));
      const qIdx = randomConnectQueue.indexOf(socket.id);
      if (qIdx !== -1) randomConnectQueue.splice(qIdx, 1);
      // Clean up planted flags (keys are already normalized)
      if (socketCountries[socket.id]) {
        socketCountries[socket.id].forEach(key => countryFlags[key]?.delete(socket.id));
        delete socketCountries[socket.id];
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocket };
