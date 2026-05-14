import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, FlatList, Linking, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../services/socket';
import { usePremium, TIERS } from '../context/PremiumContext';

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', baseUrl: 'https://instagram.com/' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', baseUrl: 'https://tiktok.com/@' },
  { key: 'twitter', label: 'X / Twitter', icon: '🐦', baseUrl: 'https://x.com/' },
  { key: 'snapchat', label: 'Snapchat', icon: '👻', baseUrl: 'https://snapchat.com/add/' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', baseUrl: 'https://youtube.com/' },
];

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🔥', label: 'Hyped' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🎵', label: 'Vibing' },
  { emoji: '📚', label: 'Studying' },
  { emoji: '🍜', label: 'Eating' },
  { emoji: '✈️', label: 'Traveling' },
  { emoji: '💪', label: 'Working out' },
  { emoji: '🌙', label: 'Late night' },
  { emoji: '☕', label: 'Chillin' },
  { emoji: '🎨', label: 'Creating' },
];

// Cultural Posts tab
function CulturalPostsTab({ user }) {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌍');
  const [selectedCategory, setSelectedCategory] = useState('daily life');
  const socket = getSocket();

  const CATEGORIES = ['food', 'tradition', 'music', 'humor', 'language', 'places', 'daily life', 'celebration'];
  const EMOJIS = ['🌍', '🍜', '🎵', '😂', '🏛️', '🗺️', '🎉', '🤝', '🏠', '👨‍👩‍👧‍👦', '🎭', '🌺'];

  useEffect(() => {
    socket.emit('get_cultural_posts');
    socket.on('cultural_posts', setPosts);
    return () => socket.off('cultural_posts');
  }, []);

  function submit() {
    if (!text.trim()) return;
    socket.emit('submit_cultural_post', { text: text.trim(), emoji: selectedEmoji, category: selectedCategory });
    setText('');
  }

  function like(postId) {
    socket.emit('like_cultural_post', { postId });
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.postForm}>
        <Text style={styles.postFormTitle}>🌍 Share something about your culture</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
          {EMOJIS.map(e => (
            <TouchableOpacity key={e} onPress={() => setSelectedEmoji(e)} style={[styles.emojiBtn, selectedEmoji === e && styles.emojiBtnActive]}>
              <Text style={styles.emojiBtnText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setSelectedCategory(c)} style={[styles.catChip, selectedCategory === c && styles.catChipActive]}>
              <Text style={[styles.catChipText, selectedCategory === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput
          style={styles.postInput}
          placeholder={`${selectedEmoji} Tell the world something about ${user.country?.split(' ').slice(1).join(' ')}...`}
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={280}
        />
        <TouchableOpacity style={[styles.postBtn, !text.trim() && styles.postBtnDisabled]} onPress={submit} disabled={!text.trim()}>
          <Text style={styles.postBtnText}>Post to the World 🌍</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.postList}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Text style={styles.postEmoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.postMeta}>
                  <Text style={styles.postUsername}>{item.username}</Text>
                  <Text style={styles.postCountry}>{item.country}</Text>
                </View>
                <View style={styles.postCatBadge}>
                  <Text style={styles.postCatText}>{item.category}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.likeBtn} onPress={() => like(item.id)}>
                <Text style={styles.likeIcon}>❤️</Text>
                <Text style={styles.likeCount}>{item.likes}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.postText}>{item.text}</Text>
            <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <Text style={styles.emptyPostsText}>No posts yet — be the first! 🌍</Text>
          </View>
        }
      />
    </View>
  );
}

