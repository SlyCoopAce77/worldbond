import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, ScrollView,
  TouchableOpacity, TextInput, Modal, KeyboardAvoidingView,
  Platform, Animated, Alert, ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import Geolocation from '@react-native-community/geolocation';
import { getSocket, SERVER_URL } from '../services/socket';
import { WORLD_COUNTRIES, getCountryFlag } from '../utils/countryUtils';
import { getAccessToken } from '../services/authApi';
import { stringToColor, timeAgo } from '../utils/apiUtils';
import FilteredImage from '../components/FilteredImage';
import FilterPicker from '../components/FilterPicker';
import StoryViewer from '../components/StoryViewer';
import { WorldMark } from '../components/BondLogo';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countryFlag(str = '') { return getCountryFlag(str) || '🌍'; }

function countryName(str = '') {
  return str.replace(/\p{Regional_Indicator}{2}/u, '').trim() || str;
}

function scorePost(p) {
  const ageHours = (Date.now() - (p.createdAt || 0)) / 3600000;
  const decay = Math.exp(-ageHours / 36); // half-life ~25h
  const engagement = (p.likes?.length || 0) * 3 + (p.echos?.length || 0) * 5 + (p.comments?.length || 0) * 2;
  return decay * (1 + engagement * 0.15);
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
  return <Animated.Text style={[s.heartBurst, { transform: [{ scale }], opacity }]}>👣</Animated.Text>;
}


// ─── World Entry Card ─────────────────────────────────────────────────────────

