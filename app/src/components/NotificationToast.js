import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationsContext';
import { navigate } from '../services/navigationRef';

const TYPE_META = {
  follower:  { icon: '👤', color: '#57f287' },
  gift:      { icon: '🎁', color: '#f06292' },
  random:    { icon: '🌀', color: '#FF0080' },
  live:      { icon: '🔴', color: '#e53935' },
  match:     { icon: '🌍', color: '#FF0080' },
  message:   { icon: '💬', color: '#26c6da' },
  comment:   { icon: '💬', color: '#26c6da' },
  bond:      { icon: '🤝', color: '#57f287' },
  system:    { icon: '🔔', color: '#FFB700' },
  call:      { icon: '📞', color: '#66bb6a' },
  missed:    { icon: '📵', color: '#e53935' },
  like:      { icon: '👣', color: '#f06292' },
  echo:      { icon: '🔁', color: '#FF0080' },
  milestone: { icon: '🏆', color: '#ffd700' },
};

export default function NotificationToast() {
  const { toast, clearToast, markRead } = useNotifications();
  const { top } = useSafeAreaInsets();
  const slideY  = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef(null);
  const toastRef = useRef(null); // stable ref so callbacks always have latest toast

  // Keep ref in sync
  useEffect(() => { toastRef.current = toast; }, [toast]);

  useEffect(() => {
    if (!toast) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    // Slide in
    slideY.setValue(-120);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 65 }).start();

    timerRef.current = setTimeout(hide, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast?.id]);

  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(slideY, { toValue: -120, duration: 240, useNativeDriver: true })
      .start(() => clearToast());
  }

  function handleTap() {
    const t = toastRef.current;
    if (!t) return;

    // Mark read, clear the toast, then navigate
    markRead(t.id);
    clearToast(); // kills the banner immediately

    if (t.type === 'call' || t.type === 'missed') {
      navigate('Notifications');
    } else if (t.fromId) {
      navigate('Profile', { bondUserId: t.fromId });
    } else {
      navigate('Notifications');
    }
  }

  if (!toast) return null;

  const meta = TYPE_META[toast.type] || TYPE_META.system;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={hide}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.wrap, { top: top + 6 }, { transform: [{ translateY: slideY }] }]}>
          <TouchableOpacity style={[styles.card, { borderLeftColor: meta.color }]} onPress={handleTap} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
              <Text style={styles.icon}>{meta.icon}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
              <Text style={styles.sub}   numberOfLines={2}>{toast.body}</Text>
            </View>
            <TouchableOpacity onPress={hide} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // Allow touches through the transparent area below the card
    backgroundColor: 'transparent',
  },
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#1A1D22',
    borderRadius:    18,
    paddingVertical:  12,
    paddingHorizontal: 14,
    borderWidth:     1,
    borderColor:     '#2F3336',
    borderLeftWidth: 4,
    shadowColor:     '#000',
    shadowOpacity:   0.55,
    shadowRadius:    14,
    shadowOffset:    { width: 0, height: 5 },
  },
  iconWrap:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 12 },
  icon:      { fontSize: 22 },
  body:      { flex: 1, flexDirection: 'column', marginRight: 10 },
  title:     { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 3 },
  sub:       { color: '#888', fontSize: 12, lineHeight: 18 },
  closeIcon: { color: '#555', fontSize: 14, padding: 4, flexShrink: 0 },
});
