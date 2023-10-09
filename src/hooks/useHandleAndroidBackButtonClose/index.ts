import { useEffect, useRef } from 'react';
import { BackHandler, type NativeEventSubscription } from 'react-native';
import type { UseHandleAndroidBackButtonClose } from './types';

/**
 * Handles closing sheet for android hardware back button press event
 *
 * @param {boolean} shouldClose Whether to close sheet when back button is pressed
 * @param {boolean} closeSheet Function to call to close the sheet
 */
const useHandleAndroidBackButtonClose: UseHandleAndroidBackButtonClose = (
  shouldClose = true,
  closeSheet
) => {
  const handler = useRef<NativeEventSubscription>();
  useEffect(() => {
    if (shouldClose) {
      handler.current = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          closeSheet?.();
          return true;
        }
      );
    }
    return () => {
      handler.current?.remove?.();
    };
  }, [shouldClose, closeSheet]);
};

export default useHandleAndroidBackButtonClose;
