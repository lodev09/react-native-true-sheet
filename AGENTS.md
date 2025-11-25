# Agent Instructions

## Get Started

- See README to know more about this project.
- Get previous commits on this branch to get context.

## Rules

1. I will do builds and UI test myself.
2. YOU MUST NOT commit changes yourself until I explicitly tell you to.
3. YOU MUST NOT create summary documents unless you are told to.

## Project Overview

This is a React Native Fabric (New Architecture) bottom sheet library. It provides native bottom sheet functionality for both iOS and Android.

### Key Technologies

- **React Native New Architecture (Fabric)** - No bridge, direct C++ communication
- **Codegen** - Auto-generates native interfaces from TypeScript specs
- **C++ Shared Code** - State and shadow nodes shared between iOS and Android

## Project Structure

```
src/
├── fabric/                    # Native component specs (codegen input)
│   ├── TrueSheetViewNativeComponent.ts        # Host view spec (has interfaceOnly: true)
│   ├── TrueSheetContainerViewNativeComponent.ts
│   ├── TrueSheetContentViewNativeComponent.ts
│   └── TrueSheetFooterViewNativeComponent.ts
├── TrueSheet.tsx              # Main React component
└── TrueSheet.types.ts         # TypeScript types

ios/
├── TrueSheetView.mm/.h        # Host view (Fabric component)
├── TrueSheetContainerView.mm/.h
├── TrueSheetContentView.mm/.h
├── TrueSheetFooterView.mm/.h
├── TrueSheetViewController.mm/.h  # UIViewController for sheet presentation
└── TrueSheetModule.mm/.h      # TurboModule for imperative methods

android/src/main/java/com/lodev09/truesheet/
├── TrueSheetView.kt           # Host view
├── TrueSheetViewManager.kt    # View manager
├── TrueSheetContainerView.kt
├── TrueSheetViewController.kt # Dialog/BottomSheet controller
└── TrueSheetModule.kt         # TurboModule

common/cpp/react/renderer/components/TrueSheetSpec/
├── TrueSheetViewState.h/.cpp           # Shared state (containerWidth)
├── TrueSheetViewShadowNode.h/.cpp      # Custom shadow node with adjustLayoutWithState()
└── TrueSheetViewComponentDescriptor.h  # Custom descriptor that calls adjustLayoutWithState()
```

## Architecture

### View Hierarchy

```
TrueSheetView (host view - hidden, manages state)
└── TrueSheetContainerView (fills controller's view)
    ├── TrueSheetContentView (sheet content)
    └── TrueSheetFooterView (sticky footer)
```

### Fabric State Management

The host view (`TrueSheetView`) uses Fabric state to pass native dimensions to Yoga for layout:

1. **State files** (`TrueSheetViewState.h/.cpp`) - Hold `containerWidth` from native
2. **Shadow node** (`TrueSheetViewShadowNode`) - `adjustLayoutWithState()` updates Yoga dimensions
3. **Component descriptor** - Calls `adjustLayoutWithState()` on adopt
4. **Native view** - Calls `updateState()` when dimensions change (e.g., rotation)

## Key Concepts

### interfaceOnly: true

In `TrueSheetViewNativeComponent.ts`, `interfaceOnly: true` means:
- Codegen generates interfaces but not the component descriptor
- We provide custom C++ files (state, shadow node, descriptor) in `common/`

### Container View

The container view is a simple pass-through without custom state. It uses codegen-generated descriptor from `ComponentDescriptors.h`.

### iOS: Width-only tracking

iOS only tracks width changes for state updates since height is determined by content. See `_lastContainerWidth` in `TrueSheetView.mm`.

### Android: Width and Height

Android tracks both dimensions in state since the dialog size matters for layout.

## Common Tasks

### Adding a new prop

1. Add to `TrueSheetViewNativeComponent.ts`
2. Run codegen (build the app)
3. Implement in `TrueSheetView.mm` (iOS) and `TrueSheetViewManager.kt` (Android)

### Adding a new event

1. Add `DirectEventHandler` to native component spec
2. Create event class in `ios/events/` and `android/.../events/`
3. Emit from native view

### Modifying state/shadow node

1. Update `TrueSheetViewState.h/.cpp`
2. Update `TrueSheetViewShadowNode.cpp` if layout logic changes
3. Update native views to push new state values

## Commands

See package.json scripts.
