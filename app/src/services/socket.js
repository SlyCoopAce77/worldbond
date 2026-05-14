import { io } from 'socket.io-client';

// LOCAL DEV:  'http://localhost:3001'  (Metro bundler / iOS simulator)
// REAL DEVICE: 'http://192.168.x.x:3001'  (your Mac's local IP)
// PRODUCTION:  'https://your-app.up.railway.app'  ← paste your Railway URL here
export const SERVER_URL = 'http://localhost:3001';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, { transports: ['websocket'] });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
