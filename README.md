# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/0bd49973c6c61d85e2be/maintainability)](https://codeclimate.com/github/lodev09/react-native-true-sheet/maintainability)
[![NPM Downloads](https://img.shields.io/npm/d18m/%40lodev09%2Freact-native-true-sheet)](https://www.npmjs.com/package/@lodev09/react-native-true-sheet)

The true native bottom sheet experience for your React Native Apps. 💩

> **⚡ New Architecture (Fabric) Only**  
> Version 3.0+ requires React Native's new architecture. For the old architecture, use version 2.x.  
> [📖 Migration Guide](docs/FABRIC_MIGRATION.md) | [🔧 Implementation Details](docs/FABRIC_IMPLEMENTATION.md)

<img alt="React Native True Sheet - IOS" src="docs/static/img/preview.gif" width="300" height="600" /><img alt="React Native True Sheet - Android" src="docs/static/img/preview-2.gif" width="300" height="600" />

## Features

* ⚡ **Powered by Fabric** - Built on React Native's new architecture for maximum performance
* 🎯 **Type-safe** - Full TypeScript support with Codegen-generated native interfaces
* 🚀 **Blazing fast** - Direct C++ communication, no bridge overhead
* 🎨 Implemented in the native realm
* 🪶 Clean, fast, and lightweight
* 🔄 Asynchronus `ref` [methods](https://sheet.lodev09.com/reference/methods#ref-methods)
* ✨ Bonus! [Blur](https://sheet.lodev09.com/reference/types#blurtint) support on IOS 😎

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
- [Troubleshooting](https://sheet.lodev09.com/troubleshooting)
- [Fabric Migration Guide](docs/FABRIC_MIGRATION.md) 📖
- [Fabric Implementation Details](docs/FABRIC_IMPLEMENTATION.md) 🔧

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

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

[MIT](LICENSE)

---

Made with ❤️ by [@lodev09](http://linkedin.com/in/lodev09/)
