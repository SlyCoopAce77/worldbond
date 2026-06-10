const { Router } = require('express');
const { register, login, refreshAccess, logout, forgotPassword, resetPassword } = require('./auth.service');

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, dateOfBirth } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!dateOfBirth) return res.status(400).json({ error: 'Date of birth is required' });

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return res.status(400).json({ error: 'Invalid date of birth' });

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  if (age < 18) return res.status(400).json({ error: 'You must be 18 or older to join Bond.' });

  try {
    const result = await register({ email, password, dateOfBirth: dob });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const result = await login({ email, password });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  try {
    const result = await refreshAccess(refreshToken);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await logout(refreshToken).catch(() => {});
  res.json({ ok: true });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    await forgotPassword({ email });
    res.json({ ok: true }); // always 200 — don't reveal if email exists
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    await resetPassword({ email, code, newPassword });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
