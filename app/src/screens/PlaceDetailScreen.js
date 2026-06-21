import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  Modal, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../services/socket';
import { stringToColor } from '../utils/apiUtils';
import { SAVED_SPOTS_KEY as SAVED_KEY } from '../utils/constants';

const EVENT_TYPES = [
  { key: 'concert',  icon: '🎵', label: 'Concert',      color: '#8b5cf6' },
  { key: 'party',    icon: '🎉', label: 'Party',         color: '#ec4899' },
  { key: 'sports',   icon: '⚽', label: 'Sports Night',  color: '#f97316' },
  { key: 'comedy',   icon: '😂', label: 'Comedy',        color: '#FFB700' },
  { key: 'open mic', icon: '🎙️', label: 'Open Mic',      color: '#22c55e' },
  { key: 'festival', icon: '🎪', label: 'Festival',      color: '#06b6d4' },
  { key: 'special',  icon: '✨', label: 'Special',       color: '#6366f1' },
];

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

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
  const [venueEvents,   setVenueEvents]   = useState([]);
  const [isVenueLive,   setIsVenueLive]   = useState(place?.isLive || false);
  const [showPostEvent, setShowPostEvent] = useState(false);
  const [evtTitle,  setEvtTitle]  = useState('');
  const [evtDate,   setEvtDate]   = useState('');
  const [evtType,   setEvtType]   = useState('concert');
  const [evtDesc,   setEvtDesc]   = useState('');
  const [evtPrice,  setEvtPrice]  = useState('Free');
  const [saved,         setSaved]         = useState(false);
  const flatRef      = useRef(null);
  const checkedInRef = useRef(false);
  const socket       = getSocket();

  // ── Saved spot persistence ──
  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then(raw => {
      if (raw) { try { setSaved(JSON.parse(raw).some(s => s.id === place?.id)); } catch {} }
    });
  }, [place?.id]);

  const toggleSave = useCallback(() => {
    AsyncStorage.getItem(SAVED_KEY).then(raw => {
      let list = [];
      try { list = JSON.parse(raw || '[]'); } catch {}
      const exists = list.some(s => s.id === place.id);
      const next = exists ? list.filter(s => s.id !== place.id) : [...list, place];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      setSaved(!exists);
    });
  }, [place]);

  useEffect(() => {
    function fetchPlaceData() {
      socket.emit('get_place_checkins', { placeId: place?.id });
      socket.emit('get_reviews', { placeId: place?.id });
      socket.emit('get_venue_events', { placeId: place?.id });
    }
    if (socket.connected) fetchPlaceData();
    else socket.once('connect', fetchPlaceData);

    socket.on('place_checkins', ({ placeId, checkins: c }) => {
      if (placeId === place?.id) setCheckins(c);
    });
    socket.on('place_reviews', ({ placeId, reviews: r, avgRating: avg }) => {
      if (placeId === place?.id) { setReviews(r); setAvgRating(avg); }
    });
    socket.on('place_history', ({ placeId, messages: hist }) => {
      if (placeId === place?.id) setMessages(hist);
    });
    socket.on('place_message', msg => setMessages(prev => [...prev, msg]));
    socket.on('venue_events', ({ placeId, events }) => {
      if (placeId === place?.id) setVenueEvents(events || []);
    });
    socket.on('venue_live_update', ({ placeId, isLive }) => {
      if (placeId === place?.id) setIsVenueLive(isLive);
    });

    return () => {
      if (checkedInRef.current) socket.emit('checkout_place', { placeId: place?.id });
      socket.off('place_checkins');
      socket.off('place_reviews');
      socket.off('place_history');
      socket.off('place_message');
      socket.off('venue_events');
      socket.off('venue_live_update');
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && tab === 'chat') {
      flatRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  function toggleCheckin() {
    if (checkedIn) {
      socket.emit('checkout_place', { placeId: place?.id });
      setCheckedIn(false);
      checkedInRef.current = false;
    } else {
      socket.emit('checkin_place', { placeId: place?.id });
      setCheckedIn(true);
      checkedInRef.current = true;
      setTab('chat');
    }
  }

  function sendMessage() {
    if (!text.trim() || !checkedIn) return;
    socket.emit('place_message', { placeId: place?.id, text: text.trim() });
    setText('');
  }

  function toggleVenueLive() {
    if (isVenueLive) {
      Alert.alert('End Live?', 'Stop broadcasting from this venue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Live', style: 'destructive', onPress: () => {
          socket.emit('venue_end_live', { placeId: place?.id });
          setIsVenueLive(false);
        }},
      ]);
    } else {
      socket.emit('venue_go_live', { placeId: place?.id });
      setIsVenueLive(true);
    }
  }

  function submitVenueEvent() {
    if (!evtTitle.trim() || !evtDate.trim()) return Alert.alert('Required', 'Title and date are required');
    socket.emit('post_venue_event', { placeId: place?.id, title: evtTitle, date: evtDate, type: evtType, description: evtDesc, price: evtPrice });
    setEvtTitle(''); setEvtDate(''); setEvtDesc(''); setEvtPrice('Free');
    setShowPostEvent(false);
  }

  function submitReview() {
    if (myRating === 0) return;
    setSubmittingReview(true);
    socket.emit('submit_review', { placeId: place?.id, rating: myRating, text: reviewText.trim() });
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
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.headerName} numberOfLines={1}>{place.name}</Text>
            <Text style={styles.headerCity}>{place.city}, {place.country?.split(' ').slice(1).join(' ')}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.saveBtn, saved && styles.saveBtnOn]} onPress={toggleSave}>
          <Text style={{ fontSize: 18 }}>{saved ? '🔖' : '＋'}</Text>
        </TouchableOpacity>
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

      {/* Venue owner actions */}
      <View style={styles.ownerBar}>
        <TouchableOpacity style={[styles.ownerBtn, isVenueLive && styles.ownerBtnLive]} onPress={toggleVenueLive}>
          <View style={styles.ownerBtnDot} />
          <Text style={[styles.ownerBtnTxt, isVenueLive && { color: '#ff5252' }]}>
            {isVenueLive ? 'End Live' : 'Go Live'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ownerBtn} onPress={() => setShowPostEvent(true)}>
          <Text style={styles.ownerBtnTxt}>📅 Post Event</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {[
          { key: 'info',    icon: '📋', label: 'Info',    badge: null },
          { key: 'events',  icon: '📅', label: 'Events',  badge: venueEvents.length || null },
          { key: 'reviews', icon: '⭐', label: 'Reviews', badge: reviews.length || null },
          { key: 'chat',    icon: '💬', label: 'Chat',    badge: messages.length || null },
          { key: 'people',  icon: '👥', label: 'People',  badge: checkins.length || null },
        ].map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              {t.badge ? (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeTxt, active && styles.tabBadgeTxtActive]}>{t.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
            {(place?.tags || []).map(tag => (
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
            keyExtractor={item => String(item.id)}
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
                    <Text style={styles.reviewAvatarText}>{(r.username?.[0] ?? '?').toUpperCase()}</Text>
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

      {/* EVENTS TAB */}
      {tab === 'events' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          {venueEvents.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 50, gap: 12 }}>
              <Text style={{ fontSize: 42 }}>📅</Text>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>No events posted yet</Text>
              <Text style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>Venue owners can post upcoming concerts, parties, and events.</Text>
              <TouchableOpacity style={styles.postEventCta} onPress={() => setShowPostEvent(true)}>
                <Text style={styles.postEventCtaTxt}>Post the first event →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            venueEvents.map((evt, i) => {
              const et = EVENT_TYPES.find(e => e.key === evt.type) || EVENT_TYPES[0];
              return (
                <View key={evt.id || i} style={[styles.eventCard, { borderLeftColor: et.color }]}>
                  <LinearGradient colors={[et.color + '18', et.color + '06']} style={styles.eventInner}>
                    <View style={styles.eventTop}>
                      <View style={[styles.eventTypeBadge, { backgroundColor: et.color + '22', borderColor: et.color + '55' }]}>
                        <Text style={{ fontSize: 14 }}>{et.icon}</Text>
                        <Text style={[styles.eventTypeTxt, { color: et.color }]}>{et.label}</Text>
                      </View>
                      {evt.price && (
                        <View style={[styles.eventPriceBadge, evt.price === 'Free' ? { backgroundColor: '#22c55e18', borderColor: '#22c55e40' } : { backgroundColor: '#FFB70018', borderColor: '#FFB70040' }]}>
                          <Text style={{ color: evt.price === 'Free' ? '#22c55e' : '#FFB700', fontSize: 12, fontWeight: '800' }}>{evt.price}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.eventTitle}>{evt.title}</Text>
                    <Text style={styles.eventDate}>📅 {formatDate(evt.date)}</Text>
                    {evt.description ? <Text style={styles.eventDesc}>{evt.description}</Text> : null}
                    <Text style={styles.eventPostedBy}>Posted by {evt.postedBy} {evt.postedByCountry}</Text>
                  </LinearGradient>
                </View>
              );
            })
          )}
          <TouchableOpacity style={styles.addEventBtn} onPress={() => setShowPostEvent(true)}>
            <Text style={styles.addEventTxt}>+ Post an Event</Text>
          </TouchableOpacity>
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
      {/* Post Event Modal */}
      <Modal visible={showPostEvent} animationType="slide" transparent onRequestClose={() => setShowPostEvent(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowPostEvent(false)} />
          <View style={styles.evtSheet}>
            <View style={styles.evtHandle} />
            <Text style={styles.evtSheetTitle}>Post Event at {place?.name}</Text>

            <TextInput style={styles.evtInput} placeholder="Event title…" placeholderTextColor="#444" value={evtTitle} onChangeText={setEvtTitle} />
            <TextInput style={styles.evtInput} placeholder="Date & time (e.g. Dec 25, 9pm)…" placeholderTextColor="#444" value={evtDate} onChangeText={setEvtDate} />
            <TextInput style={styles.evtInput} placeholder="Price (e.g. Free, $20, €15)…" placeholderTextColor="#444" value={evtPrice} onChangeText={setEvtPrice} />
            <TextInput style={[styles.evtInput, { minHeight: 70 }]} placeholder="Description (optional)…" placeholderTextColor="#444" value={evtDesc} onChangeText={setEvtDesc} multiline />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {EVENT_TYPES.map(et => (
                <TouchableOpacity key={et.key}
                  style={[styles.evtTypeChip, evtType === et.key && { backgroundColor: et.color + '28', borderColor: et.color }]}
                  onPress={() => setEvtType(et.key)}>
                  <Text>{et.icon}</Text>
                  <Text style={[styles.evtTypeLabel, evtType === et.key && { color: et.color }]}>{et.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.evtSubmitBtn} onPress={submitVenueEvent}>
              <Text style={styles.evtSubmitTxt}>Post Event 📅</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#1C1F23', gap: 10,
  },
  backBtn: { padding: 6 },
  backText: { color: '#6C47FF', fontSize: 22 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { fontSize: 28 },
  headerName: { color: '#fff', fontSize: 15, fontWeight: '700', maxWidth: 160 },
  headerCity: { color: '#888', fontSize: 11, marginTop: 2 },
  saveBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1C1F23',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2F3336',
  },
  saveBtnOn: { backgroundColor: '#6C47FF22', borderColor: '#6C47FF66' },
  checkinBtn: {
    backgroundColor: '#1C1F23', borderRadius: 20, paddingHorizontal: 12,
    paddingVertical: 7, borderWidth: 1, borderColor: '#2F3336',
  },
  checkinBtnActive: { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  checkinBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  liveBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20,
    paddingVertical: 8, backgroundColor: '#1a2a1a',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  liveText: { color: '#4caf50', fontSize: 13, fontWeight: '600' },
  tabBar: { borderBottomWidth: 1, borderBottomColor: '#1C1F23', flexGrow: 0 },
  tabBarContent: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 22, backgroundColor: '#16181C',
    borderWidth: 1, borderColor: '#2F3336',
  },
  tabActive: { backgroundColor: '#6C47FF22', borderColor: '#6C47FF66' },
  tabIcon:  { fontSize: 16 },
  tabLabel: { color: '#666', fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#6C47FF' },
  tabBadge: { backgroundColor: '#2F3336', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: '#6C47FF44' },
  tabBadgeTxt: { color: '#888', fontSize: 11, fontWeight: '800' },
  tabBadgeTxtActive: { color: '#a78bff' },
  infoScroll: { padding: 20, gap: 16 },
  infoCard: { backgroundColor: '#1C1F23', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2F3336' },
  infoDesc: { color: '#ccc', fontSize: 15, lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoItem: { flex: 1, backgroundColor: '#1C1F23', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2F3336' },
  infoItemLabel: { color: '#888', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoItemValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoSectionLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#6C47FF22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { color: '#6C47FF', fontSize: 13 },
  bigCheckinBtn: {
    backgroundColor: '#6C47FF', borderRadius: 14, padding: 16,
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
  lockedBtn: { backgroundColor: '#6C47FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 10 },
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
  bubbleMine: { backgroundColor: '#6C47FF', borderBottomRightRadius: 4 },
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
  sendBtn: { backgroundColor: '#6C47FF', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
  personLang: { backgroundColor: '#6C47FF33', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  personLangText: { color: '#6C47FF', fontSize: 12, fontWeight: '700' },

  // Rating strip
  ratingStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16,
    paddingVertical: 8, backgroundColor: '#1a1a0e',
  },
  ratingStars: { color: '#FFB700', fontSize: 16 },
  ratingValue: { color: '#FFB700', fontWeight: '700', fontSize: 14 },
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
  starIconFilled: { color: '#FFB700' },
  reviewInput: {
    backgroundColor: '#000000', color: '#fff', borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#2F3336',
  },
  submitReviewBtn: {
    backgroundColor: '#6C47FF', borderRadius: 12, padding: 14, alignItems: 'center',
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
  reviewStarsText: { color: '#FFB700', fontSize: 16 },
  reviewText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  reviewDate: { color: '#555', fontSize: 11 },

  // Owner bar
  ownerBar:      { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1C1F23' },
  ownerBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#1C1F23', borderWidth: 1, borderColor: '#2F3336' },
  ownerBtnLive:  { backgroundColor: '#ff525215', borderColor: '#ff525230' },
  ownerBtnDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff5252' },
  ownerBtnTxt:   { color: '#aaa', fontSize: 12, fontWeight: '700' },

  // Events tab
  eventCard:     { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderLeftWidth: 3 },
  eventInner:    { padding: 16, gap: 8 },
  eventTop:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventTypeBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  eventTypeTxt:  { fontSize: 12, fontWeight: '700' },
  eventPriceBadge:{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, marginLeft: 'auto' },
  eventTitle:    { color: '#fff', fontSize: 17, fontWeight: '900' },
  eventDate:     { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  eventDesc:     { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 19 },
  eventPostedBy: { color: '#444', fontSize: 11 },
  addEventBtn:   { backgroundColor: 'rgba(108,71,255,0.12)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(108,71,255,0.25)', marginTop: 4 },
  addEventTxt:   { color: '#6C47FF', fontSize: 14, fontWeight: '700' },
  postEventCta:  { backgroundColor: '#6C47FF', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12 },
  postEventCtaTxt:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  // Post Event modal
  evtSheet:      { backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12, paddingBottom: 44 },
  evtHandle:     { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  evtSheetTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  evtInput:      { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 14, padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#2a2a2a' },
  evtTypeChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  evtTypeLabel:  { color: '#666', fontSize: 13, fontWeight: '600' },
  evtSubmitBtn:  { backgroundColor: '#6C47FF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  evtSubmitTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
});
