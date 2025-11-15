# Fabric Migration Checklist

A comprehensive checklist for validating the Fabric (New Architecture) migration of react-native-true-sheet.

## Pre-Migration Checklist

### Environment Verification

- [ ] React Native version >= 0.71.0
- [ ] Node.js version >= 16.0.0
- [ ] Xcode version >= 14.0 (for iOS)
- [ ] CocoaPods version >= 1.11.0
- [ ] Android Studio with latest SDK (for Android)

### Project Setup

- [ ] New Architecture enabled in example app
- [ ] `RCT_NEW_ARCH_ENABLED=1` set in iOS (Podfile or env)
- [ ] `newArchEnabled=true` set in Android (gradle.properties)
- [ ] All dependencies updated to support new architecture
- [ ] Cleared all build caches

## Code Implementation Checklist

### TypeScript/JavaScript Files

#### Codegen Specs
- [x] Created `src/TrueSheetViewNativeComponent.ts`
  - [x] Defined all props with correct Codegen types
  - [x] Defined all events with payload structures
  - [x] Used `DirectEventHandler` for events
  - [x] Used `WithDefault` for optional props
  - [x] Set correct platform exclusions
  - [x] Exported as `HostComponent`

- [x] Created `src/NativeTrueSheetModule.ts`
  - [x] Extended `TurboModule` interface
  - [x] Defined all imperative methods
  - [x] Used `TurboModuleRegistry.getEnforcing`
  - [x] Proper return types (Promises)

#### Component Updates
- [x] Updated `src/TrueSheet.tsx`
  - [x] Imported Fabric native component
  - [x] Imported TurboModule
  - [x] Updated ref type to use Fabric component
  - [x] Replaced `findNodeHandle` with `_nativeTag`
  - [x] Updated native module calls
  - [x] Added null safety for all props
  - [x] Maintained backward-compatible API

- [x] Updated `src/TrueSheetModule.ts`
  - [x] Imported TurboModule
  - [x] Removed NativeModules usage
  - [x] Added validation checks
  - [x] Updated error messages

### iOS Native Files

#### Fabric Components
- [x] Created `ios/TrueSheetViewComponentView.h`
  - [x] Extends `RCTViewComponentView`
  - [x] Wrapped in `RCT_NEW_ARCH_ENABLED` guard
  - [x] Declared imperative methods
  - [x] Proper nullability annotations

- [x] Created `ios/TrueSheetViewComponentView.mm`
  - [x] Implemented `ComponentDescriptorProvider`
  - [x] Implemented `updateProps:oldProps:`
  - [x] Implemented `mountChildComponentView:index:`
  - [x] Implemented `unmountChildComponentView:index:`
  - [x] Implemented `layoutSubviews`
  - [x] Implemented `prepareForRecycle`
  - [x] Added delegate pattern implementation
  - [x] Added event emission using EventEmitters
  - [x] Added imperative methods (present/dismiss)
  - [x] Proper memory management
  - [x] Thread-safe operations

#### TurboModule
- [x] Created `ios/TrueSheetModule.h`
  - [x] Conforms to `RCTBridgeModule`
  - [x] Wrapped in `RCT_NEW_ARCH_ENABLED` guard

- [x] Created `ios/TrueSheetModule.mm`
  - [x] Conforms to generated spec protocol
  - [x] Implemented `present:index:resolve:reject:`
  - [x] Implemented `dismiss:resolve:reject:`
  - [x] Added view tag resolution
  - [x] Added type checking
  - [x] Main thread execution
  - [x] Error handling
  - [x] Implemented `getTurboModule` method

#### Component Descriptor
- [x] Created `ios/TrueSheetComponentDescriptor.h`
  - [x] Includes generated headers
  - [x] Declares descriptor class
  - [x] Wrapped in guards

#### Cleanup
- [x] Removed `ios/TrueSheetViewManager.h`
- [x] Removed `ios/TrueSheetViewManager.m`
- [x] Removed `ios/TrueSheetView.h`
- [x] Removed `ios/TrueSheetView.m`
- [x] Kept shared files (TrueSheetViewController, TrueSheetEvent)

