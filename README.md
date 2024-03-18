# react-native-sheetify

Just another bottom sheet modal

## Installation

```sh
npm install react-native-sheetify
```

## Usage

```js
import { SheetifyView } from "react-native-sheetify";

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