export default function MyProfileScreen({ navigation, user, onLogout }) {
  const { tier, tierInfo, isPremium, upgradeTo } = usePremium();
  const [socials, setSocials] = useState(user.socials || {});
  const [editingSocials, setEditingSocials] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [tab, setTab] = useState('profile');
  const socket = getSocket();

  function saveSocials() {
    socket.emit('update_socials', { socials });
    setEditingSocials(false);
  }

  function setMood(mood) {
    setSelectedMood(mood);
    socket.emit('set_mood', { mood: mood.emoji, status: mood.label });
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('worldbond_user');
        onLogout?.();
      }},
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Me 👤</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {['profile', 'culture'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'profile' ? '👤 Profile' : '🌍 Culture Board'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'profile' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
              {selectedMood && <Text style={styles.moodBubble}>{selectedMood.emoji}</Text>}
            </View>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.country}>{user.country}</Text>
            <View style={styles.tierBadge}>
              <Text style={[styles.tierBadgeText, { color: TIERS[tier]?.color }]}>
                {tier === 'free' ? '🆓 Free' : tier === 'plus' ? '💜 Plus' : '⭐ Pro'}
              </Text>
            </View>
          </View>

          {/* Mood */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Set Your Mood</Text>
            <View style={styles.moodsGrid}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.emoji}
                  style={[styles.moodBtn, selectedMood?.emoji === m.emoji && styles.moodBtnActive]}
                  onPress={() => setMood(m)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Social Links */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Social Links</Text>
              <TouchableOpacity onPress={() => editingSocials ? saveSocials() : setEditingSocials(true)}>
                <Text style={styles.editBtn}>{editingSocials ? 'Save' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            {SOCIAL_PLATFORMS.map(p => (
              <View key={p.key} style={styles.socialCard}>
                <Text style={styles.socialIcon}>{p.icon}</Text>
                {editingSocials ? (
                  <TextInput
                    style={styles.socialEditInput}
                    placeholder={p.label + ' handle'}
                    placeholderTextColor="#555"
                    value={socials[p.key] || ''}
                    onChangeText={val => setSocials(s => ({ ...s, [p.key]: val }))}
                    autoCapitalize="none"
                  />
                ) : (
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      const handle = socials[p.key];
                      if (handle?.trim()) Linking.openURL(p.baseUrl + handle.replace('@', '').trim());
                    }}
                    disabled={!socials[p.key]?.trim()}
                  >
                    <Text style={[styles.socialHandle, !socials[p.key]?.trim() && styles.socialHandleEmpty]}>
                      {socials[p.key]?.trim() || `Add ${p.label}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Subscription */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={[styles.subCard, { borderColor: tierInfo?.color + '66' }]}>
              <Text style={[styles.subTier, { color: tierInfo?.color }]}>{tierInfo?.label}</Text>
              <Text style={styles.subPrice}>{tierInfo?.price}</Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Text style={styles.upgradeBtnText}>{isPremium ? 'Manage Subscription' : '⬆️ Upgrade to Premium'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {tab === 'culture' && <CulturalPostsTab user={user} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  logoutBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: '#e53935', fontSize: 13, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#6c63ff' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#6c63ff' },
  scroll: { padding: 20, gap: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', gap: 8, paddingBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6c63ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  moodBubble: { position: 'absolute', bottom: 0, right: 0, fontSize: 22, backgroundColor: '#0f0f1a', borderRadius: 12, padding: 2 },
  username: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  country: { color: '#888', fontSize: 14 },
  tierBadge: { backgroundColor: '#1a1a2e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  tierBadgeText: { fontSize: 13, fontWeight: '700' },
  section: { gap: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#aaa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  editBtn: { color: '#6c63ff', fontSize: 14, fontWeight: '600' },
  moodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodBtn: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 10, alignItems: 'center', width: '22%', borderWidth: 1, borderColor: '#2a2a4a' },
  moodBtnActive: { backgroundColor: '#6c63ff22', borderColor: '#6c63ff' },
  moodEmoji: { fontSize: 24 },
  moodLabel: { color: '#888', fontSize: 9, marginTop: 4, textAlign: 'center' },
  socialCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  socialIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  socialHandle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  socialHandleEmpty: { color: '#444', fontStyle: 'italic' },
  socialEditInput: { flex: 1, color: '#fff', fontSize: 14, padding: 0 },
  subCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTier: { fontSize: 16, fontWeight: '700' },
  subPrice: { color: '#888', fontSize: 14 },
  upgradeBtn: { backgroundColor: '#6c63ff', borderRadius: 14, padding: 14, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  postForm: { backgroundColor: '#1a1a2e', margin: 16, borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: '#2a2a4a' },
  postFormTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emojiRow: { gap: 8, paddingVertical: 2 },
  emojiBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a4a' },
  emojiBtnActive: { backgroundColor: '#6c63ff33', borderColor: '#6c63ff' },
  emojiBtnText: { fontSize: 22 },
  catRow: { gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: '#2a2a4a' },
  catChipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  catChipText: { color: '#888', fontSize: 12 },
  catChipTextActive: { color: '#fff', fontWeight: '700' },
  postInput: { backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 70, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2a2a4a' },
  postBtn: { backgroundColor: '#6c63ff', borderRadius: 12, padding: 12, alignItems: 'center' },
  postBtnDisabled: { backgroundColor: '#333' },
  postBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  postList: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  postCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2a2a4a', gap: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  postEmoji: { fontSize: 32 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  postUsername: { color: '#fff', fontWeight: '600', fontSize: 13 },
  postCountry: { color: '#888', fontSize: 11 },
  postCatBadge: { backgroundColor: '#6c63ff22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  postCatText: { color: '#6c63ff', fontSize: 10 },
  likeBtn: { alignItems: 'center' },
  likeIcon: { fontSize: 18 },
  likeCount: { color: '#e57373', fontSize: 11, fontWeight: '700' },
  postText: { color: '#ddd', fontSize: 14, lineHeight: 20 },
  postTime: { color: '#555', fontSize: 11 },
  emptyPosts: { alignItems: 'center', paddingTop: 30 },
  emptyPostsText: { color: '#888', fontSize: 14 },
});
