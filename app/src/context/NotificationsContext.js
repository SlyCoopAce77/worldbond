import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { getSocket, SERVER_URL } from '../services/socket';
import { getAccessToken } from '../services/authApi';

const NotificationsContext = createContext(null);

const STORAGE_KEY = 'worldbond_notifications_v3';
const MAX         = 80;

function makeId() {
  return String(Date.now()) + String(Math.floor(Math.random() * 10000));
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady]                 = useState(false);
  const [toast, setToast]                 = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setNotifications(JSON.parse(raw)); } catch {}
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX)));
  }, [notifications, ready]);

  // Push notifications (APNs) — reaches the user when the app is backgrounded
  // or killed, unlike everything below which is socket-only and only works
  // while the app is open and connected.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    async function registerToken(token) {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) return; // not logged in yet — register once we are
        await fetch(`${SERVER_URL}/api/push/register-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ token, platform: 'ios' }),
        });
      } catch (err) {
        console.warn('[Push] token registration failed:', err.message);
      }
    }

    PushNotificationIOS.addEventListener('register', registerToken);
    PushNotificationIOS.addEventListener('registrationError', err => {
      console.warn('[Push] registration error:', err.message);
    });
    PushNotificationIOS.addEventListener('notification', notification => {
      // The native side (willPresentNotification in AppDelegate.mm) already
      // shows the banner — this just needs to complete the iOS callback.
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    });

    PushNotificationIOS.requestPermissions({ alert: true, badge: true, sound: true });

    return () => {
      PushNotificationIOS.removeEventListener('register');
      PushNotificationIOS.removeEventListener('registrationError');
      PushNotificationIOS.removeEventListener('notification');
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();

    function push(fields) {
      const notif = { id: makeId(), read: false, ts: Date.now(), ...fields };
      setNotifications(prev => [notif, ...prev].slice(0, MAX));
      setToast(notif);
    }

    const on = (event, handler) => {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    };

    const offs = [

      // ── Bonding ────────────────────────────────────────────────────────────
      on('bond_formed', ({ userId, username, country }) => {
        push({
          type: 'bond',
          title: 'New Bond',
          body: `${username} from ${country || 'somewhere'} bonded with you`,
          from: username, fromId: userId, fromCountry: country,
        });
      }),

      on('bond_request', ({ userId, username, country }) => {
        push({
          type: 'bond',
          title: 'Bond Request',
          body: `${username} from ${country || 'somewhere'} wants to bond with you`,
          from: username, fromId: userId, fromCountry: country,
        });
      }),

      // ── Followers ──────────────────────────────────────────────────────────
      on('new_follower', ({ followerId, followerName, followerCountry }) => {
        push({
          type: 'follower',
          title: 'New Follower',
          body: `${followerName} from ${followerCountry || 'somewhere'} started following you`,
          from: followerName, fromId: followerId, fromCountry: followerCountry,
        });
      }),

      // ── Gifts (Live) ───────────────────────────────────────────────────────
      on('gift_received', ({ senderId, senderName, senderCountry, gift }) => {
        push({
          type: 'gift',
          title: 'Gift Received',
          body: `${senderName} sent you ${gift?.name || 'a gift'} during your Live`,
          from: senderName, fromId: senderId, fromCountry: senderCountry,
        });
      }),

      // ── Live ───────────────────────────────────────────────────────────────
      on('live_viewer_joined', ({ viewerId, viewerName, viewerCountry, count }) => {
        push({
          type: 'live',
          title: 'Someone joined your Live',
          body: `${viewerName} is watching — ${count} viewer${count !== 1 ? 's' : ''} total`,
          from: viewerName, fromId: viewerId, fromCountry: viewerCountry,
        });
      }),

      on('bond_went_live', ({ userId, username, country, title }) => {
        push({
          type: 'live',
          title: `${username} is live`,
          body: title ? `"${title}"` : `Your bond ${username} just started streaming`,
          from: username, fromId: userId, fromCountry: country,
        });
      }),

      // ── Connect ────────────────────────────────────────────────────────────
      on('random_match', ({ matchedUser }) => {
        push({
          type: 'random',
          title: 'Random Connect Match',
          body: `You were matched with ${matchedUser?.username} from ${matchedUser?.country}`,
          from: matchedUser?.username, fromId: matchedUser?.userId, fromCountry: matchedUser?.country,
        });
      }),

      on('new_match_suggestion', ({ userId, username, country, reason }) => {
        push({
          type: 'match',
          title: 'Bond Suggestion',
          body: reason || `${username} from ${country} might be a great bond`,
          from: username, fromId: userId, fromCountry: country,
        });
      }),

      // ── Messages ───────────────────────────────────────────────────────────
      on('new_message_notif', ({ fromId, fromName, fromCountry, preview }) => {
        push({
          type: 'message',
          title: 'New Message',
          body: `${fromName}: ${preview}`,
          from: fromName, fromId, fromCountry,
        });
      }),

      // ── Icebreaker ─────────────────────────────────────────────────────────
      on('icebreaker_response_commented', ({ fromId, fromName, fromCountry, preview }) => {
        push({
          type: 'comment',
          title: 'Reply on your answer',
          body: `${fromName}: ${preview}`,
          from: fromName, fromId, fromCountry,
        });
      }),

      // ── Stamp & Monument Challenges ────────────────────────────────────────
      on('stamp_challenged', ({ challengerName, stampName, challengerCountry }) => {
        push({
          type: 'milestone',
          title: 'Your stamp is being challenged',
          body: `${challengerName} has initiated a 7-day challenge for your ${stampName} stamp`,
          from: challengerName, fromCountry: challengerCountry,
        });
      }),

      on('stamp_won', ({ stampName, loserName }) => {
        push({
          type: 'milestone',
          title: 'Stamp challenge won',
          body: `You won the ${stampName} stamp challenge — you now hold the stamp`,
        });
      }),

      on('stamp_lost', ({ stampName, winnerName }) => {
        push({
          type: 'milestone',
          title: 'Stamp challenge lost',
          body: `${winnerName} claimed your ${stampName} stamp after a 7-day contest`,
          from: winnerName,
        });
      }),

      on('monument_challenged', ({ challengerName, monumentName, challengerCountry }) => {
        push({
          type: 'milestone',
          title: 'Your monument is being challenged',
          body: `${challengerName} has challenged your ${monumentName} monument hold`,
          from: challengerName, fromCountry: challengerCountry,
        });
      }),

      on('monument_won', ({ monumentName }) => {
        push({
          type: 'milestone',
          title: 'Monument challenge won',
          body: `You successfully defended (or claimed) ${monumentName}`,
        });
      }),

      on('monument_lost', ({ monumentName, winnerName }) => {
        push({
          type: 'milestone',
          title: 'Monument challenge lost',
          body: `${winnerName} claimed ${monumentName} from you`,
          from: winnerName,
        });
      }),

      // ── Coin payouts (stamps, monuments, gifts) ────────────────────────────
      on('royalty_received', ({ amount, source, sourceName }) => {
        push({
          type: 'payout',
          title: 'Bond Coins earned',
          body: `+${amount} BC from ${sourceName || source || 'your held stamp/monument'}`,
        });
      }),

      on('coin_payout', ({ amount, reason }) => {
        push({
          type: 'payout',
          title: 'Bond Coins received',
          body: `+${amount} BC — ${reason || 'payout'}`,
        });
      }),

      // ── System ─────────────────────────────────────────────────────────────
      on('system_notification', ({ title, body }) => {
        push({ type: 'system', title, body });
      }),

    ];

    return () => offs.forEach(off => off());
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }
  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }
  function dismiss(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }
  function dismissAll() {
    setNotifications([]);
  }
  function clearToast() {
    setToast(null);
  }

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, toast, clearToast, markRead, markAllRead, dismiss, dismissAll }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationsProvider');
  return ctx;
}
