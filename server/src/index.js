require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const crypto = require('crypto');
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

// ── In-memory rate limiter (no extra packages needed) ─────────────────────────
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
// Clean stale rate-limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _rlMap) if (now > v.resetAt) _rlMap.delete(k);
}, 600000);

// ── Apple IAP receipt verification ───────────────────────────────────────────
const APPLE_VERIFY_PROD    = 'buy.itunes.apple.com';
const APPLE_VERIFY_SANDBOX = 'sandbox.itunes.apple.com';
const APPLE_SHARED_SECRET  = process.env.APPLE_SHARED_SECRET || '';
const BOND_PASS_SKU        = 'com.worldbond.bondpass.monthly';

function appleVerifyReceipt(receiptData, sandbox = false) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      'receipt-data': receiptData,
      password: APPLE_SHARED_SECRET,
      'exclude-old-transactions': true,
    });
    const host = sandbox ? APPLE_VERIFY_SANDBOX : APPLE_VERIFY_PROD;
    const options = { hostname: host, path: '/verifyReceipt', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(options, r => {
      let data = '';
      r.on('data', d => { data += d; });
      r.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Apple parse error')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

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
// ── STRIPE WEBHOOKS — Must be BEFORE express.json() parser for raw body ─────────
// We use a separate route with raw body parser to verify Stripe signatures
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Webhook not configured' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const { query: db } = require('./database/db');

    // Handle transfer events
    switch (event.type) {
      case 'transfer.created': {
        // Transfer landed in the creator's connected account balance
        const transfer = event.data.object;
        const transferId = transfer.id;
        console.log('[Stripe] transfer.created:', transferId);

        // Update transfer status to completed
        await db(
          `UPDATE transfer_status SET status = 'completed', completed_at = NOW(), updated_at = NOW()
           WHERE transfer_id = $1`,
          [transferId]
        ).catch(e => console.warn('[Transfer] status update error:', e.message));
        break;
      }
      case 'transfer.reversed': {
        // Transfer was reversed — refund coins back to the user.
        // Stripe webhook delivery is "at-least-once", not exactly-once (retries,
        // manual resends from the dashboard, etc. can redeliver the same event),
        // so this must be idempotent — the status flip and the refund happen in
        // a single conditional UPDATE so a duplicate delivery is a no-op instead
        // of crediting the same coins back twice.
        const transfer = event.data.object;
        const transferId = transfer.id;
        console.log('[Stripe] transfer.reversed:', transferId);

        const claimed = await db(
          `UPDATE transfer_status SET status = 'refunded', updated_at = NOW()
           WHERE transfer_id = $1 AND status != 'refunded'
           RETURNING user_id, coins_deducted`,
          [transferId]
        ).catch(e => { console.warn('[Transfer] status update error:', e.message); return { rows: [] }; });

        if (claimed.rows.length > 0) {
          const { user_id, coins_deducted } = claimed.rows[0];
          await db(
            `UPDATE profiles SET coin_balance = coin_balance + $1 WHERE user_id = $2`,
            [coins_deducted, user_id]
          ).catch(e => console.warn('[Transfer] coin refund error:', e.message));

          console.log('[Transfer] Refunded', coins_deducted, 'coins (reversal) to user', user_id);
        } else {
          console.log('[Transfer] reversal already processed or unknown transfer:', transferId);
        }
        break;
      }
      default:
        console.log('[Stripe] Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe] webhook error:', err.message);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});



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
<h2>3. User Conduct</h2><p>You agree not to: harass or harm other users, post illegal content, impersonate others, attempt to access other users' accounts, or use the platform for spam or commercial solicitation without permission. You may not use bots, scripts, artificial intelligence, or any automated means to create accounts, send gifts, earn coins, inflate challenge scores, or manipulate any feature of the platform. Accounts found to be automated or controlled by AI will be permanently banned and all coin balances forfeited with no appeal.</p>
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
    const userId = req.userId;
    const { username, country, postCountry, language, mood, caption, filter } = req.body;
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
    const userId = req.userId;
    const { username, country, language, mood, caption, filter } = req.body;
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
app.post('/api/debug/notify', requireAuth, async (req, res) => {
  const ADMIN_IDS = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!ADMIN_IDS.includes(req.userId)) return res.status(403).json({ error: 'Not authorized.' });
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

// ── Gift coins: record server-side earn with daily cap ───────────────────────
// Not called by the app — no client code ties `amount` to a real gift event, so
// this is admin-only until a verified-gift pipeline exists. Otherwise any caller
// could self-credit up to DAILY_EARN_CAP coins/day with no economic backing.
const DAILY_EARN_CAP = 50000; // 50,000 coins per day max ($500 face value)

app.post('/coins/earn', requireAuth, async (req, res) => {
  const userId   = req.userId;
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  const ADMIN_IDS = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!ADMIN_IDS.includes(userId)) return res.status(403).json({ error: 'Not authorized.' });

  // Rate limit: max 200 earn events per hour per user
  if (!rateLimit(`earn:${userId}`, 200, 3600000)) {
    await require('./database/db').query(
      `INSERT INTO fraud_flags (user_id, flag_type, details) VALUES ($1, 'earn_rate_exceeded', $2)`,
      [userId, JSON.stringify({ clientIp })]
    ).catch(() => {});
    return res.status(429).json({ error: 'Earning rate limit exceeded.' });
  }

  try {
    const { amount, source } = req.body;
    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }

    const { query: db } = require('./database/db');
    const today = new Date().toISOString().slice(0, 10);

    // Fetch current daily earned amount
    const { rows } = await db(
      `SELECT daily_coins_earned, daily_coins_date FROM profiles WHERE user_id = $1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    const profileDateStr = rows[0].daily_coins_date
      ? new Date(rows[0].daily_coins_date).toISOString().slice(0, 10)
      : null;
    const dailyEarned = profileDateStr === today ? (rows[0].daily_coins_earned || 0) : 0;

    if (dailyEarned + amount > DAILY_EARN_CAP) {
      // Flag and cap — don't block completely, just don't credit overage
      const allowed = Math.max(0, DAILY_EARN_CAP - dailyEarned);
      if (allowed === 0) {
        return res.status(400).json({ error: 'Daily earning limit reached. Try again tomorrow.' });
      }
      // Credit only what's allowed
      await db(
        `UPDATE profiles
         SET coin_balance = COALESCE(coin_balance, 0) + $1,
             daily_coins_earned = $2,
             daily_coins_date = CURRENT_DATE
         WHERE user_id = $3`,
        [allowed, dailyEarned + allowed, userId]
      );
      return res.json({ ok: true, credited: allowed, cappedAt: DAILY_EARN_CAP });
    }

    await db(
      `UPDATE profiles
       SET coin_balance = COALESCE(coin_balance, 0) + $1,
           daily_coins_earned = $2,
           daily_coins_date = CURRENT_DATE
       WHERE user_id = $3`,
      [amount, dailyEarned + amount, userId]
    );
    res.json({ ok: true, credited: amount });
  } catch (err) {
    console.error('[Coins] earn error:', err.message);
    res.status(500).json({ error: 'Could not credit earned coins.' });
  }
});

// ── Stripe: creator connects their bank account ───────────────────────────────
app.post('/creator/connect-stripe', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const userId = req.userId;
    const { email } = req.body;
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
// All amounts computed server-side. Client cannot set the payout value.
const MIN_PAYOUT_COINS = 2500;   // 2500 coins = $25 minimum
const MAX_PAYOUT_COINS = 500000; // $5000 hard cap per payout (manual review above this)

app.post('/creator/payout', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

  const userId    = req.userId;
  const clientIp  = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  // Rate limit: max 3 payout attempts per hour per user (not 3 payouts — 3 attempts)
  if (!rateLimit(`payout_attempt:${userId}`, 3, 3600000)) {
    return res.status(429).json({ error: 'Too many payout requests. Try again in an hour.' });
  }
  // Rate limit: max 10 payout attempts per hour per IP
  if (!rateLimit(`payout_ip:${clientIp}`, 10, 3600000)) {
    return res.status(429).json({ error: 'Too many requests from this network.' });
  }

  try {
    const { query: db } = require('./database/db');

    // ── 1. Load verified server-side state ─────────────────────────────────────
    const { rows } = await db(
      `SELECT p.coin_balance, p.stripe_account_id, p.has_bond_pass,
              p.last_payout_at,
              u.created_at
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    const {
      coin_balance, stripe_account_id, has_bond_pass,
      last_payout_at, created_at,
    } = rows[0];

    // ── 2. Account age — must be 30+ days old ─────────────────────────────────
    const ageDays = (Date.now() - new Date(created_at).getTime()) / 86400000;
    if (ageDays < 30) {
      return res.status(403).json({ error: 'Account must be at least 30 days old to cash out.' });
    }

    // ── 3. Minimum balance ────────────────────────────────────────────────────
    if (!coin_balance || coin_balance < MIN_PAYOUT_COINS) {
      return res.status(400).json({ error: `Minimum ${MIN_PAYOUT_COINS.toLocaleString()} coins required to cash out.` });
    }

    // ── 4. Payout cooldown (server-enforced, not client) ──────────────────────
    if (last_payout_at) {
      const cooldownDays = has_bond_pass ? 14 : 30;
      const elapsed      = Date.now() - new Date(last_payout_at).getTime();
      const cooldownMs   = cooldownDays * 86400000;
      if (elapsed < cooldownMs) {
        const daysLeft = Math.ceil((cooldownMs - elapsed) / 86400000);
        return res.status(400).json({ error: `Payout cooldown active. ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining.` });
      }
    }

    // ── 5. Stripe account must be connected ───────────────────────────────────
    if (!stripe_account_id) {
      return res.status(400).json({ error: 'No bank account connected. Please connect your bank first.' });
    }

    // ── 6. Bot / fraud flag check ─────────────────────────────────────────────
    const flagRes = await db(
      `SELECT COUNT(*) AS cnt FROM fraud_flags WHERE user_id = $1 AND resolved = FALSE`,
      [userId]
    );
    if (parseInt(flagRes.rows[0]?.cnt) > 0) {
      return res.status(403).json({ error: 'Your account is under review. Email support@worldbond.app.' });
    }

    // ── 7. Compute payout server-side — client amount is ignored ──────────────
    const coinsToPay   = Math.min(coin_balance, MAX_PAYOUT_COINS);
    const payoutRate   = has_bond_pass ? 0.75 : 0.70;
    const amountCents  = Math.floor(coinsToPay * payoutRate); // 100 coins = $1 = 100 cents

    if (amountCents < 100) {
      return res.status(400).json({ error: 'Payout amount too small after rate calculation.' });
    }

    // ── 8. Flag large payouts for manual review but don't block them ──────────
    if (amountCents > 100000) { // > $1000
      await db(
        `INSERT INTO fraud_flags (user_id, flag_type, details) VALUES ($1, 'large_payout', $2)`,
        [userId, JSON.stringify({ amountCents, coinsToPay, clientIp })]
      );
    }

    // ── 9. Deduct coins first — if Stripe fails we refund; this prevents double-spend ──
    // Conditional on coin_balance so two concurrent payout requests can't both
    // pass the step-3 balance check and each trigger a real Stripe transfer.
    const deduction = await db(
      `UPDATE profiles SET coin_balance = coin_balance - $1, last_payout_at = NOW()
       WHERE user_id = $2 AND coin_balance >= $1
       RETURNING coin_balance`,
      [coinsToPay, userId]
    );
    if (!deduction.rows.length) {
      return res.status(409).json({ error: 'Balance changed — please try again.' });
    }

    // ── 10. Execute Stripe transfer — refund coins if this fails ─────────────
    let transfer;
    try {
      transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: 'usd',
        destination: stripe_account_id,
        metadata: { userId, coins: coinsToPay, rate: String(payoutRate) },
      });
    } catch (stripeErr) {
      // Rollback: restore coins and clear cooldown timestamp
      await db(
        `UPDATE profiles SET coin_balance = coin_balance + $1, last_payout_at = NULL WHERE user_id = $2`,
        [coinsToPay, userId]
      ).catch(() => {});
      throw stripeErr;
    }

    // ── 11. Immutable audit trail ─────────────────────────────────────────────
    // Transfer already succeeded at this point — log but don't fail the request
    // if this insert has trouble, so a DB blip doesn't look like a failed payout.
    await db(
      `INSERT INTO payout_audit (user_id, coins_deducted, amount_cents, payout_rate, stripe_tx_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, coinsToPay, amountCents, payoutRate, transfer.id, clientIp]
    ).catch(e => console.error('[Payout] audit insert error:', e.message));

    // ── 12. Track transfer status for webhook updates ────────────────────────────
    await db(
      `INSERT INTO transfer_status (transfer_id, user_id, coins_deducted, amount_cents, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [transfer.id, userId, coinsToPay, amountCents]
    ).catch(e => console.warn('[Transfer] status insert error:', e.message));

    res.json({ transfer: transfer.id, amountCents, coinsDeducted: coinsToPay });
  } catch (err) {
    console.error('[Stripe] payout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Coins: credit after Apple IAP purchase ────────────────────────────────────
// Verifies receipt with Apple and prevents replay (same receipt used twice).
app.post('/coins/credit', requireAuth, async (req, res) => {
  const userId   = req.userId;
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  // Rate limit: max 20 coin purchases per user per day (generous, avoids abuse)
  if (!rateLimit(`coins_credit:${userId}`, 20, 86400000)) {
    return res.status(429).json({ error: 'Too many purchase requests today.' });
  }

  try {
    const { sku, receipt } = req.body;
    if (!receipt) return res.status(400).json({ error: 'Purchase receipt required.' });

    const coinMap = {
      'com.worldbond.coins.100':  100,
      'com.worldbond.coins.500':  550,
      'com.worldbond.coins.1200': 1400,
      'com.worldbond.coins.3000': 3600,
    };
    const coins = coinMap[sku];
    if (!coins) return res.status(400).json({ error: 'Unknown product.' });

    const { query: db } = require('./database/db');

    // ── Replay attack prevention ───────────────────────────────────────────────
    // Hash the receipt so we can detect the same Apple transaction being submitted twice.
    const receiptHash = crypto.createHash('sha256').update(receipt).digest('hex');
    try {
      await db(
        `INSERT INTO iap_receipts (user_id, receipt_hash, product_id) VALUES ($1, $2, $3)`,
        [userId, receiptHash, sku]
      );
    } catch (dupErr) {
      // Unique constraint violation = this receipt was already used
      if (dupErr.code === '23505') {
        await db(
          `INSERT INTO fraud_flags (user_id, flag_type, details) VALUES ($1, 'receipt_replay', $2)`,
          [userId, JSON.stringify({ sku, receiptHash, clientIp })]
        );
        return res.status(409).json({ error: 'This purchase has already been credited.' });
      }
      throw dupErr;
    }

    // ── Verify receipt with Apple ─────────────────────────────────────────────
    if (APPLE_SHARED_SECRET) {
      let appleRes;
      try {
        appleRes = await appleVerifyReceipt(receipt, false);
        // Status 21007 = sandbox receipt sent to production; retry with sandbox
        if (appleRes.status === 21007) appleRes = await appleVerifyReceipt(receipt, true);
      } catch (appleErr) {
        console.warn('[Apple] receipt verify error:', appleErr.message);
        // If Apple is unreachable, log but don't block (avoid false positives)
      }

      if (appleRes && appleRes.status !== 0) {
        // Apple rejected the receipt
        await db(
          `INSERT INTO fraud_flags (user_id, flag_type, details) VALUES ($1, 'invalid_receipt', $2)`,
          [userId, JSON.stringify({ sku, appleStatus: appleRes.status, clientIp })]
        );
        // Remove the receipt hash so they can't claim we already processed it
        await db(`DELETE FROM iap_receipts WHERE user_id = $1 AND receipt_hash = $2`, [userId, receiptHash]);
        return res.status(400).json({ error: 'Purchase receipt is not valid.' });
      }
    }

    // ── Credit coins ──────────────────────────────────────────────────────────
    await db(
      `UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + $1 WHERE user_id = $2`,
      [coins, userId]
    );
    res.json({ ok: true, credited: coins });
  } catch (err) {
    console.error('[Coins] credit error:', err.message);
    res.status(500).json({ error: 'Could not credit coins.' });
  }
});

// ── Streak: server-side daily check-in ───────────────────────────────────────
// Prevents users from writing fake streak values to AsyncStorage.
app.post('/streak/checkin', requireAuth, async (req, res) => {
  const userId = req.userId;

  // Rate limit: once per hour per user (daily checkin, but allow retries)
  if (!rateLimit(`streak:${userId}`, 3, 3600000)) {
    return res.status(429).json({ error: 'Too many checkin requests.' });
  }

  try {
    const { query: db } = require('./database/db');
    const { rows } = await db(
      `SELECT streak_days, streak_last_checkin, streak_longest FROM profiles WHERE user_id = $1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    const { streak_days, streak_last_checkin, streak_longest } = rows[0];
    const todayStr  = new Date().toISOString().slice(0, 10);
    const lastStr   = streak_last_checkin ? streak_last_checkin.toISOString?.().slice(0, 10) || String(streak_last_checkin).slice(0, 10) : null;

    if (lastStr === todayStr) {
      // Already checked in today
      return res.json({ streak: streak_days, longest: streak_longest, alreadyDone: true });
    }

    let newStreak = 1;
    if (lastStr) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      newStreak = lastStr === yesterday ? (streak_days || 0) + 1 : 1;
    }
    const newLongest = Math.max(newStreak, streak_longest || 0);

    await db(
      `UPDATE profiles SET streak_days = $1, streak_last_checkin = CURRENT_DATE, streak_longest = $2 WHERE user_id = $3`,
      [newStreak, newLongest, userId]
    );

    res.json({ streak: newStreak, longest: newLongest, alreadyDone: false });
  } catch (err) {
    console.error('[Streak] checkin error:', err.message);
    res.status(500).json({ error: 'Could not update streak.' });
  }
});

// Bond Pass Streak Shield — absorbs exactly 1 missed day per calendar month
app.post('/streak/use-shield', requireAuth, async (req, res) => {
  const userId = req.userId;
  try {
    const { query: db } = require('./database/db');
    const { rows } = await db(
      `SELECT has_bond_pass, streak_days, streak_last_checkin, streak_longest, streak_shield_month FROM profiles WHERE user_id = $1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    const { has_bond_pass, streak_days, streak_last_checkin, streak_longest, streak_shield_month } = rows[0];

    if (!has_bond_pass) return res.status(403).json({ error: 'Bond Pass required.' });

    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    if (streak_shield_month === currentMonth) {
      return res.status(409).json({ error: 'Shield already used this month.' });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastStr  = streak_last_checkin ? (streak_last_checkin.toISOString?.().slice(0, 10) || String(streak_last_checkin).slice(0, 10)) : null;
    const diffDays = lastStr ? Math.round((new Date(todayStr) - new Date(lastStr)) / 86400000) : null;

    if (!lastStr || diffDays !== 2) {
      return res.status(400).json({ error: 'Shield can only cover exactly 1 missed day.' });
    }

    // Move lastCheckin forward by 1 day (yesterday), so the regular checkin sees a valid streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await db(
      `UPDATE profiles SET streak_last_checkin = $1, streak_shield_month = $2 WHERE user_id = $3`,
      [yesterday, currentMonth, userId]
    );

    res.json({ shieldUsed: true, streak: streak_days, longest: streak_longest });
  } catch (err) {
    console.error('[Streak] shield error:', err.message);
    res.status(500).json({ error: 'Could not apply shield.' });
  }
});

// ── Bond Pass: verify Apple subscription receipt server-side ─────────────────
// The client's local IAP/AsyncStorage state is NOT trusted for feature gating —
// `has_bond_pass` here is the only source of truth other routes read from.
function extractBondPassExpiry(appleRes) {
  const entries = [
    ...(appleRes?.latest_receipt_info || []),
    ...(appleRes?.receipt?.in_app || []),
  ].filter(e => e.product_id === BOND_PASS_SKU);

  if (!entries.length) return { expiresMs: null, originalTransactionId: null };

  // Pick the entry with the furthest-out expiration; ignore ones Apple/Support cancelled.
  let latestMs = 0;
  let originalTransactionId = null;
  for (const e of entries) {
    if (e.cancellation_date_ms) continue;
    const expiresMs = parseInt(e.expires_date_ms, 10);
    if (expiresMs && expiresMs > latestMs) {
      latestMs = expiresMs;
      originalTransactionId = e.original_transaction_id || e.transaction_id || null;
    }
  }
  // Fall back to any entry's original_transaction_id even if none are currently
  // active, so we can still bind/recognize the subscription identity.
  if (!originalTransactionId) {
    originalTransactionId = entries[0].original_transaction_id || entries[0].transaction_id || null;
  }
  return { expiresMs: latestMs || null, originalTransactionId };
}

app.post('/subscriptions/verify-bond-pass', requireAuth, async (req, res) => {
  const userId   = req.userId;
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  if (!rateLimit(`bondpass_verify:${userId}`, 20, 3600000)) {
    return res.status(429).json({ error: 'Too many verification requests. Try again later.' });
  }

  try {
    const { receipt } = req.body;
    if (!receipt) return res.status(400).json({ error: 'Purchase receipt required.' });

    const { query: db } = require('./database/db');

    if (!APPLE_SHARED_SECRET) {
      console.error('[Security] APPLE_SHARED_SECRET is not set — Bond Pass receipts will NOT be verified.');
      return res.status(503).json({ error: 'Subscription verification temporarily unavailable.' });
    }

    let appleRes;
    try {
      appleRes = await appleVerifyReceipt(receipt, false);
      // Status 21007 = sandbox receipt sent to production; retry with sandbox
      if (appleRes.status === 21007) appleRes = await appleVerifyReceipt(receipt, true);
    } catch (appleErr) {
      console.warn('[Apple] bond pass verify error:', appleErr.message);
      return res.status(502).json({ error: 'Could not reach Apple to verify subscription.' });
    }

    if (appleRes.status !== 0) {
      await db(
        `INSERT INTO fraud_flags (user_id, flag_type, details) VALUES ($1, 'invalid_bond_pass_receipt', $2)`,
        [userId, JSON.stringify({ appleStatus: appleRes.status, clientIp })]
      );
      return res.status(400).json({ error: 'Subscription receipt is not valid.' });
    }

    const { expiresMs, originalTransactionId } = extractBondPassExpiry(appleRes);
    const active       = !!expiresMs && expiresMs > Date.now();
    const receiptHash  = crypto.createHash('sha256').update(receipt).digest('hex');

    // ── Prevent one paid subscription being replayed across many accounts ──────
    // Apple receipts prove a purchase happened on *some* Apple ID, not that it
    // belongs to this WorldBond account. Bind the subscription's stable
    // original_transaction_id to whichever account first claims it; reject any
    // other account trying to claim the same subscription afterwards.
    // Done as an atomic INSERT ... ON CONFLICT DO NOTHING RETURNING so two
    // concurrent requests from different accounts can't both pass a
    // check-then-act race and both end up granted.
    if (originalTransactionId) {
      const inserted = await db(
        `INSERT INTO bond_pass_subscriptions (original_transaction_id, user_id, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (original_transaction_id) DO NOTHING
         RETURNING user_id`,
        [originalTransactionId, userId, expiresMs ? new Date(expiresMs) : null]
      );

      let ownerId;
      if (inserted.rows.length) {
        ownerId = userId; // we won the race — we own this subscription binding
      } else {
        const { rows: existing } = await db(
          `SELECT user_id FROM bond_pass_subscriptions WHERE original_transaction_id = $1`,
          [originalTransactionId]
        );
        ownerId = existing[0]?.user_id;
        if (ownerId === userId) {
          await db(
            `UPDATE bond_pass_subscriptions SET expires_at = $1, updated_at = NOW() WHERE original_transaction_id = $2`,
            [expiresMs ? new Date(expiresMs) : null, originalTransactionId]
          );
        }
      }

      if (ownerId !== userId) {
        await db(
          `INSERT INTO fraud_flags (user_id, flag_type, details) VALUES ($1, 'bond_pass_receipt_shared', $2)`,
          [userId, JSON.stringify({ originalTransactionId, clientIp })]
        );
        return res.status(409).json({ error: 'This subscription is already linked to a different account.' });
      }
    }

    await db(
      `UPDATE profiles
       SET has_bond_pass = $1, bond_pass_expires_at = $2, bond_pass_receipt_hash = $3
       WHERE user_id = $4`,
      [active, expiresMs ? new Date(expiresMs) : null, receiptHash, userId]
    );

    res.json({ has_bond_pass: active, expires_at: expiresMs ? new Date(expiresMs).toISOString() : null });
  } catch (err) {
    console.error('[BondPass] verify error:', err.message);
    res.status(500).json({ error: 'Could not verify subscription.' });
  }
});

// Authoritative status check — client should reconcile its local cache against this,
// not the other way around. Auto-lapses the flag once the last known expiry has passed
// (covers cancellations/non-renewals without needing a fresh receipt every time).
app.get('/subscriptions/status', requireAuth, async (req, res) => {
  const userId = req.userId;
  try {
    const { query: db } = require('./database/db');
    const { rows } = await db(
      `SELECT has_bond_pass, bond_pass_expires_at FROM profiles WHERE user_id = $1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    const { has_bond_pass, bond_pass_expires_at } = rows[0];
    const lapsed = has_bond_pass && bond_pass_expires_at && new Date(bond_pass_expires_at).getTime() < Date.now();

    if (lapsed) {
      await db(`UPDATE profiles SET has_bond_pass = FALSE WHERE user_id = $1`, [userId]);
    }

    res.json({
      has_bond_pass: lapsed ? false : !!has_bond_pass,
      expires_at: bond_pass_expires_at || null,
    });
  } catch (err) {
    console.error('[BondPass] status error:', err.message);
    res.status(500).json({ error: 'Could not fetch subscription status.' });
  }
});

// ── Bot / fraud detection: report suspicious account ─────────────────────────
app.post('/admin/flag-account', requireAuth, async (req, res) => {
  const reporterId = req.userId;
  const { targetUserId, flagType, details } = req.body;
  if (!targetUserId || !flagType) return res.status(400).json({ error: 'Missing fields.' });

  if (!rateLimit(`flag:${reporterId}`, 5, 3600000)) {
    return res.status(429).json({ error: 'Too many reports.' });
  }

  try {
    const { query: db } = require('./database/db');
    await db(
      `INSERT INTO fraud_flags (user_id, flag_type, details) VALUES ($1, $2, $3)`,
      [targetUserId, flagType, JSON.stringify({ reportedBy: reporterId, ...details })]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[Flag] error:', err.message);
    res.status(500).json({ error: 'Could not submit flag.' });
  }
});

// ── Globe Trotter: record a stamp or monument win ─────────────────────────────
// Rate-limited: 1 win per target per user per 30 days — prevents replay or
// double-counting. targetId is checked against the known flag/monument lists
// so at least garbage IDs can't be recorded (the underlying score itself is
// still computed client-side — see ChallengeContext.js — so this doesn't stop
// a modified client from claiming a real target it didn't legitimately win).
const VALID_STAMP_FLAGS = new Set([
  '🇺🇸','🇧🇷','🇰🇷','🇯🇵','🇩🇪','🇬🇧','🇫🇷','🇪🇸','🇷🇺','🇨🇦','🇲🇽',
  '🇦🇷','🇵🇭','🇮🇳','🇮🇩','🇹🇷','🇦🇺','🇸🇦','🇵🇱','🇹🇭','🇸🇪','🇳🇱','🇵🇹','🇨🇴',
]);
const VALID_MONUMENT_IDS = new Set([
  'liberty', 'grand_canyon', 'christ', 'amazon', 'gyeongbok', 'fuji', 'fushimi',
  'gate', 'bigben', 'eiffel', 'sagrada', 'red_square', 'niagara', 'chichen',
  'taj', 'borobudur', 'hagia', 'opera', 'colosseum', 'great_wall',
]);

app.post('/challenge/record-win', requireAuth, async (req, res) => {
  const userId  = req.userId;
  const { winType, targetId } = req.body; // winType: 'stamp' | 'monument'
  if (!userId || !winType || !targetId) return res.status(400).json({ error: 'Missing fields.' });
  if (!['stamp', 'monument'].includes(winType)) return res.status(400).json({ error: 'Invalid winType.' });
  const validTargets = winType === 'stamp' ? VALID_STAMP_FLAGS : VALID_MONUMENT_IDS;
  if (!validTargets.has(targetId)) return res.status(400).json({ error: 'Unknown target.' });

  // Global rate limit: max 2 win recordings per user per hour (prevents burst spam)
  if (!rateLimit(`win:${userId}`, 2, 3600000)) {
    return res.status(429).json({ error: 'Too many win recordings. Try again later.' });
  }

  try {
    const { query: db } = require('./database/db');
    
    const year = new Date().getFullYear();

    // Enforce 30-day cooldown: same user, same target, within 30 days
    const recent = await db(
      `SELECT id FROM challenge_wins
       WHERE user_id = $1 AND win_type = $2 AND target_id = $3
         AND won_at > NOW() - INTERVAL '30 days'`,
      [userId, winType, targetId]
    );
    if (recent.rowCount > 0) {
      return res.status(429).json({ error: 'Already recorded a win for this target in the last 30 days.' });
    }

    await db(
      `INSERT INTO challenge_wins (user_id, win_type, target_id, year) VALUES ($1, $2, $3, $4)`,
      [userId, winType, targetId, year]
    );

    const col = winType === 'stamp' ? 'stamp_wins' : 'monument_wins';
    await db(
      `INSERT INTO yearly_challenge_progress (user_id, year, ${col}, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (user_id, year) DO UPDATE SET ${col} = yearly_challenge_progress.${col} + 1, updated_at = NOW()`,
      [userId, year]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[Win] record error:', err.message);
    res.status(500).json({ error: 'Could not record win.' });
  }
});

// ── Admin: suspend or reinstate a user account ────────────────────────────────
app.post('/admin/suspend-account', requireAuth, async (req, res) => {
  const { targetUserId, suspend, reason } = req.body;
  if (!targetUserId || suspend === undefined) return res.status(400).json({ error: 'Missing fields.' });

  const ADMIN_IDS = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const callerId = req.userId;
  if (!ADMIN_IDS.includes(callerId)) return res.status(403).json({ error: 'Not authorized.' });

  try {
    const { query: db } = require('./database/db');
    await db('UPDATE users SET is_suspended = $1 WHERE id = $2', [Boolean(suspend), targetUserId]);
    if (suspend) {
      await db(
        `INSERT INTO fraud_flags (user_id, flag_type, details) VALUES ($1, 'account_suspended', $2)`,
        [targetUserId, JSON.stringify({ reason: reason || 'admin action', by: callerId })]
      ).catch(() => {});
      // Revoke all active sessions immediately
      await db('DELETE FROM refresh_tokens WHERE user_id = $1', [targetUserId]).catch(() => {});
    }
    res.json({ ok: true, suspended: Boolean(suspend) });
  } catch (err) {
    console.error('[Suspend] error:', err.message);
    res.status(500).json({ error: 'Could not update account.' });
  }
});

setupSocket(io);

const PORT = process.env.PORT || 3001;

async function start() {
  if (!APPLE_SHARED_SECRET) {
    console.error('[Security] APPLE_SHARED_SECRET is not set — IAP receipts will NOT be verified. Set this env var before launch.');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[Security] STRIPE_SECRET_KEY is not set — payouts and Stripe connect are disabled.');
  }
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