### Build Configuration

#### podspec
- [x] Updated `TrueSheet.podspec`
  - [x] Removed conditional new arch logic
  - [x] Always includes Fabric dependencies
  - [x] Uses `install_modules_dependencies`
  - [x] Added React-RCTFabric dependency
  - [x] Added React-Codegen dependency
  - [x] Added RCT-Folly dependency
  - [x] Updated source files pattern
  - [x] Removed Swift-specific config (if applicable)

#### package.json
- [x] Updated `package.json`
  - [x] Added `codegenConfig` section
  - [x] Set correct `name` for specs
  - [x] Set `type: "components"`
  - [x] Set `jsSrcsDir: "src"`
  - [x] Set output directories
  - [x] Set `includesGeneratedCode: true`

#### React Native Config
- [x] Created `react-native.config.js`
  - [x] Configured dependency platforms
  - [x] Set iOS configurations

### Documentation

- [x] Created `docs/FABRIC_MIGRATION.md`
  - [x] Overview of changes
  - [x] Step-by-step migration guide
  - [x] Breaking changes documentation
  - [x] Troubleshooting section
  - [x] Examples

- [x] Created `docs/FABRIC_IMPLEMENTATION.md`
  - [x] Technical architecture details
  - [x] File structure overview
  - [x] Implementation explanations
  - [x] Performance characteristics
  - [x] Code examples

- [x] Created `docs/FABRIC_CHECKLIST.md` (this file)
  - [x] Comprehensive checklist
  - [x] Testing procedures
  - [x] Validation steps

- [x] Updated `README.md`
  - [x] Added new architecture notice
  - [x] Updated installation instructions
  - [x] Added prerequisites
  - [x] Linked to migration docs
  - [x] Updated feature list

## Build Validation Checklist

### iOS Build

- [ ] Clean build directories
  ```bash
  cd ios
  rm -rf build Pods Podfile.lock
  cd ..
  ```

- [ ] Install pods
  ```bash
  cd ios
  pod install
  cd ..
  ```

- [ ] Verify Codegen ran successfully
  - [ ] Check for generated files in `ios/build/generated/ios`
  - [ ] No Codegen errors in pod install output
  - [ ] Generated headers exist

- [ ] Build the example app
  ```bash
  yarn example ios
  ```

- [ ] Verify build succeeds with zero errors
- [ ] Verify no deprecation warnings
- [ ] Verify no Fabric-related warnings
- [ ] Check binary size (should be smaller without Swift runtime)

### Android Build

- [ ] Clean build directories
  ```bash
  cd android
  ./gradlew clean
  cd ..
  ```

- [ ] Build the example app
  ```bash
  yarn example android
  ```

- [ ] Verify build succeeds with zero errors
- [ ] Verify Codegen ran for Android
- [ ] Check for any new architecture warnings

## Runtime Testing Checklist

### Basic Functionality

#### Component Rendering
- [ ] Sheet component renders without errors
- [ ] Sheet is positioned correctly off-screen initially
- [ ] No console warnings on mount
- [ ] Children components render correctly

#### Presentation
- [ ] `present()` method works
- [ ] Sheet animates in smoothly
- [ ] Correct size is applied (first size in array)
- [ ] `onMount` event fires
- [ ] `onPresent` event fires with correct data
- [ ] Promise resolves successfully

#### Dismissal
- [ ] `dismiss()` method works
- [ ] Sheet animates out smoothly
- [ ] `onDismiss` event fires
- [ ] Promise resolves successfully
- [ ] Can be re-presented after dismissal

#### Resizing
- [ ] `resize(index)` method works
- [ ] Sheet resizes to correct size
- [ ] `onSizeChange` event fires
- [ ] Smooth animation during resize
- [ ] Promise resolves successfully

### Props Testing

