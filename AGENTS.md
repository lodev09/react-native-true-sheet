# Agent Instructions

## Rules

1. I will do builds and UI test myself.
2. YOU MUST NOT commit changes yourself until I explicitly tell you to.
3. YOU MUST NOT create summary documents unless you are told to.

## Project Overview

React Native Fabric (New Architecture) bottom sheet library for iOS and Android.

- **Fabric** - No bridge, direct C++ communication
- **Codegen** - Auto-generates native interfaces from TypeScript specs
- **C++ Shared Code** - State and shadow nodes shared between platforms

## Project Structure

```
src/
├── fabric/           # Native component specs (codegen input)
├── specs/            # TurboModule spec
├── reanimated/       # Reanimated integration
├── navigation/       # React Navigation integration
│   └── screen/       # Screen components for navigator
├── TrueSheet.tsx     # Main React component
├── TrueSheetProvider.tsx
└── TrueSheet.types.ts

ios/
├── TrueSheetView.mm           # Host view (Fabric component)
├── TrueSheetViewController.mm # UIViewController for sheet presentation
├── TrueSheetModule.mm         # TurboModule
├── TrueSheet*View.mm          # Container, Content, Header, Footer views
├── TrueSheetComponentDescriptor.h
├── core/                      # GrabberView, BlurView
├── events/                    # Lifecycle, State, Drag, Focus events
└── utils/                     # Layout, Gesture, Window utilities

android/.../truesheet/
├── TrueSheetView.kt           # Host view
├── TrueSheetViewController.kt # Dialog/BottomSheet controller
├── TrueSheetModule.kt         # TurboModule
├── TrueSheet*View.kt          # Container, Content, Header, Footer views
├── TrueSheet*ViewManager.kt   # View managers
├── TrueSheetPackage.kt
├── core/                      # GrabberView, DialogObserver, RNScreensFragmentObserver
├── events/                    # Lifecycle, State, Drag, Focus events
└── utils/                     # ScreenUtils

common/cpp/.../TrueSheetSpec/
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

## Commands

See `package.json` scripts.
