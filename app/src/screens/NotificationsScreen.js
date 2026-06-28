import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Animated, Dimensions,
} from 'react-native';
import { useNotifications } from '../context/NotificationsContext';
import { timeAgo } from '../utils/apiUtils';

const { width } = Dimensions.get('window');
const BOND_PINK = '#FF0080';

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE = {
  follower:  { sym: '+',  color: '#57f287', label: 'followed you'         },
  gift:      { sym: 'G',  color: '#f06292', label: 'sent you a gift'       },
  random:    { sym: '~',  color: BOND_PINK,  label: 'random match'          },
  live:      { sym: '•',  color: '#e53935', label: 'joined your Live'      },
  match:     { sym: 'M',  color: BOND_PINK,  label: 'new match'             },
  message:   { sym: '→',  color: '#26c6da', label: 'sent you a message'    },
  comment:   { sym: 'C',  color: '#26c6da', label: 'replied to you'        },
  bond:      { sym: 'B',  color: '#57f287', label: 'bonded with you'       },
  system:    { sym: '!',  color: '#FFB700', label: 'notification'          },
  milestone: { sym: '#',  color: '#ffd700', label: 'milestone'             },
  payout:    { sym: '$',  color: '#FFB700', label: 'payout'                },
};

const FOOTPRINT_TYPES = new Set(['gift', 'bond', 'payout', 'milestone']);

// ─── Type icon (colored badge, no emoji) ─────────────────────────────────────
function TypeIcon({ meta }) {
  return (
    <View style={[ti.box, { backgroundColor: meta.color + '18', borderColor: meta.color + '35' }]}>
      <Text style={[ti.sym, { color: meta.color }]}>{meta.sym}</Text>
    </View>
  );
}
const ti = StyleSheet.create({
  box: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: 12, flexShrink: 0 },
  sym: { fontSize: 14, fontWeight: '900' },
});

// ─── Custom bell (BOND_PINK ring, no emoji) ───────────────────────────────────
function EmptyBell() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1,   duration: 1800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(ring2, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(ring2, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={eb.wrap}>
      {/* Outer pulse ring */}
      <Animated.View style={[eb.outerRing, { opacity: ring2 }]} />
      {/* Inner ring */}
      <Animated.View style={[eb.innerRing, { opacity: pulse }]}>
        {/* Bell dome */}
        <View style={eb.dome} />
        {/* Bell body */}
        <View style={eb.body} />
        {/* Bell base ledge */}
        <View style={eb.ledge} />
      </Animated.View>
      {/* Clapper dot */}
      <View style={eb.clapper} />
    </View>
  );
}
const eb = StyleSheet.create({
  wrap:      { alignItems: 'center', marginBottom: 8 },
  outerRing: { position: 'absolute', top: -14, width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: BOND_PINK + '40' },
  innerRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: BOND_PINK, alignItems: 'center', justifyContent: 'center', gap: 0 },
  dome:      { width: 22, height: 12, borderRadius: 11, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderWidth: 2, borderColor: BOND_PINK, backgroundColor: 'transparent', borderBottomWidth: 0 },
  body:      { width: 26, height: 10, backgroundColor: 'transparent', borderLeftWidth: 2, borderRightWidth: 2, borderColor: BOND_PINK, marginTop: -1 },
  ledge:     { width: 30, height: 3, borderRadius: 2, backgroundColor: BOND_PINK, opacity: 0.8 },
  clapper:   { width: 7, height: 7, borderRadius: 4, backgroundColor: BOND_PINK, marginTop: 4, opacity: 0.7 },
});

// ─── Footprint mark (no emoji) ────────────────────────────────────────────────
function EmptyFootprint() {
  const fade = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(fade, { toValue: 1,   duration: 1600, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0.5, duration: 1600, useNativeDriver: true }),
    ])).start();
  }, []);
  const dot = (w, h, ml = 0, mt = 0) => ({
    width: w, height: h, borderRadius: Math.min(w, h) / 2,
    backgroundColor: BOND_PINK, marginLeft: ml, marginTop: mt,
  });
  return (
    <Animated.View style={[fp.wrap, { opacity: fade }]}>
      {/* Left foot */}
      <View style={fp.foot}>
        <View style={dot(8, 5, 0, 0)} />
        <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
          <View style={dot(5, 4)} />
          <View style={dot(5, 4)} />
          <View style={dot(5, 4)} />
        </View>
        <View style={[dot(10, 14), { marginTop: 2, borderRadius: 5 }]} />
      </View>
      {/* Right foot */}
      <View style={[fp.foot, { marginTop: 18, marginLeft: 4 }]}>
        <View style={dot(8, 5, 4, 0)} />
        <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
          <View style={dot(5, 4)} />
          <View style={dot(5, 4)} />
          <View style={dot(5, 4)} />
        </View>
        <View style={[dot(10, 14), { marginTop: 2, borderRadius: 5 }]} />
      </View>
    </Animated.View>
  );
}
const fp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, opacity: 0.8 },
  foot: { alignItems: 'flex-start' },
});

