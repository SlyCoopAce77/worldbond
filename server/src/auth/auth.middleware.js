const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.headers['admin-secret'] || req.headers['admin_secret'] || req.get('ADMIN_SECRET');
  const expected = process.env.ADMIN_SECRET;

  if (!expected) {
    return res.status(500).json({ error: 'Admin secret not configured on server' });
  }

  if (!secret || secret !== expected) {
    return res.status(403).json({ error: 'Unauthorized admin access' });
  }

  next();
}

module.exports = { requireAuth, requireAdmin };
