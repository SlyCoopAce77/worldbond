import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { getSocket } from '../services/socket';

export default function PlaceDetailScreen({ route, navigation }) {
  const { place, user } = route.params || {};
  const [checkins, setCheckins] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [tab, setTab] = useState('info'); // 'info' | 'chat' | 'people' | 'reviews'
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const flatRef      = useRef(null);
  const checkedInRef = useRef(false);
  const socket       = getSocket();

  useEffect(() => {
    function fetchPlaceData() {
      socket.emit('get_place_checkins', { placeId: place.id });
      socket.emit('get_reviews', { placeId: place.id });
    }
    if (socket.connected) fetchPlaceData();
    else socket.once('connect', fetchPlaceData);

    socket.on('place_checkins', ({ placeId, checkins: c }) => {
      if (placeId === place.id) setCheckins(c);
    });
    socket.on('place_reviews', ({ placeId, reviews: r, avgRating: avg }) => {
      if (placeId === place.id) { setReviews(r); setAvgRating(avg); }
    });
    socket.on('place_history', ({ placeId, messages: hist }) => {
      if (placeId === place.id) setMessages(hist);
    });
    socket.on('place_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      if (checkedInRef.current) socket.emit('checkout_place', { placeId: place.id });
      socket.off('place_checkins');
      socket.off('place_reviews');
      socket.off('place_history');
      socket.off('place_message');
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && tab === 'chat') {
      flatRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  function toggleCheckin() {
    if (checkedIn) {
      socket.emit('checkout_place', { placeId: place.id });
      setCheckedIn(false);
      checkedInRef.current = false;
    } else {
      socket.emit('checkin_place', { placeId: place.id });
      setCheckedIn(true);
      checkedInRef.current = true;
      setTab('chat');
    }
  }

  function sendMessage() {
    if (!text.trim() || !checkedIn) return;
    socket.emit('place_message', { placeId: place.id, text: text.trim() });
    setText('');
  }

  function submitReview() {
    if (myRating === 0) return;
    setSubmittingReview(true);
    socket.emit('submit_review', { placeId: place.id, rating: myRating, text: reviewText.trim() });
    setReviewText('');
    setSubmittingReview(false);
  }

  function renderMessage({ item }) {
    const isMine = item.senderId === socket.id;
    return (
      <View style={[styles.messageRow, isMine && styles.messageRowRight]}>
        {!isMine && (
          <View style={[styles.avatar, { backgroundColor: stringToColor(item.senderName) }]}>
            <Text style={styles.avatarText}>{(item.senderName?.[0] ?? '?').toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && (
            <View style={styles.senderRow}>
              <Text style={styles.senderName}>{item.senderName}</Text>
              <Text style={styles.senderCountry}>{item.senderCountry}</Text>
            </View>
          )}
          <Text style={styles.messageText}>{item.text}</Text>
          {item.wasTranslated && <Text style={styles.translatedTag}>🌐 translated</Text>}
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>{place.typeInfo?.icon || '📍'}</Text>
          <View>
            <Text style={styles.headerName} numberOfLines={1}>{place.name}</Text>
            <Text style={styles.headerCity}>{place.city}, {place.country?.split(' ').slice(1).join(' ')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.checkinBtn, checkedIn && styles.checkinBtnActive]}
          onPress={toggleCheckin}
        >
          <Text style={styles.checkinBtnText}>{checkedIn ? '✓ Here' : '📍 Check in'}</Text>
        </TouchableOpacity>
      </View>

      {/* Live people count */}
      {checkins.length > 0 && (
        <View style={styles.liveBar}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{checkins.length} {checkins.length === 1 ? 'person' : 'people'} here right now</Text>
        </View>
      )}

      {/* Avg rating strip */}
      {avgRating !== null && (
        <View style={styles.ratingStrip}>
          <Text style={styles.ratingStars}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</Text>
          <Text style={styles.ratingValue}>{avgRating} / 5</Text>
          <Text style={styles.ratingCount}>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {['info', 'reviews', 'chat', 'people'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'info' && '📋 Info'}
              {t === 'reviews' && `⭐ Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}`}
              {t === 'chat' && `💬 Chat${messages.length > 0 ? ` (${messages.length})` : ''}`}
              {t === 'people' && `👥 (${checkins.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* INFO TAB */}
      {tab === 'info' && (
        <ScrollView contentContainerStyle={styles.infoScroll}>
          <View style={styles.infoCard}>
            <Text style={styles.infoDesc}>{place.description}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Vibe</Text>
              <Text style={styles.infoItemValue}>{place.vibe}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Best Time</Text>
              <Text style={styles.infoItemValue}>{place.bestTime}</Text>
            </View>
          </View>
          <Text style={styles.infoSectionLabel}>Tags</Text>
          <View style={styles.tagsRow}>
            {place.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.bigCheckinBtn, checkedIn && styles.bigCheckinBtnActive]}
            onPress={toggleCheckin}
          >
            <Text style={styles.bigCheckinBtnText}>
              {checkedIn ? '✓ You are checked in — tap to leave' : '📍 Check In & Join the Chat'}
            </Text>
          </TouchableOpacity>
          {!checkedIn && (
            <Text style={styles.checkinHint}>Check in to chat with people who are here right now</Text>
          )}
        </ScrollView>
      )}

      {/* CHAT TAB */}
      {tab === 'chat' && (
        <>
          {!checkedIn && (
            <View style={styles.lockedBanner}>
              <Text style={styles.lockedText}>📍 Check in to join the conversation</Text>
              <TouchableOpacity style={styles.lockedBtn} onPress={toggleCheckin}>
                <Text style={styles.lockedBtnText}>Check In</Text>
              </TouchableOpacity>
            </View>
          )}
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyChatWrap}>
                <Text style={styles.emptyChatIcon}>{place.typeInfo?.icon || '📍'}</Text>
                <Text style={styles.emptyChatText}>No messages yet at {place.name}</Text>
                <Text style={styles.emptyChatSub}>Check in and say hello to people here!</Text>
              </View>
            }
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          />
          {checkedIn && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Chat with people here..."
                  placeholderTextColor="#888"
                  value={text}
                  onChangeText={setText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                  onPress={sendMessage}
                  disabled={!text.trim()}
                >
                  <Text style={styles.sendBtnText}>➤</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </>
      )}

      {/* REVIEWS TAB */}
      {tab === 'reviews' && (
        <ScrollView contentContainerStyle={styles.reviewsScroll}>
          {/* Write a review */}
          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormTitle}>Rate this spot</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setMyRating(star)} style={styles.starBtn}>
                  <Text style={[styles.starIcon, myRating >= star && styles.starIconFilled]}>
                    {myRating >= star ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Tell people what it's like here... (optional)"
              placeholderTextColor="#555"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.submitReviewBtn, myRating === 0 && styles.submitReviewBtnDisabled]}
              onPress={submitReview}
              disabled={myRating === 0}
            >
              <Text style={styles.submitReviewBtnText}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Text style={styles.emptyReviewsText}>No reviews yet</Text>
              <Text style={styles.emptyReviewsSub}>Be the first to rate this spot!</Text>
            </View>
          ) : (
            reviews.map(r => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: stringToColor(r.username) }]}>
                    <Text style={styles.reviewAvatarText}>{r.username[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewUsername}>{r.username}</Text>
                    <Text style={styles.reviewCountry}>{r.country}</Text>
                  </View>
                  <View style={styles.reviewStars}>
                    <Text style={styles.reviewStarsText}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  </View>
                </View>
                {r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
                <Text style={styles.reviewDate}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* PEOPLE TAB */}
      {tab === 'people' && (
        <FlatList
          data={checkins}
          keyExtractor={item => item.socketId}
          contentContainerStyle={styles.peopleList}
          ListEmptyComponent={
            <View style={styles.emptyPeople}>
              <Text style={styles.emptyPeopleText}>Nobody checked in yet</Text>
              <Text style={styles.emptyPeopleSub}>Be the first one here!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.personCard}>
              <View style={[styles.personAvatar, { backgroundColor: stringToColor(item.username) }]}>
                <Text style={styles.personAvatarText}>{item.username[0].toUpperCase()}</Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{item.username}</Text>
                <Text style={styles.personCountry}>{item.country}</Text>
              </View>
              <View style={styles.personLang}>
                <Text style={styles.personLangText}>{item.language?.toUpperCase()}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function stringToColor(str = '') {
  const colors = ['#e57373', '#ba68c8', '#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#4db6ac', '#7986cb'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#1C1F23', gap: 10,
  },
  backBtn: { padding: 6 },
  backText: { color: '#E8003D', fontSize: 22 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { fontSize: 28 },
  headerName: { color: '#fff', fontSize: 15, fontWeight: '700', maxWidth: 160 },
  headerCity: { color: '#888', fontSize: 11, marginTop: 2 },
  checkinBtn: {
    backgroundColor: '#1C1F23', borderRadius: 20, paddingHorizontal: 12,
    paddingVertical: 7, borderWidth: 1, borderColor: '#2F3336',
  },
  checkinBtnActive: { backgroundColor: '#E8003D', borderColor: '#E8003D' },
  checkinBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  liveBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20,
    paddingVertical: 8, backgroundColor: '#1a2a1a',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  liveText: { color: '#4caf50', fontSize: 13, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1C1F23' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#E8003D' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#E8003D' },
  infoScroll: { padding: 20, gap: 16 },
  infoCard: { backgroundColor: '#1C1F23', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2F3336' },
  infoDesc: { color: '#ccc', fontSize: 15, lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoItem: { flex: 1, backgroundColor: '#1C1F23', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2F3336' },
  infoItemLabel: { color: '#888', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoItemValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoSectionLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#E8003D22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { color: '#E8003D', fontSize: 13 },
  bigCheckinBtn: {
    backgroundColor: '#E8003D', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  bigCheckinBtnActive: { backgroundColor: '#333' },
  bigCheckinBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  checkinHint: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 8 },
  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C1F23', padding: 14, margin: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#2F3336',
  },
  lockedText: { color: '#aaa', fontSize: 13, flex: 1 },
  lockedBtn: { backgroundColor: '#E8003D', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 10 },
  lockedBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  messageList: { padding: 14, gap: 10, flexGrow: 1 },
  emptyChatWrap: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyChatIcon: { fontSize: 48 },
  emptyChatText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  emptyChatSub: { color: '#888', fontSize: 13, textAlign: 'center' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  messageRowRight: { justifyContent: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleMine: { backgroundColor: '#E8003D', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1C1F23', borderBottomLeftRadius: 4 },
  senderRow: { flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'center' },
  senderName: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  senderCountry: { color: '#666', fontSize: 10 },
  messageText: { color: '#fff', fontSize: 15 },
  translatedTag: { color: '#aaa', fontSize: 10, marginTop: 4 },
  timestamp: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, borderTopColor: '#1C1F23', gap: 10,
  },
  input: {
    flex: 1, backgroundColor: '#1C1F23', color: '#fff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#E8003D', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#333' },
  sendBtnText: { color: '#fff', fontSize: 18 },
  peopleList: { padding: 16, gap: 10 },
  emptyPeople: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyPeopleText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  emptyPeopleSub: { color: '#888', fontSize: 13 },
  personCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1F23',
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2F3336',
  },
  personAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  personAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  personInfo: { flex: 1, marginLeft: 12 },
  personName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  personCountry: { color: '#888', fontSize: 12, marginTop: 2 },
  personLang: { backgroundColor: '#E8003D33', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  personLangText: { color: '#E8003D', fontSize: 12, fontWeight: '700' },

  // Rating strip
  ratingStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16,
    paddingVertical: 8, backgroundColor: '#1a1a0e',
  },
  ratingStars: { color: '#f59e0b', fontSize: 16 },
  ratingValue: { color: '#f59e0b', fontWeight: '700', fontSize: 14 },
  ratingCount: { color: '#888', fontSize: 12 },

  // Reviews tab
  reviewsScroll: { padding: 16, gap: 16 },
  reviewForm: {
    backgroundColor: '#1C1F23', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#2F3336', gap: 12,
  },
  reviewFormTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 8 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 32, color: '#444' },
  starIconFilled: { color: '#f59e0b' },
  reviewInput: {
    backgroundColor: '#000000', color: '#fff', borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#2F3336',
  },
  submitReviewBtn: {
    backgroundColor: '#E8003D', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  submitReviewBtnDisabled: { backgroundColor: '#333' },
  submitReviewBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyReviews: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyReviewsText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  emptyReviewsSub: { color: '#888', fontSize: 13 },
  reviewCard: {
    backgroundColor: '#1C1F23', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#2F3336', gap: 10,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  reviewMeta: { flex: 1 },
  reviewUsername: { color: '#fff', fontWeight: '600', fontSize: 14 },
  reviewCountry: { color: '#888', fontSize: 11, marginTop: 1 },
  reviewStars: { alignItems: 'flex-end' },
  reviewStarsText: { color: '#f59e0b', fontSize: 16 },
  reviewText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  reviewDate: { color: '#555', fontSize: 11 },
});
