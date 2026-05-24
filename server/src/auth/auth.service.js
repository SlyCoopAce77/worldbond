const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/db');

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required');

const ACCESS_TTL  = '15m';
const REFRESH_TTL = '30d';

function signAccess(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh(userId) {
  return jwt.sign({ sub: userId, jti: uuidv4() }, process.env.JWT_SECRET, { expiresIn: REFRESH_TTL });
}

async function register({ email, password }) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rowCount > 0) throw Object.assign(new Error('Email already registered'), { status: 409 });

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [email.toLowerCase(), hash]
  );
  const userId = rows[0].id;
  const access  = signAccess(userId);
  const refresh = signRefresh(userId);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, refresh, expiresAt]
  );
  return { userId, access, refresh };
}

async function login({ email, password }) {
  const { rows } = await query('SELECT id, password_hash FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!rows.length) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const userId  = rows[0].id;
  const access  = signAccess(userId);
  const refresh = signRefresh(userId);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, refresh, expiresAt]
  );
  return { userId, access, refresh };
}

async function refreshAccess(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  const { rows } = await query(
    'SELECT id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [refreshToken]
  );
  if (!rows.length) throw Object.assign(new Error('Refresh token revoked'), { status: 401 });

  const access = signAccess(payload.sub);
  return { access };
}

async function logout(refreshToken) {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
}

async function forgotPassword({ email }) {
  const { rows } = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!rows.length) return; // silently succeed — don't reveal whether email exists

  const userId = rows[0].id;
  const code   = String(Math.floor(100000 + Math.random() * 900000));
  const hash   = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hash, expiresAt]
  );

  const { sendPasswordReset } = require('../email');
  try {
    await sendPasswordReset(email.toLowerCase(), code);
  } catch (emailErr) {
    console.error('[auth] Password reset email failed:', emailErr.message);
  }
}

async function resetPassword({ email, code, newPassword }) {
  if (!email || !code || !newPassword)
    throw Object.assign(new Error('All fields required'), { status: 400 });
  if (newPassword.length < 8)
    throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });

  const userRes = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!userRes.rows.length)
    throw Object.assign(new Error('Invalid or expired code'), { status: 400 });

  const userId  = userRes.rows[0].id;
  const hash    = crypto.createHash('sha256').update(code.trim()).digest('hex');

  const tokenRes = await query(
    `SELECT id FROM password_reset_tokens
     WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW() AND used = FALSE`,
    [userId, hash]
  );
  if (!tokenRes.rows.length)
    throw Object.assign(new Error('Invalid or expired code'), { status: 400 });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
  await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenRes.rows[0].id]);
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

module.exports = { register, login, refreshAccess, logout, forgotPassword, resetPassword };
