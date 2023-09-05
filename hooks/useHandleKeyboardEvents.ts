import {useEffect, useRef} from 'react';
import {
  Animated,
  EmitterSubscription,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import {FALLBACK_CONTENT_WRAPPER_HEIGHT} from '../constant';

type HookReturn = {
  /**
   * Removes all keyboard listeners, typically when sheet is closed
   */
  removeKeyboardListeners: () => void;
};

/**
 * Function type
 */
type UseHandleKeyboardEvents = (
  heightTo: number,
  animatedHeight: Animated.Value,
  sheetOpen: boolean,
) => HookReturn;

/**
 * Handles keyboard pop up adjusts sheet's layout when TextInput within
 * the sheet receives focus.
 *
 * @param {number} sheetHeight Initial sheet's height before keyboard pop out
 * @param {Animated.Value} animatedHeightNode Animatable node via which sheet's height will be adjusted
 * @param {boolean} sheetOpen Indicates whether the sheet is open or closed
 */
const useHandleKeyboardEvents: UseHandleKeyboardEvents = (
  sheetHeight: number,
  animatedHeightNode: Animated.Value,
  sheetOpen: boolean,
) => {
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const keyboardHideSubscription = useRef<EmitterSubscription>();
  const keyboardShowSubscription = useRef<EmitterSubscription>();

  useEffect(() => {
    keyboardShowSubscription.current = Keyboard.addListener(
      'keyboardDidShow',
      ({endCoordinates: {height: keyboardHeight}}) => {
        if (sheetOpen) {
          const height = Math.max(
            sheetHeight - keyboardHeight,
            FALLBACK_CONTENT_WRAPPER_HEIGHT,
          );

          animatedHeightNode.setValue(height);
        }
      },
    );
    keyboardHideSubscription.current = Keyboard.addListener(
      'keyboardDidHide',
      evt => {
        if (sheetOpen) animatedHeightNode.setValue(sheetHeight);
      },
    );

    return () => {
      keyboardHideSubscription.current?.remove();
      keyboardShowSubscription.current?.remove();
    };
  }, [sheetHeight, SCREEN_HEIGHT, sheetOpen]);

  return {
    removeKeyboardListeners() {
      keyboardShowSubscription.current?.remove();
      keyboardShowSubscription.current?.remove();
    },
  };
};

export default useHandleKeyboardEvents;
