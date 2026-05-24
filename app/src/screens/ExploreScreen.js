import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, ScrollView, Animated,
  Dimensions, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';

const { width } = Dimensions.get('window');

const TYPE_META = {
  bar:        { icon: '🍺', label: 'Bar',          color: '#f59e0b', grad: ['#2a1a00', '#1a1000'] },
  club:       { icon: '🎉', label: 'Nightclub',     color: '#8b5cf6', grad: ['#1a0a2e', '#120820'] },
  karaoke:    { icon: '🎤', label: 'Karaoke',       color: '#ec4899', grad: ['#2a0a1a', '#1a0810'] },
  gaming:     { icon: '🎮', label: 'Gaming Cafe',   color: '#3b82f6', grad: ['#0a1a2e', '#061220'] },
  restaurant: { icon: '🍜', label: 'Restaurant',    color: '#ef4444', grad: ['#2a0a0a', '#1a0606'] },
  park:       { icon: '🌳', label: 'Park',          color: '#22c55e', grad: ['#0a1e0a', '#061206'] },
  beach:      { icon: '🏖️', label: 'Beach',         color: '#06b6d4', grad: ['#001e2a', '#001218'] },
  sports:     { icon: '⚽', label: 'Sports Bar',    color: '#f97316', grad: ['#2a1200', '#1a0c00'] },
  lounge:     { icon: '🛋️', label: 'Lounge',        color: '#a78bfa', grad: ['#1a1030', '#100820'] },
  arcade:     { icon: '🕹️', label: 'Arcade',        color: '#6366f1', grad: ['#0e0e2e', '#080820'] },
};

const FILTERS = [
  { key: 'all',        label: '🌍 All' },
  { key: 'bar',        label: '🍺 Bars' },
  { key: 'club',       label: '🎉 Clubs' },
  { key: 'restaurant', label: '🍜 Food' },
  { key: 'gaming',     label: '🎮 Gaming' },
  { key: 'karaoke',    label: '🎤 Karaoke' },
  { key: 'beach',      label: '🏖️ Beach' },
  { key: 'park',       label: '🌳 Parks' },
  { key: 'lounge',     label: '🛋️ Lounge' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useFadeSlide(trigger = true, delay = 0) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    if (!trigger) return;
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 50, delay, useNativeDriver: true }),
    ]).start();
  }, [trigger]);
  return { opacity: fade, transform: [{ translateY: slide }] };
}

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <View style={sb.wrap}>
      <Text style={sb.icon}>🔍</Text>
      <TextInput
        style={sb.input}
        placeholder={placeholder || 'Search…'}
        placeholderTextColor="#444"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')}>
          <Text style={sb.clear}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12122a', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: '#1e1e38', marginHorizontal: 20, marginBottom: 16 },
  icon:  { fontSize: 15 },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  clear: { color: '#444', fontSize: 15, paddingHorizontal: 4 },
});

// ─── Breadcrumb nav ───────────────────────────────────────────────────────────
function Breadcrumb({ country, city, onCountry, onCity }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}
      contentContainerStyle={bc.row}>
      <TouchableOpacity onPress={onCountry}>
        <Text style={bc.link}>Explore</Text>
      </TouchableOpacity>
      {country && <>
        <Text style={bc.sep}>›</Text>
        <TouchableOpacity onPress={onCity}>
          <Text style={city ? bc.link : bc.active}>{country.split(' ').slice(1).join(' ')}</Text>
        </TouchableOpacity>
      </>}
      {city && <>
        <Text style={bc.sep}>›</Text>
        <Text style={bc.active}>{city}</Text>
      </>}
    </ScrollView>
  );
}
const bc = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 6 },
  link:   { color: '#5865f2', fontSize: 13, fontWeight: '600' },
  sep:    { color: '#333', fontSize: 14 },
  active: { color: '#888', fontSize: 13 },
});

