const apn = require('apn');
const { query: db } = require('./database/db');

let provider = null;
let warnedMissingConfig = false;

// Lazily build the APNs provider — env vars may not be set until the owner
// generates a real Auth Key in their Apple Developer account. Until then,
// sendPush() is a harmless no-op (real-time socket notifications still work
// exactly as before this file existed).
function getProvider() {
  if (provider) return provider;
  const { APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID } = process.env;
  if (!APNS_KEY || !APNS_KEY_ID || !APNS_TEAM_ID) {
    if (!warnedMissingConfig) {
      console.warn('[Push] APNS_KEY/APNS_KEY_ID/APNS_TEAM_ID not set — push notifications disabled (in-app/socket notifications still work).');
      warnedMissingConfig = true;
    }
    return null;
  }
  provider = new apn.Provider({
    token: {
      key: APNS_KEY.replace(/\\n/g, '\n'), // env vars usually need literal \n escaped
      keyId: APNS_KEY_ID,
      teamId: APNS_TEAM_ID,
    },
    production: (process.env.APNS_PRODUCTION ?? 'true') === 'true',
  });
  return provider;
}

async function registerDeviceToken(userId, token, platform = 'ios') {
  if (!userId || !token) return;
  await db(
    `INSERT INTO device_tokens (user_id, token, platform, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (token) DO UPDATE SET user_id = $1, platform = $3, updated_at = NOW()`,
    [userId, token, platform]
  );
}

// Fire-and-forget by design — a push failure must never block or roll back
// the real event (gift, match, win, etc.) that triggered it.
async function sendPush(userId, { title, body, data }) {
  try {
    const apnProvider = getProvider();
    if (!apnProvider || !userId) return;

    const { rows } = await db(`SELECT token FROM device_tokens WHERE user_id = $1`, [userId]);
    if (!rows.length) return;

    const note = new apn.Notification();
    note.alert = { title, body };
    note.sound = 'default';
    note.topic = process.env.APNS_BUNDLE_ID || 'com.worldbond.app';
    if (data) note.payload = data;

    const tokens = rows.map(r => r.token);
    const result = await apnProvider.send(note, tokens);

    // Drop tokens Apple says are no longer valid (app uninstalled, etc.)
    const badTokens = result.failed
      .filter(f => f.status === '410' || f.response?.reason === 'BadDeviceToken' || f.response?.reason === 'Unregistered')
      .map(f => f.device);
    if (badTokens.length) {
      await db(`DELETE FROM device_tokens WHERE token = ANY($1)`, [badTokens]);
    }
  } catch (err) {
    console.warn('[Push] send error:', err.message);
  }
}

module.exports = { registerDeviceToken, sendPush };
