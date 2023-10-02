import React from 'react';
import {Animated, View} from 'react-native';

export type HookReturn = {
  /**
   * Removes all keyboard listeners, typically when sheet is closed
   */
  removeKeyboardListeners: () => void;
};

/**
 * Function type
 */
export type UseHandleKeyboardEvents = (
  /** initial height of the sheet */
  sheetHeight: number,
  /** determines whether sheet is expanded */
  sheetOpen: boolean,
  /** function that can drive/animate sheet height */
  SheetHeightAnimationDriver: HeightAnimationDriver,
  /** ref to the content wrapper view for calculating sheet offset when keyboard is out */
  contentWrapperRef:React.RefObject<View>
) => HookReturn;

export type HeightAnimationDriver = (
  height: number,
  duration: number,
) => Animated.CompositeAnimation;
