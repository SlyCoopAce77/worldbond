const { Router } = require('express');
const multer = require('multer');
const { requireAuth } = require('../auth/auth.middleware');
const { getProfile, upsertProfile, updateVoiceNote, updateGalleryPhotos, listProfiles } = require('./profiles.service');
const { uploadBuffer } = require('../cloudinary');
const { query } = require('../database/db');

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('audio/'));
  },
});

const router = Router();

router.use(requireAuth);

// GET /api/profiles?limit=30&connection_type=dating&search=tokyo
router.get('/', async (req, res) => {
  try {
    const profiles = await listProfiles(req.userId, req.query);
    res.json({ profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profiles/blocks — list users blocked by the current user
router.get('/blocks', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT p.user_id, p.display_name, p.photo_url, p.country, b.created_at AS blocked_at
       FROM user_blocks b
       JOIN profiles p ON p.user_id = b.blocked_id
       WHERE b.blocker_id = $1
       ORDER BY b.created_at DESC`,
      [req.userId],
    );
    res.json({ blocked: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profiles/blocks/:userId — block a user
router.post('/blocks/:userId', async (req, res) => {
  const { userId } = req.params;
  if (userId === req.userId) return res.status(400).json({ error: 'Cannot block yourself' });
  try {
    await query(
      `INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.userId, userId],
    );
    res.json({ blocked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profiles/blocks/:userId — unblock a user
router.delete('/blocks/:userId', async (req, res) => {
  try {
    await query(
      `DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [req.userId, req.params.userId],
    );
    res.json({ blocked: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const profile = await getProfile(req.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', async (req, res) => {
  try {
    const profile = await upsertProfile(req.userId, req.body);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const profile = await getProfile(req.params.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    // Strip sensitive fields before returning another user's profile
    const { user_id, ...safe } = profile;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a photo to the gallery (max 6)
router.post('/me/gallery', async (req, res) => {
  try {
    const { photo_url } = req.body;
    if (!photo_url) return res.status(400).json({ error: 'photo_url required' });
    const profile = await getProfile(req.userId);
    const current = profile?.gallery_photos || [];
    if (current.length >= 6) return res.status(400).json({ error: 'Gallery full (max 6 photos)' });
    const updated = await updateGalleryPhotos(req.userId, [...current, photo_url]);
    res.json({ gallery_photos: updated.gallery_photos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a photo from gallery by index
router.delete('/me/gallery/:index', async (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    const profile = await getProfile(req.userId);
    const current = profile?.gallery_photos || [];
    const updated = current.filter((_, i) => i !== idx);
    const result = await updateGalleryPhotos(req.userId, updated);
    res.json({ gallery_photos: result.gallery_photos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Voice note upload — expects multipart/form-data field "audio"
router.post('/me/voice-note', audioUpload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
  try {
    let url;
    const { isConfigured, uploadBuffer: upload } = require('../cloudinary');
    if (isConfigured()) {
      url = await upload(req.file.buffer, 'worldbond/voice-notes', { resource_type: 'video' });
    } else {
      // Fallback: you'd save to disk in dev — for now return a placeholder
      url = `/uploads/voice-${Date.now()}.webm`;
    }
    // Voice tone analysis happens async (see matching service)
    const profile = await updateVoiceNote(req.userId, url, {});
    res.json({ voice_note_url: profile.voice_note_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/me', async (req, res) => {
  const userId = req.userId;
  try {
    // 1. Null user_id in payout_audit and transfer_status to satisfy foreign key constraints
    await query('UPDATE payout_audit SET user_id = NULL WHERE user_id = $1', [userId]);
    await query('UPDATE transfer_status SET user_id = NULL WHERE user_id = $1', [userId]);

    // 2. Delete the user row (which cascades and deletes profile, reports, blocks, refresh_tokens, password_resets, etc.)
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Clear in-memory photos
    const { deletePhotosByUser } = require('../photos');
    deletePhotosByUser(userId);

    res.json({ ok: true });
  } catch (err) {
    console.error('[DeleteAccount] error:', err.message);
    res.status(500).json({ error: 'Could not delete account: ' + err.message });
  }
});

module.exports = router;
