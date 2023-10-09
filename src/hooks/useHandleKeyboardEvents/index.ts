import { useEffect, useRef } from 'react';
import {
  type EmitterSubscription,
  Keyboard,
  View,
  useWindowDimensions,
} from 'react-native';
import type { HeightAnimationDriver, UseHandleKeyboardEvents } from './types';

/**
 * Handles keyboard pop up adjusts sheet's layout when TextInput within
 * the sheet receives focus.
 *
 * @param {number} sheetHeight Initial sheet's height before keyboard pop out
 * @param {boolean} sheetOpen Indicates whether the sheet is open or closed
 * @param {HeightAnimationDriver} heightAnimationDriver Animator function to be called with new
 * sheet height when keyboard is out so it can adjust the sheet height with animation
 * @param {React.MutableRefObject<View>} contentWrapperRef Reference to the content wrapper view
 */
const useHandleKeyboardEvents: UseHandleKeyboardEvents = (
  sheetHeight: number,
  sheetOpen: boolean,
  heightAnimationDriver: HeightAnimationDriver,
  contentWrapperRef: React.RefObject<View>
) => {
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const keyboardHideSubscription = useRef<EmitterSubscription>();
  const keyboardShowSubscription = useRef<EmitterSubscription>();
  useEffect(() => {
    keyboardShowSubscription.current = Keyboard.addListener(
      'keyboardDidShow',
      ({ endCoordinates: { height: keyboardHeight } }) => {
        if (sheetOpen) {
          // Exaggeration of the actual height (24) of the autocorrect view
          // that appears atop android keyboard
          const keyboardAutoCorrectViewHeight = 50;
          contentWrapperRef.current?.measure?.((...result) => {
            const sheetYOffset = result[5]; // Y offset of the sheet after keyboard is out
            const actualSheetHeight = SCREEN_HEIGHT - sheetYOffset; // new height of the sheet (after keyboard offset)
            /**
             * We determine soft input/keyboard mode based on the difference between the new sheet height and the
             * initial height after keyboard is opened. If there's no much difference, it's adjustPan
             * (keyboard overlays sheet), else it's adjustResize (sheet is pushed up)
             */
            const sheetIsOverlayed =
              actualSheetHeight - sheetHeight < keyboardAutoCorrectViewHeight;
            const remainingSpace = SCREEN_HEIGHT - keyboardHeight;

            /**
             * this is 50% of the remaining space (SCREEN_HEIGHT - keyboardHeight) that remains atop the keybaord
             */
            const fiftyPercent = 0.5 * remainingSpace;
            const minSheetHeight = 50;
            // allow very short sheet e.g 10 to increase to 50 and
            // very long to clamp withing availablle space;
            let newSheetHeight = Math.max(
              minSheetHeight,
              Math.min(sheetHeight, fiftyPercent)
            );
            if (sheetIsOverlayed) newSheetHeight += keyboardHeight;
            heightAnimationDriver(newSheetHeight, 400).start();
          });
        }
      }
    );

    keyboardHideSubscription.current = Keyboard.addListener(
      'keyboardDidHide',
      (_) => {
        if (sheetOpen) heightAnimationDriver(sheetHeight, 200).start();
      }
    );

    return () => {
      keyboardHideSubscription.current?.remove();
      keyboardShowSubscription.current?.remove();
    };
  }, [
    sheetHeight,
    SCREEN_HEIGHT,
    sheetOpen,
    heightAnimationDriver,
    contentWrapperRef,
  ]);

  return {
    removeKeyboardListeners() {
      keyboardShowSubscription.current?.remove();
      keyboardHideSubscription.current?.remove();
    },
  };
};

export default useHandleKeyboardEvents;
