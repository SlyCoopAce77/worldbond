import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SERVER_URL } from './socket';

const KEYS = {
  ACCESS:  'bond_access_token',
  REFRESH: 'bond_refresh_token',
  USER_ID: 'bond_user_id',
  PROFILE: 'worldbond_user',
};

export async function register(email, password) {
  const { data } = await axios.post(`${SERVER_URL}/api/auth/register`, { email, password });
  await storeTokens(data);
  return data;
}

export async function login(email, password) {
  const { data } = await axios.post(`${SERVER_URL}/api/auth/login`, { email, password });
  await storeTokens(data);
  return data;
}

export async function logout() {
  const refresh = await AsyncStorage.getItem(KEYS.REFRESH);
  if (refresh) {
    axios.post(`${SERVER_URL}/api/auth/logout`, { refreshToken: refresh }).catch(() => {});
  }
  await AsyncStorage.multiRemove([KEYS.ACCESS, KEYS.REFRESH, KEYS.USER_ID, KEYS.PROFILE]);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(KEYS.ACCESS);
}

export async function getUserId() {
  return AsyncStorage.getItem(KEYS.USER_ID);
}

export async function getSavedProfile() {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  return raw ? JSON.parse(raw) : null;
}

export async function saveSocketProfile(profileData) {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profileData));
}

// Returns true if a token is in storage (does not validate it server-side)
export async function isAuthenticated() {
  const token = await AsyncStorage.getItem(KEYS.ACCESS);
  return !!token;
}

// Call after completing onboarding — persists socket-compatible profile
export async function finalizeProfile({ userId, display_name, language, country, connection_types }) {
  const profile = { username: display_name, language, country, userId, connection_types };
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  return profile;
}

// Auto-refresh access token using stored refresh token
export async function refreshAccessToken() {
  const refreshToken = await AsyncStorage.getItem(KEYS.REFRESH);
  if (!refreshToken) throw new Error('No refresh token');
  const { data } = await axios.post(`${SERVER_URL}/api/auth/refresh`, { refreshToken });
  await AsyncStorage.setItem(KEYS.ACCESS, data.access);
  return data.access;
}

async function storeTokens({ userId, access, refresh }) {
  await AsyncStorage.multiSet([
    [KEYS.ACCESS,  access],
    [KEYS.REFRESH, refresh],
    [KEYS.USER_ID, userId],
  ]);
}

// Axios interceptor — attach token and auto-refresh on 401
let isRefreshing = false;
let refreshQueue = [];

axios.interceptors.request.use(async (config) => {
  if (config.url?.includes('/api/auth/')) return config;
  const token = await AsyncStorage.getItem(KEYS.ACCESS);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  res => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry || original.url?.includes('/api/auth/')) {
      return Promise.reject(err);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => refreshQueue.push({ resolve, reject }))
        .then(token => { original.headers.Authorization = `Bearer ${token}`; return axios(original); });
    }

    isRefreshing = true;
    try {
      const token = await refreshAccessToken();
      refreshQueue.forEach(p => p.resolve(token));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${token}`;
      return axios(original);
    } catch (refreshErr) {
      refreshQueue.forEach(p => p.reject(refreshErr));
      refreshQueue = [];
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
