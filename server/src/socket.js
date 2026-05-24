const { v4: uuidv4 } = require('uuid');
const { translateText } = require('./translate');
const { GROUP_CATEGORIES, addMessageToRoom, getRoomHistory } = require('./groups');
const {
  checkIn, checkOut, getCheckins,
  addPlaceMessage, getPlaceMessages, getPlaceById,
  addReview, getReviews, getAverageRating,
  getCountries, getCitiesInCountry, getPlacesInCity, PLACE_TYPES,
} = require('./places');
const { getTodaysQuestion, addResponse, getResponses } = require('./icebreaker');
const { createEvent, getEvents, getEventById, joinEvent, leaveEvent, addEventMessage, getEventMessages } = require('./events');
const { createCulturalPost, likePost, getCulturalPosts } = require('./culturalPosts');
const { toggleLike, addComment, deletePhoto, getPhotos } = require('./photos');
const { getStoriesGrouped, viewStory, deleteStory } = require('./stories');
const { followUser, unfollowUser, getFollowing, getFollowers, isFollowing } = require('./follows');

// Bond ghost score — only loaded when DB is available
let recordResponse = null;
if (process.env.DATABASE_URL) {
  try { ({ recordResponse } = require('./ghostScore/ghostScore.service')); } catch {}
}

const connectedUsers = {};
const directMessageHistory = {};
const randomConnectQueue = []; // users waiting for a random match
const liveStreams = {};        // streamId -> stream object

function getDMKey(userA, userB) {
  return [userA, userB].sort().join('::');
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register user with name, language, and optional social links
    socket.on('register', ({ username, display_name, language, country, socials, userId, photo_url }) => {
      connectedUsers[socket.id] = {
        username:     display_name || username,
        display_name: display_name || username,
        language, country,
        socials:    socials || {},
        socketId:   socket.id,
        userId,
        photo_url,
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
      }));
      socket.emit('places_list', { country, city, places });
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

    // ── GIFTS ──

    socket.on('send_gift', async ({ toSocketId, gift }) => {
      const sender = connectedUsers[socket.id];
      const recipient = connectedUsers[toSocketId];
      if (!sender || !recipient) return;

      const giftMessage = {
        id: uuidv4(),
        type: 'gift',
        senderId: socket.id,
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
      const { index, question } = getTodaysQuestion();
      const responses = getResponses(index);
      socket.emit('icebreaker_data', { index, question, responses });
    });

    socket.on('submit_icebreaker', async ({ text }) => {
      const user = connectedUsers[socket.id];
      if (!user || !text?.trim()) return;
      const { index, question } = getTodaysQuestion();

      let translatedTexts = {};
      // Store original; translation happens client-side per recipient
      addResponse(index, {
        userId: socket.id,
        username: user.username,
        country: user.country,
        language: user.language,
        text: text.trim(),
      });

      const responses = getResponses(index);
      io.emit('icebreaker_responses', { index, responses });
    });

    // ── RANDOM WORLD CONNECT ──

    socket.on('join_random_connect', () => {
      const user = connectedUsers[socket.id];
      if (!user) return;

      // Find someone in the queue from a different country
      const matchIndex = randomConnectQueue.findIndex(id => {
        const other = connectedUsers[id];
        return other && other.country !== user.country && id !== socket.id;
      });

      if (matchIndex !== -1) {
        const matchedId = randomConnectQueue.splice(matchIndex, 1)[0];
        const matched = connectedUsers[matchedId];
        if (!matched) {
          if (!randomConnectQueue.includes(socket.id)) randomConnectQueue.push(socket.id);
          socket.emit('random_waiting');
          return;
        }

        const roomKey = `random:${[socket.id, matchedId].sort().join(':')}`;
        socket.join(roomKey);
        io.sockets.sockets.get(matchedId)?.join(roomKey);

        socket.emit('random_match', { matchedUser: matched, roomKey });
        io.to(matchedId).emit('random_match', { matchedUser: user, roomKey });
      } else {
        // Add to queue
        if (!randomConnectQueue.includes(socket.id)) randomConnectQueue.push(socket.id);
        socket.emit('random_waiting');
      }
    });

    socket.on('leave_random_connect', () => {
      const idx = randomConnectQueue.indexOf(socket.id);
      if (idx !== -1) randomConnectQueue.splice(idx, 1);
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
      if (photo) io.emit('photo_updated', photo);
    });

    socket.on('comment_photo', async ({ photoId, text }) => {
      const user = connectedUsers[socket.id];
      if (!user || !text?.trim()) return;

      let displayText = text.trim();
      // Translate comment for... we keep original; clients display as-is
      const photo = addComment(photoId, {
        userId: socket.id,
        username: user.username,
        country: user.country,
        text: displayText,
      });
      if (photo) io.emit('photo_updated', photo);
    });

    socket.on('delete_photo', ({ photoId }) => {
      const deleted = deletePhoto(photoId, socket.id);
      if (deleted) io.emit('photos_feed', getPhotos());
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
      io.to(streamId).emit('live_viewer_joined', {
        viewerName: connectedUsers[socket.id]?.username || 'Someone',
        viewerCountry: connectedUsers[socket.id]?.country || '',
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
        io.to(targetSocket.socketId).emit('new_follower', { followerId: socket.id, followerName: user.username, followerCountry: user.country });
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
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocket };
