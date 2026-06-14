import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, ScrollView,
  TouchableOpacity, TextInput, Modal, KeyboardAvoidingView,
  Platform, Animated, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, SERVER_URL } from '../services/socket';
import { WORLD_COUNTRIES } from '../utils/countryUtils';
import { getAccessToken } from '../services/authApi';
import FilteredImage from '../components/FilteredImage';
import FilterPicker from '../components/FilterPicker';
import StoryViewer from '../components/StoryViewer';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stringToColor(str = '') {
  const palette = ['#e57373','#ba68c8','#4fc3f7','#81c784','#ffb74d','#f06292','#4db6ac','#7986cb'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function timeAgo(ts) {
  const d = Date.now() - ts, m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function countryFlag(str = '') {
  const m = str.match(/\p{Regional_Indicator}{2}/u);
  return m ? m[0] : '🌍';
}

function countryName(str = '') {
  return str.replace(/\p{Regional_Indicator}{2}/u, '').trim() || str;
}

// ─── Heart burst ──────────────────────────────────────────────────────────────

function HeartBurst({ visible }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    scale.setValue(0); opacity.setValue(1);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.6, useNativeDriver: true, bounciness: 14 }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible]);
  if (!visible) return null;
  return <Animated.Text style={[s.heartBurst, { transform: [{ scale }], opacity }]}>❤️</Animated.Text>;
}

// ─── Bond Footprint Card ──────────────────────────────────────────────────────

