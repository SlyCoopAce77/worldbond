import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, ScrollView, Animated,
  Dimensions, Alert, ActivityIndicator, Platform, PermissionsAndroid, Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { getSocket } from '../services/socket';
import { SAVED_SPOTS_KEY as SAVED_KEY } from '../utils/constants';

const { width } = Dimensions.get('window');
const BOND_PINK = '#FF0080';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TYPE_META = {
  bar:        { icon: '🍺', label: 'Bars',       color: '#FFB700' },
  club:       { icon: '🎉', label: 'Clubs',       color: '#8b5cf6' },
  karaoke:    { icon: '🎤', label: 'Karaoke',     color: '#ec4899' },
  gaming:     { icon: '🎮', label: 'Gaming',      color: '#3b82f6' },
  restaurant: { icon: '🍜', label: 'Food',        color: '#ef4444' },
  park:       { icon: '🌳', label: 'Parks',       color: '#22c55e' },
  beach:      { icon: '🏖️', label: 'Beach',       color: '#06b6d4' },
  sports:     { icon: '⚽', label: 'Sports',      color: '#f97316' },
  lounge:     { icon: '🛋️', label: 'Lounges',     color: '#a78bfa' },
  arcade:     { icon: '🕹️', label: 'Arcade',      color: '#6366f1' },
};

const VIBES = [
  { key: 'bar',        icon: '🍺', label: 'Bars',       color: '#FFB700' },
  { key: 'club',       icon: '🎉', label: 'Clubs',       color: '#8b5cf6' },
  { key: 'restaurant', icon: '🍜', label: 'Food',        color: '#ef4444' },
  { key: 'beach',      icon: '🏖️', label: 'Beach',       color: '#06b6d4' },
  { key: 'gaming',     icon: '🎮', label: 'Gaming',      color: '#3b82f6' },
  { key: 'park',       icon: '🌳', label: 'Parks',       color: '#22c55e' },
  { key: 'karaoke',    icon: '🎤', label: 'Karaoke',     color: '#ec4899' },
  { key: 'lounge',     icon: '🛋️', label: 'Lounges',     color: '#a78bfa' },
  { key: 'sports',     icon: '⚽', label: 'Sports',      color: '#f97316' },
  { key: 'arcade',     icon: '🕹️', label: 'Arcade',      color: '#6366f1' },
];

const REGIONS = [
  { key: 'all',      label: 'All',         match: null },
  { key: 'asia',     label: 'Asia',        match: ['Japan', 'Korea', 'Thailand', 'Singapore', 'Philippines', 'Indonesia', 'India', 'Vietnam', 'China'] },
  { key: 'europe',   label: 'Europe',      match: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Turkey', 'Greece', 'Portugal', 'Ireland'] },
  { key: 'americas', label: 'Americas',    match: ['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia'] },
  { key: 'africa',   label: 'Africa',      match: ['Nigeria', 'South Africa', 'Egypt', 'Morocco', 'Ghana', 'Kenya', 'Ethiopia'] },
  { key: 'mideast',  label: 'Middle East', match: ['Saudi Arabia', 'United Arab Emirates', 'Turkey', 'Lebanon', 'Jordan', 'Kuwait', 'Qatar'] },
  { key: 'pacific',  label: 'Pacific',     match: ['Australia', 'New Zealand'] },
];

const EVENT_TYPES = [
  { key: 'concert',  icon: '🎵', label: 'Concert',     color: '#8b5cf6' },
  { key: 'party',    icon: '🎉', label: 'Party',        color: '#ec4899' },
  { key: 'sports',   icon: '⚽', label: 'Sports Night', color: '#f97316' },
  { key: 'comedy',   icon: '😂', label: 'Comedy',       color: '#FFB700' },
  { key: 'open mic', icon: '🎙️', label: 'Open Mic',     color: '#22c55e' },
  { key: 'festival', icon: '🎪', label: 'Festival',     color: '#06b6d4' },
  { key: 'special',  icon: '✨', label: 'Special',      color: '#6366f1' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useFade(trigger = true, delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    if (!trigger) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 9, tension: 55, delay, useNativeDriver: true }),
    ]).start();
  }, [trigger]);
  return { opacity, transform: [{ translateY }] };
}

function countryName(str) { return str?.split(' ').slice(1).join(' ') || str; }
function countryFlag(str) { return str?.split(' ')[0] || '🌍'; }

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

// ─── Vibe button ──────────────────────────────────────────────────────────────
const VIBE_W = (Dimensions.get('window').width - 48) / 5;

