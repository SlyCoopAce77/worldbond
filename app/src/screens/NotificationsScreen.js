import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Animated, Dimensions,
} from 'react-native';
import { useNotifications } from '../context/NotificationsContext';
import { timeAgo } from '../utils/apiUtils';

const { width } = Dimensions.get('window');

// ─── Type config ──────────────────────────────────────────────────────────────
// icon shown left of each row, color tints the unread dot
const TYPE = {
  follower:  { icon: '👤', color: '#57f287', label: 'followed you'         },
  gift:      { icon: '🎁', color: '#f06292', label: 'sent you a gift'       },
  random:    { icon: '🌀', color: '#6C47FF', label: 'random match'          },
  live:      { icon: '🔴', color: '#e53935', label: 'joined your Live'      },
  match:     { icon: '🌍', color: '#6C47FF', label: 'new match'             },
  message:   { icon: '💬', color: '#26c6da', label: 'sent you a message'    },
  comment:   { icon: '💬', color: '#26c6da', label: 'replied to you'        },
  bond:      { icon: '🤝', color: '#57f287', label: 'bonded with you'       },
  system:    { icon: '🔔', color: '#FFB700', label: 'notification'          },
  call:      { icon: '📞', color: '#66bb6a', label: 'called you'            },
  missed:    { icon: '📵', color: '#e53935', label: 'missed call'           },
  like:      { icon: '👣', color: '#6C47FF', label: 'left a footprint'      },
  echo:      { icon: '🔁', color: '#57f287', label: 'echoed your post'      },
  milestone: { icon: '🏆', color: '#ffd700', label: 'milestone'             },
  payout:    { icon: '💰', color: '#FFB700', label: 'payout'                },
  mention:   { icon: '💬', color: '#26c6da', label: 'mentioned you'         },
};

// "All" tab: everything
// "Footprints" tab: direct personal interactions — footprints (likes), gifts,
//   payouts, @mentions in comments, echoes, replies to you
const FOOTPRINT_TYPES = new Set(['like', 'echo', 'gift', 'payout', 'mention', 'comment']);

