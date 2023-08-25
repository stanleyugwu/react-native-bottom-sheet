/**
 * converts string `height` from percentage e.g `'50%'` to pixel unit e.g `320` relative to `containerHeight`,
 * or also clamps it to not exceed `containerHeight` if it's a number.
 * @param {string | number} height height in number percentage string
 * @param {number} containerHeight height to convert and clamp relative to
 * @returns {number} converted height
 */
const convertHeight = (
  height: string | number,
  containerHeight: number,
): number => {
  let _height = height;
  const errorMsg = 'Invalid `height` prop';
  if (typeof height == 'number') {
    // normalise height
    if (height < 0) _height = 0;
    if (height > containerHeight) _height = containerHeight;
  } else if (typeof height == 'string') {
    const lastPercentIdx = height.lastIndexOf('%');

    // perform checks
    if (!height.endsWith('%') || height.length <= 1 || height.length > 4)
      throw errorMsg;
    let parsedHeight = Math.abs(parseInt(height.substring(0, lastPercentIdx)));
    if (isNaN(parsedHeight)) throw errorMsg;

    // normalise height
    if (parsedHeight > 100) parsedHeight = 100;

    _height = Math.floor((parsedHeight / 100) * containerHeight);
  } else throw errorMsg;

  return _height as number;
};

export default convertHeight;
