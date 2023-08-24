import React, {
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  ViewProps,
  OpaqueColorValue,
  View,
  Dimensions,
  PanResponder,
  TouchableOpacity,
  useWindowDimensions,
  ViewStyle,
  StyleProp,
  TransformsStyle,
  StyleSheet,
  RegisteredStyle,
  LayoutChangeEvent,
  ScrollView,
  Text,
} from 'react-native';
import {styles} from './styles';

/**
 * Supported animation types
 */
export enum ANIMATIONS {
  SLIDE = 'slide',
  SPRING = 'spring',
}

export type AnimationType = 'slide' | 'spring';
export interface BottomSheetProps extends Pick<ViewProps, 'children'> {
  /**
   * Height of the main bottom sheet, relative to `containerHeight` if supplied, or
   * the screen's height.\
   * Can be in pixel units (number) or percentage.
   *
   * `Default: '50%'`
   * @example
   * height={300}
   * // or
   * height={'50%'}
   *
   */
  height?: number | string;

  /**
   * Background color of the backdrop component.
   *
   * `Default: '#000a'`
   */
  backdropColor?: string | OpaqueColorValue;

  /**
   * Determines whether the bottom sheet will be closed when the backdrop is pressed
   *
   * `Default: true`
   */
  closeOnBackdropPress?: boolean;

  /**
   * Determines whether bottoms sheet will close when its dragged down past a quater of its `height`.
   *
   * `Default:true`
   * @type boolean
   * @default true
   */
  closeOnDragDown?: boolean;

  /**
   * Animation to use when opening and closing the bottom sheet
   *
   * `Default: 'slide'`
   * @type {AnimationType}
   * @default "slide"
   */
  animationType?: AnimationType;

  /**
   * Determines whether the default handle bar is hidden or not. It is visible by default.
   *
   * `Default: false`
   *
   * @type {boolean}
   * @default false
   */
  hideHandleBar?: boolean;

  /**
   * Styles to apply to handle.
   *
   * This prop is ignored when `customHandleBarComponent` is provided
   */
  handleBarStyle?: ViewStyle;

  /**
   * When true, prevents the bottom sheet from being dragged by its body. The bottom sheet is draggable by default
   *
   * `Default:false`;
   * @type boolean
   * @default false
   */
  disableBodyPanning?: boolean;

  /**
   * When true, prevents the bottom sheet from being dragged down by the handle bar.
   * This prop also applies to custom handle bar provided via `customHandleBarComponent`
   *
   * `Default:false`;
   * @type {boolean}
   * @default false
   */
  disableHandleBarPanning?: boolean;

  /**
   * Custom component for the sheet's handle bar.
   *
   * This component will receive the real-time animated `height` and `translateY` of the content wrapper,
   * which can be used to interpolate and extended animations to child elements.
   *
   * This prop makes `hideHandleBar`, and `handleBarStyle` props ignored.
   *
   * @example
   * ```tsx
   * // Below example will animate the handle bar width as the bottom sheet is being panned down
   * <BottomSheet
        customHandleBarComponent={props => (
          <Animated.View
            style={{
              width: props.animatedContentWrapperTranslateY.interpolate({
                inputRange: [0, 25, 200],
                outputRange: [20, 50, 100],
              }),
              margin: 10,
              height: 5,
              backgroundColor: 'orange',
            }}
          />
        )}>
        ...
      </BottomSheet>
   * ```
   * @type {React.FC<{animatedContentWrapperHeight: Animated.Value, animatedContentWrapperTranslateY:Animated.Value}>}
   * 
   */
  customHandleBarComponent?: React.FC<{
    /**
     * Animated height of the content wrapper when bottom sheet is opening
     * @type {Animated.Value}
     */
    animatedContentWrapperHeight: Animated.Value;

    /**
     * Animated **y-axis** translation of the content wrapper when it's panned/dragged down/up
     * @type {Animated.Value}
     */
    animatedContentWrapperTranslateY: Animated.Value;
  }>;

  /**
   * Style applied to sheet's content wrapper.
   *
   * **Note:** style properties `height`, `maxHeight`, `minHeight` and translation along y-axis i.e `transform:[{translateY:...}]` are ignored
   * @type {Omit<ViewStyle, 'height'>}
   */
  contentWrapperStyle?: Omit<ViewStyle, 'height' | 'minHeight' | 'maxHeight'>;

  /**
   * Height of the bottom sheet container, this will be the overall height of the bottom sheet.
   * The default will be the height of the device's screen.
   *
   * `Default: DEVICE_SCREEN_HEIGHT`
   * @type {number | string | undefined}
   */
  containerHeight?: ViewStyle['height'];
}

