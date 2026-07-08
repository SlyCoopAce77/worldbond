const { Router } = require('express');
const { requireAuth } = require('../auth/auth.middleware');
const { getDailyMatches, createMatch, getMatches } = require('./matching.service');
const { findSocketId } = require('../socket');
const { query: db } = require('../database/db');
const { sendPush } = require('../push');

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

    // Notify the other side, in-app if online and via push either way —
    // previously nothing told them a match had formed at all.
    const { rows } = await db(`SELECT display_name, country FROM profiles WHERE user_id = $1`, [req.userId]);
    const myName = rows[0]?.display_name || 'Someone';
    const targetSid = findSocketId(targetUserId);
    if (targetSid) {
      const ioInstance = req.app.get('io');
      ioInstance.to(targetSid).emit('bond_formed', {
        userId: req.userId,
        username: myName,
        country: rows[0]?.country || null,
      });
    }
    sendPush(targetUserId, { title: 'New Bond', body: `${myName} bonded with you` });

    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
