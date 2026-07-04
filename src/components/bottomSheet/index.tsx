import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  Animated,
  Keyboard,
  PanResponder,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  CLOSE_SNAP_RATIO,
  DEFAULT_ANIMATION,
  DEFAULT_BACKDROP_MASK_COLOR,
  DEFAULT_CLOSE_ANIMATION_DURATION,
  DEFAULT_HEIGHT,
  DEFAULT_OPEN_ANIMATION_DURATION,
  DEFAULT_SNAP_INDEX,
  SNAP_VELOCITY_FACTOR,
} from '../../constant';
import useAnimatedValue from '../../hooks/useAnimatedValue';
import useHandleAndroidBackButtonClose from '../../hooks/useHandleAndroidBackButtonClose';
import useHandleKeyboardEvents from '../../hooks/useHandleKeyboardEvents';
import convertHeight from '../../utils/convertHeight';
import resolveSnapPoints from '../../utils/resolveSnapPoints';
import normalizeHeight from '../../utils/normalizeHeight';
import separatePaddingStyles from '../../utils/separatePaddingStyles';
import Backdrop from '../backdrop';
import Container from '../container';
import DefaultHandleBar from '../defaultHandleBar';
import {
  ANIMATIONS,
  CUSTOM_BACKDROP_POSITIONS,
  type BOTTOMSHEET,
  type BottomSheetMethods,
  type BottomSheetProps,
  type ToValue,
} from './types.d';

/**
 * Main bottom sheet component
 */
