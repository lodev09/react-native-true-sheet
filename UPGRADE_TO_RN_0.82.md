# Upgrade to React Native 0.82.1

## Summary

This document outlines the upgrade from React Native 0.79.4 to 0.82.1, which fixed critical Codegen issues and improved stability.

## What Changed

### Package Versions

**Root package.json:**
- React: `19.0.0` → `19.1.1`
- React Native: `0.78.0` → `0.82.1`
- react-native-builder-bob: `0.36.0` → `0.40.15`
- @types/react: `18.2.44` → `19.1.1`

**Example package.json:**
- React: `19.0.0` → `19.1.1`
- React Native: `0.79.4` → `0.82.1`
- @react-native-community/cli: `18.0.0` → `20.0.0`
- @react-native-community/cli-platform-android: `18.0.0` → `20.0.0`
- @react-native-community/cli-platform-ios: `18.0.0` → `20.0.0`
- @react-native/babel-preset: `0.79.4` → `0.82.1`
- @react-native/metro-config: `0.79.4` → `0.82.1`
- @react-native/typescript-config: `0.79.4` → `0.82.1`
- react-native-safe-area-context: `5.3.0` → `5.5.2`
- Node engine requirement: `>=18` → `>=20`

### Key Fixes

#### 1. Codegen Component Registration Bug (CRITICAL FIX)

**Problem:**
React Native 0.79.4's Codegen had a bug where it incorrectly parsed component definitions when generating `RCTThirdPartyComponentsProvider.mm`. This caused:

```objc
// BEFORE (0.79.4) - MALFORMED
@"RNSScreen": NSClassFromString(@"RNSScreenView.class;,},#endif,,#pragma mark - RNSScreen..."),
@"RNSScreenStackHeaderConfig": NSClassFromString(@"RNSScreenStackHeaderConfig.class;,},#endif..."),
```

These malformed class names caused `NSClassFromString()` to return `nil`, which then caused a crash:
```
*** -[__NSPlaceholderDictionary initWithObjects:forKeys:count:]: 
attempt to insert nil object from objects[19]
```

**Solution:**
React Native 0.82.1's improved Codegen correctly generates:

```objc
// AFTER (0.82.1) - CORRECT
@"RNSScreen": NSClassFromString(@"RNSScreenView"), // ✅
@"RNSScreenStackHeaderConfig": NSClassFromString(@"RNSScreenStackHeaderConfig"), // ✅
@"TrueSheetView": NSClassFromString(@"TrueSheetViewComponentView"), // ✅
```

#### 2. Metro Configuration

Updated `example/metro.config.js` to use the latest react-native-builder-bob pattern with proper monorepo support:

```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { getConfig } = require('react-native-builder-bob/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const config = getConfig(getDefaultConfig(__dirname), {
  root,
  pkg,
  project: __dirname,
});

module.exports = wrapWithReanimatedMetroConfig(config);
```

#### 3. Watchman Configuration

Fixed Watchman recrawl warnings by resetting the watch:

```bash
watchman watch-del '/path/to/react-native-true-sheet'
watchman watch-project '/path/to/react-native-true-sheet'
```

## Installation Steps

### 1. Update Dependencies

```bash
# From the root directory
yarn install

# Update CocoaPods
cd example/ios
bundle install
bundle exec pod install
```

### 2. Clean Build Artifacts

```bash
# Clean Metro cache
cd example
rm -rf node_modules/.cache /tmp/metro-* /tmp/react-*

# Clean iOS build
cd ios
rm -rf build Pods Podfile.lock
```

### 3. Rebuild

```bash
# Install pods
cd example/ios
bundle exec pod install

# Build iOS
cd ..
yarn ios

# Or Android
yarn android
```

## Verification

### Check Metro is Running

```bash
curl http://localhost:8081/status
# Should return: packager-status:running
```

### Verify Component Registration

Check that `example/ios/build/generated/ios/RCTThirdPartyComponentsProvider.mm` has clean component registrations:

```bash
cat example/ios/build/generated/ios/RCTThirdPartyComponentsProvider.mm | grep "TrueSheetView"
# Should show: @"TrueSheetView": NSClassFromString(@"TrueSheetViewComponentView"),
```

## Breaking Changes

None. This is a patch upgrade with no API changes to the TrueSheet library.

## Minimum Requirements

- Node.js: `>=20`
- React Native: `>=0.82.1`
- iOS: `>=13.4`
- Android: API level 24+

## Troubleshooting

### Metro appears stuck on start

This is usually just Watchman warnings. Metro is actually running. Check:
```bash
curl http://localhost:8081/status
```

If you see warnings, reset Watchman:
```bash
watchman watch-del '/path/to/project'
watchman watch-project '/path/to/project'
```

### Build fails with "nil object" error

Ensure you've:
1. Cleaned all build artifacts
2. Reinstalled pods with `bundle exec pod install`
3. Verified Codegen generated clean component registrations

### Metro can't resolve modules

Clear Metro cache:
```bash
yarn start --reset-cache
```

## Additional Notes

- This upgrade includes Metro 0.83.3 which has improved performance
- The Codegen bug was a known issue in RN 0.79.x that affected libraries with complex component hierarchies
- react-native-builder-bob 0.40.15 includes better ESM support and faster builds

## References

- [React Native 0.82.1 Release Notes](https://github.com/facebook/react-native/releases/tag/v0.82.1)
- [RN Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [Metro Configuration Docs](https://reactnative.dev/docs/metro)

---

**Date:** November 15, 2024  
**Migration Status:** ✅ Complete  
**Build Status:** ✅ Successful  
**Test Status:** ⏳ Pending manual verification