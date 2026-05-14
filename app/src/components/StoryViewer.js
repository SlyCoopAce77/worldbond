import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, Modal, StyleSheet,
  TouchableOpacity, TouchableWithoutFeedback,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import FilteredImage from './FilteredImage';

const { width: W, height: H } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer({ visible, storyGroup, onClose, onDelete, currentUserId, onViewStory }) {
  const [storyIndex, setStoryIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const stories = storyGroup?.stories || [];
  const current = stories[storyIndex];

  useEffect(() => {
    if (!visible || !current) return;
    startTimer();
    if (onViewStory) onViewStory(current.id);
    return () => clearTimer();
  }, [visible, storyIndex, storyGroup]);

  function startTimer() {
    clearTimer();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) goNext();
    });
  }

  function clearTimer() {
    timer.current && clearTimeout(timer.current);
    progress.stopAnimation();
  }

  function goNext() {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(i => i + 1);
    } else {
      onClose();
    }
  }

  function goPrev() {
    if (storyIndex > 0) setStoryIndex(i => i - 1);
    else startTimer();
  }

  if (!visible || !storyGroup || !current) return null;

  const isOwn = current.userId === currentUserId;
  const timeLeft = Math.max(0, current.expiresAt - Date.now());
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minsLeft = Math.floor((timeLeft % 3600000) / 60000);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Background image */}
        <FilteredImage
          uri={current.imageUrl}
          filterId={current.filter || 'normal'}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.overlay} />

        {/* Progress bars */}
        <View style={styles.progressRow}>
          {stories.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: i < storyIndex
                      ? '100%'
                      : i === storyIndex
                        ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarMood}>{storyGroup.mood || '🌍'}</Text>
            </View>
            <View>
              <Text style={styles.username}>{storyGroup.username}</Text>
              <Text style={styles.time}>
                {hoursLeft > 0 ? `${hoursLeft}h` : `${minsLeft}m`} left
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tap zones */}
        <View style={styles.tapRow}>
          <TouchableWithoutFeedback onPress={goPrev}>
            <View style={styles.tapLeft} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={goNext}>
            <View style={styles.tapRight} />
          </TouchableWithoutFeedback>
        </View>

        {/* Caption */}
        {!!current.caption && (
          <View style={styles.captionBox}>
            <Text style={styles.caption}>{current.caption}</Text>
          </View>
        )}

        {/* Delete for own story */}
        {isOwn && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => { onDelete(current.id); onClose(); }}
          >
            <Text style={styles.deleteTxt}>🗑 Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  progressRow: {
    flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingTop: 50, paddingBottom: 8,
  },
  progressTrack: {
    flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 8,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a1a2e',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff',
  },
  avatarMood: { fontSize: 20 },
  username: { color: '#fff', fontWeight: '700', fontSize: 14 },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  closeBtn: { padding: 8 },
  closeTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tapRow: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 120 },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
  captionBox: {
    position: 'absolute', bottom: 80, left: 0, right: 0,
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  caption: { color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  deleteBtn: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    backgroundColor: 'rgba(255,50,50,0.8)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
  },
  deleteTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
