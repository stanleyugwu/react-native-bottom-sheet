import { type ViewStyle } from 'react-native';
import type { SheetStyleProp } from '../components/bottomSheet/types';

type PadProps =
  | 'padding'
  | 'paddingBottom'
  | 'paddingEnd'
  | 'paddingHorizontal'
  | 'paddingLeft'
  | 'paddingRight'
  | 'paddingStart'
  | 'paddingTop'
  | 'paddingVertical';
type Styles = {
  paddingStyles: Pick<ViewStyle, PadProps>;
  otherStyles: Omit<ViewStyle, PadProps>;
};

/**
 * Extracts and separates `padding` styles from
 * other styles from the given `style`
 */
const separatePaddingStyles = (
  style: SheetStyleProp | undefined
): Styles | undefined => {
  if (!style) return;
  const styleKeys = Object.keys(style || {});
  if (!styleKeys.length) return;

  const styles: Styles = {
    paddingStyles: {},
    otherStyles: {},
  };

  for (const key of styleKeys) {
    // @ts-ignore
    styles[key.startsWith('padding') ? 'paddingStyles' : 'otherStyles'][key] =
      // @ts-ignore
      style[key];
  }

  return styles;
};

export default separatePaddingStyles;
