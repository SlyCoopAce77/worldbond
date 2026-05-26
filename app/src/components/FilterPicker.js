import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FilteredImage, { FILTERS } from './FilteredImage';

export default function FilterPicker({ imageUri, selectedFilter, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filter</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={styles.item}
            onPress={() => onSelect(f.id)}
          >
            <View style={[styles.thumb, selectedFilter === f.id && styles.thumbActive]}>
              {imageUri ? (
                <FilteredImage
                  uri={imageUri}
                  filterId={f.id}
                  style={styles.thumbImage}
                />
              ) : (
                <View style={[styles.thumbImage, { backgroundColor: '#2F3336' }]} />
              )}
            </View>
            <Text style={[styles.name, selectedFilter === f.id && styles.nameActive]}>
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: '#aaa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 2 },
  row: { gap: 10, paddingVertical: 4 },
  item: { alignItems: 'center', gap: 5 },
  thumb: {
    width: 68, height: 68, borderRadius: 12,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: '#E8003D' },
  thumbImage: { width: '100%', height: '100%' },
  name: { color: '#666', fontSize: 10 },
  nameActive: { color: '#E8003D', fontWeight: '700' },
});
