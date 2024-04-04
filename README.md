# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml)
![GitHub Release](https://img.shields.io/github/v/release/lodev09/react-native-true-sheet)
![NPM Downloads](https://img.shields.io/npm/dw/%40lodev09%2Freact-native-true-sheet)

The true native bottom sheet 💩

![Preview](preview.gif)

## Features
* ✅ Implemented on the native realm.
* ✅ **_NOT_** your pure JS, (re)animated View.
* ✅ Clean, fast and lightweight.
* ✅ Handles your Sscrolling needs, easy.
* ✅ Asynchronus `ref` methods.

## Installation

```sh
yarn add @lodev09/react-native-true-sheet
```

## Usage

```ts
import { TrueSheet } from "@lodev09/react-native-true-sheet";

// ...

const sheet = useRef<TrueSheet>(null)

const openSheet = () => {
  sheet.current?.present()
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

Extended from `ViewProps`

| Prop | Type | Default | Description | 🍎 | 🤖 |
| - | - | - | - | - | - |
| sizes | [`SheetSize`](#sheetsize) | `['medium', 'large']` | The sizes you want the Sheet to support. Maximum of _**3 sizes**_ only; "collapsed", "half-expanded" and "expanded". Example: `size={['auto', '60%', 'large']}`| ✅ | ✅ |
| backgroundColor | `ColorValue` | - | Main sheet background color. | ✅ | ✅ |
| cornerRadius | `number` | - | The sheet corner radius. | ✅ | ✅ |
| maxHeight | `number` | - | Overrides `large` or `100%` height. | ✅ | ✅ |
| FooterComponent | `ReactNode` | - | A component that floats at the bottom of the Sheet. | ✅ | ✅ |
| grabber | `boolean` | - | Shows native grabber (or handle) on IOS. | ✅ | |
| blurStyle | [`BlurStyle`](#blurstyle) | - | The blur effect style on iOS. Overrides `backgroundColor` if set. Example: `light`, `dark`, etc. | ✅ | |
| scrollRef | `RefObject<...>` | - | The main scrollable ref that Sheet should handle on IOS. | ✅ | |

## Methods

```ts
const sheet = useRef<TrueSheet>(null)

const open = () => {
  // Presents 80%
  sheet.current?.present(1)
}

const dismiss = () => {
  sheet.current?.dismiss()
}

return (
  <View>
    <Button onPress={open} title="Open" />
    <Button onPress={dismiss} title="Dimiss" />
    <TrueSheet sizes={['auto', '80%']} ref={sheet}>
      // ...
    </TrueSheet>
  </View>
)
```

| Name | Parameters | Description |
| - | - | - |
| present | `index: number = 0` | Present the modal sheet at size index. See `sizes` prop. |
| dismiss | - | Dismisses the Sheet. |

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
| onPresent | - | Called when the Sheet has been presented. Comes with the size index and value. |
| onDismiss | - | Called when the Sheet has been dismissed. |
| onSizeChange | [`SizeInfo`](#sizeinfo) | Called when the size of the sheet has changed. Either by dragging or programatically. |

## Types

### `SheetSize`

```ts
<TrueSheet sizes={['auto', '80%', 'large']}>
  // ...
</TrueSheet>
```

| Value | Description | 🍎 | 🤖 |
| - | - | - | - |
| `medium` | Translates to 50% | ✅ | ✅ |
| `large` | Translates to 100% | ✅ | ✅ |
| `auto` | Auto resize based on content height. | iOS 16+ | ✅ |
| `number` | Fixed height | iOS 16+ | ✅ |
| `${number}%` | Fixed height in % | iOS 16+ | ✅ |
| `small` | Translates to 25% | iOS 16+ | ✅ |

### `BlurStyle`

Blur style mapped to native values in IOS.

| Value |
| - |
| `light` |
| `dark` |
| `default` |
| `extraLight` |
| `regular` |
| `prominent` |
| `systemUltraThinMaterial` |
| `systemThinMaterial` |
| `systemMaterial` |
| `systemThickMaterial` |
| `systemChromeMaterial` |
| `systemUltraThinMaterialLight` |
| `systemThinMaterialLight` |
| `systemMaterialLight` |
| `systemThickMaterialLight` |
| `systemChromeMaterialLight` |
| `systemUltraThinMaterialDark` |
| `systemThinMaterialDark` |
| `systemMaterialDark` |
| `systemThickMaterialDark` |
| `systemChromeMaterialDark` |

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

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
