import { ANIMATIONS } from '../types.d';

const DEFAULT_BACKDROP_MASK_COLOR = '#00000052';
const DEFAULT_HEIGHT = '50%';
const DEFAULT_ANIMATION = ANIMATIONS.SLIDE;
const DEFAULT_OPEN_ANIMATION_DURATION = 500;
const DEFAULT_CLOSE_ANIMATION_DURATION = 500;

/** Snap index the sheet opens to when `snapPoints` is provided */
const DEFAULT_SNAP_INDEX = 0;

/**
 * Velocity look-ahead (in pixels per `px/ms` of release velocity) used to project
 * where a flick would land, so a fast drag carries the sheet to a farther snap point
 * instead of always settling on the nearest one.
 */
const SNAP_VELOCITY_FACTOR = 50;

/**
 * When the projected release position falls below `lowestSnapPoint * CLOSE_SNAP_RATIO`
 * (and `closeOnDragDown` is enabled) the sheet closes instead of snapping. With a single
 * snap point this reproduces the legacy "close when dragged past 1/3 of its height" rule.
 */
const CLOSE_SNAP_RATIO = 2 / 3;

export {
  DEFAULT_BACKDROP_MASK_COLOR,
  DEFAULT_HEIGHT,
  DEFAULT_ANIMATION,
  DEFAULT_OPEN_ANIMATION_DURATION,
  DEFAULT_CLOSE_ANIMATION_DURATION,
  DEFAULT_SNAP_INDEX,
  SNAP_VELOCITY_FACTOR,
  CLOSE_SNAP_RATIO,
};
