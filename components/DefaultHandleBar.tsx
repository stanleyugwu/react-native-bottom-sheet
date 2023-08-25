import {View, ViewProps, ViewStyle} from 'react-native';

type DefaultHandleBarProps = ViewProps;

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

export default DefaultHandleBar;
