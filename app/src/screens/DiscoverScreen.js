import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView,
  Platform, Animated, Image, RefreshControl, ActivityIndicator,
  Dimensions, Modal, Alert, PanResponder,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getSocket, SERVER_URL } from '../services/socket';
import { useBondPass } from '../context/PremiumContext';

const BOND_PINK = '#FF0080';
import { useTheme } from '../context/ThemeContext';
import { getCountryFlag, getCountryName } from '../utils/countryUtils';
import { WorldMark } from '../components/BondLogo';

const { width } = Dimensions.get('window');
const TABS = [
  { id: 'icebreaker', label: 'Icebreaker' },
  { id: 'random',     label: 'Connect'    },
  { id: 'people',     label: 'People'     },
];
const TAB_W = width / TABS.length;



import { stringToColor, authHeader } from '../utils/apiUtils';

const CT_META = {
  dating:     { emoji:'❤️',  label:'Dating',           color:'#e91e63' },
  friendship: { emoji:'🤝',  label:'Friends',          color:'#2196f3' },
  travel:     { emoji:'✈️',  label:'Travel',           color:'#ff9800' },
  language:   { emoji:'💬',  label:'Language Exchange', color:'#9c27b0' },
  mentorship: { emoji:'🎓',  label:'Mentorship',       color:'#57f287' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ photo_url, name, size = 44 }) {
  const color = stringToColor(name || '');
  if (photo_url) return <Image source={{ uri: photo_url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: size * 0.42 }}>{(name || '?')[0].toUpperCase()}</Text>
    </View>
  );
}

