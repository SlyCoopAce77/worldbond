import { io } from 'socket.io-client';

export const SERVER_URL = 'https://worldbond-server-production.up.railway.app';

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