// ─── Row (X/Twitter style) ────────────────────────────────────────────────────
function NotifRow({ item, onPress, onDismiss }) {
  const meta  = TYPE[item.type] || TYPE.system;
  const fade  = useRef(new Animated.Value(0)).current;
  const tx    = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(tx,   { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateX: tx }] }}>
      <TouchableOpacity
        style={[s.row, !item.read && s.rowUnread]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        {/* Unread dot */}
        {!item.read && <View style={[s.unreadDot, { backgroundColor: meta.color }]} />}

        {/* Type icon — large, no box, X/Twitter style */}
        <Text style={s.rowIcon}>{meta.icon}</Text>

        {/* Content */}
        <View style={s.rowBody}>
          <View style={s.rowTop}>
            <Text style={[s.rowTitle, !item.read && s.rowTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={s.rowTime}>{timeAgo(item.ts)}</Text>
          </View>
          {!!item.body && (
            <Text style={s.rowSub} numberOfLines={2}>{item.body}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ tab }) {
  const isFootprints = tab === 'footprints';
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{isFootprints ? '👣' : '🔔'}</Text>
      <Text style={s.emptyTitle}>{isFootprints ? 'No footprints yet' : 'Nothing here yet'}</Text>
      <Text style={s.emptySub}>
        {isFootprints
          ? 'When someone likes, echoes, gifts you, or mentions you — it shows here.'
          : 'Activity from across the app shows up here as it happens.'}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const { notifications, unreadCount, markRead, markAllRead, dismiss, dismissAll } = useNotifications();
  const [tab, setTab]       = useState('all');           // 'all' | 'footprints'
  const indicatorX          = useRef(new Animated.Value(0)).current;
  const headerFade          = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  // Slide the underline indicator
  const TAB_W = width / 2;
  function switchTab(next) {
    setTab(next);
    Animated.spring(indicatorX, {
      toValue: next === 'all' ? 0 : TAB_W,
      useNativeDriver: true,
      friction: 10,
      tension: 80,
    }).start();
  }

  const displayed = useMemo(() => {
    if (tab === 'footprints') return notifications.filter(n => FOOTPRINT_TYPES.has(n.type));
    return notifications;
  }, [notifications, tab]);

  const footprintUnread = useMemo(
    () => notifications.filter(n => FOOTPRINT_TYPES.has(n.type) && !n.read).length,
    [notifications],
  );

  function handlePress(item) {
    markRead(item.id);
    if (item.fromId) navigation.navigate('Profile', { bondUserId: item.fromId });
  }

  return (
    <SafeAreaView style={s.container}>

      {/* ── Header ── */}
      <Animated.View style={[s.header, { opacity: headerFade }]}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        {unreadCount > 0
          ? <TouchableOpacity onPress={markAllRead}>
              <Text style={s.markAll}>Mark all read</Text>
            </TouchableOpacity>
          : <View style={{ width: 80 }} />
        }
      </Animated.View>

      {/* ── Tab bar (X/Twitter style) ── */}
      <View style={s.tabBar}>
        {/* All tab */}
        <TouchableOpacity style={s.tab} onPress={() => switchTab('all')} activeOpacity={0.8}>
          <View style={s.tabInner}>
            <Text style={[s.tabTxt, tab === 'all' && s.tabTxtOn]}>All</Text>
            {unreadCount > 0 && (
              <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>
            )}
          </View>
        </TouchableOpacity>

        {/* Footprints tab */}
        <TouchableOpacity style={s.tab} onPress={() => switchTab('footprints')} activeOpacity={0.8}>
          <View style={s.tabInner}>
            <Text style={[s.tabTxt, tab === 'footprints' && s.tabTxtOn]}>👣 Footprints</Text>
            {footprintUnread > 0 && (
              <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{footprintUnread > 99 ? '99+' : footprintUnread}</Text></View>
            )}
          </View>
        </TouchableOpacity>

        {/* Sliding underline */}
        <Animated.View
          style={[s.tabIndicator, { width: TAB_W, transform: [{ translateX: indicatorX }] }]}
        />
      </View>

      {/* ── Feed ── */}
      <FlatList
        data={displayed}
        keyExtractor={n => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Empty tab={tab} />}
        renderItem={({ item, index }) => (
          <NotifRow item={item} onPress={handlePress} onDismiss={dismiss} />
        )}
        ListFooterComponent={
          displayed.length > 0 ? (
            <TouchableOpacity style={s.clearAll} onPress={dismissAll}>
              <Text style={s.clearAllTxt}>Clear all</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  back:           { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  backTxt:        { color: '#fff', fontSize: 24, lineHeight: 28, marginTop: -1 },
  headerTitle:    { color: '#fff', fontSize: 18, fontWeight: '900' },
  markAll:        { color: '#6C47FF', fontSize: 12, fontWeight: '700' },

  // Tab bar
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1A1A1A', position: 'relative' },
  tab:            { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabInner:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabTxt:         { color: '#555', fontSize: 15, fontWeight: '700' },
  tabTxtOn:       { color: '#fff' },
  tabBadge:       { backgroundColor: '#6C47FF', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:    { color: '#fff', fontSize: 10, fontWeight: '900' },
  tabIndicator:   { position: 'absolute', bottom: 0, height: 2, backgroundColor: '#6C47FF', borderRadius: 1 },

  // List
  list:           { paddingBottom: 60 },

  // Row
  row:            { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#111' },
  rowUnread:      { backgroundColor: '#0A0A12' },
  unreadDot:      { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 10, flexShrink: 0 },
  rowIcon:        { fontSize: 26, marginRight: 14, marginTop: 1, flexShrink: 0 },
  rowBody:        { flex: 1 },
  rowTop:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  rowTitle:       { color: '#555', fontSize: 14, fontWeight: '500', flex: 1, lineHeight: 20 },
  rowTitleUnread: { color: '#fff', fontWeight: '700' },
  rowTime:        { color: '#333', fontSize: 12, flexShrink: 0, marginTop: 1 },
  rowSub:         { color: '#3A3A3A', fontSize: 13, lineHeight: 19, marginTop: 4 },

  // Empty
  empty:          { alignItems: 'center', paddingTop: 90, paddingHorizontal: 50, gap: 14 },
  emptyIcon:      { fontSize: 44 },
  emptyTitle:     { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptySub:       { color: '#444', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Clear
  clearAll:       { alignSelf: 'center', marginTop: 30, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  clearAllTxt:    { color: '#333', fontSize: 12, fontWeight: '600' },
});