#### Size Props
- [ ] `sizes={['auto']}` works
- [ ] `sizes={['medium', 'large']}` works
- [ ] `sizes={[300, 600]}` works (fixed pixel heights)
- [ ] `sizes={['50%', '100%']}` works (percentage heights)
- [ ] `sizes={['small', 'medium', 'large']}` works
- [ ] Maximum 3 sizes enforced (warning shown)

#### Behavior Props
- [ ] `dismissible={true}` allows dismissal
- [ ] `dismissible={false}` prevents dismissal
- [ ] `dimmed={true}` shows dimmed background
- [ ] `dimmed={false}` shows transparent background
- [ ] `dimmedIndex` controls when dimming starts
- [ ] `initialIndex` presents correct size on mount
- [ ] `initialIndexAnimated={true}` animates initial presentation
- [ ] `initialIndexAnimated={false}` presents without animation

#### Styling Props
- [ ] `backgroundColor` applies correct color
- [ ] `cornerRadius` applies correct radius (iOS 15+)
- [ ] `blurTint` applies correct blur effect (iOS)
- [ ] `maxHeight` constrains sheet height
- [ ] `grabber={true}` shows native grabber (iOS)
- [ ] `grabber={false}` hides grabber

#### Content Props
- [ ] `FooterComponent` renders at bottom
- [ ] Footer stays visible during scroll
- [ ] `scrollRef` integrates with ScrollView
- [ ] `contentContainerStyle` applies styles
- [ ] Regular `style` prop applies

#### Android-Specific Props
- [ ] `keyboardMode="resize"` works
- [ ] `keyboardMode="pan"` works
- [ ] `edgeToEdge` works
- [ ] `grabberProps` configures Android grabber

### Events Testing

#### Size Events
- [ ] `onPresent` fires with correct `{index, value}`
- [ ] `onSizeChange` fires when size changes
- [ ] `onSizeChange` has correct index and value
- [ ] `onDismiss` fires on dismissal
- [ ] `onMount` fires after initial mount

#### Drag Events (iOS 15+, Android)
- [ ] `onDragBegin` fires when drag starts
- [ ] `onDragChange` fires during drag
- [ ] `onDragEnd` fires when drag ends
- [ ] All drag events have correct data

#### Container Events
- [ ] `onContainerSizeChange` fires on size changes
- [ ] Width and height are correct

### Advanced Features

#### Named Sheets
- [ ] Sheet with `name` prop can be accessed
- [ ] `TrueSheet.present('name')` works
- [ ] `TrueSheet.dismiss('name')` works
- [ ] `TrueSheet.resize('name', index)` works
- [ ] Multiple named sheets work simultaneously
- [ ] Warning shown for duplicate names

#### ScrollView Integration
- [ ] Sheet with ScrollView scrolls correctly
- [ ] `scrollRef` enables native scroll integration
- [ ] Over-scroll bounces correctly
- [ ] Pull-to-dismiss works with scroll
- [ ] Scroll position maintained during resize

#### Keyboard Handling
- [ ] Keyboard appears correctly
- [ ] Footer adjusts for keyboard (iOS)
- [ ] `keyboardMode` prop affects behavior (Android)
- [ ] Keyboard dismisses correctly
- [ ] Input fields work inside sheet

#### Multiple Sheets
- [ ] Can render multiple sheet components
- [ ] Each sheet operates independently
- [ ] Can present multiple sheets (stacked)
- [ ] Dismissing one doesn't affect others
- [ ] Named sheets are unique

### Performance Testing

#### Memory
- [ ] No memory leaks on present/dismiss cycles
- [ ] Memory stable after 10+ presentations
- [ ] Memory released on component unmount
- [ ] No retain cycles detected (iOS Instruments)

#### Rendering
- [ ] Smooth 60fps animation
- [ ] No dropped frames during presentation
- [ ] No dropped frames during dismissal
- [ ] No dropped frames during resize
- [ ] Fast Refresh works correctly
- [ ] Hot Reload works correctly

