const { v4: uuidv4 } = require('uuid');

const PULSE_TYPES = [
  { key: 'event',    label: 'Event' },
  { key: 'deal',     label: 'Deal' },
  { key: 'theme',    label: 'Theme Night' },
  { key: 'menu',     label: 'New Menu' },
  { key: 'announce', label: 'Announcement' },
];

const DURATIONS = {
  '24h':   24 * 60 * 60 * 1000,
  '48h':   48 * 60 * 60 * 1000,
  '1week':  7 * 24 * 60 * 60 * 1000,
  'manual': null,
};

const pulses = {};

function createPulse({ placeId, placeName, placeCountry, placeCity, type, message, eventTime, duration, address, ownerName, ownerId }) {
  const id = uuidv4();
  const ms = DURATIONS[duration] ?? DURATIONS['24h'];
  pulses[id] = {
    id,
    placeId,
    placeName,
    placeCountry,
    placeCity,
    address: (address || '').slice(0, 200) || null,
    type,
    message: (message || '').slice(0, 160),
    eventTime: eventTime || null,
    expiresAt: ms ? Date.now() + ms : null,
    postedAt: Date.now(),
    ownerName,
    ownerId,
  };
  return pulses[id];
}

function getActivePulsesForSpot(placeId) {
  const now = Date.now();
  return Object.values(pulses)
    .filter(p => p.placeId === placeId && (p.expiresAt === null || p.expiresAt > now))
    .sort((a, b) => b.postedAt - a.postedAt);
}

function getAllActivePulses() {
  const now = Date.now();
  return Object.values(pulses)
    .filter(p => p.expiresAt === null || p.expiresAt > now)
    .sort((a, b) => b.postedAt - a.postedAt);
}

function removePulse(id, ownerId) {
  if (pulses[id]?.ownerId === ownerId) { delete pulses[id]; return true; }
  return false;
}

module.exports = { PULSE_TYPES, createPulse, getActivePulsesForSpot, getAllActivePulses, removePulse };
