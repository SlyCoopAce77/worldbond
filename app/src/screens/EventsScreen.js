import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getSocket } from '../services/socket';
import { usePremium } from '../context/PremiumContext';

const EVENT_TYPE_ICONS = {
  watch_party: '🎬', game_night: '🎮', cooking: '🍳', study: '📚',
  music: '🎵', language: '🗣️', travel_talk: '✈️', workout: '💪',
  art: '🎨', just_chill: '😎',
};
const EVENT_TYPES_LIST = [
  { id: 'watch_party', label: 'Watch Party' },
  { id: 'game_night', label: 'Game Night' },
  { id: 'cooking', label: 'Cook Together' },
  { id: 'study', label: 'Study Together' },
  { id: 'music', label: 'Music Sharing' },
  { id: 'language', label: 'Language Practice' },
  { id: 'travel_talk', label: 'Travel Stories' },
  { id: 'workout', label: 'Workout Together' },
  { id: 'art', label: 'Art & Drawing' },
  { id: 'just_chill', label: 'Just Chill' },
];

function CreateEventModal({ visible, onClose, user }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('just_chill');
  const [description, setDescription] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('20');
  const socket = getSocket();

  function submit() {
    if (!title.trim()) return;
    socket.emit('create_event', {
      title: title.trim(), type, description: description.trim(),
      scheduledFor: Date.now(), maxAttendees: parseInt(maxAttendees) || 20,
      language: user.language,
    });
    setTitle(''); setDescription(''); setType('just_chill');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Create an Event</Text>
          <ScrollView contentContainerStyle={{ gap: 14 }}>
            <TextInput
              style={styles.modalInput}
              placeholder="Event title..."
              placeholderTextColor="#555"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
            <Text style={styles.modalLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {EVENT_TYPES_LIST.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeChip, type === t.id && styles.typeChipActive]}
                  onPress={() => setType(t.id)}
                >
                  <Text style={styles.typeChipIcon}>{EVENT_TYPE_ICONS[t.id]}</Text>
                  <Text style={[styles.typeChipText, type === t.id && styles.typeChipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
              placeholder="What's the vibe? Tell people what to expect..."
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Max attendees (default 20)"
              placeholderTextColor="#555"
              value={maxAttendees}
              onChangeText={setMaxAttendees}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.createBtn, !title.trim() && styles.createBtnDisabled]}
              onPress={submit}
              disabled={!title.trim()}
            >
              <Text style={styles.createBtnText}>Create Event 🎉</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function EventChatModal({ visible, event, onClose, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [joined, setJoined] = useState(false);
  const flatRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    if (!visible || !event) return;
    socket.emit('join_event', { eventId: event.id });
    setJoined(true);
    socket.on('event_history', ({ messages: hist }) => setMessages(hist));
    socket.on('event_message', msg => setMessages(prev => [...prev, msg]));
    return () => {
      if (joined) socket.emit('leave_event', { eventId: event?.id });
      socket.off('event_history');
      socket.off('event_message');
    };
  }, [visible, event?.id]);

  useEffect(() => {
    if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  function send() {
    if (!text.trim()) return;
    socket.emit('event_message', { eventId: event.id, text: text.trim() });
    setText('');
  }

  if (!event) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.chatModal}>
        <View style={styles.chatModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.chatModalIcon}>{EVENT_TYPE_ICONS[event.type] || '🎉'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatModalTitle}>{event.title}</Text>
            <Text style={styles.chatModalSub}>{event.attendees?.length || 0} attending · hosted by {event.hostName}</Text>
          </View>
        </View>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={<Text style={styles.emptyChatText}>No messages yet — say hello! 👋</Text>}
          renderItem={({ item }) => {
            const isMine = item.senderId === socket.id;
            return (
              <View style={[styles.msgRow, isMine && styles.msgRowRight]}>
                {!isMine && (
                  <View style={[styles.msgAvatar, { backgroundColor: stringToColor(item.senderName) }]}>
                    <Text style={styles.msgAvatarText}>{item.senderName[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleOther]}>
                  {!isMine && <Text style={styles.msgSender}>{item.senderName} · {item.senderCountry}</Text>}
                  <Text style={styles.msgText}>{item.text}</Text>
                  {item.wasTranslated && <Text style={styles.translatedTag}>🌐 translated</Text>}
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Chat with the group..."
              placeholderTextColor="#888"
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnOff]} onPress={send} disabled={!text.trim()}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function EventsScreen({ user }) {
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { isPro, isPremium } = usePremium();
  const socket = getSocket();

  useEffect(() => {
    socket.emit('get_events');
    socket.on('events_list', setEvents);
    socket.on('event_updated', updatedEvent => {
      setEvents(prev => prev.map(e => e.id === updatedEvent?.id ? updatedEvent : e));
    });
    return () => { socket.off('events_list'); socket.off('event_updated'); };
  }, []);

  function renderEvent({ item }) {
    const spotsLeft = item.maxAttendees - (item.attendees?.length || 0);
    const isFull = spotsLeft <= 0;
    return (
      <TouchableOpacity style={styles.eventCard} onPress={() => setSelectedEvent(item)}>
        <View style={styles.eventTop}>
          <Text style={styles.eventTypeIcon}>{EVENT_TYPE_ICONS[item.type] || '🎉'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventHost}>by {item.hostName} · {item.hostCountry}</Text>
          </View>
          <View style={[styles.spotsBadge, isFull && styles.spotsBadgeFull]}>
            <Text style={styles.spotsBadgeText}>{isFull ? 'Full' : `${spotsLeft} spots`}</Text>
          </View>
        </View>
        {item.description ? <Text style={styles.eventDesc}>{item.description}</Text> : null}
        <View style={styles.eventFooter}>
          <Text style={styles.eventAttendees}>👥 {item.attendees?.length || 0} attending</Text>
          <Text style={styles.eventLang}>💬 {item.language === 'any' ? 'All languages' : item.language?.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Virtual Events 🎉</Text>
          <Text style={styles.subtitle}>Hang out with people worldwide — live</Text>
        </View>
        {isPro && (
          <TouchableOpacity style={styles.createEventBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createEventBtnText}>+ Create</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isPro && (
        <View style={styles.proGate}>
          <Text style={styles.proGateText}>🌟 Upgrade to Pro to create your own events</Text>
        </View>
      )}

      <FlatList
        data={events}
        keyExtractor={e => e.id}
        contentContainerStyle={styles.list}
        renderItem={renderEvent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySub}>{isPro ? 'Create the first one!' : 'Upgrade to Pro to create events'}</Text>
          </View>
        }
      />

      <CreateEventModal visible={showCreate} onClose={() => setShowCreate(false)} user={user} />
      <EventChatModal
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        user={user}
      />
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
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 3 },
  createEventBtn: { backgroundColor: '#6c63ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  createEventBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  proGate: { backgroundColor: '#2a1a0e', marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f59e0b44' },
  proGateText: { color: '#f59e0b', fontSize: 13, textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  eventCard: { backgroundColor: '#1a1a2e', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#2a2a4a', gap: 10 },
  eventTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eventTypeIcon: { fontSize: 32 },
  eventTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  eventHost: { color: '#888', fontSize: 12, marginTop: 2 },
  spotsBadge: { backgroundColor: '#6c63ff22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  spotsBadgeFull: { backgroundColor: '#e5393522' },
  spotsBadgeText: { color: '#6c63ff', fontSize: 12, fontWeight: '600' },
  eventDesc: { color: '#aaa', fontSize: 13, lineHeight: 19 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  eventAttendees: { color: '#888', fontSize: 12 },
  eventLang: { color: '#888', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySub: { color: '#888', fontSize: 13, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  modalLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase' },
  modalInput: { backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#2a2a4a' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: '#2a2a4a', flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeChipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  typeChipIcon: { fontSize: 16 },
  typeChipText: { color: '#888', fontSize: 13 },
  typeChipTextActive: { color: '#fff', fontWeight: '700' },
  createBtn: { backgroundColor: '#6c63ff', borderRadius: 14, padding: 16, alignItems: 'center' },
  createBtnDisabled: { backgroundColor: '#333' },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chatModal: { flex: 1, backgroundColor: '#0f0f1a' },
  chatModalHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a2e', gap: 10 },
  backBtn: { padding: 6 },
  backText: { color: '#6c63ff', fontSize: 22 },
  chatModalIcon: { fontSize: 26 },
  chatModalTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chatModalSub: { color: '#888', fontSize: 11, marginTop: 2 },
  chatList: { padding: 14, gap: 10, flexGrow: 1 },
  emptyChatText: { color: '#888', textAlign: 'center', paddingTop: 40, fontSize: 15 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  msgRowRight: { justifyContent: 'flex-end' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  msgAvatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  msgBubble: { maxWidth: '75%', borderRadius: 14, padding: 10 },
  msgBubbleMine: { backgroundColor: '#6c63ff', borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: '#1a1a2e', borderBottomLeftRadius: 4 },
  msgSender: { color: '#aaa', fontSize: 10, marginBottom: 4 },
  msgText: { color: '#fff', fontSize: 14 },
  translatedTag: { color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 3 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1a1a2e', gap: 8 },
  input: { flex: 1, backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  sendBtn: { backgroundColor: '#6c63ff', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: '#333' },
  sendBtnText: { color: '#fff', fontSize: 18 },
});
