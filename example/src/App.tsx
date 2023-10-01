import * as React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import BottomSheet, { type BottomSheetMethods } from '@devvie/bottom-sheet';

export default function App() {
  const sheetRef = React.useRef<BottomSheetMethods>(null);

  return (
    <View style={styles.container}>
      <Button title="Open Sheet" onPress={() => sheetRef.current?.open()} />
      <BottomSheet ref={sheetRef}>
        <Text>
          The 😎smart, 📦tiny, and 🎗flexible bottom sheet your app craves
        </Text>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
