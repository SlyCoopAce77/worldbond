import React, { useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function FloatingReaction({ emoji, id, onDone, rise = 220, duration = 1800, bottom = 160, fontSize = 36 }) {
  const y  = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(1)).current;
  const x  = useRef(Math.random() * width * 0.5 + width * 0.1).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y,  { toValue: -rise, duration, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0,     duration, useNativeDriver: true }),
    ]).start(() => onDone(id));
  }, []);

  return (
    <Animated.Text
      style={{ position: 'absolute', left: x, bottom, fontSize, zIndex: 99, transform: [{ translateY: y }], opacity: op }}
    >
      {emoji}
    </Animated.Text>
  );
}
