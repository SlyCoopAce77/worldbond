require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const { setupSocket } = require('./socket');
const { GROUP_CATEGORIES } = require('./groups');
const { getCountries, getCitiesInCountry, getPlacesInCity, PLACE_TYPES } = require('./places');
const { addPhoto, getPhotos } = require('./photos');
const { addStory, getStoriesGrouped } = require('./stories');
const { isConfigured: cloudinaryEnabled, uploadBuffer } = require('./cloudinary');
const { requireAuth } = require('./auth/auth.middleware');

// Stripe
const Stripe = require('stripe');
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const SERVER_BASE = 'https://worldbond-server-production.up.railway.app';

// Bond platform — persistent services
const { runMigrations } = require('./database/db');
const authRoutes        = require('./auth/auth.routes');
const profileRoutes     = require('./profiles/profiles.routes');
const experienceRoutes  = require('./experiences/experiences.routes');
const matchingRoutes    = require('./matching/matching.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// Only serve local uploads when Cloudinary is not configured (dev mode)
if (!cloudinaryEnabled) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Multer: memory storage when Cloudinary is on, disk storage for local dev
const storage = cloudinaryEnabled
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 120 * 1024 * 1024 }, // 120 MB — covers videos up to ~60s
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/'));
  },
});

// Resolve image URL — Cloudinary returns a URL in the buffer; local needs to build one
async function resolveImageUrl(req, folder) {
  if (cloudinaryEnabled) {
    return uploadBuffer(req.file.buffer, `worldbond/${folder}`);
  }
  const PORT = process.env.PORT || 3001;
  const HOST = req.headers.host?.split(':')[0] || 'localhost';
  return `http://${HOST}:${PORT}/uploads/${req.file.filename}`;
}

