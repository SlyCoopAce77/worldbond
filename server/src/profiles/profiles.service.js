const { query } = require('../database/db');

async function getProfile(userId) {
  const { rows } = await query(
    'SELECT * FROM profiles WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}

async function upsertProfile(userId, data) {
  if (data.display_name !== undefined && !data.display_name?.trim()) {
    throw new Error('display_name cannot be empty');
  }

  const {
    display_name, age, gender, country, city, lat, lng,
    language, languages_spoken, bio, photo_url, voice_note_url,
    voice_tone_data, connection_types, gallery_photos,
    tagline, bond_style, vibe_tags, interests, cover_photo_url,
  } = data;

  const { rows } = await query(`
    INSERT INTO profiles
      (user_id, display_name, age, gender, country, city, lat, lng,
       language, languages_spoken, bio, photo_url, voice_note_url,
       voice_tone_data, connection_types, gallery_photos,
       tagline, bond_style, vibe_tags, interests, cover_photo_url,
       last_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      display_name     = COALESCE(EXCLUDED.display_name, profiles.display_name),
      age              = COALESCE(EXCLUDED.age, profiles.age),
      gender           = COALESCE(EXCLUDED.gender, profiles.gender),
      country          = COALESCE(EXCLUDED.country, profiles.country),
      city             = COALESCE(EXCLUDED.city, profiles.city),
      lat              = COALESCE(EXCLUDED.lat, profiles.lat),
      lng              = COALESCE(EXCLUDED.lng, profiles.lng),
      language         = COALESCE(EXCLUDED.language, profiles.language),
      languages_spoken = COALESCE(EXCLUDED.languages_spoken, profiles.languages_spoken),
      bio              = COALESCE(EXCLUDED.bio, profiles.bio),
      photo_url        = COALESCE(EXCLUDED.photo_url, profiles.photo_url),
      voice_note_url   = COALESCE(EXCLUDED.voice_note_url, profiles.voice_note_url),
      voice_tone_data  = COALESCE(EXCLUDED.voice_tone_data, profiles.voice_tone_data),
      connection_types = COALESCE(EXCLUDED.connection_types, profiles.connection_types),
      gallery_photos   = COALESCE(EXCLUDED.gallery_photos, profiles.gallery_photos),
      tagline          = COALESCE(EXCLUDED.tagline, profiles.tagline),
      bond_style       = COALESCE(EXCLUDED.bond_style, profiles.bond_style),
      vibe_tags        = COALESCE(EXCLUDED.vibe_tags, profiles.vibe_tags),
      interests        = COALESCE(EXCLUDED.interests, profiles.interests),
      cover_photo_url  = COALESCE(EXCLUDED.cover_photo_url, profiles.cover_photo_url),
      last_active      = NOW(),
      updated_at       = NOW()
    RETURNING *
  `, [
    userId, display_name, age, gender, country, city, lat, lng,
    language || 'en', languages_spoken || [], bio, photo_url,
    voice_note_url, voice_tone_data || {}, connection_types || [],
    gallery_photos || [],
    tagline || null, bond_style || null, vibe_tags || null, interests || null,
    cover_photo_url || null,
  ]);
  return rows[0];
}

async function updateGalleryPhotos(userId, photos) {
  const { rows } = await query(
    `UPDATE profiles SET gallery_photos = $2, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
    [userId, photos.slice(0, 6)]
  );
  return rows[0];
}

async function updateVoiceNote(userId, voiceNoteUrl, voiceToneData) {
  const { rows } = await query(
    `UPDATE profiles
     SET voice_note_url = $2, voice_tone_data = $3, updated_at = NOW()
     WHERE user_id = $1 RETURNING *`,
    [userId, voiceNoteUrl, voiceToneData || {}]
  );
  return rows[0];
}

async function touchLastActive(userId) {
  await query('UPDATE profiles SET last_active = NOW() WHERE user_id = $1', [userId]);
}

async function listProfiles(requestingUserId, { limit = 30, connection_type, search, exclude_ids = [] } = {}) {
  const params  = [requestingUserId];
  const clauses = ['p.user_id != $1'];

  if (exclude_ids.length > 0) {
    params.push(exclude_ids);
    clauses.push(`p.user_id != ALL($${params.length})`);
  }
  if (connection_type) {
    params.push(connection_type);
    clauses.push(`$${params.length} = ANY(p.connection_types)`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    clauses.push(`(LOWER(p.display_name) LIKE $${params.length} OR LOWER(p.city) LIKE $${params.length})`);
  }

  params.push(Math.min(Number(limit) || 30, 100));
  const where = clauses.join(' AND ');

  const { rows } = await query(`
    SELECT p.user_id, p.display_name, p.age, p.gender, p.country, p.city,
           p.language, p.photo_url, p.connection_types, p.ghost_score, p.last_active
    FROM profiles p
    LEFT JOIN user_blocks b ON (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                            OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
    WHERE ${where} AND b.blocker_id IS NULL
    ORDER BY p.last_active DESC NULLS LAST
    LIMIT $${params.length}
  `, params);
  return rows;
}

module.exports = { getProfile, upsertProfile, updateVoiceNote, updateGalleryPhotos, touchLastActive, listProfiles };
