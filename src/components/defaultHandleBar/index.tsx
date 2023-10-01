import {StyleSheet, View} from 'react-native';
import type {DefaultHandleBarProps} from './index.d';

/**
 * This is the default handle bar component used when no custom handle bar component is provided
 */
const DefaultHandleBar = ({style, ...otherProps}: DefaultHandleBarProps) => (
  <View
    style={{
      padding: 18,
      width: 50,
      alignSelf: 'center',
    }}
    {...otherProps}>
    <View style={[materialStyles.dragHandle, style]} />
  </View>
);

const materialStyles = StyleSheet.create({
  dragHandle: {
    height: 4,
    width: 32,
    backgroundColor: '#49454F',
    opacity: 0.4,
    alignSelf: 'center',
    borderRadius: 50,
  },
});

// this will be used in `convertHeight` for clamping sheet height
export const DEFAULT_HANDLE_BAR_DEFAULT_HEIGHT = 25; // paddingTop (10) + paddingBottom (10) + height (5)

export default DefaultHandleBar;
