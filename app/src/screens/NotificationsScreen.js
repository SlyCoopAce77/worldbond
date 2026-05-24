import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
const TYPES = {
  match:     { icon: '🌍', label: 'Match',    color: '#5865f2', bg: '#5865f215', border: '#5865f240' },
  message:   { icon: '💬', label: 'Message',  color: '#26c6da', bg: '#26c6da15', border: '#26c6da40' },
  missed:    { icon: '📵', label: 'Missed',   color: '#e53935', bg: '#e5393515', border: '#e5393540' },
  bond:      { icon: '🤝', label: 'Bond',     color: '#57f287', bg: '#57f28715', border: '#57f28740' },
  like:      { icon: '❤️',  label: 'Like',    color: '#f06292', bg: '#f0629215', border: '#f0629240' },
  call:      { icon: '📞', label: 'Call',     color: '#66bb6a', bg: '#66bb6a15', border: '#66bb6a40' },
  system:    { icon: '🔔', label: 'System',   color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b40' },
  milestone: { icon: '🏆', label: 'Badge',    color: '#ffd700', bg: '#ffd70015', border: '#ffd70040' },
};

const FILTERS = ['All', 'Matches', 'Messages', 'Calls', 'Bonds', 'Likes'];

const FILTER_TYPE_MAP = {
  Matches:  ['match'],
  Messages: ['message'],
  Calls:    ['missed', 'call'],
  Bonds:    ['bond'],
  Likes:    ['like'],
};

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED = [
  { id: '1',  type: 'match',     title: 'New Match!',              body: 'You matched with Amara from Nigeria 🇳🇬',         time: 120,    read: false, from: 'Amara' },
  { id: '2',  type: 'message',   title: 'Lena sent a message',     body: '"Hey! Are you free to chat tonight?" 👋',         time: 300,    read: false, from: 'Lena' },
  { id: '3',  type: 'bond',      title: 'Bond Request',            body: 'Carlos wants to bond with you 🤝',                time: 900,    read: false, from: 'Carlos' },
  { id: '4',  type: 'missed',    title: 'Missed Call',             body: 'You missed a voice call from Yuki 📵',            time: 1800,   read: false, from: 'Yuki' },
  { id: '5',  type: 'like',      title: 'Photo liked',             body: 'Priya liked your travel photo ❤️',                time: 3600,   read: true,  from: 'Priya' },
  { id: '6',  type: 'match',     title: 'New Match!',              body: 'You matched with Diego from Mexico 🇲🇽',          time: 7200,   read: true,  from: 'Diego' },
  { id: '7',  type: 'message',   title: 'Aisha sent a message',    body: '"I loved your story about Tokyo!"',               time: 14400,  read: true,  from: 'Aisha' },
  { id: '8',  type: 'milestone', title: 'Achievement Unlocked!',   body: "You've been active 7 days in a row 🏆",           time: 86400,  read: true,  from: null },
  { id: '9',  type: 'call',      title: 'Call accepted',           body: 'Your call with Marco lasted 12 minutes 📞',       time: 86400,  read: true,  from: 'Marco' },
  { id: '10', type: 'bond',      title: 'Bond accepted!',          body: 'Sofia accepted your bond request 🌍',            time: 172800, read: true,  from: 'Sofia' },
  { id: '11', type: 'system',    title: 'Your profile is 80%',     body: 'Add a voice note to complete your profile 🎙️',   time: 172800, read: true,  from: null },
  { id: '12', type: 'like',      title: '3 people liked you',      body: 'Check who swiped right on you today ❤️',          time: 259200, read: true,  from: null },
  { id: '13', type: 'match',     title: 'New Match!',              body: 'You matched with Fatima from Morocco 🇲🇦',        time: 345600, read: true,  from: 'Fatima' },
  { id: '14', type: 'system',    title: 'Weekly Wrap',             body: '5 matches · 12 messages · 3 bonds this week 🌟', time: 604800, read: true,  from: null },
];

function timeAgo(secs) {
  if (secs < 60)   return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return `${Math.floor(secs / 604800)}w ago`;
}

// ─── Notification row ─────────────────────────────────────────────────────────
function NotifRow({ item, index, onPress, onDismiss }) {
  const meta     = TYPES[item.type] || TYPES.system;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleX   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 50, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 60, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(scaleX,   { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss(item.id));
  }

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scaleX }] }}>
      <TouchableOpacity
        style={[
          nr.row,
          !item.read && { borderLeftColor: meta.color, borderLeftWidth: 3 },
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        {/* Icon bubble */}
        <View style={[nr.iconWrap, { backgroundColor: meta.bg, borderColor: meta.border }]}>
          <Text style={nr.iconText}>{meta.icon}</Text>
        </View>

        {/* Content */}
        <View style={nr.body}>
          <View style={nr.titleRow}>
            <Text style={[nr.title, !item.read && nr.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={nr.time}>{timeAgo(item.time)}</Text>
          </View>
          <Text style={nr.bodyText} numberOfLines={2}>{item.body}</Text>
        </View>

        {/* Unread dot */}
        {!item.read && <View style={[nr.dot, { backgroundColor: meta.color }]} />}

        {/* Dismiss */}
        <TouchableOpacity style={nr.dismiss} onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={nr.dismissIcon}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const nr = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122a', borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: '#1e1e38', marginBottom: 10 },
  iconWrap:    { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  iconText:    { fontSize: 22 },
  body:        { flex: 1, gap: 3 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:       { color: '#ffffff88', fontSize: 13, fontWeight: '600', flex: 1 },
  titleUnread: { color: '#fff' },
  time:        { color: '#444', fontSize: 11, flexShrink: 0, marginLeft: 6 },
  bodyText:    { color: '#555', fontSize: 12, lineHeight: 17 },
  dot:         { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginRight: 4 },
  dismiss:     { padding: 4, flexShrink: 0 },
  dismissIcon: { color: '#333', fontSize: 12 },
});

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[fc.chip, active && fc.chipActive]}
    >
      <Text style={[fc.text, active && fc.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const fc = StyleSheet.create({
  chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38' },
  chipActive: { backgroundColor: '#5865f222', borderColor: '#5865f255' },
  text:       { color: '#555', fontSize: 13, fontWeight: '600' },
  textActive: { color: '#5865f2' },
});

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ filter }) {
  return (
    <View style={es.wrap}>
      <Text style={{ fontSize: 52 }}>🔔</Text>
      <Text style={es.title}>All caught up!</Text>
      <Text style={es.sub}>
        {filter === 'All'
          ? 'No notifications yet. Start connecting to see activity here.'
          : `No ${filter.toLowerCase()} notifications.`}
      </Text>
    </View>
  );
}
const es = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: 40 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:   { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 21 },
});

// ─── Stats row ────────────────────────────────────────────────────────────────
function StatsRow({ items }) {
  const unread  = items.filter(n => !n.read).length;
  const matches = items.filter(n => n.type === 'match').length;
  const bonds   = items.filter(n => n.type === 'bond').length;

  const stats = [
    { label: 'Unread',  value: unread,  color: '#5865f2' },
    { label: 'Matches', value: matches, color: '#f59e0b' },
    { label: 'Bonds',   value: bonds,   color: '#57f287' },
  ];

  return (
    <View style={sr.row}>
      {stats.map((s, i) => (
        <View key={i} style={sr.stat}>
          <Text style={[sr.val, { color: s.color }]}>{s.value}</Text>
          <Text style={sr.lbl}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
const sr = StyleSheet.create({
  row:  { flexDirection: 'row', backgroundColor: '#12122a', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e38', marginHorizontal: 20, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  val:  { fontSize: 22, fontWeight: '900' },
  lbl:  { color: '#555', fontSize: 11, fontWeight: '600', marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const [items,     setItems]     = useState(SEED);
  const [filter,    setFilter]    = useState('All');
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const displayed = useMemo(() => {
    const types = FILTER_TYPE_MAP[filter];
    if (!types) return items;
    return items.filter(n => types.includes(n.type));
  }, [items, filter]);

  const unreadCount = useMemo(() => items.filter(n => !n.read).length, [items]);

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  }

  function dismiss(id) {
    setItems(prev => prev.filter(n => n.id !== id));
  }

  function handlePress(item) {
    setItems(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    // TODO: navigate based on type
    // if (item.type === 'message') navigation.navigate('Chat', ...)
    // if (item.type === 'match')   navigation.navigate('Bond', ...)
  }

  const headerSlide = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerSlide }] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </Animated.View>

      {/* ── Stats ── */}
      <StatsRow items={items} />

      {/* ── Filters ── */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={f => f}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <FilterChip
            label={item}
            active={filter === item}
            onPress={() => setFilter(item)}
          />
        )}
        style={{ flexGrow: 0, marginBottom: 16 }}
      />

      {/* ── List ── */}
      <FlatList
        data={displayed}
        keyExtractor={n => n.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Empty filter={filter} />}
        renderItem={({ item, index }) => (
          <NotifRow
            item={item}
            index={index}
            onPress={handlePress}
            onDismiss={dismiss}
          />
        )}
        ListFooterComponent={
          displayed.length > 0 ? (
            <TouchableOpacity style={styles.clearAll} onPress={() => setItems([])}>
              <Text style={styles.clearAllText}>Clear all notifications</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0a0a18' },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  backBtn:         { width: 40, height: 40, borderRadius: 12, backgroundColor: '#12122a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e1e38' },
  backIcon:        { color: '#fff', fontSize: 26, lineHeight: 30, marginTop: -2 },
  headerCenter:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:           { color: '#fff', fontSize: 20, fontWeight: '900' },
  unreadBadge:     { backgroundColor: '#5865f2', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  markAllBtn:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: '#5865f218', borderWidth: 1, borderColor: '#5865f240' },
  markAllText:     { color: '#5865f2', fontSize: 12, fontWeight: '700' },

  filtersRow:      { paddingHorizontal: 20, gap: 8 },

  list:            { paddingHorizontal: 20, paddingBottom: 40 },

  clearAll:        { alignSelf: 'center', marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: '#e5393530' },
  clearAllText:    { color: '#e5393588', fontSize: 13, fontWeight: '600' },
});
