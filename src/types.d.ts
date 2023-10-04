/**
 * Supported animation types
 */
export enum ANIMATIONS {
  SLIDE = 'slide',
  SPRING = 'spring',
  FADE = 'fade',
}

/**
 * Alias for `ANIMATIONS` to allow literal animation type string as prop
 * @alias ANIMATIONS
 */
export type AnimationType = Lowercase<keyof typeof ANIMATIONS>;

/**
 * Supported custom backdrop component position
 */
export enum CUSTOM_BACKDROP_POSITIONS {
  TOP = 'top',
  BEHIND = 'behind',
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
