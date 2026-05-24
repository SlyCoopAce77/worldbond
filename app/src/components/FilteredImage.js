import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export const FILTERS = [
  { id: 'normal',  name: 'Normal',  overlay: null },
  { id: 'warm',    name: 'Warm',    overlay: { color: '#ff9a3c', opacity: 0.22 } },
  { id: 'cool',    name: 'Cool',    overlay: { color: '#4fc3f7', opacity: 0.22 } },
  { id: 'bw',      name: 'B&W',     overlay: { color: '#808080', opacity: 0.72 } },
  { id: 'fade',    name: 'Fade',    overlay: { color: '#ffffff', opacity: 0.28 } },
  { id: 'drama',   name: 'Drama',   overlay: { color: '#000000', opacity: 0.32 } },
  { id: 'rose',    name: 'Rose',    overlay: { color: '#e91e63', opacity: 0.18 } },
  { id: 'mint',    name: 'Mint',    overlay: { color: '#4db6ac', opacity: 0.22 } },
  { id: 'vintage', name: 'Vintage', overlay: { color: '#8d6e63', opacity: 0.30 } },
  { id: 'vivid',   name: 'Vivid',   overlay: { color: '#5865f2', opacity: 0.14 } },
  { id: 'golden',  name: 'Golden',  overlay: { color: '#ffd600', opacity: 0.20 } },
  { id: 'dusk',    name: 'Dusk',    overlay: { color: '#6a1b9a', opacity: 0.22 } },
];

export function getFilter(filterId) {
  return FILTERS.find(f => f.id === filterId) || FILTERS[0];
}

export default function FilteredImage({ uri, filterId, style, resizeMode = 'cover' }) {
  const filter = getFilter(filterId);

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
      />
      {filter.overlay && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: filter.overlay.color, opacity: filter.overlay.opacity },
          ]}
        />
      )}
    </View>
  );
}
