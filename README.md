# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml)
[![NPM Downloads](https://img.shields.io/npm/d18m/%40lodev09%2Freact-native-true-sheet)](https://www.npmjs.com/package/@lodev09/react-native-true-sheet)

The true native bottom sheet experience for your React Native Apps. 💩

<img alt="React Native True Sheet - IOS" src="docs/static/img/preview.gif" width="300" height="600" /><img alt="React Native True Sheet - Android" src="docs/static/img/preview-2.gif" width="300" height="600" />

## Features

* ⚡ **Powered by Fabric** - Built on React Native's new architecture for maximum performance
* 🎯 **Type-safe** - Full TypeScript support with Codegen-generated native interfaces
* 🚀 **Blazing fast** - Direct C++ communication, no bridge overhead
* 🎨 Implemented in the native realm
* 🪶 Clean, fast, and lightweight
* 🔄 Asynchronus `ref` [methods](https://sheet.lodev09.com/reference/methods#ref-methods)
* ✨ Bonus! [Blur](https://sheet.lodev09.com/reference/types#blurtint) support on IOS 😎

> [!IMPORTANT]
> **Version 3.0+ requires React Native's New Architecture (Fabric)**
> 
> For the old architecture, use version 2.x. See the [Migration Guide (v2 → v3)](https://sheet.lodev09.com/migration) for upgrading.

## Installation

### Prerequisites

- React Native >= 0.71.0
- New Architecture enabled (`RCT_NEW_ARCH_ENABLED=1` for iOS, `newArchEnabled=true` for Android)
- iOS >= 13.4

### Install

```sh
yarn add @lodev09/react-native-true-sheet
```
```sh
npm i @lodev09/react-native-true-sheet
```

### iOS Setup

```sh
cd ios && pod install
```

> **Note:** If you need old architecture support, use version 2.x:
> ```sh
> yarn add @lodev09/react-native-true-sheet@^2.0.0
> ```

## Documentation

- [Example](example)
- [Guides](https://sheet.lodev09.com/category/guides)
- [Reference](https://sheet.lodev09.com/category/reference)
- [Migration Guide (v2 → v3)](https://sheet.lodev09.com/migration) 📖
- [Troubleshooting](https://sheet.lodev09.com/troubleshooting)
- [Testing with Jest](https://sheet.lodev09.com/guides/jest) 🧪

## Usage

```tsx
import { TrueSheet } from "@lodev09/react-native-true-sheet"

export const App = () => {
  const sheet = useRef<TrueSheet>(null)

  // Present the sheet ✅
  const present = async () => {
    await sheet.current?.present()
    console.log('horray! sheet has been presented 💩')
  }

  // Dismiss the sheet ✅
  const dismiss = async () => {
    await sheet.current?.dismiss()
    console.log('Bye bye 👋')
  }

  return (
    <View>
      <Button onPress={present} title="Present" />
      <TrueSheet
        ref={sheet}
        detents={['auto', 1]}
        cornerRadius={24}
      >
        <Button onPress={dismiss} title="Dismiss" />
      </TrueSheet>
    </View>
  )
}
```

## Testing

TrueSheet includes built-in Jest mocks for easy testing. Simply mock the package in your tests:

```tsx
jest.mock('@lodev09/react-native-true-sheet');
```

All methods (`present`, `dismiss`, `resize`) are mocked as Jest functions, allowing you to test your components without native dependencies.

**[📖 Full Testing Guide](https://sheet.lodev09.com/guides/jest)**

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

[MIT](LICENSE)

---

Made with ❤️ by [@lodev09](http://linkedin.com/in/lodev09/)
