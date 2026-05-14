const { v4: uuidv4 } = require('uuid');

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

const events = {};
const eventMessages = {};

function createEvent({ title, type, description, scheduledFor, maxAttendees, language, hostId, hostName, hostCountry }) {
  const id = uuidv4();
  const typeInfo = EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[EVENT_TYPES.length - 1];
  events[id] = {
    id,
    title,
    type,
    typeInfo,
    description,
    scheduledFor: scheduledFor || Date.now(),
    maxAttendees: maxAttendees || 20,
    language: language || 'any',
    hostId,
    hostName,
    hostCountry,
    attendees: [{ socketId: hostId, username: hostName, country: hostCountry }],
    createdAt: Date.now(),
    status: 'upcoming',
  };
  eventMessages[id] = [];
  return events[id];
}

function getEvents() {
  return Object.values(events)
    .filter(e => e.status !== 'ended')
    .sort((a, b) => a.scheduledFor - b.scheduledFor);
}

function getEventById(id) {
  return events[id] || null;
}

function joinEvent(eventId, user) {
  const event = events[eventId];
  if (!event) return null;
  if (event.attendees.length >= event.maxAttendees) return null;
  const alreadyIn = event.attendees.some(a => a.socketId === user.socketId);
  if (!alreadyIn) {
    event.attendees.push({ socketId: user.socketId, username: user.username, country: user.country });
  }
  return event;
}

function leaveEvent(eventId, socketId) {
  const event = events[eventId];
  if (!event) return;
  event.attendees = event.attendees.filter(a => a.socketId !== socketId);
  if (event.attendees.length === 0) {
    event.status = 'ended';
  }
}

function addEventMessage(eventId, message) {
  if (!eventMessages[eventId]) eventMessages[eventId] = [];
  eventMessages[eventId].push(message);
  if (eventMessages[eventId].length > 200) eventMessages[eventId].shift();
}

function getEventMessages(eventId) {
  return eventMessages[eventId] || [];
}

module.exports = { EVENT_TYPES, createEvent, getEvents, getEventById, joinEvent, leaveEvent, addEventMessage, getEventMessages };