export interface BottomSheetMethods {
  open(): void;
  close(): void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  (
    {
      backdropColor = '#000a',
      children,
      animationType = ANIMATIONS.SLIDE,
      closeOnBackdropPress = false,
      height = '50%',
      hideHandleBar = false,
      handleBarStyle,
      disableBodyPanning = false,
      disableHandleBarPanning = false,
      customHandleBarComponent,
      contentWrapperStyle,
      closeOnDragDown = true,
      containerHeight: passedContainerHeight,
    },
    ref,
  ) => {
    // ref instance methods
    useImperativeHandle(ref, () => ({
      open() {
        animatedContentWrapperPanning.y.setValue(0);
        const DEFAULT_DURATION = 500;
        Animated.timing(animatedContainerHeight, {
          toValue: __containerHeight,
          useNativeDriver: false,
          duration: 0,
        }).start();
        Animated.timing(animatedBackdropOpacity, {
          toValue: 1,
          useNativeDriver: false,
          duration: 300,
        }).start();
        if (animationType == ANIMATIONS.SLIDE) {
          Animated.timing(animatedContentWrapperHeight, {
            toValue: calculatedHeight,
            useNativeDriver: false,
            duration: DEFAULT_DURATION,
            easing(value) {
              return value === 1 ? 1 : 1 - Math.pow(2, -10 * value);
            },
          }).start();
        } else {
          Animated.timing(animatedContentWrapperHeight, {
            toValue: calculatedHeight,
            useNativeDriver: false,
            duration: DEFAULT_DURATION + 300,
            easing(value) {
              const c4 = (2 * Math.PI) / 2.5;

              return value === 0
                ? 0
                : value === 1
                ? 1
                : Math.pow(2, -10 * value) * Math.sin((value * 5 - 0.75) * c4) +
                  1;
            },
          }).start();
        }
      },
      close() {
        closeBottomSheet();
      },
    }));

    const __screenHeight = useWindowDimensions().height;

    {
      // perform checks on, and clamp height
      let height = passedContainerHeight;
      if (typeof height == 'number') {
        passedContainerHeight =
          height < 0 ? 0 : height > __screenHeight ? __screenHeight : height;
      }
      if (typeof passedContainerHeight == 'undefined')
        passedContainerHeight = __screenHeight;
    }

    /**
     * If passed container height is a valid number we use that as final container height
     * else, it may be a percentage value.
     * So then we need to change it to a number (so it can be animated).
     * That is done with `onLayout` further down
     */
    let [__containerHeight, __setContainerHeight] = useState(
      typeof passedContainerHeight == 'number'
        ? passedContainerHeight
        : __screenHeight,
    );

    // animated nodes
    const animatedContainerHeight = useRef(new Animated.Value(0)).current;
    const animatedBackdropOpacity = useRef(new Animated.Value(0)).current;
    const animatedContentWrapperHeight = useRef(new Animated.Value(0)).current;
    const animatedContentWrapperPanning = useRef(
      new Animated.ValueXY({x: 0, y: 0}),
    ).current;

    /**
     * ref for `Animated.View` container element
     */
    const containerRef = useRef<View>(null);

    /**
     * cached _nativeTag property of content wrapper
     */
    const cachedContentWrapperNativeTag = useRef<number | undefined>(undefined);

    /**
     * Convert `height` prop from percentage e.g `'50%'` to pixel unit e.g `320`,
     * relative to `__containerHeight`
     */
    const calculatedHeight = useMemo(() => {
      let _height = height;
      const errorMsg = 'Invalid `height` prop';
      if (typeof height == 'number') {
        // normalise height
        if (height < 0) _height = 0;
        if (height > __containerHeight) _height = __containerHeight;
      } else if (typeof height == 'string') {
        const lastPercentIdx = height.lastIndexOf('%');

        // perform checks
        if (!height.endsWith('%') || height.length <= 1 || height.length > 4)
          throw errorMsg;
        let parsedHeight = Math.abs(
          parseInt(height.substring(0, lastPercentIdx)),
        );
        if (isNaN(parsedHeight)) throw errorMsg;

        // normalise height
        if (parsedHeight > 100) parsedHeight = 100;

        _height = Math.floor((parsedHeight / 100) * __containerHeight);
      } else throw errorMsg;

      return _height as number;
    }, [__containerHeight, height]);

    /**
     * Returns conditioned gesture handlers for content wrapper and handle bar elements
     */
    const getPanHandlersFor = (view: 'handlebar' | 'contentwrapper') => {
      if (view == 'handlebar' && disableHandleBarPanning) return null;
      if (view == 'contentwrapper' && disableBodyPanning) return null;
      return PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          /**
           * `FiberNode._nativeTag` is stable across renders so we use it to determine
           * whether content wrapper or it's child should respond to touch move gesture.
           *
           * The logic is, when content wrapper is laid out, we extract it's _nativeTag property and cache it
           * So later when a move gesture event occurs within it, we compare the cached _nativeTag with the _nativeTag of
           * the event target's _nativeTag, if they match, then content wrapper should respond, else its children should.
           * Also, when the event target's _nativeTag property matches cached handle bar _nativeTag we still let content
           * wrapper respond cus handle bar is part of it.
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
            const relativeOpacity = 1 - gestureState.dy / calculatedHeight;
            animatedBackdropOpacity.setValue(relativeOpacity);

            Animated.event([null, {dy: animatedContentWrapperPanning.y}], {
              useNativeDriver: false,
            })(e, gestureState);
          }
        },
        onPanResponderRelease(e, gestureState) {
          if (gestureState.dy >= calculatedHeight / 3 && closeOnDragDown) {
            Animated.timing(animatedBackdropOpacity, {
              toValue: 0,
              useNativeDriver: false,
              duration: 300,
            }).start();
            Animated.timing(animatedContainerHeight, {
              toValue: 0,
              useNativeDriver: false,
              duration: 0,
            }).start();
            Animated.timing(animatedContentWrapperHeight, {
              toValue: 0,
              useNativeDriver: false,
              duration: 500,
              easing:
                animationType == ANIMATIONS.SLIDE
                  ? value => {
                      return value === 1 ? 1 : 1 - Math.pow(2, -10 * value);
                    }
                  : value => {
                      const c4 = (2 * Math.PI) / 2.5;

                      return value === 0
                        ? 0
                        : value === 1
                        ? 1
                        : Math.pow(2, -10 * value) *
                            Math.sin((value * 5 - 0.75) * c4) +
                          1;
                    },
            }).start();
          } else {
            Animated.timing(animatedBackdropOpacity, {
              toValue: 1,
              useNativeDriver: false,
              duration: 500,
            }).start();
            Animated.timing(animatedContentWrapperPanning.y, {
              toValue: 0,
              useNativeDriver: false,
              duration: 500,
              easing:
                animationType == ANIMATIONS.SLIDE
                  ? value => {
                      return value === 1 ? 1 : 1 - Math.pow(2, -10 * value);
                    }
                  : value => {
                      const c4 = (2 * Math.PI) / 2.5;

                      return value === 0
                        ? 0
                        : value === 1
                        ? 1
                        : Math.pow(2, -10 * value) *
                            Math.sin((value * 5 - 0.75) * c4) +
                          1;
                    },
            }).start();
          }
        },
      }).panHandlers;
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
     * Conditionally rendered content wrapper handle bar element
     */
    const DymanicHandleBar = useMemo(() => {
      const CustomHandleBar = customHandleBarComponent;
      return hideHandleBar ? null : CustomHandleBar &&
        typeof CustomHandleBar == 'function' ? (
        <View style={{alignSelf: 'center'}} {...getPanHandlersFor('handlebar')}>
          <CustomHandleBar
            animatedContentWrapperHeight={animatedContentWrapperHeight}
            animatedContentWrapperTranslateY={animatedContentWrapperPanning.y}
          />
        </View>
      ) : (
        <View
          style={{
            padding: 10,
            width: 80,
            alignSelf: 'center',
          }}
          {...getPanHandlersFor('handlebar')}>
          <View
            style={[
              {
                height: 5,
                width: 50,
                backgroundColor: '#999',
                alignSelf: 'center',
                borderRadius: 50,
              },
              handleBarStyle,
            ]}
          />
        </View>
      );
    }, [
      customHandleBarComponent,
      disableHandleBarPanning,
      hideHandleBar,
      animatedContentWrapperHeight,
      animatedContentWrapperPanning.y,
      handleBarStyle,
    ]);

    /**
     * animate to `height` prop value whenever `calculatedHeight` changes and
     * bottom sheet is expanded
     */
    // useEffect(() => {
    //   animateContentWrapper(calculatedHeight).start();
    // }, [calculatedHeight]);

    // animation helpers
    const animateBackdropOpacity = (toValue: number) =>
      Animated.timing(animatedBackdropOpacity, {
        toValue: toValue,
        useNativeDriver: false,
        duration: 200,
      });

    const animateContentWrapper = (toValue: number) => {
      return animationType == ANIMATIONS.SLIDE
        ? Animated.timing(animatedContentWrapperHeight, {
            toValue,
            useNativeDriver: false,
            duration: 300,
            easing(value) {
              return value === 1 ? 1 : 1 - Math.pow(2, -10 * value);
            },
          })
        : Animated.spring(animatedContentWrapperHeight, {
            toValue,
            damping: 20,
            stiffness: 500,
            velocity: 3000,
            useNativeDriver: false,
          });
    };

    const animateContainerHeight = (toValue: number) =>
      Animated.timing(animatedContainerHeight, {
        toValue: toValue,
        useNativeDriver: false,
        duration: 50,
      });

    const openBottomSheet = () => {
      /**
       * The flow/steps of the bottom sheet animation is:
       * 1. The container enters the screen (slide-in) by animating it's height to that of screen
       * 2. It's opacity animates to 1 from 0
       * 3. The content wrapper animates it's height from 0 to calculated height prop
       */
      animatedContentWrapperPanning.y.setValue(0);

      Animated.spring(animatedContentWrapperHeight, {
        toValue: calculatedHeight,
        useNativeDriver: false,
        damping: 20,
        stiffness: 400,
        velocity: 3000,
      }).start();
      // animateContainerHeight(__containerHeight).start();
      // Animated.parallel([
      //   animateBackdropOpacity(1),
      //   animateContentWrapper(calculatedHeight),
      // ]).start();
    };

    const closeBottomSheet = () => {
      animateBackdropOpacity(0).start();
      animateContentWrapper(0).start();
      animateContainerHeight(0).start();
    };

    useEffect(() => {}, [animationType]);

    return (
      <>
        {
          // if __containerHeight != passedContainerHeight means percentage `containerHeight` was supplied
          __containerHeight != passedContainerHeight ? (
            /**
             * The purpose of below `View` is to determine the final container height in number.
             * It does this by taking the percentage height passed via `containerHeight` prop,
             * and return it's numeric equivalent after rendering, via its `onLayout` so we can
             * use that as the final container height
             */
            <View
              onLayout={event => {
                const newHeight = event.nativeEvent.layout.height;
                __setContainerHeight(newHeight);
                // incase `containerHeight` prop value changes when bottom sheet is expanded
                // we need to manually update the container height
                containerRef.current?.setNativeProps({height: newHeight});
              }}
              style={{
                height: passedContainerHeight,
                width: StyleSheet.hairlineWidth,
                backgroundColor: 'red',
              }}
            />
          ) : null
        }
        {/* Container */}
        <Animated.View
          ref={containerRef}
          style={{
            position: 'absolute',
            justifyContent: 'flex-end',
            right: 0,
            left: 0,
            // required to snap container to bottom of screen, so animation will start from botom up
            bottom: 0,
            backgroundColor: 'transparent',
            opacity: 1,
            height: animatedContainerHeight,
          }}>
          {/* Backdrop */}
          {closeOnBackdropPress ? (
            <AnimatedTouchable
              style={[
                {
                  backgroundColor: backdropColor,
                  opacity: animatedBackdropOpacity,
                },
                styles.sharedBackdropStyle,
              ]}
              onPress={closeBottomSheet}
              touchSoundDisabled
              key={'TouchableBackdrop'}
            />
          ) : (
            <Animated.View
              style={[
                {
                  backgroundColor: backdropColor,
                  opacity: animatedBackdropOpacity,
                },
                styles.sharedBackdropStyle,
              ]}
            />
          )}
          {/* Content Wrapper */}
          <Animated.View
            key={'BottomSheetContentWrapper'}
            onLayout={extractNativeTag}
            /**
             * Merge external style and transform property carefully and orderly with
             * internal styles and animated transform properties
             * to allow external styles and transform properties and avoid
             * internal styles and transform properties override
             */
            style={[
              {
                backgroundColor: 'white',
                width: '100%',
                overflow: 'hidden',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              },
              contentWrapperStyle,
              {
                height: animatedContentWrapperHeight,
                minHeight: animatedContentWrapperHeight,
                transform: [
                  animatedContentWrapperPanning.getTranslateTransform()[0], // overrideable,
                  ...(contentWrapperStyle?.transform || []),
                  animatedContentWrapperPanning.getTranslateTransform()[1], // non-overridable,
                ],
              },
            ]}
            {...getPanHandlersFor('contentwrapper')}>
            {/* Content Handle Bar */}
            {DymanicHandleBar}
            {children}
          </Animated.View>
        </Animated.View>
      </>
    );
  },
);

export default BottomSheet;
