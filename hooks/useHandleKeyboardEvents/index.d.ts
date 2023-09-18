import {Animated} from 'react-native';

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
  heightTo: number,
  sheetOpen: boolean,
  HeightAnimator: any,
) => HookReturn;

export type HeightAnimationDriver = (
  height: number,
  duration: number,
) => Animated.CompositeAnimation;
