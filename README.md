# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml)
![GitHub Release](https://img.shields.io/github/v/release/lodev09/react-native-true-sheet)
![NPM Downloads](https://img.shields.io/npm/dw/%40lodev09%2Freact-native-true-sheet)

The true native bottom sheet 💩

![Preview](preview.gif)

## Features
* ✅ Implemented in the native realm.
* ✅ **_NOT_** your pure JS, (re)animated view (might integrate in the future 👀)
* ✅ Clean, fast, and lightweight.
* ✅ Handles your _Scrolling_ needs, natively.
* ✅ Handles your _Footer_ needs, natively.
* ✅ Handles your _Keyboard_ needs, natively.
* ✅ Asynchronus `ref` [methods](#methods).
* ✅ Works with Expo by default.
* ✅ Bonus! [Blur](#blurtint) support on iOS 😎

## Installation

```sh
yarn add @lodev09/react-native-true-sheet
```

```sh
npm i @lodev09/react-native-true-sheet
```

## Usage

```ts
import { TrueSheet } from "@lodev09/react-native-true-sheet"

// ...

const sheet = useRef<TrueSheet>(null)

const openSheet = async () => {
  await sheet.current?.present()
  console.log('horray! sheet has been presented 💩')
}

return (
  <View>
    <Button onPress={openSheet} title="Open Sheet" />
    <TrueSheet
      ref={sheet}
      sizes={['auto', 'large']}
      cornerRadius={24}
    >
      // ...
    </TrueSheet>
  </View>
)
```

## Options

Props available for `TrueSheet`.
Extends `ViewProps`

| Prop | Type | Default | Description | 🍎 | 🤖 |
| - | - | - | - | - | - |
| sizes | [`SheetSize[]`](#sheetsize) | `["medium", "large"]` | Array of sizes you want the sheet to support. Maximum of _**3 sizes**_ only! **_collapsed_**, **_half-expanded_**, and **_expanded_**. Example: `size={["auto", "60%", "large"]}`| ✅ | ✅ |
| backgroundColor | `ColorValue` | `"white"` | The sheet's background color. | ✅ | ✅ |
| cornerRadius | `number` | - | the sheet corner radius. | ✅ | ✅ |
| maxHeight | `number` | - | Overrides `"large"` or `"100%"` height. | ✅ | ✅ |
| contentContainerStyle | `StyleProp<ViewStyle>` | - | Optional content container styles. | ✅ | ✅ |
| FooterComponent | `ComponentType<...> \| ReactElement` | - | A component that floats at the bottom of the sheet. Accepts a functional `Component` or `ReactElement`. | ✅ | ✅ |
| dismissible | `boolean` | `true` | If set to `false`, the sheet will prevent interactive dismissal via dragging or clicking outside of it. | ✅ | ✅ |
| grabber | `boolean` | `true` | Shows a grabber (or handle). Native on IOS and styled `View` on Android. | ✅ | ✅ |
| grabberProps | [`TrueSheetGrabberProps`](#truesheetgrabberprops) | - | Overrides the grabber props for android. | | ✅ |
| blurTint | [`BlurTint`](#blurtint) | - | The blur effect style on iOS. Overrides `backgroundColor` if set. Example: `"light"`, `"dark"`, etc. | ✅ | |
| scrollRef | `RefObject<...>` | - | The main scrollable ref that the sheet should handle on iOS. | ✅ | |

## Methods

```ts
const sheet = useRef<TrueSheet>(null)

const resize = () => {
  sheet.current?.resize(1)
}

const dismiss = () => {
  sheet.current?.dismiss()
}

return (
  <View>
    <Button onPress={resize} title="Resize to 80%" />
    <Button onPress={dismiss} title="Dimiss" />
    <TrueSheet sizes={['auto', '80%']} ref={sheet}>
      // ...
    </TrueSheet>
  </View>
)
```

| Name | Parameters | Description |
| - | - | - |
| present | `index: number = 0` | Present the modal sheet. Optionally accepts a size `index`. See `sizes` prop. |
| resize | `index: number` | Resizes the sheet programmatically by `index`. This is an alias of the `present(index)` method. |
| dismiss | - | Dismisses the sheet. |

## Events

```ts
const handleSizeChange = (info: SizeInfo) => {
  console.log(info)
}

return (
  <TrueSheet onSizeChange={handleSizeChange} sizes={['auto', '80%']} ref={sheet}>
    // ...
  </TrueSheet>
)
```

| Name | Parameters | Description |
| - | - | - |
| onPresent | [`SizeInfo`](#sizeinfo) | Called when the sheet has been presented. Comes with the size index and value. |
| onDismiss | - | Called when the sheet has been dismissed. |
| onSizeChange | [`SizeInfo`](#sizeinfo) | Called when the size of the sheet has changed. Either by dragging or presenting programatically. Comes with the size index and value. |

## Types

### `SheetSize`

```ts
<TrueSheet sizes={['auto', '80%', 'large']}>
  // ...
</TrueSheet>
```

| Value | Description | 🍎 | 🤖 |
| - | - | - | - |
| `"auto"` | Auto resize based on content height. | **_16+_** | ✅ |
| `"small"` | Translates to 25% | **_16+_** | ✅ |
| `"medium"` | Translates to 50% | **_15+_** | ✅ |
| `"large"` | Translates to 100% | ✅ | ✅ |
| `number` | Fixed height | **_16+_** | ✅ |
| `${number}%` | Fixed height in % | **_16+_** | ✅ |

> [!NOTE]
> `auto` is not guaranteed to be accurate if your content depends on various rendering logic. Experiment with it and try to keep your content size as fixed as possible.
>
> Alternatively, you can programmatically call [`resize`](#methods) to adjust the sheet size on-the-fly.

### `TrueSheetGrabberProps`

Grabber props to be used for android grabber or handle.

| Prop | Type | Default | Description |
| - | - | - | - |
| visible | `boolean` | `true` | Is grabber visible. |
| color | `ColorValue` | `"rgba(73,69,79,0.4)"` | Grabber color according to M3 specs. |
| height | `number` | `4` | Grabber height according to M3 specs. |
| width | `number` | `32` | Grabber width according to M3 specs. |
| topOffset | `number` | `0` | Grabber top position offset. |

### `BlurTint`

Blur tint that is mapped into native values in iOS.

```ts
<TrueSheet blurTint="dark">
  // ...
</TrueSheet>
```

| Value |
| - |
| `"light"` |
| `"dark"` |
| `"default"` |
| `"extraLight"` |
| `"regular"` |
| `"prominent"` |
| `"systemUltraThinMaterial"` |
| `"systemThinMaterial"` |
| `"systemMaterial"` |
| `"systemThickMaterial"` |
| `"systemChromeMaterial"` |
| `"systemUltraThinMaterialLight"` |
| `"systemThinMaterialLight"` |
| `"systemMaterialLight"` |
| `"systemThickMaterialLight"` |
| `"systemChromeMaterialLight"` |
| `"systemUltraThinMaterialDark"` |
| `"systemThinMaterialDark"` |
| `"systemMaterialDark"` |
| `"systemThickMaterialDark"` |
| `"systemChromeMaterialDark"` |

### `SizeInfo`

`Object` that comes with some events.

```ts
{
  index: 1,
  value: 69
}
```

| Property | Type | Description |
| - | - | - |
| index | `number` | The size index from the provided sizes. See `sizes` prop. |
| value | `number` | The actual height value of the size. |

## Troubleshooting

### Integrating `@react-navigation/native` on iOS

On iOS, navigating to a [React Navigation](https://reactnavigation.org) screen from within the Sheet can cause issues. To resolve this, dismiss the sheet before navigating!

Example:
```ts
const sheet = useRef<TrueSheet>(null)

const navigate = async () => {
  await sheet.current?.dismiss() // wait for the sheet to dismiss ✅
  navigation.navigate('SomeScreen') // navigate to the screen 🎉
}

return (
  <TrueSheet ref={sheet}>
    <Button onPress={navigate} title="Navigate to SomeScreen" />
    // ...
  </TrueSheet>
)
```

### Weird layout render

The sheet does not have control over how React Native renders components and may lead to rendering issues. To resolve this, try to minimize the use of `flex=1` in your content styles. Instead, use fixed `height` or employ `flexGrow`, `flexBasis`, etc., to manage your layout requirements.

## v1 Roadmap

- [ ] Inline sheet
- [ ] Test with RN new architecture
- [ ] Reanimated integration(?)

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
