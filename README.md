# React Native True Sheet

The real native bottom sheet

## Installation

```sh
yarn add @lodev09/react-native-true-sheet
```

## Usage

```ts
import { SheetView } from "@lodev09/react-native-true-sheet";

// ...

const sheet = useRef<SheetView>(null)

const openSheet = () => {
  sheet.current?.present()
}

return (
  <View>
    <Button onPress={openSheet} title="Open Sheet" />
    <SheetView ref={sheet}>
      // ...
    </SheetView>
  </View>
)
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
