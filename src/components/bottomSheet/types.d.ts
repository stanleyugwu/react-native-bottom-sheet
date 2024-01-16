import { Animated, OpaqueColorValue, ViewProps, ViewStyle } from 'react-native';
import {
  ANIMATIONS,
  CUSTOM_BACKDROP_POSITIONS,
  type BottomSheetMethods,
} from '../../types.d';
import React from 'react';

export type SheetStyleProp = Omit<
  ViewStyle,
  'height' | 'minHeight' | 'maxHeight'
>;

// short hand for toValue key of Animator methods
type ToValue = Animated.TimingAnimationConfig['toValue'];

// this is to accomodate static `ANIMATIONS` property of BottomSheet function below
type BOTTOMSHEET = React.ForwardRefExoticComponent<
  BottomSheetProps & React.RefAttributes<BottomSheetMethods>
> & { ANIMATIONS: typeof ANIMATIONS };

type AnimationType = ANIMATIONS | Lowercase<keyof typeof ANIMATIONS>;

type AnimationEasingFunction = (x: number) => number;

/**
 * Props types for bottom sheet component
 */
interface BottomSheetProps {
  /**
   * Height of the bottom sheet when expanded. This value will be relative to `containerHeight`
   * if it's supplied, or the screen's height otherwise.
   * Value can be in pixel units (number) or percentage (string).
   *
   * `Default: '50%'`
   *
   * @type {number | string}
   * @default '50%'
   * @example
   * height={300}
   * // or
   * height={'50%'}
   *
   */
  height?: number | string;

  /**
   * Extra styles to apply to bottom sheet (the `View` that wraps its children).
   *
   * `Note:` style properties `height`, `maxHeight`, `minHeight` will be ignored.
   * If you want to set sheet's height, pass the `height` prop instead.
   * @type {SheetStyleProp}
   */
  style?: SheetStyleProp;

  /**
   * Height of the bottom sheet's overall container, this will be the height of
   * the entire bottom sheet including the backdrop mask. height passed through the `height` prop
   * will be relative to this.
   *
   * `Note:` By default this will be the height of the device's screen.
   *
   * `Default: DEVICE'S SCREEN HEIGHT`
   * @type {number | string}
   * @default {DEVICE SCREEN HEIGHT}
   */
  containerHeight?: ViewStyle['height'];

  /**
   * Animation to use when opening and closing the bottom sheet.
   * Use exported `ANIMATIONS` enum to pass value to this prop
   *
   * `Default: 'slide'`
   * @type {AnimationType | ANIMATIONS}
   * @default "slide" | ANIMATIONS.SLIDE
   * @example
   * ```tsx
   * import BottomSheet, {ANIMATIONS} from '@devvie/bottom-sheet';
   * ...
   * <BottomSheet animationType={ANIMATIONS.SLIDE}>
   * ...
   * </BottomSheet>
   * ```
   */
  animationType?: AnimationType;

  /**
   * Color of the scrim or backdrop mask when `modal` is true.
   *
   * `Default: '#00000052'` (i.e black with 32% opacity)
   * @type {string | OpaqueColorValue}
   * @default '#00000052'
   */
  backdropMaskColor?: string | OpaqueColorValue;

  /**
   * Determines whether the bottom sheet will close when the scrim or backdrop mask is pressed.
   *
   * `Default: true`
   * @type {boolean}
   * @default true
   */
  closeOnBackdropPress?: boolean;

  /**
   * Determines whether bottom sheet will close when its dragged down
   * below 1/3 (one quater) of its height.
   *
   * `Default:true`
   * @type boolean
   * @default true
   */
  closeOnDragDown?: boolean;

  /**
   * When true, hides the sheet's drag handle. The drag handle is visible by default.
   *
   * `Note:` When true, custom drag handle component will also be hidden.
   *
   * `Default: false`
   *
   * @type {boolean}
   * @default false
   */
  hideDragHandle?: boolean;