// ─── Row ──────────────────────────────────────────────────────────────────────
function NotifRow({ item, onPress }) {
  const meta = TYPE[item.type] || TYPE.system;
  const fade = useRef(new Animated.Value(0)).current;
  const tx   = useRef(new Animated.Value(10)).current;

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
        {!item.read && <View style={[s.unreadDot, { backgroundColor: meta.color }]} />}
        <TypeIcon meta={meta} />
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
      {isFootprints ? <EmptyFootprint /> : <EmptyBell />}
      <Text style={s.emptyTitle}>{isFootprints ? 'No footprints yet' : 'Nothing here yet'}</Text>
      <Text style={s.emptySub}>
        {isFootprints
          ? 'When someone gifts you, bonds with you, or your stamp earns a payout — it shows here.'
          : 'When someone bonds with you, joins your live, or sends a gift — it shows here.'}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const { notifications, unreadCount, markRead, markAllRead, dismissAll } = useNotifications();
  const [tab, setTab]   = useState('all');
  const indicatorX      = useRef(new Animated.Value(0)).current;
  const headerFade      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

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
    if (item.fromId) navigation.navigate('Profile', {
      bondUserId:  item.fromId,
      profileUser: { userId: item.fromId, username: item.from, photo_url: item.fromPhoto || null },
    });
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

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tab} onPress={() => switchTab('all')} activeOpacity={0.8}>
          <View style={s.tabInner}>
            <Text style={[s.tabTxt, tab === 'all' && s.tabTxtOn]}>All</Text>
            {unreadCount > 0 && (
              <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.tab} onPress={() => switchTab('footprints')} activeOpacity={0.8}>
          <View style={s.tabInner}>
            <Text style={[s.tabTxt, tab === 'footprints' && s.tabTxtOn]}>Footprints</Text>
            {footprintUnread > 0 && (
              <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{footprintUnread > 99 ? '99+' : footprintUnread}</Text></View>
            )}
          </View>
        </TouchableOpacity>

        <Animated.View
          style={[s.tabIndicator, { width: TAB_W, transform: [{ translateX: indicatorX }] }]}
        />
      </View>

      {/* ── Feed ── */}
      <FlatList
        data={displayed}
        keyExtractor={n => String(n.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Empty tab={tab} />}
        renderItem={({ item }) => (
          <NotifRow item={item} onPress={handlePress} />
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

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  back:           { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  backTxt:        { color: '#fff', fontSize: 24, lineHeight: 28, marginTop: -1 },
  headerTitle:    { color: '#fff', fontSize: 18, fontWeight: '900' },
  markAll:        { color: BOND_PINK, fontSize: 12, fontWeight: '700' },

  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1A1A1A', position: 'relative' },
  tab:            { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabInner:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabTxt:         { color: 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: '700' },
  tabTxtOn:       { color: '#fff' },
  tabBadge:       { backgroundColor: BOND_PINK, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:    { color: '#fff', fontSize: 10, fontWeight: '900' },
  tabIndicator:   { position: 'absolute', bottom: 0, height: 2, backgroundColor: BOND_PINK, borderRadius: 1 },

  list:           { paddingBottom: 60 },

  row:            { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#111' },
  rowUnread:      { backgroundColor: '#0A0A12' },
  unreadDot:      { width: 8, height: 8, borderRadius: 4, marginTop: 14, marginRight: 8, flexShrink: 0 },
  rowBody:        { flex: 1 },
  rowTop:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  rowTitle:       { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '500', flex: 1, lineHeight: 20 },
  rowTitleUnread: { color: '#fff', fontWeight: '700' },
  rowTime:        { color: 'rgba(255,255,255,0.35)', fontSize: 12, flexShrink: 0, marginTop: 1 },
  rowSub:         { color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 19, marginTop: 4 },

  empty:          { alignItems: 'center', paddingTop: 90, paddingHorizontal: 50, gap: 14 },
  emptyTitle:     { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptySub:       { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  clearAll:       { alignSelf: 'center', marginTop: 30, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  clearAllTxt:    { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
});
