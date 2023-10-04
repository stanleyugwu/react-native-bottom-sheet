import React from 'react';
import { forwardRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

/**
 * This is the overall container view of the bottom sheet
 */
const Container = forwardRef<
  View,
  Animated.ComponentProps<typeof Animated.View>
>(({ style, ...otherProps }, ref) => (
  <Animated.View ref={ref} style={[styles.container, style]} {...otherProps} />
));

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'flex-end',
    right: 0,
    left: 0,
    // required to snap container to bottom of screen, so animation will start from botom to up
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 1,
  },
});

export default Container;
