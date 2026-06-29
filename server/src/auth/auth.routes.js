const { Router } = require('express');
const { register, login, refreshAccess, logout, forgotPassword, resetPassword } = require('./auth.service');

const router = Router();

// ─── In-memory rate limiter (per key) ─────────────────────────────────────────
const _rlMap = new Map();
function rateLimit(key, maxHits, windowMs) {
  const now = Date.now();
  let entry = _rlMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    _rlMap.set(key, entry);
    return true;
  }
  if (entry.count >= maxHits) return false;
  entry.count++;
  return true;
}

// ─── Failed login tracking (per email) — lock after 5 failures for 15 min ────
const _failedLogins = new Map();
function recordFailedLogin(email) {
  const now = Date.now();
  let entry = _failedLogins.get(email) || { count: 0, lockedUntil: 0 };
  entry.count++;
  if (entry.count >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000;
    entry.count = 0;
  }
  _failedLogins.set(email, entry);
}
function isLoginLocked(email) {
  const entry = _failedLogins.get(email);
  return entry ? entry.lockedUntil > Date.now() : false;
}
function clearLoginAttempts(email) {
  _failedLogins.delete(email);
}

// Clean stale entries every 30 min
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _rlMap) if (now > v.resetAt) _rlMap.delete(k);
  for (const [k, v] of _failedLogins) if (v.lockedUntil > 0 && now > v.lockedUntil) _failedLogins.delete(k);
}, 1800000);

// ─── Disposable / temporary email domain blocklist ────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamail.net', 'guerrillamail.org', 'spam4.me', 'maildrop.cc',
  'dispostable.com', 'fakeinbox.com', 'mailnull.com', 'trashmail.at',
  'trashmail.io', 'trashmail.me', 'getairmail.com', 'mailexpire.com',
  'spamgourmet.com', 'temp-mail.org', 'tempinbox.com', 'mailtemp.info',
  'discard.email', 'throwam.com', 'spambox.us', 'spamboxapp.com',
  'mohmal.com', 'tempmailer.com', 'wegwerfmail.de', 'sogetthis.com',
  'spamspot.com', 'mailzilla.com', 'drdrb.net', 'fakemailgenerator.com',
  'tempr.email', 'mailnew.com', 'mintemail.com', 'emailfake.com',
  'fakemail.net', 'spamevader.com', 'rcpt.at', 'spamtrap.ro',
]);

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

// ─── Suspicious email pattern detection ───────────────────────────────────────
function isSuspiciousEmail(email) {
  const local = email.split('@')[0].toLowerCase();
  // Looks like bot123456, user7890, test111, robot99, ai001
  if (/^(bot|user|temp|fake|test|noreply|spam|trash|throwaway|auto|robot|ai)\d{2,}/i.test(local)) return true;
  // Very long local part that's mostly random digits (common in mass-generated accounts)
  if (local.length > 28 && (local.match(/\d/g) || []).length > 12) return true;
  return false;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
          || req.socket?.remoteAddress
          || 'unknown';

  // Max 3 new accounts per IP per 24 hours
  if (!rateLimit(`reg:${ip}`, 3, 24 * 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many accounts created from this device. Please try again tomorrow.' });
  }

  const { email, password, dateOfBirth } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!dateOfBirth) return res.status(400).json({ error: 'Date of birth is required' });

  if (isDisposableEmail(email)) {
    return res.status(400).json({ error: 'Temporary email addresses are not allowed. Please use a real email address.' });
  }

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return res.status(400).json({ error: 'Invalid date of birth' });

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const mo = today.getMonth() - dob.getMonth();
  if (mo < 0 || (mo === 0 && today.getDate() < dob.getDate())) age--;
  if (age < 18) return res.status(400).json({ error: 'You must be 18 or older to join Bond.' });
  if (age > 120) return res.status(400).json({ error: 'Invalid date of birth.' });

  const suspicious = isSuspiciousEmail(email);

  try {
    const result = await register({ email, password, dateOfBirth: dob, ip, suspicious });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
          || req.socket?.remoteAddress
          || 'unknown';
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  // Max 10 login attempts per IP per 15 min
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many login attempts. Please wait 15 minutes and try again.' });
  }

  const emailKey = email.trim().toLowerCase();

  if (isLoginLocked(emailKey)) {
    return res.status(429).json({ error: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.' });
  }

  try {
    const result = await login({ email, password });
    clearLoginAttempts(emailKey);
    res.json(result);
  } catch (err) {
    if (err.status === 401) recordFailedLogin(emailKey);
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
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

  // Max 5 password reset requests per IP per hour
  if (!rateLimit(`pwreset:${ip}`, 5, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many reset requests. Please wait an hour.' });
  }

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
