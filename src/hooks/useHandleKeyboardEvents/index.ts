import {
  useCallback,
  useEffect,
  useRef,
  type ComponentRef,
  type RefObject,
} from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  TextInput,
  useWindowDimensions,
  type EmitterSubscription,
} from 'react-native';
import type { HeightAnimationDriver, UseHandleKeyboardEvents } from './types.d';

/**
 * Handles keyboard pop out by adjusting sheet's layout when a `TextInput` within
 * the sheet receives focus.
 *
 * @param {boolean} keyboardHandlingEnabled Determines whether this hook will go on to handle keyboard
 * @param {number} sheetHeight Initial sheet's height before keyboard pop out
 * @param {boolean} sheetOpen Indicates whether the sheet is open or closed
 * @param {HeightAnimationDriver} heightAnimationDriver Animator function to be called with new
 * sheet height when keyboard is out so it can adjust the sheet height with animation
 * @param {RefObject<ComponentRef<typeof Animated.View> | null>} contentWrapperRef Reference to the content wrapper view
 * @param {number} openDuration Duration of the open animation
 * @param {number} closeDuration Duration of the close animation
 * @param {number} containerHeight Height of the sheet's container to prevent overshooting
 * @return {{removeKeyboardListeners: () => void; handleFocus: (e?: any) => void;} | null}
 */