function BondFootprintCard({ bondPhotos, followingCount, isDemoMode, onPress }) {
  const countryData = useMemo(() => {
    const map = {};
    bondPhotos.forEach(p => {
      if (!p.country) return;
      if (!map[p.country]) map[p.country] = { count: 0, users: new Set() };
      map[p.country].count++;
      map[p.country].users.add(p.username);
    });
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([country, data]) => ({ country, count: data.count, users: [...data.users] }));
  }, [bondPhotos]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ])).start();
  }, []);
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.75] });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={fp.wrap}>
      <LinearGradient colors={['#0e0920', '#13103a', '#0a0a18']} style={fp.card}>

        {/* Animated glow orb */}
        <Animated.View style={[fp.glowOrb, { opacity: glowOpacity }]} />

        {/* Title row */}
        <View style={fp.topRow}>
          <View style={fp.titleGroup}>
            <Text style={fp.globe}>🌐</Text>
            <View>
              <Text style={fp.cardTitle}>Bond Footprint</Text>
              <Text style={fp.cardSub}>{isDemoMode ? '✦ Preview — bond with people to build yours' : 'Your reach across the world'}</Text>
            </View>
          </View>
          <View style={fp.explorePill}>
            <Text style={fp.exploreTxt}>Explore →</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={fp.statsRow}>
          <View style={fp.stat}>
            <Text style={fp.statNum}>{followingCount}</Text>
            <Text style={fp.statLabel}>bonds</Text>
          </View>
          <View style={fp.statDiv} />
          <View style={fp.stat}>
            <Text style={fp.statNum}>{countryData.length}</Text>
            <Text style={fp.statLabel}>countries</Text>
          </View>
          <View style={fp.statDiv} />
          <View style={fp.stat}>
            <Text style={fp.statNum}>{bondPhotos.length}</Text>
            <Text style={fp.statLabel}>moments</Text>
          </View>
        </View>

        {/* Flag grid */}
        {countryData.length > 0 ? (
          <View style={fp.flagGrid}>
            {countryData.slice(0, 12).map(({ country }) => (
              <Text key={country} style={fp.flagItem}>{countryFlag(country)}</Text>
            ))}
            {countryData.length > 12 && (
              <View style={fp.flagMore}>
                <Text style={fp.flagMoreTxt}>+{countryData.length - 12}</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={fp.emptyHint}>Bond with people to grow your world reach</Text>
        )}

      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Moment Ring (replaces story circle) ─────────────────────────────────────

function MomentRing({ group, isSelf, onPress }) {
  const hasNew = !isSelf && group?.stories?.some(s => !s.viewed);
  const pulse = useRef(new Animated.Value(1)).current;
  const color = stringToColor(group?.username || 'x');

  useEffect(() => {
    if (!hasNew) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 950, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hasNew]);

  const flag = countryFlag(group?.country || '');
  const cname = countryName(group?.country || '') || group?.username || '';

  return (
    <TouchableOpacity style={mr.item} onPress={onPress} activeOpacity={0.82}>
      {isSelf ? (
        <View style={mr.addRing}>
          <LinearGradient colors={['#6C47FF22', '#6C47FF0a']} style={mr.addInner}>
            <Text style={mr.addPlus}>+</Text>
          </LinearGradient>
        </View>
      ) : (
        <View style={mr.ringWrap}>
          {hasNew && (
            <Animated.View
              style={[mr.outerGlow, { borderColor: color, transform: [{ scale: pulse }] }]}
            />
          )}
          <LinearGradient
            colors={hasNew ? [color + '55', color + '22'] : ['#1a1a1a', '#111']}
            style={[mr.ring, hasNew && { borderColor: color + '99' }]}
          >
            <Text style={mr.flagBig}>{flag}</Text>
            <View style={[mr.initBadge, { backgroundColor: color }]}>
              <Text style={mr.initTxt}>{(group?.username?.[0] ?? '?').toUpperCase()}</Text>
            </View>
          </LinearGradient>
        </View>
      )}
      <Text style={mr.label} numberOfLines={1}>{isSelf ? 'Add' : cname}</Text>
    </TouchableOpacity>
  );
}

// ─── Bond Footprint Sheet ─────────────────────────────────────────────────────

function BondFootprintSheet({ visible, bondPhotos, onClose, onSelectCountry, activeFilter }) {
  const countryData = useMemo(() => {
    const map = {};
    bondPhotos.forEach(p => {
      if (!p.country) return;
      if (!map[p.country]) map[p.country] = { count: 0, users: [] };
      map[p.country].count++;
      if (!map[p.country].users.find(u => u.id === p.userId)) {
        map[p.country].users.push({ id: p.userId, username: p.username });
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([country, data]) => ({ country, count: data.count, users: data.users }));
  }, [bondPhotos]);

  const totalBonds = useMemo(() => {
    const seen = new Set();
    bondPhotos.forEach(p => seen.add(p.userId));
    return seen.size;
  }, [bondPhotos]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={bfs.overlay} activeOpacity={1} onPress={onClose}>
        <View style={bfs.sheet}>
          <View style={bfs.handle} />

          {/* Header */}
          <View style={bfs.header}>
            <Text style={bfs.title}>🌐 Bond Footprint</Text>
            <Text style={bfs.sub}>
              {countryData.length} {countryData.length === 1 ? 'country' : 'countries'} · {totalBonds} {totalBonds === 1 ? 'bond' : 'bonds'} · tap to filter
            </Text>
          </View>

          {/* Active filter chip */}
          {activeFilter && (
            <TouchableOpacity style={bfs.activeChip} onPress={() => { onSelectCountry(null); onClose(); }}>
              <Text style={bfs.activeChipFlag}>{countryFlag(activeFilter)}</Text>
              <Text style={bfs.activeChipTxt}>Showing {countryName(activeFilter)}</Text>
              <Text style={bfs.activeChipX}>✕ Clear</Text>
            </TouchableOpacity>
          )}

          <ScrollView
            style={{ maxHeight: 480 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {countryData.length === 0 ? (
              <View style={bfs.empty}>
                <Text style={bfs.emptyIcon}>🌍</Text>
                <Text style={bfs.emptyTxt}>Bond with people from around the world to grow your footprint</Text>
              </View>
            ) : (
              countryData.map(({ country, count, users }) => {
                const isActive = activeFilter === country;
                return (
                  <TouchableOpacity
                    key={country}
                    style={[bfs.row, isActive && bfs.rowActive]}
                    onPress={() => { onSelectCountry(isActive ? null : country); onClose(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={bfs.rowFlag}>{countryFlag(country)}</Text>
                    <View style={bfs.rowInfo}>
                      <Text style={[bfs.rowName, isActive && bfs.rowNameActive]}>
                        {countryName(country) || country}
                      </Text>
                      {/* Bond user initials */}
                      <View style={bfs.avatarRow}>
                        {users.slice(0, 6).map(u => (
                          <View key={u.id} style={[bfs.avatar, { backgroundColor: stringToColor(u.username) }]}>
                            <Text style={bfs.avatarTxt}>{u.username[0].toUpperCase()}</Text>
                          </View>
                        ))}
                        {users.length > 6 && (
                          <Text style={bfs.avatarMore}>+{users.length - 6}</Text>
                        )}
                      </View>
                    </View>
                    <View style={bfs.rowRight}>
                      <Text style={[bfs.rowCount, isActive && bfs.rowCountActive]}>{count}</Text>
                      <Text style={bfs.rowCountLabel}>moments</Text>
                    </View>
                    <Text style={[bfs.rowChevron, isActive && { color: '#6C47FF' }]}>›</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Bond Trail Card ──────────────────────────────────────────────────────────

function BondTrailCard({ photo, user, onComment, onProfile, onFollow, followingIds }) {
  const socket = getSocket();
  const myUid = user?.userId || socket.id;
  const [liked,     setLiked]    = useState(photo.likes?.some(l => l.userId === socket.id));
  const [likeCount, setLikeCount] = useState(photo.likes?.length || 0);
  const [echoed,    setEchoed]   = useState(photo.echos?.some(e => e.userId === myUid));
  const [echoCount, setEchoCount] = useState(photo.echos?.length || 0);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);
  const threadColor = stringToColor(photo.username);

  useEffect(() => {
    setLiked(photo.likes?.some(l => l.userId === socket.id));
    setLikeCount(photo.likes?.length || 0);
    setEchoed(photo.echos?.some(e => e.userId === myUid));
    setEchoCount(photo.echos?.length || 0);
  }, [photo.likes, photo.echos]);

  function toggleLike() {
    socket.emit('like_photo', { photoId: photo.id });
    setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1);
  }

  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) { toggleLike(); setShowHeart(true); setTimeout(() => setShowHeart(false), 900); }
    }
    lastTap.current = now;
  }

  const isOwn = photo.userId === socket.id;
  const isFollowed = followingIds.includes(photo.userId);
  const cardW = width - 32;

  return (
    <View style={bt.card}>
      {/* Colored thread line running full height */}
      <View style={[bt.thread, { backgroundColor: threadColor }]} />

      <View style={bt.inner}>
        {/* Header */}
        <TouchableOpacity style={bt.header} onPress={() => onProfile(photo)} activeOpacity={0.8}>
          <View style={[bt.av, { backgroundColor: threadColor }]}>
            <Text style={bt.avTxt}>{(photo.username?.[0] ?? '?').toUpperCase()}</Text>
            {photo.mood && <Text style={bt.mood}>{photo.mood}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={bt.uname}>{photo.username}</Text>
              <Text>{countryFlag(photo.country)}</Text>
            </View>
            <Text style={bt.meta}>{countryName(photo.country)} · {timeAgo(photo.createdAt)}</Text>
          </View>
          {!isOwn && (
            <TouchableOpacity
              style={[bt.bondBtn, isFollowed && { backgroundColor: threadColor + '33', borderColor: threadColor }]}
              onPress={() => onFollow(photo.userId, isFollowed)}
            >
              <Text style={[bt.bondBtnTxt, isFollowed && { color: threadColor }]}>
                {isFollowed ? '✓ Bonded' : '+ Bond'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Photo + side actions */}
        <View style={bt.photoRow}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleDoubleTap}
            style={[bt.photoWrap, { width: cardW - 56 }]}
          >
            {photo.imageUrl ? (
              <FilteredImage
                uri={photo.imageUrl}
                filterId={photo.filter || 'normal'}
                style={[bt.photo, { width: cardW - 56, height: (cardW - 56) * 1.1 }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[bt.photo, { width: cardW - 56, height: (cardW - 56) * 1.1, backgroundColor: stringToColor(photo.username) + '33', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 42 }}>{countryFlag(photo.country)}</Text>
              </View>
            )}
            {showHeart && (
              <Animated.Text style={bt.heartBurst}>❤️</Animated.Text>
            )}
            {/* Country stamp overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.72)']}
              style={bt.photoGrad}
            >
              <Text style={bt.photoFlag}>{countryFlag(photo.country)}</Text>
              <Text style={bt.photoCountry}>{countryName(photo.country)}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Vertical actions rail */}
          <View style={bt.actionsRail}>
            <TouchableOpacity style={bt.railBtn} onPress={toggleLike}>
              <Text style={bt.railIcon}>{liked ? '❤️' : '🤍'}</Text>
              {likeCount > 0 && <Text style={[bt.railCount, liked && { color: '#e91e63' }]}>{likeCount}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={bt.railBtn} onPress={() => onComment(photo)}>
              <Text style={bt.railIcon}>💬</Text>
              {photo.comments?.length > 0 && <Text style={bt.railCount}>{photo.comments.length}</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={bt.railBtn}
              onPress={() => {
                socket.emit('echo_photo', { photoId: photo.id });
                setEchoed(e => !e); setEchoCount(c => echoed ? c - 1 : c + 1);
              }}
            >
              <Text style={[bt.railIcon, echoed && { color: '#6C47FF' }]}>🔊</Text>
              {echoCount > 0 && <Text style={[bt.railCount, echoed && { color: '#6C47FF' }]}>{echoCount}</Text>}
            </TouchableOpacity>
            {isOwn && (
              <TouchableOpacity
                style={bt.railBtn}
                onPress={() => Alert.alert('Delete Photo', 'Remove this photo?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => socket.emit('delete_photo', { photoId: photo.id }) },
                ])}
              >
                <Text style={[bt.railIcon, { fontSize: 18, color: '#555' }]}>⋯</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Caption */}
        {!!photo.caption && (
          <View style={bt.captionWrap}>
            <Text style={bt.captionUser}>{photo.username} </Text>
            <Text style={bt.captionTxt}>{photo.caption}</Text>
          </View>
        )}
        {photo.comments?.length > 0 && (
          <TouchableOpacity onPress={() => onComment(photo)} style={bt.commentHint}>
            <Text style={bt.commentHintTxt}>View {photo.comments.length} {photo.comments.length === 1 ? 'comment' : 'comments'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Comments modal ───────────────────────────────────────────────────────────

function CommentsModal({ visible, photo, user, onClose }) {
  const [text, setText] = useState('');
  const socket = getSocket();
  function submit() {
    if (!text.trim()) return;
    socket.emit('comment_photo', { photoId: photo?.id, text: text.trim() });
    setText('');
  }
  if (!photo) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cm.overlay}>
        <TouchableOpacity style={cm.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={cm.sheet}>
          <View style={cm.handle} />
          <Text style={cm.title}>Comments</Text>
          <FlatList
            data={photo.comments || []}
            keyExtractor={c => String(c.id)}
            style={{ maxHeight: 340 }}
            ListEmptyComponent={<Text style={cm.empty}>No comments yet — be first!</Text>}
            renderItem={({ item }) => (
              <View style={cm.row}>
                <View style={[cm.av, { backgroundColor: stringToColor(item.username) }]}>
                  <Text style={cm.avTxt}>{(item.username?.[0] ?? '?').toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={cm.user}>{item.username}</Text>
                    <Text style={{ fontSize: 12 }}>{countryFlag(item.country)}</Text>
                    <Text style={cm.time}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={cm.txt}>{item.text}</Text>
                </View>
              </View>
            )}
          />
          <View style={cm.inputRow}>
            <View style={[cm.av, { backgroundColor: stringToColor(user.username) }]}>
              <Text style={cm.avTxt}>{user.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <TextInput
              style={cm.input}
              placeholder="Add a comment…"
              placeholderTextColor="#444"
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              style={[cm.send, !text.trim() && cm.sendOff]}
              onPress={submit}
              disabled={!text.trim()}
            >
              <Text style={cm.sendTxt}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Upload modal ─────────────────────────────────────────────────────────────

function UploadModal({ visible, onClose, user, mode = 'photo' }) {
  const [imageUri,   setImageUri]   = useState(null);
  const [caption,    setCaption]    = useState('');
  const [filter,     setFilter]     = useState('normal');
  const [uploading,  setUploading]  = useState(false);
  const [audience,   setAudience]   = useState('world'); // 'world' | 'bonds'
  const isStory = mode === 'story';

  function reset() {
    setImageUri(null); setCaption(''); setFilter('normal');
    setUploading(false); setAudience('world');
  }

  function pick(cam) {
    const fn = cam ? launchCamera : launchImageLibrary;
    fn({ mediaType: 'photo', quality: 0.7, maxWidth: 1080, maxHeight: 1080 }, r => {
      if (!r.didCancel && r.assets?.[0]) setImageUri(r.assets[0].uri);
    });
  }

  async function upload() {
    if (!imageUri) return;
    setUploading(true);
    try {
      const token = await getAccessToken();
      const fd = new FormData();
      fd.append('photo', { uri: imageUri, type: 'image/jpeg', name: 'photo.jpg' });
      fd.append('username', user.username);
      fd.append('userId', user.userId || user.id || '');
      fd.append('country', user.country);
      fd.append('language', user.language);
      fd.append('mood', user.mood || '');
      fd.append('caption', caption.trim());
      fd.append('filter', filter);
      if (isStory) fd.append('audience', audience);
      const ep = isStory ? '/api/stories/upload' : '/api/photos/upload';
      const res = await fetch(`${SERVER_URL}${ep}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      reset(); onClose();
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <View style={up.overlay}>
        <TouchableOpacity style={up.backdrop} activeOpacity={1} onPress={() => { reset(); onClose(); }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={up.sheet}>
          <View style={up.handle} />
          <Text style={up.title}>{isStory ? 'New Story ✨' : 'Share with the World 🌍'}</Text>

          {/* Story audience selector */}
          {isStory && (
            <View style={up.audienceRow}>
              <Text style={up.audienceLabel}>Who can see this?</Text>
              <View style={up.audiencePills}>
                <TouchableOpacity
                  style={[up.audiencePill, audience === 'world' && up.audiencePillActive]}
                  onPress={() => setAudience('world')}
                >
                  <Text style={up.audiencePillIcon}>🌍</Text>
                  <Text style={[up.audiencePillTxt, audience === 'world' && up.audiencePillTxtActive]}>World</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[up.audiencePill, audience === 'bonds' && up.audiencePillActive]}
                  onPress={() => setAudience('bonds')}
                >
                  <Text style={up.audiencePillIcon}>🫂</Text>
                  <Text style={[up.audiencePillTxt, audience === 'bonds' && up.audiencePillTxtActive]}>Bonds only</Text>
                </TouchableOpacity>
              </View>
              <Text style={up.audienceHint}>
                {audience === 'world'
                  ? 'Everyone on Bond can see your story'
                  : 'Only people you\'re bonded with can see your story'}
              </Text>
            </View>
          )}

          {/* Photo picker */}
          {!imageUri ? (
            <View style={up.picks}>
              <TouchableOpacity style={up.pick} onPress={() => pick(false)}>
                <Text style={up.pickIcon}>🖼️</Text>
                <Text style={up.pickTxt}>Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={up.pick} onPress={() => pick(true)}>
                <Text style={up.pickIcon}>📷</Text>
                <Text style={up.pickTxt}>Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginBottom: 10, gap: 8 }}>
              <FilteredImage uri={imageUri} filterId={filter} style={up.preview} />
              <TouchableOpacity onPress={() => pick(false)}>
                <Text style={{ color: '#6C47FF', fontSize: 13, fontWeight: '600' }}>Change photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {imageUri && <FilterPicker imageUri={imageUri} selectedFilter={filter} onSelect={setFilter} />}

          <TextInput
            style={up.caption}
            placeholder={isStory ? 'Add a caption…' : 'Write a caption… 🌍'}
            placeholderTextColor="#444"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
          />

          <TouchableOpacity
            style={[up.btn, (!imageUri || uploading) && up.btnOff]}
            onPress={upload}
            disabled={!imageUri || uploading}
          >
            {uploading
              ? <ActivityIndicator color="#fff" />
              : <Text style={up.btnTxt}>
                  {isStory
                    ? (audience === 'bonds' ? 'Share to Bonds 🫂' : 'Share to World 🌍')
                    : 'Post to the World 🌍'}
                </Text>
            }
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Photo card (IG-style full-width) ─────────────────────────────────────────

function PhotoCard({ photo, user, onComment, onProfile, onFollow, followingIds, showCountryBadge }) {
  const socket = getSocket();
  const myUid = user?.userId || socket.id;
  const [liked,      setLiked]     = useState(photo.likes?.some(l => l.userId === socket.id));
  const [likeCount,  setLikeCount] = useState(photo.likes?.length || 0);
  const [echoed,     setEchoed]    = useState(photo.echos?.some(e => e.userId === myUid));
  const [echoCount,  setEchoCount] = useState(photo.echos?.length || 0);
  const [showHeart,  setShowHeart] = useState(false);
  const lastTap = useRef(0);

  useEffect(() => {
    setLiked(photo.likes?.some(l => l.userId === socket.id));
    setLikeCount(photo.likes?.length || 0);
    setEchoed(photo.echos?.some(e => e.userId === myUid));
    setEchoCount(photo.echos?.length || 0);
  }, [photo.likes, photo.echos]);

  function toggleLike() {
    socket.emit('like_photo', { photoId: photo.id });
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  }

  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) { toggleLike(); setShowHeart(true); setTimeout(() => setShowHeart(false), 900); }
    }
    lastTap.current = now;
  }

  const isOwn      = photo.userId === socket.id;
  const isFollowed = followingIds.includes(photo.userId);

  return (
    <View style={pc.card}>
      {/* Header */}
      <TouchableOpacity style={pc.header} onPress={() => onProfile(photo)}>
        <View style={[pc.av, { backgroundColor: stringToColor(photo.username) }]}>
          <Text style={pc.avTxt}>{(photo.username?.[0] ?? '?').toUpperCase()}</Text>
          {photo.mood && <Text style={pc.mood}>{photo.mood}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          {/* Flag right next to name */}
          <View style={pc.nameRow}>
            <Text style={pc.flag}>{countryFlag(photo.country)}</Text>
            <Text style={pc.username}>{photo.username}</Text>
          </View>
          <View style={pc.sub}>
            <Text style={pc.country}>{countryName(photo.country)}</Text>
            <Text style={pc.sep}>·</Text>
            <Text style={pc.time}>{timeAgo(photo.createdAt)}</Text>
          </View>
        </View>
        {!isOwn && (
          <TouchableOpacity
            style={[pc.followBtn, isFollowed && pc.followBtnOn]}
            onPress={() => onFollow(photo.userId, isFollowed)}
          >
            <Text style={[pc.followTxt, isFollowed && pc.followTxtOn]}>
              {isFollowed ? '✓ Bonded' : '+ Bond'}
            </Text>
          </TouchableOpacity>
        )}
        {isOwn && (
          <TouchableOpacity onPress={() =>
            Alert.alert('Delete Photo', 'Remove this photo?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => socket.emit('delete_photo', { photoId: photo.id }) },
            ])
          }>
            <Text style={{ fontSize: 18, color: '#444' }}>⋯</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Photo */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={{ position: 'relative' }}>
        <FilteredImage uri={photo.imageUrl} filterId={photo.filter || 'normal'} style={pc.img} resizeMode="cover" />
        <HeartBurst visible={showHeart} />
        {/* World tab country badge on image */}
        {showCountryBadge && (
          <View style={pc.countryBadge}>
            <Text style={pc.countryBadgeFlag}>{countryFlag(photo.country)}</Text>
            <Text style={pc.countryBadgeName}>{countryName(photo.country)}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={pc.actions}>
        <TouchableOpacity style={pc.actionBtn} onPress={toggleLike}>
          <Text style={[pc.actionIcon, liked && pc.liked]}>{liked ? '❤️' : '🤍'}</Text>
          {likeCount > 0 && <Text style={[pc.actionCount, liked && pc.likedCount]}>{likeCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={pc.actionBtn} onPress={() => onComment(photo)}>
          <Text style={pc.actionIcon}>💬</Text>
          {photo.comments?.length > 0 && <Text style={pc.actionCount}>{photo.comments.length}</Text>}
        </TouchableOpacity>
        {/* Echo — Bond's unique repost */}
        <TouchableOpacity
          style={pc.actionBtn}
          onPress={() => {
            socket.emit('echo_photo', { photoId: photo.id });
            setEchoed(e => !e);
            setEchoCount(c => echoed ? c - 1 : c + 1);
          }}
        >
          <Text style={[pc.actionIcon, echoed && pc.echoed]}>🔊</Text>
          {echoCount > 0 && <Text style={[pc.actionCount, echoed && pc.echoedCount]}>{echoCount}</Text>}
        </TouchableOpacity>
      </View>

      {likeCount > 0 && (
        <Text style={pc.likes}>❤️ {likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
      )}
      {echoCount > 0 && (
        <Text style={pc.echos}>🔊 {echoCount} {echoCount === 1 ? 'echo' : 'echos'}</Text>
      )}
      {!!photo.caption && (
        <View style={pc.captionRow}>
          <Text style={pc.captionUser}>{photo.username}</Text>
          <Text style={pc.caption}>{photo.caption}</Text>
        </View>
      )}
      {photo.comments?.length > 0 && (
        <TouchableOpacity onPress={() => onComment(photo)} style={pc.commentPrev}>
          {photo.comments.length > 1 && (
            <Text style={pc.viewAll}>View all {photo.comments.length} comments</Text>
          )}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <Text style={pc.prevUser}>{photo.comments[photo.comments.length - 1].username}</Text>
            <Text style={pc.prevTxt} numberOfLines={1}>{photo.comments[photo.comments.length - 1].text}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PhotoFeedScreen({ navigation, user }) {
  const DEMO_PHOTOS = useMemo(() => [
    { id: 'd1', userId: 'demo1', username: 'kenji_tokyo', country: '🇯🇵 Japan',       city: 'Tokyo',      imageUrl: '', caption: 'Night vibes 🌃', likes: [], echos: [], comments: [], createdAt: Date.now() - 3600000 },
    { id: 'd2', userId: 'demo2', username: 'amara_lagos', country: '🇳🇬 Nigeria',     city: 'Lagos',      imageUrl: '', caption: 'Sunday mood 🔥', likes: [], echos: [], comments: [], createdAt: Date.now() - 7200000 },
    { id: 'd3', userId: 'demo3', username: 'sofia_br',    country: '🇧🇷 Brazil',      city: 'São Paulo',  imageUrl: '', caption: 'Carnaval prep', likes: [], echos: [], comments: [], createdAt: Date.now() - 10800000 },
    { id: 'd4', userId: 'demo4', username: 'priya_in',    country: '🇮🇳 India',       city: 'Mumbai',     imageUrl: '', caption: '🎶 rainy season', likes: [], echos: [], comments: [], createdAt: Date.now() - 14400000 },
    { id: 'd5', userId: 'demo5', username: 'lars_se',     country: '🇸🇪 Sweden',      city: 'Stockholm',  imageUrl: '', caption: 'Midnight sun', likes: [], echos: [], comments: [], createdAt: Date.now() - 18000000 },
    { id: 'd6', userId: 'demo6', username: 'yemi_gh',     country: '🇬🇭 Ghana',       city: 'Accra',      imageUrl: '', caption: 'Beach day 🏖', likes: [], echos: [], comments: [], createdAt: Date.now() - 21600000 },
    { id: 'd7', userId: 'demo7', username: 'hiro_jp',     country: '🇯🇵 Japan',       city: 'Osaka',      imageUrl: '', caption: 'Ramen run 🍜', likes: [], echos: [], comments: [], createdAt: Date.now() - 25200000 },
    { id: 'd8', userId: 'demo8', username: 'ines_pt',     country: '🇵🇹 Portugal',    city: 'Lisbon',     imageUrl: '', caption: 'Sunset fado 🎵', likes: [], echos: [], comments: [], createdAt: Date.now() - 28800000 },
    { id: 'd9', userId: 'demo9', username: 'carlos_mx',   country: '🇲🇽 Mexico',      city: 'Mexico City',imageUrl: '', caption: 'Tacos at 2am 🌮', likes: [], echos: [], comments: [], createdAt: Date.now() - 32400000 },
  ], []);
  const DEMO_FOLLOWING = useMemo(() => DEMO_PHOTOS.map(p => p.userId), [DEMO_PHOTOS]);

  const [photos,            setPhotos]           = useState([]);
  const [stories,           setStories]          = useState([]);
  const [tab,               setTab]              = useState('world');
  const [countryFilter,     setCountryFilter]    = useState(null);
  const [showFootprints,    setShowFootprints]    = useState(false);
  const [showUpload,        setShowUpload]        = useState(false);
  const [uploadMode,        setUploadMode]        = useState('photo');
  const [commentPhoto,      setCommentPhoto]      = useState(null);
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
  const [followingIds,      setFollowingIds]      = useState([]);
  const [savedCountries,    setSavedCountries]    = useState([]);
  const [currentCountry,    setCurrentCountry]    = useState(null); // null = globe prompt
  const [countryFlagCounts, setCountryFlagCounts] = useState({});   // country -> planted count
  const [showBondFootprint,  setShowBondFootprint]  = useState(true); // open on first load to demo
  const [bondCountryFilter, setBondCountryFilter] = useState(null);
  const globeAnim  = useRef(new Animated.Value(1)).current;
  const landAnim   = useRef(new Animated.Value(0)).current;
  const socket = getSocket();

  // Load saved countries and re-plant flags on server after connect
  useEffect(() => {
    AsyncStorage.getItem('bond_saved_countries').then(raw => {
      const countries = raw ? JSON.parse(raw) : [];
      if (countries.length) {
        setSavedCountries(countries);
        const plant = () => countries.forEach(c => socket.emit('plant_flag', { country: c }));
        if (socket.connected) plant(); else socket.once('connect', plant);
      }
    });
  }, []);

  async function toggleSaveCountry(country) {
    setSavedCountries(prev => {
      const alreadySaved = prev.includes(country);
      const next = alreadySaved ? prev.filter(c => c !== country) : [...prev, country];
      AsyncStorage.setItem('bond_saved_countries', JSON.stringify(next));
      // Tell server
      socket.emit(alreadySaved ? 'uproot_flag' : 'plant_flag', { country });
      return next;
    });
  }

  useEffect(() => {
    function init() {
      socket.emit('get_photos');
      socket.emit('get_stories');
      socket.emit('get_following', { userId: socket.id });
    }
    if (socket.connected) init(); else socket.once('connect', init);

    socket.on('photos_feed',   setPhotos);
    socket.on('new_photo',     p  => setPhotos(prev => [p, ...prev]));
    socket.on('photo_updated', up => {
      setPhotos(prev => prev.map(p => p.id === up.id ? up : p));
      setCommentPhoto(cp => cp?.id === up.id ? up : cp);
    });
    socket.on('stories_updated', setStories);
    socket.on('following_list',  ({ following }) => setFollowingIds(following));
    socket.on('follow_status',   ({ targetUserId, following }) =>
      setFollowingIds(prev =>
        following ? [...new Set([...prev, targetUserId])] : prev.filter(id => id !== targetUserId)
      )
    );
    socket.on('country_flag_count', ({ country, count }) =>
      setCountryFlagCounts(prev => ({ ...prev, [country]: count }))
    );
    return () => {
      ['photos_feed','new_photo','photo_updated','stories_updated','following_list','follow_status','country_flag_count']
        .forEach(e => socket.off(e));
    };
  }, []);

  const countries = useMemo(() => {
    const seen = new Set(), list = [];
    photos.forEach(p => { if (p.country && !seen.has(p.country)) { seen.add(p.country); list.push(p.country); } });
    return list;
  }, [photos]);

  const worldPhotos = useMemo(() =>
    currentCountry ? photos.filter(p => p.country === currentCountry) : photos
  , [photos, currentCountry]);

  const myUserId = user?.userId || socket.id;
  const realBondPhotos = useMemo(() =>
    photos.filter(p =>
      followingIds.includes(p.userId) ||
      p.userId === myUserId ||
      p.echos?.some(e => followingIds.includes(e.userId))
    )
  , [photos, followingIds, myUserId]);

  // Show demo data when no real bonds exist yet so the footprint is visible
  const isDemoMode = realBondPhotos.length === 0 && followingIds.length === 0;
  const allBondPhotos = isDemoMode ? DEMO_PHOTOS : realBondPhotos;
  const effectiveFollowingIds = isDemoMode ? DEMO_FOLLOWING : followingIds;

  // Force-open the sheet in demo mode so the user can see it immediately
  useEffect(() => {
    if (isDemoMode && tab === 'bonds') setShowBondFootprint(true);
  }, [isDemoMode, tab]);

  const bondPhotos = useMemo(() =>
    bondCountryFilter
      ? allBondPhotos.filter(p => p.country === bondCountryFilter)
      : allBondPhotos
  , [allBondPhotos, bondCountryFilter]);

  // Stories filtered by audience for bonds tab
  const bondsStories = useMemo(() =>
    stories.filter(g => {
      // show world stories + stories from bonds
      const isOwn = g.userId === socket.id;
      const isBonded = followingIds.includes(g.userId);
      return isOwn || isBonded || g.audience !== 'bonds';
    })
  , [stories, followingIds]);

  function openProfile(photo) {
    navigation.navigate('Profile', {
      profileUser: {
        username: photo.username, country: photo.country,
        language: photo.language, socials: {}, socketId: photo.userId,
      },
    });
  }

  function handleFollow(targetUserId, isFollowed) {
    socket.emit(isFollowed ? 'unfollow_user' : 'follow_user', { targetUserId });
  }

  function teleport() {
    // Bounce the globe, then land somewhere new
    Animated.sequence([
      Animated.timing(globeAnim, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(globeAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(globeAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();

    // Pick a random country from all world countries, excluding the current one
    const options = WORLD_COUNTRIES.filter(c => c !== currentCountry);
    const pick = options[Math.floor(Math.random() * options.length)];

    landAnim.setValue(0);
    setCurrentCountry(pick);
    socket.emit('get_country_flag_count', { country: pick });
    Animated.spring(landAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
  }

  const countryFilterHeader = (
    <View>

      {/* ── Footprints trigger (replaces scrolling pill strip) ── */}
      {savedCountries.length > 0 && (
        <View style={s.footprintRow}>
          <TouchableOpacity style={s.footprintBtn} onPress={() => setShowFootprints(true)} activeOpacity={0.8}>
            <Text style={s.footprintEmoji}>👣</Text>
            <Text style={s.footprintLabel}>Footprints</Text>
            <View style={s.footprintBadge}>
              <Text style={s.footprintBadgeTxt}>{savedCountries.length}</Text>
            </View>
          </TouchableOpacity>
          {currentCountry && savedCountries.includes(currentCountry) && (
            <TouchableOpacity style={s.footprintActiveChip} onPress={() => setCurrentCountry(null)} activeOpacity={0.8}>
              <Text style={s.footprintActiveFlag}>{countryFlag(currentCountry)}</Text>
              <Text style={s.footprintActiveName} numberOfLines={1}>{countryName(currentCountry) || currentCountry}</Text>
              <Text style={s.footprintActiveClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Globe teleport button ── */}
      {!currentCountry ? (
        <View style={s.globePrompt}>
          <Animated.Text
            style={[s.globeEmoji, { transform: [{ scale: globeAnim }] }]}
          >
            🌍
          </Animated.Text>
          <Text style={s.globeTitle}>Explore the world</Text>
          <Text style={s.globeSub}>
            {countries.length > 0
              ? `${countries.length} countries posting right now`
              : 'Be the first to post from your country!'}
          </Text>
          <TouchableOpacity style={s.teleportBtn} onPress={teleport} activeOpacity={0.85}>
            <Text style={s.teleportBtnTxt}>🌍  Take me somewhere</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Landed on a country ── */
        <Animated.View style={[s.landingBanner, {
          opacity: landAnim,
          transform: [{ translateY: landAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <View style={s.landingTop}>
            <Text style={s.landingFlag}>{countryFlag(currentCountry)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.landingLabel}>You landed in</Text>
              <Text style={s.landingCountry}>{countryName(currentCountry) || currentCountry}</Text>
              {/* 📍 planted count */}
              <View style={s.plantedRow}>
                <Text style={s.plantedIcon}>📍</Text>
                <Text style={s.plantedCount}>
                  {(countryFlagCounts[currentCountry] || 0).toLocaleString()} planted
                </Text>
              </View>
            </View>
            <TouchableOpacity style={s.nextBtn} onPress={teleport} activeOpacity={0.8}>
              <Text style={s.nextBtnTxt}>Next 🌍</Text>
            </TouchableOpacity>
          </View>
          {/* Pin / Unpin country */}
          <TouchableOpacity
            style={[s.followCountryBtn, savedCountries.includes(currentCountry) && s.followCountryBtnOn]}
            onPress={() => toggleSaveCountry(currentCountry)}
            activeOpacity={0.85}
          >
            <Text style={[s.followCountryTxt, savedCountries.includes(currentCountry) && s.followCountryTxtOn]}>
              {savedCountries.includes(currentCountry)
                ? `📍 Pinned in ${countryName(currentCountry) || currentCountry}`
                : `📍 Pin yourself in ${countryName(currentCountry) || currentCountry}`}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={s.divider} />
    </View>
  );

  const bondsHeader = (
    <View>
      {/* Bond Footprint Card */}
      <BondFootprintCard
        bondPhotos={allBondPhotos}
        followingCount={effectiveFollowingIds.length}
        isDemoMode={isDemoMode}
        onPress={() => setShowBondFootprint(true)}
      />

      {/* Active country filter chip */}
      {bondCountryFilter && (
        <TouchableOpacity
          style={s.bondFilterChip}
          onPress={() => setBondCountryFilter(null)}
          activeOpacity={0.8}
        >
          <Text style={s.bondFilterFlag}>{countryFlag(bondCountryFilter)}</Text>
          <Text style={s.bondFilterTxt}>{countryName(bondCountryFilter)}</Text>
          <Text style={s.bondFilterX}>✕</Text>
        </TouchableOpacity>
      )}


      {/* Moment Rings row */}
      <View style={s.momentSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.momentRow}
        >
          {/* Add your moment */}
          <MomentRing
            isSelf
            group={{ username: user?.username, country: user?.country }}
            onPress={() => { setUploadMode('story'); setShowUpload(true); }}
          />
          {/* Bond story rings */}
          {bondsStories.map(g => (
            <MomentRing
              key={g.userId}
              group={g}
              onPress={() => setViewingStoryGroup(g)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={s.divider} />
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.title}>Photos</Text>
        <TouchableOpacity
          style={s.postBtn}
          onPress={() => { setUploadMode('photo'); setShowUpload(true); }}
        >
          <Text style={s.postBtnTxt}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab toggle ── */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'world' && s.tabActive]}
          onPress={() => setTab('world')}
        >
          <Text style={[s.tabTxt, tab === 'world' && s.tabTxtActive]}>🌍  World</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'bonds' && s.tabActive]}
          onPress={() => setTab('bonds')}
        >
          <Text style={[s.tabTxt, tab === 'bonds' && s.tabTxtActive]}>🫂  Bonds</Text>
        </TouchableOpacity>
      </View>

      {/* ── Feed ── */}
      <FlatList
        key={tab}
        data={tab === 'world' ? worldPhotos : bondPhotos}
        keyExtractor={p => String(p.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          tab === 'world' ? countryFilterHeader : bondsHeader
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>{tab === 'world' ? '🌍' : '🫂'}</Text>
            <Text style={s.emptyTitle}>
              {tab === 'world' ? 'No photos yet' : 'No bond photos yet'}
            </Text>
            <Text style={s.emptySub}>
              {tab === 'world'
                ? 'Be the first to share a moment from your world!'
                : 'Bond with people to see their photos here'}
            </Text>
            {tab === 'world' && (
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => { setUploadMode('photo'); setShowUpload(true); }}
              >
                <Text style={s.emptyBtnTxt}>Post a Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) =>
          tab === 'bonds' ? (
            <BondTrailCard
              photo={item}
              user={user}
              onComment={setCommentPhoto}
              onProfile={openProfile}
              onFollow={handleFollow}
              followingIds={followingIds}
            />
          ) : (
            <PhotoCard
              photo={item}
              user={user}
              onComment={setCommentPhoto}
              onProfile={openProfile}
              onFollow={handleFollow}
              followingIds={followingIds}
              showCountryBadge
            />
          )
        }
      />

      {/* ── Modals ── */}
      <UploadModal
        visible={showUpload}
        mode={uploadMode}
        onClose={() => setShowUpload(false)}
        user={user}
      />
      <CommentsModal
        visible={!!commentPhoto}
        photo={commentPhoto}
        user={user}
        onClose={() => setCommentPhoto(null)}
      />
      <StoryViewer
        visible={!!viewingStoryGroup}
        storyGroup={viewingStoryGroup}
        onClose={() => setViewingStoryGroup(null)}
        onDelete={id => socket.emit('delete_story', { storyId: id })}
        onViewStory={id => socket.emit('view_story', { storyId: id })}
        currentUserId={socket.id}
      />

      <BondFootprintSheet
        visible={showBondFootprint}
        bondPhotos={allBondPhotos}
        onClose={() => setShowBondFootprint(false)}
        onSelectCountry={setBondCountryFilter}
        activeFilter={bondCountryFilter}
      />

      {/* ── Footprints bottom sheet ── */}
      <Modal visible={showFootprints} transparent animationType="slide" onRequestClose={() => setShowFootprints(false)}>
        <TouchableOpacity style={s.fpOverlay} activeOpacity={1} onPress={() => setShowFootprints(false)}>
          <TouchableOpacity style={s.fpSheet} activeOpacity={1} onPress={() => {}}>
            <View style={s.fpHandle} />
            <Text style={s.fpTitle}>👣 Your Footprints</Text>
            <View style={s.fpGrid}>
              {/* All — clear filter */}
              <TouchableOpacity
                style={[s.fpCell, !currentCountry && s.fpCellActive]}
                onPress={() => { setCurrentCountry(null); setShowFootprints(false); }}
                activeOpacity={0.8}
              >
                <Text style={s.fpCellFlag}>🌍</Text>
                <Text style={s.fpCellName}>All</Text>
              </TouchableOpacity>
              {savedCountries.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.fpCell, currentCountry === c && s.fpCellActive]}
                  onPress={() => {
                    landAnim.setValue(0);
                    setCurrentCountry(prev => prev === c ? null : c);
                    Animated.spring(landAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
                    setShowFootprints(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.fpCellFlag}>{countryFlag(c)}</Text>
                  <Text style={s.fpCellName} numberOfLines={1}>{countryName(c) || c}</Text>
                  <TouchableOpacity
                    style={s.fpCellRemove}
                    onPress={() => toggleSaveCountry(c)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={s.fpCellRemoveTxt}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#000' },
  list:     { paddingBottom: 100 },

  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title:    { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  postBtn:  { backgroundColor: '#6C47FF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  postBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabs:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, backgroundColor: '#111', borderRadius: 14, padding: 3 },
  tab:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12 },
  tabActive:    { backgroundColor: '#1e1e1e' },
  tabTxt:       { color: '#555', fontSize: 14, fontWeight: '700' },
  tabTxtActive: { color: '#fff' },

  // Bond feed country filter chip
  bondFilterChip:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginTop: 2, marginBottom: 8, backgroundColor: '#6C47FF22', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#6C47FF55', alignSelf: 'flex-start' },
  bondFilterFlag:  { fontSize: 18 },
  bondFilterTxt:   { color: '#a78bfa', fontSize: 13, fontWeight: '800' },
  bondFilterX:     { color: '#6C47FF', fontSize: 14, fontWeight: '900', marginLeft: 4 },

  // Footprints trigger row
  footprintRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 8 },
  footprintBtn:        { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#1a1a1a', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2a2a2a' },
  footprintEmoji:      { fontSize: 16 },
  footprintLabel:      { color: '#fff', fontSize: 13, fontWeight: '800' },
  footprintBadge:      { backgroundColor: '#6C47FF', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  footprintBadgeTxt:   { color: '#fff', fontSize: 11, fontWeight: '900' },
  footprintActiveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#6C47FF18', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#6C47FF44', flex: 1 },
  footprintActiveFlag: { fontSize: 16 },
  footprintActiveName: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  footprintActiveClear:{ color: '#6C47FF', fontSize: 14, fontWeight: '700' },

  // Footprints bottom sheet
  fpOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  fpSheet:        { backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 44 },
  fpHandle:       { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 18 },
  fpTitle:        { color: '#fff', fontSize: 20, fontWeight: '900', paddingHorizontal: 20, marginBottom: 18, letterSpacing: -0.3 },
  fpGrid:         { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10 },
  fpCell:         { width: '22%', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 4, borderWidth: 1, borderColor: '#222' },
  fpCellActive:   { borderColor: '#6C47FF', backgroundColor: 'rgba(108,71,255,0.12)' },
  fpCellFlag:     { fontSize: 30, marginBottom: 6 },
  fpCellName:     { color: '#aaa', fontSize: 10, textAlign: 'center', fontWeight: '700' },
  fpCellRemove:   { position: 'absolute', top: 5, right: 6 },
  fpCellRemoveTxt:{ color: '#444', fontSize: 11, fontWeight: '800' },

  // Globe teleport
  globePrompt:    { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 10 },
  globeEmoji:     { fontSize: 72 },
  globeTitle:     { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  globeSub:       { color: '#555', fontSize: 13, textAlign: 'center' },
  teleportBtn:    { marginTop: 8, backgroundColor: '#6C47FF', borderRadius: 24, paddingHorizontal: 28, paddingVertical: 16, shadowColor: '#6C47FF', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  teleportBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // Country landing banner
  landingBanner:  { marginHorizontal: 16, marginTop: 12, marginBottom: 4, backgroundColor: '#111', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#222', gap: 12 },
  landingTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  landingFlag:    { fontSize: 40 },
  landingLabel:   { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  landingCountry: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },
  nextBtn:        { backgroundColor: '#1e1e1e', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  nextBtnTxt:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  followCountryBtn:    { backgroundColor: '#6C47FF18', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: '#6C47FF44' },
  followCountryBtnOn:  { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  followCountryTxt:    { color: '#6C47FF', fontSize: 14, fontWeight: '800' },
  followCountryTxtOn:  { color: '#fff' },
  plantedRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  plantedIcon: { fontSize: 12 },
  plantedCount:{ color: '#888', fontSize: 11, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#111' },

  momentSection: { paddingVertical: 14 },
  momentRow:     { paddingHorizontal: 14, gap: 12 },

  heartBurst: { position: 'absolute', alignSelf: 'center', top: '35%', fontSize: 90 },

  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyIcon:  { fontSize: 52 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptySub:   { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn:   { backgroundColor: '#6C47FF', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, marginTop: 6 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700' },
});

// PhotoCard styles
const pc = StyleSheet.create({
  card:     { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#111' },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  av:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avTxt:    { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  mood:     { position: 'absolute', bottom: -2, right: -2, fontSize: 13 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flag:     { fontSize: 15 },
  username: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sub:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  country:  { color: '#666', fontSize: 11 },
  sep:      { color: '#444', fontSize: 11 },
  time:     { color: '#444', fontSize: 11 },
  followBtn:  { borderWidth: 1, borderColor: '#6C47FF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  followBtnOn:{ backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  followTxt:  { color: '#6C47FF', fontSize: 12, fontWeight: '700' },
  followTxtOn:{ color: '#fff' },
  img:      { width, aspectRatio: 1, backgroundColor: '#111' },
  countryBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  countryBadgeFlag: { fontSize: 16 },
  countryBadgeName: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actions:    { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 18 },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon: { fontSize: 24 },
  actionCount:{ color: '#888', fontSize: 13, fontWeight: '600' },
  liked:       { color: '#e91e63' },
  likedCount:  { color: '#e91e63' },
  echoed:      { },
  echoedCount: { color: '#6C47FF' },
  likes:    { color: '#fff', fontSize: 13, fontWeight: '700', paddingHorizontal: 14, marginBottom: 2 },
  echos:    { color: '#6C47FF', fontSize: 13, fontWeight: '700', paddingHorizontal: 14, marginBottom: 4 },
  captionRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 14, marginBottom: 4, flexWrap: 'wrap' },
  captionUser:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  caption:  { color: '#ccc', fontSize: 13, flex: 1, flexWrap: 'wrap' },
  commentPrev: { paddingHorizontal: 14, paddingBottom: 10, gap: 2 },
  viewAll:  { color: '#555', fontSize: 12, marginBottom: 2 },
  prevUser: { color: '#fff', fontWeight: '700', fontSize: 12 },
  prevTxt:  { color: '#666', fontSize: 12, flex: 1 },
});

// Comments modal
const cm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:   { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 8 },
  handle:  { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 12 },
  title:   { color: '#fff', fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 },
  empty:   { color: '#555', textAlign: 'center', paddingVertical: 30 },
  row:     { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  av:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avTxt:   { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  user:    { color: '#fff', fontWeight: '700', fontSize: 12 },
  time:    { color: '#444', fontSize: 10 },
  txt:     { color: '#ccc', fontSize: 13, lineHeight: 18 },
  inputRow:{ flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#1a1a1a', gap: 8 },
  input:   { flex: 1, backgroundColor: '#000', color: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 80 },
  send:    { backgroundColor: '#6C47FF', borderRadius: 20, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  sendOff: { backgroundColor: '#222' },
  sendTxt: { color: '#fff', fontSize: 16 },
});

// Upload modal
const up = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:   { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  handle:  { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:   { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 14 },

  audienceRow:  { marginBottom: 16, gap: 8 },
  audienceLabel:{ color: '#888', fontSize: 13, fontWeight: '600' },
  audiencePills:{ flexDirection: 'row', gap: 10 },
  audiencePill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#222' },
  audiencePillActive: { borderColor: '#6C47FF', backgroundColor: '#6C47FF18' },
  audiencePillIcon:   { fontSize: 18 },
  audiencePillTxt:    { color: '#555', fontSize: 13, fontWeight: '700' },
  audiencePillTxtActive: { color: '#6C47FF' },
  audienceHint: { color: '#444', fontSize: 11, textAlign: 'center' },

  picks:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
  pick:    { flex: 1, backgroundColor: '#000', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#1e1e1e' },
  pickIcon:{ fontSize: 32 },
  pickTxt: { color: '#888', fontSize: 13 },
  preview: { width: '100%', height: 220, borderRadius: 16 },
  caption: { backgroundColor: '#000', color: '#fff', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 60, borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 14, marginTop: 12 },
  btn:     { backgroundColor: '#6C47FF', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff:  { backgroundColor: '#222' },
  btnTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ─── Bond Footprint Banner styles ─────────────────────────────────────────────
const fp = StyleSheet.create({
  wrap:        { marginHorizontal: 14, marginTop: 14, marginBottom: 6 },
  card:        { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#6C47FF44', overflow: 'hidden' },
  glowOrb:     { position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: '#6C47FF', },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  titleGroup:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  globe:       { fontSize: 28 },
  cardTitle:   { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  cardSub:     { color: 'rgba(108,71,255,0.8)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  explorePill: { backgroundColor: 'rgba(108,71,255,0.2)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(108,71,255,0.4)' },
  exploreTxt:  { color: '#a78bfa', fontSize: 12, fontWeight: '800' },
  statsRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 6, marginBottom: 16, gap: 4 },
  stat:        { flex: 1, alignItems: 'center', gap: 2 },
  statNum:     { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel:   { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv:     { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },
  flagGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flagItem:    { fontSize: 26, lineHeight: 32 },
  flagMore:    { backgroundColor: 'rgba(108,71,255,0.25)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center', alignItems: 'center' },
  flagMoreTxt: { color: '#a78bfa', fontSize: 11, fontWeight: '800' },
  emptyHint:   { color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
});

// ─── Moment Ring styles ────────────────────────────────────────────────────────
const mr = StyleSheet.create({
  item:      { alignItems: 'center', gap: 6, width: 72 },
  addRing:   { width: 62, height: 62, borderRadius: 31, borderWidth: 1.5, borderColor: '#6C47FF88', borderStyle: 'dashed', overflow: 'hidden' },
  addInner:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addPlus:   { color: '#6C47FF', fontSize: 30, fontWeight: '200' },
  ringWrap:  { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  outerGlow: { position: 'absolute', width: 62, height: 62, borderRadius: 31, borderWidth: 2 },
  ring:      { width: 58, height: 58, borderRadius: 29, backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  flagBig:   { fontSize: 28 },
  initBadge: { position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#000' },
  initTxt:   { color: '#fff', fontSize: 9, fontWeight: '900' },
  label:     { color: '#666', fontSize: 10, fontWeight: '600', textAlign: 'center', maxWidth: 64 },
});

// ─── Bond Footprint Sheet styles ──────────────────────────────────────────────
const bfs = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#0c0c1e', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 44 },
  handle:         { width: 44, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 4 },
  header:         { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 14 },
  title:          { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  sub:            { color: 'rgba(108,71,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  activeChip:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 10, backgroundColor: '#6C47FF22', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#6C47FF55' },
  activeChipFlag: { fontSize: 18 },
  activeChipTxt:  { color: '#a78bfa', fontSize: 13, fontWeight: '700', flex: 1 },
  activeChipX:    { color: '#6C47FF', fontSize: 12, fontWeight: '800' },
  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: '#111' },
  rowActive:      { backgroundColor: '#6C47FF12' },
  rowFlag:        { fontSize: 34, width: 42, textAlign: 'center' },
  rowInfo:        { flex: 1, gap: 6 },
  rowName:        { color: '#fff', fontSize: 15, fontWeight: '800' },
  rowNameActive:  { color: '#a78bfa' },
  avatarRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatar:         { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#000' },
  avatarTxt:      { color: '#fff', fontSize: 9, fontWeight: '900' },
  avatarMore:     { color: '#555', fontSize: 10, fontWeight: '700', marginLeft: 2 },
  rowRight:       { alignItems: 'center', gap: 2, minWidth: 40 },
  rowCount:       { color: '#fff', fontSize: 18, fontWeight: '900' },
  rowCountActive: { color: '#a78bfa' },
  rowCountLabel:  { color: '#555', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  rowChevron:     { color: '#333', fontSize: 22, fontWeight: '300' },
  empty:          { alignItems: 'center', paddingVertical: 50, gap: 14 },
  emptyIcon:      { fontSize: 54 },
  emptyTxt:       { color: '#444', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});

// ─── Bond Trail Card styles ────────────────────────────────────────────────────
const bt = StyleSheet.create({
  card:        { flexDirection: 'row', marginHorizontal: 14, marginBottom: 20 },
  thread:      { width: 3, borderRadius: 3, marginRight: 12, minHeight: '100%' },
  inner:       { flex: 1, backgroundColor: '#0d0d0d', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#1a1a1a' },
  header:      { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  av:          { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avTxt:       { color: '#fff', fontWeight: '900', fontSize: 16 },
  mood:        { position: 'absolute', bottom: -2, right: -2, fontSize: 12 },
  uname:       { color: '#fff', fontWeight: '800', fontSize: 13 },
  meta:        { color: '#555', fontSize: 11, marginTop: 2 },
  bondBtn:     { borderWidth: 1, borderColor: '#333', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  bondBtnTxt:  { color: '#555', fontSize: 11, fontWeight: '700' },
  photoRow:    { flexDirection: 'row' },
  photoWrap:   { position: 'relative', overflow: 'hidden' },
  photo:       { backgroundColor: '#111' },
  photoGrad:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, paddingHorizontal: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  photoFlag:   { fontSize: 18 },
  photoCountry:{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },
  actionsRail: { width: 52, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16 },
  railBtn:     { alignItems: 'center', gap: 3 },
  railIcon:    { fontSize: 20 },
  railCount:   { color: '#666', fontSize: 11, fontWeight: '700' },
  heartBurst:  { position: 'absolute', alignSelf: 'center', top: '30%', fontSize: 72 },
  captionWrap: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, flexWrap: 'wrap' },
  captionUser: { color: '#fff', fontWeight: '800', fontSize: 12 },
  captionTxt:  { color: '#888', fontSize: 12, flex: 1, flexWrap: 'wrap' },
  commentHint: { paddingHorizontal: 12, paddingBottom: 10 },
  commentHintTxt: { color: '#555', fontSize: 11 },
});
