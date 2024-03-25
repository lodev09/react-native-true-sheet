# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml)
![GitHub Release](https://img.shields.io/github/v/release/lodev09/react-native-true-sheet)
![NPM Downloads](https://img.shields.io/npm/dw/%40lodev09%2Freact-native-true-sheet)

The true native bottom sheet.

## Features
* ✅ Implemented on the native realm.
* ✅ **_NOT_** your pure JS, (re)animated View.
* ✅ Clean, fast and lightweight.
* ✅ Handles your Sscrolling needs, easy.

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
    <TrueSheet ref={sheet}>
      // ...
    </TrueSheet>
  </View>
)
```

## Options
> TODO - laters

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
