import { Dimensions } from 'react-native';

/**
 * Normalizes height to a number and clamps it
 * so it's not bigger that device screen height
 */
const normalizeHeight = (height?: number | string): number => {
  const DEVICE_SCREEN_HEIGHT = Dimensions.get('window').height;
  let clampedHeight = DEVICE_SCREEN_HEIGHT;
  if (typeof height === 'number')
    clampedHeight =
      height < 0
        ? 0
        : height > DEVICE_SCREEN_HEIGHT
        ? DEVICE_SCREEN_HEIGHT
        : height;
  return clampedHeight;
};

export default normalizeHeight;
