import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView,
  Platform, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { SERVER_URL } from '../services/socket';
import { getAccessToken } from '../services/authApi';

const { width } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────
const CONNECTION_TYPES = [
  { key: 'dating',      label: 'Dating',           emoji: '❤️',  color: '#e91e63', grad: ['#4a0a1a', '#1a0008'] },
  { key: 'friendship',  label: 'Friendship',       emoji: '🤝',  color: '#2196f3', grad: ['#0a1f3d', '#050e1a'] },
  { key: 'travel',      label: 'Travel Buddy',     emoji: '✈️',  color: '#ff9800', grad: ['#3d2200', '#1a0e00'] },
  { key: 'language',    label: 'Language Exchange',emoji: '💬',  color: '#26c6da', grad: ['#002f38', '#001218'] },
  { key: 'mentorship',  label: 'Mentorship',       emoji: '🎓',  color: '#57f287', grad: ['#0a2d14', '#041008'] },
];

const CATEGORIES = [
  { key: 'food',      label: 'Food',      emoji: '🍜' },
  { key: 'travel',    label: 'Travel',    emoji: '✈️' },
  { key: 'music',     label: 'Music',     emoji: '🎵' },
  { key: 'sports',    label: 'Sports',    emoji: '⚽' },
  { key: 'language',  label: 'Language',  emoji: '📚' },
  { key: 'arts',      label: 'Arts',      emoji: '🎨' },
  { key: 'outdoors',  label: 'Outdoors',  emoji: '🏔️' },
  { key: 'business',  label: 'Business',  emoji: '💼' },
  { key: 'wellness',  label: 'Wellness',  emoji: '🧘' },
];

function ctMeta(key) {
  return CONNECTION_TYPES.find(c => c.key === key) || CONNECTION_TYPES[1];
}
function catMeta(key) {
  return CATEGORIES.find(c => c.key === key) || { emoji: '🌍', label: 'Other' };
}

async function authHeader() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ ct, active, onPress }) {
  const isAll = !ct;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        fc.chip,
        active && !isAll && { backgroundColor: ct.color + '20', borderColor: ct.color + '55' },
        active && isAll  && { backgroundColor: '#5865f220', borderColor: '#5865f255' },
      ]}
    >
      {ct && <Text style={{ fontSize: 14 }}>{ct.emoji}</Text>}
      <Text style={[fc.text, active && { color: ct ? ct.color : '#5865f2' }]}>
        {ct ? ct.label : 'All'}
      </Text>
    </TouchableOpacity>
  );
}
const fc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38' },
  text: { color: '#555', fontSize: 12, fontWeight: '700' },
});

