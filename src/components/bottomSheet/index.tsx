import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
} from 'react';
import {
  Animated,
  View,
  PanResponder,
  StyleSheet,
  type LayoutChangeEvent,
  useWindowDimensions,
  Keyboard,
  Platform,
} from 'react-native';
import {
  DEFAULT_ANIMATION,
  DEFAULT_BACKDROP_MASK_COLOR,
  DEFAULT_CLOSE_ANIMATION_DURATION,
  DEFAULT_HEIGHT,
  DEFAULT_OPEN_ANIMATION_DURATION,
} from '../../constant';
import DefaultHandleBar from '../defaultHandleBar';
import Container from '../container';
import normalizeHeight from '../../utils/normalizeHeight';
import convertHeight from '../../utils/convertHeight';
import useHandleKeyboardEvents from '../../hooks/useHandleKeyboardEvents';
import useAnimatedValue from '../../hooks/useAnimatedValue';
import Backdrop from '../backdrop';
import {
  type BottomSheetProps,
  type ToValue,
  ANIMATIONS,
  type BottomSheetMethods,
  CUSTOM_BACKDROP_POSITIONS,
  type BOTTOMSHEET,
} from './types.d';
import useHandleAndroidBackButtonClose from '../../hooks/useHandleAndroidBackButtonClose';
import separatePaddingStyles from '../../utils/separatePaddingStyles';

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
    }));

    /**
     * If passed container height is a valid number we use that as final container height
     * else, it may be a percentage value so then we need to change it to a number (so it can be animated).
     * The change is handled with `onLayout` further down
     */
    const SCREEN_HEIGHT = useWindowDimensions().height; // actual container height is measured after layout
    const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);
    const [sheetOpen, setSheetOpen] = useState(false);

    // animated properties
    const _animatedContainerHeight = useAnimatedValue(0);
    const _animatedBackdropMaskOpacity = useAnimatedValue(0);
    const _animatedHeight = useAnimatedValue(0);

    const contentWrapperRef = useRef<View>(null);

    /** cached _nativeTag property of content container */
    const cachedContentWrapperNativeTag = useRef<number | undefined>(undefined);

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
    const Animators = useMemo(
      () => ({
        _slideEasingFn(value: number) {
          return value === 1 ? 1 : 1 - Math.pow(2, -10 * value);
        },
        _springEasingFn(value: number) {
          const c4 = (2 * Math.PI) / 2.5;
          return value === 0
            ? 0
            : value === 1
            ? 1
            : Math.pow(2, -9 * value) * Math.sin((value * 4.5 - 0.75) * c4) + 1;
        },
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
                ? this._slideEasingFn
                : this._springEasingFn,
          });
        },
      }),
      [
        animationType,
        customEasingFunction,
        _animatedContainerHeight,
        _animatedBackdropMaskOpacity,
        _animatedHeight,
      ]
    );

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
     * `height` prop converted from percentage e.g `'50%'` to pixel unit e.g `320`,
     * relative to `containerHeight` or `DEVICE_SCREEN_HEIGHT`.
     * Also auto calculates and adjusts container wrapper height when `containerHeight`
     * or `height` changes
     */
    const convertedHeight = useMemo(() => {
      const newHeight = convertHeight(height, containerHeight, hideDragHandle);

      // FIXME: we use interface-undefined but existing property `_value` here and it's risky
      // @ts-expect-error
      const curHeight = _animatedHeight._value;
      if (sheetOpen && newHeight !== curHeight) {
        if (animationType === ANIMATIONS.FADE)
          _animatedHeight.setValue(newHeight);
        else
          Animators.animateHeight(
            newHeight,
            newHeight > curHeight ? openDuration : closeDuration
          ).start();
      }
      return newHeight;
    }, [
      containerHeight,
      height,
      animationType,
      sheetOpen,
      Animators,
      _animatedHeight,
      closeDuration,
      hideDragHandle,
      openDuration,
    ]);

    /**
     * If `disableKeyboardHandling` is false, handles keyboard pop up for both platforms,
     * by auto adjusting sheet layout accordingly
     */
    const keyboardHandler = useHandleKeyboardEvents(
      !disableKeyboardHandling,
      convertedHeight,
      sheetOpen,
      Animators.animateHeight,
      contentWrapperRef
    );

    /**
     * Returns conditioned gesture handlers for content container and handle bar elements
     */
    const panHandlersFor = (view: 'handlebar' | 'contentwrapper') => {
      if (view === 'handlebar' && disableDragHandlePanning) return null;
      if (view === 'contentwrapper' && disableBodyPanning) return null;
      return PanResponder.create({
        onMoveShouldSetPanResponder: (evt) => {
          /**
           * `FiberNode._nativeTag` is stable across renders so we use it to determine
           * whether content container or it's child should respond to touch move gesture.
           *
           * The logic is, when content container is laid out, we extract it's _nativeTag property and cache it
           * So later when a move gesture event occurs within it, we compare the cached _nativeTag with the _nativeTag of
           * the event target's _nativeTag, if they match, then content container should respond, else its children should.
           * Also, when the target is the handle bar, we le it handle geture unless panning is disabled through props
           */
          return view === 'handlebar'
            ? true
            : cachedContentWrapperNativeTag.current ===
                // @ts-expect-error
                evt?.target?._nativeTag;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            // backdrop opacity relative to the height of the content sheet
            // to makes the backdrop more transparent as you drag the content sheet down
            const relativeOpacity = 1 - gestureState.dy / convertedHeight;
            _animatedBackdropMaskOpacity.setValue(relativeOpacity);

            if (animationType !== ANIMATIONS.FADE)
              _animatedHeight.setValue(convertedHeight - gestureState.dy);
          }
        },
        onPanResponderRelease(_, gestureState) {
          if (gestureState.dy >= convertedHeight / 3 && closeOnDragDown) {
            closeBottomSheet();
          } else {
            _animatedBackdropMaskOpacity.setValue(1);
            if (animationType !== ANIMATIONS.FADE)
              Animators.animateHeight(
                convertedHeight,
                openDuration / 2
              ).start();
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
     * Extracts and caches the _nativeTag property of ContentWrapper
     */
    let extractNativeTag = useCallback(
      // @ts-expect-error
      ({ target: { _nativeTag: tag = undefined } }: LayoutChangeEvent) => {
        if (!cachedContentWrapperNativeTag.current)
          cachedContentWrapperNativeTag.current = tag;
      },
      []
    );

    /**
     * Expands the bottom sheet.
     */
    const openBottomSheet = () => {
      // 1. open container
      // 2. if using fade animation, set content container height convertedHeight manually, animate backdrop.
      // else, animate backdrop and content container height in parallel
      Animators.animateContainerHeight(
        !modal ? convertedHeight : containerHeight
      ).start();
      if (animationType === ANIMATIONS.FADE) {
        _animatedHeight.setValue(convertedHeight);
        Animators.animateBackdropMaskOpacity(1, openDuration).start();
      } else {
        Animators.animateBackdropMaskOpacity(1, openDuration).start();
        Animators.animateHeight(convertedHeight, openDuration).start();
      }
      setSheetOpen(true);

      if (onOpen) {
        onOpen();
      }
    };

    const closeBottomSheet = () => {
      // 1. fade backdrop
      // 2. if using fade animation, close container, set content wrapper height to 0.
      // else animate content container height & container height to 0, in sequence
      Animators.animateBackdropMaskOpacity(0, closeDuration).start((anim) => {
        if (anim.finished) {
          if (animationType === ANIMATIONS.FADE) {
            Animators.animateContainerHeight(0).start();
            _animatedHeight.setValue(0);
          } else {
            Animators.animateHeight(0, closeDuration).start();
            Animators.animateContainerHeight(0).start();
          }
        }
      });
      setSheetOpen(false);
      keyboardHandler?.removeKeyboardListeners();
      Keyboard.dismiss();

      if (onClose) {
        onClose();
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
        const animate = (
          state: Parameters<Animated.ValueListenerCallback>['0']
        ) => onAnimate(state.value);
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
      if (!modal) return; // no auto layout adjustment when backdrop is hidden
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
              height: passedContainerHeight,
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
            onLayout={extractNativeTag}
            /* Merge external and internal styles carefully and orderly */
            style={[
              !modal ? materialStyles.contentContainerShadow : false,
              materialStyles.contentContainer,
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
              // we apply padding styles here to not affect drag handle above
              style={sepStyles?.paddingStyles}
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
