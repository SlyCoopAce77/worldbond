import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Animated, RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getSocket } from '../services/socket';
import { stringToColor } from '../utils/apiUtils';
import { getCountryFlag } from '../utils/countryUtils';

const BOND_PINK = '#FF0080';

// ─── Stream card ──────────────────────────────────────────────────────────────
function StreamCard({ stream, onWatch, index }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const color = stringToColor(stream.hostName || '');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const flag = stream.hostCountry ? getCountryFlag(stream.hostCountry) : '🌍';

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <TouchableOpacity onPress={onWatch} activeOpacity={0.85} style={sc.card}>
        <LinearGradient colors={['#1a0808', '#120505']} style={sc.grad}>
          <View style={sc.left}>
            <View style={[sc.avatar, { backgroundColor: color }]}>
              <Text style={sc.avatarTxt}>{(stream.hostName || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={sc.meta}>
              <View style={sc.nameRow}>
                <Text style={sc.flag}>{flag}</Text>
                <Text style={sc.name} numberOfLines={1}>{stream.hostName}</Text>
              </View>
              <Text style={sc.title} numberOfLines={1}>{stream.title}</Text>
              <View style={sc.viewerRow}>
                <View style={sc.liveDot} />
                <Text style={sc.viewerTxt}>{stream.viewerCount || 0} watching</Text>
              </View>
            </View>
          </View>
          <View style={sc.watchBtn}>
            <Text style={sc.watchTxt}>Watch</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
const sc = StyleSheet.create({
  card:      { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#e5393520' },
  grad:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  left:      { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar:    { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { color: '#fff', fontWeight: '900', fontSize: 20 },
  meta:      { flex: 1, gap: 3 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flag:      { fontSize: 16 },
  name:      { color: '#fff', fontSize: 15, fontWeight: '800', flex: 1 },
  title:     { color: '#ffffff66', fontSize: 12 },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e53935' },
  viewerTxt: { color: '#e57373', fontSize: 11, fontWeight: '600' },
  watchBtn:  { backgroundColor: '#e5393520', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#e5393540' },
  watchTxt:  { color: '#e57373', fontSize: 13, fontWeight: '800' },
});

// ─── LiveHubScreen ────────────────────────────────────────────────────────────
export default function LiveHubScreen({ navigation, user }) {
  const socket = getSocket();
  const [streams,    setStreams]    = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const livePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(livePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 0, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (socket.connected) socket.emit('get_live_streams');
    else socket.once('connect', () => socket.emit('get_live_streams'));

    socket.on('live_streams', setStreams);
    return () => socket.off('live_streams', setStreams);
  }, []);

  function onRefresh() {
    setRefreshing(true);
    socket.emit('get_live_streams');
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Animated.View style={[s.liveDot, {
              opacity: livePulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            }]} />
            <Text style={s.headerTitle}>Live</Text>
            {streams.length > 0 && (
              <View style={s.countPill}>
                <Text style={s.countTxt}>{streams.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Live', { user })}
            activeOpacity={0.85}
            style={s.goLiveBtn}
          >
            <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.goLiveGrad}>
              <Text style={s.goLiveTxt}>Go Live  →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stream list */}
        <FlatList
          data={streams}
          keyExtractor={item => item.streamId}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e53935" />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => (
            <StreamCard
              stream={item}
              index={index}
              onWatch={() => navigation.navigate('LiveWatch', { stream: item, currentUser: user })}
            />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📡</Text>
              <Text style={s.emptyTitle}>No one is live right now</Text>
              <Text style={s.emptySub}>Be the first to go live and connect with the world.</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Live', { user })}
                activeOpacity={0.85}
                style={s.emptyBtn}
              >
                <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyBtnGrad}>
                  <Text style={s.emptyBtnTxt}>Start a Live  →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07080f' },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e53935' },
  headerTitle:{ color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  countPill:  { backgroundColor: '#e5393520', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#e5393540' },
  countTxt:   { color: '#e57373', fontSize: 12, fontWeight: '800' },

  goLiveBtn:  { borderRadius: 14, overflow: 'hidden' },
  goLiveGrad: { paddingHorizontal: 18, paddingVertical: 10 },
  goLiveTxt:  { color: '#fff', fontSize: 14, fontWeight: '800' },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  empty:      { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:  { fontSize: 52 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptySub:   { color: '#555', fontSize: 14, lineHeight: 21, textAlign: 'center', paddingHorizontal: 24 },
  emptyBtn:   { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  emptyBtnGrad:{ paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '800' },
});
