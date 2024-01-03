import { useEffect, useRef } from 'react';
import { BackHandler, type NativeEventSubscription } from 'react-native';
import type { UseHandleAndroidBackButtonClose } from './types.d';

/**
 * Handles closing sheet when back button is pressed on
 * android and sheet is opened
 *
 * @param {boolean} shouldClose Whether to close sheet when back button is pressed
 * @param {boolean} closeSheet Function to call to close the sheet
 * @param {boolean} sheetOpen Determines the visibility of the sheet
 */
const useHandleAndroidBackButtonClose: UseHandleAndroidBackButtonClose = (
  shouldClose = true,
  closeSheet,
  sheetOpen = false
) => {
  const handler = useRef<NativeEventSubscription>();
  useEffect(() => {
    handler.current = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheetOpen) {
        if (shouldClose) {
          closeSheet?.();
        }
        return true; // prevent back press event bubbling as long as sheet is open
      } else return false; // when sheet is closed allow bubbling
    });
    return () => {
      handler.current?.remove?.();
    };
  }, [shouldClose, closeSheet, sheetOpen]);
};

export default useHandleAndroidBackButtonClose;