const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  (
    {
      backdropMaskColor = DEFAULT_BACKDROP_MASK_COLOR,
      children: Children,
      animationType = DEFAULT_ANIMATION,
      closeOnBackdropPress = true,
      height = DEFAULT_HEIGHT,
      snapPoints,
      index = DEFAULT_SNAP_INDEX,
      onSnap,
      hideDragHandle = false,
      android_backdropMaskRippleColor,
      dragHandleStyle,
      disableBodyPanning = false,
      disableDragHandlePanning = false,
      customDragHandleComponent,
      style: contentContainerStyle,
      closeOnDragDown = true,
      containerHeight: passedContainerHeight,
      customBackdropComponent: CustomBackdropComponent,
      customBackdropPosition = CUSTOM_BACKDROP_POSITIONS.BEHIND,
      modal = true,
      openDuration = DEFAULT_OPEN_ANIMATION_DURATION,
      closeDuration = DEFAULT_CLOSE_ANIMATION_DURATION,
      customEasingFunction,
      android_closeOnBackPress = true,
      onClose,
      onOpen,
      onAnimate,
      disableKeyboardHandling = false,
    },
    ref
  ) => {
    /**
     * ref instance callable methods
     */
    useImperativeHandle(ref, () => ({
      open() {
        openBottomSheet();
      },
      close() {
        closeBottomSheet();
      },
      snapToIndex(snapIndex: number) {
        snapToIndex(snapIndex);
      },
      expand() {
        snapToIndex(_resolvedSnapPoints.length - 1);
      },
      collapse() {
        snapToIndex(0);
      },
    }));

    /**
     * If passed container height is a valid number we use that as final container height
     * else, it may be a percentage value so then we need to change it to a number (so it can be animated).
     * The change is handled with `onLayout` further down
     */
    const SCREEN_HEIGHT = useWindowDimensions().height; // actual container height is measured after layout
    const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);
    const [sheetOpen, setSheetOpen] = useState(false);

    /** index of the snap point the sheet is currently resting on (ascending order) */
    const [activeSnapIndex, setActiveSnapIndex] = useState(index);

    /** sheet height captured when a pan gesture starts, so drag math is relative to it */
    const panStartHeight = useRef(0);

    // animated properties
    const _animatedContainerHeight = useAnimatedValue(0);
    const _animatedBackdropMaskOpacity = useAnimatedValue(0);
    const _animatedHeight = useAnimatedValue(0);

    const contentWrapperRef = useRef<ComponentRef<typeof Animated.View>>(null);

    /** cached unique identifier of content container */
    const cachedContentWrapperId = useRef<
      { field: string; value: unknown } | undefined
    >(undefined);

    // here we separate all padding that may be applied via contentContainerStyle prop,
    // these paddings will be applied to the `View` diretly wrapping `ChildNodes` in content container.
    // All these is so that paddings applied to sheet doesn't affect the drag handle
    // TODO: find better way to memoize `separatePaddingStyles` function return value to avoid
    // redundant re-runs
    const sepStyles = useMemo(
      () => separatePaddingStyles(contentContainerStyle),
      [contentContainerStyle]
    );

    // Animation utility
    const Animators = useMemo(() => {
      const _slideEasingFn = (value: number) => {
        return value === 1 ? 1 : 1 - Math.pow(2, -10 * value);
      };
      const _springEasingFn = (value: number) => {
        const decay = 9;
        const multiplier = 4.5;
        const divisor = 2.3;

        const c4 = (2 * Math.PI) / divisor;

        return value === 0
          ? 0
          : value === 1
            ? 1
            : Math.pow(2, -decay * value) *
                Math.sin((value * multiplier - 0.75) * c4) +
              1;
      };

      return {
        animateContainerHeight(toValue: ToValue, duration: number = 0) {
          return Animated.timing(_animatedContainerHeight, {
            toValue: toValue,
            useNativeDriver: false,
            duration: duration,
          });
        },
        animateBackdropMaskOpacity(toValue: ToValue, duration: number) {
          // we use passed open and close durations when animation type is fade
          // but we use half of that for other animation types for good UX
          const _duration =
            animationType === ANIMATIONS.FADE ? duration : duration / 2.5;

          return Animated.timing(_animatedBackdropMaskOpacity, {
            toValue: toValue,
            useNativeDriver: false,
            duration: _duration,
          });
        },
        animateHeight(toValue: ToValue, duration: number) {
          return Animated.timing(_animatedHeight, {
            toValue,
            useNativeDriver: false,
            duration: duration,
            easing:
              customEasingFunction && typeof customEasingFunction === 'function'
                ? customEasingFunction
                : animationType === ANIMATIONS.SLIDE
                  ? _slideEasingFn
                  : _springEasingFn,
          });
        },
      };
    }, [
      animationType,
      customEasingFunction,
      _animatedContainerHeight,
      _animatedBackdropMaskOpacity,
      _animatedHeight,
    ]);

    const interpolatedOpacity = useMemo(
      () =>
        animationType === ANIMATIONS.FADE
          ? _animatedBackdropMaskOpacity.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.3, 1],
              extrapolate: 'clamp',
            })
          : contentContainerStyle?.opacity,
      [animationType, contentContainerStyle, _animatedBackdropMaskOpacity]
    );

    /**
     * Resolved resting heights (in pixels), ascending. When `snapPoints` is provided we
     * resolve the whole array; otherwise we fall back to a single-element array holding the
     * `height` prop, so the rest of the component treats both cases uniformly. An empty/all
     * invalid `snapPoints` also falls back to `height`.
     */
    const _resolvedSnapPoints = useMemo(() => {
      const hasSnapPoints = Array.isArray(snapPoints) && snapPoints.length > 0;
      if (hasSnapPoints) {
        const resolved = resolveSnapPoints(
          snapPoints,
          containerHeight,
          hideDragHandle
        );
        if (resolved.length) return resolved;
      }
      return [convertHeight(height, containerHeight, hideDragHandle)];
    }, [snapPoints, height, containerHeight, hideDragHandle]);

    /** whether the sheet is operating in multi snap-point mode */
    const _hasSnapPoints = _resolvedSnapPoints.length > 1;

    /** active index, clamped to the currently valid range */
    const _safeSnapIndex = Math.min(
      Math.max(activeSnapIndex, 0),
      _resolvedSnapPoints.length - 1
    );

    /**
     * Pixel height of the snap point the sheet currently rests on. Keeps the original
     * `convertedHeight` name so every downstream consumer (keyboard handler, backdrop,
     * pan math) is unaffected.
     */
    const convertedHeight = _resolvedSnapPoints[_safeSnapIndex] ?? 0;

    /**
     * Re-syncs the animated sheet height to its active snap point when the geometry changes
     * (orientation / `containerHeight` / `snapPoints` / `height`) while the sheet is open.
     * Guarded by a geometry signature so it never re-animates on a user/programmatic snap
     * (an `activeSnapIndex` change) — those are already animated by their own handlers.
     */
    const _geometryKey = _resolvedSnapPoints.join();
    const _prevGeometryKey = useRef(_geometryKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      if (_prevGeometryKey.current === _geometryKey) return;
      _prevGeometryKey.current = _geometryKey;
      if (!sheetOpen) return;

      if (activeSnapIndex !== _safeSnapIndex) {
        setActiveSnapIndex(_safeSnapIndex);
        onSnap?.(_safeSnapIndex);
      }

      // FIXME: we use interface-undefined but existing property `_value` here and it's risky
      // @ts-expect-error
      const curHeight = _animatedHeight._value;
      if (convertedHeight !== curHeight) {
        if (animationType === ANIMATIONS.FADE)
          _animatedHeight.setValue(convertedHeight);
        else
          Animators.animateHeight(
            convertedHeight,
            convertedHeight > curHeight ? openDuration : closeDuration
          ).start();
      }
    });

    /**
     * If `disableKeyboardHandling` is false, handles keyboard pop up for both platforms,
     * by auto adjusting sheet layout accordingly
     */
    const keyboardHandler = useHandleKeyboardEvents(
      !disableKeyboardHandling,
      convertedHeight,
      sheetOpen,
      Animators.animateHeight,
      contentWrapperRef,
      openDuration,
      closeDuration,
      containerHeight
    );

    /**
     * Returns conditioned gesture handlers for content container and handle bar elements
     */
    const panHandlersFor = (view: 'handlebar' | 'contentwrapper') => {
      if (view === 'handlebar' && disableDragHandlePanning) return null;
      if (view === 'contentwrapper' && disableBodyPanning) return null;
      return PanResponder.create({
        onMoveShouldSetPanResponderCapture: (evt) => {
          if (view === 'handlebar') return true;
          const cached = cachedContentWrapperId.current;
          if (!cached) return false; // this signature alone should fix issue #34
          return (
            // @ts-expect-error _private field access
            cached?.value === evt?.target?.[cached?.field] ||
            // @ts-expect-error _private field access
            cached?.value === evt?.currentTarget?.[cached?.field]
          );
        },
        onPanResponderGrant: () => {
          // capture the resting height when the drag starts, so movement is measured
          // relative to it (handles dragging from any snap point or mid-animation)
          // @ts-expect-error private `_value` field (see FIXME above)
          panStartHeight.current = _animatedHeight._value;
        },
        onPanResponderMove: (_, gestureState) => {
          const lowestSnap = _resolvedSnapPoints[0] ?? 0;
          const maxSnap =
            _resolvedSnapPoints[_resolvedSnapPoints.length - 1] ?? 0;
          // clamp between fully closed and the largest snap point
          const next = Math.min(
            Math.max(panStartHeight.current - gestureState.dy, 0),
            maxSnap
          );
          // backdrop stays opaque while at/above the smallest snap point and only
          // fades as the sheet is dragged below it toward close
          _animatedBackdropMaskOpacity.setValue(
            lowestSnap > 0 ? Math.min(Math.max(next / lowestSnap, 0), 1) : 0
          );
          if (animationType !== ANIMATIONS.FADE) _animatedHeight.setValue(next);
        },
        onPanResponderRelease(_, gestureState) {
          const lowestSnap = _resolvedSnapPoints[0] ?? 0;
          const maxSnap =
            _resolvedSnapPoints[_resolvedSnapPoints.length - 1] ?? 0;
          const next = Math.min(
            Math.max(panStartHeight.current - gestureState.dy, 0),
            maxSnap
          );
          // project where a flick would land so a fast drag carries further than a
          // slow one (velocity only influences multi snap-point sheets)
          const projected = _hasSnapPoints
            ? next - gestureState.vy * SNAP_VELOCITY_FACTOR
            : next;

          // dragged/flung below the smallest snap point past the close threshold
          if (closeOnDragDown && projected < lowestSnap * CLOSE_SNAP_RATIO) {
            closeBottomSheet();
            return;
          }

          _animatedBackdropMaskOpacity.setValue(1);

          // fade has no height drag; just restore the backdrop and keep the snap point
          if (animationType === ANIMATIONS.FADE) return;

          // settle on the snap point nearest the projected resting position
          let targetIndex = 0;
          let minDistance = Infinity;
          for (let i = 0; i < _resolvedSnapPoints.length; i++) {
            const distance = Math.abs(
              (_resolvedSnapPoints[i] ?? 0) - projected
            );
            if (distance < minDistance) {
              minDistance = distance;
              targetIndex = i;
            }
          }

          Animators.animateHeight(
            _resolvedSnapPoints[targetIndex] ?? 0,
            openDuration / 2
          ).start();

          if (targetIndex !== _safeSnapIndex) {
            setActiveSnapIndex(targetIndex);
            onSnap?.(targetIndex);
          }
        },
      }).panHandlers;
    };

    /**
     * Polymorphic content container handle bar component
     */
    /* eslint-disable react/no-unstable-nested-components, react-native/no-inline-styles */
    const PolymorphicHandleBar: React.FunctionComponent<{}> = () => {
      const CustomHandleBar = customDragHandleComponent;
      return hideDragHandle ? null : CustomHandleBar &&
        typeof CustomHandleBar === 'function' ? (
        <View style={{ alignSelf: 'center' }} {...panHandlersFor('handlebar')}>
          <CustomHandleBar _animatedHeight={_animatedHeight} />
        </View>
      ) : (
        <DefaultHandleBar
          style={dragHandleStyle}
          {...panHandlersFor('handlebar')}
        />
      );
    };
    /* eslint-enable react/no-unstable-nested-components, react-native/no-inline-styles */

    /**
     * Extracts and caches either `_nativeTag` or `__nativeTag` or `__internalInstanceHandle` or `_internalFiberInstanceHandleDEV`
     * reference of the `ContentWrapper` component based on which is available. Either will do for
     * identifying the content wrapper in PanResponder
     */
    const cacheElementReference = useCallback(
      ({ currentTarget, nativeEvent }: LayoutChangeEvent) => {
        const fabricInstanceHandleKey = '__internalInstanceHandle';
        // @ts-expect-error `Fabric` renderer's instance handle reference/pointer
        const fabricInstanceHandle = currentTarget?.[fabricInstanceHandleKey];

        const oldNativeTagKey = '_nativeTag';
        // @ts-expect-error `Paper` renderer's native tag number
        const oldNativeTag = currentTarget?.[oldNativeTagKey];

        const newNativeTagKey = '__nativeTag';
        // @ts-expect-error `Fabric` renderer's native tag number
        const newNativeTag = currentTarget?.[newNativeTagKey];

        const paperInstanceHandleKey = '_internalFiberInstanceHandleDEV';
        // @ts-expect-error `Paper` renderer's instance handle equivalent
        const paperInstanceHandle = currentTarget?.[paperInstanceHandleKey];

        if (!cachedContentWrapperId.current) {
          if (fabricInstanceHandle)
            cachedContentWrapperId.current = {
              field: fabricInstanceHandleKey,
              value: fabricInstanceHandle,
            };
          else if (oldNativeTag)
            cachedContentWrapperId.current = {
              field: oldNativeTagKey,
              value: oldNativeTag,
            };
          else if (newNativeTag)
            cachedContentWrapperId.current = {
              field: newNativeTagKey,
              value: newNativeTag,
            };
          else if (paperInstanceHandle)
            cachedContentWrapperId.current = {
              field: paperInstanceHandleKey,
              value: paperInstanceHandle,
            };
          // Check known stable keys for web if none of above exists
          else if (Platform.OS === 'web') {
            const responderKey = '__reactResponderId';
            // @ts-expect-error `.target` is untyped
            const responderId = nativeEvent?.target?.[responderKey];
            if (responderId) {
              cachedContentWrapperId.current = {
                field: responderKey,
                value: responderId,
              };
            }
          } else cachedContentWrapperId.current = undefined;
        }
      },
      []
    );

    /**
     * Expands the bottom sheet. Opens to the snap point at `toIndex` (defaults to the
     * `index` prop), resetting the active snap point so reopening always lands on it.
     */
    const openBottomSheet = (toIndex: number = index) => {
      const targetIndex = Math.min(
        Math.max(Math.trunc(toIndex), 0),
        _resolvedSnapPoints.length - 1
      );
      const targetHeight = _resolvedSnapPoints[targetIndex] ?? 0;
      setActiveSnapIndex(targetIndex);

      // 1. open container
      // 2. if using fade animation, set content container height manually, animate backdrop.
      // else, animate backdrop and content container height in parallel
      Animators.animateContainerHeight(
        !modal ? targetHeight : containerHeight
      ).start();
      if (animationType === ANIMATIONS.FADE) {
        _animatedHeight.setValue(targetHeight);
        Animators.animateBackdropMaskOpacity(1, openDuration).start();
      } else {
        Animators.animateBackdropMaskOpacity(1, openDuration).start();
        Animators.animateHeight(targetHeight, openDuration).start();
      }

      const wasOpen = sheetOpen;
      setSheetOpen(true);

      if (!wasOpen && onOpen) {
        onOpen();
      }
      onSnap?.(targetIndex);
    };

    const closeBottomSheet = () => {
      if (!sheetOpen) return;

      if (animationType === ANIMATIONS.FADE) {
        // For fade, sheet opacity is tied to the backdrop, so we wait for the
        // backdrop fade to complete before snapping the container shut.
        Animators.animateBackdropMaskOpacity(0, closeDuration).start((anim) => {
          if (anim.finished) {
            Animators.animateContainerHeight(0).start();
            _animatedHeight.setValue(0);
          }
        });
      } else if (animationType === ANIMATIONS.SLIDE) {
        // Run backdrop fade and height slide-out in parallel so flick-to-close
        // doesn't pause mid-flight waiting for the (faster) backdrop fade.
        // Snap the outer container to 0 only after the sheet has
        // finished sliding out so the slide animation isn't clipped.
        Animators.animateBackdropMaskOpacity(0, closeDuration).start();
        Animators.animateHeight(0, closeDuration).start((anim) => {
          if (anim.finished) Animators.animateContainerHeight(0).start();
        });
      } else {
        Animators.animateBackdropMaskOpacity(0, closeDuration).start();
        // `animateHeight` and `animateContainerHeight` below need to run in parallel
        // else there might be a noticeable flicker of sheet content
        Animators.animateHeight(0, closeDuration).start();
        Animators.animateContainerHeight(0).start();
      }
      setSheetOpen(false);
      setActiveSnapIndex(-1);
      keyboardHandler?.removeKeyboardListeners();
      Keyboard.dismiss();

      if (onClose) {
        onClose();
      }
      onSnap?.(-1);
    };

    /**
     * Animates the sheet to the snap point at `toIndex` (clamped). A negative index closes
     * the sheet; if the sheet is closed, it opens at the target snap point. The animation is
     * always driven off the live height so it never silently no-ops on a stale index.
     */
    const snapToIndex = (toIndex: number) => {
      if (toIndex < 0) {
        closeBottomSheet();
        return;
      }
      const clamped = Math.min(
        Math.max(Math.trunc(toIndex), 0),
        _resolvedSnapPoints.length - 1
      );
      if (!sheetOpen) {
        openBottomSheet(clamped);
        return;
      }

      const targetHeight = _resolvedSnapPoints[clamped] ?? 0;
      // @ts-expect-error private `_value` field (see FIXME above)
      const curHeight = _animatedHeight._value;

      if (animationType === ANIMATIONS.FADE) {
        if (curHeight !== targetHeight) {
          Animators.animateBackdropMaskOpacity(0, openDuration / 2).start(
            (anim) => {
              if (anim.finished) {
                _animatedHeight.setValue(targetHeight);
                Animators.animateBackdropMaskOpacity(
                  1,
                  openDuration / 2
                ).start();
              }
            }
          );
        }
      } else {
        _animatedBackdropMaskOpacity.setValue(1);
        if (curHeight !== targetHeight) {
          const duration =
            targetHeight > curHeight ? openDuration : closeDuration;
          Animators.animateHeight(targetHeight, duration).start();
        }
      }

      if (clamped !== activeSnapIndex) {
        setActiveSnapIndex(clamped);
        onSnap?.(clamped);
      }
    };

    const containerViewLayoutHandler = (event: LayoutChangeEvent) => {
      const newHeight = event.nativeEvent.layout.height;
      setContainerHeight(newHeight);
      // incase `containerHeight` prop value changes when bottom sheet is expanded
      // we need to manually update the container height
      if (sheetOpen) _animatedContainerHeight.setValue(newHeight);
    };

    /**
     * Implementation logic for `onAnimate` prop
     */
    useEffect(() => {
      if (onAnimate && typeof onAnimate === 'function') {
        const animate = (state: { value: number }) => onAnimate(state.value);
        let listenerId: string;
        if (animationType === 'fade')
          listenerId = _animatedBackdropMaskOpacity.addListener(animate);
        else listenerId = _animatedHeight.addListener(animate);

        return () => {
          if (animationType === 'fade')
            _animatedBackdropMaskOpacity.removeListener(listenerId);
          else _animatedHeight.removeListener(listenerId);
        };
      }

      return;
    }, [
      onAnimate,
      animationType,
      _animatedBackdropMaskOpacity,
      _animatedHeight,
    ]);

    /**
     * Handles auto adjusting container view height and clamping
     * and normalizing `containerHeight` prop upon change, if its a number.
     * Also auto adjusts when orientation changes
     */
    useLayoutEffect(() => {
      if (!modal)
        return; // no auto layout adjustment when backdrop is hidden
      else {
        if (typeof passedContainerHeight === 'number') {
          setContainerHeight(normalizeHeight(passedContainerHeight));
          if (sheetOpen)
            _animatedContainerHeight.setValue(passedContainerHeight);
        } else if (
          typeof passedContainerHeight === 'undefined' &&
          containerHeight !== SCREEN_HEIGHT
        ) {
          setContainerHeight(SCREEN_HEIGHT);
          if (sheetOpen) _animatedContainerHeight.setValue(SCREEN_HEIGHT);
        }
      }
    }, [
      passedContainerHeight,
      SCREEN_HEIGHT,
      sheetOpen,
      containerHeight,
      modal,
      _animatedContainerHeight,
    ]);

    /**
     * Handles hardware back button press for android
     */
    useHandleAndroidBackButtonClose(
      android_closeOnBackPress,
      closeBottomSheet,
      sheetOpen
    );

    // Children
    const ChildNodes =
      typeof Children === 'function' ? (
        <Children _animatedHeight={_animatedHeight} />
      ) : (
        Children
      );

    return (
      <>
        {typeof passedContainerHeight === 'string' ? (
          /**
           * Below View handles converting `passedContainerHeight` from string to a number (to be animatable).
           * It does this by taking the string height passed via `containerHeight` prop,
           * and returning it's numeric equivalent after rendering, via its `onLayout` so we can
           * use that as the final container height.
           */
          <View
            onLayout={containerViewLayoutHandler}
            style={{
              position: 'absolute',
              height: passedContainerHeight,
              width: 0,
              opacity: 0,
            }}
          />
        ) : null}

        {/* Container */}
        <Container style={{ height: _animatedContainerHeight }}>
          {/* Backdrop */}
          {modal ? (
            <Backdrop
              BackdropComponent={CustomBackdropComponent}
              _animatedHeight={_animatedHeight}
              animatedBackdropOpacity={_animatedBackdropMaskOpacity}
              backdropColor={backdropMaskColor}
              backdropPosition={customBackdropPosition}
              closeOnPress={closeOnBackdropPress}
              containerHeight={containerHeight}
              contentContainerHeight={convertedHeight}
              pressHandler={closeBottomSheet}
              rippleColor={android_backdropMaskRippleColor}
              sheetOpen={sheetOpen}
            />
          ) : null}
          {/* content container */}
          <Animated.View
            ref={contentWrapperRef}
            key={'BottomSheetContentContainer'}
            onLayout={cacheElementReference}
            /* Merge external and internal styles carefully and orderly */
            style={[
              !modal ? materialStyles.contentContainerShadow : false,
              materialStyles.contentContainer,
              // Apply default top-corner radii only when the user hasn't
              // supplied a `borderRadius` shorthand since RN's render layer keeps
              // individual corner properties over the shorthand, so leaving
              // them in would silently override the user's value.
              !(
                sepStyles?.otherStyles &&
                'borderRadius' in sepStyles.otherStyles
              )
                ? materialStyles.contentContainerTopRadius
                : false,
              // we apply styles other than padding here
              sepStyles?.otherStyles,
              {
                height: _animatedHeight,
                minHeight: _animatedHeight,
                opacity: interpolatedOpacity,
              },
            ]}
            {...panHandlersFor('contentwrapper')}
          >
            <PolymorphicHandleBar />

            <View
              // we apply padding styles here to not affect drag handle above.
              // `flex: 1` lets this fill the remaining space below the drag
              // handle so children sized with `flex` or percentage heights
              // render against the actual available area (issue #36).
              style={[materialStyles.contentBody, sepStyles?.paddingStyles]}
            >
              {ChildNodes}
            </View>
          </Animated.View>
        </Container>
      </>
    );
  }
) as BOTTOMSHEET;

BottomSheet.displayName = 'BottomSheet';
BottomSheet.ANIMATIONS = ANIMATIONS;

const materialStyles = StyleSheet.create({
  contentContainer: {
    backgroundColor: '#F7F2FA',
    width: '100%',
    overflow: 'hidden',
  },
  contentContainerTopRadius: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  contentBody: {
    flex: 1,
  },
  contentContainerShadow:
    Platform.OS === 'android'
      ? {
          elevation: 7,
        }
      : {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowOpacity: 0.29,
          shadowRadius: 4.65,
        },
});

export default BottomSheet;
