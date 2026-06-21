import { getAccessToken } from '../services/authApi';

export async function authHeader() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const COLOR_PALETTE = ['#e57373','#ba68c8','#4fc3f7','#81c784','#ffb74d','#f06292','#4db6ac','#7986cb'];
export function stringToColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLOR_PALETTE[Math.abs(h) % COLOR_PALETTE.length];
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - (ts || 0)) / 1000);
  if (s < 60)     return 'now';
  if (s < 3600)   return `${Math.floor(s / 60)}m`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 604800)}w`;
}

export function formatDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
