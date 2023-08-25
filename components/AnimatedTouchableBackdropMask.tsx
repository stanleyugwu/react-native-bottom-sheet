import {
  Animated,
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
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

type AnimatedTouchableBackdropMaskProps =
  | PropsWithHandler
  | PropsWithoutHandler;

/**
 * Polymorphic animated backdrop mask component
 */
const _AnimatedTouchableBackdropMask =
  Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedTouchableBackdropMask = ({
  style,
  isPressable,
  pressHandler,
  ...otherProps
}: AnimatedTouchableBackdropMaskProps) => {
  return isPressable ? (
    <_AnimatedTouchableBackdropMask
      style={[style, styles.sharedBackdropStyle]}
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
