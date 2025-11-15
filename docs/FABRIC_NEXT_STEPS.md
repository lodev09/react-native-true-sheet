# Fabric Migration - Next Steps & Action Items

This document outlines the remaining tasks and next steps to complete the Fabric migration for `@lodev09/react-native-true-sheet`.

## Current Status

### ✅ Completed

1. **Codegen Specifications**
   - ✅ Created `TrueSheetViewNativeComponent.ts` with all props and events
   - ✅ Created `NativeTrueSheetModule.ts` for TurboModule spec
   - ✅ Configured `codegenConfig` in package.json

2. **JavaScript/TypeScript Layer**
   - ✅ Updated `TrueSheet.tsx` to use Fabric components
   - ✅ Updated `TrueSheetModule.ts` to use TurboModule
   - ✅ Maintained 100% API compatibility

3. **iOS Native Implementation**
   - ✅ Created `TrueSheetViewComponentView.h/.mm` (Fabric component)
   - ✅ Created `TrueSheetModule.h/.mm` (TurboModule)
   - ✅ Created `TrueSheetComponentDescriptor.h`
   - ✅ Removed old Paper architecture files

4. **Build Configuration**
   - ✅ Updated `TrueSheet.podspec` for Fabric-only support
   - ✅ Created `react-native.config.js`
   - ✅ Added proper dependencies

5. **Documentation**
   - ✅ Created comprehensive migration guide
   - ✅ Created implementation details document
   - ✅ Created testing checklist
   - ✅ Updated README with new architecture notice

### ⏳ Pending

The following items require manual testing and verification:

## Immediate Next Steps

### 1. Fix Compilation Issues

**Priority**: 🔴 Critical

The native iOS code needs to be verified and potentially fixed:

#### a. Missing Helper Functions

The ComponentView implementation references a helper function that may need to be created:

```objc++
UIViewController *rootViewController = RCTPresentedViewController();
```

**Action**: 
- Check if `RCTPresentedViewController()` is available in Fabric
- If not, implement it or use alternative approach:
  ```objc++
  UIViewController *rootViewController = RCTSharedApplication().delegate.window.rootViewController;
  ```

#### b. Verify Generated Headers

**Action**:
- Run Codegen to ensure headers are generated
- Verify these headers exist:
  - `ComponentDescriptors.h`
  - `EventEmitters.h`
  - `Props.h`
  - `RCTComponentViewHelpers.h`

**Command**:
```bash
cd example/ios
pod install
# Check for generated files in build/generated/ios/
```

#### c. Fix Import Paths

The implementation uses:
```objc++
#import <react/renderer/components/TrueSheetViewSpec/...>
```

**Action**:
- Verify the correct import path after Codegen runs
- May need to adjust based on actual generated structure

### 2. Build the Example App

**Priority**: 🔴 Critical

**Actions**:

1. **Update Example App Dependencies**
   ```bash
   cd example
   yarn install
   ```

2. **Enable New Architecture in Example**
   
   Edit `example/ios/Podfile`:
   ```ruby
   ENV['RCT_NEW_ARCH_ENABLED'] = '1'
   ```

3. **Install Pods**
   ```bash
   cd example/ios
   bundle install
   pod install
   cd ../..
   ```

4. **Build iOS**
   ```bash
   yarn example ios
   ```

5. **Fix Any Build Errors**
   - Document all errors encountered
   - Fix Objective-C++ syntax issues
   - Resolve missing imports
   - Fix type mismatches

### 3. Fix Specific Code Issues

**Priority**: 🟠 High

#### a. Props Handling

Review the `updateProps` implementation for:

- Correct type conversions (C++ to Objective-C)
- Proper handling of optional values
- Background color conversion issue:
  ```objc++
  // Current (may be wrong):
  if (newViewProps.background) {
      UIColor *color = RCTUIColorFromSharedColor(newViewProps.backgroundColor);
  }
  
  // Should be:
  if (newViewProps.background) {
      UIColor *color = RCTUIColorFromSharedColor(newViewProps.background);
  }
  ```

