import {Animated, OpaqueColorValue, ViewProps, ViewStyle} from 'react-native';
import {
  ANIMATIONS,
  BottomSheetProps,
  CUSTOM_BACKDROP_POSITIONS,
} from '../../types';
import React from 'react';

// short hand for toValue key of Animator methods
export type ToValue = Animated.TimingAnimationConfig['toValue'];

// this is to accomodate static `ANIMATIONS` property of BottomSheet function below
export type BOTTOMSHEET = React.ForwardRefExoticComponent<
  BottomSheetProps & React.RefAttributes<BottomSheetProps>
> & {ANIMATIONS: typeof ANIMATIONS};

/**
 * Props types for bottom sheet component
 */
export interface BottomSheetProps {
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
   * `Note:` style properties `height`, `maxHeight`, `minHeight` and translation along y-axis i.e `transform:[{translateY:...}]` will be ignored.
   * @type {Omit<ViewStyle, 'height' | 'minHeight' | 'maxHeight' | 'transform:[{translateY}]'>}
   */
  style?: Omit<ViewStyle, 'height' | 'minHeight' | 'maxHeight'>;

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
   * import BottomSheet, {ANIMATIONS} from '@devvie/bottom-sheet';
   * ...
   * <BottomSheet animationType={ANIMATIONS.SLIDE}>
   * ...
   * </BottomSheet>
   */
  animationType?: AnimationType;

  /**
   * Background color of the backdrop mask.
   *
   * `Default: '#000a'`
   * @type {string | OpaqueColorValue}
   * @default '#000a'
   */
  backdropMaskColor?: string | OpaqueColorValue;

  /**
   * Determines whether the bottom sheet will close when the backdrop mask is pressed.
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
   * When true, hides the handle bar. Handle bar is visible by default.
   *
   * `Note:` When true, custom handle bar component will also be hidden.
   *
   * `Default: false`
   *
   * @type {boolean}
   * @default false
   */
  hideHandleBar?: boolean;

  /**
       * Custom handle bar component to replace the default bottom sheet's handle bar.
       *
       * This component will be passed the animated `height` and `translateY` values of the bottom sheet,
       * which can be used to interpolate or extended animations to its children.
       *
       * `Note:` Styles passed through `handleBarStyle` prop won't be applied.
       *
       * @example
       * ```tsx
       * // Below example will animate the custom handle bar's width as the 
       * // bottom sheet is being dragged/panned down
       * <BottomSheet
            customHandleBarComponent={(props) => (
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
       * @type {React.FC<{animatedHeight: Animated.Value, animatedYTranslation:Animated.Value}>}
       * 
       */
  customHandleBarComponent?: React.FC<{
    /**
     * Animated height of the bottom sheet when expanding
     * @type {Animated.Value}
     */
    _animatedHeight: Animated.Value;

    /**
     * Animated **y-axis** translation (i.e `translateY`) of the bottom sheet when it's panned/dragged down/up
     * @type {Animated.Value}
     */
    _animatedYTranslation: Animated.Value;
  }>;

  /**
   * Extra styles to apply to handle bar.
   *
   * `Note:` These styles will be ignored when `customHandleBarComponent` is provided
   * @type {ViewStyle}
   */
  handleBarStyle?: ViewStyle;

  /**
   * When true, prevents the bottom sheet from being dragged/panned down on the handle bar.
   * This prop also applies to custom handle bar component provided via `customHandleBarComponent` prop.
   *
   * The bottom sheet handle bar is draggable by default
   *
   * `Default:false`;
   * @type {boolean}
   * @default false
   */
  disableHandleBarPanning?: boolean;

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
   * Ripple effect color of backdrop mask when touched.
   * Works only on android and only if `closeOnBackdropPress` is true.
   *
   * `Default: none`;
   * @platform android
   * @type string | OpaqueColorValue
   * @default undefined
   */
  android_backdropMaskRippleColor?: string | OpaqueColorValue;

  /**
   * Custom component for sheet's backdrop mask.\
   * `Note:` The component will be passed animated height value
   *
   * @type {React.Component}
   * @default null
   */
  customBackdropComponent?: React.FunctionComponent<{
    _animatedHeight: Animated.Value;
  }>;

  /**
   * When `customBackdropComponent` is provided, determines its position within the sheet.\
   *
   * **'top'** - positions the custom backdrop component directly above the sheet\
   * **'behind'** - positions the custom backdrop component behind the sheet.
   * This is the default behaviour\
   *
   * `Note:` This prop only applies to custom backdrop component
   *
   * `Default: 'top'`
   * @type {"top" | "behind"}
   * @default "behind"
   */
  customBackdropPosition?: Lowercase<keyof typeof CUSTOM_BACKDROP_POSITIONS>;

  /**
   * When true, disables/hides the backdrop mask component.
   *
   * `Note:` This will also hide custom backdrop component supplied via `customBackdropComponent` prop.
   *
   * `Default: false`
   * @type boolean
   * @default false
   */
  hideBackdrop?: boolean;

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
    | React.FunctionComponent<{_animatedHeight: Animated.Value}>;

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
}
