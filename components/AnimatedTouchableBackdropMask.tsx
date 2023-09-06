import {
  Animated,
  GestureResponderEvent,
  OpaqueColorValue,
  Pressable,
  StyleSheet,
  TouchableOpacityProps,
  ViewProps,
} from 'react-native';

type RegularPropsFor<ComponentType extends 'Touch' | 'View'> =
  Animated.AnimatedProps<
    ComponentType extends 'Touch' ? TouchableOpacityProps : ViewProps
  >;

type PropsWithHandler = RegularPropsFor<'Touch'> & {
  /**
   * Determines whether backdrop mask should receive press event.\
   * Used internally for conditional rendering
   */
  isPressable: true;

  /**
   * Function to handle press event if `isPressable` is true
   */
  pressHandler: (evt: GestureResponderEvent) => void;
};

type PropsWithoutHandler = RegularPropsFor<'View'> & {
  /**
   * Determines whether backdrop mask should receive press event.\
   * Used internally for conditional rendering
   */
  isPressable?: false;

  /**
   * Function to handle press event if `isPressable` is true
   */
  pressHandler?: never;
};

type AnimatedTouchableBackdropMaskProps = (
  | PropsWithHandler
  | PropsWithoutHandler
) & {
  /**
   * Ripple effect color of the backdrop when touched
   */
  android_touchRippleColor?: Animated.WithAnimatedValue<
    string | OpaqueColorValue
  >;
};

/**
 * Polymorphic animated backdrop mask component
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
