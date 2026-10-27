# React Native TrueSheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/checks.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/checks.yml)
[![NPM Downloads](https://img.shields.io/npm/d18m/%40lodev09%2Freact-native-true-sheet)](https://www.npmjs.com/package/@lodev09/react-native-true-sheet)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/lodev09/react-native-true-sheet)

The true native bottom sheet experience for your React Native Apps. 💩

<img alt="React Native True Sheet - iPad" src="docs/public/img/preview-ipad.gif" width="744" /><br>
<img alt="React Native True Sheet - IOS" src="docs/public/img/preview-ios.gif" width="248" height="500" /><img alt="React Native True Sheet - Android" src="docs/public/img/preview-android.gif" width="248" height="500" /><img alt="React Native True Sheet - Web" src="docs/public/img/preview-web.gif" width="248" height="500" />

## Features

* ⚡ **Powered by Fabric** - Built on React Native's new architecture for maximum performance
* 🚀 **Fully Native** - Implemented in the native realm, zero JS hacks
* ♿ **Accessible** - Native accessibility and screen reader support out of the box
* 🔄 **Flexible API** - Use [imperative methods](https://sheet.lodev09.com/reference/methods#component-methods) or [lifecycle events](https://sheet.lodev09.com/reference/events)
* ⌨️ **Keyboard Handling** - Built-in [keyboard handling](https://sheet.lodev09.com/guides/keyboard) with automatic adjustment
* 📐 **Side Sheets** - Native [side sheet](https://sheet.lodev09.com/guides/side-sheets) support for iPad and Android tablets
* 🎨 **Backgrounds** - Colors, blur, glass tints, and [per-detent backgrounds](https://sheet.lodev09.com/guides/backgrounds) on all platforms
* 🍞 **Overlays** - Render toasts and dialogs [above your sheets](https://sheet.lodev09.com/guides/overlays) with `TrueSheetOverlay`
* 📱 **Foldables** - [Rest the sheet on the hinge](https://sheet.lodev09.com/guides/foldables) of a half-folded iPhone (iOS 27.1+)
* 🪟 **Liquid Glass** - [iOS 26+ Liquid Glass](https://sheet.lodev09.com/guides/liquid-glass) support out of the box, featured in [Expo Blog](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)
* 🐎 **Reanimated** - First-class support for [react-native-reanimated](https://sheet.lodev09.com/guides/reanimated)
* 🧭 **React Navigation & Expo Router** - Built-in [sheet navigator](https://sheet.lodev09.com/guides/navigation) and [Expo Router `Sheet` layout](https://sheet.lodev09.com/guides/navigation#expo-router)
* 🌐 **Web Support** - Full [web support](https://sheet.lodev09.com/guides/web) out of the box

## 🎉 What's New in v4

> [!TIP]
> ✨ **v4 rewrites the layout engine** — the sheet now lays out synchronously per detent, so the container is sized to the sheet's visible height and tracks it in realtime while dragging.

* 📏 **Synchronous layout** - Content resizes in the same frame as the sheet, no more lag
* 📐 **`auto` detent with scrollables** - The sheet now sizes itself to a `ScrollView`/`FlatList`'s content height
* 📜 **`scrollableRef`** - Pass a `ScrollView`/`FlatList` ref to wire nested scrolling, keyboard insets, and `auto` detent sizing
* 🦶 **Relative footers** - Footers take up space below the content by default
* 🧭 **Expo Router** - First-class support via the `Sheet` layout from `/navigation/expo-router`
* 🍞 **`TrueSheetOverlay`** - Render toasts, dialogs, and other [overlays above your sheets](https://sheet.lodev09.com/guides/overlays) — no more `FullWindowOverlay`/`Modal` workarounds
* 🔍 **Element inspector** - React Native's dev menu inspector now works inside a presented sheet
* 🎨 **Dim color and opacity** - [Customize the dim](https://sheet.lodev09.com/guides/dimming#dim-color-and-opacity) behind the sheet with `dimColor` and `dimOpacity`
* 📱 **Foldables** - [Rest the sheet on the hinge](https://sheet.lodev09.com/guides/foldables) of a half-folded iPhone with `foldOptions` (iOS 27.1+)
* 🖼️ **Custom backgrounds** - [`background`, `backgroundStyle`, and `detentBackgrounds`](https://sheet.lodev09.com/guides/backgrounds) for exact colors, glass or blur tints, and per-detent transitions
* 🛑 **`onDismissAttempt`** - Confirm unsaved changes when the user tries to dismiss a non-`dismissible` sheet
* 👇 **`dismissThreshold`** - Dismiss on a short drag or fling on Android and Web
* 💤 **`lazy`** - Set to `false` to mount content before presentation
* ↔️ **`placement`** - Replaces `anchor`, with `'leading'` / `'trailing'` following layout direction
* 🆕 **Expo SDK 58** - Supports React Native 0.88

See the [Migration Guide](https://sheet.lodev09.com/migration) to upgrade. **v3 is still supported** for React Native 0.81-0.86 (Expo SDK 54-57) — install `@lodev09/react-native-true-sheet@^3` and see the [v3 docs](https://sheet.lodev09.com/v3/intro).

## Installation

> [!IMPORTANT]
> **Version 3.0+ requires React Native's New Architecture (Fabric)**
> For the old architecture, use version 2.x. See the [v3 Migration Guide](https://sheet.lodev09.com/migration-v3) for upgrading.

### Prerequisites

- React Native 0.82+ (0.81+ on v3)
- New Architecture enabled
- Xcode 26.1+

### Compatibility

| TrueSheet  | React Native | Expo SDK |
|------------|--------------|----------|
| 4.0+       | 0.82+        | 55+      |
| 3.7 - 3.11 | 0.81-0.86    | 54-57    |
| 3.6        | 0.80         | 52-53    |

### Expo

```sh
npx expo install @lodev09/react-native-true-sheet
```

### Bare React Native

```sh
yarn add @lodev09/react-native-true-sheet
cd ios && pod install
```

For React Native 0.81 (Expo SDK 54), install `@lodev09/react-native-true-sheet@^3`.

## Documentation

- [Example](example)
- [Configuration](https://sheet.lodev09.com/reference/configuration)
- [Lifecycle Events](https://sheet.lodev09.com/reference/events)
- [React Navigation & Expo Router](https://sheet.lodev09.com/guides/navigation)
- [Troubleshooting](https://sheet.lodev09.com/troubleshooting)
- [Testing with Jest](https://sheet.lodev09.com/guides/jest)
- [Migrating to v4](https://sheet.lodev09.com/migration)
- [Migrating to v3](https://sheet.lodev09.com/migration-v3)

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

## AI Skills

Skills are reusable AI capabilities that give your AI coding agent knowledge about TrueSheet. With the right skill loaded, your agent can pick the right patterns, avoid common mistakes, and generate correct code without you having to explain the library every time.

```sh
npx skills add lodev09/react-native-true-sheet
```

This will install the **TrueSheet Usage** skill into your project.

## That map is awesome!

Yes it is! Checkout [`@lugg/maps`](https://github.com/lugg/maps), a universal maps library for React Native that I'm developing at [Lugg](https://lugg.com).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

[MIT](LICENSE)

---

Made with ❤️ by [@lodev09](http://linkedin.com/in/lodev09/)
