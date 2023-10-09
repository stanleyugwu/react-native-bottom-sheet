import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { type AnimatedTouchableBackdropMaskProps } from './types.d';

/**
 * Polymorphic and re-usable animated backdrop mask component
 */
const _AnimatedTouchableBackdropMask =
  Animated.createAnimatedComponent(Pressable);

const AnimatedTouchableBackdropMask = ({
  style,
  isPressable,
  pressHandler,
  android_touchRippleColor,
  ...otherProps
}: AnimatedTouchableBackdropMaskProps) => {
  return isPressable ? (
    <_AnimatedTouchableBackdropMask
      style={[style, styles.sharedBackdropStyle]}
      android_ripple={
        android_touchRippleColor
          ? {
              borderless: true,
              color: android_touchRippleColor,
              foreground: true,
            }
          : undefined
      }
      onPress={pressHandler}
      {...otherProps}
    />
  ) : (
    // @ts-expect-error
    <Animated.View
      style={[style, styles.sharedBackdropStyle]}
      {...otherProps}
    />
  );
};

const styles = StyleSheet.create({
  sharedBackdropStyle: StyleSheet.absoluteFillObject,
});

export default AnimatedTouchableBackdropMask;
