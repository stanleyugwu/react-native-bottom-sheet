import convertHeight from './convertHeight';

/**
 * Resolves a `snapPoints` array (a mix of pixel numbers and percentage strings e.g.
 * `[200, '50%', '90%']`) into an ascending, de-duplicated array of pixel heights.
 *
 * Each entry is converted with the same {@link convertHeight} rules used by the `height`
 * prop, so percentages are relative to `containerHeight`, values are clamped to it, and
 * the drag handle's height is deducted from the top-most point when applicable. Invalid
 * entries are skipped (never thrown) so a single bad value can't crash a render.
 *
 * The returned array is sorted ascending, therefore a snap `index` refers to ascending
 * order (`0` = smallest/collapsed, `length - 1` = largest/expanded).
 *
 * @param {(number | string)[]} snapPoints raw snap points (px numbers and/or `'x%'` strings)
 * @param {number} containerHeight height the points are resolved/clamped relative to
 * @param {boolean} handleBarHidden whether the drag handle is hidden (affects top clamping)
 * @returns {number[]} ascending, de-duplicated pixel heights (empty if none are valid)
 */
const resolveSnapPoints = (
  snapPoints: (number | string)[],
  containerHeight: number,
  handleBarHidden: boolean
): number[] => {
  if (!Array.isArray(snapPoints)) return [];

  const resolved: number[] = [];
  for (const point of snapPoints) {
    let height: number;
    try {
      height = convertHeight(point, containerHeight, handleBarHidden);
    } catch {
      // skip invalid entries (e.g. malformed percentage strings) instead of throwing
      continue;
    }
    if (typeof height === 'number' && isFinite(height) && height > 0) {
      resolved.push(height);
    }
  }

  // de-duplicate and sort ascending so `index` maps to smallest -> largest
  return Array.from(new Set(resolved)).sort((a, b) => a - b);
};

export default resolveSnapPoints;
