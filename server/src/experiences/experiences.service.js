const { query } = require('../database/db');

const VALID_CONNECTION_TYPES = ['dating', 'friendship', 'travel', 'language', 'mentorship'];
const VALID_CATEGORIES = ['food', 'travel', 'music', 'sports', 'language', 'arts', 'outdoors', 'nightlife', 'business', 'wellness'];

async function createExperience(userId, data) {
  const { title, description, category, connection_type, country, city, is_global, languages_wanted } = data;

  if (!title?.trim()) throw Object.assign(new Error('title required'), { status: 400 });
  if (!VALID_CONNECTION_TYPES.includes(connection_type)) {
    throw Object.assign(new Error(`connection_type must be one of: ${VALID_CONNECTION_TYPES.join(', ')}`), { status: 400 });
  }

  const { rows } = await query(`
    INSERT INTO experiences
      (user_id, title, description, category, connection_type, country, city, is_global, languages_wanted)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `, [userId, title.trim(), description, category, connection_type, country, city, is_global || false, languages_wanted || []]);

  return rows[0];
}

async function getExperiences({ country, city, connection_type, category, is_global, userId, limit = 20, offset = 0 }) {
  const conditions = ["e.status = 'active'", 'e.expires_at > NOW()', 'e.user_id != $1'];
  const params = [userId];
  let i = 2;

  if (connection_type) { conditions.push(`e.connection_type = $${i++}`); params.push(connection_type); }
  if (category)        { conditions.push(`e.category = $${i++}`);        params.push(category); }
  if (is_global === 'true' || is_global === true) {
    conditions.push('e.is_global = TRUE');
  } else if (country) {
    conditions.push(`(e.country = $${i++} OR e.is_global = TRUE)`);
    params.push(country);
  }
  if (city) { conditions.push(`e.city = $${i++}`); params.push(city); }

  // Exclude experiences from users who blocked the requester or were blocked by requester
  conditions.push(`e.user_id NOT IN (
    SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
    UNION
    SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
  )`);

  params.push(limit, offset);

  const { rows } = await query(`
    SELECT e.*, p.display_name, p.photo_url, p.voice_note_url, p.country AS profile_country, p.language
    FROM experiences e
    JOIN profiles p ON p.user_id = e.user_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY e.created_at DESC
    LIMIT $${i++} OFFSET $${i}
  `, params);

  return rows;
}

async function getExperienceById(id) {
  const { rows } = await query(`
    SELECT e.*, p.display_name, p.photo_url, p.voice_note_url, p.language
    FROM experiences e
    JOIN profiles p ON p.user_id = e.user_id
    WHERE e.id = $1
  `, [id]);
  return rows[0] || null;
}

async function applyToExperience(experienceId, applicantId, message) {
  const experience = await getExperienceById(experienceId);
  if (!experience) throw Object.assign(new Error('Experience not found'), { status: 404 });
  if (experience.user_id === applicantId) throw Object.assign(new Error('Cannot apply to your own experience'), { status: 400 });
  if (experience.status !== 'active') throw Object.assign(new Error('Experience is no longer active'), { status: 400 });

  const { rows } = await query(`
    INSERT INTO experience_applications (experience_id, applicant_id, message)
    VALUES ($1, $2, $3)
    ON CONFLICT (experience_id, applicant_id) DO NOTHING
    RETURNING *
  `, [experienceId, applicantId, message]);

  return rows[0] || null;
}

async function respondToApplication(experienceId, applicationId, ownerId, status) {
  if (!['accepted', 'rejected'].includes(status)) throw Object.assign(new Error('status must be accepted or rejected'), { status: 400 });

  // Verify ownership
  const exp = await getExperienceById(experienceId);
  if (!exp || exp.user_id !== ownerId) throw Object.assign(new Error('Forbidden'), { status: 403 });

  const { rows } = await query(`
    UPDATE experience_applications SET status = $1
    WHERE id = $2 AND experience_id = $3
    RETURNING *
  `, [status, applicationId, experienceId]);

  return rows[0] || null;
}

async function getMyExperiences(userId) {
  const { rows } = await query(
    "SELECT * FROM experiences WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

async function getApplicationsForExperience(experienceId, ownerId) {
  const exp = await getExperienceById(experienceId);
  if (!exp || exp.user_id !== ownerId) throw Object.assign(new Error('Forbidden'), { status: 403 });

  const { rows } = await query(`
    SELECT ea.*, p.display_name, p.photo_url, p.voice_note_url, p.language, p.country AS profile_country
    FROM experience_applications ea
    JOIN profiles p ON p.user_id = ea.applicant_id
    WHERE ea.experience_id = $1
    ORDER BY ea.created_at DESC
  `, [experienceId]);
  return rows;
}

module.exports = {
  createExperience, getExperiences, getExperienceById,
  applyToExperience, respondToApplication,
  getMyExperiences, getApplicationsForExperience,
};
