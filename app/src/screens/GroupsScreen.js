import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, ScrollView, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS = {
  'gaming':           { from: '#7b5ea7', to: '#4a3570' },
  'sports':           { from: '#1565c0', to: '#0d3b6e' },
  'bars-nightlife':   { from: '#e65100', to: '#8a3200' },
  'music':            { from: '#ad1457', to: '#6a0f38' },
  'food':             { from: '#2e7d32', to: '#1a4a1c' },
  'travel':           { from: '#00838f', to: '#005662' },
  'language-learning':{ from: '#6a1b9a', to: '#3d1060' },
  'movies-tv':        { from: '#b71c1c', to: '#6d1010' },
};

const CATEGORY_ACCENT = {
  'gaming':           '#9c6fe4',
  'sports':           '#42a5f5',
  'bars-nightlife':   '#ff8a50',
  'music':            '#f06292',
  'food':             '#66bb6a',
  'travel':           '#26c6da',
  'language-learning':'#ab47bc',
  'movies-tv':        '#ef5350',
};

function getColors(id) {
  return CATEGORY_COLORS[id] || { from: '#1a1a3a', to: '#16181C' };
}
function getAccent(id) {
  return CATEGORY_ACCENT[id] || '#E8003D';
}

// ─── Room chip ────────────────────────────────────────────────────────────────
function RoomChip({ room, accent, onPress }) {
  return (
    <TouchableOpacity
      style={[rc.chip, { backgroundColor: accent + '20', borderColor: accent + '55' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[rc.text, { color: accent }]}>#{room}</Text>
    </TouchableOpacity>
  );
}
const rc = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: '600' },
});

