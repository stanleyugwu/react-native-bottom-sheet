import { Dimensions } from 'react-native';
import { DEFAULT_HANDLE_BAR_DEFAULT_HEIGHT } from '../components/defaultHandleBar';

/**
 * converts string `height` from percentage e.g `'50%'` to pixel unit e.g `320` relative to `containerHeight`,
 * or also clamps it to not exceed `containerHeight` if it's a number.
 *
 * _Note: When `height` > `containerHeight` and `containerHeight` === `SCREEN_HEIGHT`, and handle
 * bar is visible, we want to set `height` to `SCREEN_HEIGHT`
 * but deducting the height of handle bar so it's still visible._
 * @param {string | number} height height in number percentage string
 * @param {number} containerHeight height to convert and clamp relative to
 * @param {boolean} handleBarHidden Used to determine how height clamping is done
 * @returns {number} converted height
 */
const convertHeight = (
  height: string | number,
  containerHeight: number,
  handleBarHidden: boolean
): number => {
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  let _height = height;
  const errorMsg = 'Invalid `height` prop';
  if (typeof height === 'number') {
    // normalise height
    if (height < 0) _height = 0;
    if (height >= containerHeight) {
      if (containerHeight === SCREEN_HEIGHT && !handleBarHidden) {
        _height = containerHeight - DEFAULT_HANDLE_BAR_DEFAULT_HEIGHT;
      } else _height = containerHeight;
    }
  } else if (typeof height === 'string') {
    const lastPercentIdx = height.lastIndexOf('%');

    // perform checks
    if (!height.endsWith('%') || height.length <= 1 || height.length > 4)
      throw errorMsg;
    let parsedHeight = Math.abs(
      parseInt(height.substring(0, lastPercentIdx), 10)
    );
    if (isNaN(parsedHeight)) throw errorMsg;

    // normalise height
    if (parsedHeight >= 100) {
      parsedHeight = 100;
    }

    _height = Math.floor((parsedHeight / 100) * containerHeight);
    if (containerHeight === SCREEN_HEIGHT && !handleBarHidden) {
      _height -= DEFAULT_HANDLE_BAR_DEFAULT_HEIGHT;
    }
  } else throw errorMsg;

  return _height as number;
};

export default convertHeight;
