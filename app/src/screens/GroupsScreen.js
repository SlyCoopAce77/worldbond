import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, ScrollView, FlatList, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

// ─── Data ─────────────────────────────────────────────────────────────────────

const LOCAL_CATEGORIES = [
  { id: 'daily-chat',        name: 'Daily Chat',        icon: '🌅', rooms: ['morning-check-in', 'late-night-thoughts', 'confessions', 'today-i-learned', 'whats-good'] },
  { id: 'hot-takes',         name: 'Hot Takes',         icon: '🔥', rooms: ['split-the-bill', 'unpopular-opinions', 'change-my-mind', 'would-you-rather', 'ai-is-overrated'] },
  { id: 'love-dating',       name: 'Love & Dating',     icon: '❤️‍🔥', rooms: ['red-flags', 'dealbreakers', 'situationships', 'solo-vs-dating', 'first-date-rules'] },
  { id: 'money-talk',        name: 'Money Talk',        icon: '💸', rooms: ['money-and-love', 'salary-sharing', 'broke-to-rich', 'side-hustles', 'financial-goals'] },
  { id: 'mind-soul',         name: 'Mind & Soul',       icon: '🧠', rooms: ['vent-freely', 'daily-wins', 'therapy-talk', 'anxiety-corner', 'glow-up'] },
  { id: 'culture-clash',     name: 'Culture Clash',     icon: '🌍', rooms: ['food-opinions', 'family-values', 'country-stereotypes', 'traditions', 'city-vs-village'] },
  { id: 'pop-culture',       name: 'Pop Culture',       icon: '🎧', rooms: ['now-playing', 'celebrity-drama', 'show-recs', 'lyrics-that-hit', 'guilty-pleasures'] },
  { id: 'tech-ai',           name: 'Tech & AI',         icon: '🤖', rooms: ['ai-hot-takes', 'kids-and-phones', 'influencer-culture', 'digital-detox', 'future-predictions'] },
  { id: 'bars-nightlife',    name: 'Bars & Nightlife',  icon: '🍻', rooms: ['cocktails', 'craft-beer', 'wine', 'nightclubs', 'karaoke'] },
  { id: 'music',             name: 'Music',             icon: '🎵', rooms: ['hip-hop', 'rock', 'kpop', 'jazz', 'electronic'] },
  { id: 'food',              name: 'Food & Cooking',    icon: '🍜', rooms: ['asian-cuisine', 'street-food', 'vegetarian', 'desserts', 'bbq'] },
  { id: 'language-learning', name: 'Language Learning', icon: '📚', rooms: ['english', 'japanese', 'spanish', 'korean', 'french'] },
  { id: 'sports',            name: 'Sports',            icon: '⚽', rooms: ['football', 'basketball', 'soccer', 'baseball', 'tennis'] },
];

const COLORS = {
  'daily-chat':        { from: '#b45309', to: '#78350f', accent: '#fbbf24' },
  'hot-takes':         { from: '#b91c1c', to: '#7f1d1d', accent: '#f87171' },
  'love-dating':       { from: '#be185d', to: '#831843', accent: '#f472b6' },
  'money-talk':        { from: '#15803d', to: '#14532d', accent: '#4ade80' },
  'mind-soul':         { from: '#1d4ed8', to: '#1e3a8a', accent: '#60a5fa' },
  'culture-clash':     { from: '#0f766e', to: '#134e4a', accent: '#2dd4bf' },
  'pop-culture':       { from: '#7c3aed', to: '#4c1d95', accent: '#a78bfa' },
  'tech-ai':           { from: '#0e7490', to: '#164e63', accent: '#22d3ee' },
  'bars-nightlife':    { from: '#c2410c', to: '#7c2d12', accent: '#fb923c' },
  'music':             { from: '#a21caf', to: '#701a75', accent: '#e879f9' },
  'food':              { from: '#16a34a', to: '#166534', accent: '#86efac' },
  'language-learning': { from: '#4338ca', to: '#3730a3', accent: '#818cf8' },
  'sports':            { from: '#1d4ed8', to: '#1e40af', accent: '#93c5fd' },
};

