const { Router } = require('express');
const multer = require('multer');
const { requireAuth } = require('../auth/auth.middleware');
const { getProfile, upsertProfile, updateVoiceNote, updateGalleryPhotos, listProfiles } = require('./profiles.service');
const { uploadBuffer } = require('../cloudinary');

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

module.exports = router;
