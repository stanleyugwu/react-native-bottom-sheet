export type Color =
  | string
  | Animated.Value
  | Animated.AnimatedInterpolation<string | number>
  | OpaqueColorValue
  | undefined;

export type BackdropProps = {
  BackdropComponent?: React.FunctionComponent<{
    _animatedHeight: Animated.Value;
  }>;
  backdropPosition?: CUSTOM_BACKDROP_POSITIONS;
  sheetOpen: boolean;
  containerHeight: number;
  contentContainerHeight: number;
  _animatedHeight: Animated.Value;
  closeOnPress: boolean;
  rippleColor: Color;
  pressHandler: (evt: GestureResponderEvent) => void;
  animatedBackdropOpacity: Animated.Value;
  backdropColor: Color;
};