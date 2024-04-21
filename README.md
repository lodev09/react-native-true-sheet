# React Native True Sheet

[![CI](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lodev09/react-native-true-sheet/actions/workflows/ci.yml)
![GitHub Release](https://img.shields.io/github/v/release/lodev09/react-native-true-sheet)
![NPM Downloads](https://img.shields.io/npm/dw/%40lodev09%2Freact-native-true-sheet)

The true native bottom sheet 💩

![Preview](preview.gif)

## Features
* ✅ Implemented in the native realm.
* ✅ **_NOT_** your pure JS, (re)animated view (might integrate in the future 👀)
* ✅ Clean, fast, and lightweight.
* ✅ Handles your _Scrolling_ needs, natively.
* ✅ Handles your _Footer_ needs, natively.
* ✅ Handles your _Keyboard_ needs, natively.
* ✅ Asynchronus `ref` [methods](#methods).
* ✅ Bonus! [Blur](#blurtint) support on IOS 😎

## Installation

```sh
yarn add @lodev09/react-native-true-sheet
```

```sh
npm i @lodev09/react-native-true-sheet
```

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
      // ...
    </TrueSheet>
  </View>
)
```

## Troubleshooting

### Presenting a sheet on top of an existing sheet on **IOS**

On IOS, presenting a sheet on top of an existing sheet will cause error.

```console
Attempt to present <TrueSheet.TrueSheetViewController: 0x11829f800> on <UIViewController: 0x10900eb10> (from <RNSScreen: 0x117dbf400>) which is already presenting <TrueSheet.TrueSheetViewController: 0x11a0b9200>
```

There are _two_ ways to resolve this.

1. Dismiss the "parent" sheet first
    ```tsx
    const presentSheet2 = async () => {
      await sheet1.current?.dismiss() // Wait for sheet 1 to dismiss ✅
      await sheet2.current?.present() // Sheet 2 will now present 🎉
    }

    return (
      <>
        <TrueSheet ref={sheet1}>
          <Button onPress={presentSheet2} title="Present Sheet 2" />
          // ...
        </TrueSheet>

        <TrueSheet ref={sheet2}>
          // ...
        </TrueSheet>
      </>
    )
    ```
2. Define the 2nd sheet within the "parent" sheet. IOS handles this automatically by default 😎.
    ```tsx
    const presentSheet2 = async () => {
      await sheet2.current?.present() // Sheet 2 will now present 🎉
    }

    return (
      <TrueSheet ref={sheet1}>
        <Button onPress={presentSheet2} title="Present Sheet 2" />

        // ...

        <TrueSheet ref={sheet2}>
          // ...
        </TrueSheet>
      </TrueSheet>
    )
    ```

### Handling `ScrollView` on **Android**

On Android, `nestedScrollEnabled` needs to be enabled so that scrolling works when the sheet is expanded to its `maxHeight`.

```tsx
<TrueSheet ref={sheet}>
  <ScrollView nestedScrollEnabled>
    // ...
  </ScrollView>
</TrueSheet>
```

### Using `react-native-gesture-handler` on **Android**

On Android, RNGH does not work by default because modals are not located under React Native Root view in native hierarchy. To fix that, components need to be wrapped with `GestureHandlerRootView`.

Example:
```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler'
```
```tsx
return (
  <TrueSheet ref={sheet}>
    <GestureHandlerRootView>
      // ...
    </GestureHandlerRootView>
  </TrueSheet>
)
```

### Integrating `@react-navigation/native` on **IOS**

On IOS, navigating to a [React Navigation](https://reactnavigation.org) screen from within the Sheet can cause issues. To resolve this, dismiss the sheet before navigating!

Example:
```tsx
const sheet = useRef<TrueSheet>(null)

const navigate = async () => {
  await sheet.current?.dismiss() // wait for the sheet to dismiss ✅
  navigation.navigate('SomeScreen') // navigate to the screen 🎉
}

return (
  <TrueSheet ref={sheet}>
    <Button onPress={navigate} title="Navigate to SomeScreen" />
    // ...
  </TrueSheet>
)
```

### Weird layout render

The sheet does not have control over how React Native renders components and may lead to rendering issues. To resolve this, try to minimize the use of `flex=1` in your content styles. Instead, use fixed `height` or employ `flexGrow`, `flexBasis`, etc., to manage your layout requirements.

## v1 Roadmap

- [ ] Inline sheet
- [ ] Test with RN new architecture
- [ ] Reanimated integration(?)

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
