# Changelog

## Unreleased

### 🎉 New features

- **iOS**: Smoother `onPositionChange`, and `onWillDismiss` now fires only when a drag-to-dismiss is committed. ([#744](https://github.com/lodev09/react-native-true-sheet/pull/744), [#756](https://github.com/lodev09/react-native-true-sheet/pull/756) by [@lodev09](https://github.com/lodev09))
- The `auto` detent now works with plugged scrollables — the sheet sizes to the scrollable's content height. ([#743](https://github.com/lodev09/react-native-true-sheet/pull/743) by [@lodev09](https://github.com/lodev09))
- New `headerOptions` prop with a `position` option — set to `'absolute'` to float the header over the content and exclude it from the `auto` detent height. ([#747](https://github.com/lodev09/react-native-true-sheet/pull/747) by [@lodev09](https://github.com/lodev09))
- The footer now absorbs the bottom safe-area inset as padding when `insetAdjustment` is `automatic`, except while the keyboard is open. ([#749](https://github.com/lodev09/react-native-true-sheet/pull/749), [#750](https://github.com/lodev09/react-native-true-sheet/pull/750) by [@lodev09](https://github.com/lodev09))
- New `scrollableOptions.keyboardOffset` option to adjust the scrollable's keyboard bottom inset. ([#785](https://github.com/lodev09/react-native-true-sheet/pull/785) by [@lodev09](https://github.com/lodev09))

### 🐛 Bug fixes

- **Android**: A stacked parent sheet now follows its child frame-by-frame when the child resizes, and no longer gets stuck at stale detents after a half-expanded settle. ([#797](https://github.com/lodev09/react-native-true-sheet/pull/797) by [@lodev09](https://github.com/lodev09))
- **Android**: The scrollable content now tracks the keyboard frame-by-frame — the focused input rides the keyboard up smoothly, and the scroll position eases back on dismiss instead of snapping. ([#798](https://github.com/lodev09/react-native-true-sheet/pull/798) by [@lodev09](https://github.com/lodev09))
- The keyboard-driven scroll inset now accounts for a floating footer's height. ([#752](https://github.com/lodev09/react-native-true-sheet/pull/752) by [@lodev09](https://github.com/lodev09))
- Auto detents now correctly size explicit-height and deeply nested scrollables. ([#783](https://github.com/lodev09/react-native-true-sheet/pull/783) by [@lodev09](https://github.com/lodev09))

### 💥 Breaking changes

- The footer now lays out relative by default, taking up space below the content — set `footerOptions.position` to `'absolute'` to restore the previous floating behavior. ([#748](https://github.com/lodev09/react-native-true-sheet/pull/748), [#754](https://github.com/lodev09/react-native-true-sheet/pull/754) by [@lodev09](https://github.com/lodev09))
- Content now wraps its children's height by default instead of filling the sheet — pass `flex: 1` via `style` to fill. ([#746](https://github.com/lodev09/react-native-true-sheet/pull/746) by [@lodev09](https://github.com/lodev09))
- The container is now sized to the sheet's visible height per detent and tracks it in realtime while dragging, requiring React Native 0.82+. ([#735](https://github.com/lodev09/react-native-true-sheet/pull/735) by [@lodev09](https://github.com/lodev09))
- The scrollable's bottom safe-area inset now mirrors iOS's `contentInsetAdjustmentBehavior="automatic"` on all platforms — opt out with the new `scrollableOptions.contentInsetAdjustmentBehavior`. ([#784](https://github.com/lodev09/react-native-true-sheet/pull/784), [#796](https://github.com/lodev09/react-native-true-sheet/pull/796) by [@lodev09](https://github.com/lodev09))
- The `scrollable` prop is replaced by `scrollableRef` — pass a ref of your `ScrollView`/`FlatList` to wire nested scrolling, keyboard insets, and `auto` detent sizing. ([#795](https://github.com/lodev09/react-native-true-sheet/pull/795) by [@lodev09](https://github.com/lodev09))
- The sheet navigator is now built on the new `standard-navigation` peer dependency, with first-class Expo Router support via the `Sheet` layout from the new `/navigation/expo-router` entry point. ([#772](https://github.com/lodev09/react-native-true-sheet/pull/772) by [@lodev09](https://github.com/lodev09))

### 💡 Others

- Upgrade the examples to Expo SDK 57 and React Native 0.86. ([#755](https://github.com/lodev09/react-native-true-sheet/pull/755) by [@lodev09](https://github.com/lodev09))