function getC(id) { return COLORS[id] || { from: '#1a1a3a', to: '#16181C', accent: '#6C47FF' }; }

// ─── Room card (grid tile) ────────────────────────────────────────────────────
function RoomCard({ room, categoryId, accent, from, to, count, onPress }) {
  const isLive = count > 0;
  return (
    <TouchableOpacity style={rc.wrap} onPress={onPress} activeOpacity={0.82}>
      <LinearGradient colors={[from, to]} style={rc.card}>
        {isLive && (
          <View style={rc.liveBadge}>
            <View style={rc.liveDot} />
            <Text style={[rc.liveNum, { color: accent }]}>{count}</Text>
          </View>
        )}
        <Text style={rc.name}>#{room}</Text>
        <Text style={[rc.status, { color: accent }]}>
          {isLive ? 'Active now' : 'Start the chat'}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const rc = StyleSheet.create({
  wrap:      { width: CARD_W },
  card:      { borderRadius: 18, padding: 16, minHeight: 100, justifyContent: 'flex-end', borderWidth: 1, borderColor: '#ffffff12' },
  liveBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00000040', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  liveNum:   { fontSize: 11, fontWeight: '800' },
  name:      { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 24 },
  status:    { fontSize: 11, fontWeight: '600', marginTop: 3, opacity: 0.85 },
});

// ─── Category tab ─────────────────────────────────────────────────────────────
function CategoryTab({ item, isActive, onPress }) {
  const c = getC(item.id);
  return (
    <TouchableOpacity
      style={[tab.pill, isActive && { backgroundColor: c.accent + '22', borderColor: c.accent + '70' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={tab.icon}>{item.icon}</Text>
      <Text style={[tab.label, isActive && { color: c.accent, fontWeight: '800' }]}>
        {item.name}
      </Text>
      {isActive && <View style={[tab.bar, { backgroundColor: c.accent }]} />}
    </TouchableOpacity>
  );
}
const tab = StyleSheet.create({
  pill:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', marginBottom: 2 },
  icon:  { fontSize: 15 },
  label: { color: '#666', fontSize: 13, fontWeight: '600' },
  bar:   { display: 'none' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function GroupsScreen({ navigation, user }) {
  const socket = getSocket();

  const [memberCounts, setMemberCounts] = useState({});
  const [search,       setSearch]       = useState('');
  const [totalOnline,  setTotalOnline]  = useState(0);
  const [activeCatId,  setActiveCatId]  = useState(LOCAL_CATEGORIES[0].id);

  useEffect(() => {
    LOCAL_CATEGORIES.forEach(cat =>
      cat.rooms.forEach(room =>
        socket.emit('get_room_members', { categoryId: cat.id, roomName: room })
      )
    );
    socket.on('room_members', ({ categoryId, roomName, members }) => {
      const key = `${categoryId}:${roomName}`;
      setMemberCounts(prev => {
        const updated = { ...prev, [key]: members.length };
        setTotalOnline(Object.values(updated).reduce((a, b) => a + b, 0));
        return updated;
      });
    });
    return () => socket.off('room_members');
  }, []);

  // Search mode: flat list of all rooms matching query
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const results = [];
    LOCAL_CATEGORIES.forEach(cat => {
      cat.rooms.forEach(room => {
        if (room.includes(q) || cat.name.toLowerCase().includes(q)) {
          results.push({ room, cat, key: `${cat.id}:${room}` });
        }
      });
    });
    return results;
  }, [search]);

  const activeCategory = LOCAL_CATEGORIES.find(c => c.id === activeCatId) || LOCAL_CATEGORIES[0];
  const c = getC(activeCatId);

  function openRoom(category, room) {
    navigation.navigate('GroupChat', { category, user, initialRoom: room });
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Chats</Text>
          <Text style={s.subtitle}>Find your people worldwide</Text>
        </View>
        {totalOnline > 0 && (
          <View style={s.onlinePill}>
            <View style={s.greenDot} />
            <Text style={s.onlineText}>{totalOnline} online</Text>
          </View>
        )}
      </View>

      {/* ── Search ── */}
      <View style={s.searchRow}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search any room…"
          placeholderTextColor="#444"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {search.trim() ? (
        /* ── Search results ── */
        <FlatList
          data={searchResults}
          keyExtractor={item => item.key}
          contentContainerStyle={s.searchList}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={s.emptyText}>No rooms match "{search}"</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cc = getC(item.cat.id);
            const count = memberCounts[item.key] || 0;
            return (
              <TouchableOpacity
                style={s.searchItem}
                onPress={() => openRoom(item.cat, item.room)}
                activeOpacity={0.75}
              >
                <Text style={s.searchItemIcon}>{item.cat.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.searchItemRoom}>#{item.room}</Text>
                  <Text style={s.searchItemCat}>{item.cat.name}</Text>
                </View>
                {count > 0 && (
                  <View style={[s.searchLive, { backgroundColor: cc.accent + '22' }]}>
                    <View style={s.greenDot} />
                    <Text style={[s.searchLiveText, { color: cc.accent }]}>{count} live</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <>
          {/* ── Category tabs (horizontal) ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabRow}
          >
            {LOCAL_CATEGORIES.map(cat => (
              <CategoryTab
                key={cat.id}
                item={cat}
                isActive={activeCatId === cat.id}
                onPress={() => setActiveCatId(cat.id)}
              />
            ))}
          </ScrollView>

          {/* ── Active category banner ── */}
          <LinearGradient colors={[c.from + '55', 'transparent']} style={s.catBanner}>
            <Text style={s.catBannerIcon}>{activeCategory.icon}</Text>
            <Text style={s.catBannerName}>{activeCategory.name}</Text>
            {totalOnline > 0 && (
              <Text style={[s.catBannerCount, { color: c.accent }]}>
                {activeCategory.rooms.reduce((sum, r) => sum + (memberCounts[`${activeCatId}:${r}`] || 0), 0)} in here
              </Text>
            )}
          </LinearGradient>

          {/* ── Room grid ── */}
          <FlatList
            data={activeCategory.rooms}
            keyExtractor={r => r}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={s.grid}
            columnWrapperStyle={s.gridRow}
            renderItem={({ item: room }) => {
              const count = memberCounts[`${activeCatId}:${room}`] || 0;
              return (
                <RoomCard
                  room={room}
                  categoryId={activeCatId}
                  accent={c.accent}
                  from={c.from}
                  to={c.to}
                  count={count}
                  onPress={() => openRoom(activeCategory, room)}
                />
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#000' },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  title:       { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  subtitle:    { color: '#555', fontSize: 13, marginTop: 2 },
  onlinePill:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#4ade8015', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1, borderColor: '#4ade8030' },
  greenDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  onlineText:  { color: '#4ade80', fontSize: 12, fontWeight: '700' },

  searchRow:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: '#222' },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  clearBtn:    { color: '#444', fontSize: 16 },

  tabRow:      { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },

  catBanner:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 4, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14 },
  catBannerIcon: { fontSize: 22 },
  catBannerName: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1 },
  catBannerCount:{ fontSize: 12, fontWeight: '700' },

  grid:        { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 10 },
  gridRow:     { gap: 10 },

  // search results
  searchList:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 8 },
  searchItem:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#111', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1e1e1e' },
  searchItemIcon: { fontSize: 24 },
  searchItemRoom: { color: '#fff', fontSize: 15, fontWeight: '700' },
  searchItemCat:  { color: '#555', fontSize: 12, marginTop: 2 },
  searchLive:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  searchLiveText: { fontSize: 11, fontWeight: '700' },

  empty:       { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:   { color: '#555', fontSize: 15 },
});
