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

    function onFollower({ followerId, followerName, followerCountry }) {
      push({
        type: 'follower',
        title: 'New Follower',
        body: `${followerName} from ${followerCountry || 'somewhere'} started following you 🌍`,
        from: followerName,
        fromId: followerId,
        fromCountry: followerCountry,
      });
    }

    function onGift({ senderId, senderName, senderCountry, gift }) {
      push({
        type: 'gift',
        title: 'Gift Received! 🎁',
        body: `${senderName} sent you ${gift?.emoji || '🎁'} ${gift?.name || 'a gift'}`,
        from: senderName,
        fromId: senderId,
        fromCountry: senderCountry,
      });
    }

    function onRandomMatch({ matchedUser }) {
      push({
        type: 'random',
        title: 'Random Connect Match!',
        body: `You were matched with ${matchedUser?.username} from ${matchedUser?.country} 🌀`,
        from: matchedUser?.username,
        fromId: matchedUser?.userId,
        fromCountry: matchedUser?.country,
      });
    }

    function onLiveViewerJoined({ viewerId, viewerName, viewerCountry, count }) {
      push({
        type: 'live',
        title: 'Someone joined your Live',
        body: `${viewerName} from ${viewerCountry || 'somewhere'} is watching (${count} viewers) 🔴`,
        from: viewerName,
        fromId: viewerId,
      });
    }

    socket.on('new_follower',        onFollower);
    socket.on('gift_received',       onGift);
    socket.on('random_match',        onRandomMatch);
    socket.on('live_viewer_joined',  onLiveViewerJoined);

    return () => {
      socket.off('new_follower',       onFollower);
      socket.off('gift_received',      onGift);
      socket.off('random_match',       onRandomMatch);
      socket.off('live_viewer_joined', onLiveViewerJoined);
    };
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