// ─── Experience card ──────────────────────────────────────────────────────────
function ExpCard({ item, index, onApply }) {
  const ct  = ctMeta(item.connection_type);
  const cat = catMeta(item.category);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 360, delay: index * 55, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 60, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={card.wrap}>
        {/* Gradient top strip with category icon */}
        <LinearGradient colors={ct.grad} style={card.header}>
          <Text style={card.catEmoji}>{cat.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={card.title} numberOfLines={2}>{item.title}</Text>
            <Text style={card.author}>
              {item.display_name}
              {item.city ? ` · ${item.city}` : ''}
              {item.profile_country ? ` · ${item.profile_country}` : ''}
            </Text>
          </View>
          <View style={[card.ctBadge, { backgroundColor: ct.color + '25', borderColor: ct.color + '55' }]}>
            <Text style={{ fontSize: 16 }}>{ct.emoji}</Text>
            <Text style={[card.ctLabel, { color: ct.color }]}>{ct.label}</Text>
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={card.body}>
          {item.description ? (
            <Text style={card.desc} numberOfLines={3}>{item.description}</Text>
          ) : null}

          <View style={card.tagsRow}>
            <View style={[card.tag, { backgroundColor: ct.color + '15', borderColor: ct.color + '40' }]}>
              <Text style={[card.tagText, { color: ct.color }]}>{ct.emoji} {ct.label}</Text>
            </View>
            <View style={card.tag}>
              <Text style={card.tagText}>{cat.emoji} {cat.label}</Text>
            </View>
            {item.is_global ? (
              <View style={card.tag}>
                <Text style={card.tagText}>🌍 Global</Text>
              </View>
            ) : (
              <View style={card.tag}>
                <Text style={card.tagText}>📍 Local</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={card.applyWrap}
            onPress={() => onApply(item)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[ct.color, ct.color + 'bb']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={card.applyGrad}
            >
              <Text style={card.applyText}>Show Interest →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
const card = StyleSheet.create({
  wrap:      { backgroundColor: '#12122a', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#1e1e38', marginBottom: 12 },
  header:    { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  catEmoji:  { fontSize: 34, marginTop: 2 },
  title:     { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 22 },
  author:    { color: '#ffffff66', fontSize: 12, marginTop: 4 },
  ctBadge:   { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center', gap: 3, borderWidth: 1, flexShrink: 0 },
  ctLabel:   { fontSize: 10, fontWeight: '800' },
  body:      { padding: 16, gap: 12 },
  desc:      { color: '#888', fontSize: 13, lineHeight: 20 },
  tagsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e1e38', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2a4a' },
  tagText:   { color: '#888', fontSize: 11, fontWeight: '600' },
  applyWrap: { borderRadius: 14, overflow: 'hidden' },
  applyGrad: { paddingVertical: 12, alignItems: 'center' },
  applyText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

// ─── Create modal ─────────────────────────────────────────────────────────────
function CreateModal({ visible, onClose, user, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', category: '', connection_type: '',
    country: user?.country || '', city: user?.city || '', is_global: false,
  });
  const [loading, setLoading] = useState(false);
  const ct = ctMeta(form.connection_type);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.title.trim() || !form.connection_type || !form.category) return;
    setLoading(true);
    try {
      const headers = await authHeader();
      await axios.post(`${SERVER_URL}/api/experiences`, form, { headers, timeout: 10000 });
      setForm({ title: '', description: '', category: '', connection_type: '', country: user?.country || '', city: user?.city || '', is_global: false });
      onCreated();
      onClose();
    } catch {}
    finally { setLoading(false); }
  }

  const canSubmit = form.title.trim() && form.connection_type && form.category;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cm.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={cm.sheet}>
            <View style={cm.handle} />
            <View style={cm.headerRow}>
              <Text style={cm.title}>Post an Experience</Text>
              <TouchableOpacity style={cm.closeBtn} onPress={onClose}>
                <Text style={cm.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
              {/* Title */}
              <View>
                <Text style={cm.label}>What do you want to share?</Text>
                <TextInput
                  style={cm.input}
                  placeholder="e.g. Try street food in Bangkok with someone fun"
                  placeholderTextColor="#444"
                  value={form.title}
                  onChangeText={t => update('title', t)}
                  maxLength={200}
                />
              </View>

              {/* Description */}
              <View>
                <Text style={cm.label}>Description (optional)</Text>
                <TextInput
                  style={[cm.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Tell them a bit more about you and this experience..."
                  placeholderTextColor="#444"
                  value={form.description}
                  onChangeText={t => update('description', t)}
                  multiline
                  maxLength={300}
                />
              </View>

              {/* Connection type */}
              <View>
                <Text style={cm.label}>Connection Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                  {CONNECTION_TYPES.map(c => (
                    <TouchableOpacity
                      key={c.key}
                      style={[cm.typeChip, form.connection_type === c.key && { backgroundColor: c.color + '25', borderColor: c.color + '66' }]}
                      onPress={() => update('connection_type', c.key)}
                    >
                      <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                      <Text style={[cm.typeText, form.connection_type === c.key && { color: c.color }]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Category */}
              <View>
                <Text style={cm.label}>Category</Text>
                <View style={cm.catGrid}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[cm.catChip, form.category === cat.key && cm.catChipActive]}
                      onPress={() => update('category', cat.key)}
                    >
                      <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                      <Text style={[cm.catLabel, form.category === cat.key && { color: '#fff' }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Global toggle */}
              <TouchableOpacity
                style={[cm.globalBtn, form.is_global && cm.globalBtnActive]}
                onPress={() => update('is_global', !form.is_global)}
              >
                <Text style={cm.globalIcon}>{form.is_global ? '🌍' : '📍'}</Text>
                <Text style={[cm.globalText, form.is_global && { color: '#5865f2' }]}>
                  {form.is_global ? 'Global — visible to anyone worldwide' : 'Local — visible to people near you'}
                </Text>
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity
                style={[cm.submitWrap, !canSubmit && { opacity: 0.4 }]}
                onPress={submit}
                disabled={!canSubmit || loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={form.connection_type ? [ct.color, ct.color + 'bb'] : ['#5865f2', '#4752c4']}
                  style={cm.submitGrad}
                >
                  <Text style={cm.submitText}>{loading ? 'Posting…' : 'Post Experience 🌍'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#0d0d1f', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%', borderWidth: 1, borderColor: '#1e1e38' },
  handle:       { width: 40, height: 4, backgroundColor: '#2a2a4a', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:        { color: '#fff', fontSize: 22, fontWeight: '900' },
  closeBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: '#12122a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e1e38' },
  closeIcon:    { color: '#555', fontSize: 14 },
  label:        { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input:        { backgroundColor: '#12122a', color: '#fff', borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#1e1e38' },
  typeChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#12122a', borderWidth: 1, borderColor: '#1e1e38' },
  typeText:     { color: '#555', fontSize: 12, fontWeight: '700' },
  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip:      { width: (width - 48 - 20) / 3, backgroundColor: '#12122a', borderRadius: 16, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#1e1e38' },
  catChipActive:{ backgroundColor: '#5865f222', borderColor: '#5865f255' },
  catLabel:     { color: '#555', fontSize: 11, fontWeight: '700' },
  globalBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#12122a', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1e1e38' },
  globalBtnActive:{ backgroundColor: '#5865f218', borderColor: '#5865f240' },
  globalIcon:   { fontSize: 20 },
  globalText:   { color: '#555', fontSize: 13, fontWeight: '600', flex: 1 },
  submitWrap:   { borderRadius: 16, overflow: 'hidden' },
  submitGrad:   { paddingVertical: 16, alignItems: 'center' },
  submitText:   { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ExperiencesScreen({ navigation, user }) {
  const [experiences, setExperiences] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [filterType,  setFilterType]  = useState(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const loadExperiences = useCallback(async () => {
    try {
      const headers = await authHeader();
      const params  = {};
      if (filterType) params.connection_type = filterType;
      if (user?.country) params.country = user.country;
      const { data } = await axios.get(`${SERVER_URL}/api/experiences`, { headers, params, timeout: 8000 });
      setExperiences(data || []);
    } catch {}
    finally { setLoading(false); }
  }, [filterType]);

  useEffect(() => {
    setLoading(true);
    loadExperiences();
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [loadExperiences]);

  async function handleApply(exp) {
    try {
      const headers = await authHeader();
      await axios.post(`${SERVER_URL}/api/experiences/${exp.id}/apply`, { message: '' }, { headers, timeout: 10000 });
    } catch {}
  }

  const headerSlide = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerSlide }] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Experiences</Text>
          {experiences.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{experiences.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.postBtn} onPress={() => setShowCreate(true)}>
          <LinearGradient colors={['#5865f2', '#4752c4']} style={styles.postGrad}>
            <Text style={styles.postText}>+ Post</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Filters ── */}
      <FlatList
        data={[null, ...CONNECTION_TYPES]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <FilterChip
            ct={item}
            active={filterType === (item ? item.key : null)}
            onPress={() => setFilterType(item ? item.key : null)}
          />
        )}
        style={{ flexGrow: 0, marginBottom: 8 }}
      />

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={{ fontSize: 36 }}>✨</Text>
          <Text style={styles.loadingText}>Finding experiences…</Text>
        </View>
      ) : (
        <FlatList
          data={experiences}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 52 }}>🌍</Text>
              <Text style={styles.emptyTitle}>No experiences yet</Text>
              <Text style={styles.emptySub}>Be the first to post something you want to share with someone from anywhere in the world.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ExpCard item={item} index={index} onApply={handleApply} />
          )}
        />
      )}

      <CreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        user={user}
        onCreated={loadExperiences}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0a0a18' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  backBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: '#12122a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e1e38' },
  backIcon:     { color: '#fff', fontSize: 26, lineHeight: 30, marginTop: -2 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:        { color: '#fff', fontSize: 22, fontWeight: '900' },
  countPill:    { backgroundColor: '#5865f222', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#5865f240' },
  countText:    { color: '#5865f2', fontSize: 12, fontWeight: '800' },
  postBtn:      { borderRadius: 14, overflow: 'hidden' },
  postGrad:     { paddingHorizontal: 16, paddingVertical: 9 },
  postText:     { color: '#fff', fontSize: 14, fontWeight: '800' },

  filtersRow:   { paddingHorizontal: 20, gap: 8 },

  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { color: '#555', fontSize: 15 },

  list:         { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },

  empty:        { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle:   { color: '#fff', fontSize: 22, fontWeight: '800' },
  emptySub:     { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
