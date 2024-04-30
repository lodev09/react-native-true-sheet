# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/0bd49973c6c61d85e2be/maintainability)](https://codeclimate.com/github/lodev09/react-native-true-sheet/maintainability)
[![NPM Downloads](https://img.shields.io/npm/d18m/%40lodev09%2Freact-native-true-sheet)](https://www.npmjs.com/package/@lodev09/react-native-true-sheet)

The true native bottom sheet experience for your React Native Apps. 💩

<img alt="React Native True Sheet" src="docs/static/img/preview.gif" width="600px" />

## Features

* Implemented in the native realm.
* Clean, fast, and lightweight.
* Asynchronus `ref` [methods](https://sheet.lodev09.com/reference/methods#ref-methods).
* Bonus! [Blur](https://sheet.lodev09.com/reference/types#blurtint) support on IOS 😎

## Installation

You can install the package by using either `yarn` or `npm`.

```sh
yarn add @lodev09/react-native-true-sheet
```
```sh
npm i @lodev09/react-native-true-sheet
```

Next, run the following to install it on IOS.

```sh
cd ios && pod install
```

## Documentation

- [Guides](https://sheet.lodev09.com/category/guides)
- [Reference](https://sheet.lodev09.com/category/reference)
- [Example](example)

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
        sizes={['auto', 'large']}
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
