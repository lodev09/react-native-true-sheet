# Agent Instructions

## Rules

1. YOU MUST NOT do builds unless you are told to.
2. YOU MUST NOT commit changes yourself until I explicitly tell you to.
3. YOU MUST NOT create summary documents unless you are told to.
4. YOU MUST NOT add code comments that are obvious.
5. Be extremely concise, sacrifice grammar for concision
6. Read and understand relevant files before proposing code edits

### Over-Engineering Prevention

- Only make changes directly requested or clearly necessary
- Don't add features, refactoring, or "improvements" beyond what's asked
- Don't add docstrings, comments, or type annotations to code you didn't change
- Don't add error handling, fallbacks, or validation for scenarios that can't happen
- Trust internal code and framework guarantees
- Don't create helpers, utilities, or abstractions for one-time operations
- Don't design for hypothetical future requirements

## Project Overview

React Native Fabric (New Architecture) bottom sheet library for iOS and Android.

- **Fabric** - No bridge, direct C++ communication
- **Codegen** - Auto-generates native interfaces from TypeScript specs
- **C++ Shared Code** - State and shadow nodes shared between platforms

## Project Structure

```
src/
├── fabric/         # Native component specs (codegen input)
├── specs/          # TurboModule spec
├── reanimated/     # Reanimated integration
├── navigation/     # React Navigation integration
├── mocks/          # Testing mocks
├── __tests__/      # Unit tests
├── TrueSheet.tsx   # Main React component
└── *.web.tsx       # Web implementations

ios/
├── TrueSheetView.mm           # Host view (Fabric component)
├── TrueSheetViewController.mm # Sheet presentation controller
├── TrueSheetModule.mm         # TurboModule
├── TrueSheet*View.mm          # Container/Content/Header/Footer views
├── core/                      # BlurView, DetentCalculator, GrabberView
├── events/                    # Drag, Focus, Lifecycle, State events
└── utils/                     # Blur, Gesture, Layout, Window utilities

android/.../truesheet/
├── TrueSheetView.kt           # Host view
├── TrueSheetViewController.kt # BottomSheet controller
├── TrueSheetModule.kt         # TurboModule
├── TrueSheet*View.kt          # Container/Content/Header/Footer views
├── TrueSheet*ViewManager.kt   # View managers
├── core/                      # BottomSheetView, CoordinatorLayout, etc.
├── events/                    # Drag, Focus, Lifecycle, State events
└── utils/                     # Keyboard, Screen utilities

common/cpp/.../TrueSheetSpec/  # Shared C++ state and shadow nodes
```

## View Hierarchy

Both platforms: `TrueSheetView` (hidden host) → Controller → `ContainerView` → Header/Content/Footer

- **iOS**: Uses `UISheetPresentationController` for native sheet behavior
- **Android**: Uses `CoordinatorLayout` + `BottomSheetBehavior` with a `DimView` behind the sheet

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
5. **Checklist** - Mark platforms tested (iOS, Android, Web), documentation and changelog updates

#### Changelog

Add entry to `Unpublished` section in `CHANGELOG.md` for user-facing changes:

- `🎉 New features` - New functionality
- `🐛 Bug fixes` - Bug fixes
- `💡 Others` - Refactors, internal changes

Format: `- **Platform**: Description. ([#123](https://github.com/lodev09/react-native-true-sheet/pull/123) by [@username](https://github.com/username))`

When creating release notes, move entries from `Unpublished` to a new version section.
