import React from 'react';
import { StyleSheet, View } from 'react-native';
import AnimatedTouchableBackdropMask from '../animatedTouchableBackdropMask';
import { CUSTOM_BACKDROP_POSITIONS } from '../../types.d';
import type { BackdropProps } from './types.d';

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
}: BackdropProps) => {
  const heightStyle = sheetOpen ? containerHeight - contentContainerHeight : 0;

  return BackdropComponent ? (
    <View
      style={
        backdropPosition === CUSTOM_BACKDROP_POSITIONS.BEHIND
          ? StyleSheet.absoluteFillObject
          : { height: heightStyle }
      }
    >
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
};
export default Backdrop;