function WorldEntryCard({ photo, user, onComment, onProfile, onFollow, followingIds, isActiveVideo }) {
  const socket = getSocket();
  const myUid = user?.userId || socket.id;
  const [marked,     setMarked]    = useState(photo.likes?.some(l => l.userId === myUid));
  const [markCount,  setMarkCount] = useState(photo.likes?.length || 0);
  const [echoed,     setEchoed]    = useState(photo.echos?.some(e => e.userId === myUid));
  const [echoCount,  setEchoCount] = useState(photo.echos?.length || 0);
  const [showStamp,  setShowStamp] = useState(false);
  const lastTap = useRef(0);
  const authorColor = stringToColor(photo.username);
  const cardInnerW = width - 14 - 14 - 28 - 10; // marginH:14×2 + stampContainer:28 + gap:10
  const photoH = (cardInnerW * 3) / 4;

  useEffect(() => {
    setMarked(photo.likes?.some(l => l.userId === myUid));
    setMarkCount(photo.likes?.length || 0);
    setEchoed(photo.echos?.some(e => e.userId === myUid));
    setEchoCount(photo.echos?.length || 0);
  }, [photo.likes, photo.echos]);

  function toggleMark() {
    socket.emit('like_photo', { photoId: photo.id });
    setMarked(m => !m);
    setMarkCount(c => marked ? c - 1 : c + 1);
  }

  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!marked) { toggleMark(); setShowStamp(true); setTimeout(() => setShowStamp(false), 900); }
    }
    lastTap.current = now;
  }

  const isOwn      = photo.userId === myUid;
  const lastComment = photo.comments?.length > 0
    ? photo.comments[photo.comments.length - 1]
    : null;

  return (
    <View style={we.card}>

      {/* Echo attribution — "[name] echoed" above the thread */}
      {!!photo._echoAttrib && (
        <View style={we.echoAttrib}>
          <Text style={we.echoAttribIcon}>🔊</Text>
          <Text style={we.echoAttribTxt}>{photo._echoAttrib} echoed</Text>
        </View>
      )}

      {/* Stamp thread */}
      <View style={we.threadRow}>
        <View style={we.threadContainer}>
          <View style={[we.threadLine, { backgroundColor: authorColor + '88' }]} />
          <View style={[we.stampCircle, { borderColor: authorColor, backgroundColor: authorColor + '18' }]}>
            <WorldMark size={12} color={authorColor} bondColor={authorColor} />
          </View>
          <View style={[we.threadLine, { backgroundColor: authorColor }]} />
        </View>

        <View style={we.inner}>

          {/* Photo/Video — 4:3 editorial ratio */}
          <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={we.photoWrap}>
            {photo.imageUrl ? (
              photo.mediaType === 'video' ? (
                <Video
                  source={{ uri: photo.imageUrl }}
                  style={{ width: cardInnerW, height: photoH }}
                  muted
                  repeat
                  paused={!isActiveVideo}
                  resizeMode="cover"
                  playInBackground={false}
                  playWhenInactive={false}
                />
              ) : (
                <FilteredImage
                  uri={photo.imageUrl}
                  filterId={photo.filter || 'normal'}
                  style={{ width: cardInnerW, height: photoH }}
                  resizeMode="cover"
                />
              )
            ) : (
              <View style={[we.photoEmpty, { width: cardInnerW, height: photoH }]}>
                <Text style={we.photoEmptyFlag}>{countryFlag(photo.country)}</Text>
              </View>
            )}

            {photo.mediaType === 'video' && !isActiveVideo && (
              <View style={we.videoBadge}>
                <Text style={we.videoBadgeTxt}>▶</Text>
              </View>
            )}

            <HeartBurst visible={showStamp} />

            {/* Passport-style location stamp */}
            <View style={we.locationStamp}>
              <Text style={we.locationFlag}>{countryFlag(photo.country)}</Text>
              <View>
                <Text style={we.locationCountry}>{countryName(photo.country).toUpperCase()}</Text>
                <Text style={we.locationTime}>{timeAgo(photo.createdAt)}</Text>
              </View>
            </View>

            {/* Pin — where photo was actually taken (if different from home) */}
            {photo.postCountry && photo.postCountry !== photo.country && (
              <View style={we.pinStamp}>
                <Text style={we.pinIcon}>📍</Text>
                <Text style={we.pinTxt}>{countryName(photo.postCountry)}</Text>
              </View>
            )}

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.82)']}
              style={we.photoGrad}
            />
          </TouchableOpacity>

          {/* Entry body */}
          <View style={we.body}>

            {/* Author row */}
            <TouchableOpacity style={we.authorRow} onPress={() => onProfile(photo)} activeOpacity={0.8}>
              <View style={[we.avatar, { backgroundColor: authorColor }]}>
                <Text style={we.avatarTxt}>{(photo.username?.[0] ?? '?').toUpperCase()}</Text>
                {photo.mood && <Text style={we.mood}>{photo.mood}</Text>}
              </View>
              <Text style={we.username}>{photo.username}</Text>
              <View style={{ flex: 1 }} />
              {isOwn && (
                <TouchableOpacity onPress={() =>
                  Alert.alert('Delete Entry', 'Remove this world entry?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => socket.emit('delete_photo', { photoId: photo.id }) },
                  ])
                }>
                  <Text style={we.dots}>⋯</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Blog-style entry caption */}
            {!!photo.caption && (
              <Text style={we.entryText}>{photo.caption}</Text>
            )}

            {/* Action bar: Mark · Notes · Echo */}
            <View style={we.actionsBar}>
              <TouchableOpacity style={we.actionBtn} onPress={toggleMark}>
                <Text style={we.actionIcon}>👣</Text>
                <Text style={[we.actionLbl, marked && we.markedLbl]}>
                  {markCount > 0 ? `${markCount} ` : ''}Mark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={we.actionBtn} onPress={() => onComment(photo)}>
                <Text style={we.actionIcon}>💬</Text>
                <Text style={we.actionLbl}>
                  {photo.comments?.length > 0 ? `${photo.comments.length} ` : ''}Notes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={we.actionBtn}
                onPress={() => {
                  socket.emit('echo_photo', { photoId: photo.id });
                  setEchoed(e => !e);
                  setEchoCount(c => echoed ? c - 1 : c + 1);
                }}
              >
                <Text style={we.actionIcon}>🔊</Text>
                <Text style={[we.actionLbl, echoed && we.echoedLbl]}>
                  {echoCount > 0 ? `${echoCount} ` : ''}Echo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Latest note preview */}
            {lastComment && (
              <TouchableOpacity onPress={() => onComment(photo)} style={we.notesPrev}>
                {photo.comments.length > 1 && (
                  <Text style={we.notesAll}>Read all {photo.comments.length} notes</Text>
                )}
                <View style={we.noteRow}>
                  <Text style={we.noteUser}>{lastComment.username}</Text>
                  <Text style={we.noteTxt} numberOfLines={2}> {lastComment.text}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>

      <View style={we.divider} />
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
          <Text style={cm.title}>Notes</Text>
          <FlatList
            data={photo.comments || []}
            keyExtractor={c => String(c.id)}
            style={{ maxHeight: 340 }}
            ListEmptyComponent={<Text style={cm.empty}>No notes yet — be first!</Text>}
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
              placeholder="Leave a note…"
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
  const [imageUri,     setImageUri]     = useState(null);
  const [caption,      setCaption]      = useState('');
  const [filter,       setFilter]       = useState('normal');
  const [uploading,    setUploading]    = useState(false);
  const [audience,     setAudience]     = useState('world'); // 'world' | 'bonds'
  const [isVideo,      setIsVideo]      = useState(false);
  const [postCountry,  setPostCountry]  = useState(null);
  const [locDetecting, setLocDetecting] = useState(false);
  const isStory = mode === 'story';

  function reset() {
    setImageUri(null); setCaption(''); setFilter('normal');
    setUploading(false); setAudience('world'); setIsVideo(false);
    setPostCountry(null);
  }

  useEffect(() => {
    if (!visible) return;
    setPostCountry(null);
    setLocDetecting(true);
    Geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          .then(r => r.json())
          .then(data => {
            if (data.countryCode) {
              const flag = countryFlag(data.countryCode);
              setPostCountry(`${flag} ${data.countryName}`);
            }
          })
          .catch(() => {})
          .finally(() => setLocDetecting(false));
      },
      () => setLocDetecting(false),
      { timeout: 6000, enableHighAccuracy: false }
    );
  }, [visible]);

  function pick(cam, video = false) {
    const fn = cam ? launchCamera : launchImageLibrary;
    fn(
      video
        ? { mediaType: 'video', videoQuality: 'high', durationLimit: 60 }
        : { mediaType: 'mixed', quality: 0.7, maxWidth: 1080, maxHeight: 1080 },
      r => {
        if (!r.didCancel && r.assets?.[0]) {
          const asset = r.assets[0];
          setImageUri(asset.uri);
          setIsVideo(video || asset.type?.startsWith('video') || false);
        }
      }
    );
  }

  async function upload() {
    if (!imageUri) return;
    setUploading(true);
    try {
      const token = await getAccessToken();
      const fd = new FormData();
      fd.append('photo', isVideo
        ? { uri: imageUri, type: 'video/mp4', name: 'media.mp4' }
        : { uri: imageUri, type: 'image/jpeg', name: 'photo.jpg' }
      );
      fd.append('mediaType', isVideo ? 'video' : 'image');
      if (postCountry) fd.append('postCountry', postCountry);
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
          <Text style={up.title}>{isStory ? 'New Story ✨' : 'New World Entry ✦'}</Text>
          <View style={up.locRow}>
            {locDetecting ? (
              <ActivityIndicator size="small" color="#6C47FF" />
            ) : (
              <Text style={up.locTxt}>
                {postCountry
                  ? `📍 Posting from ${countryName(postCountry)}`
                  : `📍 ${countryName(user?.country || '')} (home)`}
              </Text>
            )}
          </View>

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

          {/* Media picker */}
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
              <TouchableOpacity style={up.pick} onPress={() => pick(true, true)}>
                <Text style={up.pickIcon}>🎬</Text>
                <Text style={up.pickTxt}>Record</Text>
              </TouchableOpacity>
            </View>
          ) : isVideo ? (
            <View style={[up.preview, up.videoPrev]}>
              <Text style={up.videoIcon}>🎬</Text>
              <Text style={up.videoReady}>Video ready</Text>
              <TouchableOpacity onPress={() => pick(true, true)} style={{ marginTop: 6 }}>
                <Text style={up.reRecordTxt}>Re-record</Text>
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

          {imageUri && !isVideo && <FilterPicker imageUri={imageUri} selectedFilter={filter} onSelect={setFilter} />}

          <TextInput
            style={up.caption}
            placeholder={isStory ? 'Add a caption…' : 'Write your entry…'}
            placeholderTextColor="#444"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[up.btn, (!imageUri || uploading) && up.btnOff]}
            onPress={upload}
            disabled={!imageUri || uploading}
            activeOpacity={0.85}
          >
            {uploading
              ? <ActivityIndicator color="#fff" />
              : <Text style={up.btnTxt}>
                  {isStory
                    ? (audience === 'bonds' ? 'Share to Bonds 🫂' : 'Share to World 🌍')
                    : 'Post Entry ✦'}
                </Text>
            }
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}