  /**
       * Custom drag handle component to replace the default bottom sheet's drag handle.
       *
       * This component will be passed the animated `height` and `translateY` values of the bottom sheet,
       * which can be used to interpolate or extended animations to its children.
       *
       * `Note:` Styles passed through `dragHandleStyle` prop won't be applied to it.
       *
       * @type {React.FC<{animatedHeight: Animated.Value, animatedYTranslation:Animated.Value}>}
       * @example
       * ```tsx
       * // Below example will animate the custom drag handle's width as the 
       * // bottom sheet is being dragged/panned down
       * <BottomSheet
            customDragHandleComponent={(props) => (
              <Animated.View
              style={{
                  height: 5,
                  backgroundColor: 'orange',
                  width: props._animatedYTranslation.interpolate({
                    inputRange: [0, 25, 200],
                    outputRange: [20, 50, 100],
                  }),
                }}
              />
            )}>
            ...
          </BottomSheet>
       * ```
       */
  customDragHandleComponent?: React.FC<{
    /**
     * Animated height of the bottom sheet when expanding
     * @type {Animated.Value}
     */
    _animatedHeight: Animated.Value;
  }>;

  /**
   * Extra styles to apply to the drag handle.
   *
   * `Note:` These styles will be ignored when `customDragHandleComponent` is provided
   * @type {ViewStyle}
   */
  dragHandleStyle?: ViewStyle;

  /**
   * When true, prevents the bottom sheet from being panned down by dragging its drag handle.
   * This prop also applies to custom drag handle component provided via `customDragHandleComponent` prop.
   *
   * The bottom sheet is draggable by it's drag handle by default
   *
   * `Default:false`;
   * @type {boolean}
   * @default false
   */
  disableDragHandlePanning?: boolean;

  /**
   * When true, prevents the bottom sheet from being dragged/panned down on its body.
   * The bottom sheet body is draggable by default.
   *
   * `Default:false`;
   * @type boolean
   * @default false
   */
  disableBodyPanning?: boolean;

  /**
   * When `closeOnBackdropPress` is `true`, color of the ripple effect that occurs when scrim or backdrop mask is pressed.
   *
   * `Note:` Only works for Android
   *
   * `Default: none` (i.e no ripple effect);
   * @platform Android
   * @type (string | OpaqueColorValue)
   * @default undefined
   */
  android_backdropMaskRippleColor?: string | OpaqueColorValue;

  /**
   * Custom component for sheet's scrim or backdrop mask.\
   * `Note:` The component will be passed animated height value
   *
   * @type {React.Component}
   * @default null
   */
  customBackdropComponent?: React.FunctionComponent<{
    _animatedHeight: Animated.Value;
  }>;

  /**
   * When `customBackdropComponent` is provided, determines its position within the sheet.
   *
   * **'top'** - positions the custom backdrop component directly above the sheet\
   * **'behind'** - positions the custom backdrop component behind the sheet.
   * This is the default behaviour
   *
   * `Note:` This prop only applies to custom backdrop component
   *
   * `Default: 'behind'`
   * @type {"top" | "behind" | CUSTOM_BACKDROP_POSITIONS}
   * @default "behind" / CUSTOM_BACKDROP_POSITIONS.BEHIND
   */
  customBackdropPosition?:
    | CUSTOM_BACKDROP_POSITIONS
    | Lowercase<keyof typeof CUSTOM_BACKDROP_POSITIONS>;

  /**
   * Determines whether sheet is a modal.
   *
   * A modal sheet has a scrim or backdrop mask, while a standard (non-modal) sheet doesn't.
   *
   * `Note:` When false, this will also hide custom scrim/backdrop component supplied via `customBackdropComponent` prop.
   *
   * `Default: true`
   * @type boolean
   * @default true
   */
  modal?: boolean;

  /**
   * Contents of the bottom sheet. Can be element(s) or a component.
   *
   * If this is a component, it will be passed animated
   * height of bottom sheet via `_animatedHeight` prop
   *
   * `Default: null`
   * @type {ViewProps['children'] | React.FunctionComponent<{_animatedHeight: Animated.Value}>}
   * @default null
   */
  children:
    | ViewProps['children']
    | React.FunctionComponent<{ _animatedHeight: Animated.Value }>;

