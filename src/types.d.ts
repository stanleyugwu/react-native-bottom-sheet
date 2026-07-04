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
   * Expands the bottom sheet.
   *
   * When `snapPoints` is provided, opens to the snap point at the `index` prop
   * (default `0`); otherwise opens to the `height` passed through props.
   */
  open(): void;
  /**
   * Collapses the bottom sheet
   */
  close(): void;
  /**
   * Animates the bottom sheet to the snap point at the given `index` (0-based, ascending
   * order where `0` is the smallest point). The index is clamped to the valid range.
   *
   * Passing `-1` closes the sheet. If the sheet is currently closed, this opens it to the
   * given snap point.
   *
   * `Note:` When `snapPoints` is not provided, any non-negative index resolves to the
   * single `height`, so this behaves like `open()`.
   *
   * @param {number} index target snap point index (or `-1` to close)
   */
  snapToIndex(index: number): void;
  /**
   * Animates the bottom sheet to its largest snap point.
   *
   * Equivalent to `snapToIndex(snapPoints.length - 1)`. With no `snapPoints`, resolves to
   * the single `height`.
   */
  expand(): void;
  /**
   * Animates the bottom sheet to its smallest snap point.
   *
   * Equivalent to `snapToIndex(0)`. With no `snapPoints`, resolves to the single `height`.
   */
  collapse(): void;
}
