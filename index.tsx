import React, {
  forwardRef,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  View,
  PanResponder,
  StyleSheet,
  LayoutChangeEvent,
  Dimensions,
  useWindowDimensions,
  Keyboard,
  EmitterSubscription,
} from 'react-native';
import {
  DEFAULT_ANIMATION,
  DEFAULT_BACKDROP_MASK_COLOR,
  DEFAULT_HEIGHT,
  FALLBACK_CONTENT_WRAPPER_HEIGHT,
} from './constant';
import {BottomSheetProps} from './index.d';
import AnimatedTouchableBackdropMask from './components/AnimatedTouchableBackdropMask';
import DefaultHandleBar from './components/DefaultHandleBar';
import Container from './components/Container';
import normalizeHeight from './utils/normalizeHeight';
import convertHeight from './utils/convertHeight';
import useHandleKeyboardEvents from './hooks/useHandleKeyboardEvents';
import useAnimatedValue from './hooks/useAnimatedValue';

/**
 * Supported animation types
 */
export enum ANIMATIONS {
  SLIDE = 'slide',
  SPRING = 'spring',
  FADE = 'fade',
}

/**
 * Bottom sheet's ref instance methods
 */
export interface BottomSheetMethods {
  /**
   * Expands the bottom sheet to the `height` passed through props
   */
  open(): void;
  /**
   * Collapses the bottom sheet
   */
  close(): void;
}

// short hand for toValue key of animation
type ToValue = Animated.TimingAnimationConfig['toValue'];

/**
 * Main bottom sheet component
 */