#### b. Module Registration

Ensure the TurboModule is properly registered:

```objc++
// In TrueSheetModule.mm
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTrueSheetModuleSpecJSI>(params);
}
```

**Action**: Verify the correct spec class name after Codegen runs.

#### c. Event Emission

Verify event structures match the Codegen spec:

```objc++
TrueSheetViewEventEmitter::OnPresent event;
event.index = static_cast<int>(index);
event.value = 0.0; // Get actual value from controller
```

### 4. Test Core Functionality

**Priority**: 🟠 High

Once the app builds, test these features in order:

#### Phase 1: Basic Functionality
- [ ] App launches without crash
- [ ] Sheet component renders
- [ ] Console shows no errors
- [ ] `present()` method works
- [ ] `dismiss()` method works

#### Phase 2: Props
- [ ] Different sizes work
- [ ] Background color applies
- [ ] Corner radius applies (iOS 15+)
- [ ] Grabber shows/hides correctly
- [ ] Dismissible prop works

#### Phase 3: Events
- [ ] `onMount` fires
- [ ] `onPresent` fires with correct data
- [ ] `onDismiss` fires
- [ ] `onSizeChange` fires
- [ ] Drag events fire (iOS 15+)

#### Phase 4: Advanced
- [ ] Named sheets work
- [ ] Multiple sheets work
- [ ] ScrollView integration works
- [ ] Footer component works
- [ ] Keyboard handling works

### 5. Android Implementation

**Priority**: 🟡 Medium (after iOS works)

The current implementation only covers iOS. For a complete Fabric migration:

**Actions**:

1. **Create Android Fabric Component**
   - `android/src/main/java/com/truesheet/TrueSheetViewManager.kt`
   - Update to use Fabric ViewManager
   - Implement ComponentDescriptor

2. **Update Codegen Spec**
   - Remove `excludedPlatforms: ['android']`
   - Add Android-specific props if needed

3. **Test Android Build**
   - Enable new architecture
   - Build and test

### 6. Documentation Updates

**Priority**: 🟡 Medium

Once testing is complete:

1. **Update Migration Guide**
   - Add actual error messages encountered
   - Add solutions that worked
   - Include screenshots

2. **Update Troubleshooting**
   - Document common issues
   - Add working solutions
   - Include code examples

3. **Create Video Tutorial**
   - Screen recording of migration
   - Step-by-step walkthrough
   - Upload to YouTube/docs site

### 7. Version & Release

**Priority**: 🟢 Low (final step)

**Actions**:

1. **Update Version**
   ```bash
   # Major version bump due to breaking changes
   yarn version --major  # 2.x.x -> 3.0.0
   ```

2. **Update CHANGELOG**
   ```markdown
   # [3.0.0] - 2024-XX-XX
   
   ## BREAKING CHANGES
   - Requires React Native new architecture (Fabric)
   - Minimum React Native version: 0.71.0
   - Removed Paper architecture support
   
   ## Added
   - Fabric (new architecture) support
   - TurboModule implementation
   - Codegen type safety
   - Better performance
   
   ## Migration
   See [FABRIC_MIGRATION.md](docs/FABRIC_MIGRATION.md)
   ```

3. **Create Git Tags**
   ```bash
   git tag -a v3.0.0 -m "Release 3.0.0 - Fabric Migration"
   git push origin v3.0.0
   ```

4. **Publish to npm**
   ```bash
   yarn publish --access public
   ```

5. **Create GitHub Release**
   - Use tag v3.0.0
   - Copy changelog
   - Highlight breaking changes
   - Link to migration guide

## Potential Issues & Solutions

### Issue 1: Codegen Not Running

**Symptoms**:
- Missing generated headers
- "file not found" errors

