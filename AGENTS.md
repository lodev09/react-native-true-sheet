# Agent Instructions

## Rules

1. YOU MUST NOT do builds unless you are told to.
2. YOU MUST NOT commit changes yourself until I explicitly tell you to.
3. YOU MUST NOT create summary documents unless you are told to.
4. YOU MUST NOT add code comments that are obvious.

## Project Overview

React Native Fabric (New Architecture) bottom sheet library for iOS and Android.

- **Fabric** - No bridge, direct C++ communication
- **Codegen** - Auto-generates native interfaces from TypeScript specs
- **C++ Shared Code** - State and shadow nodes shared between platforms

## Project Structure

```
src/
├── fabric/                    # Native component specs (codegen input)
│   ├── TrueSheetViewNativeComponent.ts
│   ├── TrueSheetContainerViewNativeComponent.ts
│   ├── TrueSheetContentViewNativeComponent.ts
│   ├── TrueSheetHeaderViewNativeComponent.ts
│   └── TrueSheetFooterViewNativeComponent.ts
├── specs/                     # TurboModule spec
│   └── NativeTrueSheetModule.ts
├── reanimated/                # Reanimated integration
│   ├── ReanimatedTrueSheet.tsx
│   ├── ReanimatedTrueSheet.web.tsx
│   ├── ReanimatedTrueSheetProvider.tsx
│   ├── useReanimatedPositionChangeHandler.ts
│   ├── useReanimatedPositionChangeHandler.web.ts
│   └── index.ts
├── navigation/                # React Navigation integration
│   ├── createTrueSheetNavigator.tsx
│   ├── TrueSheetRouter.ts
│   ├── TrueSheetView.tsx
│   ├── useTrueSheetNavigation.ts
│   ├── types.ts
│   ├── index.ts
│   └── screen/                # Screen components for navigator
│       ├── TrueSheetScreen.tsx
│       ├── ReanimatedTrueSheetScreen.tsx
│       ├── useSheetScreenState.ts
│       ├── types.ts
│       └── index.ts
├── mocks/                     # Testing mocks
│   ├── navigation.ts
│   ├── reanimated.ts
│   └── index.ts
├── __tests__/                 # Unit tests
│   ├── TrueSheet.test.tsx
│   └── TrueSheetMocks.test.tsx
├── TrueSheet.tsx              # Main React component
├── TrueSheet.web.tsx          # Web implementation
├── TrueSheetProvider.tsx
├── TrueSheetProvider.web.tsx
├── TrueSheet.types.ts
└── index.ts

ios/
├── TrueSheetView.mm/.h              # Host view (Fabric component)
├── TrueSheetViewController.mm/.h    # UIViewController for sheet presentation
├── TrueSheetModule.mm/.h            # TurboModule
├── TrueSheetContainerView.mm/.h     # Container view
├── TrueSheetContentView.mm/.h       # Content view
├── TrueSheetHeaderView.mm/.h        # Header view
├── TrueSheetFooterView.mm/.h        # Footer view
├── TrueSheetComponentDescriptor.h
├── core/
│   ├── TrueSheetGrabberView.mm/.h
│   ├── TrueSheetBlurView.mm/.h
│   └── TrueSheetDetentCalculator.mm/.h
├── events/
│   ├── TrueSheetLifecycleEvents.mm/.h
│   ├── TrueSheetStateEvents.mm/.h
│   ├── TrueSheetDragEvents.mm/.h
│   └── TrueSheetFocusEvents.mm/.h
└── utils/
    ├── BlurUtil.mm/.h
    ├── GestureUtil.mm/.h
    ├── LayoutUtil.mm/.h
    ├── PlatformUtil.h
    └── WindowUtil.mm/.h

android/src/main/java/com/lodev09/truesheet/
├── TrueSheetView.kt                 # Host view
├── TrueSheetViewController.kt       # BottomSheet controller
├── TrueSheetModule.kt               # TurboModule
├── TrueSheetContainerView.kt        # Container view
├── TrueSheetContentView.kt          # Content view
├── TrueSheetHeaderView.kt           # Header view
├── TrueSheetFooterView.kt           # Footer view
├── TrueSheetViewManager.kt          # View manager for TrueSheetView
├── TrueSheetContainerViewManager.kt
├── TrueSheetContentViewManager.kt
├── TrueSheetHeaderViewManager.kt
├── TrueSheetFooterViewManager.kt
├── TrueSheetPackage.kt
├── core/
│   ├── TrueSheetBottomSheetView.kt
│   ├── TrueSheetCoordinatorLayout.kt
│   ├── TrueSheetDetentCalculator.kt
│   ├── TrueSheetStackManager.kt
│   ├── TrueSheetDimView.kt
│   ├── TrueSheetGrabberView.kt
│   ├── TrueSheetKeyboardObserver.kt
│   └── RNScreensFragmentObserver.kt
├── events/
│   ├── TrueSheetDragEvents.kt
│   ├── TrueSheetFocusEvents.kt
│   ├── TrueSheetLifecycleEvents.kt
│   └── TrueSheetStateEvents.kt
└── utils/
    ├── KeyboardUtils.kt
    └── ScreenUtils.kt

common/cpp/react/renderer/components/TrueSheetSpec/
├── TrueSheetViewState.cpp/.h
├── TrueSheetViewShadowNode.cpp/.h
└── TrueSheetViewComponentDescriptor.h
```

## View Hierarchy

```
TrueSheetView (host view - hidden, manages state)
└── TrueSheetContainerView (fills controller's view)
    ├── TrueSheetHeaderView (optional)
    ├── TrueSheetContentView
    └── TrueSheetFooterView (optional)
```

## Common Tasks

### Adding a new prop

1. Add to `src/fabric/TrueSheetViewNativeComponent.ts`
2. Build the app (runs codegen)
3. Implement in `TrueSheetView.mm` (iOS) and `TrueSheetViewManager.kt` (Android)

### Adding a new event

1. Add `DirectEventHandler` to native component spec
2. Create event class in `ios/events/` and `android/.../events/`
3. Emit from native view

### Creating a Pull Request

When creating a PR, use the template from `.github/PULL_REQUEST_TEMPLATE.md`:

1. **Summary** - Describe what the PR does and why
2. **Type of Change** - Select one: Bug fix, New feature, Breaking change, or Documentation update
3. **Test Plan** - Explain how the changes were tested
4. **Screenshots / Videos** - Include if applicable
5. **Checklist** - Mark platforms tested (iOS, Android, Web) and documentation updates

## Commands

See `package.json` scripts.
