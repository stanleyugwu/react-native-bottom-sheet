import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Convenience hook for abstracting/storing Animated values.
 * Pass your initial number value, get an animated value back.
 * @param {number} initialValue Initial animated value
 */
const useAnimatedValue = (initialValue: number = 0): Animated.Value => {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  return animatedValue;
};

export default useAnimatedValue;
