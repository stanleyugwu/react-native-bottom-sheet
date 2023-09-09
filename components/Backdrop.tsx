import {
  Animated,
  GestureResponderEvent,
  OpaqueColorValue,
  StyleSheet,
  View,
} from 'react-native';
import {CUSTOM_BACKDROP_POSITIONS} from '..';
import AnimatedTouchableBackdropMask from './AnimatedTouchableBackdropMask';

type Color =
  | string
  | Animated.Value
  | Animated.AnimatedInterpolation<string | number>
  | OpaqueColorValue
  | undefined;

type BackdropProps = {
  BackdropComponent?: React.FunctionComponent<{
    _animatedHeight: Animated.Value;
  }>;
  backdropPosition?: Lowercase<keyof typeof CUSTOM_BACKDROP_POSITIONS>;
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

/**
 * Abstracted, polymorphic backdrop that handles custom and default backdrop
 */
const Backdrop = ({
  BackdropComponent,
  backdropPosition = CUSTOM_BACKDROP_POSITIONS.BEHIND,
  sheetOpen,
  containerHeight,
  contentContainerHeight,
  _animatedHeight,
  closeOnPress,
  rippleColor,
  pressHandler,
  animatedBackdropOpacity,
  backdropColor,
}: BackdropProps) =>
  BackdropComponent ? (
    <View
      style={
        backdropPosition === CUSTOM_BACKDROP_POSITIONS.BEHIND
          ? StyleSheet.absoluteFillObject
          : {height: sheetOpen ? containerHeight - contentContainerHeight : 0}
      }>
      <BackdropComponent _animatedHeight={_animatedHeight} />
    </View>
  ) : closeOnPress ? (
    <AnimatedTouchableBackdropMask
      isPressable={true}
      android_touchRippleColor={rippleColor}
      pressHandler={pressHandler}
      style={{
        opacity: animatedBackdropOpacity,
        backgroundColor: backdropColor,
      }}
      touchSoundDisabled
      key={'TouchableBackdropMask'}
    />
  ) : (
    <AnimatedTouchableBackdropMask
      isPressable={false}
      style={{
        opacity: animatedBackdropOpacity,
        backgroundColor: backdropColor,
      }}
      key={'TouchableBackdropMask'}
    />
  );

export default Backdrop;
