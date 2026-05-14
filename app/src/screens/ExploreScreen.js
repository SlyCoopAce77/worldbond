import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, TextInput, ScrollView,
} from 'react-native';
import { getSocket } from '../services/socket';

const TYPE_COLORS = {
  bar: '#f59e0b',
  club: '#8b5cf6',
  karaoke: '#ec4899',
  gaming: '#3b82f6',
  restaurant: '#ef4444',
  park: '#22c55e',
  beach: '#06b6d4',
  sports: '#f97316',
  lounge: '#a78bfa',
  arcade: '#6366f1',
};

export default function ExploreScreen({ navigation, user }) {
  const [view, setView] = useState('countries'); // 'countries' | 'cities' | 'places'
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const socket = getSocket();

  useEffect(() => {
    socket.emit('get_countries');
    socket.on('countries_list', setCountries);
    socket.on('cities_list', ({ cities }) => {
      setCities(cities);
      setView('cities');
    });
    socket.on('places_list', ({ places }) => {
      setPlaces(places);
      setView('places');
    });
    return () => {
      socket.off('countries_list');
      socket.off('cities_list');
      socket.off('places_list');
    };
  }, []);

  function selectCountry(country) {
    setSelectedCountry(country);
    setSearch('');
    socket.emit('get_cities', { country });
  }

  function selectCity(city) {
    setSelectedCity(city);
    setSearch('');
    setActiveFilter('all');
    socket.emit('get_places', { country: selectedCountry, city });
  }

  function goBack() {
    setSearch('');
    if (view === 'places') { setView('cities'); setSelectedCity(null); }
    else if (view === 'cities') { setView('countries'); setSelectedCountry(null); }
  }

  function openPlace(place) {
    navigation.navigate('PlaceDetail', { place, user });
  }

  // Countries view
  if (view === 'countries') {
    const filtered = countries.filter(c => c.toLowerCase().includes(search.toLowerCase()));
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Explore Places ✈️</Text>
          <Text style={styles.subtitle}>Find where people hang out worldwide</Text>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Search countries..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filtered}
          keyExtractor={c => c}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.countryCard} onPress={() => selectCountry(item)}>
              <Text style={styles.countryFlag}>{item.split(' ')[0]}</Text>
              <Text style={styles.countryName}>{item.split(' ').slice(1).join(' ')}</Text>
              <Text style={styles.countryArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  // Cities view
  if (view === 'cities') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backRow}>
            <Text style={styles.backText}>← Countries</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{selectedCountry}</Text>
          <Text style={styles.subtitle}>Pick a city</Text>
        </View>
        <FlatList
          data={cities}
          keyExtractor={c => c}
          contentContainerStyle={styles.cityList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.cityCard} onPress={() => selectCity(item)}>
              <Text style={styles.cityIcon}>🏙️</Text>
              <Text style={styles.cityName}>{item}</Text>
              <Text style={styles.cityArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  // Places view
  const FILTERS = ['all', 'bar', 'club', 'karaoke', 'gaming', 'beach', 'park', 'restaurant', 'sports', 'lounge'];
  const filtered = places.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = activeFilter === 'all' || p.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backRow}>
          <Text style={styles.backText}>← {selectedCountry?.split(' ').slice(1).join(' ')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏙️ {selectedCity}</Text>
        <Text style={styles.subtitle}>{places.length} spots to explore</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search spots, vibes, tags..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersBar} contentContainerStyle={styles.filtersContent}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === 'all' ? '🌍 All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.placeList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.placeCard} onPress={() => openPlace(item)}>
            <View style={styles.placeTop}>
              <Text style={styles.placeTypeIcon}>{item.typeInfo?.icon || '📍'}</Text>
              <View style={styles.placeTopRight}>
                <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[item.type] || '#6c63ff') + '33' }]}>
                  <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[item.type] || '#6c63ff' }]}>
                    {item.typeInfo?.label || item.type}
                  </Text>
                </View>
                {item.checkinCount > 0 && (
                  <View style={styles.checkinBadge}>
                    <Text style={styles.checkinBadgeText}>🔴 {item.checkinCount} here now</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.placeName}>{item.name}</Text>
            <Text style={styles.placeDesc}>{item.description}</Text>
            <View style={styles.placeMeta}>
              <Text style={styles.placeVibe}>{item.vibe}</Text>
              <Text style={styles.placeBestTime}>⏰ {item.bestTime}</Text>
            </View>
            <View style={styles.tagsRow}>
              {item.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No spots match your search</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  subtitle: { color: '#888', fontSize: 13, marginTop: 3 },
  backRow: { marginBottom: 6 },
  backText: { color: '#6c63ff', fontSize: 14, fontWeight: '600' },
  search: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    padding: 12, marginHorizontal: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#2a2a4a', fontSize: 15,
  },
  grid: { padding: 16, gap: 12 },
  countryCard: {
    flex: 1, margin: 6, backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a',
  },
  countryFlag: { fontSize: 40, marginBottom: 8 },
  countryName: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  countryArrow: { color: '#6c63ff', fontSize: 16, marginTop: 4 },
  cityList: { padding: 16, gap: 10 },
  cityCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2a4a', gap: 12,
  },
  cityIcon: { fontSize: 28 },
  cityName: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '600' },
  cityArrow: { color: '#6c63ff', fontSize: 22 },
  filtersBar: { maxHeight: 48 },
  filtersContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingVertical: 6 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a4a' },
  filterChipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  filterText: { color: '#888', fontSize: 13 },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  placeList: { padding: 16, gap: 14 },
  placeCard: {
    backgroundColor: '#1a1a2e', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  placeTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  placeTypeIcon: { fontSize: 34 },
  placeTopRight: { flex: 1, gap: 6 },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  checkinBadge: { alignSelf: 'flex-start', backgroundColor: '#ff5252', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  checkinBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  placeName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  placeDesc: { color: '#aaa', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  placeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  placeVibe: { color: '#fff', fontSize: 13, fontWeight: '600' },
  placeBestTime: { color: '#888', fontSize: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#6c63ff22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { color: '#6c63ff', fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#888', fontSize: 16 },
});
