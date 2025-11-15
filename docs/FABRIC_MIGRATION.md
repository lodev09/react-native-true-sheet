# Fabric (New Architecture) Migration Guide

This document outlines the migration of `@lodev09/react-native-true-sheet` to React Native's new architecture (Fabric).

## Overview

As of version 3.0.0, react-native-true-sheet **only supports the new architecture (Fabric)**. The old Paper architecture is no longer supported.

## What Changed?

### Architecture Changes

1. **Codegen Integration**: The library now uses React Native's Codegen to generate type-safe native interfaces
2. **Fabric Components**: Replaced `RCTViewManager` with Fabric `ComponentView`
3. **Turbo Modules**: Native module methods now use TurboModule infrastructure
4. **Type Safety**: All props and events are now type-safe at the native level

### API Changes

The JavaScript API remains **100% unchanged**. All existing code will work without modifications:

```tsx
// This still works exactly the same way
<TrueSheet
  ref={sheet}
  sizes={['auto', 'large']}
  onPresent={(e) => console.log(e.nativeEvent)}
>
  <Text>Your Content</Text>
</TrueSheet>
```

## Migration Steps

### 1. Prerequisites

Ensure your React Native app is using the new architecture:

- React Native >= 0.71.0
- New Architecture enabled in your app

### 2. Update Dependencies

```bash
yarn add @lodev09/react-native-true-sheet@^3.0.0
# or
npm install @lodev09/react-native-true-sheet@^3.0.0
```

### 3. iOS Setup

```bash
cd ios
pod install
cd ..
```

The library will automatically configure Codegen. No additional setup required.

### 4. Enable New Architecture (if not already enabled)

#### iOS

In your `ios/Podfile`:

```ruby
# Enable new architecture
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

Then run:

```bash
cd ios
bundle exec pod install
cd ..
```

#### Android

In your `android/gradle.properties`:

```properties
newArchEnabled=true
```

### 5. Rebuild Your App

```bash
# iOS
yarn ios
# or with specific device
yarn ios --device "iPhone 15"

# Android
yarn android
```

## Technical Details

### Codegen Specs

The library now uses TypeScript specs that Codegen processes to generate native code:

- **Component Spec**: `src/TrueSheetViewNativeComponent.ts` - Defines the native view component
- **Module Spec**: `src/NativeTrueSheetModule.ts` - Defines the native module for imperative methods

### Native Implementation

#### iOS (Objective-C++)

- **ComponentView**: `TrueSheetViewComponentView.mm` - Fabric component implementation
- **TurboModule**: `TrueSheetModule.mm` - Native module for imperative commands
- **Props**: Handled through Codegen-generated Props structs
- **Events**: Handled through Codegen-generated EventEmitters

### Benefits of Fabric

1. **Type Safety**: Props and events are type-checked at compile time
2. **Better Performance**: Direct C++ communication between JS and native
3. **Synchronous Access**: Some operations can be synchronous when needed
4. **Future-Proof**: Aligned with React Native's future direction

## Breaking Changes

### Removed Paper Architecture Support

If you're still using the old architecture (Paper), you **must** migrate to Fabric or stay on version 2.x:

```bash
# Stay on 2.x if you need old architecture
yarn add @lodev09/react-native-true-sheet@^2.0.0
```

### Minimum Requirements

- React Native >= 0.71.0
- iOS >= 13.4
- Android API >= 21
- New Architecture enabled

## Troubleshooting

### Build Errors After Upgrade

1. **Clean build folders**:
   ```bash
   # iOS
   cd ios
   rm -rf build Pods Podfile.lock
   pod install
   cd ..
   
   # Android
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Clear Metro cache**:
   ```bash
   yarn start --reset-cache
   ```

3. **Verify new architecture is enabled**:
   - Check `RCT_NEW_ARCH_ENABLED=1` in iOS
   - Check `newArchEnabled=true` in Android

### Runtime Errors

**Error**: "TrueSheet doesn't seem to be linked"

**Solution**: Ensure new architecture is enabled and you've rebuilt the app after installing.

**Error**: "Could not get native view tag"

**Solution**: This is likely a timing issue. Ensure the component has mounted before calling imperative methods.

### TypeScript Errors

If you see TypeScript errors related to the native component:

```bash
# Regenerate TypeScript definitions
yarn prepare
```

## Performance Improvements

Fabric provides several performance benefits:

1. **Faster Mount/Unmount**: Components mount and unmount more efficiently
2. **Better Memory Usage**: Improved memory management with C++ objects
3. **Reduced Bridge Overhead**: Direct communication reduces serialization overhead
4. **Concurrent Rendering**: Better support for concurrent features

## Migration Checklist

- [ ] React Native version >= 0.71.0
- [ ] New Architecture enabled in your app
- [ ] Updated to `@lodev09/react-native-true-sheet@^3.0.0`
- [ ] Ran `pod install` (iOS)
- [ ] Cleaned and rebuilt app
- [ ] Tested all sheet functionality
- [ ] Verified imperative methods (present/dismiss/resize)
- [ ] Tested all event handlers
- [ ] Tested on both iOS and Android

## Need Help?

If you encounter issues during migration:

1. Check the [troubleshooting section](#troubleshooting) above
2. Search existing [GitHub Issues](https://github.com/lodev09/react-native-true-sheet/issues)
3. Create a new issue with:
   - React Native version
   - Platform (iOS/Android)
   - Error messages
   - Minimal reproduction code

## Resources

- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [Fabric Components](https://reactnative.dev/docs/the-new-architecture/pillars-fabric-components)
- [TurboModules](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [Codegen](https://reactnative.dev/docs/the-new-architecture/pillars-codegen)

## Contributing

Found an issue with the Fabric implementation? We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md).

---

**Note**: This migration only affects the native implementation. The JavaScript API remains unchanged, ensuring zero breaking changes for your application code.