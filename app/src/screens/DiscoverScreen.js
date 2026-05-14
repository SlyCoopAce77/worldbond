import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { getSocket } from '../services/socket';
import { usePremium } from '../context/PremiumContext';

// ─── DAILY ICEBREAKER ───────────────────────────────────────────────────────

function IcebreakerSection({ user }) {
  const { tierInfo, isPremium } = usePremium();
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState([]);
  const [myAnswer, setMyAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    socket.emit('get_icebreaker');
    socket.on('icebreaker_data', ({ question: q, responses: r }) => {
      setQuestion(q);
      setResponses(r);
    });
    socket.on('icebreaker_responses', ({ responses: r }) => setResponses(r));
    return () => { socket.off('icebreaker_data'); socket.off('icebreaker_responses'); };
  }, []);

  function submit() {
    if (!myAnswer.trim()) return;
    socket.emit('submit_icebreaker', { text: myAnswer.trim() });
    setSubmitted(true);
  }

  const visibleResponses = isPremium ? responses : responses.slice(0, tierInfo.icebreakerResponses);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>💡</Text>
        <View>
          <Text style={styles.sectionTitle}>Today's Icebreaker</Text>
          <Text style={styles.sectionSub}>{responses.length} people answered worldwide</Text>
        </View>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>"{question}"</Text>
      </View>

      {!submitted ? (
        <View style={styles.answerBox}>
          <TextInput
            style={styles.answerInput}
            placeholder="Share your answer with the world..."
            placeholderTextColor="#555"
            value={myAnswer}
            onChangeText={setMyAnswer}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[styles.submitBtn, !myAnswer.trim() && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={!myAnswer.trim()}
          >
            <Text style={styles.submitBtnText}>Share Answer 🌍</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.submittedBanner}>
          <Text style={styles.submittedText}>✓ Your answer is live! Read what others said below.</Text>
        </View>
      )}

      {visibleResponses.map(r => (
        <View key={r.id} style={styles.responseCard}>
          <View style={styles.responseHeader}>
            <Text style={styles.responseFlag}>{r.country?.split(' ')[0]}</Text>
            <Text style={styles.responseName}>{r.username}</Text>
            <Text style={styles.responseCountry}>{r.country?.split(' ').slice(1).join(' ')}</Text>
          </View>
          <Text style={styles.responseText}>{r.text}</Text>
        </View>
      ))}

      {!isPremium && responses.length > tierInfo.icebreakerResponses && (
        <View style={styles.lockedMore}>
          <Text style={styles.lockedMoreText}>
            +{responses.length - tierInfo.icebreakerResponses} more responses — upgrade to Plus to read all
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── RANDOM WORLD CONNECT ────────────────────────────────────────────────────

function RandomConnectSection({ user, navigation }) {
  const [state, setState] = useState('idle'); // 'idle' | 'waiting' | 'connected'
  const [matchedUser, setMatchedUser] = useState(null);
  const [roomKey, setRoomKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const flatRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    socket.on('random_match', ({ matchedUser: mu, roomKey: rk }) => {
      setMatchedUser(mu);
      setRoomKey(rk);
      setState('connected');
      setMessages([]);
    });
    socket.on('random_waiting', () => setState('waiting'));
    socket.on('random_cancelled', () => setState('idle'));
    socket.on('random_message', msg => setMessages(prev => [...prev, msg]));
    return () => {
      socket.off('random_match');
      socket.off('random_waiting');
      socket.off('random_cancelled');
      socket.off('random_message');
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  function connect() {
    setState('waiting');
    socket.emit('join_random_connect');
  }

  function disconnect() {
    socket.emit('leave_random_connect');
    setState('idle');
    setMatchedUser(null);
    setRoomKey(null);
    setMessages([]);
  }

  function sendMsg() {
    if (!text.trim() || !roomKey) return;
    socket.emit('random_message', { roomKey, text: text.trim() });
    setText('');
  }

  if (state === 'connected' && matchedUser) {
    return (
      <View style={[styles.section, { flex: 1 }]}>
        <View style={styles.randomConnectedHeader}>
          <View style={styles.randomMatchAvatar}>
            <Text style={styles.randomMatchAvatarText}>{matchedUser.username[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.randomMatchName}>{matchedUser.username}</Text>
            <Text style={styles.randomMatchCountry}>{matchedUser.country}</Text>
          </View>
          <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
            <Text style={styles.disconnectBtnText}>End</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.randomChatBox}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: 10, gap: 8 }}
            ListEmptyComponent={<Text style={styles.randomChatEmpty}>Say hello! 👋</Text>}
            renderItem={({ item }) => {
              const isMine = item.senderId === socket.id;
              return (
                <View style={[styles.rndRow, isMine && styles.rndRowRight]}>
                  <View style={[styles.rndBubble, isMine ? styles.rndBubbleMine : styles.rndBubbleOther]}>
                    <Text style={styles.rndText}>{item.text}</Text>
                    {item.wasTranslated && <Text style={styles.translatedTag}>🌐 translated</Text>}
                  </View>
                </View>
              );
            }}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.rndInputRow}>
            <TextInput
              style={styles.rndInput}
              placeholder="Say something..."
              placeholderTextColor="#888"
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity style={[styles.rndSendBtn, !text.trim() && styles.rndSendBtnOff]} onPress={sendMsg} disabled={!text.trim()}>
              <Text style={styles.rndSendText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>🌀</Text>
        <View>
          <Text style={styles.sectionTitle}>Random World Connect</Text>
          <Text style={styles.sectionSub}>Meet a stranger from another country</Text>
        </View>
      </View>
      <View style={styles.randomCard}>
        <Text style={styles.randomCardTitle}>
          {state === 'waiting' ? 'Finding someone for you...' : 'Ready to meet the world?'}
        </Text>
        <Text style={styles.randomCardSub}>
          {state === 'waiting'
            ? 'Matching you with someone from a different country 🌍'
            : 'Tap below to be matched with a random person from a different country. Messages auto-translate!'}
        </Text>
        {state === 'waiting' ? (
          <TouchableOpacity style={styles.cancelBtn} onPress={disconnect}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.connectBtn} onPress={connect}>
            <Text style={styles.connectBtnText}>🌀 Connect with a Stranger</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── LANGUAGE EXCHANGE ───────────────────────────────────────────────────────

function LanguageExchangeSection({ user, navigation }) {
  const [matches, setMatches] = useState([]);
  const socket = getSocket();
  const { isPro } = usePremium();

  useEffect(() => {
    socket.on('user_list', users => {
      const me = users.find(u => u.socketId === socket.id);
      if (!me) return;
      // Find people who speak my target language and want to learn mine
      const found = users.filter(u =>
        u.socketId !== socket.id &&
        u.language !== me.language
      ).slice(0, 10);
      setMatches(found);
    });
    socket.emit('get_users');
    return () => socket.off('user_list');
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>🗣️</Text>
        <View>
          <Text style={styles.sectionTitle}>Language Exchange</Text>
          <Text style={styles.sectionSub}>Practice with native speakers</Text>
        </View>
      </View>
      {!isPro && (
        <View style={styles.proGate}>
          <Text style={styles.proGateText}>🌟 Pro feature — upgrade to get language exchange matching</Text>
        </View>
      )}
      {matches.length === 0 ? (
        <Text style={styles.noMatchText}>No language partners online right now</Text>
      ) : (
        matches.map(u => (
          <TouchableOpacity
            key={u.socketId}
            style={styles.langCard}
            onPress={() => navigation.navigate('Chat', { otherUser: u, currentUser: user })}
          >
            <View style={styles.langAvatar}>
              <Text style={styles.langAvatarText}>{u.username[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.langName}>{u.username}</Text>
              <Text style={styles.langDetail}>{u.country} · speaks {u.language?.toUpperCase()}</Text>
            </View>
            <View style={styles.langExchangeBadge}>
              <Text style={styles.langExchangeText}>{user.language?.toUpperCase()} ↔ {u.language?.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ─── MAIN DISCOVER SCREEN ────────────────────────────────────────────────────

export default function DiscoverScreen({ navigation, user }) {
  const [tab, setTab] = useState('icebreaker');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover 🔍</Text>
        <Text style={styles.subtitle}>New ways to connect with the world</Text>
      </View>

      <View style={styles.tabs}>
        {[
          { id: 'icebreaker', label: '💡 Icebreaker' },
          { id: 'random', label: '🌀 Random' },
          { id: 'language', label: '🗣️ Language' },
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'icebreaker' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <IcebreakerSection user={user} />
        </ScrollView>
      )}
      {tab === 'random' && (
        <View style={{ flex: 1 }}>
          <RandomConnectSection user={user} navigation={navigation} />
        </View>
      )}
      {tab === 'language' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <LanguageExchangeSection user={user} navigation={navigation} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 3 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#6c63ff' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#6c63ff' },
  scroll: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { fontSize: 28 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  sectionSub: { color: '#888', fontSize: 12, marginTop: 2 },
  questionCard: {
    backgroundColor: '#1a1a3e', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#6c63ff44',
  },
  questionText: { color: '#fff', fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
  answerBox: { gap: 10 },
  answerInput: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  submitBtn: { backgroundColor: '#6c63ff', borderRadius: 12, padding: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#333' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  submittedBanner: { backgroundColor: '#1a3a1a', borderRadius: 12, padding: 12 },
  submittedText: { color: '#4caf50', fontSize: 13, fontWeight: '600' },
  responseCard: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2a2a4a', gap: 8,
  },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  responseFlag: { fontSize: 20 },
  responseName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  responseCountry: { color: '#888', fontSize: 11 },
  responseText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  lockedMore: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#6c63ff44' },
  lockedMoreText: { color: '#6c63ff', fontSize: 13, textAlign: 'center' },
  randomCard: {
    backgroundColor: '#1a1a2e', borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#2a2a4a',
  },
  randomCardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  randomCardSub: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  connectBtn: { backgroundColor: '#6c63ff', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { backgroundColor: '#333', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  cancelBtnText: { color: '#fff', fontSize: 15 },
  randomConnectedHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e', gap: 10, margin: 16, marginBottom: 0,
    backgroundColor: '#1a1a2e', borderRadius: 14,
  },
  randomMatchAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6c63ff', alignItems: 'center', justifyContent: 'center' },
  randomMatchAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  randomMatchName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  randomMatchCountry: { color: '#888', fontSize: 12 },
  disconnectBtn: { backgroundColor: '#e53935', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  disconnectBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  randomChatBox: { flex: 1, marginTop: 10 },
  randomChatEmpty: { color: '#888', textAlign: 'center', paddingTop: 30, fontSize: 15 },
  rndRow: { flexDirection: 'row', marginBottom: 6 },
  rndRowRight: { justifyContent: 'flex-end' },
  rndBubble: { maxWidth: '75%', borderRadius: 14, padding: 10 },
  rndBubbleMine: { backgroundColor: '#6c63ff' },
  rndBubbleOther: { backgroundColor: '#1a1a2e' },
  rndText: { color: '#fff', fontSize: 14 },
  translatedTag: { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 3 },
  rndInputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#1a1a2e' },
  rndInput: { flex: 1, backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  rndSendBtn: { backgroundColor: '#6c63ff', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  rndSendBtnOff: { backgroundColor: '#333' },
  rndSendText: { color: '#fff', fontSize: 18 },
  proGate: { backgroundColor: '#2a1a0e', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f59e0b44' },
  proGateText: { color: '#f59e0b', fontSize: 13, textAlign: 'center' },
  noMatchText: { color: '#888', fontSize: 14, textAlign: 'center', paddingTop: 20 },
  langCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2a4a', gap: 12 },
  langAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#6c63ff', alignItems: 'center', justifyContent: 'center' },
  langAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  langName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  langDetail: { color: '#888', fontSize: 12, marginTop: 2 },
  langExchangeBadge: { backgroundColor: '#6c63ff22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  langExchangeText: { color: '#6c63ff', fontSize: 11, fontWeight: '700' },
});
