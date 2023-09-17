import {ANIMATIONS} from '../types';

const DEFAULT_BACKDROP_MASK_COLOR = '#000a';
const DEFAULT_HEIGHT = '50%';
const DEFAULT_ANIMATION = ANIMATIONS.SLIDE;
const DEFAULT_OPEN_ANIMATION_DURATION = 500;
const DEFAULT_CLOSE_ANIMATION_DURATION = 500;

/**
 * Fallback height of content wrapper when it's lower than keyboard height.
 * This is to prevent content wrapper hiding behind the keyboard.
 * Mounting a View of this height atop the kwyboard would give enough space
 * to see/enter text into TextInput
 */
const FALLBACK_CONTENT_WRAPPER_HEIGHT = 120;

export {
  DEFAULT_BACKDROP_MASK_COLOR,
  DEFAULT_HEIGHT,
  DEFAULT_ANIMATION,
  FALLBACK_CONTENT_WRAPPER_HEIGHT,
  DEFAULT_OPEN_ANIMATION_DURATION,
  DEFAULT_CLOSE_ANIMATION_DURATION,
};
