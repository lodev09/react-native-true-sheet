# Changelog

## Unreleased

### 🐛 Bug fixes

- **iOS**: Fixed touch passthrough on undimmed sheets when `dismissible` is `false`. ([#548](https://github.com/lodev09/react-native-true-sheet/pull/548) by [@isaacrowntree](https://github.com/isaacrowntree))
- **iOS**: Fixed detent updates being ignored when changed during presentation animation. ([#557](https://github.com/lodev09/react-native-true-sheet/pull/557) by [@lodev09](https://github.com/lodev09))

### 💡 Others

- Documented `auto` detent limitation when `scrollable` is enabled. ([#554](https://github.com/lodev09/react-native-true-sheet/pull/554) by [@lodev09](https://github.com/lodev09))

## 3.9.4

### 🐛 Bug fixes

- **iOS**: Fixed content size changes being dropped during presentation animation when using `initialDetentIndex`. ([#551](https://github.com/lodev09/react-native-true-sheet/pull/551) by [@lodev09](https://github.com/lodev09))

## 3.9.3

### 🐛 Bug fixes

- **iOS**: Fixed incorrect detent calculations on iPad when using Stage Manager or Split View. ([#550](https://github.com/lodev09/react-native-true-sheet/pull/550) by [@lodev09](https://github.com/lodev09))

## 3.9.2

### 🐛 Bug fixes

- **Web**: Fixed content overflow not clipping to rounded corners. ([#546](https://github.com/lodev09/react-native-true-sheet/pull/546) by [@lodev09](https://github.com/lodev09))

## 3.9.1

### 🐛 Bug fixes

- **iOS**: Fixed custom grabber not centering on device rotation. ([#545](https://github.com/lodev09/react-native-true-sheet/pull/545) by [@lodev09](https://github.com/lodev09))
- **Android**: Removed unreliable `TransitionManager` animation from gravity and maxWidth updates. ([#544](https://github.com/lodev09/react-native-true-sheet/pull/544) by [@lodev09](https://github.com/lodev09))

## 3.9.0

### ⚠️ Breaking changes

- `maxHeight` prop has been renamed to `maxContentHeight`. ([#495](https://github.com/lodev09/react-native-true-sheet/pull/495) by [@lodev09](https://github.com/lodev09))

### 🎉 New features

- **iOS**: Enable synchronous state update for RN 0.82+. ([#505](https://github.com/lodev09/react-native-true-sheet/pull/505), [#507](https://github.com/lodev09/react-native-true-sheet/pull/507) by [@lodev09](https://github.com/lodev09))
- **Web**: Added `detached` and `detachedOffset` props for floating card mode. ([#527](https://github.com/lodev09/react-native-true-sheet/pull/527) by [@lodev09](https://github.com/lodev09))
- **Navigation**: Added missing sheet props and fixed event handler spread order. ([#526](https://github.com/lodev09/react-native-true-sheet/pull/526) by [@lodev09](https://github.com/lodev09))
- Added `maxContentWidth` prop to control the maximum width of the sheet content. ([#495](https://github.com/lodev09/react-native-true-sheet/pull/495) by [@lodev09](https://github.com/lodev09))
- Added `anchor` and `anchorOffset` props for side sheet positioning. ([#496](https://github.com/lodev09/react-native-true-sheet/pull/496), [#500](https://github.com/lodev09/react-native-true-sheet/pull/500) by [@lodev09](https://github.com/lodev09))

### 🐛 Bug fixes

- **iOS**: Fixed crash and blank sheet when using Reanimated exiting animations. ([#493](https://github.com/lodev09/react-native-true-sheet/pull/493) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed main thread deadlock when keyboard events fire while sheet is mounted. ([#506](https://github.com/lodev09/react-native-true-sheet/pull/506) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed thread blocking on gesture dismissal when sheet is presented in a stack. ([#511](https://github.com/lodev09/react-native-true-sheet/pull/511) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed FlashList content not rendering while dragging sheet. ([#539](https://github.com/lodev09/react-native-true-sheet/pull/539) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed default background color not respecting dark mode on AppCompat-based apps. ([#501](https://github.com/lodev09/react-native-true-sheet/pull/501) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed keyboard not dismissing when sheet is dragged to a non-keyboard detent position. ([#513](https://github.com/lodev09/react-native-true-sheet/pull/513) by [@lodev09](https://github.com/lodev09))
- **Android**: Added guard and warning to prevent dismiss events for a sheet that is not presented. ([#516](https://github.com/lodev09/react-native-true-sheet/pull/516) by [@codydorsettlynn](https://github.com/codydorsettlynn))
- **Android**: Fixed stale nested scrolling ref blocking drag after dismissing a child sheet with a ScrollView. ([#523](https://github.com/lodev09/react-native-true-sheet/pull/523) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed keyboard detent not committing on scroll, causing sheet to snap back when keyboard hides. ([#525](https://github.com/lodev09/react-native-true-sheet/pull/525) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed children not taking full width and height due to state wrapper assignment order. ([#531](https://github.com/lodev09/react-native-true-sheet/pull/531) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed scroll drag workaround not applying for non-scrollable sheets containing a ScrollView. ([#538](https://github.com/lodev09/react-native-true-sheet/pull/538) by [@lodev09](https://github.com/lodev09))
- **Web**: Fixed default background color not respecting dark mode. ([#502](https://github.com/lodev09/react-native-true-sheet/pull/502) by [@lodev09](https://github.com/lodev09))
- **iOS, Android**: Fixed `auto` detent height staggering on content change due to Yoga layout feedback loop. ([#537](https://github.com/lodev09/react-native-true-sheet/pull/537) by [@lodev09](https://github.com/lodev09))

### 📖 Documentation

- Added dynamic header & footer section to navigation guide. ([#515](https://github.com/lodev09/react-native-true-sheet/pull/515) by [@lodev09](https://github.com/lodev09))

### 💡 Others

- Performance improvements across JS, iOS, and Android. ([#521](https://github.com/lodev09/react-native-true-sheet/pull/521) by [@lodev09](https://github.com/lodev09))
- Use codegen enums for `backgroundBlur`, `anchor`, and `insetAdjustment` props. ([#499](https://github.com/lodev09/react-native-true-sheet/pull/499) by [@lodev09](https://github.com/lodev09))
- Replace `react-native-maps` with `@lugg/maps` in examples. ([#503](https://github.com/lodev09/react-native-true-sheet/pull/503) by [@lodev09](https://github.com/lodev09))

## 3.8.2

### 🐛 Bug fixes

- **Android**: Fixed grabber disappearing when background color changes on stacked sheets. ([#488](https://github.com/lodev09/react-native-true-sheet/pull/488) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed content clipping when sheet content changes dynamically by clearing stale ScrollView reference. ([#482](https://github.com/lodev09/react-native-true-sheet/pull/482) by [@sbs44](https://github.com/sbs44))

## 3.8.1

### 📖 Documentation

- Added web limitation note for `react-native-screens` detection with `useFocusEffect` workaround. ([#480](https://github.com/lodev09/react-native-true-sheet/pull/480) by [@lodev09](https://github.com/lodev09))

### 🐛 Bug fixes

- **Web**: Collapse to lowest detent when not dismissible, matching native behavior. ([#479](https://github.com/lodev09/react-native-true-sheet/pull/479) by [@lodev09](https://github.com/lodev09))
- **Web**: Fixed event firing order and conditions to match native. ([#478](https://github.com/lodev09/react-native-true-sheet/pull/478) by [@lodev09](https://github.com/lodev09))

## 3.8.0

### ⚠️ Breaking changes

- **Dismiss Behavior**: `dismiss()` now dismisses the sheet and all sheets presented on top of it. Previously, calling `dismiss()` on a sheet with children would only either dismiss the current sheet if it had no children or only the child sheets presented on top of it, keeping the current sheet open. Now it performs a cascade dismiss of the entire stack.
Use the `dismissStack()` method if you need the old behavior of dismissing only child sheets.

- **Remove Static Methods on Web**: Static methods (`TrueSheet.present()`, `TrueSheet.dismiss()`, etc.) are no longer supported on web. Use the `useTrueSheet()` hook instead.

### 🎉 New features

- Added `dismissStack()` instance and static method to dismiss only sheets presented on top of the current sheet, keeping the current sheet presented. ([#452](https://github.com/lodev09/react-native-true-sheet/pull/452), [#470](https://github.com/lodev09/react-native-true-sheet/pull/470) by [@obi-owner](https://github.com/obi-owner), [@lodev09](https://github.com/lodev09))
- Added `scrollableOptions` prop with keyboard scroll handling for ScrollViews. ([#442](https://github.com/lodev09/react-native-true-sheet/pull/442) by [@lodev09](https://github.com/lodev09))
- Added bottom inset to ScrollView when `insetAdjustment` is `automatic`. ([#430](https://github.com/lodev09/react-native-true-sheet/pull/430) by [@lodev09](https://github.com/lodev09))

### 🐛 Bug fixes

- **iOS**: Fixed sheet not auto-dismissing when nested stack is removed. ([#472](https://github.com/lodev09/react-native-true-sheet/pull/472) by [@lodev09](https://github.com/lodev09))
- Fixed `pop`, `popTo`, `popToTop` navigation actions not dismissing sheets properly. ([#471](https://github.com/lodev09/react-native-true-sheet/pull/471) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed scroll position jumping when nested sheet is dismissed with inverted FlatList. ([#468](https://github.com/lodev09/react-native-true-sheet/pull/468) by [@lucasklaassen](https://github.com/lucasklaassen))
- **Android**: Fixed present promise not resolving on resize. ([c3495500](https://github.com/lodev09/react-native-true-sheet/commit/c3495500) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed scroll view pinning to respect content view padding/margin. ([#429](https://github.com/lodev09/react-native-true-sheet/pull/429), [#446](https://github.com/lodev09/react-native-true-sheet/pull/446) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed footer not translating back when keyboard hides via ScrollView. ([#424](https://github.com/lodev09/react-native-true-sheet/pull/424) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed `backgroundBlur` and `backgroundColor` not working together. ([#423](https://github.com/lodev09/react-native-true-sheet/pull/423) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed `present()` called from `useEffect` not working due to mount event not firing. ([#421](https://github.com/lodev09/react-native-true-sheet/pull/421) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed sheet content becoming empty after rapidly presenting/dismissing. ([#419](https://github.com/lodev09/react-native-true-sheet/pull/419) by [@lodev09](https://github.com/lodev09))
- Auto re-present sheet when returning from screen dismiss (modal or navigation pop). ([#412](https://github.com/lodev09/react-native-true-sheet/pull/412) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed `onWillDismiss` event timing during drag dismiss. ([#416](https://github.com/lodev09/react-native-true-sheet/pull/416) by [@lodev09](https://github.com/lodev09))

### 📖 Documentation

- Added overlays guide for displaying modals/dialogs on top of sheets. ([#474](https://github.com/lodev09/react-native-true-sheet/pull/474) by [@lodev09](https://github.com/lodev09))
- Added `transformIgnorePatterns` to Jest setup guide. ([#458](https://github.com/lodev09/react-native-true-sheet/pull/458) by [@lodev09](https://github.com/lodev09))
- Added troubleshooting docs for deep-linking modals. ([#2d111c4f](https://github.com/lodev09/react-native-true-sheet/commit/2d111c4f777a3a50e75d0894dbaa5852914f5962) by [@lodev09](https://github.com/lodev09))

### 💡 Others

- Separated `present()` and `resize()` methods; calling `present()` on an already-presented sheet now logs a warning instead of resizing. ([#441](https://github.com/lodev09/react-native-true-sheet/pull/441) by [@lodev09](https://github.com/lodev09))
- **iOS**: Refactored container to use Yoga layout via C++ state for dimensions. ([#457](https://github.com/lodev09/react-native-true-sheet/pull/457) by [@lodev09](https://github.com/lodev09))
- **Android**: Refactored screen event detection to use EventDispatcherListener instead of FragmentLifecycleCallbacks. ([#438](https://github.com/lodev09/react-native-true-sheet/pull/438) by [@lodev09](https://github.com/lodev09))
- **iOS**: Refactored screen unmount detection to use C++ EventDispatcher instead of RNSLifecycleListenerProtocol. ([#410](https://github.com/lodev09/react-native-true-sheet/pull/410) by [@lodev09](https://github.com/lodev09))

## 3.7.3

### 🐛 Bug fixes

- **iOS**: Fixed initial present failing during deeplink navigation. ([#406](https://github.com/lodev09/react-native-true-sheet/pull/406) by [@lodev09](https://github.com/lodev09))
- **iOS**: Use host view window's rootViewController ([7938c69](https://github.com/lodev09/react-native-true-sheet/commit/7938c69) by [@lodev09](https://github.com/lodev09))
- **Android**: Ignore fragment events during cold start initialization ([86fa7bb9](https://github.com/lodev09/react-native-true-sheet/commit/86fa7bb9) by [@lodev09](https://github.com/lodev09))

### 🧪 Tests

- Add `dismissAll` tests ([4615ce64](https://github.com/lodev09/react-native-true-sheet/commit/4615ce64) by [@lodev09](https://github.com/lodev09))

## 3.7.2

### 🎉 New features

- Added `dismissAll` static method. ([#393](https://github.com/lodev09/react-native-true-sheet/pull/393) by [@lodev09](https://github.com/lodev09))
- **Android**: Added grabber tap to expand/dismiss for iOS consistency. ([#404](https://github.com/lodev09/react-native-true-sheet/pull/404) by [@lodev09](https://github.com/lodev09))

### 🐛 Bug fixes

- **Android**: fix(android): cache content heights for dim interpolation during dismiss. ([b297adb3](https://github.com/lodev09/react-native-true-sheet/commit/b297adb3) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed dim interpolation during dismiss when container is unmounted. ([34bd3d40](https://github.com/lodev09/react-native-true-sheet/commit/34bd3d40) by [@lodev09](https://github.com/lodev09))
- **Web**: Fixed `onWillDismiss` not firing when dismissing via backdrop tap. ([#405](https://github.com/lodev09/react-native-true-sheet/pull/405) by [@lodev09](https://github.com/lodev09))
- Fixed sheet not dismissing when presenter screen is popped from navigation. ([#400](https://github.com/lodev09/react-native-true-sheet/pull/400), [#402](https://github.com/lodev09/react-native-true-sheet/pull/402) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed visual glitch when navigating away with active sheet. ([#403](https://github.com/lodev09/react-native-true-sheet/pull/403) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed position tracking for pending detent changes. ([#394](https://github.com/lodev09/react-native-true-sheet/pull/394) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed keyboard and focus handling inside RN Modal. ([#387](https://github.com/lodev09/react-native-true-sheet/pull/387) by [@lodev09](https://github.com/lodev09))

### 🧹Chores

- **Android**: Fix lint warnings. ([68422b0e](https://github.com/lodev09/react-native-true-sheet/commit/68422b0e) by [@lodev09](https://github.com/lodev09))

## 3.7.0

### 🐛 Bug fixes

- **Android**: Fixed keyboard dismiss when presenting at dimmed detent.
- Improved keyboard handling for sheet presentation. ([#379](https://github.com/lodev09/react-native-true-sheet/pull/379) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed `pointerEvents` not being respected in TrueSheetFooterView.
- **Android**: Added `pointerEvents` prop support to view managers.
- **Android**: Added RootNodeKind trait for nested sheet touch handling. ([#375](https://github.com/lodev09/react-native-true-sheet/pull/375) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed coordinator layout remeasure on configuration change.
- **Android**: Fixed footer repositioning when keyboard hides via IME action button.

## 3.6.11

### 🐛 Bug fixes

- **Android**: Fixed eventDispatcher propagation via delegate chain for footer touch handling. ([#372](https://github.com/lodev09/react-native-true-sheet/pull/372) by [@lodev09](https://github.com/lodev09))

## 3.6.10

### 🐛 Bug fixes

- **Android**: Fixed sheet drag when ScrollView cannot scroll. ([#369](https://github.com/lodev09/react-native-true-sheet/pull/369) by [@lodev09](https://github.com/lodev09))

## 3.6.9

### 🐛 Bug fixes

- **Android**: Fixed keyboard handling to only apply for focused views within sheet. ([#365](https://github.com/lodev09/react-native-true-sheet/pull/365) by [@lodev09](https://github.com/lodev09))
- **Android**: Fixed sheet dismissing early when container is unmounted.
- **iOS**: Fixed sheets dismissing properly during navigation and reload.

## 3.6.8

### 🐛 Bug fixes

- **iOS**: Fixed keyboard offset preservation when footer resizes. ([#361](https://github.com/lodev09/react-native-true-sheet/pull/361) by [@lodev09](https://github.com/lodev09))
- **Android**: Optimized findRootContainerView to return first content view.
- **Android**: Fixed TrueSheet rendering above React Native Modal. ([#359](https://github.com/lodev09/react-native-true-sheet/pull/359) by [@lodev09](https://github.com/lodev09))

## 3.6.7

### 🐛 Bug fixes

- Fixed initial present flag reset during recycle.

## 3.6.6

### 🐛 Bug fixes

- **Android**: Fixed setupModalObserver to present lifecycle.

### 💡 Others

- Simplified initial presentation to only trigger on attach to window.

## 3.6.5

### 🐛 Bug fixes

- **Android**: Fixed animated sheet dismiss with keyboard shown.

## 3.6.4

### 🐛 Bug fixes

- **Android**: Fixed initial presentation to wait for window attachment.

## 3.6.3

### 🐛 Bug fixes

- **iOS**: Added compile-time check for iOS 26.1+ APIs.
- **Android**: Added safe value for halfExpandedRatio.

## 3.6.2

### 🐛 Bug fixes

- **iOS**: Fixed blur intensity with backgroundBlur on iOS 26.1+.

## 3.6.1

### 🐛 Bug fixes

- **iOS**: Fixed fallback to view.backgroundColor when UIDesignRequiresCompatibility is true.

## 3.6.0

### 🎉 New features

- Added `elevation` prop for Android and Web. ([#355](https://github.com/lodev09/react-native-true-sheet/pull/355) by [@lodev09](https://github.com/lodev09))

### 🐛 Bug fixes

- **Android**: Fixed keyboard dismiss issue with backdrop. ([#351](https://github.com/lodev09/react-native-true-sheet/pull/351) by [@lodev09](https://github.com/lodev09))
- **iOS**: Fixed native backgroundEffect for blur on iOS 26.1+. ([#350](https://github.com/lodev09/react-native-true-sheet/pull/350) by [@lodev09](https://github.com/lodev09))

## 3.5.8

### 🎉 New features

- Added `headerStyle` and `footerStyle` props.

## 3.5.7

### 🐛 Bug fixes

- **Web**: Fixed pointerEvents on footer container.

## 3.5.6

### 🎉 New features

- **Web**: Added 'none' option to `stackBehavior` prop.
- **Web**: Added shadow for web sheet.

## 3.5.5

### 🐛 Bug fixes

- Fixed pointerEvents on header, footer and host view.

## 3.5.4

### 🐛 Bug fixes

- **iOS**: Fixed initial presentation to defer until view is in window hierarchy.

## 3.5.3

### 🐛 Bug fixes

- **iOS**: Fixed TrueSheetView being included in scroll view pinning traversal.

## 3.5.2

### 🐛 Bug fixes

- **Android**: Fixed sheet showing briefly when navigating within a stack.

## 3.5.1

### 🐛 Bug fixes

- **Android**: Fixed parent stacking after rn-screen dismissed.
- **Android**: Fixed dragging on parent sheet when child is stacked.
- **Android**: Improved dim tap handling for stacked sheets.
- **Android**: Fixed collapse to lowest detent on back press when non-dismissible.
- **Android**: Fixed sheet fade before hiding when rn-screen modal shows.
- **Android**: Fixed content clipping to rounded corners on older API levels.
- **Android**: Fixed collapse to lowest detent on dim tap when non-dismissible.
- **Android**: Fixed bottom sheet centering horizontally on rotation.
- **Android**: Fixed sheet from reshowing when returning from background with rn-screens.
- **Android**: Fixed dismiss animation on back button press.
- **Android**: Fixed footer positioning using onSlide for API < 30.
- **Android**: Fixed grabber hitbox causing touch issues.
- **Android**: Fixed sheet position during non-animated present.
- **Android**: Fixed stacked sheet translation on dismiss.
- **Android**: Fixed translation on initialDetentIndex present.
- **Android**: Fixed initial present on older android versions.
- **Android**: Fixed halfExpandedRatio to be between 0 and 1.

### 💡 Others

- **Android**: Replaced DialogFragment with CoordinatorLayout. ([#344](https://github.com/lodev09/react-native-true-sheet/pull/344) by [@lodev09](https://github.com/lodev09))
- **Android**: Refactored to use BottomSheetDialogFragment. ([#342](https://github.com/lodev09/react-native-true-sheet/pull/342) by [@lodev09](https://github.com/lodev09))

## 3.5.0

### 🎉 New features

- **Android**: Improved transition animations and refactored detent calculations. ([#337](https://github.com/lodev09/react-native-true-sheet/pull/337) by [@lodev09](https://github.com/lodev09))

### 🐛 Bug fixes

- **Android**: Fixed sheet stack restoration when modal dismisses.
- **Android**: Fixed dim view alpha animation when restoring from modal.
- **Android**: Improved keyboard handling and detent restoration.
- **Android**: Fixed target keyboard height for detent calculations.
- **Android**: Fixed window visibility to prevent keyboard non-focus issue.

## 3.4.2

### 🐛 Bug fixes

- **Android**: Fixed sheet from showing when app returns from background.

## 3.4.1

### 🎉 New features

- **iOS**: Added default blur tint for iOS < 26. ([#334](https://github.com/lodev09/react-native-true-sheet/pull/334) by [@lodev09](https://github.com/lodev09))

## 3.4.0

### 🎉 New features

- **Android**: Added custom dim view with smooth interpolation. ([#327](https://github.com/lodev09/react-native-true-sheet/pull/327) by [@lodev09](https://github.com/lodev09))
- **Android**: Added parent translation updates when child sheet size changes.

### 🐛 Bug fixes

- **Android**: Fixed flashing footer during initial present.
- **Android**: Fixed dim view hiding when RN Screen is presented.

### 💡 Others

- Refactored mocks to export per module. ([#329](https://github.com/lodev09/react-native-true-sheet/pull/329) by [@lodev09](https://github.com/lodev09))

## 3.3.5

### 🐛 Bug fixes

- **Android**: Fixed grabber shadow by using bringToFront instead of elevation.

## 3.3.4

### 🎉 New features

- Added adaptive grabber color for light/dark mode. ([#325](https://github.com/lodev09/react-native-true-sheet/pull/325) by [@lodev09](https://github.com/lodev09))

## 3.3.3

### 🐛 Bug fixes

- Fixed key window fallback for cold start and deep link handling. ([#323](https://github.com/lodev09/react-native-true-sheet/pull/323) by [@lodev09](https://github.com/lodev09))

## 3.3.2

### 🐛 Bug fixes

- Fixed batch dismiss behavior for stacked sheets. ([#322](https://github.com/lodev09/react-native-true-sheet/pull/322) by [@lodev09](https://github.com/lodev09))
