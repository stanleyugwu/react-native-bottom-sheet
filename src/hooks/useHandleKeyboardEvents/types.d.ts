import type { ComponentRef, RefObject } from 'react';
import { Animated } from 'react-native';

export type HookReturn = {
  /**
   * Removes all keyboard listeners, typically when sheet is closed
   */
  removeKeyboardListeners: () => void;
} | null;

/**
 * Handles keyboard pop out
 */
export type UseHandleKeyboardEvents = (
  /** Determines whether this hook will go on to handle keyboard */
  keyboardHandlingEnabled: boolean,
  /**
   * initial height of the sheet
   */
  sheetHeight: number,
  /** determines whether sheet is expanded */
  sheetOpen: boolean,
  /** function that can drive/animate sheet height */
  SheetHeightAnimationDriver: HeightAnimationDriver,
  /** ref to the content wrapper view for calculating sheet offset when keyboard is out */
  contentWrapperRef: RefObject<ComponentRef<typeof Animated.View> | null>,
  /** duration of the keyboard open animation */
  openDuration?: number,
  /** duration of the keyboard close animation */
  closeDuration?: number,
  /** height of the sheet's container to prevent overshooting */
  containerHeight?: number
) => HookReturn;

export type HeightAnimationDriver = (
  height: number,
  duration: number
) => Animated.CompositeAnimation;
