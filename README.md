# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml)
![GitHub Release](https://img.shields.io/github/v/release/lodev09/react-native-true-sheet)
![NPM Downloads](https://img.shields.io/npm/dw/%40lodev09%2Freact-native-true-sheet)

The true native bottom sheet experience for your React Native Apps. 💩

<img alt="React Native True Sheet" src="docs/static/img/preview.gif" width="600px" />

## Features
* ✅ Implemented in the native realm.
* ✅ **_NOT_** your pure JS, (re)animated view (might integrate in the future 👀)
* ✅ Clean, fast, and lightweight.
* ✅ Handles your _Scrolling_ needs, natively.
* ✅ Handles your _Footer_ needs, natively.
* ✅ Handles your _Keyboard_ needs, natively.
* ✅ Asynchronus `ref` [methods](https://sheet.lodev09.com/reference/methods#ref-methods).
* ✅ Bonus! [Blur](https://sheet.lodev09.com/reference/types#blurtint) support on IOS 😎

## Installation

```sh
yarn add @lodev09/react-native-true-sheet
```

```sh
npm i @lodev09/react-native-true-sheet
```

## Documentation

- [Guides](https://sheet.lodev09.com/category/guides)
- [Reference](https://sheet.lodev09.com/category/reference)
- [Example](example)

## Usage

```tsx
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
      <View />
    </TrueSheet>
  </View>
)
```

## v1 Roadmap

- [ ] Inline sheet
- [ ] Test with RN new architecture
- [ ] Reanimated integration(?)

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