// ─── Category card ────────────────────────────────────────────────────────────
function CategoryCard({ item, onRoomPress, memberCounts, index }) {
  const colors = getColors(item.id);
  const accent = getAccent(item.id);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 70, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  // total online in this category
  const totalMembers = item.rooms.reduce((sum, r) => sum + (memberCounts[`${item.id}:${r}`] || 0), 0);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <LinearGradient
        colors={[colors.from + 'cc', colors.to]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={cc.card}
      >
        {/* Top row */}
        <View style={cc.top}>
          <View style={cc.iconWrap}>
            <Text style={cc.icon}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cc.name}>{item.name}</Text>
            <Text style={cc.desc} numberOfLines={1}>{item.description}</Text>
          </View>
          {totalMembers > 0 && (
            <View style={[cc.liveBadge, { backgroundColor: accent + '30', borderColor: accent + '60' }]}>
              <View style={cc.liveDot} />
              <Text style={[cc.liveText, { color: accent }]}>{totalMembers} live</Text>
            </View>
          )}
        </View>

        {/* Room chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cc.roomsRow}>
          {item.rooms.map(room => (
            <RoomChip
              key={room}
              room={room}
              accent={accent}
              onPress={() => onRoomPress(item, room)}
            />
          ))}
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
}

const cc = StyleSheet.create({
  card:      { borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#ffffff10' },
  top:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap:  { width: 52, height: 52, borderRadius: 16, backgroundColor: '#00000030', alignItems: 'center', justifyContent: 'center' },
  icon:      { fontSize: 28 },
  name:      { color: '#fff', fontSize: 17, fontWeight: '800' },
  desc:      { color: '#ffffff88', fontSize: 12, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#57f287' },
  liveText:  { fontSize: 11, fontWeight: '700' },
  roomsRow:  { gap: 8 },
});

// ─── Active room card (horizontal scroll) ─────────────────────────────────────
function ActiveRoomCard({ categoryId, room, count, icon, accent, onPress }) {
  return (
    <TouchableOpacity style={[ar.card, { borderColor: accent + '44' }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[ar.iconWrap, { backgroundColor: accent + '22' }]}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={ar.room}>#{room}</Text>
      <View style={ar.countRow}>
        <View style={ar.dot} />
        <Text style={ar.count}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}
const ar = StyleSheet.create({
  card:    { width: 100, backgroundColor: '#16181C', borderRadius: 18, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1 },
  iconWrap:{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  room:    { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  countRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#57f287' },
  count:   { color: '#57f287', fontSize: 11, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function GroupsScreen({ navigation, user }) {
  const { colors } = useTheme();
  const socket = getSocket();

  const [categories,    setCategories]   = useState([]);
  const [memberCounts,  setMemberCounts] = useState({});
  const [search,        setSearch]       = useState('');
  const [totalOnline,   setTotalOnline]  = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    socket.emit('get_groups');
    socket.on('group_list', cats => {
      setCategories(cats);
      // Request member counts for all rooms
      cats.forEach(cat => {
        cat.rooms.forEach(room => {
          socket.emit('get_room_members', { categoryId: cat.id, roomName: room });
        });
      });
    });

    socket.on('room_members', ({ categoryId, roomName, members }) => {
      const key = `${categoryId}:${roomName}`;
      setMemberCounts(prev => {
        const updated = { ...prev, [key]: members.length };
        const total   = Object.values(updated).reduce((a, b) => a + b, 0);
        setTotalOnline(total);
        return updated;
      });
    });

    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    return () => {
      socket.off('group_list');
      socket.off('room_members');
    };
  }, []);

  // Active rooms = rooms with at least 1 member, sorted by count
  const activeRooms = useMemo(() => {
    const result = [];
    categories.forEach(cat => {
      cat.rooms.forEach(room => {
        const count = memberCounts[`${cat.id}:${room}`] || 0;
        if (count > 0) result.push({ categoryId: cat.id, room, count, icon: cat.icon, accent: getAccent(cat.id), category: cat });
      });
    });
    return result.sort((a, b) => b.count - a.count).slice(0, 10);
  }, [categories, memberCounts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.rooms.some(r => r.includes(q))
    );
  }, [categories, search]);

  function openRoom(category, room) {
    navigation.navigate('GroupChat', { category, user, initialRoom: room });
  }

  const headerOpacity = headerAnim;
  const headerSlide   = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Find your community worldwide</Text>
          </View>
          {totalOnline > 0 && (
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{totalOnline} in rooms</Text>
            </View>
          )}
        </Animated.View>

        {/* ── Search ── */}
        <View style={[styles.searchWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search rooms…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Active Rooms ── */}
        {activeRooms.length > 0 && !search && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Active Right Now</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>live</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {activeRooms.map(ar => (
                <ActiveRoomCard
                  key={`${ar.categoryId}:${ar.room}`}
                  {...ar}
                  onPress={() => openRoom(ar.category, ar.room)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Categories ── */}
        <View style={styles.section}>
          {!search && (
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <Text style={styles.sectionSub}>{categories.length} communities</Text>
            </View>
          )}

          {filtered.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={styles.noResultsText}>No rooms match "{search}"</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {filtered.map((item, index) => (
                <CategoryCard
                  key={item.id}
                  item={item}
                  index={index}
                  memberCounts={memberCounts}
                  onRoomPress={openRoom}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000000' },
  scroll:      { paddingBottom: 60, gap: 24 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16 },
  title:       { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle:    { color: '#555', fontSize: 13, marginTop: 3 },
  onlinePill:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#57f28715', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1, borderColor: '#57f28730' },
  onlineDot:   { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#57f287' },
  onlineText:  { color: '#57f287', fontSize: 12, fontWeight: '700' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#16181C', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: '#2F3336' },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  searchClear: { color: '#444', fontSize: 16, paddingHorizontal: 4 },

  section:     { paddingHorizontal: 20, gap: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:{ color: '#fff', fontSize: 17, fontWeight: '800' },
  sectionSub:  { color: '#555', fontSize: 12 },
  liveBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#57f28715', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#57f28730' },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#57f287' },
  liveText:    { color: '#57f287', fontSize: 11, fontWeight: '700' },

  cardList:    { gap: 12 },

  noResults:   { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noResultsText: { color: '#555', fontSize: 15 },
});
