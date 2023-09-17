import {Animated, Pressable, StyleSheet} from 'react-native';
import {AnimatedTouchableBackdropMaskProps} from './types';

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
  children,
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