#### Responsiveness
- [ ] Sheet responds immediately to gestures
- [ ] Drag gesture is smooth
- [ ] No lag on present/dismiss
- [ ] No lag on resize
- [ ] UI remains responsive during animations

### Edge Cases

#### Component Lifecycle
- [ ] Unmounting during presentation doesn't crash
- [ ] Presenting unmounted sheet shows warning
- [ ] Re-mounting works correctly
- [ ] Multiple mounts/unmounts are stable

#### Error Handling
- [ ] Invalid size index shows error
- [ ] Invalid view tag shows error
- [ ] Missing props use defaults
- [ ] Invalid prop values show warnings

#### Platform Differences
- [ ] iOS-only features don't break Android
- [ ] Android-only features don't break iOS
- [ ] Graceful degradation where applicable

## Integration Testing

### Example App
- [ ] Example app builds successfully
- [ ] All examples work correctly
- [ ] No console errors or warnings
- [ ] Documentation matches behavior

### Real-World Scenarios
- [ ] Works in production build (not just dev)
- [ ] Works with React Navigation
- [ ] Works with Redux/Context
- [ ] Works with Forms (TextInput)
- [ ] Works with Complex layouts
- [ ] Works with FlatList/SectionList
- [ ] Works with Animations (Reanimated)
- [ ] Works with Gestures (react-native-gesture-handler)

## Compatibility Testing

### iOS Versions
- [ ] iOS 13.4 (minimum)
- [ ] iOS 14.x
- [ ] iOS 15.x (custom detents)
- [ ] iOS 16.x (additional features)
- [ ] iOS 17.x (latest)

### React Native Versions
- [ ] React Native 0.71.x (minimum)
- [ ] React Native 0.72.x
- [ ] React Native 0.73.x
- [ ] React Native 0.74.x
- [ ] Latest stable version

### Device Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad (different aspect ratio)
- [ ] Simulator
- [ ] Physical device

## Developer Experience

### TypeScript
- [ ] All types are exported
- [ ] No TypeScript errors in library
- [ ] Autocomplete works for props
- [ ] Autocomplete works for methods
- [ ] Event types are correct
- [ ] Ref types are correct

### Error Messages
- [ ] Linking errors are clear
- [ ] Runtime errors are descriptive
- [ ] Warnings are actionable
- [ ] Debug info is helpful

### Documentation
- [ ] API documentation is accurate
- [ ] Examples are working
- [ ] Migration guide is complete
- [ ] Troubleshooting section is helpful

## Pre-Release Checklist

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code is formatted (Prettier)
- [ ] No unused imports
- [ ] No commented-out code
- [ ] No debug logs left

### Testing
- [ ] All automated tests pass
- [ ] Manual testing complete
- [ ] Performance tested
- [ ] Memory tested
- [ ] Integration tested

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Migration guide complete
- [ ] API docs updated
- [ ] Examples updated

### Build
- [ ] Library builds successfully
- [ ] Example app builds successfully
- [ ] No build warnings
- [ ] Correct files in package

### Version Control
- [ ] All changes committed
- [ ] Meaningful commit messages
- [ ] Branch is up to date
- [ ] No merge conflicts

## Post-Release Checklist

### Verification
- [ ] Published to npm successfully
- [ ] Can install from npm
- [ ] Fresh install works
- [ ] Documentation site updated
- [ ] GitHub release created

### Communication
- [ ] Announcement posted
- [ ] Migration guide shared
- [ ] Breaking changes highlighted
- [ ] Community notified

### Monitoring
- [ ] Watch for issues
- [ ] Respond to questions
- [ ] Track adoption
- [ ] Collect feedback

## Notes

### Known Issues
- Document any known issues here
- Include workarounds if available

### Future Improvements
- List potential enhancements
- Note areas for optimization

### Testing Environment
- React Native version: 0.78.0
- iOS version tested: 
- Android version tested:
- Date completed:
- Tested by:

---

**Status**: ✅ Implementation Complete | ⏳ Testing In Progress | 🎉 Ready for Release

Last updated: [Date]