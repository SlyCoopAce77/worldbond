import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../services/socket';

const NotificationsContext = createContext(null);

const STORAGE_KEY = 'worldbond_notifications_v2';
const MAX          = 60;

function makeId() {
  return String(Date.now()) + String(Math.floor(Math.random() * 10000));
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady]                 = useState(false);
  const [toast, setToast]                 = useState(null);

  // Hydrate from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setNotifications(JSON.parse(raw)); } catch {}
      }
      setReady(true);
    });
  }, []);

  // Persist on change
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX)));
  }, [notifications, ready]);

  // Socket event listeners
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
      on('new_follower', ({ followerId, followerName, followerCountry }) => {
        push({
          type: 'follower',
          title: 'New Follower',
          body: `${followerName} from ${followerCountry || 'somewhere'} started following you`,
          from: followerName, fromId: followerId, fromCountry: followerCountry,
        });
      }),

      on('gift_received', ({ senderId, senderName, senderCountry, gift }) => {
        push({
          type: 'gift',
          title: 'Gift Received',
          body: `${senderName} sent you ${gift?.emoji || '🎁'} ${gift?.name || 'a gift'}`,
          from: senderName, fromId: senderId, fromCountry: senderCountry,
        });
      }),

      on('random_match', ({ matchedUser }) => {
        push({
          type: 'random',
          title: 'Random Connect Match',
          body: `You were matched with ${matchedUser?.username} from ${matchedUser?.country}`,
          from: matchedUser?.username, fromId: matchedUser?.userId, fromCountry: matchedUser?.country,
        });
      }),

      on('live_viewer_joined', ({ viewerId, viewerName, viewerCountry, count }) => {
        push({
          type: 'live',
          title: 'Someone joined your Live',
          body: `${viewerName} is watching — ${count} viewer${count !== 1 ? 's' : ''} total`,
          from: viewerName, fromId: viewerId, fromCountry: viewerCountry,
        });
      }),

      on('incoming_call', ({ from, callerName, callerCountry, callType }) => {
        push({
          type: 'call',
          title: `Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`,
          body: `${callerName} from ${callerCountry || 'somewhere'} is calling you`,
          from: callerName, fromId: from, fromCountry: callerCountry,
        });
      }),

      on('new_message_notif', ({ fromId, fromName, fromCountry, preview }) => {
        push({
          type: 'message',
          title: 'New Message',
          body: `${fromName}: ${preview}`,
          from: fromName, fromId, fromCountry,
        });
      }),

      on('photo_liked', ({ fromId, fromName, fromCountry }) => {
        push({
          type: 'like',
          title: 'Someone liked your post',
          body: `${fromName} from ${fromCountry || 'somewhere'} liked your post`,
          from: fromName, fromId, fromCountry,
        });
      }),

      on('photo_commented', ({ fromId, fromName, fromCountry, preview }) => {
        push({
          type: 'comment',
          title: 'New comment on your post',
          body: `${fromName}: ${preview}`,
          from: fromName, fromId, fromCountry,
        });
      }),

      on('photo_echoed', ({ fromId, fromName, fromCountry }) => {
        push({
          type: 'echo',
          title: 'Your post was echoed',
          body: `${fromName} from ${fromCountry || 'somewhere'} echoed your post`,
          from: fromName, fromId, fromCountry,
        });
      }),

      on('icebreaker_response_liked', ({ fromId, fromName, fromCountry }) => {
        push({
          type: 'like',
          title: 'Someone liked your answer',
          body: `${fromName} from ${fromCountry || 'somewhere'} liked your icebreaker answer`,
          from: fromName, fromId, fromCountry,
        });
      }),

      on('icebreaker_response_commented', ({ fromId, fromName, fromCountry, preview }) => {
        push({
          type: 'comment',
          title: 'New reply on your answer',
          body: `${fromName}: ${preview}`,
          from: fromName, fromId, fromCountry,
        });
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