// ─── Moment Ring (story bubble) ───────────────────────────────────────────────

function MomentRing({ isSelf, group, viewCount = 0, onPress }) {
  const color   = stringToColor(group?.username || '?');
  const flag    = countryFlag(group?.country || '');
  const initial = (group?.username?.[0] ?? '?').toUpperCase();

  if (isSelf) {
    return (
      <TouchableOpacity style={mr.item} onPress={onPress} activeOpacity={0.8}>
        <View style={[mr.addRing, { backgroundColor: color + '11' }]}>
          <View style={mr.addInner}>
            <Text style={mr.addPlus}>+</Text>
          </View>
        </View>
        <Text style={mr.label} numberOfLines={1}>Your Story</Text>
        {viewCount > 0 && (
          <View style={mr.viewRow}>
            <Text style={mr.viewCount}>{viewCount} 👁</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={mr.item} onPress={onPress} activeOpacity={0.8}>
      <View style={mr.ringWrap}>
        <View style={[mr.outerGlow, { borderColor: color }]} />
        <View style={mr.ring}>
          <Text style={mr.flagBig}>{flag}</Text>
        </View>
        <View style={[mr.initBadge, { backgroundColor: color }]}>
          <Text style={mr.initTxt}>{initial}</Text>
        </View>
      </View>
      <Text style={mr.label} numberOfLines={1}>{group?.username || ''}</Text>
    </TouchableOpacity>
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

  const [photos,            setPhotos]           = useState([]);
  const [stories,           setStories]          = useState([]);
  const [tab,               setTab]              = useState('world');
  const [showFootprints,    setShowFootprints]    = useState(false);
  const [showUpload,        setShowUpload]        = useState(false);
  const [uploadMode,        setUploadMode]        = useState('photo');
  const [commentPhoto,      setCommentPhoto]      = useState(null);
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
  const [followingIds,      setFollowingIds]      = useState([]);
  const [savedCountries,    setSavedCountries]    = useState([]);
  const [currentCountry,    setCurrentCountry]    = useState(null);
  const [countryFlagCounts, setCountryFlagCounts] = useState({});   // country -> planted count
  const [bondCountryFilter, setBondCountryFilter] = useState(null);
  const [refreshing,        setRefreshing]        = useState(false);
  const [activeVideoId,     setActiveVideoId]     = useState(null);
  const globeAnim  = useRef(new Animated.Value(1)).current;
  const landAnim   = useRef(new Animated.Value(0)).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const socket = getSocket();

  // Load saved countries and re-plant flags on server after connect
  useEffect(() => {
    AsyncStorage.getItem('bond_saved_countries').then(raw => {
      // Pre-seed demo countries on first run so the Events "Following Live" feature is visible
      const countries = raw ? JSON.parse(raw) : ['🇺🇸', '🇬🇧', '🇰🇷'];
      setSavedCountries(countries);
      const plant = () => countries.forEach(c => socket.emit('plant_flag', { country: c }));
      if (socket.connected) plant(); else socket.once('connect', plant);
      if (!raw) AsyncStorage.setItem('bond_saved_countries', JSON.stringify(countries));
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

    socket.on('photos_feed', data => { setPhotos(data); setRefreshing(false); });
    socket.on('new_photo',     p  => setPhotos(prev => [p, ...prev]));
    socket.on('photo_updated', up => {
      setPhotos(prev => prev.map(p => p.id === up.id ? up : p));
      setCommentPhoto(cp => cp?.id === up.id ? up : cp);
    });
    socket.on('stories_updated', setStories);
    socket.on('following_list',  ({ following }) => setFollowingIds(following));
    socket.on('follow_status', ({ targetUserId, following }) => {
      setFollowingIds(prev =>
        following ? [...new Set([...prev, targetUserId])] : prev.filter(id => id !== targetUserId)
      );
      if (following) socket.emit('get_photos'); // pull new bond's posts into feed
    });
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

  const worldPhotos = useMemo(() => {
    const filtered = currentCountry
      ? photos.filter(p => p.country === currentCountry || p.postCountry === currentCountry)
      : photos;
    return [...filtered].sort((a, b) => scorePost(b) - scorePost(a));
  }, [photos, currentCountry]);

  const myUserId = user?.userId || socket.id;

  const myStoryViewCount = useMemo(() => {
    const myGroup = stories.find(g => g.userId === myUserId);
    if (!myGroup?.stories?.length) return 0;
    const viewers = new Set();
    myGroup.stories.forEach(s => {
      (s.viewers || []).forEach(v => viewers.add(typeof v === 'string' ? v : v.userId));
      if (s.viewedBy) viewers.add(s.viewedBy);
    });
    return viewers.size;
  }, [stories]);

  const realBondPhotos = useMemo(() =>
    photos
      .filter(p =>
        followingIds.includes(p.userId) ||
        p.userId === myUserId ||
        p.echos?.some(e => followingIds.includes(e.userId))
      )
      .map(p => {
        const isDirectFollow = followingIds.includes(p.userId) || p.userId === myUserId;
        if (isDirectFollow) return p;
        const echoer = p.echos?.find(e => followingIds.includes(e.userId));
        return { ...p, _echoAttrib: echoer?.username || 'A bond' };
      })
  , [photos, followingIds, myUserId]);

  // Show demo data when no real bonds exist yet so the footprint is visible
  const isDemoMode = realBondPhotos.length === 0 && followingIds.length === 0;
  const allBondPhotos = isDemoMode ? DEMO_PHOTOS : realBondPhotos;


  const bondPhotos = useMemo(() =>
    bondCountryFilter
      ? allBondPhotos.filter(p => p.country === bondCountryFilter)
      : allBondPhotos
  , [allBondPhotos, bondCountryFilter]);

  // Stories filtered by audience for bonds tab
  const bondsStories = useMemo(() =>
    stories.filter(g => {
      const isOwn = g.userId === myUserId;
      const isBonded = followingIds.includes(g.userId);
      return isOwn || isBonded;
    })
  , [stories, followingIds, myUserId]);

  function teleport() {
    Animated.sequence([
      Animated.timing(globeAnim, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(globeAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(globeAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    const options = WORLD_COUNTRIES.filter(c => c !== currentCountry);
    const pick = options[Math.floor(Math.random() * options.length)];
    landAnim.setValue(0);
    setCurrentCountry(pick);
    socket.emit('get_country_flag_count', { country: pick });
    Animated.spring(landAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
  }

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

  function onRefresh() {
    setRefreshing(true);
    socket.emit('get_photos');
    socket.emit('get_stories');
  }

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const first = viewableItems.find(v => v.item?.mediaType === 'video');
    setActiveVideoId(first?.item?.id ?? null);
  }, []);

  const countryFilterHeader = (
    <View>

      {/* ── Quick-access row: Mine + Footprints ── */}
      <View style={s.footprintRow}>
        {user?.country && (
          <TouchableOpacity
            style={[s.mineBtn, currentCountry === user.country && s.mineBtnOn]}
            onPress={() => {
              const next = currentCountry === user.country ? null : user.country;
              setCurrentCountry(next);
              if (next) {
                landAnim.setValue(0);
                Animated.spring(landAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
                socket.emit('get_country_flag_count', { country: next });
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={s.mineFlag}>{countryFlag(user.country)}</Text>
            <Text style={[s.mineTxt, currentCountry === user.country && s.mineTxtOn]}>Mine</Text>
          </TouchableOpacity>
        )}
        {savedCountries.length > 0 && (
          <TouchableOpacity style={s.footprintBtn} onPress={() => setShowFootprints(true)} activeOpacity={0.8}>
            <Text style={s.footprintEmoji}>👣</Text>
            <Text style={s.footprintLabel}>Footprints</Text>
            <View style={s.footprintBadge}>
              <Text style={s.footprintBadgeTxt}>{savedCountries.length}</Text>
            </View>
          </TouchableOpacity>
        )}
        {currentCountry && currentCountry !== user?.country && savedCountries.includes(currentCountry) && (
          <TouchableOpacity style={s.footprintActiveChip} onPress={() => setCurrentCountry(null)} activeOpacity={0.8}>
            <Text style={s.footprintActiveFlag}>{countryFlag(currentCountry)}</Text>
            <Text style={s.footprintActiveName} numberOfLines={1}>{countryName(currentCountry) || currentCountry}</Text>
            <Text style={s.footprintActiveClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Globe teleport OR landing banner ── */}
      {!currentCountry ? (
        <View style={s.globePrompt}>
          <Animated.Text style={[s.globeEmoji, { transform: [{ scale: globeAnim }] }]}>🌍</Animated.Text>
          <Text style={s.globeTitle}>Explore the world</Text>
          <Text style={s.globeSub}>
            {countries.length > 0
              ? `${countries.length} countries posting right now`
              : 'Be the first to post from your country!'}
          </Text>
          {user?.country && (
            <TouchableOpacity
              style={s.minePromptBtn}
              onPress={() => {
                setCurrentCountry(user.country);
                landAnim.setValue(0);
                Animated.spring(landAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
                socket.emit('get_country_flag_count', { country: user.country });
              }}
              activeOpacity={0.85}
            >
              <Text style={s.minePromptFlag}>{countryFlag(user.country)}</Text>
              <Text style={s.minePromptTxt}>See my country</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.teleportBtn} onPress={teleport} activeOpacity={0.85}>
            <Text style={s.teleportBtnTxt}>🌍  Take me somewhere</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={[s.landingBanner, {
          opacity: landAnim,
          transform: [{ translateY: landAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <View style={s.landingTop}>
            <Text style={s.landingFlag}>{countryFlag(currentCountry)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.landingLabel}>
                {currentCountry === user?.country ? 'Your country' : 'You landed in'}
              </Text>
              <Text style={s.landingCountry}>{countryName(currentCountry) || currentCountry}</Text>
              <View style={s.plantedRow}>
                <Text style={s.plantedIcon}>📍</Text>
                <Text style={s.plantedCount}>
                  {(countryFlagCounts[currentCountry] || 0).toLocaleString()} planted
                </Text>
              </View>
            </View>
            {currentCountry !== user?.country && (
              <TouchableOpacity style={s.nextBtn} onPress={teleport} activeOpacity={0.8}>
                <Text style={s.nextBtnTxt}>Next 🌍</Text>
              </TouchableOpacity>
            )}
          </View>
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
      {/* Snap-style story rings */}
      <View style={s.snapRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.snapContent}
        >
          <MomentRing
            isSelf
            group={{ username: user?.username, country: user?.country }}
            viewCount={myStoryViewCount}
            onPress={() => { setUploadMode('story'); setShowUpload(true); }}
          />
          {bondsStories.map(g => (
            <MomentRing
              key={g.userId}
              group={g}
              onPress={() => setViewingStoryGroup(g)}
            />
          ))}
        </ScrollView>
      </View>

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <WorldMark
                size={15}
                color={tab === 'bonds' ? '#fff' : '#555'}
                bondColor={tab === 'bonds' ? '#6C47FF' : '#444'}
              />
              <Text style={[s.tabTxt, tab === 'bonds' && s.tabTxtActive]}>Bonds</Text>
            </View>
        </TouchableOpacity>
      </View>

      {/* ── Feed ── */}
      <FlatList
        key={tab}
        data={tab === 'world' ? worldPhotos : bondPhotos}
        keyExtractor={p => String(p.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C47FF"
            colors={['#6C47FF']}
          />
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          tab === 'world' ? countryFilterHeader : bondsHeader
        }
        ListEmptyComponent={
          <View style={s.empty}>
            {tab === 'world'
              ? <Text style={s.emptyIcon}>🌍</Text>
              : <WorldMark size={48} color="#555" bondColor="#6C47FF" />
            }
            <Text style={s.emptyTitle}>
              {tab === 'world' ? 'No entries yet' : 'No bond entries yet'}
            </Text>
            <Text style={s.emptySub}>
              {tab === 'world'
                ? 'Be the first to post a world entry from your corner of the globe!'
                : 'Bond with people to see their photos here'}
            </Text>
            {tab === 'world' && (
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => { setUploadMode('photo'); setShowUpload(true); }}
              >
                <Text style={s.emptyBtnTxt}>Post a World Entry</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <WorldEntryCard
            photo={item}
            user={user}
            onComment={setCommentPhoto}
            onProfile={openProfile}
            onFollow={handleFollow}
            followingIds={followingIds}
            isActiveVideo={activeVideoId === item.id}
          />
        )}
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

  // Footprints row
  footprintRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10, gap: 8 },
  footprintBtn:        { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#1a1a1a', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2a2a2a' },
  footprintEmoji:      { fontSize: 16 },
  footprintLabel:      { color: '#fff', fontSize: 13, fontWeight: '800' },
  footprintBadge:      { backgroundColor: '#6C47FF', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  footprintBadgeTxt:   { color: '#fff', fontSize: 11, fontWeight: '900' },
  footprintActiveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#6C47FF18', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#6C47FF44', flex: 1 },
  footprintActiveFlag: { fontSize: 16 },
  footprintActiveName: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  footprintActiveClear:{ color: '#6C47FF', fontSize: 14, fontWeight: '700' },

  // Mine button
  mineBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1a1a', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2a2a2a' },
  mineBtnOn:     { backgroundColor: 'rgba(108,71,255,0.15)', borderColor: '#6C47FF66' },
  mineFlag:      { fontSize: 16 },
  mineTxt:       { color: '#777', fontSize: 13, fontWeight: '700' },
  mineTxtOn:     { color: '#6C47FF' },

  // Globe teleport prompt
  globePrompt:    { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 8 },
  globeEmoji:     { fontSize: 52 },
  globeTitle:     { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  globeSub:       { color: '#555', fontSize: 13, textAlign: 'center' },
  minePromptBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: '#2a2a2a', marginTop: 6 },
  minePromptFlag: { fontSize: 18 },
  minePromptTxt:  { color: '#aaa', fontSize: 14, fontWeight: '700' },
  teleportBtn:    { backgroundColor: '#6C47FF', borderRadius: 26, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  teleportBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },

  // Landing banner
  landingBanner:      { marginHorizontal: 14, marginBottom: 10, backgroundColor: '#111', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#222', gap: 12 },
  landingTop:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  landingFlag:        { fontSize: 44 },
  landingLabel:       { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  landingCountry:     { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 },
  nextBtn:            { backgroundColor: '#1a1a1a', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2a2a2a' },
  nextBtnTxt:         { color: '#fff', fontSize: 13, fontWeight: '800' },
  followCountryBtn:   { backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  followCountryBtnOn: { backgroundColor: 'rgba(108,71,255,0.15)', borderColor: '#6C47FF66' },
  followCountryTxt:   { color: '#666', fontSize: 14, fontWeight: '700' },
  followCountryTxtOn: { color: '#6C47FF' },
  plantedRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  plantedIcon:        { fontSize: 12 },
  plantedCount:       { color: '#555', fontSize: 11, fontWeight: '700' },

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

  divider: { height: 1, backgroundColor: '#111' },

  momentSection: { paddingVertical: 14 },
  momentRow:     { paddingHorizontal: 14, gap: 12 },
  snapRow:       { paddingVertical: 12, borderBottomWidth: 0 },
  snapContent:   { paddingHorizontal: 14, gap: 14 },

  heartBurst: { position: 'absolute', alignSelf: 'center', top: '35%', fontSize: 90 },

  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyIcon:  { fontSize: 52 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptySub:   { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn:   { backgroundColor: '#6C47FF', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, marginTop: 6 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '700' },
});

// ─── World Entry Card styles ──────────────────────────────────────────────────
const we = StyleSheet.create({
  card:             { marginBottom: 8 },

  // Thread row (Reddit-style with logo in gap)
  threadRow:        { flexDirection: 'row', alignItems: 'stretch', marginHorizontal: 14, marginBottom: 4 },
  threadContainer:  { width: 28, alignItems: 'center', marginRight: 10 },
  threadLine:       { flex: 1, width: 2, borderRadius: 2, minHeight: 16, alignSelf: 'center' },
  stampCircle:      { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  inner:            { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' },

  // Photo
  photoWrap:        { position: 'relative', overflow: 'hidden' },
  photoEmpty:       { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  photoEmptyFlag:   { fontSize: 72 },
  photoGrad:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 },
  videoBadge:       { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  videoBadgeTxt:    { fontSize: 13 },

  // Passport stamp overlay
  locationStamp:    { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.68)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  locationFlag:     { fontSize: 20 },
  locationCountry:  { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  locationTime:     { color: 'rgba(255,255,255,0.42)', fontSize: 9, fontWeight: '600', marginTop: 1 },
  pinStamp:         { position: 'absolute', bottom: 96, left: 14, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  pinIcon:          { fontSize: 11 },
  pinTxt:           { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Body
  body:             { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, gap: 10 },

  // Author
  authorRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:           { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:        { color: '#fff', fontWeight: '900', fontSize: 15 },
  mood:             { position: 'absolute', bottom: -2, right: -2, fontSize: 12 },
  username:         { color: '#fff', fontWeight: '800', fontSize: 14 },
  dots:             { color: '#444', fontSize: 18 },
  bondBtn:          { borderWidth: 1, borderColor: '#333', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  bondBtnOn:        { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  bondBtnTxt:       { color: '#777', fontSize: 12, fontWeight: '700' },
  bondBtnTxtOn:     { color: '#fff' },

  // Blog-style entry caption
  entryText:        { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 24, fontWeight: '400', letterSpacing: 0.1 },

  // Action bar
  actionsBar:       { flexDirection: 'row', alignItems: 'center', gap: 26, paddingTop: 2 },
  actionBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon:       { fontSize: 19 },
  actionLbl:        { color: '#555', fontSize: 13, fontWeight: '600' },
  markedLbl:        { color: '#FF0080' },
  echoedLbl:        { color: '#6C47FF' },

  // Notes preview
  notesPrev:        { paddingTop: 2, gap: 3 },
  notesAll:         { color: '#444', fontSize: 12, marginBottom: 2 },
  noteRow:          { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
  noteUser:         { color: '#fff', fontWeight: '700', fontSize: 13 },
  noteTxt:          { color: '#555', fontSize: 13, flex: 1 },

  divider:          { height: 1, backgroundColor: '#111', marginTop: 10 },

  // Echo attribution (Twitter-style "X reposted")
  echoAttrib:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 30, paddingRight: 16, paddingTop: 8, paddingBottom: 4 },
  echoAttribIcon: { fontSize: 13 },
  echoAttribTxt:  { color: '#6C47FF', fontSize: 12, fontWeight: '700' },
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
  title:   { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  locRow:  { flexDirection: 'row', alignItems: 'center', minHeight: 20, marginBottom: 14 },
  locTxt:  { color: '#555', fontSize: 12, fontWeight: '600' },

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
  preview:      { width: '100%', height: 220, borderRadius: 16 },
  videoPrev:    { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', marginBottom: 10 },
  videoIcon:    { fontSize: 52 },
  videoReady:   { color: '#aaa', fontSize: 14, fontWeight: '700', marginTop: 8 },
  reRecordTxt:  { color: '#6C47FF', fontSize: 13, fontWeight: '600' },
  caption: { backgroundColor: '#000', color: '#fff', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 60, borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 14, marginTop: 12 },
  btn:     { backgroundColor: '#6C47FF', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff:  { backgroundColor: '#222' },
  btnTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
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
  initBadge:    { position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#000' },
  initTxt:      { color: '#fff', fontSize: 9, fontWeight: '900' },
  label:        { color: '#666', fontSize: 10, fontWeight: '600', textAlign: 'center', maxWidth: 64 },
  viewRow:      { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  viewCount:    { color: '#6C47FF', fontSize: 9, fontWeight: '800' },
});