// Bond platform routes
app.use('/api/auth',        authRoutes);
app.use('/api/profiles',    profileRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/matches',     matchingRoutes);

// Legal pages
const LEGAL_CSS = `body{margin:0;font-family:-apple-system,sans-serif;background:#000;color:#fff;padding:40px 24px;max-width:680px;margin:0 auto;line-height:1.7}h1{color:#FF0080;font-size:28px;margin-bottom:4px}h2{color:#fff;font-size:17px;margin-top:32px}p,li{color:#aaa;font-size:15px}a{color:#FF0080}footer{color:#444;font-size:12px;margin-top:48px;border-top:1px solid #111;padding-top:16px}`;

app.get('/privacy', (req, res) => res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy Policy — WorldBond</title><style>${LEGAL_CSS}</style></head><body>
<h1>WorldBond</h1><p style="color:#555;font-size:13px">Privacy Policy &nbsp;·&nbsp; Last updated June 2026</p>
<h2>1. Information We Collect</h2><p>We collect information you provide directly: email address, date of birth, display name, gender, country, city, profile photo, bio, and language preference. We also collect usage data such as check-ins, messages, and interactions within the app.</p>
<h2>2. How We Use Your Information</h2><p>We use your information to provide and improve the WorldBond service, match you with other users, send password reset emails, and ensure platform safety. We do not sell your personal data to third parties.</p>
<h2>3. Age Requirement</h2><p>WorldBond is strictly for users 18 years of age and older. We collect date of birth at registration and permanently store it. Users found to be under 18 are permanently banned.</p>
<h2>4. Data Storage & Security</h2><p>Your data is stored securely on encrypted servers. We use industry-standard security practices to protect your information. Passwords are hashed and never stored in plain text.</p>
<h2>5. Third-Party Services</h2><p>We use Stripe for payment processing (subject to <a href="https://stripe.com/privacy">Stripe's Privacy Policy</a>). We use Apple In-App Purchase for coin purchases on iOS. We use Google services on Android.</p>
<h2>6. Your Rights</h2><p>You may request deletion of your account and associated data at any time by contacting us at support@worldbond.app. Account deletion is permanent and irreversible.</p>
<h2>7. Cookies & Tracking</h2><p>The WorldBond app does not use cookies. We may collect anonymised analytics data to improve the service.</p>
<h2>8. Changes to This Policy</h2><p>We may update this policy from time to time. We will notify users of significant changes via the app or email.</p>
<h2>9. Contact</h2><p>Questions? Email us at <a href="mailto:support@worldbond.app">support@worldbond.app</a></p>
<footer>© 2026 WorldBond. All rights reserved.</footer></body></html>`));

app.get('/terms', (req, res) => res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Terms of Service — WorldBond</title><style>${LEGAL_CSS}</style></head><body>
<h1>WorldBond</h1><p style="color:#555;font-size:13px">Terms of Service &nbsp;·&nbsp; Last updated June 2026</p>
<h2>1. Acceptance</h2><p>By creating an account you agree to these Terms. If you do not agree, do not use WorldBond.</p>
<h2>2. Eligibility</h2><p>You must be 18 or older to use WorldBond. By registering you confirm your date of birth is accurate. Providing false age information results in a permanent ban with no appeal.</p>
<h2>3. User Conduct</h2><p>You agree not to: harass or harm other users, post illegal content, impersonate others, attempt to access other users' accounts, or use the platform for spam or commercial solicitation without permission.</p>
<h2>4. Content</h2><p>You retain ownership of content you post. By posting, you grant WorldBond a non-exclusive licence to display that content within the platform. You are solely responsible for the content you share.</p>
<h2>5. Payments & Coins</h2><p>WorldBond Coins are a virtual currency with no cash value and cannot be refunded. All purchases are final. Coin balances may be forfeited if your account is terminated for violations.</p>
<h2>6. Account Termination</h2><p>We reserve the right to suspend or permanently ban any account that violates these Terms, at our sole discretion.</p>
<h2>7. Disclaimer</h2><p>WorldBond is provided "as is" without warranties of any kind. We are not liable for user-generated content or interactions between users.</p>
<h2>8. Governing Law</h2><p>These Terms are governed by the laws of the United States.</p>
<h2>9. Contact</h2><p>Questions? Email <a href="mailto:support@worldbond.app">support@worldbond.app</a></p>
<footer>© 2026 WorldBond. All rights reserved.</footer></body></html>`));

// REST endpoints
app.get('/health', (req, res) => res.json({ status: 'WorldBond server running' }));
app.get('/api/groups', (req, res) => res.json(GROUP_CATEGORIES));
app.get('/api/countries', (req, res) => res.json(getCountries()));
app.get('/api/cities/:country', (req, res) => res.json(getCitiesInCountry(decodeURIComponent(req.params.country))));
app.get('/api/places/:country/:city', (req, res) => {
  const places = getPlacesInCity(decodeURIComponent(req.params.country), decodeURIComponent(req.params.city))
    .map(p => ({ ...p, typeInfo: PLACE_TYPES[p.type] || { icon: '📍', label: p.type } }));
  res.json(places);
});
app.get('/api/photos', (req, res) => res.json(getPhotos()));
app.get('/api/stories', (req, res) => res.json(getStoriesGrouped()));

// Photo upload
app.post('/api/photos/upload', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  try {
    const { username, userId, country, postCountry, language, mood, caption, filter } = req.body;
    const imageUrl = await resolveImageUrl(req, 'photos');
    const photo = addPhoto({ userId, username, country, postCountry: postCountry || null, language, mood, imageUrl, caption, filter });

    const ioInstance = req.app.get('io');
    ioInstance.emit('new_photo', photo);
    ioInstance.emit('photos_feed', getPhotos());

    res.json(photo);
  } catch (err) {
    console.error('Photo upload error:', err.message);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// Story upload
app.post('/api/stories/upload', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  try {
    const { username, userId, country, language, mood, caption, filter } = req.body;
    const imageUrl = await resolveImageUrl(req, 'stories');
    const story = addStory({ userId, username, country, language, mood, imageUrl, caption, filter });

    const ioInstance = req.app.get('io');
    ioInstance.emit('stories_updated', getStoriesGrouped());

    res.json(story);
  } catch (err) {
    console.error('Story upload error:', err.message);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// Debug: fire a test notification to all connected clients using a real profile userId
app.post('/api/debug/notify', async (req, res) => {
  const ioInstance = req.app.get('io');
  const { type = 'follower' } = req.body;

  // Grab a real userId from the profiles table so tapping the notification navigates to a real profile
  let realUserId = null;
  try {
    const { query: dbQuery } = require('./database/db');
    const { rows } = await dbQuery('SELECT user_id FROM profiles ORDER BY last_active DESC NULLS LAST LIMIT 1');
    if (rows[0]) realUserId = rows[0].user_id;
  } catch {}

  const uid = realUserId || 'test-user';
  const events = {
    follower: ['new_follower',       { followerId: uid, followerName: 'Yuki', followerCountry: 'Japan 🇯🇵' }],
    gift:     ['gift_received',      { senderId: uid, senderName: 'Carlos', senderCountry: 'Brazil 🇧🇷', gift: { emoji: '🌹', name: 'Rose' } }],
    random:   ['random_match',       { matchedUser: { userId: uid, username: 'Sofia', country: 'Italy 🇮🇹' } }],
    live:     ['live_viewer_joined', { viewerId: uid, viewerName: 'Amara', viewerCountry: 'Nigeria 🇳🇬', count: 7 }],
  };
  const ev = events[type] || events.follower;
  ioInstance.emit(ev[0], ev[1]);
  res.json({ ok: true, fired: ev[0], userId: uid });
});

// ── Stripe: creator connects their bank account ───────────────────────────────
app.post('/creator/connect-stripe', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const { userId, email } = req.body;
    const { query: db } = require('./database/db');

    // Check if creator already has a Stripe account
    const existing = await db('SELECT stripe_account_id FROM profiles WHERE user_id = $1', [userId]);
    let accountId = existing.rows[0]?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
      await db('UPDATE profiles SET stripe_account_id = $1 WHERE user_id = $2', [accountId, userId]);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${SERVER_BASE}/creator/stripe-refresh`,
      return_url:  `${SERVER_BASE}/creator/stripe-return?userId=${userId}`,
      type: 'account_onboarding',
    });
    res.json({ url: link.url });
  } catch (err) {
    console.error('[Stripe] connect error:', err.message);
    res.status(500).json({ error: 'Could not create Stripe link' });
  }
});

// Stripe returns here after creator completes onboarding
app.get('/creator/stripe-return', async (req, res) => {
  res.send('<html><body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding-top:100px"><h2>Bank account connected!</h2><p>You can close this tab and return to Bond.</p></body></html>');
});
app.get('/creator/stripe-refresh', async (req, res) => {
  res.send('<html><body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding-top:100px"><h2>Session expired</h2><p>Please go back to the Bond app and try connecting again.</p></body></html>');
});

// ── Stripe: pay out a creator ─────────────────────────────────────────────────
app.post('/creator/payout', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const { userId, stripeAccountId, amountCents } = req.body;
    if (!stripeAccountId || !amountCents || amountCents < 100) {
      return res.status(400).json({ error: 'Invalid payout request' });
    }
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: stripeAccountId,
      metadata: { userId },
    });
    res.json({ transfer: transfer.id });
  } catch (err) {
    console.error('[Stripe] payout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Coins: credit after Apple/Google IAP purchase ─────────────────────────────
app.post('/coins/credit', requireAuth, async (req, res) => {
  try {
    const { userId, sku } = req.body;
    const coinMap = {
      'com.worldbond.coins.100':  100,
      'com.worldbond.coins.500':  550,   // 500 + 50 bonus
      'com.worldbond.coins.1200': 1400,  // 1200 + 200 bonus
      'com.worldbond.coins.3000': 3600,  // 3000 + 600 bonus
    };
    const coins = coinMap[sku];
    if (!coins) return res.status(400).json({ error: 'Unknown product' });
    const { query: db } = require('./database/db');
    await db('UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + $1 WHERE user_id = $2', [coins, userId]);
    res.json({ ok: true, credited: coins });
  } catch (err) {
    console.error('[Coins] credit error:', err.message);
    res.status(500).json({ error: 'Could not credit coins' });
  }
});

setupSocket(io);

const PORT = process.env.PORT || 3001;

async function start() {
  if (process.env.DATABASE_URL) {
    try {
      await runMigrations();
    } catch (err) {
      console.error('[DB] Migration failed:', err.message);
    }
  } else {
    console.warn('[DB] DATABASE_URL not set — Bond persistent features disabled');
  }
  server.listen(PORT, () => {
    console.log(`WorldBond server running on port ${PORT}`);
    if (!cloudinaryEnabled) {
      console.log(`Uploads served at http://localhost:${PORT}/uploads`);
    }
  });
}

start();
