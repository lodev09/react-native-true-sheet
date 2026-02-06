# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/checks.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/checks.yml)
[![NPM Downloads](https://img.shields.io/npm/d18m/%40lodev09%2Freact-native-true-sheet)](https://www.npmjs.com/package/@lodev09/react-native-true-sheet)

The true native bottom sheet experience for your React Native Apps. 💩

<img alt="React Native True Sheet - iPad" src="docs/static/img/preview-ipad.gif" width="744" /><br>
<img alt="React Native True Sheet - IOS" src="docs/static/img/preview-ios.gif" width="248" height="500" /><img alt="React Native True Sheet - Android" src="docs/static/img/preview-android.gif" width="248" height="500" /><img alt="React Native True Sheet - Web" src="docs/static/img/preview-web.gif" width="248" height="500" />

## Features

* ⚡ **Powered by Fabric** - Built on React Native's new architecture for maximum performance
* 🚀 **Fully Native** - Implemented in the native realm, zero JS hacks
* ♿ **Accessible** - Native accessibility and screen reader support out of the box
* 🔄 **Flexible API** - Use [imperative methods](https://sheet.lodev09.com/reference/methods#ref-methods) or [lifecycle events](https://sheet.lodev09.com/reference/events)
* 🪟 **Liquid Glass** - [iOS 26+ Liquid Glass](https://sheet.lodev09.com/guides/liquid-glass) support out of the box, featured in [Expo Blog](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)
* 🐎 **Reanimated** - First-class support for [react-native-reanimated](https://sheet.lodev09.com/guides/reanimated)
* 🧭 **React Navigation** - Built-in [sheet navigator](https://sheet.lodev09.com/guides/navigation) for seamless navigation integration
* 🌐 **Web Support** - Full [web support](https://sheet.lodev09.com/guides/web) out of the box

## Installation

> [!IMPORTANT]
> **Version 3.0+ requires React Native's New Architecture (Fabric)**
> For the old architecture, use version 2.x. See the [Migration Guide](https://sheet.lodev09.com/migration) for upgrading.

### Prerequisites

- React Native 0.80+
- New Architecture enabled
- Xcode 26.1+

### Compatibility

| TrueSheet | React Native | Expo SDK |
|-----------|--------------|----------|
| 3.7+      | 0.80+        | 54+      |
| 3.6       | 0.79         | 52-53    |

### Expo

```sh
npx expo install @lodev09/react-native-true-sheet
```

### Bare React Native

```sh
yarn add @lodev09/react-native-true-sheet
cd ios && pod install
```

## Documentation

- [Example](example)
- [Configuration](https://sheet.lodev09.com/reference/configuration)
- [Lifecycle Events](https://sheet.lodev09.com/reference/events)
- [React Navigation](https://sheet.lodev09.com/guides/navigation)
- [Troubleshooting](https://sheet.lodev09.com/troubleshooting)
- [Testing with Jest](https://sheet.lodev09.com/guides/jest)
- [Migrating to v3](https://sheet.lodev09.com/migration)

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
      >
        <Button onPress={dismiss} title="Dismiss" />
      </TrueSheet>
    </View>
  )
}
```

## That map is awesome!

Yes it is! Checkout [`@lugg/maps`](https://github.com/lugg/maps), a universal maps library for React Native that I'm developing at [Lugg](https://lugg.com).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

[MIT](LICENSE)

---

Made with ❤️ by [@lodev09](http://linkedin.com/in/lodev09/)
