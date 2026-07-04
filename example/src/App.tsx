import * as React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import BottomSheet, { type BottomSheetMethods } from '@devvie/bottom-sheet';

export default function App() {
  const sheetRef = React.useRef<BottomSheetMethods>(null);
  const snapPoints: (string | number)[] = ['50%', '100%'];

  return (
    <View style={styles.container}>
      <Button title="Open Sheet" onPress={() => sheetRef.current?.open()} />

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        onSnap={(index) => {
          console.log('Snapped to index', index);
        }}
        onClose={() => {
          console.log('Closed');
        }}
        closeOnDragDown
        animationType="slide"
        index={0}
      >
        <Text
          style={{
            color: 'indigo',
            fontWeight: '700',
            fontSize: 30,
            textAlign: 'center',
          }}
        >
          💖 Bottom Sheet
        </Text>
        <View style={styles.body}>
          <View
            style={{
              height: 25,
              backgroundColor: 'lightgrey',
              width: '80%',
              borderRadius: 5,
            }}
          />
          <View
            style={{
              height: 25,
              backgroundColor: 'lightgrey',
              width: '40%',
              borderRadius: 5,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View
              style={{
                width: 100,
                height: 100,
                backgroundColor: 'skyblue',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                width: 100,
                height: 100,
                backgroundColor: 'skyblue',
                borderRadius: 7,
              }}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  text: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
