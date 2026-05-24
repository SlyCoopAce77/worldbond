const { Router } = require('express');
const { requireAuth } = require('../auth/auth.middleware');
const {
  createExperience, getExperiences, getExperienceById,
  applyToExperience, respondToApplication,
  getMyExperiences, getApplicationsForExperience,
} = require('./experiences.service');

const router = Router();
router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const exp = await createExperience(req.userId, req.body);
    res.status(201).json(exp);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const exps = await getExperiences({ ...req.query, userId: req.userId });
    res.json(exps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mine', async (req, res) => {
  try {
    res.json(await getMyExperiences(req.userId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const exp = await getExperienceById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Not found' });
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/apply', async (req, res) => {
  try {
    const app = await applyToExperience(req.params.id, req.userId, req.body.message);
    if (!app) return res.status(409).json({ error: 'Already applied' });
    res.status(201).json(app);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:id/applications', async (req, res) => {
  try {
    res.json(await getApplicationsForExperience(req.params.id, req.userId));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/:id/applications/:appId', async (req, res) => {
  try {
    const result = await respondToApplication(req.params.id, req.params.appId, req.userId, req.body.status);
    if (!result) return res.status(404).json({ error: 'Application not found' });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