// ─── Icebreaker tab ───────────────────────────────────────────────────────────
function IcebreakerTab({ user, navigation }) {
  const [question,         setQuestion]         = useState('');
  const [responses,        setResponses]        = useState([]);
  const [myAnswer,         setMyAnswer]         = useState('');
  const [myAnswerText,     setMyAnswerText]     = useState('');
  const [submitted,        setSubmitted]        = useState(false);
  const [likedIds,         setLikedIds]         = useState(new Set());
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [commentTexts,     setCommentTexts]     = useState({});
  const [likedCommentIds,  setLikedCommentIds]  = useState(new Set());
  const [myResponseId,     setMyResponseId]     = useState(null);
  const scrollRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    if (socket.connected) socket.emit('get_icebreaker');
    else socket.once('connect', () => socket.emit('get_icebreaker'));

    socket.on('icebreaker_data', ({ question: q, responses: r }) => {
      setQuestion(q);
      setResponses(r);
      // Restore like state from server (likedByMe flags)
      const ids = new Set();
      const cIds = new Set();
      r.forEach(resp => {
        if (resp.likedByMe) ids.add(resp.id);
        (resp.comments || []).forEach(c => {
          if (c.likedByMe) cIds.add(`${resp.id}:${c.id}`);
        });
      });
      setLikedIds(ids);
      setLikedCommentIds(cIds);
      // Restore submitted state if user already answered; reset if server lost the data
      const myUserId = user?.userId;
      if (myUserId) {
        const mine = r.find(resp => resp.userId === myUserId);
        if (mine) {
          setSubmitted(true);
          setMyAnswerText(mine.text);
          setMyResponseId(mine.id);
        } else {
          setSubmitted(false);
          setMyAnswerText('');
          setMyAnswer('');
          setMyResponseId(null);
        }
      }
    });

    socket.on('icebreaker_responses', ({ responses: r }) => setResponses(r));
    return () => { socket.off('icebreaker_data'); socket.off('icebreaker_responses'); };
  }, []);

  function submit() {
    if (!myAnswer.trim()) return;
    socket.emit('submit_icebreaker', { text: myAnswer.trim() });
    setMyAnswerText(myAnswer.trim());
    setSubmitted(true);
  }

  function handleDeleteResponse() {
    if (!myResponseId) return;
    Alert.alert(
      'Delete your answer?',
      'This will remove your response and all reactions to it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            socket.emit('delete_icebreaker_response', { responseId: myResponseId });
            setSubmitted(false);
            setMyAnswerText('');
            setMyAnswer('');
            setMyResponseId(null);
          },
        },
      ],
    );
  }

  function handleLike(responseId) {
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(responseId) ? next.delete(responseId) : next.add(responseId);
      return next;
    });
    socket.emit('like_icebreaker_response', { responseId });
  }

  function toggleComments(responseId) {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(responseId) ? next.delete(responseId) : next.add(responseId);
      return next;
    });
  }

  function submitComment(responseId) {
    const text = (commentTexts[responseId] || '').trim();
    if (!text || !submitted) return;
    socket.emit('add_icebreaker_comment', { responseId, text });
    setCommentTexts(prev => ({ ...prev, [responseId]: '' }));
  }

  function handleLikeComment(responseId, commentId) {
    if (!submitted) return;
    const key = `${responseId}:${commentId}`;
    setLikedCommentIds(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    socket.emit('like_icebreaker_comment', { responseId, commentId });
  }

  function handleDeleteComment(responseId, commentId) {
    socket.emit('delete_icebreaker_comment', { responseId, commentId });
    const key = `${responseId}:${commentId}`;
    setLikedCommentIds(prev => { const next = new Set(prev); next.delete(key); return next; });
  }

  function goToProfile(r) {
    if (!r.userId) return;
    navigation.navigate('Profile', {
      profileUser: { userId: r.userId, username: r.username, photo_url: r.photo_url, country: r.country, language: r.language },
      bondUserId: r.userId,
    });
  }

  const visible = responses;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
    <ScrollView ref={scrollRef} contentContainerStyle={tab.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Question card */}
      <LinearGradient colors={['#0d0014', '#1a0033', '#000000']} style={tab.questionCard}>
        <View style={tab.questionTop}>
          <View style={tab.questionBadge}>
            <View style={tab.questionDot} />
            <Text style={tab.questionBadgeText}>🔥 Daily Question</Text>
          </View>
          <Text style={tab.responseCount}>{responses.length} answered 🌍</Text>
        </View>
        <Text style={tab.questionText}>"{question || 'Loading today\'s question…'}"</Text>
        <View style={tab.questionFooter}>
          <Text style={tab.questionFooterTxt}>🕛 New question drops at midnight UTC</Text>
        </View>
      </LinearGradient>

      {/* Answer box — shows input before submit, stays as card after */}
      {!submitted ? (
        <View style={tab.answerWrap}>
          <TextInput
            style={tab.answerInput}
            placeholder="Share your honest answer with people worldwide…"
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={myAnswer}
            onChangeText={setMyAnswer}
            multiline
            maxLength={200}
          />
          <View style={tab.answerFooter}>
            <Text style={tab.charCount}>{myAnswer.length}/200</Text>
            <TouchableOpacity
              style={[tab.submitBtn, !myAnswer.trim() && { opacity: 0.4 }]}
              onPress={submit}
              disabled={!myAnswer.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[BOND_PINK, '#CC0060']} style={tab.submitGrad}>
                <Text style={tab.submitText}>Share with the World 🌍</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* My answer stays visible as a pinned card */
        <View style={tab.myAnswerCard}>
          <View style={tab.myAnswerHeader}>
            <Avatar photo_url={user?.photo_url} name={user?.username} size={36} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={tab.myAnswerName}>{user?.username || 'You'}</Text>
                <View style={tab.liveBadge}>
                  <View style={tab.liveDot} />
                  <Text style={tab.liveBadgeText}>LIVE</Text>
                </View>
              </View>
              <Text style={tab.myAnswerMeta}>
                {getCountryFlag(user?.country)}  {getCountryName(user?.country)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleDeleteResponse} activeOpacity={0.7} style={tab.myAnswerDeleteBtn}>
              <Text style={tab.myAnswerDeleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={tab.myAnswerText}>{myAnswerText}</Text>
        </View>
      )}

      {/* Responses */}
      {visible.length > 0 && (
        <View style={tab.responsesWrap}>
          <Text style={tab.responsesLabel}>
            {submitted ? `${responses.length} people answered` : 'Share your answer to interact ↑'}
          </Text>
          {visible.map(r => {
            const isLiked          = likedIds.has(r.id);
            const flag             = getCountryFlag(r.country);
            const countryName      = getCountryName(r.country);
            const likeCount        = r.likes || 0;
            const comments         = r.comments || [];
            const commentCount     = comments.length;
            const commentsOpen     = expandedComments.has(r.id);

            return (
              <View key={r.id} style={tab.responseCard}>
                {/* Header: avatar + name + flag */}
                <TouchableOpacity
                  style={tab.responseUserRow}
                  onPress={() => goToProfile(r)}
                  activeOpacity={r.userId ? 0.7 : 1}
                  disabled={!r.userId}
                >
                  <Avatar photo_url={r.photo_url} name={r.username} size={44} />
                  <View style={tab.responseInfo}>
                    <View style={tab.responseNameRow}>
                      <Text style={tab.responseName}>{r.username}</Text>
                      {r.userId && <Text style={tab.profileChevron}>›</Text>}
                    </View>
                    <View style={tab.responseLocationRow}>
                      <Text style={tab.responseFlag}>{flag}</Text>
                      {countryName ? <Text style={tab.responseCountry}>{countryName}</Text> : null}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Response text */}
                <Text style={tab.responseText}>{r.text}</Text>

                {/* Footer: like + comment */}
                <View style={tab.responseFooter}>
                  <TouchableOpacity
                    style={tab.footerBtn}
                    onPress={() => handleLike(r.id)}
                    activeOpacity={submitted ? 0.7 : 1}
                    disabled={!submitted}
                  >
                    <Text style={[tab.likeIcon, isLiked && tab.likeIconActive]}>
                      👣
                    </Text>
                    <Text style={[tab.footerCount, isLiked && tab.likeCountActive]}>
                      {likeCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[tab.footerBtn, { marginLeft: 24 }]}
                    onPress={() => toggleComments(r.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[tab.commentIcon, commentsOpen && tab.commentIconActive]}>💬</Text>
                    <Text style={[tab.footerCount, commentsOpen && tab.commentCountActive]}>
                      {commentCount}
                    </Text>
                  </TouchableOpacity>

                  {!submitted && (
                    <Text style={tab.likeHint}>Share your answer to interact</Text>
                  )}
                </View>

                {/* Expandable comment section */}
                {commentsOpen && (
                  <View style={tab.commentsSection}>
                    {comments.length === 0 && (
                      <Text style={tab.noComments}>No replies yet — be the first!</Text>
                    )}
                    {comments.map((c, cIdx) => {
                      const cKey      = `${r.id}:${c.id}`;
                      const cLiked    = likedCommentIds.has(cKey);
                      const cFlag     = getCountryFlag(c.country);
                      const isLastC   = cIdx === comments.length - 1;
                      return (
                        <View key={c.id} style={tab.commentItem}>
                          {/* Thread rail: logo node + vertical line */}
                          <View style={tab.threadRail}>
                            <View style={tab.threadNode}>
                              <WorldMark size={8} color={BOND_PINK} bondColor={BOND_PINK} />
                            </View>
                            {!isLastC && <View style={tab.threadLine} />}
                          </View>
                          {/* Comment content */}
                          <View style={tab.commentBody}>
                            <View style={tab.commentMeta}>
                              <Avatar photo_url={c.photo_url} name={c.username} size={26} />
                              <Text style={tab.commentName}>{c.username}</Text>
                              <Text style={tab.commentFlag}>{cFlag}</Text>
                            </View>
                            <Text style={tab.commentText}>{c.text}</Text>
                            <View style={tab.commentActions}>
                              <TouchableOpacity
                                style={tab.commentLikeBtn}
                                onPress={() => handleLikeComment(r.id, c.id)}
                                activeOpacity={submitted ? 0.7 : 1}
                                disabled={!submitted}
                              >
                                <Text style={[tab.commentLikeIcon, cLiked && tab.likeIconActive]}>
                                  👣
                                </Text>
                                {(c.likes > 0) && (
                                  <Text style={[tab.commentLikeCount, cLiked && tab.likeCountActive]}>
                                    {c.likes}
                                  </Text>
                                )}
                              </TouchableOpacity>
                              {c.userId === user?.userId && (
                                <TouchableOpacity
                                  style={tab.commentDeleteBtn}
                                  onPress={() => handleDeleteComment(r.id, c.id)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={tab.commentDeleteIcon}>✕</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}

                    {/* Reply input — only when user has submitted */}
                    {submitted ? (
                      <View style={tab.commentInputRow}>
                        <Avatar photo_url={user?.photo_url} name={user?.username} size={30} />
                        <TextInput
                          style={tab.commentInput}
                          placeholder="Write a reply…"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={commentTexts[r.id] || ''}
                          onChangeText={t => setCommentTexts(prev => ({ ...prev, [r.id]: t }))}
                          maxLength={150}
                          returnKeyType="send"
                          onSubmitEditing={() => submitComment(r.id)}
                          onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)}
                        />
                        <TouchableOpacity
                          style={[tab.commentSendBtn, !(commentTexts[r.id]?.trim()) && { opacity: 0.35 }]}
                          onPress={() => submitComment(r.id)}
                          disabled={!commentTexts[r.id]?.trim()}
                        >
                          <Text style={tab.commentSendIcon}>➤</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={tab.replyHint}>Share your answer to reply</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

    </ScrollView>
    </KeyboardAvoidingView>
  );
}
const tab = StyleSheet.create({
  scroll:            { padding: 20, gap: 18, paddingBottom: 60 },

  questionCard:      { borderRadius: 24, padding: 22, gap: 14, borderWidth: 1, borderColor: 'rgba(232,0,61,0.25)' },
  questionTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questionDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: BOND_PINK },
  questionBadgeText: { color: BOND_PINK, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  responseCount:     { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' },
  questionText:      { color: '#ffffff', fontSize: 19, lineHeight: 30, fontStyle: 'italic', fontWeight: '600', letterSpacing: 0.1 },
  questionFooter:    { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
  questionFooterTxt: { color: 'rgba(255,255,255,0.28)', fontSize: 11, fontWeight: '600' },

  answerWrap:        { gap: 12 },
  answerInput:       { backgroundColor: '#1e1e2e', color: '#ffffff', borderRadius: 18, padding: 16, fontSize: 15, minHeight: 95, textAlignVertical: 'top', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)', lineHeight: 23 },
  answerFooter:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  charCount:         { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  submitBtn:         { borderRadius: 16, overflow: 'hidden' },
  submitGrad:        { paddingHorizontal: 22, paddingVertical: 13 },
  submitText:        { color: '#fff', fontSize: 14, fontWeight: '800' },

  myAnswerCard:       { backgroundColor: 'rgba(232,0,61,0.1)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(232,0,61,0.3)', gap: 12 },
  myAnswerHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  myAnswerName:       { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  myAnswerMeta:       { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  myAnswerText:       { color: '#ffffff', fontSize: 15, lineHeight: 24 },
  myAnswerDeleteBtn:  { padding: 6, marginLeft: 4 },
  myAnswerDeleteIcon: { color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '700' },
  liveBadge:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BOND_PINK, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  liveDot:           { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText:     { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

  responsesWrap:     { gap: 12 },
  responsesLabel:    { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },

  responseCard:        { backgroundColor: '#151520', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 12 },
  responseUserRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  responseInfo:        { flex: 1, gap: 4 },
  responseNameRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  responseName:        { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  profileChevron:      { color: 'rgba(255,255,255,0.3)', fontSize: 18, fontWeight: '300' },
  responseLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  responseFlag:        { fontSize: 20 },
  responseCountry:     { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  responseText:        { color: '#ffffff', fontSize: 15, lineHeight: 24, fontWeight: '400' },

  responseFooter:    { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 10 },
  footerBtn:         { flexDirection: 'row', alignItems: 'center', gap: 7 },
  likeIcon:          { fontSize: 20, opacity: 0.3 },
  likeIconActive:    { opacity: 1 },
  footerCount:       { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  likeCountActive:   { color: BOND_PINK },
  commentIcon:       { fontSize: 20 },
  commentIconActive: { },
  commentCountActive:{ color: '#57c4ff' },
  likeHint:          { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontStyle: 'italic', marginLeft: 'auto' },

  commentsSection:   { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 12, gap: 12 },
  noComments:        { color: 'rgba(255,255,255,0.25)', fontSize: 12, fontStyle: 'italic', textAlign: 'center', paddingVertical: 4 },
  replyHint:         { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontStyle: 'italic', textAlign: 'center' },

  commentItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 52 },
  threadRail:        { width: 20, alignItems: 'center', paddingTop: 2 },
  threadNode:        { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF008015', borderWidth: 1.5, borderColor: '#FF008050', alignItems: 'center', justifyContent: 'center' },
  threadLine:        { width: 2, flex: 1, marginTop: 3, backgroundColor: '#FF008025', borderRadius: 1, minHeight: 20 },
  commentBody:       { flex: 1, gap: 5, paddingBottom: 8 },
  commentMeta:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentName:       { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  commentFlag:       { fontSize: 14 },
  commentText:       { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 },
  commentActions:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 },
  commentLikeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentLikeIcon:   { fontSize: 14, opacity: 0.3 },
  commentLikeCount:  { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.35)' },
  commentDeleteBtn:  { paddingHorizontal: 2 },
  commentDeleteIcon: { fontSize: 12, color: 'rgba(255,255,255,0.22)' },

  commentInputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  commentInput:      { flex: 1, color: '#ffffff', fontSize: 13, paddingVertical: 6 },
  commentSendBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: BOND_PINK, alignItems: 'center', justifyContent: 'center' },
  commentSendIcon:   { color: '#fff', fontSize: 14 },

});

// ─── Signal Trail Discovery ───────────────────────────────────────────────────

function buildSignalCfg(hasBondPass) {
  return {
    color:       hasBondPass ? BOND_PINK : '#555555',
    ringColor:   hasBondPass ? BOND_PINK + '55' : '#33333388',
    ringCount:   hasBondPass ? 3 : 1,
    bars:        hasBondPass ? 3 : 1,
    upgradeHint: hasBondPass ? null : 'Get Bond Pass for a stronger signal',
    lockTitle:   hasBondPass ? 'Finding your match…' : 'Searching…',
    lockSub:     hasBondPass ? 'Unlimited bonds' : '5 bonds/day',
  };
}

function SignalBars({ count, activeCount, color, size = 4 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{
          width: size,
          height: size + i * (size * 0.8),
          borderRadius: 1.5,
          backgroundColor: i < activeCount ? color : '#1e2028',
        }} />
      ))}
    </View>
  );
}

const DEMO_SIGNALS = [
  {
    id: 'd1', name: 'Kenji',  initials: 'KT', age: 26, flag: '🇯🇵', country: 'Japan',    username: '@kenji_tokyo',
    trail: ['🇯🇵', '🇧🇷', '🇳🇬', '🇮🇳'], strength: 91, freq: 'cultural',  online: true,
    tagline: 'Exploring world music & art 🎵',   avatarColor: '#6C47FF',
    bio: 'Music producer & culture traveller. I\'ve played in bands across 3 continents and still searching for the perfect beat. Let\'s talk art, food, and everything in between.',
    interests: ['🎵 Music', '🎨 Art', '🌍 Travel', '🍜 Food', '🎭 Culture'],
    photos: [null, null, null],
  },
  {
    id: 'd2', name: 'Amara',  initials: 'AL', age: 23, flag: '🇳🇬', country: 'Nigeria',  username: '@amara_lagos',
    trail: ['🇳🇬', '🇬🇭', '🇵🇹', '🇸🇪'], strength: 78, freq: 'friends',   online: true,
    tagline: 'Looking for genuine connection',    avatarColor: '#00b894',
    bio: 'Software engineer by day, storyteller by night. I believe every person carries a unique world inside them — I want to hear yours.',
    interests: ['💻 Tech', '📚 Books', '🌿 Nature', '✍️ Writing'],
    photos: [null, null, null],
  },
  {
    id: 'd3', name: 'Lucas',  initials: 'LS', age: 29, flag: '🇧🇷', country: 'Brazil',   username: '@lucas_sp',
    trail: ['🇧🇷', '🇦🇷', '🇯🇵', '🇺🇸'], strength: 72, freq: 'adventure', online: false,
    tagline: 'Digital nomad · always moving ✈️', avatarColor: '#e17055',
    bio: 'Remote designer living out of a backpack. Currently in Asia, was in Europe last month. Ask me about the best street food anywhere in the world.',
    interests: ['✈️ Travel', '🎨 Design', '🍢 Street Food', '📸 Photography'],
    photos: [null, null, null],
  },
  {
    id: 'd4', name: 'Sofia',  initials: 'SS', age: 25, flag: '🇸🇪', country: 'Sweden',   username: '@sofia_stockholm',
    trail: ['🇸🇪', '🇩🇪', '🇫🇷', '🇮🇳'], strength: 65, freq: 'cultural',  online: true,
    tagline: 'Language nerd · speaks 4 languages', avatarColor: '#0984e3',
    bio: 'Fluent in Swedish, German, French and Hindi. Learning Mandarin. I think language is the most beautiful bridge between cultures.',
    interests: ['🗣️ Languages', '📖 Literature', '🎻 Classical Music', '🌸 Mindfulness'],
    photos: [null, null, null],
  },
  {
    id: 'd5', name: 'Priya',  initials: 'PM', age: 24, flag: '🇮🇳', country: 'India',    username: '@priya_mumbai',
    trail: ['🇮🇳', '🇦🇪', '🇬🇧', '🇧🇷'], strength: 60, freq: 'romantic',  online: false,
    tagline: 'Coffee lover · global art explorer ☕', avatarColor: '#e91e63',
    bio: 'Architect with a passion for public art installations. My dream is to leave something beautiful in every city I visit. Coffee is my love language.',
    interests: ['🏛️ Architecture', '☕ Coffee', '🎨 Art', '🌆 Cities', '📷 Photos'],
    photos: [null, null, null],
  },
  {
    id: 'd6', name: 'Yusuf',  initials: 'YC', age: 28, flag: '🇪🇬', country: 'Egypt',    username: '@yusuf_cairo',
    trail: ['🇪🇬', '🇸🇦', '🇹🇷', '🇩🇪'], strength: 54, freq: 'friends',   online: true,
    tagline: 'History buff · open to all cultures', avatarColor: '#fdcb6e',
    bio: 'Archaeologist working on digs across the Middle East. History isn\'t just the past — it\'s the map to understanding every culture alive today.',
    interests: ['🏺 History', '📜 Archaeology', '🕌 Architecture', '🌍 Culture'],
    photos: [null, null, null],
  },
  {
    id: 'd7', name: 'Lucia',  initials: 'LC', age: 22, flag: '🇲🇽', country: 'Mexico',   username: '@lucia_cdmx',
    trail: ['🇲🇽', '🇨🇴', '🇪🇸', '🇯🇵'], strength: 49, freq: 'adventure', online: true,
    tagline: 'Salsa & street food enthusiast 🌮', avatarColor: '#a29bfe',
    bio: 'Dance instructor & foodie. Salsa is my therapy and tacos are my religion. Looking for people who want to actually experience life, not just scroll through it.',
    interests: ['💃 Dance', '🌮 Food', '🎶 Latin Music', '✈️ Adventure'],
    photos: [null, null, null],
  },
];

const GENDER_OPTIONS_FP = [
  { id: 'everyone', label: 'Everyone', icon: '🌍', color: BOND_PINK },
  { id: 'women',    label: 'Women',    icon: '👩', color: '#e91e63' },
  { id: 'men',      label: 'Men',      icon: '👨', color: '#0984e3' },
];

const ALL_COUNTRIES = [
  { code: null,  flag: '🌍', name: 'Anywhere'         },
  { code: 'AF',  flag: '🇦🇫', name: 'Afghanistan'     },
  { code: 'AL',  flag: '🇦🇱', name: 'Albania'         },
  { code: 'DZ',  flag: '🇩🇿', name: 'Algeria'         },
  { code: 'AD',  flag: '🇦🇩', name: 'Andorra'         },
  { code: 'AO',  flag: '🇦🇴', name: 'Angola'          },
  { code: 'AG',  flag: '🇦🇬', name: 'Antigua & Barbuda'},
  { code: 'AR',  flag: '🇦🇷', name: 'Argentina'       },
  { code: 'AM',  flag: '🇦🇲', name: 'Armenia'         },
  { code: 'AU',  flag: '🇦🇺', name: 'Australia'       },
  { code: 'AT',  flag: '🇦🇹', name: 'Austria'         },
  { code: 'AZ',  flag: '🇦🇿', name: 'Azerbaijan'      },
  { code: 'BS',  flag: '🇧🇸', name: 'Bahamas'         },
  { code: 'BH',  flag: '🇧🇭', name: 'Bahrain'         },
  { code: 'BD',  flag: '🇧🇩', name: 'Bangladesh'      },
  { code: 'BB',  flag: '🇧🇧', name: 'Barbados'        },
  { code: 'BY',  flag: '🇧🇾', name: 'Belarus'         },
  { code: 'BE',  flag: '🇧🇪', name: 'Belgium'         },
  { code: 'BZ',  flag: '🇧🇿', name: 'Belize'          },
  { code: 'BJ',  flag: '🇧🇯', name: 'Benin'           },
  { code: 'BT',  flag: '🇧🇹', name: 'Bhutan'          },
  { code: 'BO',  flag: '🇧🇴', name: 'Bolivia'         },
  { code: 'BA',  flag: '🇧🇦', name: 'Bosnia'          },
  { code: 'BW',  flag: '🇧🇼', name: 'Botswana'        },
  { code: 'BR',  flag: '🇧🇷', name: 'Brazil'          },
  { code: 'BN',  flag: '🇧🇳', name: 'Brunei'          },
  { code: 'BG',  flag: '🇧🇬', name: 'Bulgaria'        },
  { code: 'BF',  flag: '🇧🇫', name: 'Burkina Faso'    },
  { code: 'BI',  flag: '🇧🇮', name: 'Burundi'         },
  { code: 'CV',  flag: '🇨🇻', name: 'Cape Verde'      },
  { code: 'KH',  flag: '🇰🇭', name: 'Cambodia'        },
  { code: 'CM',  flag: '🇨🇲', name: 'Cameroon'        },
  { code: 'CA',  flag: '🇨🇦', name: 'Canada'          },
  { code: 'CF',  flag: '🇨🇫', name: 'C. African Rep.' },
  { code: 'TD',  flag: '🇹🇩', name: 'Chad'            },
  { code: 'CL',  flag: '🇨🇱', name: 'Chile'           },
  { code: 'CN',  flag: '🇨🇳', name: 'China'           },
  { code: 'CO',  flag: '🇨🇴', name: 'Colombia'        },
  { code: 'KM',  flag: '🇰🇲', name: 'Comoros'         },
  { code: 'CG',  flag: '🇨🇬', name: 'Congo'           },
  { code: 'CD',  flag: '🇨🇩', name: 'DR Congo'        },
  { code: 'CR',  flag: '🇨🇷', name: 'Costa Rica'      },
  { code: 'CI',  flag: '🇨🇮', name: "Côte d'Ivoire"   },
  { code: 'HR',  flag: '🇭🇷', name: 'Croatia'         },
  { code: 'CU',  flag: '🇨🇺', name: 'Cuba'            },
  { code: 'CY',  flag: '🇨🇾', name: 'Cyprus'          },
  { code: 'CZ',  flag: '🇨🇿', name: 'Czechia'         },
  { code: 'DK',  flag: '🇩🇰', name: 'Denmark'         },
  { code: 'DJ',  flag: '🇩🇯', name: 'Djibouti'        },
  { code: 'DM',  flag: '🇩🇲', name: 'Dominica'        },
  { code: 'DO',  flag: '🇩🇴', name: 'Dominican Rep.'  },
  { code: 'EC',  flag: '🇪🇨', name: 'Ecuador'         },
  { code: 'EG',  flag: '🇪🇬', name: 'Egypt'           },
  { code: 'SV',  flag: '🇸🇻', name: 'El Salvador'     },
  { code: 'GQ',  flag: '🇬🇶', name: 'Eq. Guinea'      },
  { code: 'ER',  flag: '🇪🇷', name: 'Eritrea'         },
  { code: 'EE',  flag: '🇪🇪', name: 'Estonia'         },
  { code: 'SZ',  flag: '🇸🇿', name: 'Eswatini'        },
  { code: 'ET',  flag: '🇪🇹', name: 'Ethiopia'        },
  { code: 'FJ',  flag: '🇫🇯', name: 'Fiji'            },
  { code: 'FI',  flag: '🇫🇮', name: 'Finland'         },
  { code: 'FR',  flag: '🇫🇷', name: 'France'          },
  { code: 'GA',  flag: '🇬🇦', name: 'Gabon'           },
  { code: 'GM',  flag: '🇬🇲', name: 'Gambia'          },
  { code: 'GE',  flag: '🇬🇪', name: 'Georgia'         },
  { code: 'DE',  flag: '🇩🇪', name: 'Germany'         },
  { code: 'GH',  flag: '🇬🇭', name: 'Ghana'           },
  { code: 'GR',  flag: '🇬🇷', name: 'Greece'          },
  { code: 'GD',  flag: '🇬🇩', name: 'Grenada'         },
  { code: 'GT',  flag: '🇬🇹', name: 'Guatemala'       },
  { code: 'GN',  flag: '🇬🇳', name: 'Guinea'          },
  { code: 'GW',  flag: '🇬🇼', name: 'Guinea-Bissau'   },
  { code: 'GY',  flag: '🇬🇾', name: 'Guyana'          },
  { code: 'HT',  flag: '🇭🇹', name: 'Haiti'           },
  { code: 'HN',  flag: '🇭🇳', name: 'Honduras'        },
  { code: 'HU',  flag: '🇭🇺', name: 'Hungary'         },
  { code: 'IS',  flag: '🇮🇸', name: 'Iceland'         },
  { code: 'IN',  flag: '🇮🇳', name: 'India'           },
  { code: 'ID',  flag: '🇮🇩', name: 'Indonesia'       },
  { code: 'IR',  flag: '🇮🇷', name: 'Iran'            },
  { code: 'IQ',  flag: '🇮🇶', name: 'Iraq'            },
  { code: 'IE',  flag: '🇮🇪', name: 'Ireland'         },
  { code: 'IL',  flag: '🇮🇱', name: 'Israel'          },
  { code: 'IT',  flag: '🇮🇹', name: 'Italy'           },
  { code: 'JM',  flag: '🇯🇲', name: 'Jamaica'         },
  { code: 'JP',  flag: '🇯🇵', name: 'Japan'           },
  { code: 'JO',  flag: '🇯🇴', name: 'Jordan'          },
  { code: 'KZ',  flag: '🇰🇿', name: 'Kazakhstan'      },
  { code: 'KE',  flag: '🇰🇪', name: 'Kenya'           },
  { code: 'KI',  flag: '🇰🇮', name: 'Kiribati'        },
  { code: 'KW',  flag: '🇰🇼', name: 'Kuwait'          },
  { code: 'KG',  flag: '🇰🇬', name: 'Kyrgyzstan'      },
  { code: 'LA',  flag: '🇱🇦', name: 'Laos'            },
  { code: 'LV',  flag: '🇱🇻', name: 'Latvia'          },
  { code: 'LB',  flag: '🇱🇧', name: 'Lebanon'         },
  { code: 'LS',  flag: '🇱🇸', name: 'Lesotho'         },
  { code: 'LR',  flag: '🇱🇷', name: 'Liberia'         },
  { code: 'LY',  flag: '🇱🇾', name: 'Libya'           },
  { code: 'LI',  flag: '🇱🇮', name: 'Liechtenstein'   },
  { code: 'LT',  flag: '🇱🇹', name: 'Lithuania'       },
  { code: 'LU',  flag: '🇱🇺', name: 'Luxembourg'      },
  { code: 'MG',  flag: '🇲🇬', name: 'Madagascar'      },
  { code: 'MW',  flag: '🇲🇼', name: 'Malawi'          },
  { code: 'MY',  flag: '🇲🇾', name: 'Malaysia'        },
  { code: 'MV',  flag: '🇲🇻', name: 'Maldives'        },
  { code: 'ML',  flag: '🇲🇱', name: 'Mali'            },
  { code: 'MT',  flag: '🇲🇹', name: 'Malta'           },
  { code: 'MH',  flag: '🇲🇭', name: 'Marshall Islands'},
  { code: 'MR',  flag: '🇲🇷', name: 'Mauritania'      },
  { code: 'MU',  flag: '🇲🇺', name: 'Mauritius'       },
  { code: 'MX',  flag: '🇲🇽', name: 'Mexico'          },
  { code: 'FM',  flag: '🇫🇲', name: 'Micronesia'      },
  { code: 'MD',  flag: '🇲🇩', name: 'Moldova'         },
  { code: 'MC',  flag: '🇲🇨', name: 'Monaco'          },
  { code: 'MN',  flag: '🇲🇳', name: 'Mongolia'        },
  { code: 'ME',  flag: '🇲🇪', name: 'Montenegro'      },
  { code: 'MA',  flag: '🇲🇦', name: 'Morocco'         },
  { code: 'MZ',  flag: '🇲🇿', name: 'Mozambique'      },
  { code: 'MM',  flag: '🇲🇲', name: 'Myanmar'         },
  { code: 'NA',  flag: '🇳🇦', name: 'Namibia'         },
  { code: 'NR',  flag: '🇳🇷', name: 'Nauru'           },
  { code: 'NP',  flag: '🇳🇵', name: 'Nepal'           },
  { code: 'NL',  flag: '🇳🇱', name: 'Netherlands'     },
  { code: 'NZ',  flag: '🇳🇿', name: 'New Zealand'     },
  { code: 'NI',  flag: '🇳🇮', name: 'Nicaragua'       },
  { code: 'NE',  flag: '🇳🇪', name: 'Niger'           },
  { code: 'NG',  flag: '🇳🇬', name: 'Nigeria'         },
  { code: 'NO',  flag: '🇳🇴', name: 'Norway'          },
  { code: 'OM',  flag: '🇴🇲', name: 'Oman'            },
  { code: 'PK',  flag: '🇵🇰', name: 'Pakistan'        },
  { code: 'PW',  flag: '🇵🇼', name: 'Palau'           },
  { code: 'PA',  flag: '🇵🇦', name: 'Panama'          },
  { code: 'PG',  flag: '🇵🇬', name: 'Papua N. Guinea' },
  { code: 'PY',  flag: '🇵🇾', name: 'Paraguay'        },
  { code: 'PE',  flag: '🇵🇪', name: 'Peru'            },
  { code: 'PH',  flag: '🇵🇭', name: 'Philippines'     },
  { code: 'PL',  flag: '🇵🇱', name: 'Poland'          },
  { code: 'PT',  flag: '🇵🇹', name: 'Portugal'        },
  { code: 'QA',  flag: '🇶🇦', name: 'Qatar'           },
  { code: 'RO',  flag: '🇷🇴', name: 'Romania'         },
  { code: 'RU',  flag: '🇷🇺', name: 'Russia'          },
  { code: 'RW',  flag: '🇷🇼', name: 'Rwanda'          },
  { code: 'KN',  flag: '🇰🇳', name: 'St Kitts & Nevis'},
  { code: 'LC',  flag: '🇱🇨', name: 'St Lucia'        },
  { code: 'VC',  flag: '🇻🇨', name: 'St Vincent'      },
  { code: 'WS',  flag: '🇼🇸', name: 'Samoa'           },
  { code: 'SM',  flag: '🇸🇲', name: 'San Marino'      },
  { code: 'ST',  flag: '🇸🇹', name: 'São Tomé'        },
  { code: 'SA',  flag: '🇸🇦', name: 'Saudi Arabia'    },
  { code: 'SN',  flag: '🇸🇳', name: 'Senegal'         },
  { code: 'RS',  flag: '🇷🇸', name: 'Serbia'          },
  { code: 'SC',  flag: '🇸🇨', name: 'Seychelles'      },
  { code: 'SL',  flag: '🇸🇱', name: 'Sierra Leone'    },
  { code: 'SG',  flag: '🇸🇬', name: 'Singapore'       },
  { code: 'SK',  flag: '🇸🇰', name: 'Slovakia'        },
  { code: 'SI',  flag: '🇸🇮', name: 'Slovenia'        },
  { code: 'SB',  flag: '🇸🇧', name: 'Solomon Islands' },
  { code: 'SO',  flag: '🇸🇴', name: 'Somalia'         },
  { code: 'ZA',  flag: '🇿🇦', name: 'South Africa'    },
  { code: 'SS',  flag: '🇸🇸', name: 'South Sudan'     },
  { code: 'ES',  flag: '🇪🇸', name: 'Spain'           },
  { code: 'LK',  flag: '🇱🇰', name: 'Sri Lanka'       },
  { code: 'SD',  flag: '🇸🇩', name: 'Sudan'           },
  { code: 'SR',  flag: '🇸🇷', name: 'Suriname'        },
  { code: 'SE',  flag: '🇸🇪', name: 'Sweden'          },
  { code: 'CH',  flag: '🇨🇭', name: 'Switzerland'     },
  { code: 'SY',  flag: '🇸🇾', name: 'Syria'           },
  { code: 'TW',  flag: '🇹🇼', name: 'Taiwan'          },
  { code: 'TJ',  flag: '🇹🇯', name: 'Tajikistan'      },
  { code: 'TZ',  flag: '🇹🇿', name: 'Tanzania'        },
  { code: 'TH',  flag: '🇹🇭', name: 'Thailand'        },
  { code: 'TL',  flag: '🇹🇱', name: 'Timor-Leste'     },
  { code: 'TG',  flag: '🇹🇬', name: 'Togo'            },
  { code: 'TO',  flag: '🇹🇴', name: 'Tonga'           },
  { code: 'TT',  flag: '🇹🇹', name: 'Trinidad & Tobago'},
  { code: 'TN',  flag: '🇹🇳', name: 'Tunisia'         },
  { code: 'TR',  flag: '🇹🇷', name: 'Turkey'          },
  { code: 'TM',  flag: '🇹🇲', name: 'Turkmenistan'    },
  { code: 'TV',  flag: '🇹🇻', name: 'Tuvalu'          },
  { code: 'UG',  flag: '🇺🇬', name: 'Uganda'          },
  { code: 'UA',  flag: '🇺🇦', name: 'Ukraine'         },
  { code: 'AE',  flag: '🇦🇪', name: 'UAE'             },
  { code: 'GB',  flag: '🇬🇧', name: 'UK'              },
  { code: 'US',  flag: '🇺🇸', name: 'USA'             },
  { code: 'UY',  flag: '🇺🇾', name: 'Uruguay'         },
  { code: 'UZ',  flag: '🇺🇿', name: 'Uzbekistan'      },
  { code: 'VU',  flag: '🇻🇺', name: 'Vanuatu'         },
  { code: 'VE',  flag: '🇻🇪', name: 'Venezuela'       },
  { code: 'VN',  flag: '🇻🇳', name: 'Vietnam'         },
  { code: 'YE',  flag: '🇾🇪', name: 'Yemen'           },
  { code: 'ZM',  flag: '🇿🇲', name: 'Zambia'          },
  { code: 'ZW',  flag: '🇿🇼', name: 'Zimbabwe'        },
];

const REACH_OPTIONS = [
  { id: 'nearby',    label: 'Near Me',    icon: '📍', desc: 'Bonds in your city',    color: '#57f287' },
  { id: 'country',   label: 'My Country', icon: '🏠', desc: 'Same country as you',   color: '#4fc3f7' },
  { id: 'worldwide', label: 'Worldwide',  icon: '🌍', desc: 'Anyone on the planet',  color: BOND_PINK },
];


const REGION_CODES = {
  africa:   ['DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','SZ','TZ','TG','TN','UG','ZM','ZW'],
  americas: ['AG','AR','BS','BB','BZ','BO','BR','CA','CL','CO','CR','CU','DM','DO','EC','SV','GD','GT','GY','HT','HN','JM','MX','NI','PA','PY','PE','KN','LC','VC','SR','TT','US','UY','VE'],
  asia:     ['AF','AM','AZ','BH','BD','BT','BN','KH','CN','GE','IN','ID','IR','IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MY','MV','MN','MM','NP','OM','PK','PH','QA','RU','SA','SG','LK','SY','TW','TJ','TH','TL','TM','AE','UZ','VN','YE'],
  europe:   ['AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','MD','MC','ME','NL','NO','PL','PT','RO','SM','RS','SK','SI','ES','SE','CH','TR','UA','GB'],
  oceania:  ['AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU'],
};

function getRegionForCode(code) {
  if (!code) return 'all';
  for (const [region, codes] of Object.entries(REGION_CODES)) {
    if (codes.includes(code)) return region;
  }
  return 'all';
}

// ─── Bond Pass Upgrade Modal ──────────────────────────────────────────────────
function UpgradeModal({ visible, onClose, navigation }) {
  const PERKS = [
    'Unlimited daily bonds',
    'Advanced filters — gender, country, vibe',
    'Stronger signal — 3x search rings',
    '75% gift payout rate (vs 50% standard)',
    '150-char note with every bond request',
    'Message anyone, bonded or not',
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={up.overlay} activeOpacity={1} onPress={onClose}>
        <View style={up.sheet}>
          <View style={up.handle} />
          <Text style={up.title}>Get Bond Pass</Text>
          <Text style={up.sub}>Everything unlocked — one flat price</Text>

          <View style={up.card}>
            <View style={up.cardTop}>
              <Text style={up.planName}>Bond Pass</Text>
              <View style={up.pricePill}>
                <Text style={up.priceAmt}>$4.99</Text>
                <Text style={up.pricePer}>/mo</Text>
              </View>
            </View>
            <View style={up.divider} />
            <View style={up.perks}>
              {PERKS.map((p, i) => (
                <View key={i} style={up.perkRow}>
                  <Text style={up.perkDot}>⚡</Text>
                  <Text style={up.perkTxt}>{p}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={up.ctaBtn}
            onPress={() => { onClose(); navigation?.navigate('Subscription'); }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={up.ctaGrad}>
              <Text style={up.ctaTxt}>See Bond Pass  →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={up.closeBtn} onPress={onClose}>
            <Text style={up.closeTxt}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const up = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#0a0c12', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, paddingBottom: 40 },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2F3336', alignSelf: 'center', marginBottom: 4 },
  title:    { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.4 },
  sub:      { color: '#555', fontSize: 13, textAlign: 'center' },
  card:     { borderRadius: 20, borderWidth: 1, borderColor: BOND_PINK + '40', overflow: 'hidden', backgroundColor: '#0f0a12' },
  cardTop:  { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { color: '#fff', fontSize: 17, fontWeight: '900' },
  pricePill:{ flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceAmt: { color: BOND_PINK, fontSize: 20, fontWeight: '900' },
  pricePer: { color: '#555', fontSize: 13 },
  divider:  { height: 1, backgroundColor: '#1e2028' },
  perks:    { padding: 16, gap: 10 },
  perkRow:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  perkDot:  { fontSize: 12 },
  perkTxt:  { color: '#bbb', fontSize: 13, lineHeight: 18, flex: 1 },
  ctaBtn:   { borderRadius: 16, overflow: 'hidden' },
  ctaGrad:  { paddingVertical: 16, alignItems: 'center' },
  ctaTxt:   { color: '#fff', fontSize: 16, fontWeight: '900' },
  closeBtn: { alignItems: 'center', paddingVertical: 8 },
  closeTxt: { color: '#444', fontSize: 14 },
});

const CARD_W = width - 32;

// ─── Full Profile View ────────────────────────────────────────────────────────
function ProfileView({ sig, onClose, onNext, onBond }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const allPhotos = [{ type: 'avatar' }, ...(sig.photos || []).map(url => ({ type: 'photo', url }))];

  return (
    <View style={pv.root}>
      <View style={pv.header}>
        <TouchableOpacity style={pv.backBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={pv.backIcon}>←</Text>
        </TouchableOpacity>
        {sig.online && (
          <View style={pv.onlinePill}>
            <View style={pv.onlineDot} />
            <Text style={pv.onlineTxt}>Online now</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Photo gallery */}
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          style={pv.photoScroll}
          onMomentumScrollEnd={e => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {allPhotos.map((item, i) => {
            if (item.type === 'avatar') {
              return (
                <View key="av" style={[pv.photoTile, { backgroundColor: sig.avatarColor + '22' }]}>
                  <LinearGradient colors={[sig.avatarColor + '44', '#050507']} style={pv.photoTileGrad}>
                    <Avatar photo_url={sig.photo_url} name={sig.name} size={140} />
                    {allPhotos.length > 1 && (
                      <View style={pv.swipeHint}><Text style={pv.swipeHintTxt}>swipe for photos  →</Text></View>
                    )}
                  </LinearGradient>
                </View>
              );
            }
            return (
              <View key={i} style={[pv.photoTile, { backgroundColor: '#080a0f' }]}>
                {item.url
                  ? <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <View style={pv.emptyPhotoTile}><Text style={pv.emptyPhotoIcon}>📷</Text><Text style={pv.emptyPhotoTxt}>No photo</Text></View>
                }
              </View>
            );
          })}
        </ScrollView>

        {/* Dot indicators */}
        <View style={pv.photoDots}>
          {allPhotos.map((_, i) => (
            <View key={i} style={[pv.photoDot, i === activePhoto && pv.photoDotActive]} />
          ))}
        </View>

        {/* Identity */}
        <View style={pv.identity}>
          <Text style={pv.name}>{sig.name}, {sig.age}</Text>
          <Text style={pv.handle}>{sig.username}</Text>
          <View style={pv.locRow}>
            <Text style={{ fontSize: 18 }}>{sig.flag}</Text>
            <Text style={pv.locTxt}>{sig.country}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={pv.statsRow}>
          <View style={pv.statItem}>
            <Text style={pv.statVal}>
              {(sig.interests || []).slice(0, 3).map(t => t.split(' ')[0]).join(' ') || '✨'}
            </Text>
            <Text style={pv.statLabel}>In Common</Text>
          </View>
          <View style={pv.statDiv} />
          <View style={pv.statItem}>
            <Text style={pv.statVal}>{sig.trail.length}</Text>
            <Text style={pv.statLabel}>Countries</Text>
          </View>
          <View style={pv.statDiv} />
          <View style={pv.statItem}>
            <Text style={pv.statVal}>{sig.age}</Text>
            <Text style={pv.statLabel}>Age</Text>
          </View>
        </View>

        {/* Bio */}
        {sig.bio ? (
          <View style={pv.section}>
            <Text style={pv.sectionLabel}>ABOUT</Text>
            <Text style={pv.bioTxt}>{sig.bio}</Text>
          </View>
        ) : null}

        {/* Tagline */}
        <View style={pv.taglineBox}>
          <Text style={pv.taglineTxt}>"{sig.tagline}"</Text>
        </View>

        {/* Interests */}
        {sig.interests?.length > 0 && (
          <View style={pv.section}>
            <Text style={pv.sectionLabel}>INTERESTS</Text>
            <View style={pv.tagsRow}>
              {sig.interests.map((t, i) => (
                <View key={i} style={pv.tag}><Text style={pv.tagTxt}>{t}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* World Footprint */}
        <View style={pv.section}>
          <Text style={pv.sectionLabel}>WORLD FOOTPRINT</Text>
          <View style={pv.trail}>
            {sig.trail.map((flag, i) => (
              <React.Fragment key={i}>
                <View style={[pv.trailNode, i === 0 && { borderColor: sig.avatarColor, borderWidth: 2 }]}>
                  <Text style={pv.trailFlag}>{flag}</Text>
                </View>
                {i < sig.trail.length - 1 && (
                  <View style={pv.trailConnector}>
                    <View style={pv.trailDot} /><View style={pv.trailLine} /><View style={pv.trailDot} />
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Fixed action buttons */}
      <View style={pv.actions}>
        <TouchableOpacity style={pv.nextBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={pv.nextTxt}>Next  →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[pv.bondBtn, { shadowColor: sig.avatarColor }]} onPress={onBond} activeOpacity={0.85}>
          <Text style={pv.bondTxt}>🌐  Bond</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function todayKey() {
  const d = new Date();
  return `bond_used_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function RandomTab({ user, navigation, onMatch, switchTab }) {
  const { hasBondPass } = useBondPass();
  const signalCfg = buildSignalCfg(hasBondPass);

  const bondsPerDay = hasBondPass ? Infinity : 5;
  const isUnlimited = bondsPerDay === Infinity;

  const [state,          setState]         = useState('idle');
  const [matchedUser,    setMatchedUser]    = useState(null);
  const [roomKey,        setRoomKey]        = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [cardIndex,       setCardIndex]       = useState(0);
  const [bondsUsed,       setBondsUsed]       = useState(0);
  const [genderFilter,    setGenderFilter]    = useState('everyone');
  const [reachFilter,     setReachFilter]     = useState('worldwide');
  const [ageMin,          setAgeMin]          = useState(18);
  const [ageMax,          setAgeMax]          = useState(40);
  const [countryFilter,   setCountryFilter]   = useState(user?.country ?? null);
  const [countrySearch,   setCountrySearch]   = useState('');
  const [countryRegion,   setCountryRegion]   = useState(() => getRegionForCode(user?.country));
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [showUpgrade,     setShowUpgrade]     = useState(false);

  // Load today's bond usage from storage
  useEffect(() => {
    AsyncStorage.getItem(todayKey()).then(v => setBondsUsed(v ? parseInt(v, 10) : 0));
  }, []);

  const bondsLeft   = isUnlimited ? Infinity : Math.max(0, bondsPerDay - bondsUsed);
  const outOfBonds  = !isUnlimited && bondsLeft === 0;

  // Countdown timer — ticks every second when bonds are exhausted
  const [cooldownStr, setCooldownStr] = useState('');
  useEffect(() => {
    if (!outOfBonds) { setCooldownStr(''); return; }
    function tick() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCooldownStr(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [outOfBonds]);

  async function consumeBond() {
    const next = bondsUsed + 1;
    setBondsUsed(next);
    await AsyncStorage.setItem(todayKey(), String(next));
  }

  // Build ordered card pool based on tier
  const cardPool = useMemo(() => {
    const pool = [...DEMO_SIGNALS];
    if (hasBondPass) pool.sort((a, b) => b.strength - a.strength);
    return pool;
  }, [hasBondPass]);

  const socket      = getSocket();
  const matchScaleA = useRef(new Animated.Value(0.7)).current;
  const matchOpA    = useRef(new Animated.Value(0)).current;

  // Footprint card slide-in anim
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardOpA   = useRef(new Animated.Value(0)).current;

  // Locking rings (up to 5 for Pro)
  const rings = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];
  const ringOps = [
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.15)).current,
    useRef(new Animated.Value(0.10)).current,
    useRef(new Animated.Value(0.07)).current,
  ];

  const sig = cardPool[cardIndex % cardPool.length];

  // Swipe gesture
  const pan     = useRef(new Animated.ValueXY()).current;
  const swipeOp = useRef(new Animated.Value(0)).current; // positive = BOND, negative = PASS

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      pan.setValue({ x: g.dx, y: g.dy * 0.25 });
      swipeOp.setValue(g.dx / (width * 0.35));
    },
    onPanResponderRelease: (_, g) => {
      const THRESHOLD = width * 0.32;
      if (g.dx > THRESHOLD) {
        if (outOfBonds) {
          Animated.parallel([
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 8 }),
            Animated.timing(swipeOp, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => setShowUpgrade(true));
          return;
        }
        Animated.timing(pan, { toValue: { x: width * 1.4, y: 0 }, duration: 280, useNativeDriver: true }).start(() => {
          pan.setValue({ x: 0, y: 0 }); swipeOp.setValue(0);
          doConnect();
        });
      } else if (g.dx < -THRESHOLD) {
        Animated.timing(pan, { toValue: { x: -width * 1.4, y: 0 }, duration: 280, useNativeDriver: true }).start(() => {
          pan.setValue({ x: 0, y: 0 }); swipeOp.setValue(0);
          doNext();
        });
      } else {
        Animated.parallel([
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 8 }),
          Animated.timing(swipeOp, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    },
  })).current;

  const cardRotate = pan.x.interpolate({ inputRange: [-width, width], outputRange: ['-18deg', '18deg'] });
  const bondStampOp = swipeOp.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const passStampOp = swipeOp.interpolate({ inputRange: [-1, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  function animateCardIn() {
    cardSlide.setValue(60); cardOpA.setValue(0);
    pan.setValue({ x: 0, y: 0 }); swipeOp.setValue(0);
    Animated.parallel([
      Animated.spring(cardSlide, { toValue: 0, friction: 10, tension: 60, useNativeDriver: true }),
      Animated.timing(cardOpA,   { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }

  useEffect(() => { animateCardIn(); }, [cardIndex]);

  // Socket
  useEffect(() => {
    socket.on('random_match', ({ matchedUser: mu, roomKey: rk }) => {
      setMatchedUser(mu); setRoomKey(rk); setMessages([]);
      setState('matching');
      Animated.parallel([
        Animated.spring(matchScaleA, { toValue: 1, useNativeDriver: true, friction: 6 }),
        Animated.timing(matchOpA,    { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    });
    socket.on('random_waiting',   () => setState('locking'));
    socket.on('random_cancelled', () => setState('idle'));
    socket.on('random_timeout',   () => setState('timeout'));
    socket.on('random_message',   msg => setMessages(prev => [...prev, msg]));
    return () => {
      ['random_match','random_waiting','random_cancelled','random_timeout','random_message']
        .forEach(e => socket.off(e));
    };
  }, []);

  // Locking rings — count and speed based on tier
  useEffect(() => {
    if (state !== 'locking') { rings.forEach(r => r.setValue(1)); return; }
    const count    = signalCfg.ringCount;
    const duration = hasBondPass ? 1000 : 1600;
    const activeRings = rings.slice(0, count);
    const activeOps   = ringOps.slice(0, count);
    const initOps     = [0.5, 0.3, 0.15, 0.10, 0.07].slice(0, count);
    const anims = activeRings.map((r, i) =>
      Animated.loop(Animated.parallel([
        Animated.sequence([
          Animated.delay(i * (duration * 0.32)),
          Animated.timing(r,            { toValue: 2.8, duration, useNativeDriver: true }),
          Animated.timing(r,            { toValue: 1,   duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(i * (duration * 0.32)),
          Animated.timing(activeOps[i], { toValue: 0,           duration, useNativeDriver: true }),
          Animated.timing(activeOps[i], { toValue: initOps[i],  duration: 0, useNativeDriver: true }),
        ]),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [state, hasBondPass]);

  function doNext()    { setCardIndex(i => i + 1); }
  function doConnect() {
    if (outOfBonds) { setShowUpgrade(true); return; }
    consumeBond();
    doNext();
  }
  function disconnect() {
    socket.emit('leave_random_connect');
    setState('idle'); setMatchedUser(null); setRoomKey(null); setMessages([]);
    matchScaleA.setValue(0.7); matchOpA.setValue(0);
  }

  // ── Connected: chat ──────────────────────────────────────────────────────────
  // ── Locking / timeout ────────────────────────────────────────────────────────
  if (state === 'locking' || state === 'timeout') {
    const sc = signalCfg;
    const orbColors = state === 'timeout'
      ? ['#2a0a0a', '#000']
      : [sc.color + '30', '#000'];
    return (
      <View style={st.lockScreen}>
        <View style={st.lockOrbWrap}>
          {state === 'locking' && rings.slice(0, sc.ringCount).map((r, i) => (
            <Animated.View key={i} style={[
              st.lockRing,
              { borderColor: sc.ringColor, transform: [{ scale: r }], opacity: ringOps[i] }
            ]} />
          ))}
          <LinearGradient colors={orbColors} style={st.lockOrb}>
            {state === 'timeout'
              ? <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#1a0808', borderWidth: 1.5, borderColor: '#e5393540', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#e53935', fontSize: 18, fontWeight: '900' }}>0</Text></View>
              : <WorldMark size={52} color={sc.color} />}
          </LinearGradient>
        </View>

        {state === 'locking' && (
          <View style={[st.signalBadge, { borderColor: sc.color + '44', backgroundColor: sc.color + '12' }]}>
            <SignalBars count={5} activeCount={sc.bars} color={sc.color} size={4} />
          </View>
        )}

        <Text style={st.lockTitle}>
          {state === 'timeout' ? 'No one nearby' : sc.lockTitle}
        </Text>
        <Text style={st.lockSub}>
          {state === 'timeout' ? 'Try again soon — more people join every day.' : sc.lockSub}
        </Text>

        {state === 'locking' && sc.upgradeHint && (
          <TouchableOpacity
            style={st.signalUpgradeBtn}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}
          >
            <Text style={st.signalUpgradeTxt}>⚡  {sc.upgradeHint}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={st.cancelBtn} onPress={disconnect} activeOpacity={0.8}>
          <Text style={st.cancelTxt}>{state === 'timeout' ? 'Go Back' : 'Cancel'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Bond formed (both bonded each other) ─────────────────────────────────────
  if (state === 'matching' && matchedUser) {
    const mu      = matchedUser;
    const myColor = stringToColor(user?.display_name || user?.username || 'me');
    const muColor = stringToColor(mu.display_name || mu.username);
    const myInit  = (user?.display_name || user?.username || 'M')[0].toUpperCase();
    const muInit  = (mu.display_name || mu.username || '?')[0].toUpperCase();
    function clearMatch() {
      setState('idle'); setMatchedUser(null); setRoomKey(null);
      matchScaleA.setValue(0.7); matchOpA.setValue(0);
    }
    return (
      <View style={st.matchScreen}>
        <LinearGradient colors={['#0a0010','#1a0030','#0a0010']} style={StyleSheet.absoluteFill} />
        <Animated.View style={[st.matchContent, { transform: [{ scale: matchScaleA }], opacity: matchOpA }]}>
          {/* Logo mark */}
          <View style={st.matchLogoWrap}>
            <LinearGradient colors={[BOND_PINK + '30', 'transparent']} style={st.matchLogoGlow} />
            <WorldMark size={48} color="#fff" bondColor={BOND_PINK} />
          </View>
          <Text style={st.matchTitle}>It's a Bond!</Text>
          <Text style={st.matchSub}>You both connected — your bond is now live</Text>
          {/* Avatar row with connection line */}
          <View style={st.matchAvatarRow}>
            <View style={st.matchAvatarWrap}>
              <View style={[st.matchAvatar, { backgroundColor: myColor }]}><Text style={st.matchAvatarInitial}>{myInit}</Text></View>
              <Text style={st.matchAvatarLabel}>You</Text>
            </View>
            <View style={st.matchConnector}>
              <View style={[st.matchConnLine, { backgroundColor: BOND_PINK + '40' }]} />
              <View style={[st.matchConnDot, { backgroundColor: BOND_PINK }]} />
              <View style={[st.matchConnLine, { backgroundColor: BOND_PINK + '40' }]} />
            </View>
            <View style={st.matchAvatarWrap}>
              <View style={[st.matchAvatar, { backgroundColor: muColor }]}><Text style={st.matchAvatarInitial}>{muInit}</Text></View>
              <Text style={st.matchAvatarLabel}>{mu.display_name || mu.username}</Text>
            </View>
          </View>
          <TouchableOpacity style={st.matchMsgBtn} onPress={() => {
            if (onMatch) onMatch(matchedUser, roomKey);
            clearMatch();
            if (switchTab) switchTab('people');
          }} activeOpacity={0.85}>
            <LinearGradient colors={[BOND_PINK, '#CC0060']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.matchMsgGrad}>
              <Text style={st.matchMsgTxt}>Start Chatting</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={st.matchSkipBtn} onPress={() => {
            if (onMatch) onMatch(matchedUser, roomKey);
            clearMatch(); setCardIndex(i => i + 1);
          }} activeOpacity={0.8}>
            <Text style={st.matchSkipTxt}>Save Bond · Keep Exploring</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Idle: WorldBond Footprint ────────────────────────────────────────────────
  const genderMeta  = GENDER_OPTIONS_FP.find(g => g.id === genderFilter) || GENDER_OPTIONS_FP[0];
  const reachMeta   = REACH_OPTIONS.find(r => r.id === reachFilter) || REACH_OPTIONS[2];
  const countryMeta = ALL_COUNTRIES.find(c => c.code === countryFilter);

  const REGION_TABS = [
    { id: 'all',     label: 'All'      },
    { id: 'africa',  label: 'Africa'   },
    { id: 'americas',label: 'Americas' },
    { id: 'asia',    label: 'Asia'     },
    { id: 'europe',  label: 'Europe'   },
    { id: 'oceania', label: 'Oceania'  },
  ];
  const filteredCountries = ALL_COUNTRIES.filter(c => {
    if (c.code === null) return false; // Anywhere shown separately
    const matchSearch = c.name.toLowerCase().includes(countrySearch.toLowerCase());
    const matchRegion = countryRegion === 'all' || (REGION_CODES[countryRegion] || []).includes(c.code);
    return matchSearch && matchRegion;
  });
  const defaultCountry = user?.country ?? null;
  const hasFilter   = genderFilter !== 'everyone' || reachFilter !== 'worldwide' || countryFilter !== defaultCountry || ageMin !== 18 || ageMax !== 40;
  const filterLabel = hasFilter
    ? [genderFilter !== 'everyone' && genderMeta.label, reachFilter !== 'worldwide' && reachMeta.label, countryMeta && countryMeta.name].filter(Boolean).join(' · ')
    : 'Filters';


  return (
    <View style={{ flex: 1 }}>

      {/* ── Filter chip + shuffle ─────────────────────────────────────────── */}
      <View style={fp2.topRow}>
        <TouchableOpacity
          style={[fp2.vibeChip, hasFilter && { borderColor: BOND_PINK, backgroundColor: BOND_PINK + '18' }]}
          onPress={() => setShowFilterSheet(true)} activeOpacity={0.8}
        >
          <Text style={[fp2.vibeIcon, hasFilter && { color: BOND_PINK }]}>⋮</Text>
          <Text style={[fp2.vibeTxt, hasFilter && { color: BOND_PINK }]}>{filterLabel}</Text>
          <Text style={fp2.caret}>▾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={fp2.shuffleBtn} onPress={doNext} activeOpacity={0.8}>
          <Text style={fp2.shuffleIcon}>↻</Text>
        </TouchableOpacity>
      </View>



      {/* ── Cooldown wall (free users out of bonds) ──────────────────────── */}
      {outOfBonds && (
        <View style={fp2.cooldownWall}>
          <View style={fp2.cooldownLockBox}><Text style={fp2.cooldownLockTxt}>LOCKED</Text></View>
          <Text style={fp2.cooldownTitle}>Out of Bonds</Text>
          <Text style={fp2.cooldownSub}>You've used all your bonds for today</Text>
          <View style={fp2.cooldownTimerBox}>
            <Text style={fp2.cooldownTimerLabel}>Resets in</Text>
            <Text style={fp2.cooldownTimer}>{cooldownStr}</Text>
            <Text style={fp2.cooldownTimerNote}>Daily at midnight</Text>
          </View>
          <TouchableOpacity style={fp2.cooldownUpgradeBtn} onPress={() => setShowUpgrade(true)} activeOpacity={0.85}>
            <Text style={fp2.cooldownUpgradeTxt}>⚡  Get Bond Pass</Text>
          </TouchableOpacity>
          <Text style={fp2.cooldownOr}>Unlimited bonds · Stronger signal · Priority matches</Text>
        </View>
      )}

      {/* ── Footprint Card (swipeable) ───────────────────────────────────── */}
      {!outOfBonds && <Animated.View
        {...panResponder.panHandlers}
        style={[fp2.card, {
          opacity: cardOpA,
          transform: [
            { translateY: cardSlide },
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: cardRotate },
          ],
        }]}
      >
        {/* BOND stamp */}
        <Animated.View style={[st.swipeLabel, st.connectLabel, { opacity: bondStampOp }]} pointerEvents="none">
          <Text style={st.connectLabelTxt}>BOND</Text>
        </Animated.View>
        {/* PASS stamp */}
        <Animated.View style={[st.swipeLabel, st.passLabel, { opacity: passStampOp }]} pointerEvents="none">
          <Text style={st.passLabelTxt}>PASS</Text>
        </Animated.View>

        <LinearGradient colors={[sig.avatarColor + '22', '#08090d', '#000']} style={fp2.cardGrad}>

          {/* Avatar + online */}
          <View style={fp2.avatarZone}>
            <Avatar photo_url={sig.photo_url} name={sig.name} size={90} />
            {sig.online && (
              <View style={fp2.onlinePill}>
                <View style={fp2.onlineDot} />
                <Text style={fp2.onlineTxt}>Online now</Text>
              </View>
            )}
          </View>

          {/* Name + handle */}
          <Text style={fp2.name}>{sig.name}, {sig.age}</Text>
          <Text style={fp2.handle}>{sig.username}</Text>
          <View style={fp2.locRow}>
            <Text style={{ fontSize: 17 }}>{sig.flag}</Text>
            <Text style={fp2.locTxt}>{sig.country}</Text>
          </View>

          {/* ── World Footprint Trail ── */}
          <View style={fp2.trailWrap}>
            <Text style={fp2.trailLabel}>WORLD FOOTPRINT</Text>
            <View style={fp2.trail}>
              {sig.trail.map((flag, i) => (
                <React.Fragment key={i}>
                  <View style={[fp2.trailNode, i === 0 && { borderColor: sig.avatarColor, borderWidth: 2 }]}>
                    <Text style={fp2.trailFlag}>{flag}</Text>
                  </View>
                  {i < sig.trail.length - 1 && (
                    <View style={fp2.trailConnector}>
                      <View style={fp2.trailDot} />
                      <View style={fp2.trailLine} />
                      <View style={fp2.trailDot} />
                    </View>
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Tagline */}
          <Text style={fp2.tagline}>"{sig.tagline}"</Text>

          {/* Tap hint */}
          <TouchableOpacity onPress={() => setShowProfile(true)} activeOpacity={0.7} style={fp2.profileHint}>
            <Text style={fp2.profileHintTxt}>View full profile  ↗</Text>
          </TouchableOpacity>

          {/* Swipe hint */}
          <View style={fp2.swipeHintRow}>
            <Text style={fp2.swipeHintPass}>← Pass</Text>
            <Text style={fp2.swipeHintDot}>·</Text>
            <Text style={fp2.swipeHintBond}>Bond →</Text>
          </View>

        </LinearGradient>
      </Animated.View>}

      {/* ── Bond / Next buttons ───────────────────────────────────────────── */}
      {!outOfBonds && <View style={fp2.actions}>
        <TouchableOpacity style={fp2.nextBtn} onPress={doNext} activeOpacity={0.8}>
          <Text style={fp2.nextTxt}>Next  →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[fp2.bondBtn, { shadowColor: sig.avatarColor }]} onPress={doConnect} activeOpacity={0.82}>
          <Text style={fp2.bondTxt}>🌐  Bond</Text>
        </TouchableOpacity>
      </View>}

      {/* ── Full Profile View ────────────────────────────────────────────── */}
      <Modal visible={showProfile} transparent={false} animationType="slide" onRequestClose={() => setShowProfile(false)}>
        <ProfileView sig={sig} onClose={() => setShowProfile(false)} onNext={() => { setShowProfile(false); doNext(); }} onBond={() => { setShowProfile(false); doConnect(); }} />
      </Modal>

      {/* ── All-in-one Filter Sheet ──────────────────────────────────────── */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <TouchableOpacity style={fp.overlay} activeOpacity={1} onPress={() => setShowFilterSheet(false)} />
        <View style={fp.filterSheet}>
          <View style={fp.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={fp.sheetScroll}>
          <Text style={fp.sheetTitle}>Find people</Text>

          {/* ── Reach ── */}
          <Text style={fp.sectionLabel}>LOCATION</Text>
          <View style={fp.reachRow}>
            {REACH_OPTIONS.map(r => {
              const active  = reachFilter === r.id;
              const locked  = r.id === 'nearby' && !hasBondPass;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[fp.reachTile, active && { borderColor: r.color, backgroundColor: r.color + '15' }]}
                  onPress={() => locked ? setShowUpgrade(true) : setReachFilter(r.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[fp.reachLabel, active && { color: r.color }]}>{r.label}</Text>
                  <Text style={fp.reachDesc} numberOfLines={1}>{r.desc}</Text>
                  {locked && <View style={fp.reachLock}><Text style={{ fontSize: 9 }}>🔒</Text></View>}
                  {active && <View style={[fp.reachDot, { backgroundColor: r.color }]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Looking for ── */}
          <View style={[fp.sectionRow, { marginTop: 22 }]}>
            <Text style={fp.sectionLabel}>LOOKING FOR</Text>
            {!hasBondPass && <Text style={fp.lockBadge}>🔒 Bond Pass</Text>}
          </View>
          <View style={[fp.genderRow, !hasBondPass && fp.lockedSection]}>
            {GENDER_OPTIONS_FP.map(g => {
              const active = genderFilter === g.id && hasBondPass;
              return (
                <TouchableOpacity key={g.id}
                  style={[fp.genderPill, active && { backgroundColor: g.color, borderColor: g.color }]}
                  onPress={() => hasBondPass ? setGenderFilter(g.id) : setShowUpgrade(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[fp.genderPillTxt, active && { color: '#fff' }]}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Age range ── */}
          <View style={[fp.sectionRow, { marginTop: 22 }]}>
            <Text style={fp.sectionLabel}>AGE RANGE</Text>
            <Text style={fp.ageRangeVal}>{ageMin} – {ageMax}</Text>
          </View>
          <View style={fp.ageRow}>
            <View style={fp.ageStepper}>
              <TouchableOpacity style={fp.ageBtn} onPress={() => setAgeMin(a => Math.max(18, a - 1))} activeOpacity={0.7}>
                <Text style={fp.ageBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={fp.ageVal}>{ageMin}</Text>
              <TouchableOpacity style={fp.ageBtn} onPress={() => setAgeMin(a => Math.min(ageMax - 1, a + 1))} activeOpacity={0.7}>
                <Text style={fp.ageBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={fp.ageTo}>to</Text>
            <View style={fp.ageStepper}>
              <TouchableOpacity style={fp.ageBtn} onPress={() => setAgeMax(a => Math.max(ageMin + 1, a - 1))} activeOpacity={0.7}>
                <Text style={fp.ageBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={fp.ageVal}>{ageMax}</Text>
              <TouchableOpacity style={fp.ageBtn} onPress={() => setAgeMax(a => Math.min(60, a + 1))} activeOpacity={0.7}>
                <Text style={fp.ageBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Country ── */}
          <View style={[fp.sectionRow, { marginTop: 22 }]}>
            <Text style={fp.sectionLabel}>COUNTRY</Text>
            {!hasBondPass && <Text style={fp.lockBadge}>🔒 Bond Pass</Text>}
          </View>
          <View style={[!hasBondPass && fp.lockedSection]}>

            {/* Search bar */}
            <View style={fp.countrySearchBar}>
              <Text style={fp.countrySearchIcon}>🔍</Text>
              <TextInput
                style={fp.countrySearchInput}
                placeholder="Search country..."
                placeholderTextColor="#555"
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
              {countrySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCountrySearch('')} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                  <Text style={fp.countrySearchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Region tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fp.regionTabScroll} contentContainerStyle={fp.regionTabRow}>
              {REGION_TABS.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[fp.regionTab, countryRegion === r.id && fp.regionTabActive]}
                  onPress={() => setCountryRegion(r.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[fp.regionTabTxt, countryRegion === r.id && fp.regionTabTxtActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Anywhere pill */}
            {(countrySearch === '' || 'anywhere'.includes(countrySearch.toLowerCase())) && (
              <TouchableOpacity
                style={[fp.anywherePill, countryFilter === null && hasBondPass && fp.anywherePillActive]}
                onPress={() => hasBondPass ? setCountryFilter(null) : setShowUpgrade(true)}
                activeOpacity={0.8}
              >
                <Text style={[fp.anywhereTxt, countryFilter === null && hasBondPass && { color: BOND_PINK }]}>Anywhere</Text>
                {countryFilter === null && hasBondPass && <Text style={fp.anywhereCheck}>✓</Text>}
              </TouchableOpacity>
            )}

            {/* Fixed-height scrollable grid */}
            <ScrollView style={fp.countryGridScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <View style={fp.flagGrid}>
                {filteredCountries.map(c => {
                  const active = countryFilter === c.code && hasBondPass;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      style={[fp.flagTile, active && fp.flagTileActive]}
                      onPress={() => hasBondPass ? setCountryFilter(active ? null : c.code) : setShowUpgrade(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={fp.flagEmoji}>{c.flag}</Text>
                      <Text style={[fp.flagName, active && fp.flagNameActive]} numberOfLines={1}>{c.name}</Text>
                      {active && <View style={fp.flagCheck}><Text style={fp.flagCheckTxt}>✓</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          </ScrollView>
          <TouchableOpacity style={fp.applyBtn} onPress={() => setShowFilterSheet(false)} activeOpacity={0.85}>
            <Text style={fp.applyTxt}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} navigation={navigation} />
    </View>
  );
}

const fp = StyleSheet.create({
  overlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:          { backgroundColor: '#111318', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 38, gap: 4, position: 'absolute', bottom: 0, left: 0, right: 0 },
  filterSheet:    { backgroundColor: '#0d0f14', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '88%' },
  sheetScroll:    { paddingBottom: 8 },
  handle:         { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2a2c34', alignSelf: 'center', marginBottom: 18 },
  sheetTitle:     { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 18 },
  sectionRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel:   { color: '#777', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  lockBadge:      { color: '#FFB700', fontSize: 10, fontWeight: '800', backgroundColor: '#FFB70018',
                    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#FFB70033' },
  lockedSection:  { opacity: 0.35 },

  // Reach — 3 wide tiles
  reachRow:       { flexDirection: 'row', gap: 8, marginBottom: 4 },
  reachTile:      { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 6,
                    borderRadius: 18, backgroundColor: '#111318', borderWidth: 1.5, borderColor: '#1e2028',
                    position: 'relative' },
  reachIcon:      { fontSize: 22 },
  reachLabel:     { color: '#bbb', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  reachDesc:      { color: '#666', fontSize: 9, fontWeight: '600', textAlign: 'center' },
  reachDot:       { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5 },
  reachLock:      { position: 'absolute', top: 6, right: 6 },

  // Gender pills — full-width 3-up row
  genderRow:      { flexDirection: 'row', gap: 10 },
  genderPill:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                    paddingVertical: 14, borderRadius: 18, backgroundColor: '#111318',
                    borderWidth: 1.5, borderColor: '#1e2028' },
  genderPillIcon: { fontSize: 20 },
  genderPillTxt:  { color: '#aaa', fontSize: 13, fontWeight: '800' },

  // Age range steppers
  ageRangeVal:    { color: BOND_PINK, fontSize: 12, fontWeight: '800' },
  ageRow:         { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ageStepper:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: '#111318', borderRadius: 18, borderWidth: 1.5, borderColor: '#1e2028',
                    paddingHorizontal: 4, paddingVertical: 6 },
  ageBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0e1016',
                    alignItems: 'center', justifyContent: 'center' },
  ageBtnTxt:      { color: '#fff', fontSize: 20, fontWeight: '300', lineHeight: 24 },
  ageVal:         { color: '#fff', fontSize: 18, fontWeight: '900', minWidth: 34, textAlign: 'center' },
  ageTo:          { color: '#666', fontSize: 13, fontWeight: '700' },

  // Country search bar
  countrySearchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111318',
                        borderRadius: 14, borderWidth: 1.5, borderColor: '#1e2028',
                        paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 10 },
  countrySearchIcon:  { fontSize: 14 },
  countrySearchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', padding: 0 },
  countrySearchClear: { color: '#444', fontSize: 13, fontWeight: '700' },

  // Region tabs
  regionTabScroll: { marginBottom: 10 },
  regionTabRow:    { gap: 6, paddingRight: 4 },
  regionTab:       { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
                     backgroundColor: '#111318', borderWidth: 1.5, borderColor: '#1e2028' },
  regionTabActive: { backgroundColor: BOND_PINK + '20', borderColor: BOND_PINK },
  regionTabTxt:    { color: '#777', fontSize: 12, fontWeight: '800' },
  regionTabTxtActive: { color: BOND_PINK },

  // Anywhere pill
  anywherePill:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111318',
                     borderRadius: 14, borderWidth: 1.5, borderColor: '#1e2028',
                     paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  anywherePillActive: { backgroundColor: BOND_PINK + '18', borderColor: BOND_PINK },
  anywhereFlag:    { fontSize: 20 },
  anywhereTxt:     { color: '#bbb', fontSize: 13, fontWeight: '800', flex: 1 },
  anywhereCheck:   { color: BOND_PINK, fontSize: 13, fontWeight: '900' },

  // Country flag grid
  countryGridScroll: { maxHeight: 220 },
  flagGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  flagTile:       { width: '18%', alignItems: 'center', gap: 4, paddingVertical: 8,
                    borderRadius: 14, backgroundColor: '#111318', borderWidth: 1.5, borderColor: '#1e2028',
                    position: 'relative' },
  flagTileActive: { backgroundColor: BOND_PINK + '18', borderColor: BOND_PINK },
  flagEmoji:      { fontSize: 22 },
  flagName:       { color: '#888', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  flagNameActive: { color: BOND_PINK },
  flagCheck:      { position: 'absolute', top: 4, right: 4, width: 13, height: 13,
                    borderRadius: 6.5, backgroundColor: BOND_PINK, alignItems: 'center', justifyContent: 'center' },
  flagCheckTxt:   { color: '#fff', fontSize: 7, fontWeight: '900' },

  // Apply button
  applyBtn:       { marginTop: 24, borderRadius: 24, paddingVertical: 17, alignItems: 'center', backgroundColor: BOND_PINK,
                    shadowColor: BOND_PINK, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  applyTxt:       { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
});

// ── WorldBond Footprint card styles ──────────────────────────────────────────
const fp2 = StyleSheet.create({
  // Signal header
  signalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  signalBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14,
                   borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  signalEmoji:   { fontSize: 13 },
  signalName:    { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  bondsLeft:     { alignItems: 'flex-end' },
  bondsLeftNum:  { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 18 },
  bondsLeftLabel:{ color: '#333', fontSize: 10, fontWeight: '700' },
  topRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 6 },
  vibeChip:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#0e1016', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#252730' },
  vibeIcon:     { fontSize: 18, color: '#666', fontWeight: '700' },
  vibeTxt:      { color: '#888', fontSize: 13, fontWeight: '700', flex: 1 },
  caret:        { color: '#555', fontSize: 10 },
  shuffleBtn:   { width: 46, height: 46, borderRadius: 23, backgroundColor: '#0e1016', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#252730' },
  shuffleIcon:  { fontSize: 20, color: '#888', fontWeight: '700' },

  card:         { flex: 1, marginHorizontal: 14, marginBottom: 6, borderRadius: 30, overflow: 'hidden',
                  shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 28, shadowOffset: { width: 0, height: 10 } },
  cardGrad:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20, gap: 8 },

  avatarZone:   { alignItems: 'center', gap: 10, marginBottom: 4 },
  onlinePill:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#57f28715', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#57f28730' },
  onlineDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#57f287' },
  onlineTxt:    { color: '#57f287', fontSize: 11, fontWeight: '700' },

  name:         { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  handle:       { color: '#444', fontSize: 13, textAlign: 'center', marginTop: -2 },
  locRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  locTxt:       { color: '#777', fontSize: 14, fontWeight: '700' },

  // World Footprint Trail — the hero unique element
  trailWrap:    { alignSelf: 'stretch', marginTop: 18, marginBottom: 4 },
  trailLabel:   { color: '#555', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 14 },
  trail:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  trailNode:    { width: 52, height: 52, borderRadius: 26, backgroundColor: '#111318', borderWidth: 1, borderColor: '#1e2028', alignItems: 'center', justifyContent: 'center' },
  trailFlag:    { fontSize: 26 },
  trailConnector:{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  trailDot:     { width: 3, height: 3, borderRadius: 2, backgroundColor: '#2a2c34' },
  trailLine:    { width: 16, height: 1, backgroundColor: '#1e2028' },

  tagline:      { color: '#777', fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginTop: 8, paddingHorizontal: 20 },
  profileHint:  { marginTop: 10, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2a2c3a' },
  profileHintTxt:{ color: '#666', fontSize: 12, fontWeight: '700' },
  swipeHintRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  swipeHintPass: { color: '#555', fontSize: 11, fontWeight: '800' },
  swipeHintDot:  { color: '#333', fontSize: 11 },
  swipeHintBond: { color: '#555', fontSize: 11, fontWeight: '800' },

  actions:      { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 },
  nextBtn:      { flex: 1, borderRadius: 24, paddingVertical: 17, alignItems: 'center', backgroundColor: '#161820', borderWidth: 1, borderColor: '#353744' },
  nextTxt:      { color: '#aaa', fontSize: 15, fontWeight: '800' },
  bondBtn:      { flex: 2, borderRadius: 24, paddingVertical: 17, alignItems: 'center', backgroundColor: BOND_PINK,
                  shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  bondTxt:      { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.4 },

  // Cooldown wall
  cooldownWall:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  cooldownLockBox:   { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 4 },
  cooldownLockTxt:   { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  cooldownTitle:     { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  cooldownSub:       { color: '#444', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  cooldownTimerBox:  { alignItems: 'center', backgroundColor: '#0e1016', borderRadius: 24, borderWidth: 1,
                       borderColor: '#1e2028', paddingHorizontal: 32, paddingVertical: 20, gap: 4, width: '100%' },
  cooldownTimerLabel:{ color: '#333', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  cooldownTimer:     { color: '#fff', fontSize: 46, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  cooldownTimerNote: { color: '#2a2c34', fontSize: 11, fontWeight: '700' },
  cooldownUpgradeBtn:{ marginTop: 12, width: '100%', borderRadius: 24, paddingVertical: 17, alignItems: 'center',
                       backgroundColor: BOND_PINK, shadowColor: BOND_PINK, shadowOpacity: 0.5,
                       shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  cooldownUpgradeTxt:{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  cooldownOr:        { color: '#2a2c34', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },

  // Bond Signal strip
  signalStrip:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginBottom: 8,
                       paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderWidth: 1 },
  signalStripLabel:  { fontSize: 12, fontWeight: '800' },
  signalStripSub:    { color: '#2a2c34', fontSize: 11, fontWeight: '600', flex: 1 },
  signalUpgradeArrow:{ fontSize: 11, fontWeight: '800' },
});

// ── Full Profile View styles ──────────────────────────────────────────────────
const pv = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#000' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: 16, paddingTop: 58, paddingBottom: 10 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111318',
                 alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2028' },
  backIcon:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  onlinePill:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#57f28715',
                 borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6,
                 borderWidth: 1, borderColor: '#57f28730' },
  onlineDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#57f287' },
  onlineTxt:   { color: '#57f287', fontSize: 12, fontWeight: '700' },

  // Photo gallery
  photoScroll: { height: 340 },
  photoTile:   { width: width, height: 340, overflow: 'hidden' },
  photoTileGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  swipeHint:   { position: 'absolute', bottom: 14, right: 16, flexDirection: 'row', alignItems: 'center',
                 backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  swipeHintTxt:{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700' },
  emptyPhotoTile: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyPhotoIcon: { fontSize: 36, opacity: 0.18 },
  emptyPhotoTxt: { color: '#1e2028', fontSize: 12, fontWeight: '700' },
  photoDots:   { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  photoDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#1e2028' },
  photoDotActive: { backgroundColor: BOND_PINK, width: 16 },

  // Identity
  identity:    { paddingHorizontal: 20, paddingTop: 18, gap: 4 },
  name:        { color: '#fff', fontSize: 30, fontWeight: '900' },
  handle:      { color: '#333', fontSize: 14 },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  locTxt:      { color: '#555', fontSize: 15, fontWeight: '700' },

  // Stats
  statsRow:    { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: '#0e1016',
                 borderRadius: 18, paddingVertical: 16, borderWidth: 1, borderColor: '#1e2028' },
  statItem:    { flex: 1, alignItems: 'center', gap: 4 },
  statVal:     { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel:   { color: '#666', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statDiv:     { width: 1, backgroundColor: '#1e2028' },

  // Sections
  section:     { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel:{ color: '#2a2c34', fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 12 },
  bioTxt:      { color: '#888', fontSize: 15, lineHeight: 24 },

  taglineBox:  { marginHorizontal: 20, marginTop: 20, padding: 18, backgroundColor: '#0a0b10',
                 borderRadius: 18, borderWidth: 1, borderColor: '#1a1b22' },
  taglineTxt:  { color: '#444', fontSize: 15, fontStyle: 'italic', lineHeight: 24, textAlign: 'center' },

  // Interests
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:         { backgroundColor: '#111318', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
                 borderWidth: 1, borderColor: '#1e2028' },
  tagTxt:      { color: '#666', fontSize: 13, fontWeight: '700' },

  // World Footprint
  trail:       { flexDirection: 'row', alignItems: 'center' },
  trailNode:   { width: 54, height: 54, borderRadius: 27, backgroundColor: '#111318',
                 borderWidth: 1, borderColor: '#1e2028', alignItems: 'center', justifyContent: 'center' },
  trailFlag:   { fontSize: 28 },
  trailConnector: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5 },
  trailDot:    { width: 3, height: 3, borderRadius: 2, backgroundColor: '#2a2c34' },
  trailLine:   { width: 18, height: 1, backgroundColor: '#1e2028' },

  // Action buttons
  actions:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12,
                 paddingHorizontal: 16, paddingBottom: 34, paddingTop: 14,
                 backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#0e1016' },
  nextBtn:     { flex: 1, borderRadius: 24, paddingVertical: 17, alignItems: 'center',
                 backgroundColor: '#0e1016', borderWidth: 1, borderColor: '#1e2028' },
  nextTxt:     { color: '#444', fontSize: 15, fontWeight: '800' },
  bondBtn:     { flex: 2, borderRadius: 24, paddingVertical: 17, alignItems: 'center',
                 backgroundColor: BOND_PINK, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 5 } },
  bondTxt:     { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
});

const st = StyleSheet.create({
  // Filter row (horizontal scroll)
  filterScrollView:    { flexGrow: 0, flexShrink: 0 },
  filterRow:           { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  filterChip:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0e1016', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#1e2028' },
  filterChipActive:    { borderColor: BOND_PINK, backgroundColor: BOND_PINK + '18' },
  filterChipIcon:      { fontSize: 13 },
  filterChipTxt:       { color: '#555', fontSize: 12, fontWeight: '700' },
  filterChipTxtActive: { color: '#fff' },
  filterChipCaret:     { color: '#2a2c34', fontSize: 9, marginLeft: 1 },

  // Card deck
  deckWrap:         { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  card:             { width: CARD_W, height: '100%', borderRadius: 26, overflow: 'hidden',
                      shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  cardPulseRing:    { borderRadius: 26, borderWidth: 2 },
  cardGradient:     { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardAvatarWrap:   { alignItems: 'center', gap: 10, marginBottom: 110 },
  cardAvatar:       { width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center',
                      borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.12)' },
  cardAvatarTxt:    { fontSize: 44, fontWeight: '900', color: 'rgba(255,255,255,0.9)' },
  tapHint:          { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  onlineDot:        { position: 'absolute', top: 16, right: 16, width: 11, height: 11, borderRadius: 5.5,
                      backgroundColor: '#57f287', borderWidth: 2, borderColor: 'rgba(0,0,0,0.5)' },
  cardBottom:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 18, gap: 5 },
  cardNameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName:         { color: '#fff', fontSize: 23, fontWeight: '900', flex: 1, letterSpacing: -0.4 },
  cardFlagPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)',
                      borderRadius: 13, paddingHorizontal: 9, paddingVertical: 5 },
  cardFlagTxt:      { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
  cardTagline:      { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 19 },
  connectsLeft:     { position: 'absolute', bottom: 4, alignSelf: 'center' },
  connectsLeftTxt:  { color: '#333', fontSize: 10 },

  // Swipe stamp labels
  swipeLabel:       { position: 'absolute', top: 34, paddingHorizontal: 14, paddingVertical: 7,
                      borderRadius: 8, borderWidth: 2.5, zIndex: 20 },
  connectLabel:     { right: 18, borderColor: BOND_PINK, transform: [{ rotate: '14deg' }] },
  connectLabelTxt:  { color: BOND_PINK, fontSize: 20, fontWeight: '900', letterSpacing: 0.8 },
  passLabel:        { left: 18, borderColor: '#888', transform: [{ rotate: '-14deg' }] },
  passLabelTxt:     { color: '#888', fontSize: 20, fontWeight: '900', letterSpacing: 0.8 },

  // Action buttons
  actionRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 18, paddingHorizontal: 28, paddingTop: 12, paddingBottom: 24 },
  btnPass:          { alignItems: 'center', gap: 3, width: 64, height: 64, borderRadius: 32,
                      backgroundColor: '#0e1016', borderWidth: 1.5, borderColor: '#2a2a2a',
                      justifyContent: 'center' },
  btnPassIcon:      { color: '#555', fontSize: 22, fontWeight: '900' },
  btnRandom:        { alignItems: 'center', justifyContent: 'center', gap: 2,
                      width: 78, height: 78, borderRadius: 39,
                      backgroundColor: BOND_PINK, shadowColor: BOND_PINK,
                      shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  btnRandomIcon:    { fontSize: 28 },
  btnRandomLabel:   { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  btnConnect:       { alignItems: 'center', gap: 3, width: 64, height: 64, borderRadius: 32,
                      backgroundColor: '#0e1016', borderWidth: 1.5, borderColor: BOND_PINK + '66',
                      justifyContent: 'center' },
  btnConnectIcon:   { fontSize: 22 },
  btnLabel:         { color: '#555', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  btnDim:           { opacity: 0.3 },

  // Profile sheet (redesigned)
  profileSheet:          { backgroundColor: '#111318', borderTopLeftRadius: 26, borderTopRightRadius: 26,
                           padding: 22, paddingBottom: 38, position: 'absolute', bottom: 0, left: 0, right: 0 },
  profilePhotoHero:      { alignItems: 'center', marginBottom: 14, position: 'relative' },
  profileOnlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8,
                           backgroundColor: '#57f28720', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
                           borderWidth: 1, borderColor: '#57f28740' },
  profileOnlineDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#57f287' },
  profileOnlineTxt:      { color: '#57f287', fontSize: 11, fontWeight: '700' },
  profileSheetName:      { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  profileSheetHandle:    { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 2, marginBottom: 6 },
  profileSheetLoc:       { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 12 },
  profileSheetLocTxt:    { color: '#888', fontSize: 14, fontWeight: '700' },
  profileSheetTagline:   { color: '#555', fontSize: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 20, marginBottom: 16 },
  profileMeta:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  profileMetaItem:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14 },
  profileMetaSep:        { width: 1, height: 20, backgroundColor: '#1e2028' },
  profileMetaIcon:       { fontSize: 14 },
  profileMetaVal:        { color: '#777', fontSize: 12, fontWeight: '700' },
  profileSectionLabel:   { color: '#333', fontSize: 10, fontWeight: '900', letterSpacing: 1.2,
                           textTransform: 'uppercase', marginBottom: 8 },
  profileTrailPill:      { backgroundColor: '#0e1016', borderRadius: 12, padding: 8,
                           borderWidth: 1, borderColor: '#1e2028' },
  profileBtns:           { flexDirection: 'row', gap: 12, marginTop: 4 },
  profileBtnPass:        { flex: 1, borderRadius: 22, paddingVertical: 14, alignItems: 'center',
                           backgroundColor: '#0e1016', borderWidth: 1, borderColor: '#2a2a2a' },
  profileBtnPassTxt:     { color: '#666', fontSize: 15, fontWeight: '800' },
  profileBtnConnect:     { flex: 2, borderRadius: 22, paddingVertical: 14, alignItems: 'center',
                           backgroundColor: BOND_PINK },
  profileBtnConnectTxt:  { color: '#fff', fontSize: 15, fontWeight: '900' },

  // Locking / searching
  lockScreen:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, padding: 32 },
  lockOrbWrap:   { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockRing:      { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1.5 },
  lockOrb:       { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center',
                   borderWidth: 1, borderColor: '#ffffff0d' },
  lockTitle:     { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.4 },
  lockSub:       { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  cancelBtn:     { backgroundColor: '#0e1016', borderRadius: 18, paddingVertical: 13, paddingHorizontal: 38,
                   borderWidth: 1, borderColor: '#2F3336' },
  cancelTxt:     { color: '#888', fontSize: 15, fontWeight: '700' },

  // Match screen
  matchScreen:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  matchContent:       { alignItems: 'center', gap: 18, paddingHorizontal: 32 },
  matchLogoWrap:      { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  matchLogoGlow:      { position: 'absolute', width: 80, height: 80, borderRadius: 40 },
  matchTitle:         { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  matchSub:           { color: 'rgba(255,255,255,0.45)', fontSize: 15, textAlign: 'center' },
  matchAvatarRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  matchAvatarWrap:    { alignItems: 'center', gap: 8 },
  matchConnector:     { flexDirection: 'row', alignItems: 'center', gap: 0 },
  matchConnLine:      { width: 20, height: 2 },
  matchConnDot:       { width: 10, height: 10, borderRadius: 5 },
  matchAvatar:        { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 2.5, borderColor: BOND_PINK + '60' },
  matchAvatarInitial: { color: '#fff', fontSize: 30, fontWeight: '900' },
  matchAvatarLabel:   { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700' },
  matchMsgBtn:        { borderRadius: 28, overflow: 'hidden', width: '100%' },
  matchMsgGrad:       { paddingVertical: 16, paddingHorizontal: 48, alignItems: 'center' },
  matchMsgTxt:        { color: '#fff', fontSize: 16, fontWeight: '900' },
  matchSkipBtn:       { paddingVertical: 12, alignItems: 'center' },
  matchSkipTxt:       { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '700' },

  // Chat
  connHeader:    { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
                   borderBottomWidth: 1, borderBottomColor: '#1a1c22' },
  connOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6,
                   backgroundColor: '#57f287', borderWidth: 2, borderColor: '#000' },
  connName:      { color: '#fff', fontSize: 16, fontWeight: '800' },
  connSub:       { color: '#444', fontSize: 12, marginTop: 2 },
  endBtn:        { backgroundColor: '#e5393520', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
                   borderWidth: 1, borderColor: '#e5393540' },
  endTxt:        { color: '#e53935', fontSize: 13, fontWeight: '800' },
  emptyChat:     { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyChatTxt:  { color: '#555', fontSize: 14, textAlign: 'center' },
  msgRow:        { flexDirection: 'row' },
  msgRowMine:    { justifyContent: 'flex-end' },
  bubble:        { maxWidth: width * 0.72, borderRadius: 18, padding: 12 },
  bubbleMine:    { backgroundColor: BOND_PINK, borderBottomRightRadius: 4 },
  bubbleOther:   { backgroundColor: '#0e1016', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#1e2028' },
  msgTxt:        { color: '#fff', fontSize: 14, lineHeight: 20 },
  translated:    { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 },
  inputRow:      { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1a1c22',
                   gap: 10, alignItems: 'flex-end' },
  input:         { flex: 1, backgroundColor: '#0e1016', color: '#fff', borderRadius: 22,
                   paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#1e2028' },
  sendBtn:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon:      { color: '#fff', fontSize: 18 },

  // Bond signal on locking screen
  signalBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1,
                     paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16 },
  signalBadgeTxt:  { fontSize: 12, fontWeight: '800' },
  signalUpgradeBtn:{ marginBottom: 12, backgroundColor: BOND_PINK + '18', borderRadius: 16, borderWidth: 1, borderColor: BOND_PINK + '33',
                     paddingHorizontal: 18, paddingVertical: 10 },
  signalUpgradeTxt:{ color: BOND_PINK, fontSize: 13, fontWeight: '800' },
});

// ─── People tab ───────────────────────────────────────────────────────────────
function PeopleTab({ user, navigation, bondMatches = [], setBondMatches }) {
  const [activeChat,      setActiveChat]      = useState(null);
  const [chatMessages,    setChatMessages]    = useState([]);
  const [chatText,        setChatText]        = useState('');
  const [online,          setOnline]          = useState({});
  const [showBondProfile, setShowBondProfile] = useState(false);
  const [newMatches,      setNewMatches]      = useState([]);
  const [apiConnections,  setApiConnections]  = useState([]);
  const chatListRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    socket.on('user_list', users => {
      const map = {};
      users.forEach(u => { if (u.userId) map[String(u.userId)] = u; });
      setOnline(map);
    });
    if (socket.connected) socket.emit('get_users');
    else socket.once('connect', () => socket.emit('get_users'));
    return () => socket.off('user_list');
  }, []);

  useEffect(() => { loadApiData(); }, []);

  async function loadApiData() {
    try {
      const headers = await authHeader();
      const [dailyRes, confRes] = await Promise.allSettled([
        axios.get(`${SERVER_URL}/api/matches/daily`, { headers, timeout: 8000 }),
        axios.get(`${SERVER_URL}/api/matches`,       { headers, timeout: 8000 }),
      ]);
      if (dailyRes.status === 'fulfilled') setNewMatches(dailyRes.value.data || []);
      if (confRes.status  === 'fulfilled') setApiConnections(confRes.value.data || []);
    } catch {}
  }

  useEffect(() => {
    if (!activeChat) return;
    const handler = ({ text, sender }) => {
      setChatMessages(prev => [...prev, { text, sender, ts: Date.now() }]);
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 60);
    };
    socket.on('random_message', handler);
    return () => socket.off('random_message', handler);
  }, [activeChat]);

  function openChat(match) {
    setActiveChat(match);
    setChatMessages(match.messages || []);
    setChatText('');
  }

  function sendChatMsg() {
    if (!chatText.trim() || !activeChat) return;
    const msg = { text: chatText.trim(), sender: 'me', ts: Date.now() };
    socket.emit('random_message', { roomKey: activeChat.roomKey, text: chatText.trim() });
    setChatMessages(prev => [...prev, msg]);
    setChatText('');
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 60);
  }

  function deleteMessage(index) {
    Alert.alert('Delete message', 'Remove this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          setChatMessages(prev => prev.filter((_, i) => i !== index));
        }
      },
    ]);
  }

  function deleteConversation(roomKey) {
    Alert.alert('Delete conversation', 'Remove this bond match and all messages?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          setBondMatches(prev => prev.filter(m => m.roomKey !== roomKey));
          if (activeChat?.roomKey === roomKey) setActiveChat(null);
        }
      },
    ]);
  }

  // ── Full-screen chat view (shown instead of inbox when a thread is open) ──
  if (activeChat) {
    const mu   = activeChat.matchedUser || {};
    const name = mu.display_name || mu.username || 'Bond';
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Chat header */}
        <View style={pe.chatHdr}>
          <TouchableOpacity style={pe.chatBack} onPress={() => setActiveChat(null)} activeOpacity={0.8}>
            <Text style={pe.chatBackTxt}>←</Text>
          </TouchableOpacity>

          {/* Tappable avatar + name → profile */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
            onPress={() => setShowBondProfile(true)}
            activeOpacity={0.75}
          >
            <View style={{ position: 'relative' }}>
              <Avatar photo_url={mu.photo_url} name={name} size={38} />
              {online[mu.user_id] && <View style={pe.chatOnlineDot} />}
            </View>
            <View>
              <Text style={pe.chatHdrName}>{name}</Text>
              <Text style={pe.chatHdrSub}>Bond Match  ›</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Messages */}
        <FlatList
          ref={chatListRef}
          data={chatMessages}
          keyExtractor={(_, i) => String(i)}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1, justifyContent: chatMessages.length === 0 ? 'center' : 'flex-start' }}
          ListEmptyComponent={
            <View style={pe.chatEmpty}>
              <View style={pe.chatEmptyOrb}>
                <WorldMark size={32} color="#fff" bondColor={BOND_PINK} />
              </View>
              <Text style={pe.chatEmptyTitle}>You're bonded!</Text>
              <Text style={pe.chatEmptySub}>Say hello to {name}</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMe = item.sender === 'me' || item.sender === user?.user_id || item.sender === user?.username;
            const swipeRef = React.createRef();
            const renderMsgActions = (progress, dragX) => {
              const scale = dragX.interpolate({ inputRange: [-120, 0], outputRange: [1, 0.8], extrapolate: 'clamp' });
              return (
                <Animated.View style={[pe.swipeActions, { transform: [{ scale }] }]}>
                  <TouchableOpacity style={[pe.swipeAction, pe.swipeDelete]}
                    onPress={() => { swipeRef.current?.close(); deleteMessage(index); }} activeOpacity={0.8}>
                    <Text style={pe.swipeActionTxt}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[pe.swipeAction, pe.swipeFlag]}
                    onPress={() => { swipeRef.current?.close(); Alert.alert('Message flagged', 'Thanks for letting us know.'); }} activeOpacity={0.8}>
                    <Text style={pe.swipeActionTxt}>Flag</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[pe.swipeAction, pe.swipeReport]}
                    onPress={() => { swipeRef.current?.close(); Alert.alert('Report sent', 'Our team will review this message.'); }} activeOpacity={0.8}>
                    <Text style={pe.swipeActionTxt}>Report</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            };
            return (
              <Swipeable ref={swipeRef} renderRightActions={renderMsgActions} overshootRight={false} friction={2}>
                <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', paddingVertical: 2 }}>
                  <View style={[pe.bubble, isMe ? pe.bubbleMe : pe.bubbleThem]}>
                    <Text style={[pe.bubbleTxt, isMe ? pe.bubbleTxtMe : pe.bubbleTxtThem]}>{item.text}</Text>
                  </View>
                </View>
              </Swipeable>
            );
          }}
        />

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={pe.inputRow}>
            <TextInput
              style={pe.input}
              placeholder="Message…"
              placeholderTextColor="#333"
              value={chatText}
              onChangeText={setChatText}
              returnKeyType="send"
              onSubmitEditing={sendChatMsg}
              multiline
            />
            <TouchableOpacity style={[pe.sendBtn, chatText.trim() && { backgroundColor: BOND_PINK }]}
              onPress={sendChatMsg} activeOpacity={0.8}>
              <Text style={pe.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Bond profile modal */}
        <Modal visible={showBondProfile} transparent animationType="slide" onRequestClose={() => setShowBondProfile(false)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 58, paddingBottom: 14,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              borderBottomWidth: 1, borderBottomColor: '#0e1016' }}>
              <TouchableOpacity style={pe.chatBack} onPress={() => setShowBondProfile(false)}>
                <Text style={pe.chatBackTxt}>←</Text>
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{name}'s Profile</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
              {/* Avatar hero */}
              <LinearGradient
                colors={[mu.avatarColor ? mu.avatarColor + '44' : BOND_PINK + '44', '#050507']}
                style={{ alignItems: 'center', paddingVertical: 36, gap: 12 }}
              >
                <Avatar photo_url={mu.photo_url} name={name} size={110} />
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{name}{mu.age ? `, ${mu.age}` : ''}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{mu.username}</Text>
                {mu.flag || mu.country ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {mu.flag && <Text style={{ fontSize: 22 }}>{mu.flag}</Text>}
                    {mu.country && <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: '700' }}>{mu.country}</Text>}
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: '#57f28715', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#57f287' }} />
                  <Text style={{ color: '#57f287', fontSize: 12, fontWeight: '700' }}>Bond Match</Text>
                </View>
              </LinearGradient>

              {/* Bio */}
              {mu.bio ? (
                <View style={{ marginHorizontal: 20, marginTop: 20 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 }}>ABOUT</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 }}>{mu.bio}</Text>
                </View>
              ) : null}

              {/* Tagline */}
              {mu.tagline ? (
                <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: '#111318',
                  borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e2028' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>"</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontStyle: 'italic', lineHeight: 22 }}>{mu.tagline}</Text>
                </View>
              ) : null}

              {/* Interests */}
              {mu.interests?.length > 0 ? (
                <View style={{ marginHorizontal: 20, marginTop: 20 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 }}>INTERESTS</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {mu.interests.map((tag, i) => (
                      <View key={i} style={{ backgroundColor: '#111318', borderRadius: 20,
                        paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#1e2028' }}>
                        <Text style={{ color: '#aaa', fontSize: 13, fontWeight: '600' }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* World Footprint */}
              {mu.trail?.length > 0 ? (
                <View style={{ marginHorizontal: 20, marginTop: 24 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 14 }}>WORLD FOOTPRINT</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {mu.trail.map((flag, i) => (
                      <React.Fragment key={i}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#111318',
                          borderWidth: 1, borderColor: '#1e2028', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 24 }}>{flag}</Text>
                        </View>
                        {i < mu.trail.length - 1 && (
                          <Text style={{ color: '#2a2c34', marginHorizontal: 4, fontSize: 12 }}>›</Text>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }

  // ── Message Center (inbox) ──────────────────────────────────────────────────
  const allConversations = [
    ...bondMatches.map(m => ({ _type: 'live', ...m })),
    ...apiConnections.map(c => ({ _type: 'api', ...c })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={pe.inboxHdr}>
        <Text style={pe.inboxTitle}>People</Text>
        {allConversations.length > 0 && (
          <View style={pe.inboxBadge}>
            <Text style={pe.inboxBadgeTxt}>{allConversations.length}</Text>
          </View>
        )}
      </View>

      {/* New Matches strip */}
      {newMatches.length > 0 && (
        <View>
          <Text style={pe.matchesLabel}>New Bonds</Text>
          <FlatList
            data={newMatches}
            horizontal
            keyExtractor={item => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={pe.matchStrip}
            renderItem={({ item }) => {
              const name    = item.display_name || 'Someone';
              const avatarC = stringToColor(name);
              const isOnline = online[item.matched_user_id || item.user_id];
              return (
                <TouchableOpacity
                  style={pe.matchBubble}
                  onPress={() => {
                    const uid = String(item.matched_user_id || item.user_id);
                    navigation.navigate('Chat', {
                      otherUser: {
                        userId: uid,
                        username: item.display_name,
                        display_name: item.display_name,
                        photo_url: item.photo_url,
                        country: item.country,
                        socketId: online[uid]?.socketId,
                      },
                      currentUser: null,
                      matchId: item.id,
                      compatibilityScore: item.compatibility_score,
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <View style={{ position: 'relative' }}>
                    {item.photo_url ? (
                      <Image source={{ uri: item.photo_url }} style={pe.matchAvatar} />
                    ) : (
                      <LinearGradient colors={[avatarC, avatarC + '88']} style={pe.matchAvatar}>
                        <Text style={pe.matchInitial}>{name[0]?.toUpperCase()}</Text>
                      </LinearGradient>
                    )}
                    {isOnline && <View style={pe.matchOnlineDot} />}
                  </View>
                  <Text style={pe.matchName} numberOfLines={1}>{name.split(' ')[0]}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      <Text style={pe.messagesLabel}>Messages</Text>

      {allConversations.length === 0 ? (
        /* ── Empty state ── */
        <View style={pe.emptyWrap}>
          <View style={pe.emptyIcon}>
            <View style={pe.emptyBubble1} />
            <View style={pe.emptyBubble2} />
          </View>
          <Text style={pe.emptyTitle}>No bonds yet</Text>
          <Text style={pe.emptySub}>
            Swipe on Connect to bond with people worldwide.{'\n'}Your conversations will appear here.
          </Text>
        </View>
      ) : (
        /* ── Conversation list ── */
        <FlatList
          data={allConversations}
          keyExtractor={m => m._type === 'live' ? m.roomKey : `api-${m.id}`}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={pe.divider} />}
          renderItem={({ item: m }) => {
            let mu, name, isOnline, preview, isUnread, timeStr, handlePress;

            if (m._type === 'live') {
              mu       = m.matchedUser || {};
              name     = mu.display_name || mu.username || 'Bond';
              isOnline = !!online[String(mu.user_id)];
              const lastMsg = m.messages?.length > 0 ? m.messages[m.messages.length - 1] : null;
              preview  = lastMsg ? lastMsg.text : 'Start the conversation';
              isUnread = !lastMsg;
              const ts = m.ts ? new Date(m.ts) : null;
              timeStr  = ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              handlePress = () => openChat(m);
            } else {
              const uid = String(m.matched_user_id || m.user_id);
              const onlineUser = online[uid];
              mu       = { photo_url: m.photo_url, user_id: uid };
              name     = m.display_name || 'Someone';
              isOnline = !!onlineUser;
              preview  = isOnline ? 'Online now · Say hello' : 'Start the conversation';
              isUnread = true;
              timeStr  = '';
              handlePress = () => {
                navigation.navigate('Chat', {
                  otherUser: {
                    userId: uid,
                    username: name,
                    display_name: name,
                    photo_url: m.photo_url,
                    country: m.country,
                    socketId: onlineUser?.socketId,
                  },
                  currentUser: null,
                  matchId: m.id,
                  compatibilityScore: m.compatibility_score,
                });
              };
            }

            const threadRef = React.createRef();
            const renderThreadActions = () => (
              <View style={pe.threadSwipeActions}>
                {m._type === 'live' && (
                  <TouchableOpacity style={[pe.threadSwipeAction, pe.threadSwipeDelete]}
                    onPress={() => { threadRef.current?.close(); deleteConversation(m.roomKey); }} activeOpacity={0.8}>
                    <Text style={pe.threadSwipeActionTxt}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[pe.threadSwipeAction, pe.threadSwipeReport]}
                  onPress={() => { threadRef.current?.close(); Alert.alert('Reported', 'Thanks for keeping WorldBond safe.'); }} activeOpacity={0.8}>
                  <Text style={pe.threadSwipeActionTxt}>Report</Text>
                </TouchableOpacity>
              </View>
            );
            return (
              <Swipeable ref={threadRef} renderRightActions={renderThreadActions} overshootRight={false} friction={2}>
                <TouchableOpacity style={pe.thread} onPress={handlePress} activeOpacity={0.8}>
                  {/* Avatar + online */}
                  <View style={{ position: 'relative', marginRight: 14 }}>
                    <Avatar photo_url={mu.photo_url} name={name} size={54} />
                    {isOnline && <View style={pe.threadOnlineDot} />}
                  </View>
                  {/* Text content */}
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={pe.threadName}>{name}</Text>
                      <Text style={pe.threadTime}>{timeStr}</Text>
                    </View>
                    <Text style={[pe.threadPreview, isUnread && pe.threadPreviewUnread]}
                      numberOfLines={1}>{preview}</Text>
                  </View>
                  {/* Unread badge */}
                  {isUnread && (
                    <View style={pe.threadNewBadge}>
                      <Text style={pe.threadNewTxt}>NEW</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Swipeable>
            );
          }}
        />
      )}
    </View>
  );
}
const pe = StyleSheet.create({
  // ── New Matches strip ──
  matchesLabel:     { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3, paddingHorizontal: 20, marginBottom: 12 },
  matchStrip:       { paddingHorizontal: 20, paddingBottom: 4, gap: 20 },
  matchBubble:      { alignItems: 'center', width: 64 },
  matchAvatar:      { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BOND_PINK },
  matchInitial:     { color: '#fff', fontSize: 24, fontWeight: '800' },
  matchName:        { color: '#aaa', fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 5 },
  matchOnlineDot:   { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#57f287', borderWidth: 2, borderColor: '#000' },
  messagesLabel:    { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3, paddingHorizontal: 20, marginTop: 20, marginBottom: 4 },

  // ── Inbox header ──
  inboxHdr:         { flexDirection: 'row', alignItems: 'center', gap: 10,
                      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  inboxTitle:       { color: '#fff', fontSize: 22, fontWeight: '900', flex: 1 },
  inboxBadge:       { backgroundColor: BOND_PINK, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  inboxBadgeTxt:    { color: '#fff', fontSize: 12, fontWeight: '900' },

  // ── Thread rows ──
  thread:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  threadOnlineDot:  { position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: 7,
                      backgroundColor: '#57f287', borderWidth: 2.5, borderColor: '#000' },
  threadName:       { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1 },
  threadTime:       { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '600' },
  threadPreview:    { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 18 },
  threadPreviewUnread: { color: BOND_PINK, fontWeight: '700' },
  threadNewBadge:   { backgroundColor: BOND_PINK, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 10 },
  threadNewTxt:     { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  divider:          { height: 1, backgroundColor: '#0e1016', marginLeft: 88 },

  // ── Empty state ──
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, paddingBottom: 60 },
  emptyIcon:        { width: 64, height: 52, position: 'relative', marginBottom: 4 },
  emptyBubble1:     { position: 'absolute', left: 0, bottom: 0, width: 42, height: 36, borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 2, borderColor: BOND_PINK + '60', backgroundColor: BOND_PINK + '12' },
  emptyBubble2:     { position: 'absolute', right: 0, top: 0, width: 34, height: 28, borderRadius: 14, borderBottomRightRadius: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' },
  emptyTitle:       { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptySub:         { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // ── Full-screen chat ──
  chatHdr:          { flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14,
                      borderBottomWidth: 1, borderBottomColor: '#0e1016', backgroundColor: '#000' },
  chatBack:         { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111318',
                      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e2028' },
  chatBackTxt:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  chatOnlineDot:    { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6,
                      backgroundColor: '#57f287', borderWidth: 2, borderColor: '#000' },
  chatHdrName:      { color: '#fff', fontSize: 16, fontWeight: '800' },
  chatHdrSub:       { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 },
  chatEmpty:        { alignItems: 'center', gap: 10 },
  chatEmptyTitle:   { color: '#fff', fontSize: 18, fontWeight: '900' },
  chatEmptySub:     { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  chatEmptyOrb:     { width: 68, height: 68, borderRadius: 34, backgroundColor: BOND_PINK + '15', borderWidth: 1, borderColor: BOND_PINK + '35', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bubble:           { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 11 },
  bubbleMe:         { backgroundColor: BOND_PINK, borderBottomRightRadius: 4 },
  bubbleThem:       { backgroundColor: '#111318', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#1e2028' },
  bubbleTxt:        { fontSize: 15, lineHeight: 21 },
  bubbleTxtMe:      { color: '#fff' },
  bubbleTxtThem:    { color: '#ccc' },
  inputRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 10,
                      paddingHorizontal: 14, paddingVertical: 12, paddingBottom: 28,
                      borderTopWidth: 1, borderTopColor: '#0e1016', backgroundColor: '#000' },
  input:            { flex: 1, backgroundColor: '#111318', color: '#fff', borderRadius: 24,
                      paddingHorizontal: 18, paddingVertical: 13, fontSize: 15,
                      maxHeight: 100, borderWidth: 1, borderColor: '#1e2028' },
  sendBtn:          { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1a1c22',
                      alignItems: 'center', justifyContent: 'center' },
  sendIcon:         { color: '#fff', fontSize: 16, marginLeft: 2 },

  // ── Swipe-to-reveal (message bubbles) ──
  swipeActions:       { flexDirection: 'row', alignItems: 'center', paddingLeft: 8 },
  swipeAction:        { alignItems: 'center', justifyContent: 'center', width: 68,
                        borderRadius: 16, marginLeft: 6, paddingVertical: 10, gap: 3 },
  swipeDelete:        { backgroundColor: '#e5393520', borderWidth: 1, borderColor: '#e5393540' },
  swipeFlag:          { backgroundColor: '#FFB70020', borderWidth: 1, borderColor: '#FFB70040' },
  swipeReport:        { backgroundColor: '#55555520', borderWidth: 1, borderColor: '#55555540' },
  swipeActionTxt:     { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  // ── Swipe-to-reveal (inbox threads) ──
  threadSwipeActions: { flexDirection: 'row', alignItems: 'stretch' },
  threadSwipeAction:  { alignItems: 'center', justifyContent: 'center', width: 80, gap: 4 },
  threadSwipeDelete:  { backgroundColor: '#e53935' },
  threadSwipeReport:  { backgroundColor: '#555' },
  threadSwipeActionTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DiscoverScreen({ navigation, user, route }) {
  const { colors } = useTheme();
  const [activeTab,   setActiveTab]   = useState('icebreaker');
  const [bondMatches, setBondMatches] = useState([]);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const paramTab = route?.params?.tab;
    if (paramTab && TABS.find(t => t.id === paramTab)) {
      switchTab(paramTab);
    }
  }, [route?.params?.tab]);

  function switchTab(id) {
    const idx = TABS.findIndex(t => t.id === id);
    Animated.spring(indicatorX, { toValue: idx * TAB_W, friction: 8, tension: 60, useNativeDriver: true }).start();
    setActiveTab(id);
  }

  function addBondMatch(matchedUser, roomKey) {
    setBondMatches(prev => {
      if (prev.find(m => m.roomKey === roomKey)) return prev;
      return [{ matchedUser, roomKey, messages: [], ts: Date.now() }, ...prev];
    });
  }

  const headerSlide = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerSlide }] }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>New ways to connect with the world</Text>
        </View>
      </Animated.View>

      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.tabItem}
              onPress={() => switchTab(t.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
        <Animated.View style={[styles.tabIndicator, { transform: [{ translateX: indicatorX }], width: TAB_W }]} />
      </View>

      {/* ── Content ── */}
      {activeTab === 'icebreaker' && <IcebreakerTab user={user} navigation={navigation} />}
      {activeTab === 'random'     && <RandomTab user={user} navigation={navigation} onMatch={addBondMatch} switchTab={switchTab} />}
      {activeTab === 'people'     && <PeopleTab user={user} navigation={navigation} bondMatches={bondMatches} setBondMatches={setBondMatches} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#000000' },

  header:        { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  title:         { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle:      { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 3 },

  tabBar:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e2028', position: 'relative' },
  tabItem:       { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabLabel:      { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  tabLabelActive:{ color: '#fff', fontWeight: '900' },
  tabIndicator:  { position: 'absolute', bottom: 0, height: 2, backgroundColor: BOND_PINK, borderRadius: 2 },
});
