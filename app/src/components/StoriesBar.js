import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image,
} from 'react-native';

export default function StoriesBar({ stories, currentUserId, onStoryPress, onAddStory }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {/* Add story bubble */}
      <TouchableOpacity style={styles.item} onPress={onAddStory}>
        <View style={[styles.ring, styles.addRing]}>
          <View style={styles.avatar}>
            <Text style={styles.plus}>＋</Text>
          </View>
        </View>
        <Text style={styles.name}>Your Story</Text>
      </TouchableOpacity>

      {stories.map(group => {
        const isOwn = group.userId === currentUserId;
        const latest = group.stories[0];
        return (
          <TouchableOpacity
            key={group.userId}
            style={styles.item}
            onPress={() => onStoryPress(group)}
          >
            <View style={[styles.ring, isOwn && styles.ownRing]}>
              <View style={styles.avatar}>
                {latest?.imageUrl ? (
                  <Image source={{ uri: latest.imageUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarEmoji}>{group.mood || '🌍'}</Text>
                )}
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {isOwn ? 'You' : group.username}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const BUBBLE = 64;

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 10, gap: 14 },
  item: { alignItems: 'center', gap: 4, width: BUBBLE + 4 },
  ring: {
    width: BUBBLE + 4, height: BUBBLE + 4, borderRadius: (BUBBLE + 4) / 2,
    padding: 2,
    borderWidth: 2, borderColor: '#6c63ff',
  },
  addRing: { borderColor: '#333', borderStyle: 'dashed' },
  ownRing: { borderColor: '#e91e63' },
  avatar: {
    flex: 1, borderRadius: BUBBLE / 2,
    backgroundColor: '#1a1a2e',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: 26 },
  plus: { fontSize: 28, color: '#6c63ff' },
  name: { color: '#aaa', fontSize: 10, maxWidth: BUBBLE + 4, textAlign: 'center' },
});