const useHandleKeyboardEvents: UseHandleKeyboardEvents = (
  keyboardHandlingEnabled: boolean,
  sheetHeight: number,
  sheetOpen: boolean,
  heightAnimationDriver: HeightAnimationDriver,
  contentWrapperRef: RefObject<ComponentRef<typeof Animated.View> | null>,
  openDuration = 400,
  closeDuration = 200,
  containerHeight?: number
) => {
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const subscriptions = useRef<EmitterSubscription[]>([]);
  const isKeyboardVisibleRef = useRef(false);
  const isSheetOverlayedRef = useRef(false);
  const lastKeyboardHeightRef = useRef(0);
  const lastTargetHeightRef = useRef(sheetHeight);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEvaluationTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const rafRef = useRef<number | null>(null);
  const focusedInputRef = useRef<any>(null);

  // Keep live references to arguments so closures never go stale
  const sheetOpenRef = useRef(sheetOpen);
  sheetOpenRef.current = sheetOpen;

  const sheetHeightRef = useRef(sheetHeight);
  sheetHeightRef.current = sheetHeight;

  const containerHeightRef = useRef(containerHeight);
  containerHeightRef.current = containerHeight;

  const openDurationRef = useRef(openDuration);
  openDurationRef.current = openDuration;

  const closeDurationRef = useRef(closeDuration);
  closeDurationRef.current = closeDuration;

  const heightAnimationDriverRef = useRef(heightAnimationDriver);
  heightAnimationDriverRef.current = heightAnimationDriver;

  const clearPendingEvaluation = () => {
    if (pendingEvaluationTimeoutRef.current) {
      clearTimeout(pendingEvaluationTimeoutRef.current);
      pendingEvaluationTimeoutRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const unsubscribe = useCallback(() => {
    subscriptions.current.forEach((sub) => sub?.remove?.());
    subscriptions.current = [];
    clearHideTimeout();
    clearPendingEvaluation();
    focusedInputRef.current = null;
    isKeyboardVisibleRef.current = false;
    isSheetOverlayedRef.current = false;
    lastKeyboardHeightRef.current = 0;
    lastTargetHeightRef.current = sheetHeightRef.current;
  }, []);

  /**
   * Measures the distance from the top of the sheet content wrapper to the bottom
   * of the given input node.
   */
  const measureInputBottomInSheet = useCallback(
    (inputNode: any, callback: (bottomInSheet: number) => void) => {
      if (!inputNode) {
        callback(0);
        return;
      }

      const wrapper = contentWrapperRef.current;

      // Method 1: measureLayout relative to sheet content wrapper (most direct & coordinate-independent)
      if (wrapper && typeof inputNode.measureLayout === 'function') {
        try {
          inputNode.measureLayout(
            wrapper,
            (_x: number, y: number, _width: number, height: number) => {
              if (typeof y === 'number' && typeof height === 'number') {
                callback(y + height);
                return;
              }
              fallbackMeasureInWindow();
            },
            () => fallbackMeasureInWindow()
          );
          return;
        } catch {
          // fallback to measureInWindow
        }
      }

      // Method 2: measureInWindow comparison between input and content wrapper
      function fallbackMeasureInWindow() {
        if (typeof inputNode?.measureInWindow === 'function') {
          try {
            inputNode.measureInWindow(
              (_ix: number, iy: number, _iw: number, ih: number) => {
                if (typeof iy === 'number' && typeof ih === 'number') {
                  const onSheetY = (sheetPageY: number) => {
                    const diff = iy + ih - sheetPageY;
                    callback(diff > 0 ? diff : 0);
                  };

                  if (typeof wrapper?.measureInWindow === 'function') {
                    try {
                      wrapper.measureInWindow(
                        (_sx: number, sheetPageY: number) => {
                          if (typeof sheetPageY === 'number') {
                            onSheetY(sheetPageY);
                          } else {
                            callback(0);
                          }
                        }
                      );
                      return;
                    } catch {
                      // fallback
                    }
                  }

                  if (typeof wrapper?.measure === 'function') {
                    try {
                      wrapper.measure(
                        (
                          _sx: number,
                          _sy: number,
                          _sw: number,
                          _sh: number,
                          _spageX: number,
                          sheetPageY: number
                        ) => {
                          if (typeof sheetPageY === 'number') {
                            onSheetY(sheetPageY);
                          } else {
                            callback(0);
                          }
                        }
                      );
                      return;
                    } catch {
                      // fallback to estimate
                    }
                  }

                  // Estimate sheetPageY using container height and current sheet height
                  const maxH = containerHeightRef.current ?? SCREEN_HEIGHT;
                  const estimatedSheetPageY =
                    maxH - lastTargetHeightRef.current;
                  onSheetY(estimatedSheetPageY);
                  return;
                }
                callback(0);
              }
            );
            return;
          } catch {
            // failed
          }
        }
        callback(0);
      }

      fallbackMeasureInWindow();
    },
    [contentWrapperRef, SCREEN_HEIGHT]
  );

  /**
   * Computes and animates to the optimal sheet height:
   * 1. Always taller than the keyboard so sheet is never hidden.
   * 2. Pushes up "just enough" for the focused input to be visible above the keyboard.
   * 3. Never arbitrarily maximizes to 100% full screen if input fits comfortably.
   */
  const evaluateAndApplyHeight = useCallback(
    (explicitInput?: any) => {
      if (!sheetOpenRef.current) return;

      const keyboardHeight = lastKeyboardHeightRef.current;
      const minVisibleSheetMargin = 50;
      const inputMargin = 20;
      const maxAllowedHeight = containerHeightRef.current ?? SCREEN_HEIGHT;
      const baseSheetHeight = sheetHeightRef.current;

      const minHeightWithKeyboard = keyboardHeight + minVisibleSheetMargin;
      const baseHeight = isSheetOverlayedRef.current
        ? Math.max(baseSheetHeight, minHeightWithKeyboard)
        : baseSheetHeight;

      const defaultHeight = Math.min(baseHeight, maxAllowedHeight);

      const applyHeight = (heightToSet: number) => {
        const clamped = Math.max(
          minVisibleSheetMargin,
          Math.min(heightToSet, maxAllowedHeight)
        );
        lastTargetHeightRef.current = clamped;
        heightAnimationDriverRef
          .current(clamped, openDurationRef.current)
          .start();
      };

      const targetInput =
        explicitInput ??
        focusedInputRef.current ??
        TextInput?.State?.currentlyFocusedInput?.();

      if (isSheetOverlayedRef.current && targetInput) {
        measureInputBottomInSheet(targetInput, (inputBottomInSheet) => {
          if (inputBottomInSheet > 0) {
            const neededForInput =
              inputBottomInSheet + keyboardHeight + inputMargin;
            applyHeight(Math.max(baseHeight, neededForInput));
            return;
          }
          applyHeight(defaultHeight);
        });
        return;
      }

      applyHeight(defaultHeight);
    },
    [SCREEN_HEIGHT, measureInputBottomInSheet]
  );

  /**
   * Called on keyboard display. Sets overlay state, calculates target height,
   * and schedules re-evaluations to capture any input focus transition in flight.
   */
  const handleKeyboardShow = useCallback(
    (keyboardHeight: number) => {
      if (!sheetOpenRef.current) return;

      clearHideTimeout();
      clearPendingEvaluation();

      lastKeyboardHeightRef.current = keyboardHeight;
      isKeyboardVisibleRef.current = true;
      isSheetOverlayedRef.current = true;

      // Immediate calculation
      evaluateAndApplyHeight();

      // Schedule checks to catch any focus event dispatched right after keyboard notification
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (sheetOpenRef.current && isKeyboardVisibleRef.current) {
          evaluateAndApplyHeight();
        }
      });

      pendingEvaluationTimeoutRef.current = setTimeout(() => {
        if (sheetOpenRef.current && isKeyboardVisibleRef.current) {
          evaluateAndApplyHeight();
        }
      }, 50);
    },
    [evaluateAndApplyHeight]
  );

  const handleKeyboardHide = useCallback(() => {
    clearHideTimeout();
    clearPendingEvaluation();

    // Small debounce to avoid collapsing during keyboard type transitions (e.g. numeric -> email)
    hideTimeoutRef.current = setTimeout(() => {
      focusedInputRef.current = null;
      isKeyboardVisibleRef.current = false;
      isSheetOverlayedRef.current = false;
      lastKeyboardHeightRef.current = 0;
      lastTargetHeightRef.current = sheetHeightRef.current;
      if (sheetOpenRef.current) {
        heightAnimationDriverRef
          .current(sheetHeightRef.current, closeDurationRef.current)
          .start();
      }
    }, 100);
  }, []);

  /**
   * Triggered when any TextInput inside the bottom sheet gains focus (via onFocusCapture).
   * Ensures instant responsiveness when switching between inputs while keyboard is open.
   */
  const handleFocus = useCallback(
    (event?: any) => {
      if (!sheetOpenRef.current) return;

      clearHideTimeout();
      clearPendingEvaluation();

      const focusedInstance = TextInput?.State?.currentlyFocusedInput?.();
      const target =
        (event?.target &&
        typeof event?.target === 'object' &&
        typeof event?.target?.measureLayout === 'function'
          ? event.target
          : null) ??
        focusedInstance ??
        event?.target;

      focusedInputRef.current = target;
      if (isKeyboardVisibleRef.current && lastKeyboardHeightRef.current > 0) {
        evaluateAndApplyHeight(target);
      }
    },
    [evaluateAndApplyHeight]
  );

  useEffect(() => {
    if (keyboardHandlingEnabled && sheetOpen) {
      if (Platform.OS === 'ios') {
        subscriptions.current = [
          Keyboard.addListener('keyboardWillShow', (e) =>
            handleKeyboardShow(e?.endCoordinates?.height ?? 0)
          ),
          Keyboard.addListener('keyboardWillHide', handleKeyboardHide),
          Keyboard.addListener('keyboardWillChangeFrame', (e) =>
            handleKeyboardShow(e?.endCoordinates?.height ?? 0)
          ),
        ];
      } else {
        // Android / other platforms
        subscriptions.current = [
          Keyboard.addListener('keyboardDidShow', (e) => {
            const kbHeight = e?.endCoordinates?.height ?? 0;
            if (!sheetOpenRef.current) return;

            clearHideTimeout();
            clearPendingEvaluation();
            lastKeyboardHeightRef.current = kbHeight;
            isKeyboardVisibleRef.current = true;

            const onOverlayResolved = () => {
              evaluateAndApplyHeight();

              rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                if (sheetOpenRef.current && isKeyboardVisibleRef.current) {
                  evaluateAndApplyHeight();
                }
              });

              pendingEvaluationTimeoutRef.current = setTimeout(() => {
                if (sheetOpenRef.current && isKeyboardVisibleRef.current) {
                  evaluateAndApplyHeight();
                }
              }, 50);
            };

            // If already determined to be overlayed in this keyboard session, preserve it across re-fires
            if (isSheetOverlayedRef.current) {
              onOverlayResolved();
              return;
            }

            const wrapper = contentWrapperRef.current;
            if (wrapper && typeof wrapper.measure === 'function') {
              const keyboardAutoCorrectViewHeight = 50;
              try {
                wrapper.measure(
                  (
                    _x: number,
                    _y: number,
                    _width: number,
                    _height: number,
                    _pageX: number,
                    pageY: number
                  ) => {
                    if (typeof pageY === 'number') {
                      const sheetYOffset = pageY;
                      const actualSheetHeight = SCREEN_HEIGHT - sheetYOffset;
                      const sheetIsOverlayed =
                        actualSheetHeight - sheetHeightRef.current <
                        keyboardAutoCorrectViewHeight;

                      isSheetOverlayedRef.current = sheetIsOverlayed;
                    } else {
                      isSheetOverlayedRef.current = true;
                    }
                    onOverlayResolved();
                  }
                );
              } catch {
                isSheetOverlayedRef.current = true;
                onOverlayResolved();
              }
            } else {
              // Fallback if measure is unavailable: default to overlayed
              isSheetOverlayedRef.current = true;
              onOverlayResolved();
            }
          }),
          Keyboard.addListener('keyboardDidHide', handleKeyboardHide),
        ];
      }

      return unsubscribe;
    }
    return;
  }, [
    keyboardHandlingEnabled,
    sheetOpen,
    SCREEN_HEIGHT,
    contentWrapperRef,
    handleKeyboardShow,
    handleKeyboardHide,
    evaluateAndApplyHeight,
    unsubscribe,
  ]);

  const isDraggingRef = useRef(false);
  const notifyDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const notifyDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const resetKeyboardState = useCallback(() => {
    clearHideTimeout();
    clearPendingEvaluation();
    focusedInputRef.current = null;
    isKeyboardVisibleRef.current = false;
    isSheetOverlayedRef.current = false;
    lastKeyboardHeightRef.current = 0;
    lastTargetHeightRef.current = sheetHeightRef.current;
  }, []);

  return keyboardHandlingEnabled
    ? {
        removeKeyboardListeners: unsubscribe,
        handleFocus,
        isKeyboardVisible: () => isKeyboardVisibleRef.current,
        getKeyboardHeight: () => lastKeyboardHeightRef.current,
        getTargetHeight: () => lastTargetHeightRef.current,
        notifyDragStart,
        notifyDragEnd,
        resetKeyboardState,
      }
    : null;
};

export default useHandleKeyboardEvents;
