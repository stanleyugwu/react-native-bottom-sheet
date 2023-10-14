import * as React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
// @ts-ignore ts can't find module '@devvie/bottom-sheet' on github runner because it's aliased
import BottomSheet, { type BottomSheetMethods } from '@devvie/bottom-sheet';

export default function App() {
  const sheetRef = React.useRef<BottomSheetMethods>(null);

  return (
    <View style={styles.container}>
      <Button title="Open Sheet" onPress={() => sheetRef.current?.open()} />
      <BottomSheet ref={sheetRef}>
        <Text style={styles.text}>
          The 😎smart, 📦tiny, and 🎗flexible bottom sheet your app craves
        </Text>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    padding: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
