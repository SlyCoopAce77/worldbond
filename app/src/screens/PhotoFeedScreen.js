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
import { WorldMark } from '../components/BondLogo';

const { width } = Dimensions.get('window');
const BOND_PINK = '#FF0080';

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

  const isOwn = photo.userId === myUid;

  function handleEcho() {
    socket.emit('echo_photo', { photoId: photo.id });
    setEchoed(e => !e);
    setEchoCount(c => echoed ? c - 1 : c + 1);
  }

  return (
    <View style={we.card}>

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

            {/* Caption — tap to open post detail */}
            {!!photo.caption && (
              <TouchableOpacity onPress={() => onComment(photo)} activeOpacity={0.85}>
                <Text style={we.entryText}>{photo.caption}</Text>
              </TouchableOpacity>
            )}

            {/* Twitter-style action bar */}
            <View style={we.actionsBar}>
              {/* Comment */}
              <TouchableOpacity style={we.actionBtn} onPress={() => onComment(photo)}>
                <Text style={we.actionIcon}>💬</Text>
                {photo.comments?.length > 0 && (
                  <Text style={we.actionCount}>{photo.comments.length}</Text>
                )}
              </TouchableOpacity>

              {/* Echo */}
              <TouchableOpacity style={we.actionBtn} onPress={handleEcho}>
                <Text style={[we.actionIcon, echoed ? we.echoedIcon : we.dimIcon]}>🔊</Text>
                {echoCount > 0 && (
                  <Text style={[we.actionCount, echoed && we.echoedCount]}>{echoCount}</Text>
                )}
              </TouchableOpacity>

              {/* Footprint / Like */}
              <TouchableOpacity style={we.actionBtn} onPress={toggleMark}>
                <Text style={[we.actionIcon, marked ? we.markedIcon : we.dimIcon]}>👣</Text>
                {markCount > 0 && (
                  <Text style={[we.actionCount, marked && we.markedCount]}>{markCount}</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>

        </View>
      </View>

      <View style={we.divider} />
    </View>
  );
}

// ─── Post Detail (Twitter-style post view + comments) ─────────────────────────

function PostDetailModal({ visible, photo, user, onClose }) {
  const socket = getSocket();
  const myUid  = user?.userId || socket.id;

  const [marked,    setMarked]    = useState(false);
  const [markCount, setMarkCount] = useState(0);
  const [echoed,    setEchoed]    = useState(false);
  const [echoCount, setEchoCount] = useState(0);
  const [text,      setText]      = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!photo) return;
    setMarked(photo.likes?.some(l => l.userId === myUid) ?? false);
    setMarkCount(photo.likes?.length ?? 0);
    setEchoed(photo.echos?.some(e => e.userId === myUid) ?? false);
    setEchoCount(photo.echos?.length ?? 0);
  }, [photo]);

  function toggleMark() {
    socket.emit('like_photo', { photoId: photo.id });
    setMarked(m => !m);
    setMarkCount(c => marked ? c - 1 : c + 1);
  }

  function toggleEcho() {
    socket.emit('echo_photo', { photoId: photo.id });
    setEchoed(e => !e);
    setEchoCount(c => echoed ? c - 1 : c + 1);
  }

  function submit() {
    if (!text.trim()) return;
    socket.emit('comment_photo', { photoId: photo.id, text: text.trim() });
    setText('');
  }

  if (!photo) return null;

  const authorColor = stringToColor(photo.username);
  const photoH     = (width * 3) / 4;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={pd.safe}>

        {/* Header */}
        <View style={pd.header}>
          <TouchableOpacity onPress={onClose} style={pd.backBtn} hitSlop={{ top: 8, bottom: 8, left: 16, right: 8 }}>
            <Text style={pd.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={pd.headerTitle}>Post</Text>
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <FlatList
            ref={scrollRef}
            data={photo.comments || []}
            keyExtractor={c => String(c.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListHeaderComponent={
              <View>
                {/* Photo */}
                {photo.imageUrl ? (
                  photo.mediaType === 'video' ? (
                    <View style={[pd.photoEmpty, { height: photoH }]}>
                      <Text style={pd.photoEmptyFlag}>▶</Text>
                    </View>
                  ) : (
                    <FilteredImage
                      uri={photo.imageUrl}
                      filterId={photo.filter || 'normal'}
                      style={{ width, height: photoH }}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <View style={[pd.photoEmpty, { height: photoH }]}>
                    <Text style={pd.photoEmptyFlag}>{countryFlag(photo.country)}</Text>
                  </View>
                )}

                <View style={pd.body}>
                  {/* Author */}
                  <View style={pd.authorRow}>
                    <View style={[pd.avatar, { backgroundColor: authorColor }]}>
                      <Text style={pd.avatarTxt}>{(photo.username?.[0] ?? '?').toUpperCase()}</Text>
                      {photo.mood && <Text style={pd.mood}>{photo.mood}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={pd.username}>{photo.username}</Text>
                      <Text style={pd.meta}>{countryFlag(photo.country)}  {countryName(photo.country)}</Text>
                    </View>
                    <Text style={pd.timeStamp}>{timeAgo(photo.createdAt)}</Text>
                  </View>

                  {/* Caption */}
                  {!!photo.caption && (
                    <Text style={pd.caption}>{photo.caption}</Text>
                  )}

                  {/* Action bar */}
                  <View style={pd.divider} />
                  <View style={pd.actionsBar}>
                    <TouchableOpacity style={pd.actionBtn} onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}>
                      <Text style={pd.actionIcon}>💬</Text>
                      {photo.comments?.length > 0 && (
                        <Text style={pd.actionCount}>{photo.comments.length}</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity style={pd.actionBtn} onPress={toggleEcho}>
                      <Text style={[pd.actionIcon, echoed ? pd.echoedIcon : pd.dimIcon]}>🔊</Text>
                      {echoCount > 0 && (
                        <Text style={[pd.actionCount, echoed && pd.echoedCount]}>{echoCount}</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity style={pd.actionBtn} onPress={toggleMark}>
                      <Text style={[pd.actionIcon, marked ? pd.markedIcon : pd.dimIcon]}>👣</Text>
                      {markCount > 0 && (
                        <Text style={[pd.actionCount, marked && pd.markedCount]}>{markCount}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={pd.divider} />

                  {photo.comments?.length > 0 && (
                    <Text style={pd.repliesLabel}>
                      {photo.comments.length} {photo.comments.length === 1 ? 'reply' : 'replies'}
                    </Text>
                  )}
                </View>
              </View>
            }
            ListEmptyComponent={
              <Text style={pd.empty}>No replies yet — be first!</Text>
            }
            renderItem={({ item }) => (
              <View style={pd.commentRow}>
                <View style={[pd.commentAv, { backgroundColor: stringToColor(item.username) }]}>
                  <Text style={pd.commentAvTxt}>{(item.username?.[0] ?? '?').toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={pd.commentUser}>{item.username}</Text>
                    <Text style={{ fontSize: 12 }}>{countryFlag(item.country)}</Text>
                    <Text style={pd.commentTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={pd.commentTxt}>{item.text}</Text>
                </View>
              </View>
            )}
          />

          {/* Reply input */}
          <View style={pd.inputRow}>
            <View style={[pd.inputAv, { backgroundColor: stringToColor(user.username) }]}>
              <Text style={pd.inputAvTxt}>{user.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <TextInput
              style={pd.input}
              placeholder="Post your reply…"
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
              multiline
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)}
            />
            <TouchableOpacity
              style={[pd.sendBtn, !text.trim() && pd.sendOff]}
              onPress={submit}
              disabled={!text.trim()}
            >
              <Text style={pd.sendTxt}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </Modal>
  );
}

// ─── Upload modal ─────────────────────────────────────────────────────────────

function UploadModal({ visible, onClose, user }) {
  const [imageUri,        setImageUri]        = useState(null);
  const [caption,         setCaption]         = useState('');
  const [filter,          setFilter]          = useState('normal');
  const [uploading,       setUploading]       = useState(false);
  const [isVideo,         setIsVideo]         = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [pinToVisited,    setPinToVisited]    = useState(false);
  const [locDetecting,    setLocDetecting]    = useState(false);

  const isVisiting = detectedCountry && detectedCountry !== user?.country;

  function reset() {
    setImageUri(null); setCaption(''); setFilter('normal');
    setUploading(false); setIsVideo(false);
    setDetectedCountry(null); setPinToVisited(false);
  }

  useEffect(() => {
    if (!visible) return;
    setDetectedCountry(null);
    setPinToVisited(false);
    setLocDetecting(true);
    Geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          .then(r => r.json())
          .then(data => {
            if (data.countryCode) {
              setDetectedCountry(`${countryFlag(data.countryCode)} ${data.countryName}`);
            }
          })
          .catch(() => {})
          .finally(() => setLocDetecting(false));
      },
      () => setLocDetecting(false),
      { timeout: 6000, enableHighAccuracy: false }
    );
  }, [visible]);

  function pick(source) {
    if (source === 'library') {
      launchImageLibrary(
        { mediaType: 'mixed', quality: 0.85, maxWidth: 1080, maxHeight: 1080 },
        r => {
          if (!r.didCancel && r.assets?.[0]) {
            const asset = r.assets[0];
            setImageUri(asset.uri);
            setIsVideo(asset.type?.startsWith('video') || false);
          }
        }
      );
    } else if (source === 'camera') {
      launchCamera(
        { mediaType: 'photo', quality: 0.85, maxWidth: 1080, maxHeight: 1080, saveToPhotos: true },
        r => {
          if (!r.didCancel && r.assets?.[0]) {
            setImageUri(r.assets[0].uri);
            setIsVideo(false);
          }
        }
      );
    } else if (source === 'video') {
      launchCamera(
        { mediaType: 'video', videoQuality: 'high', durationLimit: 60, saveToPhotos: true },
        r => {
          if (!r.didCancel && r.assets?.[0]) {
            setImageUri(r.assets[0].uri);
            setIsVideo(true);
          }
        }
      );
    }
  }

  async function upload() {
    if (!imageUri) return;
    setUploading(true);
    try {
      const token = await getAccessToken();
      const fd = new FormData();
      const isMov = imageUri?.toLowerCase().endsWith('.mov');
      fd.append('photo', isVideo
        ? { uri: imageUri, type: isMov ? 'video/quicktime' : 'video/mp4', name: isMov ? 'media.mov' : 'media.mp4' }
        : { uri: imageUri, type: 'image/jpeg', name: 'photo.jpg' }
      );
      fd.append('mediaType', isVideo ? 'video' : 'image');
      if (pinToVisited && detectedCountry) fd.append('postCountry', detectedCountry);
      fd.append('username', user.username);
      fd.append('userId', user.userId || user.id || '');
      fd.append('country', user.country);
      fd.append('language', user.language);
      fd.append('mood', user.mood || '');
      fd.append('caption', caption.trim());
      fd.append('filter', filter);
      const ep = '/api/photos/upload';
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
          <Text style={up.title}>New World Entry ✦</Text>
          {/* Location row — always shows home country */}
          <View style={up.locRow}>
            <Text style={up.locTxt}>{countryName(user?.country || '') || 'Home'}</Text>
            <View style={up.locBadge}><Text style={up.locBadgeTxt}>Home feed</Text></View>
          </View>

          {/* Pin-to-visited toggle — only when GPS finds a different country */}
          {locDetecting ? (
            <View style={up.pinDetecting}>
              <ActivityIndicator size="small" $1={BOND_PINK} />
              <Text style={up.pinDetectingTxt}>Detecting location…</Text>
            </View>
          ) : isVisiting ? (
            <TouchableOpacity
              style={[up.pinRow, pinToVisited && up.pinRowOn]}
              onPress={() => setPinToVisited(v => !v)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[up.pinLabel, pinToVisited && up.pinLabelOn]}>
                  Pin to {countryName(detectedCountry)} feed
                </Text>
                <Text style={up.pinSub}>
                  {pinToVisited
                    ? 'Appears in your home + this country\'s feed'
                    : 'Only appears in your home feed'}
                </Text>
              </View>
              <View style={[up.pinCheck, pinToVisited && up.pinCheckOn]}>
                {pinToVisited && <Text style={up.pinCheckMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Media picker */}
          {!imageUri ? (
            <View style={up.picks}>
              <TouchableOpacity style={up.pick} onPress={() => pick('library')}>
                <Text style={up.pickTxt}>Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={up.pick} onPress={() => pick('camera')}>
                <Text style={up.pickTxt}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={up.pick} onPress={() => pick('video')}>
                <Text style={up.pickTxt}>Video</Text>
              </TouchableOpacity>
            </View>
          ) : isVideo ? (
            <View style={[up.preview, up.videoPrev]}>
              <Text style={up.videoReady}>Video ready</Text>
              <TouchableOpacity onPress={() => pick('video')} style={{ marginTop: 6 }}>
                <Text style={up.reRecordTxt}>Re-record</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => pick('library')} style={{ marginTop: 4 }}>
                <Text style={up.reRecordTxt}>Choose different</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginBottom: 10, gap: 8 }}>
              <FilteredImage uri={imageUri} filterId={filter} style={up.preview} />
              <TouchableOpacity onPress={() => pick('library')}>
                <Text style={{ color: BOND_PINK, fontSize: 13, fontWeight: '600' }}>Change photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {imageUri && !isVideo && <FilterPicker imageUri={imageUri} selectedFilter={filter} onSelect={setFilter} />}

          <TextInput
            style={up.caption}
            placeholder="Write your entry…"
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
                  {'Post Entry ✦'}
                </Text>
            }
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}


// ─── Moment Ring (story bubble) ───────────────────────────────────────────────

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PhotoFeedScreen({ navigation, user }) {

  const [photos,         setPhotos]      = useState([]);
  const [tab,            setTab]         = useState('world');
  const [showFootprints, setShowFootprints] = useState(false);
  const [showUpload,     setShowUpload]  = useState(false);
  const [commentPhoto,   setCommentPhoto] = useState(null);
  const [followingIds,   setFollowingIds] = useState([]);
  const [savedCountries,    setSavedCountries]    = useState([]);
  const [currentCountry,    setCurrentCountry]    = useState(user?.country || null);
  const [countryFlagCounts, setCountryFlagCounts] = useState({});
  const [refreshing,        setRefreshing]        = useState(false);
  const [activeVideoId,     setActiveVideoId]     = useState(null);
  const globeAnim  = useRef(new Animated.Value(1)).current;
  const landAnim   = useRef(new Animated.Value(0)).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const socket = getSocket();

  // On mount: show home country landing banner and fetch its flag count
  useEffect(() => {
    if (!user?.country) return;
    landAnim.setValue(0);
    Animated.spring(landAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
    const fetch = () => socket.emit('get_country_flag_count', { country: user.country });
    if (socket.connected) fetch(); else socket.once('connect', fetch);
  }, []);

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
      socket.emit('get_following');
    }
    if (socket.connected) init(); else socket.once('connect', init);

    socket.on('photos_feed', data => { setPhotos(data); setRefreshing(false); });
    socket.on('new_photo',     p  => setPhotos(prev => [p, ...prev]));
    socket.on('photo_updated', up => {
      setPhotos(prev => prev.map(p => p.id === up.id ? up : p));
      setCommentPhoto(cp => cp?.id === up.id ? up : cp);
    });
    socket.on('following_list',  ({ following }) => setFollowingIds(following));
    socket.on('follow_status', ({ targetUserId, following }) => {
      setFollowingIds(prev =>
        following ? [...new Set([...prev, targetUserId])] : prev.filter(id => id !== targetUserId)
      );
    });
    socket.on('country_flag_count', ({ country, count }) =>
      setCountryFlagCounts(prev => ({ ...prev, [country]: count }))
    );
    return () => {
      ['photos_feed','new_photo','photo_updated','following_list','follow_status','country_flag_count']
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

  // Bonds feed: own posts + posts from people you follow (Twitter "Following" model)
  const bondPhotos = useMemo(() =>
    photos.filter(p => p.userId === myUserId || followingIds.includes(p.userId))
  , [photos, followingIds, myUserId]);

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
              <Text style={s.minePromptTxt}>See my country</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.teleportBtn} onPress={teleport} activeOpacity={0.85}>
            <Text style={s.teleportBtnTxt}>Take me somewhere</Text>
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
                <Text style={s.plantedCount}>
                  {(countryFlagCounts[currentCountry] || 0).toLocaleString()} planted
                </Text>
              </View>
            </View>
            {currentCountry !== user?.country ? (
              <View style={{ gap: 8, alignItems: 'flex-end' }}>
                <TouchableOpacity style={s.nextBtn} onPress={teleport} activeOpacity={0.8}>
                  <Text style={s.nextBtnTxt}>Next</Text>
                </TouchableOpacity>
                {user?.country && (
                  <TouchableOpacity
                    style={s.backHomeBtn}
                    onPress={() => {
                      landAnim.setValue(0);
                      setCurrentCountry(user.country);
                      socket.emit('get_country_flag_count', { country: user.country });
                      Animated.spring(landAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={s.backHomeTxt}>My feed</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            style={[s.followCountryBtn, savedCountries.includes(currentCountry) && s.followCountryBtnOn]}
            onPress={() => toggleSaveCountry(currentCountry)}
            activeOpacity={0.85}
          >
            <Text style={[s.followCountryTxt, savedCountries.includes(currentCountry) && s.followCountryTxtOn]}>
              {savedCountries.includes(currentCountry)
                ? `Pinned in ${countryName(currentCountry) || currentCountry}`
                : `Pin yourself in ${countryName(currentCountry) || currentCountry}`}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={s.divider} />
    </View>
  );

  const bondsHeader = <View style={s.divider} />;

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.title}>Photos</Text>
        <TouchableOpacity
          style={s.postBtn}
          onPress={() => { setShowUpload(true); }}
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
          <Text style={[s.tabTxt, tab === 'world' && s.tabTxtActive]}>World</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'bonds' && s.tabActive]}
          onPress={() => setTab('bonds')}
        >
          <Text style={[s.tabTxt, tab === 'bonds' && s.tabTxtActive]}>Bonds</Text>
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
            $1={BOND_PINK}
            colors={[BOND_PINK]}
          />
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          tab === 'world' ? countryFilterHeader : bondsHeader
        }
        ListEmptyComponent={
          <View style={s.empty}>
            {tab === 'bonds' && <WorldMark size={48} color="#555" $1={BOND_PINK} />}
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
                onPress={() => { setShowUpload(true); }}
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
        onClose={() => setShowUpload(false)}
        user={user}
      />
      <PostDetailModal
        visible={!!commentPhoto}
        photo={commentPhoto}
        user={user}
        onClose={() => setCommentPhoto(null)}
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
  postBtn:  { backgroundColor: BOND_PINK, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  postBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabs:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, backgroundColor: '#111', borderRadius: 14, padding: 3 },
  tab:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12 },
  tabActive:    { backgroundColor: '#1e1e1e' },
  tabTxt:       { color: '#555', fontSize: 14, fontWeight: '700' },
  tabTxtActive: { color: '#fff' },

  // Bond feed country filter chip

  // Footprints row
  footprintRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10, gap: 8 },
  footprintBtn:        { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#1a1a1a', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2a2a2a' },
  footprintEmoji:      { fontSize: 16 },
  footprintLabel:      { color: '#fff', fontSize: 13, fontWeight: '800' },
  footprintBadge:      { backgroundColor: BOND_PINK, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  footprintBadgeTxt:   { color: '#fff', fontSize: 11, fontWeight: '900' },
  footprintActiveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: BOND_PINK + '18', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: BOND_PINK + '44', flex: 1 },
  footprintActiveFlag: { fontSize: 16 },
  footprintActiveName: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  footprintActiveClear:{ color: BOND_PINK, fontSize: 14, fontWeight: '700' },

  // Mine button
  mineBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1a1a', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2a2a2a' },
  mineBtnOn:     { backgroundColor: 'rgba(108,71,255,0.15)', borderColor: BOND_PINK + '66' },
  mineTxt:       { color: '#777', fontSize: 13, fontWeight: '700' },
  mineTxtOn:     { color: BOND_PINK },

  // Globe teleport prompt
  globePrompt:    { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 8 },
  globeTitle:     { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  globeSub:       { color: '#555', fontSize: 13, textAlign: 'center' },
  minePromptBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: '#2a2a2a', marginTop: 6 },
  minePromptTxt:  { color: '#aaa', fontSize: 14, fontWeight: '700' },
  teleportBtn:    { backgroundColor: BOND_PINK, borderRadius: 26, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  teleportBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },

  // Landing banner
  landingBanner:      { marginHorizontal: 14, marginBottom: 10, backgroundColor: '#111', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#222', gap: 12 },
  landingTop:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  landingFlag:        { fontSize: 44 },
  landingLabel:       { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  landingCountry:     { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 },
  nextBtn:            { backgroundColor: '#1a1a1a', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2a2a2a' },
  nextBtnTxt:         { color: '#fff', fontSize: 13, fontWeight: '800' },
  backHomeBtn:        { backgroundColor: BOND_PINK + '18', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: BOND_PINK + '44' },
  backHomeTxt:        { color: '#9d7cff', fontSize: 13, fontWeight: '800' },
  followCountryBtn:   { backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  followCountryBtnOn: { backgroundColor: 'rgba(108,71,255,0.15)', borderColor: BOND_PINK + '66' },
  followCountryTxt:   { color: '#666', fontSize: 14, fontWeight: '700' },
  followCountryTxtOn: { color: BOND_PINK },
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
  fpCellActive:   { borderColor: BOND_PINK, backgroundColor: 'rgba(108,71,255,0.12)' },
  fpCellFlag:     { fontSize: 30, marginBottom: 6 },
  fpCellName:     { color: '#aaa', fontSize: 10, textAlign: 'center', fontWeight: '700' },
  fpCellRemove:   { position: 'absolute', top: 5, right: 6 },
  fpCellRemoveTxt:{ color: '#444', fontSize: 11, fontWeight: '800' },

  divider: { height: 1, backgroundColor: '#111' },

  momentSection: { paddingVertical: 14 },
  momentRow:     { paddingHorizontal: 14, gap: 12 },

  heartBurst: { position: 'absolute', alignSelf: 'center', top: '35%', fontSize: 90 },

  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptySub:   { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn:   { backgroundColor: BOND_PINK, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, marginTop: 6 },
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
  bondBtnOn:        { backgroundColor: BOND_PINK, borderColor: BOND_PINK },
  bondBtnTxt:       { color: '#777', fontSize: 12, fontWeight: '700' },
  bondBtnTxtOn:     { color: '#fff' },

  // Blog-style entry caption
  entryText:        { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 24, fontWeight: '400', letterSpacing: 0.1 },

  // Action bar — Twitter style (icon + count only)
  actionsBar:   { flexDirection: 'row', alignItems: 'center', gap: 28, paddingTop: 6, paddingBottom: 2 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon:   { fontSize: 17, color: '#555' },
  actionCount:  { color: '#555', fontSize: 12, fontWeight: '600' },
  dimIcon:      { opacity: 0.35 },
  markedIcon:   { opacity: 1 },
  markedCount:  { color: '#FF0080' },
  echoedIcon:   { opacity: 1 },
  echoedCount:  { color: '#57f287' },

  divider:          { height: 1, backgroundColor: '#111', marginTop: 10 },

  // Echo attribution (Twitter-style "X reposted")
});

// Post detail modal
const pd = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#000' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon:     { color: '#fff', fontSize: 22, fontWeight: '300' },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '800' },

  photoEmpty:    { width: '100%', backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  photoEmptyFlag:{ fontSize: 72 },

  body:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, gap: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  mood:      { position: 'absolute', bottom: -2, right: -2, fontSize: 12 },
  username:  { color: '#fff', fontWeight: '800', fontSize: 15 },
  meta:      { color: '#555', fontSize: 12, marginTop: 2 },
  timeStamp: { color: '#444', fontSize: 12 },

  caption:   { color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 26, fontWeight: '400' },

  divider:   { height: 1, backgroundColor: '#1a1a1a' },

  actionsBar: { flexDirection: 'row', alignItems: 'center', gap: 30, paddingVertical: 10 },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 18, color: '#555' },
  actionCount:{ color: '#555', fontSize: 13, fontWeight: '600' },
  dimIcon:    { opacity: 0.35 },
  markedIcon: { opacity: 1 },
  markedCount:{ color: '#FF0080' },
  dimIcon:    { opacity: 0.35 },
  echoedIcon: { opacity: 1 },
  echoedCount:{ color: '#57f287' },

  repliesLabel: { color: '#555', fontSize: 13, fontWeight: '700', paddingTop: 10, paddingBottom: 4 },
  empty:        { color: '#444', textAlign: 'center', paddingVertical: 40, fontSize: 13 },

  commentRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderTopWidth: 1, borderTopColor: '#111' },
  commentAv:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentAvTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  commentUser:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  commentTime:  { color: '#444', fontSize: 11 },
  commentTxt:   { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 21 },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1a1a1a', gap: 10 },
  inputAv:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  inputAvTxt:{ color: '#fff', fontWeight: '800', fontSize: 13 },
  input:    { flex: 1, backgroundColor: '#111', color: '#fff', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 80, borderWidth: 1, borderColor: '#1e1e1e' },
  sendBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: BOND_PINK, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendOff:  { backgroundColor: '#222' },
  sendTxt:  { color: '#fff', fontSize: 16 },
});

// Upload modal
const up = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:   { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  handle:  { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:   { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  locRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  locTxt:       { color: '#aaa', fontSize: 13, fontWeight: '700', flex: 1 },
  locBadge:     { backgroundColor: BOND_PINK + '22', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: BOND_PINK + '44' },
  locBadgeTxt:  { color: '#9d7cff', fontSize: 11, fontWeight: '700' },

  pinDetecting: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pinDetectingTxt: { color: '#444', fontSize: 12 },

  pinRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#111', borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1.5, borderColor: '#222' },
  pinRowOn:     { borderColor: BOND_PINK + '66', backgroundColor: BOND_PINK + '10' },
  pinLabel:     { color: '#666', fontSize: 13, fontWeight: '700' },
  pinLabelOn:   { color: '#bba8ff' },
  pinSub:       { color: '#444', fontSize: 11, marginTop: 2 },
  pinCheck:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  pinCheckOn:   { backgroundColor: BOND_PINK, borderColor: BOND_PINK },
  pinCheckMark: { color: '#fff', fontSize: 12, fontWeight: '900' },


  picks:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  pick:    { flex: 1, backgroundColor: '#0d0d0d', borderRadius: 14, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#222' },
  pickTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  preview:      { width: '100%', height: 220, borderRadius: 16 },
  videoPrev:    { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', marginBottom: 10 },

  videoReady:   { color: '#aaa', fontSize: 14, fontWeight: '700', marginTop: 8 },
  reRecordTxt:  { color: BOND_PINK, fontSize: 13, fontWeight: '600' },
  caption: { backgroundColor: '#000', color: '#fff', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 60, borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 14, marginTop: 12 },
  btn:     { backgroundColor: BOND_PINK, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff:  { backgroundColor: '#222' },
  btnTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});




