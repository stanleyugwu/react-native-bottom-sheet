import {View} from 'react-native';
import type {DefaultHandleBarProps} from './types';

/**
 * This is the default handle bar component used when no custom handle bar component is provided
 */
const DefaultHandleBar = ({style, ...otherProps}: DefaultHandleBarProps) => (
  <View
    style={{
      padding: 10,
      width: 80,
      alignSelf: 'center',
    }}
    {...otherProps}>
    <View
      style={[
        {
          height: 5,
          width: 50,
          backgroundColor: '#999',
          alignSelf: 'center',
          borderRadius: 50,
        },
        style,
      ]}
    />
  </View>
);

// this will be used in `convertHeight` for clamping sheet height
export const DEFAULT_HANDLE_BAR_DEFAULT_HEIGHT = 25; // paddingTop (10) + paddingBottom (10) + height (5)

export default DefaultHandleBar;
