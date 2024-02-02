# React Native Bottom Sheet 💖

![GitHub](https://img.shields.io/github/license/stanleyugwu/react-native-bottom-sheet?style=plastic&label=License&color=%23fea9f8)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/stanleyugwu/react-native-bottom-sheet/ci.yml?color=%23fea9f8&label=Build)
[![runs with expo](https://img.shields.io/badge/Expo-Support-fea9f8.svg?style=platic&logo=EXPO&logoColor=fff)](https://expo.io/)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/stanleyugwu/react-native-bottom-sheet?color=%23fea9f8&label=Code%20Size)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@devvie/bottom-sheet?style=plastic&logo=npm&color=%23fea9f8&label=Bundle%20Size)
![npm downloads](https://img.shields.io/npm/dm/@devvie/bottom-sheet?style=plastic&logo=npm&color=%23fea9f8&label=Downloads)

The smart 😎, tiny 📦, and flexible 🎗 bottom sheet your app craves 🚀

---
👉🏾
<a href="https://www.buymeacoffee.com/devvie"><img style="height: 50px !important;align:center;width: 217px !important" src="https://img.buymeacoffee.com/button-api/?text=Buy me Okpa&emoji=🍘&slug=devvie&button_colour=Fea9f8&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
👈🏾
---

![Preview for Android & iOS](https://i.ibb.co/Y38XsMr/Combined.gif)

#### Web Preview

<p float="left">
  <img src="https://i.ibb.co/sJpsFKD/Web.png" width="400" />
</p>

## ✨Features

- 📦 Very tiny and lightweight
- 0️⃣ No dependency (yeah!, just plug and play 😎)
- ✨ Modal and standard (non-modal) bottom sheet support
- ⌨ Smart & automatic keyboard and orientation handling for iOS & Android
- 💪 Imperative calls
- 📜 Supports FlatList, SectionList, ScrollView & View scrolling interactions
- 📟 Handles layout & orientation changes smartly
- 💯 Compatible with Expo
- 🔧 Flexible config
- 🚀 Supports props live update
- 🎞 Configurable animation
- 🎨 Follows Material Design principles
- 🌐 Runs on the web
- ✅ Written in TypeScript

## 💻 Installation

```sh
npm install @devvie/bottom-sheet
```

or

```sh
yarn add @devvie/bottom-sheet
```

## 📱 Minimal Usage

Opening and closing the bottom sheet is done imperatively, so just pass a `ref` to the bottom sheet and call the `open` or `close` methods via the `ref` instance to open and close the bottom sheet respectively.

##### Examples

#### Typescript

```tsx
import React, { useRef } from 'react';
import BottomSheet, { BottomSheetMethods } from '@devvie/bottom-sheet';
import { Button, View } from 'react-native';

const App = () => {
  const sheetRef = useRef<BottomSheetMethods>(null);
  return (
    <View>
      <Button title="Open" onPress={() => sheetRef.current?.open()} />
      <BottomSheet ref={sheetRef}>
        <Text>
          The smart 😎, tiny 📦, and flexible 🎗 bottom sheet your app craves 🚀
        </Text>
      </BottomSheet>
    </View>
  );
};

export default App;
```

#### Javascript

```tsx
import React, { useRef } from 'react';
import BottomSheet, { BottomSheetMethods } from '@devvie/bottom-sheet';
import { Button, View } from 'react-native';

const App = () => {
  const sheetRef = useRef(null);
  return (
    <View>
      <Button title="Open" onPress={() => sheetRef.current?.open()} />
      <BottomSheet ref={sheetRef}>
        <Text>
          The smart 😎, tiny 📦, and flexible 🎗 bottom sheet your app craves 🚀
        </Text>
      </BottomSheet>
    </View>
  );
};
```

### ⚠ Warning

The bottom sheet component uses and handles pan gestures internally, so to avoid scroll/pan misbehavior with its container, **DO NOT** put it inside a container that supports panning e.g `ScrollView`. You can always put it just next to the `ScrollView` and use `React Fragment` or a `View` to wrap them and everything should be okay.

#### ❌ Don't do this

```jsx
<ScrollView>
  <BottomSheet>...</BottomSheet>
</ScrollView>
```

#### ✅ Do this

```jsx
<>
  <ScrollView>...</ScrollView>

  <BottomSheet>...</BottomSheet>
</>
```

## 🛠 Props

The bottom sheet is highly configurable via props. All props works for both `Android` and `iOS` except those prefixed with `android_` and `ios_`, which works for only `Android` and `iOS` respectively.

| Property                          | Type                                                                                    | Default                | Description                                                                                                                                       | Required |
| --------------------------------- | --------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `android_backdropMaskRippleColor` | `string \| OpaqueColorValue`                                                            |                        | Color of the ripple effect when backdrop mask is pressed (**Android Only**).                                                                      | No       |
| `android_closeOnBackPress`        | `boolean`                                                                               | `true`                 | Determines whether the sheet will close when the device back button is pressed (**Android Only**).                                                | No       |
| `animationType`                   | `'slide' \| 'spring' \| 'fade' \| ANIMATIONS`                                           | `'slide'`              | Animation to use when opening and closing the bottom sheet.                                                                                       | No       |
| `backdropMaskColor`               | `string \| OpaqueColorValue`                                                            | `'#00000052'`          | Color of the scrim or backdrop mask.                                                                                                              | No       |
| `children`                        | `ViewProps['children'] \| React.FunctionComponent<{_animatedHeight: Animated.Value}>`   | `null`                 | Contents of the bottom sheet.                                                                                                                     | Yes      |
| `closeDuration`                   | `number`                                                                                | `500`                  | Duration for sheet closing animation.                                                                                                             | No       |
| `closeOnBackdropPress`            | `boolean`                                                                               | `true`                 | Determines whether the bottom sheet will close when the scrim or backdrop mask is pressed.                                                        | No       |
| `closeOnDragDown`                 | `boolean`                                                                               | `true`                 | Determines whether the bottom sheet will close when dragged down.                                                                                 | No       |
| `containerHeight`                 | `ViewStyle['height']`                                                                   | `DEVICE SCREEN HEIGHT` | Height of the bottom sheet's overall container.                                                                                                   | No       |
| `customBackdropComponent`         | `React.FunctionComponent<{_animatedHeight: Animated.Value}>`                            | `null`                 | Custom component for sheet's scrim or backdrop mask.                                                                                              | No       |
| `customBackdropPosition`          | `"top" \| "behind"`                                                                     | `'behind'`             | Determines the position of the custom scrim or backdrop component. `'behind'` puts it behind the keyboard and `'top'`` puts it atop the keyboard. | No       |
| `customDragHandleComponent`       | `React.FC<{_animatedHeight: Animated.Value}>`                                           |                        | Custom drag handle component to replace the default bottom sheet's drag handle.                                                                   | No       |
| `customEasingFunction`            | `AnimationEasingFunction`                                                               | `ANIMATIONS.SLIDE`     | Custom easing function for driving sheet's animation.                                                                                             | No       |
| `disableBodyPanning`              | `boolean`                                                                               | `false`                | Prevents the bottom sheet from being dragged/panned down on its body.                                                                             | No       |
| `disableDragHandlePanning`        | `boolean`                                                                               | `false`                | Prevents the bottom sheet from being panned down by dragging its drag handle.                                                                     | No       |
| `dragHandleStyle`                 | `ViewStyle`                                                                             |                        | Extra styles to apply to the drag handle.                                                                                                         | No       |
| `height`                          | `number \| string`                                                                      | `'50%'`                | Height of the bottom sheet when opened. Relative to `containerHeight` prop                                                                        | No       |
| `hideDragHandle`                  | `boolean`                                                                               | `false`                | When true, hides the sheet's drag handle.                                                                                                         | No       |
| `modal`                           | `boolean`                                                                               | `true`                 | Determines whether the sheet is a modal. A modal sheet has a scrim or backdrop mask, while a standard (non-modal) sheet doesn't.                  | No       |
| `openDuration`                    | `number`                                                                                | `500`                  | Duration for sheet opening animation.                                                                                                             | No       |
| `style`                           | `Omit<ViewStyle, 'height' \| 'minHeight' \| 'maxHeight' \| 'transform:[{translateY}]'>` |                        | Extra styles to apply to the bottom sheet.                                                                                                        | No       |

## Examples

Flexibility is a focus for this bottom sheet, these few examples shows certain behaviors of the bottom sheet and what can be achieved by tweaking its props.

### 1️⃣ Smart response to keyboard pop ups and orientation changes (_automatic behavior_)

|                                          Android                                           |                                          iOS                                           |
| :----------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: |
| ![Preview for keyboard handling (Android)](https://i.ibb.co/0BfLWYK/Keyboard-Response.gif) | ![Preview for keyboard handling (iOS)](https://i.ibb.co/302ZYBL/Keyboard-Response.gif) |

### 2️⃣ Handles deeply nested list and scroll views interactions (_automatic beavior_)

|                                       Android                                        |                                      iOS                                       |
| :----------------------------------------------------------------------------------: | :----------------------------------------------------------------------------: |
| ![Preview for scroll handling (Android)](https://i.ibb.co/kgfPM3w/Nested-Scroll.gif) | ![Preview for scroll handling (iOS)](https://i.ibb.co/rcrJVLc/Nested-List.gif) |

### 3️⃣ Auto adjusts layout when `height` and `containerHeight` props change (_automatic behavior_)

<p float="left">
  <img src="https://i.ibb.co/3YGXHht/Detect-Height.gif" width="300" />
</p>

### 4️⃣ Extend sheet height when its content is scrolled

<p float="left">
  <img src="https://i.ibb.co/9W5J2t5/Extend-on-scroll.gif" width="300" />
</p>

### 5️⃣ Use as `SnackBar`

<p float="left">
  <img src="https://i.ibb.co/LkMJ255/Snack-Bar.gif" width="300" />
</p>

### 6️⃣ Custom Drag Handle Animation Interpolation

<p float="left">
  <img src="https://i.ibb.co/0yDPQ0W/Drag-Handle-Animation.gif" width="300" />
</p>

### 7️⃣ Custom Scrim/Backdrop Mask

<p float="left">
  <img src="https://i.ibb.co/h9XqBJC/Custom-Scrim.gif" width="300" />
</p>

#### _More Examples and code samples coming soon..._

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

see [LICENSE](LICENSE.md)

---

## Support

<a href="https://www.buymeacoffee.com/devvie" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

</> with 💖 by [Devvie](https://twitter.com/stanleyugwu_) ✌