  /**
   * Duration for sheet opening animation.
   *
   * `Default: 500`
   * @type number
   * @default 500
   */
  openDuration?: number;

  /**
   * Duration for sheet closing animation.
   *
   * `Default: 500`
   * @type number
   * @default 500
   */
  closeDuration?: number;

  /**
   * Custom easing function for driving sheet's animation.\
   * If provided, easing function for passed `animationType` will be replaced with this,
   * rendering `animationType` prop obsolete
   *
   * `Default: ANIMATIONS.SLIDE`
   * @type {(AnimationEasingFunction)}
   * @default {ANIMATIONS.SLIDE}
   */
  customEasingFunction?: AnimationEasingFunction;

  /**
   * Determines whether sheet will close or not when device back button is pressed, on Android.
   *
   * __In a typical app screen (where back button takes user to the previous screen):__ \
   * _If `true` and sheet is open, the user has to press the back button twice to exit the screen.
   * The first press closes the sheet and the second exits the screen.\
   * If `false` and sheet is open, the user has to close the sheet through another means like backdrop press
   * and then press the back button after that to exit the screen_
   *
   * `Note:` Only applies for Android
   *
   * `Default: true`
   * @platform Android
   * @type {boolean}
   * @default {true}
   */
  android_closeOnBackPress?: boolean;

  /**
   * Сallback function that is called when the bottom sheet starts to close
   *
   * @type {Function}
   * @default undefined
   * @example
   * ```tsx
   * <BottomSheet
   *   onClose={() => {
   *     console.log('Bottom Sheet closing.');
   *   }}
   * />
   * ```
   */
  onClose?: Function;

  /**
   * Сallback function that is called when the bottom sheet starts to open
   *
   * @type {Function}
   * @default undefined
   * @example
   * ```tsx
   * <BottomSheet
   *   onOpen={() => {
   *     console.log('Bottom Sheet opening.');
   *   }}
   * />
   * ```
   */
  onOpen?: Function;

  /**
   * Function called with an animated number indicating the
   * progress of the opening/closing animation when sheet is being opened or closed.
   *
   * When `animationType` prop is __not__ set to `ANIMATION.FADE` or `'fade'`,
   * the number passed to this function will go from _`0`_ to _`sheet's height`_ (when sheet's opening)
   * or _`sheet's height`_ to  _`0`_ (when sheet's closing).
   *
   * When `animationType` prop is set to `ANIMATION.FADE` or `'fade'`,
   * the number will go from `0.0` to `1.0` (when sheet's opening)
   * or _`1.0`_ to  _`0.0`_ (when sheet's closing).
   *
   * `Default: undefined`
   * @default {undefined}
   * @type {(animatedHeightOrOpacity: number) => void}
   * ### Example with 'slide' or 'spring' animation
   * @example
   * ```tsx
   * <BottomSheet
       ref={sheetRef}
       height={300}
       animationType="slide"
       onAnimate={(animatedValue) => {
         console.log(animatedValue); // (0)...(150)...(300)
       }}
    >
       ...
    </BottomSheet>
   * ```
   * ### Example with 'fade' animation
   * @example 
   * ```tsx
   * <BottomSheet
       ref={sheetRef}
       height={300}
       animationType="fade"
       onAnimate={(animatedValue) => {
         console.log(animatedValue); // (0.0)...(0.5)...(1.0)
       }}
    >
       ...
    </BottomSheet>
     ```
   */
  onAnimate?: (animatedHeightOrOpacity: number) => void;

  /**
   * By default, the sheet handles keyboard pop-out automatically and smartly,
   * setting this to `true` disables that behavior, essentially leaving
   * the system to handle the keyboard the native way.
   *
   * `Default: false`
   * @type {boolean}
   * @default {false}
   */
  disableKeyboardHandling?: boolean;
}

export {
  ANIMATIONS,
  BottomSheetProps,
  CUSTOM_BACKDROP_POSITIONS,
  BottomSheetMethods,
  BOTTOMSHEET,
  AnimationEasingFunction,
  ToValue,
};
