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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Store io on app so the upload route can broadcast new photos
app.set('io', io);

app.use(cors());
app.use(express.json());

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer — store uploads to disk, accept images only, max 8MB
const storage = multer.diskStorage({
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
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

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

// Photo upload endpoint
app.post('/api/photos/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  const { username, userId, country, language, mood, caption } = req.body;
  const PORT = process.env.PORT || 3001;
  const HOST = req.headers.host?.split(':')[0] || 'localhost';
  const imageUrl = `http://${HOST}:${PORT}/uploads/${req.file.filename}`;

  const photo = addPhoto({ userId, username, country, language, mood, imageUrl, caption });

  // Broadcast new photo to all connected clients
  const ioInstance = req.app.get('io');
  ioInstance.emit('new_photo', photo);
  ioInstance.emit('photos_feed', getPhotos());

  res.json(photo);
});

// Story upload endpoint
app.post('/api/stories/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  const { username, userId, country, language, mood, caption, filter } = req.body;
  const PORT = process.env.PORT || 3001;
  const HOST = req.headers.host?.split(':')[0] || 'localhost';
  const imageUrl = `http://${HOST}:${PORT}/uploads/${req.file.filename}`;
  const story = addStory({ userId, username, country, language, mood, imageUrl, caption, filter });
  const ioInstance = req.app.get('io');
  ioInstance.emit('stories_updated', getStoriesGrouped());
  res.json(story);
});

app.get('/api/stories', (req, res) => res.json(getStoriesGrouped()));

setupSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WorldBond server running on port ${PORT}`);
  console.log(`Uploads served at http://localhost:${PORT}/uploads`);
});
