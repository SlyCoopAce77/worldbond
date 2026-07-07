const { v4: uuidv4 } = require('uuid');
const { query: db } = require('./database/db');

const EVENT_TYPES = [
  { id: 'watch_party', label: 'Watch Party', icon: '🎬' },
  { id: 'game_night', label: 'Game Night', icon: '🎮' },
  { id: 'cooking', label: 'Cook Together', icon: '🍳' },
  { id: 'study', label: 'Study Together', icon: '📚' },
  { id: 'music', label: 'Music Sharing', icon: '🎵' },
  { id: 'language', label: 'Language Practice', icon: '🗣️' },
  { id: 'travel_talk', label: 'Travel Stories', icon: '✈️' },
  { id: 'workout', label: 'Workout Together', icon: '💪' },
  { id: 'art', label: 'Art & Drawing', icon: '🎨' },
  { id: 'just_chill', label: 'Just Chill', icon: '😎' },
];

const SELECT_EVENT = `
  SELECT e.id, e.title, e.type, e.description,
         e.scheduled_for AS "scheduledFor", e.max_attendees AS "maxAttendees",
         e.language, e.host_user_id AS "hostId", e.host_name AS "hostName",
         e.host_country AS "hostCountry", e.status,
         EXTRACT(EPOCH FROM e.created_at) * 1000 AS "createdAt",
         COALESCE(
           (SELECT json_agg(json_build_object('socketId', a.user_id, 'username', a.username, 'country', a.country))
            FROM event_attendees a WHERE a.event_id = e.id),
           '[]'
         ) AS attendees
  FROM virtual_events e
`;

function hydrate(row) {
  const typeInfo = EVENT_TYPES.find(t => t.id === row.type) || EVENT_TYPES[EVENT_TYPES.length - 1];
  return { ...row, typeInfo, createdAt: Number(row.createdAt), scheduledFor: Number(row.scheduledFor) };
}

async function createEvent({ title, type, description, scheduledFor, maxAttendees, language, hostId, hostUserId, hostName, hostCountry }) {
  const id = uuidv4();
  await db(
    `INSERT INTO virtual_events (id, title, type, description, scheduled_for, max_attendees, language, host_user_id, host_name, host_country)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, title, type, description, scheduledFor || Date.now(), maxAttendees || 20, language || 'any', hostUserId, hostName, hostCountry]
  );
  if (hostUserId) {
    await db(
      `INSERT INTO event_attendees (event_id, user_id, username, country) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [id, hostUserId, hostName, hostCountry]
    );
  }
  return getEventById(id);
}

async function getEvents() {
  const { rows } = await db(`${SELECT_EVENT} WHERE e.status != 'ended' ORDER BY e.scheduled_for ASC`);
  return rows.map(hydrate);
}

async function getEventById(id) {
  const { rows } = await db(`${SELECT_EVENT} WHERE e.id = $1`, [id]);
  return rows.length ? hydrate(rows[0]) : null;
}

async function joinEvent(eventId, user) {
  if (!user.userId) return null;
  const event = await getEventById(eventId);
  if (!event) return null;
  if (event.attendees.length >= event.maxAttendees) return null;
  await db(
    `INSERT INTO event_attendees (event_id, user_id, username, country) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    [eventId, user.userId, user.username, user.country]
  );
  return getEventById(eventId);
}

async function leaveEvent(eventId, userId) {
  if (!userId) return;
  await db(`DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2`, [eventId, userId]);
  const { rows } = await db(`SELECT COUNT(*)::INTEGER AS cnt FROM event_attendees WHERE event_id = $1`, [eventId]);
  if (rows[0].cnt === 0) {
    await db(`UPDATE virtual_events SET status = 'ended' WHERE id = $1`, [eventId]);
  }
}

async function addEventMessage(eventId, message) {
  await db(
    `INSERT INTO event_messages (id, event_id, sender_id, sender_name, sender_country, sender_language, text, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8 / 1000.0))`,
    [message.id, eventId, message.senderUserId || null, message.senderName, message.senderCountry, message.senderLanguage, message.originalText, message.timestamp]
  );
}

async function getEventMessages(eventId) {
  const { rows } = await db(
    `SELECT id, sender_id AS "senderUserId", sender_name AS "senderName", sender_country AS "senderCountry",
            sender_language AS "senderLanguage", text AS "originalText",
            EXTRACT(EPOCH FROM created_at) * 1000 AS timestamp
     FROM event_messages WHERE event_id = $1 ORDER BY created_at ASC LIMIT 200`,
    [eventId]
  );
  return rows.map(r => ({ ...r, timestamp: Number(r.timestamp) }));
}

module.exports = { EVENT_TYPES, createEvent, getEvents, getEventById, joinEvent, leaveEvent, addEventMessage, getEventMessages };
