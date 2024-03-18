# React Native Sheetify

Just another bottom sheet... but less shitty 💩

## Installation

```sh
yarn add @lodev09/react-native-sheetify
```

## Usage

```js
import { SheetifyView } from "@lodev09/react-native-sheetify";

// ...

const sheetify = useRef<SheetifyView>(null)

const openSheet = () => {
  sheetify.current?.present()
}

return (
  <View>
    <Button onPress={openSheet} title="Open Sheet" />
    <SheetifyView ref={sheetify}>
      <ScrollView>
        <View />
      </ScrollView>
    </SheetifyView>
  </View>
)
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