**Solutions**:
1. Check `codegenConfig` in package.json
2. Clear build folder and retry
3. Manually run codegen:
   ```bash
   cd example
   yarn react-native codegen
   ```

### Issue 2: TurboModule Not Found

**Symptoms**:
- "NativeTrueSheetModule is undefined"
- Runtime error on import

**Solutions**:
1. Verify new architecture is enabled
2. Check module exports in native code
3. Ensure TurboModuleRegistry registration
4. Rebuild app completely

### Issue 3: Props Not Updating

**Symptoms**:
- Changes to props don't reflect
- Sheet doesn't respond to prop updates

**Solutions**:
1. Check `updateProps` implementation
2. Verify prop comparison (oldProps vs newProps)
3. Ensure controller is updated
4. Check for typos in prop names

### Issue 4: Events Not Firing

**Symptoms**:
- Event handlers never called
- No data in event payload

**Solutions**:
1. Verify EventEmitter is not null
2. Check event structure matches spec
3. Ensure events are defined in Codegen spec
4. Verify `DirectEventHandler` is used

### Issue 5: Memory Leaks

**Symptoms**:
- Memory grows on present/dismiss
- App slows down over time

**Solutions**:
1. Check for retain cycles
2. Verify `prepareForRecycle` cleans up
3. Use Instruments to profile
4. Ensure delegates are weak

## Testing Checklist Summary

Use the comprehensive checklist in [FABRIC_CHECKLIST.md](./FABRIC_CHECKLIST.md) for detailed testing.

**Quick Checklist**:
- [ ] Builds without errors
- [ ] Runs without crashes
- [ ] All features work
- [ ] No memory leaks
- [ ] Good performance
- [ ] Documentation complete

## Timeline Estimate

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Fix build issues | 2-4 hours | Critical |
| Test basic functionality | 2-3 hours | Critical |
| Test all features | 4-6 hours | High |
| Android implementation | 8-12 hours | Medium |
| Documentation polish | 2-3 hours | Medium |
| Release preparation | 1-2 hours | Low |
| **Total** | **19-30 hours** | - |

## Success Criteria

The migration is complete when:

✅ **Builds Successfully**
- Zero build errors
- Zero warnings (Fabric-related)
- Codegen runs without issues

✅ **Functions Correctly**
- All features work as before
- No regressions
- Events fire correctly
- Props update correctly

✅ **Performs Well**
- No memory leaks
- Smooth animations (60fps)
- Fast present/dismiss
- Low CPU usage

✅ **Well Documented**
- Migration guide is clear
- Troubleshooting is helpful
- Examples are working
- API docs are accurate

✅ **Production Ready**
- Tested on multiple devices
- Tested on multiple iOS versions
- Example app demonstrates all features
- Community feedback is positive

## Getting Help

If you encounter issues:

1. **Check Documentation**
   - [FABRIC_MIGRATION.md](./FABRIC_MIGRATION.md)
   - [FABRIC_IMPLEMENTATION.md](./FABRIC_IMPLEMENTATION.md)
   - [FABRIC_CHECKLIST.md](./FABRIC_CHECKLIST.md)

2. **React Native Resources**
   - [New Architecture Docs](https://reactnative.dev/docs/the-new-architecture/landing-page)
   - [Fabric Components](https://reactnative.dev/docs/the-new-architecture/pillars-fabric-components)
   - [TurboModules](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)

3. **Community**
   - React Native Discord
   - Stack Overflow
   - GitHub Discussions

4. **Debug Tools**
   - Xcode Debugger
   - React Native Debugger
   - Flipper (with Fabric support)
   - iOS Instruments

## Notes

- Keep old architecture support in a separate branch for reference
- Consider maintaining v2.x for users who can't migrate yet
- Collect user feedback during beta testing
- Be prepared for follow-up bug fixes

---

**Last Updated**: [Current Date]
**Status**: 📝 Planning Complete, Ready for Implementation
**Next Step**: Fix build issues and test basic functionality