function VibeButton({ vibe, onPress }) {
  const anim = useFade(true);
  return (
    <Animated.View style={[{ width: VIBE_W }, anim]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
        <LinearGradient colors={[vibe.color + '33', vibe.color + '11']} style={[vb.card, { borderColor: vibe.color + '55' }]}>
          <Text style={[vb.label, { color: vibe.color }]}>{vibe.label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
const vb = StyleSheet.create({
  card:  { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, margin: 3 },
  label: { fontSize: 11, fontWeight: '900', textAlign: 'center' },
});

// ─── Country card ─────────────────────────────────────────────────────────────
function CountryCard({ item, onPress, isLive, hasEvents, index }) {
  const anim = useFade(true, index * 30);
  const flag = countryFlag(item);
  const name = countryName(item);
  return (
    <Animated.View style={[{ flex: 1 }, anim]}>
      <TouchableOpacity style={cc.card} onPress={onPress} activeOpacity={0.82}>
        {isLive && <View style={cc.liveDot} />}
        {hasEvents && !isLive && <View style={cc.eventDot} />}
        <Text style={cc.flag}>{flag}</Text>
        <Text style={cc.name} numberOfLines={2}>{name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const cc = StyleSheet.create({
  card:     { flex: 1, backgroundColor: '#16181C', borderRadius: 18, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2F3336', margin: 5, minHeight: 100 },
  flag:     { fontSize: 36 },
  name:     { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  liveDot:  { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff5252' },
  eventDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFB700' },
});

// ─── Compact spot card (used in horizontal group rows) ───────────────────────
function CompactSpotCard({ item, onPress, saved, onToggleSave }) {
  const meta = TYPE_META[item.type] || { icon: '•', label: item.type, color: BOND_PINK };
  return (
    // Outer View so the save button and the card tap are completely independent
    <View style={csc.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }}>
        <LinearGradient colors={[meta.color + '28', meta.color + '0d']} style={csc.inner}>
          {item.isLive && <View style={csc.liveDot} />}
          <Text style={csc.icon}>{meta.icon}</Text>
          <Text style={csc.name} numberOfLines={2}>{item.name}</Text>
          <Text style={csc.city} numberOfLines={1}>{item.city}</Text>
          {item.vibe ? <Text style={[csc.vibe, { color: meta.color }]} numberOfLines={1}>{item.vibe}</Text> : null}
        </LinearGradient>
      </TouchableOpacity>
      {/* Save button sits outside the card TouchableOpacity — always gets its own tap */}
      <TouchableOpacity
        style={[csc.saveBtn, saved && csc.saveBtnOn]}
        onPress={() => onToggleSave?.(item)}
        hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        activeOpacity={0.7}
      >
        <Text style={csc.saveBtnTxt}>{saved ? '✓' : '＋'}</Text>
      </TouchableOpacity>
    </View>
  );
}
const csc = StyleSheet.create({
  card:      { width: 145, marginRight: 0 },
  inner:     { borderRadius: 18, padding: 14, gap: 5, minHeight: 130, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'flex-end' },
  liveDot:   { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff5252' },
  saveBtn:   { position: 'absolute', top: 9, left: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', zIndex: 10 },
  saveBtnOn: { backgroundColor: 'rgba(108,71,255,0.45)', borderColor: 'rgba(108,71,255,0.8)' },
  saveBtnTxt:{ fontSize: 13 },
  icon:      { fontSize: 32, marginBottom: 2 },
  name:      { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 17 },
  city:      { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600' },
  vibe:      { fontSize: 10, fontWeight: '700' },
});

// ─── Event pill (horizontal scroll card for upcoming events) ─────────────────
function EventPill({ event, onPress }) {
  const et = EVENT_TYPES.find(e => e.key === event.type) || EVENT_TYPES[0];
  return (
    <TouchableOpacity style={[ep.card, { borderColor: et.color + '44' }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[ep.typePill, { backgroundColor: et.color + '22' }]}>
        <View style={[ep.dot, { backgroundColor: et.color }]} />
        <Text style={[ep.typeLabel, { color: et.color }]}>{et.label}</Text>
      </View>
      <Text style={ep.title} numberOfLines={2}>{event.title}</Text>
      <Text style={ep.meta} numberOfLines={1}>{countryFlag(event.placeCountry)} {event.placeName}</Text>
      <Text style={ep.date} numberOfLines={1}>{formatDate(event.date)}</Text>
      <Text style={[ep.price, { color: (!event.price || event.price === 'Free') ? '#22c55e' : et.color }]}>
        {(!event.price || event.price === 'Free') ? 'Free' : event.price}
      </Text>
    </TouchableOpacity>
  );
}
const ep = StyleSheet.create({
  card:      { width: 180, backgroundColor: '#16181C', borderRadius: 18, padding: 14, gap: 8, borderWidth: 1 },
  typePill:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, alignSelf: 'flex-start' },
  dot:       { width: 6, height: 6, borderRadius: 3 },
  typeLabel: { fontSize: 11, fontWeight: '700' },
  title:     { color: '#fff', fontSize: 14, fontWeight: '900', lineHeight: 18 },
  meta:      { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  date:      { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  price:     { fontSize: 12, fontWeight: '800' },
});

// ─── Spot card ────────────────────────────────────────────────────────────────
function SpotCard({ item, onPress, showCity, index }) {
  const anim      = useFade(true, Math.min(index * 40, 300));
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const meta      = TYPE_META[item.type] || { label: item.type, color: BOND_PINK };

  useEffect(() => {
    if (!item.pulseCount) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [item.pulseCount]);

  return (
    <Animated.View style={anim}>
      <TouchableOpacity style={[sc.card, item.pulseCount > 0 && sc.cardPulsing]} onPress={onPress} activeOpacity={0.88}>
        {item.pulseCount > 0 && (
          <Animated.View style={[sc.pulseRing, { opacity: pulseAnim }]} pointerEvents="none" />
        )}
        {item.latestPulse && (
          <View style={sc.pulseBanner}>
            <View style={sc.pulseBannerDot} />
            <Text style={sc.pulseBannerTxt} numberOfLines={1}>{item.latestPulse.message}</Text>
          </View>
        )}
        <View style={sc.body}>

          {/* Type pill + status */}
          <View style={sc.topRow}>
            <View style={[sc.typeBadge, { backgroundColor: meta.color + '22', borderColor: meta.color + '44' }]}>
              <View style={[sc.typeDot, { backgroundColor: meta.color }]} />
              <Text style={[sc.typeLabel, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <View style={sc.statusRow}>
              {item.isLive && (
                <View style={sc.liveBadge}>
                  <View style={sc.liveDot} />
                  <Text style={sc.liveTxt}>Live</Text>
                </View>
              )}
              {item.checkinCount > 0 && (
                <Text style={sc.hereTxt}>{item.checkinCount} here</Text>
              )}
            </View>
          </View>

          <Text style={sc.name}>{item.name}</Text>
          {showCity && <Text style={sc.city}>{item.city}</Text>}
          <Text style={sc.desc} numberOfLines={2}>{item.description}</Text>

          {item.bestTime ? <Text style={sc.bestTime}>Best time · {item.bestTime}</Text> : null}

          {item.tags?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sc.tags}>
              {item.tags.slice(0, 4).map(tag => (
                <View key={tag} style={[sc.tag, { backgroundColor: meta.color + '15', borderColor: meta.color + '35' }]}>
                  <Text style={[sc.tagTxt, { color: meta.color }]}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={sc.ctaRow}>
            <TouchableOpacity style={[sc.cta, { borderColor: meta.color + '55', flex: 1 }]} onPress={onPress}>
              <Text style={[sc.ctaTxt, { color: meta.color }]}>Check In & Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={sc.dirBtn}
              onPress={() => {
                const q = encodeURIComponent(`${item.name} ${item.city || ''}`);
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
              }}
              activeOpacity={0.75}
            >
              <Text style={sc.dirTxt}>Get Directions</Text>
              <Text style={sc.dirArrow}>→</Text>
            </TouchableOpacity>
          </View>

        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const sc = StyleSheet.create({
  card:      { backgroundColor: '#16181C', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2d33' },
  body:      { padding: 18, gap: 12 },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  typeDot:   { width: 6, height: 6, borderRadius: 3 },
  typeLabel: { fontSize: 12, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff5252' },
  liveTxt:   { color: '#ff5252', fontSize: 11, fontWeight: '800' },
  hereTxt:   { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  name:      { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  city:      { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginTop: -4 },
  desc:      { color: '#999', fontSize: 13, lineHeight: 19 },
  bestTime:  { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  tags:      { gap: 6 },
  tag:       { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, borderWidth: 1 },
  tagTxt:    { fontSize: 11, fontWeight: '600' },
  cardPulsing:    { borderColor: BOND_PINK + '88' },
  pulseRing:      { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 20, borderWidth: 2, borderColor: '#9d7cff', zIndex: 1 },
  pulseBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BOND_PINK + '18', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BOND_PINK + '33' },
  pulseBannerDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#9d7cff' },
  pulseBannerTxt: { color: '#bba8ff', fontSize: 12, fontWeight: '600', flex: 1 },
  ctaRow:    { flexDirection: 'row', gap: 8, marginTop: 2 },
  cta:       { borderRadius: 13, paddingVertical: 13, alignItems: 'center', borderWidth: 1, backgroundColor: '#ffffff07' },
  ctaTxt:    { fontSize: 14, fontWeight: '700' },
  dirBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 13, backgroundColor: BOND_PINK + '20', borderWidth: 1, borderColor: BOND_PINK + '66' },
  dirTxt:    { color: '#bba8ff', fontSize: 13, fontWeight: '800' },
  dirArrow:  { color: '#9d7cff', fontSize: 14, fontWeight: '700' },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExploreScreen({ navigation, user }) {
  const socket = getSocket();

  // ── State ──
  const [countries,     setCountries]     = useState([]);
  const [spots,         setSpots]         = useState([]);        // active list being shown
  const [upcomingEvents,setUpcomingEvents] = useState([]);
  const [liveVenues,    setLiveVenues]    = useState([]);
  const [view,          setView]          = useState('discover'); // 'discover' | 'spots'
  const [activeCountry, setActiveCountry] = useState(null);
  const [activeVibe,    setActiveVibe]    = useState(null);
  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [cityFilter,    setCityFilter]    = useState('all');
  const [region,        setRegion]        = useState('all');
  const [loading,       setLoading]       = useState(false);
  const [savedSpots,    setSavedSpots]    = useState([]);   // persisted full spot objects
  const [locating,        setLocating]        = useState(false);
  const [gpsTriggered,    setGpsTriggered]    = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(null); // persists across back nav
  const [activePulses,    setActivePulses]    = useState([]);   // spots currently pulsing
  const headerAnim = useFade(true);

  // ── Saved spots persistence ──
  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then(raw => {
      if (raw) { try { setSavedSpots(JSON.parse(raw)); } catch {} }
    });
  }, []);

  const savedIds = useMemo(() => new Set(savedSpots.map(s => s.id)), [savedSpots]);

  const toggleSave = useCallback((place) => {
    setSavedSpots(prev => {
      const next = prev.some(s => s.id === place.id)
        ? prev.filter(s => s.id !== place.id)
        : [...prev, place];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Socket setup ──
  useEffect(() => {
    function init() {
      socket.emit('get_countries');
      socket.emit('get_upcoming_events');
      socket.emit('get_live_venues');
    }
    function onCountriesList(list) { setCountries(list); }
    function onUpcomingEvents(evts) { setUpcomingEvents(evts || []); }
    function onLiveVenues(venues) { setLiveVenues(venues || []); }
    function onCountryPlacesList({ places }) { setSpots(places || []); setLoading(false); }
    function onVibeSpotsList({ places }) { setSpots(places || []); setLoading(false); }
    function onVenueLiveUpdate() { socket.emit('get_live_venues'); }
    function onAllActivePulses(pulses) { setActivePulses(pulses || []); }
    function onPulseDropped({ pulse }) {
      setActivePulses(prev => [pulse, ...prev.filter(p => p.id !== pulse.id)]);
    }

    if (socket.connected) init();
    else socket.once('connect', init);

    socket.on('countries_list',      onCountriesList);
    socket.on('upcoming_events',     onUpcomingEvents);
    socket.on('live_venues',         onLiveVenues);
    socket.on('country_places_list', onCountryPlacesList);
    socket.on('vibe_spots_list',     onVibeSpotsList);
    socket.on('venue_live_update',   onVenueLiveUpdate);
    socket.on('all_active_pulses',   onAllActivePulses);
    socket.on('pulse_dropped',       onPulseDropped);
    socket.emit('get_all_active_pulses');

    return () => {
      socket.off('connect',            init);
      socket.off('countries_list',     onCountriesList);
      socket.off('upcoming_events',    onUpcomingEvents);
      socket.off('live_venues',        onLiveVenues);
      socket.off('country_places_list',onCountryPlacesList);
      socket.off('vibe_spots_list',    onVibeSpotsList);
      socket.off('venue_live_update',  onVenueLiveUpdate);
      socket.off('all_active_pulses',  onAllActivePulses);
      socket.off('pulse_dropped',      onPulseDropped);
    };
  }, []);

  // ── Navigation ──
  function openByCountry(country) {
    setActiveCountry(country);
    setActiveVibe(null);
    setTypeFilter('all');
    setCityFilter('all');
    setSearch('');
    setLoading(true);
    socket.emit('get_country_places', { country });
    setView('spots');
  }

  function openByVibe(vibeKey) {
    if (detectedCountry) {
      // User's GPS country is known — load that country and pre-filter by vibe
      setActiveCountry(detectedCountry);
      setActiveVibe(vibeKey);
      setTypeFilter(vibeKey);
      setCityFilter('all');
      setSearch('');
      setLoading(true);
      setGpsTriggered(true);
      socket.emit('get_country_places', { country: detectedCountry });
      setView('spots');
    } else {
      setActiveVibe(vibeKey);
      setActiveCountry(null);
      setTypeFilter(vibeKey);
      setCityFilter('all');
      setSearch('');
      setLoading(true);
      socket.emit('get_spots_by_vibe', { type: vibeKey });
      setView('spots');
    }
  }

  function goBack() {
    setView('discover');
    setActiveCountry(null);
    setActiveVibe(null);
    setSpots([]);
    setSearch('');
    setTypeFilter('all');
    setCityFilter('all');
    setGpsTriggered(false);
    // detectedCountry intentionally kept — GPS location stays active
  }

  async function detectNearMe() {
    if (locating) return;
    setLocating(true);
    try {
      if (Platform.OS === 'android') {
        let granted;
        try {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            { title: 'Location Access', message: 'WorldBond needs your location to find nearby spots.' }
          );
        } catch {
          setLocating(false);
          return;
        }
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLocating(false);
          Alert.alert('Location needed', 'Allow location access in Settings to find spots near you.');
          return;
        }
      } else {
        Geolocation.requestAuthorization('whenInUse');
      }

      Geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
              { headers: { 'User-Agent': 'WorldBond/1.0' } }
            );
            const data = await res.json();
            const detected = data.address?.country;
            if (!detected) {
              Alert.alert('Location', 'Could not identify your country.');
              return;
            }
            const match = countries.find(c =>
              countryName(c).toLowerCase() === detected.toLowerCase() ||
              countryName(c).toLowerCase().includes(detected.toLowerCase())
            );
            if (match) {
              setGpsTriggered(true);
              setDetectedCountry(match);
              openByCountry(match);
            } else {
              Alert.alert('Not available yet', `${detected} isn't in our spot list yet. More countries coming soon.`);
            }
          } catch {
            Alert.alert('Connection error', 'Could not reach location service. Check your internet.');
          } finally {
            setLocating(false);
          }
        },
        () => {
          setLocating(false);
          Alert.alert('Location needed', 'Allow location access in Settings to find spots near you.');
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
      );
    } catch (e) {
      setLocating(false);
      Alert.alert('Location error', 'Could not access location. Please try again.');
    }
  }

  function openSpot(place) {
    navigation.navigate('PlaceDetail', { place, user });
  }

  // ── Derived data ──
  const liveIds    = useMemo(() => new Set(liveVenues.map(v => v.id)), [liveVenues]);
  const eventMap   = useMemo(() => {
    const m = {};
    upcomingEvents.forEach(e => { m[e.placeId] = (m[e.placeId] || 0) + 1; });
    return m;
  }, [upcomingEvents]);

  const filteredCountries = useMemo(() => {
    let list = countries;
    if (search) list = list.filter(c => c.toLowerCase().includes(search.toLowerCase()));
    if (region !== 'all') {
      const reg = REGIONS.find(r => r.key === region);
      if (reg?.match) list = list.filter(c => reg.match.some(m => c.includes(m)));
    }
    return list;
  }, [countries, search, region]);

  const filteredSpots = useMemo(() => {
    return spots.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.vibe?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q));
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      const matchCity = cityFilter === 'all' || p.city === cityFilter;
      return matchSearch && matchType && matchCity;
    });
  }, [spots, search, typeFilter, cityFilter]);

  const cities = useMemo(() => {
    const seen = new Set();
    spots.forEach(p => seen.add(p.city));
    return Array.from(seen).sort();
  }, [spots]);

  const liveSpots  = useMemo(() => filteredSpots.filter(p => p.isLive || liveIds.has(p.id)), [filteredSpots, liveIds]);
  const eventSpots = useMemo(() => filteredSpots.filter(p => (p.eventCount || eventMap[p.id] || 0) > 0), [filteredSpots, eventMap]);

  // Grouped by type — used when typeFilter === 'all' for the horizontal sections layout
  const groupedByType = useMemo(() => {
    if (typeFilter !== 'all') return null;
    const groups = {};
    filteredSpots.forEach(s => {
      if (!groups[s.type]) groups[s.type] = [];
      groups[s.type].push(s);
    });
    // Sort groups by count desc, use VIBES order as tiebreak
    const vibeOrder = VIBES.map(v => v.key);
    return Object.entries(groups).sort((a, b) => {
      const ai = vibeOrder.indexOf(a[0]), bi = vibeOrder.indexOf(b[0]);
      if (b[1].length !== a[1].length) return b[1].length - a[1].length;
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [filteredSpots, typeFilter]);

  // ════════════════════════ DISCOVER VIEW ═══════════════════════════════════

  if (view === 'discover') {
    return (
      <LinearGradient colors={['#0d001a', '#050010', '#000000']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ds.scroll}>

          {/* Header */}
          <Animated.View style={[ds.header, headerAnim]}>
            <Text style={ds.title}>Globe Pulse</Text>
            <Text style={ds.sub}>Find where the world hangs out</Text>
          </Animated.View>

          {/* Search */}
          <View style={ds.searchWrap}>
            <TextInput
              style={ds.searchInput}
              placeholder="Search countries, cities, spots…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: 'rgba(255,255,255,0.4)', paddingHorizontal: 6 }}>✕</Text></TouchableOpacity>
            )}
          </View>

          {/* Near Me button */}
          <TouchableOpacity style={ds.nearMeBtn} onPress={detectNearMe} activeOpacity={0.85} disabled={locating}>
            <LinearGradient colors={[BOND_PINK + '30', BOND_PINK + '12']} style={ds.nearMeInner}>
              {locating
                ? <ActivityIndicator size="small" color="#9d7cff" style={{ marginRight: 2 }} />
                : <View style={ds.nearMeDot} />
              }
              <Text style={ds.nearMeTxt}>
                {locating ? 'Locating you…' : detectedCountry ? `Update location` : 'Spots near me'}
              </Text>
              {!locating && <Text style={ds.nearMeArrow}>→</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* GPS location context banner */}
          {detectedCountry && (
            <View style={ds.locBanner}>
              <View style={ds.locBannerLeft}>
                <Text style={ds.locBannerFlag}>{countryFlag(detectedCountry)}</Text>
                <View>
                  <Text style={ds.locBannerTxt}>In {countryName(detectedCountry)}</Text>
                  <Text style={ds.locBannerSub}>Vibes filtered to your location</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setDetectedCountry(null)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text style={ds.locBannerClear}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Saved spots — quick jump from discover view */}
          {savedSpots.length > 0 && (
            <View style={ds.section}>
              <View style={ds.sectionRow}>
                <View style={ds.sectionDot} />
                <Text style={ds.sectionTitle}>Your Saved Spots</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 4 }}>
                {savedSpots.map(s => (
                  <CompactSpotCard
                    key={s.id}
                    item={{ ...s, isLive: liveIds.has(s.id) }}
                    onPress={() => openSpot(s)}
                    saved={true}
                    onToggleSave={toggleSave}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Upcoming Events — compact vertical list */}
          {upcomingEvents.length > 0 && (
            <View style={ds.section}>
              <View style={ds.sectionRow}>
                <View style={ds.sectionDot} />
                <Text style={ds.sectionTitle}>Events Happening Soon</Text>
                <Text style={ds.sectionHint}>{upcomingEvents.length} events</Text>
              </View>
              <View style={ds.evtList}>
                {upcomingEvents.slice(0, 4).map((evt, i) => {
                  const et = EVENT_TYPES.find(e => e.key === evt.type) || EVENT_TYPES[0];
                  return (
                    <TouchableOpacity
                      key={evt.id || i}
                      style={ds.evtRow}
                      activeOpacity={0.82}
                      onPress={() => {
                        const spot = { id: evt.placeId, name: evt.placeName, country: evt.placeCountry, city: evt.placeCity, type: evt.placeType };
                        navigation.navigate('PlaceDetail', { place: spot, user });
                      }}
                    >
                      <View style={[ds.evtIcon, { backgroundColor: et.color + '22', borderColor: et.color + '44' }]}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: et.color }} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={ds.evtName} numberOfLines={1}>{evt.title}</Text>
                        <Text style={ds.evtMeta} numberOfLines={1}>
                          {countryFlag(evt.placeCountry)} {evt.placeName} · {formatDate(evt.date)}
                        </Text>
                      </View>
                      <View style={[ds.evtPricePill, { backgroundColor: (!evt.price || evt.price === 'Free') ? '#22c55e18' : et.color + '18' }]}>
                        <Text style={[ds.evtPriceTxt, { color: (!evt.price || evt.price === 'Free') ? '#22c55e' : et.color }]}>
                          {(!evt.price || evt.price === 'Free') ? 'Free' : evt.price}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {upcomingEvents.length > 4 && (
                  <TouchableOpacity style={ds.evtSeeAll} onPress={() => navigation.navigate('Events')} activeOpacity={0.8}>
                    <Text style={ds.evtSeeAllTxt}>View all {upcomingEvents.length} events →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Live Right Now */}
          {liveVenues.length > 0 && (
            <View style={ds.section}>
              <View style={ds.sectionRow}>
                <View style={[ds.sectionDot, { backgroundColor: '#ff5252' }]} />
                <Text style={ds.sectionTitle}>Live Right Now</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
                {liveVenues.map((v, i) => {
                  const meta = TYPE_META[v.type] || { color: BOND_PINK, label: v.type };
                  return (
                    <TouchableOpacity key={v.id || i} style={ds.liveCard} onPress={() => navigation.navigate('PlaceDetail', { place: v, user })} activeOpacity={0.85}>
                      <LinearGradient colors={['#ff525218', '#ff525208']} style={ds.liveInner}>
                        <View style={[ds.liveTypeDot, { backgroundColor: meta.color }]} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={ds.liveName} numberOfLines={1}>{v.name}</Text>
                          <Text style={ds.liveInfo}>{countryFlag(v.country)} {v.city}</Text>
                          {v.liveHost && <Text style={ds.liveHost}>{v.liveHost.username} is live</Text>}
                        </View>
                        <View style={ds.livePill}><View style={ds.livePillDot}/><Text style={ds.livePillTxt}>LIVE</Text></View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* What's your vibe? */}
          <View style={ds.section}>
            <View style={ds.sectionRow}>
              <Text style={ds.sectionTitle}>What's your vibe?</Text>
              <Text style={ds.sectionHint}>tap to explore globally</Text>
            </View>
            <View style={ds.vibeGrid}>
              {VIBES.map(v => (
                <VibeButton key={v.key} vibe={v} onPress={() => openByVibe(v.key)} />
              ))}
            </View>
          </View>

          {/* Region pills */}
          <View style={ds.section}>
            <View style={ds.sectionRow}>
              <Text style={ds.sectionTitle}>Browse by Region</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
              {REGIONS.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[ds.regionPill, region === r.key && ds.regionPillOn]}
                  onPress={() => setRegion(r.key)}
                >
                  <Text style={[ds.regionTxt, region === r.key && ds.regionTxtOn]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Countries */}
          <View style={[ds.section, { paddingHorizontal: 0 }]}>
            <View style={[ds.sectionRow, { paddingHorizontal: 20 }]}>
              <Text style={ds.sectionTitle}>{countryName(REGIONS.find(r => r.key === region)?.label || 'All')} Countries</Text>
              <Text style={ds.sectionHint}>{filteredCountries.length} countries</Text>
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={c => c}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              renderItem={({ item, index }) => (
                <CountryCard
                  item={item}
                  index={index}
                  isLive={liveVenues.some(v => v.country === item)}
                  hasEvents={upcomingEvents.some(e => e.placeCountry === item)}
                  onPress={() => openByCountry(item)}
                />
              )}
              ListEmptyComponent={
                <View style={ds.empty}>
                  <Text style={ds.emptyTxt}>No countries match "{search}"</Text>
                </View>
              }
            />
          </View>

        </ScrollView>
      </SafeAreaView>
      </LinearGradient>
    );
  }

  // ════════════════════════ SPOTS VIEW ══════════════════════════════════════

  const spotVibeMeta  = activeVibe   ? VIBES.find(v => v.key === activeVibe)   : null;
  const spotsHeading  = activeCountry
    ? `${countryFlag(activeCountry)} ${countryName(activeCountry)}`
    : spotVibeMeta ? `${spotVibeMeta.label} Worldwide` : 'Spots';

  const countryUpcoming = activeCountry
    ? upcomingEvents.filter(e => e.placeCountry === activeCountry)
    : [];

  return (
    <LinearGradient colors={['#0d001a', '#050010', '#000000']} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}>

      {/* ── FIXED: Header only — back button + title, nothing else ── */}
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={goBack} activeOpacity={0.82}>
          <Text style={sv.backArrow}>←</Text>
          <Text style={sv.backTxt}>Explore</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={sv.title}>{spotsHeading}</Text>
          {gpsTriggered && (
            <View style={sv.gpsPill}>
              <Text style={sv.gpsPillTxt}>Near you</Text>
            </View>
          )}
        </View>
        <Text style={sv.sub}>
          {filteredSpots.length} spots
          {!activeCountry && spots.length > 0 && ` · ${new Set(spots.map(p => p.country)).size} countries`}
        </Text>
      </View>

      {/* ── SCROLLABLE: Content ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Search — inside scroll so it doesn't add to fixed header height */}
        <View style={sv.searchWrap}>
          <TextInput
            style={sv.searchInput}
            placeholder={activeCountry ? 'Search spots, vibes, tags…' : 'Search by country, city, spot…'}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: 'rgba(255,255,255,0.4)' }}>✕</Text></TouchableOpacity>}
        </View>

        {/* Vibe type filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}
        >
          {[{ key: 'all', label: 'All Vibes', color: BOND_PINK }, ...VIBES].map(v => (
            <TouchableOpacity
              key={v.key}
              style={[sv.filterChip, typeFilter === v.key && { backgroundColor: v.color + '28', borderColor: v.color }]}
              onPress={() => setTypeFilter(v.key)}
            >
              <Text style={[sv.filterTxt, typeFilter === v.key && { color: v.color, fontWeight: '800' }]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* City filter (country view only) */}
        {activeCountry && cities.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}
          >
            {[{ key: 'all', label: 'All Cities' }, ...cities.map(c => ({ key: c, label: c }))].map(c => (
              <TouchableOpacity
                key={c.key}
                style={[sv.cityChip, cityFilter === c.key && sv.cityChipOn]}
                onPress={() => setCityFilter(c.key)}
              >
                <Text style={[sv.cityTxt, cityFilter === c.key && sv.cityTxtOn]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Saved spots — pinned quick-access row */}
        {savedSpots.length > 0 && (
          <View style={sv.section}>
            <View style={sv.sectionRow}>
              <View style={sv.dot} />
              <Text style={sv.sectionTitle}>Saved Spots</Text>
              <TouchableOpacity
                onPress={() => { setSavedSpots([]); AsyncStorage.setItem(SAVED_KEY, '[]'); }}
                style={{ marginLeft: 'auto', paddingHorizontal: 10 }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Clear all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}>
              {savedSpots.map(s => (
                <CompactSpotCard
                  key={s.id}
                  item={{ ...s, isLive: liveIds.has(s.id) }}
                  onPress={() => openSpot(s)}
                  saved={true}
                  onToggleSave={toggleSave}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* What's On — spots with active pulses in this view */}
        {activePulses.filter(p => !activeCountry || p.placeCountry === activeCountry).length > 0 && (
          <View style={sv.section}>
            <View style={sv.sectionRow}>
              <View style={[sv.dot, { backgroundColor: '#9d7cff' }]} />
              <Text style={sv.sectionTitle}>What's On</Text>
              <Text style={sv.sectionHint}>{activePulses.filter(p => !activeCountry || p.placeCountry === activeCountry).length} spot{activePulses.filter(p => !activeCountry || p.placeCountry === activeCountry).length > 1 ? 's' : ''}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
              {activePulses.filter(p => !activeCountry || p.placeCountry === activeCountry).map(p => {
                const typeColor = { event: '#8b5cf6', deal: '#22c55e', theme: '#ec4899', menu: '#f97316', announce: BOND_PINK }[p.type] || BOND_PINK;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[sv.pulseCard, { borderColor: typeColor + '44' }]}
                    onPress={() => {
                      const spot = spots.find(s => s.id === p.placeId) || { id: p.placeId, name: p.placeName, country: p.placeCountry, city: p.placeCity };
                      navigation.navigate('PlaceDetail', { place: spot, user });
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={[sv.pulseTypePill, { backgroundColor: typeColor + '22' }]}>
                      <View style={[sv.pulseDot, { backgroundColor: typeColor }]} />
                      <Text style={[sv.pulseTypeLabel, { color: typeColor }]}>
                        {{ event: 'Event', deal: 'Deal', theme: 'Theme Night', menu: 'New Menu', announce: 'Announcement' }[p.type] || p.type}
                      </Text>
                    </View>
                    <Text style={sv.pulseSpotName} numberOfLines={1}>{p.placeName}</Text>
                    <Text style={sv.pulseCity} numberOfLines={1}>{p.placeCity}</Text>
                    <Text style={sv.pulseMsg} numberOfLines={2}>{p.message}</Text>
                    {p.eventTime ? <Text style={sv.pulseTime}>{p.eventTime}</Text> : null}
                    <TouchableOpacity
                      style={sv.pulseDirBtn}
                      onPress={() => {
                        const q = encodeURIComponent(p.address || `${p.placeName} ${p.placeCity || ''}`);
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={sv.pulseDirTxt}>Get Directions →</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Live strip */}
        {liveSpots.length > 0 && (
          <View style={sv.section}>
            <View style={sv.sectionRow}>
              <View style={[sv.dot, { backgroundColor: '#ff5252' }]} />
              <Text style={sv.sectionTitle}>Live Right Now</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
              {liveSpots.map(p => {
                const meta = TYPE_META[p.type] || { color: BOND_PINK };
                return (
                  <TouchableOpacity key={p.id} style={sv.liveCard} onPress={() => openSpot(p)} activeOpacity={0.85}>
                    <Text style={sv.liveName} numberOfLines={2}>{p.name}</Text>
                    <View style={sv.livePill}><View style={sv.liveDot}/><Text style={sv.liveTxt}>LIVE</Text></View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Events strip */}
        {countryUpcoming.length > 0 && (
          <View style={sv.section}>
            <View style={sv.sectionRow}>
              <View style={sv.dot} />
              <Text style={sv.sectionTitle}>Events Coming Up</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
              {countryUpcoming.map((evt, i) => (
                <EventPill key={evt.id || i} event={evt} onPress={() => {
                  const spot = spots.find(s => s.id === evt.placeId) || { id: evt.placeId, name: evt.placeName, country: evt.placeCountry, city: evt.placeCity };
                  navigation.navigate('PlaceDetail', { place: spot, user });
                }} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── GROUPED VIEW (All Vibes) — horizontal row per type ── */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Loading spots…</Text>
          </View>
        ) : filteredSpots.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No spots match your search</Text>
          </View>
        ) : groupedByType ? (
          // Grouped horizontal sections — no endless scrolling
          groupedByType.map(([type, typeSpots]) => {
            const meta = TYPE_META[type] || { icon: '•', label: type, color: BOND_PINK };
            return (
              <View key={type} style={sv.typeGroup}>
                <View style={sv.typeGroupHeader}>
                  <View style={[sv.typeGroupDot, { backgroundColor: meta.color }]} />
                  <Text style={[sv.typeGroupLabel, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={sv.typeGroupCount}>{typeSpots.length} spots</Text>
                  <TouchableOpacity onPress={() => setTypeFilter(type)} style={sv.typeGroupSeeAll}>
                    <Text style={[sv.typeGroupSeeAllTxt, { color: meta.color }]}>See all →</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}
                >
                  {typeSpots.map(s => (
                    <CompactSpotCard
                      key={s.id}
                      item={{ ...s, isLive: s.isLive || liveIds.has(s.id) }}
                      onPress={() => openSpot(s)}
                      saved={savedIds.has(s.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </ScrollView>
              </View>
            );
          })
        ) : (
          // Filtered vertical list — full SpotCard detail
          <View style={{ paddingHorizontal: 16, gap: 14, paddingTop: 8 }}>
            {filteredSpots.map((item, index) => (
              <SpotCard
                key={item.id}
                item={{ ...item, isLive: item.isLive || liveIds.has(item.id), eventCount: item.eventCount || eventMap[item.id] || 0 }}
                index={index}
                showCity={!activeCountry || cityFilter !== 'all'}
                onPress={() => openSpot(item)}
              />
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ds = StyleSheet.create({
  scroll:       { paddingBottom: 80 },
  header:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title:        { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  sub:          { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16181C', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, gap: 10, borderWidth: 1, borderColor: '#3a3d44', marginHorizontal: 20, marginBottom: 12 },
  searchInput:  { flex: 1, color: '#fff', fontSize: 15 },
  section:      { marginBottom: 24 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  sectionDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: BOND_PINK },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  sectionHint:  { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 'auto' },
  liveCard:     { width: 200, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#ff525230' },
  liveInner:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  liveTypeDot:  { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  liveName:     { color: '#fff', fontSize: 13, fontWeight: '800', flex: 1 },
  liveInfo:     { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  liveHost:     { color: '#ff5252', fontSize: 10, marginTop: 2 },
  livePill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ff525222', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  livePillDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ff5252' },
  livePillTxt:  { color: '#ff5252', fontSize: 10, fontWeight: '900' },
  vibeGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14 },
  regionPill:   { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#3a3d44' },
  regionPillOn: { backgroundColor: 'rgba(108,71,255,0.2)', borderColor: BOND_PINK },
  regionTxt:    { color: '#999', fontSize: 13, fontWeight: '600' },
  regionTxtOn:  { color: BOND_PINK, fontWeight: '800' },
  empty:        { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTxt:     { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  // GPS location banner
  locBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 20, backgroundColor: BOND_PINK + '18', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BOND_PINK + '44' },
  locBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  locBannerFlag:  { fontSize: 28 },
  locBannerTxt:   { color: '#bba8ff', fontSize: 14, fontWeight: '800' },
  locBannerSub:   { color: 'rgba(187,168,255,0.6)', fontSize: 11, marginTop: 2 },
  locBannerClear: { color: '#9d7cff', fontSize: 16, fontWeight: '700', paddingLeft: 12 },

  // Near Me button
  nearMeBtn:    { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BOND_PINK + '55' },
  nearMeInner:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 15 },
  nearMeDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9d7cff' },
  nearMeTxt:    { flex: 1, color: '#bba8ff', fontSize: 15, fontWeight: '700' },
  nearMeArrow:  { color: '#9d7cff', fontSize: 17, fontWeight: '700' },

  // Events vertical list
  evtList:      { paddingHorizontal: 20, gap: 10 },
  evtRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#16181C', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2F3336' },
  evtIcon:      { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  evtName:      { color: '#fff', fontSize: 14, fontWeight: '800' },
  evtMeta:      { color: '#888', fontSize: 12, marginTop: 2 },
  evtPricePill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  evtPriceTxt:  { fontSize: 11, fontWeight: '800' },
  evtSeeAll:    { alignItems: 'center', paddingVertical: 14 },
  evtSeeAllTxt: { color: '#9d7cff', fontSize: 13, fontWeight: '700' },
});

const sv = StyleSheet.create({
  header:          { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, gap: 6 },
  backBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(108,71,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(108,71,255,0.35)', marginBottom: 12 },
  backArrow:       { color: '#9d7cff', fontSize: 15, fontWeight: '700' },
  backTxt:         { color: '#9d7cff', fontSize: 13, fontWeight: '800' },
  title:           { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  sub:             { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  searchWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16181C', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, gap: 10, borderWidth: 1, borderColor: '#3a3d44', marginHorizontal: 20, marginTop: 4, marginBottom: 14 },
  searchInput:     { flex: 1, color: '#fff', fontSize: 14 },
  filterChip:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#3a3d44' },
  filterTxt:       { color: '#999', fontSize: 13, fontWeight: '600' },
  cityChip:        { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: '#16181C', borderWidth: 1, borderColor: '#3a3d44' },
  cityChipOn:      { backgroundColor: BOND_PINK + '22', borderColor: BOND_PINK },
  cityTxt:         { color: '#999', fontSize: 13, fontWeight: '600' },
  cityTxtOn:       { color: BOND_PINK, fontWeight: '800' },
  section:         { marginBottom: 22 },
  sectionRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  dot:             { width: 6, height: 6, borderRadius: 3, backgroundColor: BOND_PINK },
  sectionTitle:    { color: '#fff', fontSize: 15, fontWeight: '800' },
  liveCard:        { width: 130, backgroundColor: '#160505', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#ff525230' },
  liveName:        { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  livePill:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ff525222', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  liveDot:         { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ff5252' },
  liveTxt:         { color: '#ff5252', fontSize: 9, fontWeight: '900' },
  gpsPill:         { backgroundColor: BOND_PINK + '25', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: BOND_PINK + '55' },
  gpsPillTxt:      { color: '#bba8ff', fontSize: 12, fontWeight: '700' },
  typeGroup:       { marginBottom: 10, paddingTop: 4 },
  typeGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  typeGroupDot:    { width: 7, height: 7, borderRadius: 3.5 },
  typeGroupLabel:  { fontSize: 15, fontWeight: '900', flex: 1 },
  typeGroupCount:  { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  typeGroupSeeAll: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)' },
  typeGroupSeeAllTxt: { fontSize: 12, fontWeight: '700', color: '#aaa' },

  // What's On pulse cards
  pulseCard:     { width: 210, backgroundColor: '#16181C', borderRadius: 18, padding: 14, gap: 8, borderWidth: 1 },
  pulseTypePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, alignSelf: 'flex-start' },
  pulseDot:      { width: 6, height: 6, borderRadius: 3 },
  pulseTypeLabel:{ fontSize: 11, fontWeight: '700' },
  pulseSpotName: { color: '#fff', fontSize: 14, fontWeight: '900' },
  pulseCity:     { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: -4 },
  pulseMsg:      { color: '#ccc', fontSize: 13, lineHeight: 19 },
  pulseTime:     { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  pulseDirBtn:   { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: BOND_PINK + '20', borderWidth: 1, borderColor: BOND_PINK + '55' },
  pulseDirTxt:   { color: '#bba8ff', fontSize: 12, fontWeight: '800' },
  sectionHint:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 'auto' },
});
