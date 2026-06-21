const { v4: uuidv4 } = require('uuid');
const { translateText } = require('./translate');
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
const { getTodaysQuestion, addResponse, getResponses, likeResponse, addComment: addIcebreakerComment, likeComment: likeIcebreakerComment, deleteComment: deleteIcebreakerComment, deleteResponse: deleteIcebreakerResponse } = require('./icebreaker');
const { createEvent, getEvents, getEventById, joinEvent, leaveEvent, addEventMessage, getEventMessages } = require('./events');
const { createCulturalPost, likePost, getCulturalPosts } = require('./culturalPosts');
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
const directMessageHistory = {};
const randomConnectQueue = []; // users waiting for a random match
const randomConnectTimers = {}; // socketId -> timeout handle
const liveStreams = {};        // streamId -> stream object

function getDMKey(userA, userB) {
  return [userA, userB].sort().join('::');
}

// Strip leading flag emoji so "🇯🇵 Japan" and "Japan" key the same bucket
function normalizeCountry(str = '') {
  return str.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]\s*/g, '').trim();
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register user with name, language, and optional social links
    socket.on('register', ({ username, display_name, language, country, socials, userId, photo_url, gender }) => {
      connectedUsers[socket.id] = {
        username:     display_name || username,
        display_name: display_name || username,
        language, country,
        socials:    socials || {},
        socketId:   socket.id,
        userId,
        photo_url,
        gender,
      };
      socket.emit('registered', { socketId: socket.id });
      io.emit('user_list', Object.values(connectedUsers));
      console.log(`Registered: ${username} (${language}, ${country})`);
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
      const history = getRoomHistory(categoryId, roomName);
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
        senderName: sender.username,
        senderCountry: sender.country,
        senderLanguage: sender.language,
        senderPhoto: sender.photo_url,
        originalText: text,
        timestamp: Date.now(),
        ...(imageUrl && { imageUrl }),
      };

      addMessageToRoom(categoryId, roomName, message);
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
    socket.on('direct_message', async ({ toSocketId, text, matchId, replyTo, imageUrl }) => {
      const sender = connectedUsers[socket.id];
      const recipient = connectedUsers[toSocketId];
      if (!sender || !recipient) return;

      // Update ghost score when a user responds to a match
      if (matchId && recordResponse && sender.userId) {
        recordResponse(sender.userId, matchId).catch(() => {});
      }

      let translatedText = text;
      if (recipient.language && recipient.language !== sender.language) {
        const result = await translateText(text, recipient.language);
        translatedText = result.translatedText;
      }

      const message = {
        id: uuidv4(),
        senderId: socket.id,
        senderName: sender.username,
        senderCountry: sender.country,
        originalText: text,
        text: translatedText,
        wasTranslated: translatedText !== text,
        timestamp: Date.now(),
        ...(replyTo  && { replyTo }),
        ...(imageUrl && { imageUrl }),
      };

      const dmKey = getDMKey(socket.id, toSocketId);
      if (!directMessageHistory[dmKey]) directMessageHistory[dmKey] = [];
      directMessageHistory[dmKey].push(message);
      if (directMessageHistory[dmKey].length > 100) directMessageHistory[dmKey].shift();

      // Send to recipient (translated) and back to sender (original)
      io.to(toSocketId).emit('direct_message', message);
      io.to(toSocketId).emit('new_message_notif', {
        fromId: socket.id,
        fromName: sender.username,
        fromCountry: sender.country,
        preview: (imageUrl ? '📷 Photo' : text).slice(0, 60),
      });
      socket.emit('direct_message', { ...message, text });
    });

    // Get DM history between two users
    socket.on('get_dm_history', ({ otherSocketId }) => {
      const dmKey = getDMKey(socket.id, otherSocketId);
      socket.emit('dm_history', directMessageHistory[dmKey] || []);
    });

    // WebRTC signaling for voice/video calls
    socket.on('call_user', ({ toSocketId, offer, callType }) => {
      const caller = connectedUsers[socket.id];
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

    socket.on('get_places', ({ country, city }) => {
      const places = getPlacesInCity(country, city).map(p => ({
        ...p,
        typeInfo: PLACE_TYPES[p.type] || { icon: '📍', label: p.type },
        checkinCount: getCheckins(p.id).length,
        isLive: getVenueLiveStatus(p.id).isLive,
        eventCount: getVenueEvents(p.id).length,
      }));
      socket.emit('places_list', { country, city, places });
    });

    socket.on('get_country_places', ({ country }) => {
      const places = getPlacesInCountry(country).map(p => ({
        ...p,
        typeInfo: PLACE_TYPES[p.type] || { icon: '📍', label: p.type },
        checkinCount: getCheckins(p.id).length,
        isLive: getVenueLiveStatus(p.id).isLive,
        eventCount: getVenueEvents(p.id).length,
      }));
      socket.emit('country_places_list', { country, places });
    });

    socket.on('get_spots_by_vibe', ({ type }) => {
      const places = getPlacesByType(type).map(p => ({
        ...p,
        typeInfo: PLACE_TYPES[p.type] || { icon: '📍', label: p.type },
        checkinCount: getCheckins(p.id).length,
        isLive: getVenueLiveStatus(p.id).isLive,
        eventCount: getVenueEvents(p.id).length,
      }));
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

    socket.on('get_icebreaker', () => {
      const user = connectedUsers[socket.id];
      const { index, question } = getTodaysQuestion();
      const viewerId = user?.userId || socket.id;
      const responses = getResponses(index, viewerId);
      socket.emit('icebreaker_data', { index, question, responses });
    });

    socket.on('submit_icebreaker', async ({ text }) => {
      const user = connectedUsers[socket.id];
      if (!user || !text?.trim()) return;
      const { index } = getTodaysQuestion();
      addResponse(index, {
        userId:    user.userId || socket.id,
        username:  user.username,
        country:   user.country,
        language:  user.language,
        photo_url: user.photo_url || null,
        text:      text.trim(),
      });
      const responses = getResponses(index);
      io.emit('icebreaker_responses', { index, responses });
    });

    socket.on('like_icebreaker_response', ({ responseId }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId) return;
      const { index } = getTodaysQuestion();
      likeResponse(index, responseId, user.userId || socket.id);
      const responses = getResponses(index);
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

    socket.on('add_icebreaker_comment', ({ responseId, text }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId || !text?.trim()) return;
      const { index } = getTodaysQuestion();
      addIcebreakerComment(index, responseId, {
        userId:    user.userId || socket.id,
        username:  user.username,
        country:   user.country,
        language:  user.language,
        photo_url: user.photo_url || null,
        text:      text.trim(),
      });
      const responses = getResponses(index);
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

    socket.on('like_icebreaker_comment', ({ responseId, commentId }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId || !commentId) return;
      const { index } = getTodaysQuestion();
      likeIcebreakerComment(index, responseId, commentId, user.userId || socket.id);
      const responses = getResponses(index);
      io.emit('icebreaker_responses', { index, responses });
    });

    socket.on('delete_icebreaker_comment', ({ responseId, commentId }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId || !commentId) return;
      const { index } = getTodaysQuestion();
      const deleted = deleteIcebreakerComment(index, responseId, commentId, user.userId || socket.id);
      if (deleted) {
        const responses = getResponses(index);
        io.emit('icebreaker_responses', { index, responses });
      }
    });

    socket.on('delete_icebreaker_response', ({ responseId }) => {
      const user = connectedUsers[socket.id];
      if (!user || !responseId) return;
      const { index } = getTodaysQuestion();
      const deleted = deleteIcebreakerResponse(index, responseId, user.userId || socket.id);
      if (deleted) {
        const responses = getResponses(index);
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

    socket.on('get_events', () => {
      socket.emit('events_list', getEvents());
    });

    socket.on('create_event', ({ title, type, description, scheduledFor, maxAttendees, language }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      const event = createEvent({ title, type, description, scheduledFor, maxAttendees, language, hostId: socket.id, hostName: user.username, hostCountry: user.country });
      io.emit('events_list', getEvents());
      socket.emit('event_created', event);
    });

    socket.on('join_event', ({ eventId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      const event = joinEvent(eventId, user);
      if (!event) return socket.emit('event_error', 'Event full or not found');
      socket.join(`event:${eventId}`);
      const history = getEventMessages(eventId);
      socket.emit('event_history', { eventId, messages: history });
      io.to(`event:${eventId}`).emit('event_updated', event);
      io.emit('events_list', getEvents());
    });

    socket.on('leave_event', ({ eventId }) => {
      leaveEvent(eventId, socket.id);
      socket.leave(`event:${eventId}`);
      io.to(`event:${eventId}`).emit('event_updated', getEventById(eventId));
      io.emit('events_list', getEvents());
    });

    socket.on('event_message', async ({ eventId, text }) => {
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
      addEventMessage(eventId, message);

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

    socket.on('get_cultural_posts', () => {
      socket.emit('cultural_posts', getCulturalPosts());
    });

    socket.on('submit_cultural_post', ({ text, emoji, category }) => {
      const user = connectedUsers[socket.id];
      if (!user || !text?.trim()) return;
      createCulturalPost({ userId: socket.id, username: user.username, country: user.country, language: user.language, text: text.trim(), emoji, category });
      io.emit('cultural_posts', getCulturalPosts());
    });

    socket.on('like_cultural_post', ({ postId }) => {
      likePost(postId, socket.id);
      io.emit('cultural_posts', getCulturalPosts());
    });

    // ── PHOTOS ──

    socket.on('get_photos', () => {
      socket.emit('photos_feed', getPhotos());
    });

    socket.on('like_photo', ({ photoId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      const photo = toggleLike(photoId, socket.id, user.username);
      if (photo) {
        io.emit('photo_updated', photo);
        // Notify owner (skip self-likes)
        if (photo.userId && photo.userId !== (user.userId || socket.id)) {
          const ownerSid = findSocketId(photo.userId);
          if (ownerSid) {
            io.to(ownerSid).emit('photo_liked', {
              fromId: user.userId || socket.id,
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
      if (!user || !text?.trim()) return;
      const photo = addComment(photoId, {
        userId: socket.id,
        username: user.username,
        country: user.country,
        text: text.trim(),
      });
      if (photo) {
        io.emit('photo_updated', photo);
        // Notify owner (skip self-comments)
        if (photo.userId && photo.userId !== (user.userId || socket.id)) {
          const ownerSid = findSocketId(photo.userId);
          if (ownerSid) {
            io.to(ownerSid).emit('photo_commented', {
              fromId: user.userId || socket.id,
              fromName: user.username,
              fromCountry: user.country,
              photoId,
              preview: text.trim().slice(0, 60),
            });
          }
        }
      }
    });

    socket.on('delete_photo', ({ photoId }) => {
      const deleted = deletePhoto(photoId, socket.id);
      if (deleted) io.emit('photos_feed', getPhotos());
    });

    socket.on('echo_photo', ({ photoId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      const uid = user.userId || socket.id;
      const photo = toggleEcho(photoId, uid, user.username, user.country);
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

    socket.on('get_stories', () => {
      socket.emit('stories_updated', getStoriesGrouped());
    });

    socket.on('view_story', ({ storyId }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;
      viewStory(storyId, socket.id);
    });

    socket.on('delete_story', ({ storyId }) => {
      const deleted = deleteStory(storyId, socket.id);
      if (deleted) io.emit('stories_updated', getStoriesGrouped());
    });

    // ── LIVE STREAMS ──

    socket.on('get_live_streams', () => {
      socket.emit('live_streams', Object.values(liveStreams).map(s => ({
        ...s, viewerCount: s.viewerIds.size,
      })));
    });

    socket.on('go_live', async ({ title, category, thumbnail }) => {
      const user = connectedUsers[socket.id];
      if (!user) return;

      // End any existing stream from this socket
      if (liveStreams[socket.id]) {
        const prev = liveStreams[socket.id];
        io.to(`live:${socket.id}`).emit('live_ended', { streamId: socket.id });
        delete liveStreams[socket.id];
        // Remove old viewers from room
        const prevSockets = await io.in(`live:${socket.id}`).fetchSockets();
        prevSockets.forEach(s => s.leave(`live:${socket.id}`));
      }

      liveStreams[socket.id] = {
        streamId:    socket.id,
        hostSocketId: socket.id,
        hostName:    user.username,
        hostCountry: user.country,
        hostPhoto:   user.photo_url || null,
        title:       title || `${user.username}'s Live`,
        category:    category || 'general',
        thumbnail:   thumbnail || null,
        viewerIds:   new Set(),
        messages:    [],
        startedAt:   Date.now(),
      };

      socket.join(`live:${socket.id}`);
      io.emit('live_streams', Object.values(liveStreams).map(s => ({
        ...s, viewerCount: s.viewerIds.size,
      })));
      socket.emit('live_started', { streamId: socket.id });
      console.log(`[Live] ${user.username} went live`);
    });

    socket.on('end_live', () => {
      const stream = liveStreams[socket.id];
      if (!stream) return;
      io.to(`live:${socket.id}`).emit('live_ended', { streamId: socket.id });
      delete liveStreams[socket.id];
      io.emit('live_streams', Object.values(liveStreams).map(s => ({
        ...s, viewerCount: s.viewerIds.size,
      })));
      console.log(`[Live] ${connectedUsers[socket.id]?.username} ended live`);
    });

    socket.on('join_live', ({ streamId }) => {
      const stream = liveStreams[streamId];
      if (!stream) return socket.emit('live_error', 'Stream not found or ended');
      stream.viewerIds.add(socket.id);
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
      const viewer = connectedUsers[socket.id];
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

    socket.on('live_reaction', ({ streamId, emoji }) => {
      const user = connectedUsers[socket.id];
      if (!user || !liveStreams[streamId]) return;
      io.to(`live:${streamId}`).emit('live_reaction', {
        emoji,
        fromName: user.username,
        fromSocketId: socket.id,
      });
    });

    // ── FOLLOWS ──

    socket.on('follow_user', ({ targetUserId }) => {
      const user = connectedUsers[socket.id];
      if (!user || targetUserId === socket.id) return;
      followUser(socket.id, targetUserId);
      socket.emit('follow_status', { targetUserId, following: true, followersCount: getFollowers(targetUserId).length });
      // Notify the target if they're online
      const targetSocket = Object.values(connectedUsers).find(u => u.socketId === targetUserId);
      if (targetSocket) {
        io.to(targetSocket.socketId).emit('new_follower', { followerId: user.userId || socket.id, followerName: user.username, followerCountry: user.country });
      }
    });

    socket.on('unfollow_user', ({ targetUserId }) => {
      unfollowUser(socket.id, targetUserId);
      socket.emit('follow_status', { targetUserId, following: false, followersCount: getFollowers(targetUserId).length });
    });

    socket.on('get_follow_status', ({ targetUserId }) => {
      socket.emit('follow_status', {
        targetUserId,
        following: isFollowing(socket.id, targetUserId),
        followersCount: getFollowers(targetUserId).length,
        followingCount: getFollowing(targetUserId).length,
      });
    });

    socket.on('get_followers', ({ userId }) => {
      socket.emit('followers_list', { userId, followers: getFollowers(userId) });
    });

    socket.on('get_following', ({ userId }) => {
      socket.emit('following_list', { userId, following: getFollowing(userId) });
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

    socket.on('disconnect', () => {
      // End live stream if host disconnects
      if (liveStreams[socket.id]) {
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
