import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { getSocket } from '../services/socket';

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', baseUrl: 'https://instagram.com/' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', baseUrl: 'https://tiktok.com/@' },
  { key: 'twitter', label: 'X / Twitter', icon: '🐦', baseUrl: 'https://x.com/' },
  { key: 'snapchat', label: 'Snapchat', icon: '👻', baseUrl: 'https://snapchat.com/add/' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', baseUrl: 'https://youtube.com/' },
];

function stringToColor(str = '') {
  const colors = ['#e57373', '#ba68c8', '#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#4db6ac', '#7986cb'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

async function openSocial(platform, handle) {
  const raw = handle.replace('@', '').trim();
  const url = platform.baseUrl + raw;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    Linking.openURL(url);
  } else {
    Alert.alert('Cannot open link', url);
  }
}

export default function ProfileScreen({ route, navigation }) {
  const { profileUser } = route.params;
  const socials = profileUser.socials || {};
  const hasSocials = Object.entries(socials).some(([, v]) => v?.trim());
  const avatarColor = stringToColor(profileUser.username);
  const socket = getSocket();

  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const isOwnProfile = profileUser.socketId === socket.id;

  useEffect(() => {
    if (!isOwnProfile && profileUser.socketId) {
      socket.emit('get_follow_status', { targetUserId: profileUser.socketId });
    }
    socket.on('follow_status', ({ targetUserId, following: f, followersCount: fc, followingCount: fgc }) => {
      if (targetUserId === profileUser.socketId) {
        setFollowing(f);
        if (fc !== undefined) setFollowersCount(fc);
        if (fgc !== undefined) setFollowingCount(fgc);
      }
    });
    return () => socket.off('follow_status');
  }, [profileUser.socketId]);

  function toggleFollow() {
    if (!profileUser.socketId) return;
    if (following) {
      socket.emit('unfollow_user', { targetUserId: profileUser.socketId });
    } else {
      socket.emit('follow_user', { targetUserId: profileUser.socketId });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar & name */}
        <View style={styles.profileTop}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{profileUser.username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{profileUser.username}</Text>
          <Text style={styles.country}>{profileUser.country}</Text>
          <View style={styles.langBadge}>
            <Text style={styles.langText}>{profileUser.language?.toUpperCase()} speaker</Text>
          </View>

          {/* Follower / following counts */}
          <View style={styles.statsInline}>
            <View style={styles.statInline}>
              <Text style={styles.statInlineNum}>{followersCount}</Text>
              <Text style={styles.statInlineLbl}>Followers</Text>
            </View>
            <View style={styles.statInlineSep} />
            <View style={styles.statInline}>
              <Text style={styles.statInlineNum}>{followingCount}</Text>
              <Text style={styles.statInlineLbl}>Following</Text>
            </View>
          </View>

          {/* Follow button */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followBtnActive]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                {following ? '✓ Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Social links */}
        {hasSocials ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Media</Text>
            {SOCIAL_PLATFORMS.map(platform => {
              const handle = socials[platform.key];
              if (!handle?.trim()) return null;
              return (
                <TouchableOpacity
                  key={platform.key}
                  style={styles.socialCard}
                  onPress={() => openSocial(platform, handle)}
                >
                  <Text style={styles.socialIcon}>{platform.icon}</Text>
                  <View style={styles.socialInfo}>
                    <Text style={styles.socialPlatform}>{platform.label}</Text>
                    <Text style={styles.socialHandle}>{handle}</Text>
                  </View>
                  <Text style={styles.socialArrow}>↗</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Media</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No social links added yet</Text>
            </View>
          </View>
        )}

        {/* Stats card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🌍</Text>
              <Text style={styles.statLabel}>Country</Text>
              <Text style={styles.statValue} numberOfLines={2}>{profileUser.country}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💬</Text>
              <Text style={styles.statLabel}>Language</Text>
              <Text style={styles.statValue}>{profileUser.language?.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e', gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: '#6c63ff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, gap: 24 },
  profileTop: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  country: { color: '#888', fontSize: 14, marginTop: 4 },
  langBadge: { marginTop: 10, backgroundColor: '#6c63ff22', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  langText: { color: '#6c63ff', fontSize: 13, fontWeight: '600' },
  statsInline: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 24 },
  statInline: { alignItems: 'center', gap: 2 },
  statInlineNum: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statInlineLbl: { color: '#888', fontSize: 11 },
  statInlineSep: { width: 1, height: 30, backgroundColor: '#2a2a4a' },
  followBtn: {
    marginTop: 16, paddingHorizontal: 40, paddingVertical: 10,
    borderRadius: 22, borderWidth: 1.5, borderColor: '#6c63ff',
  },
  followBtnActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  followBtnText: { color: '#6c63ff', fontSize: 15, fontWeight: '700' },
  followBtnTextActive: { color: '#fff' },
  section: { gap: 12 },
  sectionTitle: { color: '#aaa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  socialCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e',
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2a4a', gap: 12,
  },
  socialIcon: { fontSize: 26 },
  socialInfo: { flex: 1 },
  socialPlatform: { color: '#aaa', fontSize: 11, marginBottom: 2 },
  socialHandle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  socialArrow: { color: '#6c63ff', fontSize: 20, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a',
  },
  emptyText: { color: '#555', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a', gap: 6,
  },
  statEmoji: { fontSize: 28 },
  statLabel: { color: '#888', fontSize: 11, textTransform: 'uppercase' },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