// ─── Country card ─────────────────────────────────────────────────────────────
function CountryCard({ item, onPress, index }) {
  const anim = useFadeSlide(true, index * 40);
  const flag = item.split(' ')[0];
  const name = item.split(' ').slice(1).join(' ');
  return (
    <Animated.View style={[{ flex: 1 }, anim]}>
      <TouchableOpacity style={crc.card} onPress={onPress} activeOpacity={0.82}>
        <Text style={crc.flag}>{flag}</Text>
        <Text style={crc.name} numberOfLines={2}>{name}</Text>
        <Text style={crc.arrow}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const crc = StyleSheet.create({
  card:  { flex: 1, backgroundColor: '#12122a', borderRadius: 18, padding: 18, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#1e1e38', margin: 5 },
  flag:  { fontSize: 42 },
  name:  { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  arrow: { color: '#5865f2', fontSize: 14 },
});

// ─── City card ────────────────────────────────────────────────────────────────
function CityCard({ name, index, onPress }) {
  const anim = useFadeSlide(true, index * 50);
  const colors = [
    ['#1a1a42', '#0f0f28'], ['#1a2a1a', '#0f1a0f'], ['#2a1a0e', '#1a0e06'],
    ['#0a1e2e', '#061218'], ['#1a0a2e', '#100820'], ['#2a0a1a', '#1a0810'],
  ];
  const [c1, c2] = colors[index % colors.length];
  return (
    <Animated.View style={anim}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <LinearGradient colors={[c1, c2]} style={city.card}>
          <View style={city.left}>
            <Text style={city.icon}>🏙️</Text>
            <View>
              <Text style={city.name}>{name}</Text>
              <Text style={city.sub}>Tap to explore spots</Text>
            </View>
          </View>
          <Text style={city.arrow}>›</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
const city = StyleSheet.create({
  card:  { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ffffff10' },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon:  { fontSize: 34 },
  name:  { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:   { color: '#ffffff66', fontSize: 12, marginTop: 2 },
  arrow: { color: '#5865f2', fontSize: 26, fontWeight: '300' },
});

// ─── Place card ───────────────────────────────────────────────────────────────
function PlaceCard({ item, onPress, index }) {
  const anim = useFadeSlide(true, index * 60);
  const meta  = TYPE_META[item.type] || { icon: '📍', label: item.type, color: '#5865f2', grad: ['#1a1a2e', '#12122a'] };

  return (
    <Animated.View style={anim}>
      <TouchableOpacity style={pc.card} onPress={onPress} activeOpacity={0.88}>
        {/* Cover header */}
        <LinearGradient colors={meta.grad} style={pc.cover}>
          <Text style={pc.coverIcon}>{meta.icon}</Text>
          <View style={pc.coverRight}>
            <View style={[pc.typeBadge, { backgroundColor: meta.color + '33', borderColor: meta.color + '66' }]}>
              <Text style={[pc.typeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {item.checkinCount > 0 && (
              <View style={pc.liveBadge}>
                <View style={pc.liveDot} />
                <Text style={pc.liveText}>{item.checkinCount} here now</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={pc.body}>
          <Text style={pc.name}>{item.name}</Text>
          <Text style={pc.desc} numberOfLines={2}>{item.description}</Text>

          <View style={pc.metaRow}>
            <Text style={pc.vibe}>{item.vibe}</Text>
            <View style={pc.bestTime}>
              <Text style={pc.bestTimeIcon}>⏰</Text>
              <Text style={pc.bestTimeText}>{item.bestTime}</Text>
            </View>
          </View>

          {item.tags?.length > 0 && (
            <View style={pc.tags}>
              {item.tags.slice(0, 4).map(tag => (
                <View key={tag} style={[pc.tag, { backgroundColor: meta.color + '18', borderColor: meta.color + '40' }]}>
                  <Text style={[pc.tagText, { color: meta.color }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={[pc.checkinBtn, { borderColor: meta.color + '55' }]} onPress={onPress}>
            <Text style={[pc.checkinText, { color: meta.color }]}>📍  Check In & Chat</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const pc = StyleSheet.create({
  card:         { backgroundColor: '#12122a', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#1e1e38' },
  cover:        { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  coverIcon:    { fontSize: 52 },
  coverRight:   { gap: 8, alignItems: 'flex-end' },
  typeBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  typeText:     { fontSize: 12, fontWeight: '700' },
  liveBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ff525222', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#ff525244' },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff5252' },
  liveText:     { color: '#ff5252', fontSize: 10, fontWeight: '700' },
  body:         { padding: 16, gap: 10 },
  name:         { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  desc:         { color: '#888', fontSize: 13, lineHeight: 20 },
  metaRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vibe:         { color: '#fff', fontSize: 13, fontWeight: '600' },
  bestTime:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bestTimeIcon: { fontSize: 12 },
  bestTimeText: { color: '#555', fontSize: 12 },
  tags:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:          { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, borderWidth: 1 },
  tagText:      { fontSize: 11, fontWeight: '600' },
  checkinBtn:   { borderRadius: 13, paddingVertical: 12, alignItems: 'center', borderWidth: 1, backgroundColor: '#ffffff08' },
  checkinText:  { fontSize: 14, fontWeight: '700' },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ExploreScreen({ navigation, user }) {
  const socket = getSocket();

  const [view,     setView]     = useState('countries');
  const [countries,setCountries]= useState([]);
  const [cities,   setCities]   = useState([]);
  const [places,   setPlaces]   = useState([]);
  const [selCountry, setSelCountry] = useState(null);
  const [selCity,    setSelCity]    = useState(null);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');

  const headerAnim = useFadeSlide(true);

  useEffect(() => {
    if (socket.connected) socket.emit('get_countries');
    else socket.once('connect', () => socket.emit('get_countries'));
    socket.on('countries_list', list => setCountries(list));
    socket.on('cities_list', ({ cities: c }) => { setCities(c); setView('cities'); });
    socket.on('places_list', ({ places: p }) => { setPlaces(p); setView('places'); });
    return () => {
      socket.off('countries_list');
      socket.off('cities_list');
      socket.off('places_list');
    };
  }, []);

  function selectCountry(c) { setSelCountry(c); setSearch(''); socket.emit('get_cities', { country: c }); }
  function selectCity(c)    { setSelCity(c);    setSearch(''); setFilter('all'); socket.emit('get_places', { country: selCountry, city: c }); }

  function goBack() {
    setSearch('');
    if (view === 'places') { setView('cities'); setSelCity(null); setPlaces([]); }
    else if (view === 'cities') { setView('countries'); setSelCountry(null); setCities([]); }
  }

  function goToCountries() {
    setView('countries'); setSelCountry(null); setSelCity(null);
    setCities([]); setPlaces([]); setSearch('');
  }
  function goToCities() {
    if (view === 'places') { setView('cities'); setSelCity(null); setPlaces([]); setSearch(''); }
  }

  function openPlace(place) {
    navigation.navigate('PlaceDetail', { place, user });
  }

  // ── Countries ──
  if (view === 'countries') {
    const filtered = countries.filter(c => c.toLowerCase().includes(search.toLowerCase()));
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, headerAnim]}>
          <Text style={styles.title}>Explore ✈️</Text>
          <Text style={styles.subtitle}>Find where people hang out worldwide</Text>
        </Animated.View>
        <SearchBar value={search} onChange={setSearch} placeholder="Search countries…" />
        <FlatList
          data={filtered}
          keyExtractor={c => c}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.countryGrid}
          renderItem={({ item, index }) => (
            <CountryCard item={item} index={index} onPress={() => selectCountry(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>🌍</Text>
              <Text style={styles.emptyText}>No countries match "{search}"</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  // ── Cities ──
  if (view === 'cities') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, headerAnim]}>
          <Breadcrumb country={selCountry} onCountry={goToCountries} onCity={null} />
          <Text style={styles.title}>{selCountry?.split(' ').slice(1).join(' ')}</Text>
          <Text style={styles.subtitle}>Choose a city to explore</Text>
        </Animated.View>
        <FlatList
          data={cities}
          keyExtractor={c => c}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cityList}
          renderItem={({ item, index }) => (
            <CityCard name={item} index={index} onPress={() => selectCity(item)} />
          )}
        />
      </SafeAreaView>
    );
  }

  // ── Places ──
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.vibe?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q));
      const matchFilter = filter === 'all' || p.type === filter;
      return matchSearch && matchFilter;
    });
  }, [places, search, filter]);

  const hotPlaces = useMemo(() => places.filter(p => (p.checkinCount || 0) > 0).slice(0, 5), [places]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.placesScroll}>

        {/* Header */}
        <Animated.View style={[styles.header, headerAnim]}>
          <Breadcrumb country={selCountry} city={selCity} onCountry={goToCountries} onCity={goToCities} />
          <View style={styles.placesHeadRow}>
            <View>
              <Text style={styles.title}>🏙️ {selCity}</Text>
              <Text style={styles.subtitle}>{places.length} spots to explore</Text>
            </View>
            <TouchableOpacity style={styles.backBtn} onPress={goBack}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} placeholder="Search spots, vibes, tags…" />

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}
          contentContainerStyle={styles.filters}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipOn]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hot right now */}
        {hotPlaces.length > 0 && !search && filter === 'all' && (
          <View style={styles.hotSection}>
            <View style={styles.hotHead}>
              <Text style={styles.sectionTitle}>🔴 Active Right Now</Text>
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>live</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {hotPlaces.map(p => {
                const m = TYPE_META[p.type] || { icon: '📍', color: '#5865f2' };
                return (
                  <TouchableOpacity key={p.id} style={[hot.card, { borderColor: m.color + '44' }]} onPress={() => openPlace(p)}>
                    <Text style={hot.icon}>{m.icon}</Text>
                    <Text style={hot.name} numberOfLines={1}>{p.name}</Text>
                    <View style={hot.countRow}>
                      <View style={hot.dot} />
                      <Text style={hot.count}>{p.checkinCount}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Place list */}
        <View style={styles.placesList}>
          {filteredPlaces.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={styles.emptyText}>No spots match your search</Text>
            </View>
          ) : (
            filteredPlaces.map((item, index) => (
              <PlaceCard key={item.id} item={item} index={index} onPress={() => openPlace(item)} />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const hot = StyleSheet.create({
  card:     { width: 96, backgroundColor: '#12122a', borderRadius: 16, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1 },
  icon:     { fontSize: 28 },
  name:     { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:      { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ff5252' },
  count:    { color: '#ff5252', fontSize: 11, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a18' },

  header:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, gap: 4 },
  title:          { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subtitle:       { color: '#555', fontSize: 13 },

  placesHeadRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  backBtn:        { backgroundColor: '#5865f218', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#5865f240' },
  backBtnText:    { color: '#5865f2', fontSize: 13, fontWeight: '700' },

  countryGrid:    { paddingHorizontal: 15, paddingBottom: 40 },

  cityList:       { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

  placesScroll:   { paddingBottom: 60 },
  placesList:     { paddingHorizontal: 20, gap: 14 },

  filters:        { paddingHorizontal: 20, gap: 8 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38' },
  filterChipOn:   { backgroundColor: '#5865f2', borderColor: '#5865f2' },
  filterText:     { color: '#555', fontSize: 13, fontWeight: '600' },
  filterTextOn:   { color: '#fff' },

  hotSection:     { paddingHorizontal: 20, marginBottom: 20, gap: 12 },
  hotHead:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:   { color: '#fff', fontSize: 16, fontWeight: '800' },
  liveTag:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ff525215', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#ff525230' },
  liveDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff5252' },
  liveTagText:    { color: '#ff5252', fontSize: 11, fontWeight: '700' },

  empty:          { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:      { color: '#555', fontSize: 15 },
});
