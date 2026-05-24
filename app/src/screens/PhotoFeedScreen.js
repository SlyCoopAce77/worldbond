import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, Modal, KeyboardAvoidingView,
  Platform, Animated, Alert, ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import axios from 'axios';
import { getSocket, SERVER_URL } from '../services/socket';
import { getAccessToken } from '../services/authApi';
import FilteredImage from '../components/FilteredImage';
import FilterPicker from '../components/FilterPicker';
import StoriesBar from '../components/StoriesBar';
import StoryViewer from '../components/StoryViewer';

function stringToColor(str = '') {
  const colors = ['#e57373', '#ba68c8', '#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#4db6ac', '#7986cb'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── HEART ANIMATION ─────────────────────────────────────────────────────────

function HeartBurst({ visible }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      opacity.setValue(1);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.6, useNativeDriver: true, bounciness: 14 }),
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.Text style={[styles.heartBurst, { transform: [{ scale }], opacity }]}>
      ❤️
    </Animated.Text>
  );
}

// ─── COMMENTS MODAL ──────────────────────────────────────────────────────────

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
      <View style={cStyles.overlay}>
        <TouchableOpacity style={cStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={cStyles.sheet}>
          <View style={cStyles.handle} />
          <Text style={cStyles.title}>Comments</Text>
          <FlatList
            data={photo.comments || []}
            keyExtractor={c => c.id}
            style={cStyles.list}
            ListEmptyComponent={<Text style={cStyles.noComments}>No comments yet — be first!</Text>}
            renderItem={({ item }) => (
              <View style={cStyles.commentRow}>
                <View style={[cStyles.avatar, { backgroundColor: stringToColor(item.username) }]}>
                  <Text style={cStyles.avatarText}>{item.username[0].toUpperCase()}</Text>
                </View>
                <View style={cStyles.commentBody}>
                  <View style={cStyles.commentMeta}>
                    <Text style={cStyles.commentUser}>{item.username}</Text>
                    <Text style={cStyles.commentCountry}>{item.country?.split(' ')[0]}</Text>
                    <Text style={cStyles.commentTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={cStyles.commentText}>{item.text}</Text>
                </View>
              </View>
            )}
          />
          <View style={cStyles.inputRow}>
            <View style={[cStyles.myAvatar, { backgroundColor: stringToColor(user.username) }]}>
              <Text style={cStyles.myAvatarText}>{user.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <TextInput
              style={cStyles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              style={[cStyles.sendBtn, !text.trim() && cStyles.sendBtnOff]}
              onPress={submit}
              disabled={!text.trim()}
            >
              <Text style={cStyles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── UPLOAD MODAL ────────────────────────────────────────────────────────────

function UploadModal({ visible, onClose, user, mode = 'photo' }) {
  const [imageUri, setImageUri] = useState(null);
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState('normal');
  const [uploading, setUploading] = useState(false);
  const isStory = mode === 'story';

  function reset() {
    setImageUri(null);
    setCaption('');
    setFilter('normal');
    setUploading(false);
  }

  function pick(fromCamera) {
    const launcher = fromCamera ? launchCamera : launchImageLibrary;
    launcher({ mediaType: 'photo', quality: 0.7, maxWidth: 1080, maxHeight: 1080 }, res => {
      if (!res.didCancel && res.assets?.[0]) setImageUri(res.assets[0].uri);
    });
  }

  async function upload() {
    if (!imageUri) return;
    setUploading(true);
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('photo', { uri: imageUri, type: 'image/jpeg', name: 'photo.jpg' });
      formData.append('username', user.username);
      formData.append('userId', user.userId || user.id || '');
      formData.append('country', user.country);
      formData.append('language', user.language);
      formData.append('mood', user.mood || '');
      formData.append('caption', caption.trim());
      formData.append('filter', filter);

      const endpoint = isStory ? '/api/stories/upload' : '/api/photos/upload';
      await axios.post(`${SERVER_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      reset();
      onClose();
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <View style={upStyles.overlay}>
        <TouchableOpacity style={upStyles.backdrop} activeOpacity={1} onPress={() => { reset(); onClose(); }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={upStyles.sheet}>
          <View style={upStyles.handle} />
          <Text style={upStyles.title}>
            {isStory ? 'Add to Your Story ✨' : 'Share a Photo 📸'}
          </Text>

          {!imageUri ? (
            <View style={upStyles.pickBtns}>
              <TouchableOpacity style={upStyles.pickBtn} onPress={() => pick(false)}>
                <Text style={upStyles.pickBtnIcon}>🖼️</Text>
                <Text style={upStyles.pickBtnText}>Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={upStyles.pickBtn} onPress={() => pick(true)}>
                <Text style={upStyles.pickBtnIcon}>📷</Text>
                <Text style={upStyles.pickBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={upStyles.preview}>
              <FilteredImage uri={imageUri} filterId={filter} style={upStyles.previewImage} />
              <TouchableOpacity style={upStyles.changeBtn} onPress={() => pick(false)}>
                <Text style={upStyles.changeBtnText}>Change photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Filter picker — shown once image is selected */}
          {imageUri && (
            <FilterPicker
              imageUri={imageUri}
              selectedFilter={filter}
              onSelect={setFilter}
            />
          )}

          <TextInput
            style={upStyles.captionInput}
            placeholder={isStory ? 'Add a caption to your story...' : 'Write a caption... 🌍'}
            placeholderTextColor="#555"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
          />

          <TouchableOpacity
            style={[upStyles.uploadBtn, (!imageUri || uploading) && upStyles.uploadBtnOff]}
            onPress={upload}
            disabled={!imageUri || uploading}
          >
            {uploading
              ? <ActivityIndicator color="#fff" />
              : <Text style={upStyles.uploadBtnText}>
                  {isStory ? 'Share Story (24h) ✨' : 'Post to the World 🌍'}
                </Text>
            }
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── PHOTO CARD ──────────────────────────────────────────────────────────────

function PhotoCard({ photo, user, onComment, onProfile, onFollow, followingIds }) {
  const socket = getSocket();
  const [liked, setLiked] = useState(photo.likes?.some(l => l.userId === socket.id));
  const [likeCount, setLikeCount] = useState(photo.likes?.length || 0);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  useEffect(() => {
    setLiked(photo.likes?.some(l => l.userId === socket.id));
    setLikeCount(photo.likes?.length || 0);
  }, [photo.likes]);

  function toggleLike() {
    socket.emit('like_photo', { photoId: photo.id });
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  }

  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) {
        toggleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 900);
      }
    }
    lastTapRef.current = now;
  }

  const isOwn = photo.userId === socket.id;
  const isFollowed = followingIds.includes(photo.userId);

  return (
    <View style={styles.photoCard}>
      {/* Header */}
      <TouchableOpacity style={styles.photoHeader} onPress={() => onProfile(photo)}>
        <View style={[styles.photoAvatar, { backgroundColor: stringToColor(photo.username) }]}>
          <Text style={styles.photoAvatarText}>{(photo.username?.[0] ?? '?').toUpperCase()}</Text>
          {photo.mood && <Text style={styles.photoMoodBubble}>{photo.mood}</Text>}
        </View>
        <View style={styles.photoHeaderInfo}>
          <Text style={styles.photoUsername}>{photo.username}</Text>
          <Text style={styles.photoCountry}>{photo.country}</Text>
        </View>
        {!isOwn && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowed && styles.followBtnActive]}
            onPress={() => onFollow(photo.userId, isFollowed)}
          >
            <Text style={[styles.followBtnText, isFollowed && styles.followBtnTextActive]}>
              {isFollowed ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.photoTime}>{timeAgo(photo.createdAt)}</Text>
      </TouchableOpacity>

      {/* Image with filter and double-tap */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={styles.photoWrap}>
        <FilteredImage
          uri={photo.imageUrl}
          filterId={photo.filter || 'normal'}
          style={styles.photoImage}
          resizeMode="cover"
        />
        <HeartBurst visible={showHeart} />
      </TouchableOpacity>

      {/* Actions row */}
      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
          <Text style={[styles.actionIcon, liked && styles.actionIconLiked]}>
            {liked ? '❤️' : '🤍'}
          </Text>
          <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onComment(photo)}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{photo.comments?.length || 0}</Text>
        </TouchableOpacity>

        {isOwn && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRight]} onPress={() => {
            Alert.alert('Delete Photo', 'Remove this photo?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => socket.emit('delete_photo', { photoId: photo.id }) },
            ]);
          }}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      {likeCount > 0 && (
        <Text style={styles.likedByText}>
          ❤️ {likeCount === 1 ? '1 like' : `${likeCount} likes`}
        </Text>
      )}

      {!!photo.caption && (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>{photo.username}</Text>
          <Text style={styles.captionText}>{photo.caption}</Text>
        </View>
      )}

      {photo.comments?.length > 0 && (
        <TouchableOpacity onPress={() => onComment(photo)} style={styles.commentPreview}>
          {photo.comments.length > 1 && (
            <Text style={styles.viewAllComments}>View all {photo.comments.length} comments</Text>
          )}
          <View style={styles.commentPreviewRow}>
            <Text style={styles.commentPreviewUser}>{photo.comments[photo.comments.length - 1].username}</Text>
            <Text style={styles.commentPreviewText} numberOfLines={1}>
              {photo.comments[photo.comments.length - 1].text}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function PhotoFeedScreen({ navigation, user }) {
  const [photos, setPhotos] = useState([]);
  const [stories, setStories] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState('photo');
  const [commentPhoto, setCommentPhoto] = useState(null);
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const socket = getSocket();

  useEffect(() => {
    function fetchFeed() {
      socket.emit('get_photos');
      socket.emit('get_stories');
      socket.emit('get_following', { userId: socket.id });
    }
    if (socket.connected) fetchFeed();
    else socket.once('connect', fetchFeed);

    socket.on('photos_feed', setPhotos);
    socket.on('new_photo', photo => setPhotos(prev => [photo, ...prev]));
    socket.on('photo_updated', updated => {
      setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
      setCommentPhoto(cp => cp?.id === updated.id ? updated : cp);
    });
    socket.on('stories_updated', setStories);
    socket.on('following_list', ({ following }) => setFollowingIds(following));
    socket.on('follow_status', ({ targetUserId, following }) => {
      setFollowingIds(prev =>
        following ? [...new Set([...prev, targetUserId])] : prev.filter(id => id !== targetUserId)
      );
    });

    return () => {
      socket.off('photos_feed');
      socket.off('new_photo');
      socket.off('photo_updated');
      socket.off('stories_updated');
      socket.off('following_list');
      socket.off('follow_status');
    };
  }, []);

  function openProfile(photo) {
    navigation.navigate('Profile', {
      profileUser: {
        username: photo.username,
        country: photo.country,
        language: photo.language,
        socials: {},
        socketId: photo.userId,
      },
    });
  }

  function handleFollow(targetUserId, isFollowed) {
    if (isFollowed) {
      socket.emit('unfollow_user', { targetUserId });
    } else {
      socket.emit('follow_user', { targetUserId });
    }
  }

  function openStory(group) {
    setViewingStoryGroup(group);
  }

  function openAddStory() {
    setUploadMode('story');
    setShowUpload(true);
  }

  function openAddPhoto() {
    setUploadMode('photo');
    setShowUpload(true);
  }

  function handleDeleteStory(storyId) {
    socket.emit('delete_story', { storyId });
  }

  function handleViewStory(storyId) {
    socket.emit('view_story', { storyId });
  }

  const listHeader = (
    <View>
      {/* Stories bar */}
      <StoriesBar
        stories={stories}
        currentUserId={socket.id}
        onStoryPress={openStory}
        onAddStory={openAddStory}
      />
      <View style={styles.divider} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Photos 📸</Text>
          <Text style={styles.subtitle}>See the world through everyone's eyes</Text>
        </View>
        <TouchableOpacity style={styles.uploadBtn} onPress={openAddPhoto}>
          <Text style={styles.uploadBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySub}>Be the first to share a moment from your world!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddPhoto}>
              <Text style={styles.emptyBtnText}>Post a Photo</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <PhotoCard
            photo={item}
            user={user}
            onComment={setCommentPhoto}
            onProfile={openProfile}
            onFollow={handleFollow}
            followingIds={followingIds}
          />
        )}
      />

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
        onDelete={handleDeleteStory}
        onViewStory={handleViewStory}
        currentUserId={socket.id}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  divider: { height: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 3 },
  uploadBtn: { backgroundColor: '#5865f2', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  photoCard: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  photoHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  photoAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  photoAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  photoMoodBubble: { position: 'absolute', bottom: -2, right: -2, fontSize: 14 },
  photoHeaderInfo: { flex: 1 },
  photoUsername: { color: '#fff', fontWeight: '700', fontSize: 14 },
  photoCountry: { color: '#888', fontSize: 11, marginTop: 1 },
  followBtn: {
    borderWidth: 1, borderColor: '#5865f2', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  followBtnActive: { backgroundColor: '#5865f2', borderColor: '#5865f2' },
  followBtnText: { color: '#5865f2', fontSize: 12, fontWeight: '700' },
  followBtnTextActive: { color: '#fff' },
  photoTime: { color: '#555', fontSize: 11 },
  photoWrap: { position: 'relative' },
  photoImage: { width: '100%', aspectRatio: 1, backgroundColor: '#1a1a2e' },
  heartBurst: {
    position: 'absolute', alignSelf: 'center',
    top: '35%', fontSize: 90,
  },
  photoActions: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 16,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionBtnRight: { marginLeft: 'auto' },
  actionIcon: { fontSize: 26 },
  actionIconLiked: { color: '#e91e63' },
  actionCount: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  actionCountLiked: { color: '#e91e63' },
  deleteIcon: { fontSize: 20 },
  likedByText: { color: '#fff', fontSize: 13, fontWeight: '700', paddingHorizontal: 14, marginBottom: 4 },
  captionRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, marginBottom: 4, flexWrap: 'wrap' },
  captionUsername: { color: '#fff', fontWeight: '700', fontSize: 13 },
  captionText: { color: '#ddd', fontSize: 13, flex: 1, flexWrap: 'wrap' },
  commentPreview: { paddingHorizontal: 14, paddingBottom: 10, gap: 2 },
  viewAllComments: { color: '#888', fontSize: 12, marginBottom: 2 },
  commentPreviewRow: { flexDirection: 'row', gap: 6 },
  commentPreviewUser: { color: '#fff', fontWeight: '700', fontSize: 12 },
  commentPreviewText: { color: '#aaa', fontSize: 12, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  emptySub: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: { backgroundColor: '#5865f2', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

const cStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '75%', paddingBottom: 8,
  },
  handle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 },
  list: { maxHeight: 340 },
  noComments: { color: '#555', textAlign: 'center', paddingVertical: 30, fontSize: 14 },
  commentRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  commentBody: { flex: 1, gap: 3 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentUser: { color: '#fff', fontWeight: '700', fontSize: 12 },
  commentCountry: { color: '#888', fontSize: 11 },
  commentTime: { color: '#555', fontSize: 10, marginLeft: 'auto' },
  commentText: { color: '#ddd', fontSize: 13, lineHeight: 18 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, borderTopColor: '#2a2a4a', gap: 8,
  },
  myAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  myAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  input: {
    flex: 1, backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 80,
  },
  sendBtn: { backgroundColor: '#5865f2', borderRadius: 20, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: '#333' },
  sendBtnText: { color: '#fff', fontSize: 16 },
});

const upStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  handle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  pickBtns: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickBtn: {
    flex: 1, backgroundColor: '#0f0f1a', borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2a2a4a',
  },
  pickBtnIcon: { fontSize: 32 },
  pickBtnText: { color: '#ccc', fontSize: 13, textAlign: 'center' },
  preview: { alignItems: 'center', marginBottom: 14, gap: 8 },
  previewImage: { width: '100%', height: 220, borderRadius: 16 },
  changeBtn: { paddingVertical: 6 },
  changeBtnText: { color: '#5865f2', fontSize: 13, fontWeight: '600' },
  captionInput: {
    backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 12,
    padding: 14, fontSize: 14, minHeight: 60, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#2a2a4a', marginBottom: 14, marginTop: 12,
  },
  uploadBtn: { backgroundColor: '#5865f2', borderRadius: 14, padding: 16, alignItems: 'center' },
  uploadBtnOff: { backgroundColor: '#333' },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
