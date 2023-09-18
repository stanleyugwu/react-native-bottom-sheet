import {
  Animated,
  GestureResponderEvent,
  OpaqueColorValue,
  TouchableOpacityProps,
  ViewProps,
} from 'react-native';

export type RegularPropsFor<ComponentType extends 'Touch' | 'View'> =
  Animated.AnimatedProps<
    ComponentType extends 'Touch' ? TouchableOpacityProps : ViewProps
  >;

export type PropsWithHandler = RegularPropsFor<'Touch'> & {
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

export type PropsWithoutHandler = RegularPropsFor<'View'> & {
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

export type AnimatedTouchableBackdropMaskProps = (
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
