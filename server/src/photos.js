const { v4: uuidv4 } = require('uuid');

const photos = [];

function addPhoto({ userId, username, country, language, mood, imageUrl, caption }) {
  const photo = {
    id: uuidv4(),
    userId,
    username,
    country,
    language,
    mood: mood || '',
    imageUrl,
    caption: caption || '',
    likes: [],        // array of { userId, username }
    comments: [],     // array of { id, userId, username, country, text, createdAt }
    createdAt: Date.now(),
  };
  photos.unshift(photo);
  // Keep a max of 500 photos in memory
  if (photos.length > 500) photos.pop();
  return photo;
}

function getPhotos() {
  return photos;
}

function getPhotoById(id) {
  return photos.find(p => p.id === id) || null;
}

function toggleLike(photoId, userId, username) {
  const photo = getPhotoById(photoId);
  if (!photo) return null;
  const existing = photo.likes.findIndex(l => l.userId === userId);
  if (existing !== -1) {
    photo.likes.splice(existing, 1);
  } else {
    photo.likes.push({ userId, username });
  }
  return photo;
}

function addComment(photoId, { userId, username, country, text }) {
  const photo = getPhotoById(photoId);
  if (!photo || !text?.trim()) return null;
  const comment = {
    id: uuidv4(),
    userId,
    username,
    country,
    text: text.trim(),
    createdAt: Date.now(),
  };
  photo.comments.push(comment);
  return photo;
}

function deletePhoto(photoId, userId) {
  const idx = photos.findIndex(p => p.id === photoId && p.userId === userId);
  if (idx === -1) return false;
  photos.splice(idx, 1);
  return true;
}

module.exports = { addPhoto, getPhotos, getPhotoById, toggleLike, addComment, deletePhoto };
