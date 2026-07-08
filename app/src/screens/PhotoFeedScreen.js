import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { getSocket, SERVER_URL } from '../services/socket';
import { authHeader } from '../utils/apiUtils';
import { getCountryFlag } from '../utils/countryUtils';
import FilteredImage from '../components/FilteredImage';

const BOND_PINK = '#FF0080';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function PhotoCard({ photo, currentUserId, onLike, onEcho, onOpenComments }) {
  const liked = (photo.likes || []).some(l => l.userId === currentUserId);
  const echoed = (photo.echos || []).some(e => e.userId === currentUserId);
  return (
    <View style={c.card}>
      <View style={c.header}>
        <Text style={c.name} numberOfLines={1}>{photo.username || 'Someone'}</Text>
        {photo.country ? <Text style={c.flag}>{getCountryFlag(photo.country)}</Text> : null}
        <Text style={c.time}>{timeAgo(photo.createdAt)}</Text>
      </View>

      <FilteredImage uri={photo.imageUrl} filterId={photo.filter} style={c.image} />

      {photo.caption ? <Text style={c.caption}>{photo.caption}</Text> : null}

      <View style={c.actions}>
        <TouchableOpacity style={c.actionBtn} onPress={() => onLike(photo.id)} activeOpacity={0.7}>
          <Text style={[c.actionIcon, liked && { color: BOND_PINK }]}>{liked ? '♥' : '♡'}</Text>
          <Text style={c.actionCount}>{(photo.likes || []).length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={c.actionBtn} onPress={() => onOpenComments(photo)} activeOpacity={0.7}>
          <Text style={c.actionIcon}>💬</Text>
          <Text style={c.actionCount}>{(photo.comments || []).length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={c.actionBtn} onPress={() => onEcho(photo.id)} activeOpacity={0.7}>
          <Text style={[c.actionIcon, echoed && { color: '#4ade80' }]}>🔁</Text>
          <Text style={c.actionCount}>{(photo.echos || []).length}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const c = StyleSheet.create({
  card:       { marginHorizontal: 14, marginBottom: 18, backgroundColor: '#12131a', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff0f' },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  name:       { color: '#fff', fontSize: 13, fontWeight: '800', flexShrink: 1 },
  flag:       { fontSize: 14 },
  time:       { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginLeft: 'auto' },
  image:      { width: '100%', aspectRatio: 1, backgroundColor: '#000' },
  caption:    { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18, paddingHorizontal: 14, paddingTop: 10 },
  actions:    { flexDirection: 'row', gap: 22, paddingHorizontal: 14, paddingVertical: 12 },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { color: 'rgba(255,255,255,0.6)', fontSize: 18 },
  actionCount:{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
});

function CommentsModal({ photo, visible, currentUser, onClose, onSubmit }) {
  const [text, setText] = useState('');
  if (!photo) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>Comments</Text>
          <FlatList
            data={photo.comments || []}
            keyExtractor={item => item.id}
            style={{ maxHeight: 320 }}
            ListEmptyComponent={<Text style={m.empty}>No comments yet — say something nice.</Text>}
            renderItem={({ item }) => (
              <View style={m.commentRow}>
                <Text style={m.commentName}>{item.username}{item.country ? ` ${getCountryFlag(item.country)}` : ''}</Text>
                <Text style={m.commentText}>{item.text}</Text>
              </View>
            )}
          />
          <View style={m.inputRow}>
            <TextInput
              style={m.input}
              value={text}
              onChangeText={setText}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.35)"
            />
            <TouchableOpacity
              style={m.sendBtn}
              onPress={() => { if (text.trim()) { onSubmit(photo.id, text.trim()); setText(''); } }}
            >
              <Text style={m.sendTxt}>Send</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={m.closeBtn}><Text style={m.closeTxt}>Close</Text></TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#16171d', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 28, gap: 10 },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 6 },
  title:       { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  empty:       { color: 'rgba(255,255,255,0.35)', fontSize: 13, paddingVertical: 20, textAlign: 'center' },
  commentRow:  { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ffffff0a' },
  commentName: { color: BOND_PINK, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  commentText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  inputRow:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  input:       { flex: 1, backgroundColor: '#0d0e13', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#ffffff14' },
  sendBtn:     { backgroundColor: BOND_PINK, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  sendTxt:     { color: '#fff', fontWeight: '800', fontSize: 13 },
  closeBtn:    { alignSelf: 'center', marginTop: 6 },
  closeTxt:    { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});

export default function PhotoFeedScreen({ navigation, route }) {
  const user = route?.params?.currentUser || route?.params?.user || null;
  const socket = getSocket();

  const [photos,      setPhotos]      = useState([]);
  const [loading,      setLoading]    = useState(true);
  const [refreshing,   setRefreshing] = useState(false);
  const [uploading,    setUploading]  = useState(false);
  const [commentsFor,  setCommentsFor]= useState(null);

  const load = useCallback(() => {
    socket.emit('get_photos');
  }, []);

  useEffect(() => {
    const onFeed = list => { setPhotos(list || []); setLoading(false); setRefreshing(false); };
    const onUpdated = updated => {
      setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
      setCommentsFor(prev => (prev && prev.id === updated.id) ? updated : prev);
    };
    socket.on('photos_feed', onFeed);
    socket.on('photo_updated', onUpdated);
    load();
    return () => {
      socket.off('photos_feed', onFeed);
      socket.off('photo_updated', onUpdated);
    };
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function onLike(photoId) {
    socket.emit('like_photo', { photoId });
  }
  function onEcho(photoId) {
    socket.emit('echo_photo', { photoId });
  }
  function onComment(photoId, text) {
    socket.emit('comment_photo', { photoId, text });
  }

  async function onAddPhoto() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.75 });
    if (!result.assets?.[0]?.uri || uploading) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const headers  = await authHeader();
      const formData = new FormData();
      formData.append('photo', { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'photo.jpg' });
      formData.append('username', user?.display_name || user?.username || '');
      formData.append('country',  user?.country || '');
      formData.append('language', user?.language || '');
      await axios.post(`${SERVER_URL}/api/photos/upload`, formData, { headers, timeout: 30000 });
    } catch {
      // silently fall through — matches the pattern used elsewhere for photo uploads
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>World Feed</Text>
        <TouchableOpacity onPress={onAddPhoto} disabled={uploading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {uploading ? <ActivityIndicator color={BOND_PINK} size="small" /> : <Text style={s.add}>+ Post</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={BOND_PINK} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingVertical: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BOND_PINK} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No photos yet</Text>
              <Text style={s.emptySub}>Be the first to share one from your world.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PhotoCard
              photo={item}
              currentUserId={user?.userId}
              onLike={onLike}
              onEcho={onEcho}
              onOpenComments={setCommentsFor}
            />
          )}
        />
      )}

      <CommentsModal
        photo={commentsFor}
        visible={!!commentsFor}
        currentUser={user}
        onClose={() => setCommentsFor(null)}
        onSubmit={onComment}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#08090d' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  back:       { color: BOND_PINK, fontSize: 16, fontWeight: '700' },
  title:      { color: '#fff', fontSize: 17, fontWeight: '800' },
  add:        { color: BOND_PINK, fontSize: 14, fontWeight: '800' },
  empty:      { alignItems: 'center', paddingVertical: 60, gap: 6 },
  emptyTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '800' },
  emptySub:   { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
});