const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  (
    {
      backdropMaskColor = DEFAULT_BACKDROP_MASK_COLOR,
      children,
      animationType = DEFAULT_ANIMATION,
      closeOnBackdropPress = true,
      height = DEFAULT_HEIGHT,
      hideHandleBar = false,
      handleBarStyle,
      disableBodyPanning = false,
      disableHandleBarPanning = false,
      customHandleBarComponent,
      style: contentContainerStyle,
      closeOnDragDown = true,
      containerHeight: passedContainerHeight,
    },
    ref,
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
    const _animatedTranslateY = useAnimatedValue(0);

    /** cached _nativeTag property of content container */
    const cachedContentWrapperNativeTag = useRef<number | undefined>(undefined);

    /**
     * `height` prop converted from percentage e.g `'50%'` to pixel unit e.g `320`,
     * relative to `containerHeight` or `DEVICE_SCREEN_HEIGHT`.
     * Also auto calculates and adjusts container wrapper height when `containerHeight`
     * or `height` changes
     */
    const convertedHeight = useMemo(() => {
      const newHeight = convertHeight(height, containerHeight);
      sheetOpen && _animatedHeight.setValue(newHeight);
      return newHeight;
    }, [containerHeight, height, sheetOpen]);

    const {removeKeyboardListeners} = useHandleKeyboardEvents(
      convertedHeight,
      _animatedHeight,
      sheetOpen,
    );

    /**
     * Returns conditioned gesture handlers for content container and handle bar elements
     */
    const getPanHandlersFor = (view: 'handlebar' | 'contentwrapper') => {
      if (view == 'handlebar' && disableHandleBarPanning) return null;
      if (view == 'contentwrapper' && disableBodyPanning) return null;
      return PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          /**
           * `FiberNode._nativeTag` is stable across renders so we use it to determine
           * whether content container or it's child should respond to touch move gesture.
           *
           * The logic is, when content container is laid out, we extract it's _nativeTag property and cache it
           * So later when a move gesture event occurs within it, we compare the cached _nativeTag with the _nativeTag of
           * the event target's _nativeTag, if they match, then content container should respond, else its children should.
           * Also, when the target is the handle bar, we le it handle geture unless panning is disabled through props
           */
          return view == 'handlebar'
            ? true
            : cachedContentWrapperNativeTag.current ==
                // @ts-expect-error
                evt?.target?._nativeTag;
        },
        onPanResponderMove: (e, gestureState) => {
          if (gestureState.dy > 0) {
            // backdrop opacity relative to the height of the content sheet
            // to makes the backdrop more transparent as you drag the content sheet down
            const relativeOpacity = 1 - gestureState.dy / convertedHeight;
            _animatedBackdropMaskOpacity.setValue(relativeOpacity);
            animationType != ANIMATIONS.FADE &&
              _animatedHeight.setValue(convertedHeight - gestureState.dy);
          }
        },
        onPanResponderRelease(e, gestureState) {
          if (gestureState.dy >= convertedHeight / 3 && closeOnDragDown) {
            closeBottomSheet();
          } else {
            _animatedBackdropMaskOpacity.setValue(1);
            animationType != ANIMATIONS.FADE &&
              animators.animateHeight(convertedHeight).start();
          }
        },
      }).panHandlers;
    };

    /**
     * Polymorphic content container handle bar component
     */
    const PolymorphicHandleBar = () => {
      const CustomHandleBar = customHandleBarComponent;
      return hideHandleBar ? null : CustomHandleBar &&
        typeof CustomHandleBar == 'function' ? (
        <View style={{alignSelf: 'center'}} {...getPanHandlersFor('handlebar')}>
          <CustomHandleBar
            animatedHeight={_animatedHeight}
            animatedYTranslation={_animatedTranslateY}
          />
        </View>
      ) : (
        <DefaultHandleBar
          style={handleBarStyle}
          {...getPanHandlersFor('handlebar')}
        />
      );
    };

    /**
     * Extracts and caches the _nativeTag property of ContentWrapper
     */
    let extractNativeTag = useCallback(
      // @ts-expect-error
      ({target: {_nativeTag: tag = undefined}}: LayoutChangeEvent) => {
        !cachedContentWrapperNativeTag.current &&
          (cachedContentWrapperNativeTag.current = tag);
      },
      [],
    );

    /**
     * Expands the bottom sheet.\
     * The flow/steps of the bottom sheet animation is:
     * 1. The container enters the screen (slide-in) by animating it's height to that of screen
     * 2. It's opacity animates to 1 from 0
     * 3. The content container animates it's height from 0 to calculated height prop
     */
    const openBottomSheet = () => {
      animators.animateContainerHeight(containerHeight).start();
      animators.animateBackdropMaskOpacity(1).start();
      animationType != ANIMATIONS.FADE &&
        animators.animateHeight(convertedHeight).start(anim => {
          if (anim.finished) setSheetOpen(true);
        });
    };

    const closeBottomSheet = () => {
      if (animationType == ANIMATIONS.FADE) {
        Animated.sequence([
          animators.animateBackdropMaskOpacity(0),
          animators.animateContainerHeight(0),
        ]).start(anim => {
          if (anim.finished) setSheetOpen(false);
        });
      } else {
        animators.animateBackdropMaskOpacity(0).start();
        animators.animateContainerHeight(0).start(anim => {
          if (anim.finished) setSheetOpen(false);
        });
        animators.animateHeight(0).start();
        removeKeyboardListeners();
        Keyboard.dismiss();
      }
    };

    const animators = {
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
      animateContainerHeight(toValue: ToValue) {
        return Animated.timing(_animatedContainerHeight, {
          toValue: toValue,
          useNativeDriver: false,
          duration: 50,
        });
      },
      animateBackdropMaskOpacity(toValue: ToValue) {
        return Animated.timing(_animatedBackdropMaskOpacity, {
          toValue: toValue,
          useNativeDriver: false,
          duration: 200,
        });
      },
      animateHeight(toValue: ToValue) {
        const DEFAULT_DURATION = 500;
        return Animated.timing(_animatedHeight, {
          toValue,
          useNativeDriver: false,
          duration:
            animationType == ANIMATIONS.SPRING
              ? DEFAULT_DURATION + 100
              : DEFAULT_DURATION,
          easing:
            animationType == ANIMATIONS.SLIDE
              ? this._slideEasingFn
              : this._springEasingFn,
        });
      },
      animateTranslateY(toValue: ToValue) {
        const DEFAULT_DURATION = 500;
        return Animated.timing(_animatedTranslateY, {
          toValue,
          useNativeDriver: false,
          duration: DEFAULT_DURATION,
          easing:
            animationType == ANIMATIONS.SLIDE
              ? this._slideEasingFn
              : this._springEasingFn,
        });
      },
    };

    const containerViewLayoutHandler = (event: LayoutChangeEvent) => {
      const newHeight = event.nativeEvent.layout.height;
      setContainerHeight(newHeight);
      // incase `containerHeight` prop value changes when bottom sheet is expanded
      // we need to manually update the container height
      _animatedContainerHeight.setValue(newHeight);
    };

    /**
     * Handles auto adjusting container view height and clamping
     * and normalizing `containerHeight` prop upon change, if its a number.
     * Also auto adjusts when orientation changes
     */
    useEffect(() => {
      if (typeof passedContainerHeight == 'number') {
        setContainerHeight(normalizeHeight(passedContainerHeight));
        sheetOpen && _animatedContainerHeight.setValue(passedContainerHeight);
      } else if (typeof passedContainerHeight == 'undefined') {
        setContainerHeight(SCREEN_HEIGHT);
        sheetOpen && _animatedContainerHeight.setValue(SCREEN_HEIGHT);
      }
    }, [passedContainerHeight, sheetOpen, SCREEN_HEIGHT]);

    return (
      <>
        {typeof passedContainerHeight == 'string' ? (
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
              width: StyleSheet.hairlineWidth,
              backgroundColor: 'red',
            }}
          />
        ) : null}

        {/* Container */}
        <Container style={{height: _animatedContainerHeight}}>
          {/* Backdrop */}
          {/* @ts-expect-error (expects conditional render with `closeOnBackdropPress`) */}
          <AnimatedTouchableBackdropMask
            isPressable={closeOnBackdropPress}
            pressHandler={closeBottomSheet}
            style={{
              opacity: _animatedBackdropMaskOpacity,
              backgroundColor: backdropMaskColor,
            }}
            touchSoundDisabled
            key={'TouchableBackdropMask'}
          />
          {/* content container */}
          <Animated.View
            key={'BottomSheetContentContainer'}
            onLayout={extractNativeTag}
            /**
             * Merge external style and transform property carefully and orderly with
             * internal styles and animated transform properties
             * to apply external styles and transform properties and avoid
             * internal styles and transform properties override
             */
            style={[
              styles.contentContainer,
              contentContainerStyle,
              {
                height:
                  animationType == ANIMATIONS.FADE ? height : _animatedHeight,
                minHeight: _animatedHeight,
                opacity:
                  animationType == ANIMATIONS.FADE
                    ? _animatedBackdropMaskOpacity.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0.3, 1],
                        extrapolate: 'clamp',
                      })
                    : contentContainerStyle?.opacity,
                transform: [
                  ...(contentContainerStyle?.transform || []),
                  {translateY: _animatedTranslateY}, // non-overridable,
                ],
              },
            ]}
            {...getPanHandlersFor('contentwrapper')}>
            {/* Content Handle Bar */}
            {<PolymorphicHandleBar />}
            {children}
          </Animated.View>
        </Container>
      </>
    );
  },
);

const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: 'white',
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default BottomSheet;
