const { Router } = require('express');
const { requireAuth } = require('../auth/auth.middleware');
const { getDailyMatches, createMatch, getMatches } = require('./matching.service');

const router = Router();
router.use(requireAuth);

// GET /api/matches/daily — returns today's 5 curated matches (cached after first call)
router.get('/daily', async (req, res) => {
  try {
    const matches = await getDailyMatches(req.userId);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches — returns all active confirmed matches
router.get('/', async (req, res) => {
  try {
    res.json(await getMatches(req.userId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches — create a confirmed match after mutual interest
router.post('/', async (req, res) => {
  const { targetUserId, connectionType, experienceId } = req.body;
  if (!targetUserId || !connectionType) {
    return res.status(400).json({ error: 'targetUserId and connectionType required' });
  }
  try {
    const match = await createMatch(req.userId, targetUserId, connectionType, experienceId);
    if (!match) return res.status(409).json({ error: 'Match already exists' });
    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
