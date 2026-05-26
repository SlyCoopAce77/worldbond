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
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
    cb(null, allowed.includes(file.mimetype) || file.mimetype.startsWith('image/'));
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
    const { username, userId, country, language, mood, caption, filter } = req.body;
    const imageUrl = await resolveImageUrl(req, 'photos');
    const photo = addPhoto({ userId, username, country, language, mood, imageUrl, caption, filter });

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
