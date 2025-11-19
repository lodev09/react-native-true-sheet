# Quick Start Guide - Android Fabric Implementation

Get up and running with the new Android Fabric implementation in 5 minutes.

## Prerequisites

- React Native 0.71+ with New Architecture enabled
- Android Studio Arctic Fox or later
- Node.js 18+
- Java 11+

## Step 1: Clean Build

```bash
# From project root
cd example/android
./gradlew clean
cd ../..

# Clean node modules
rm -rf node_modules
yarn install

# Clean example
cd example
rm -rf node_modules
yarn install
```

## Step 2: Verify New Architecture

Check `example/android/gradle.properties`:
```properties
newArchEnabled=true
```

Should be set to `true`.

## Step 3: Build and Run

```bash
cd example
yarn android
```

Or from Android Studio:
1. Open `example/android` in Android Studio
2. Wait for Gradle sync
3. Click Run ▶️

## Step 4: Quick Test

### Test 1: Basic Presentation

```typescript
import { TrueSheet } from '@lodev09/react-native-true-sheet';

// In your component
const ref = useRef<TrueSheet>(null);

// Present the sheet
await ref.current?.present();
// or
await TrueSheet.present('mySheet');
```

### Test 2: Verify View Hierarchy

Open React DevTools:
```bash
npm install -g react-devtools
react-devtools
```

You should see:
```
TrueSheetView
  └── TrueSheetContainerView
      ├── TrueSheetContentView
      │   └── View
      │       └── [your content]
      └── TrueSheetFooterView (if footer provided)
```

### Test 3: Check Events

```typescript
<TrueSheet
  ref={ref}
  name="test"
  onMount={() => console.log('✅ onMount')}
  onWillPresent={(e) => console.log('✅ onWillPresent', e)}
  onDidPresent={(e) => console.log('✅ onDidPresent', e)}
  onDetentChange={(e) => console.log('✅ onDetentChange', e)}
  onPositionChange={(e) => console.log('✅ onPositionChange', e)}
>
  {/* Your content */}
</TrueSheet>
```

### Test 4: Detent Configurations

```typescript
// Single detent
<TrueSheet detents={[0.9]} />

// Two detents
<TrueSheet detents={[0.5, 0.95]} />

// Three detents
<TrueSheet detents={[0.3, 0.6, 0.95]} />

// Auto height
<TrueSheet detents={[-1, 1]} />
```

## Common Issues

### Issue: "TurboModule not found"

**Solution:** Ensure New Architecture is enabled:
```bash
cd example/android
./gradlew clean
cd ..
yarn android
```

### Issue: "View not found"

**Solution:** Ensure sheet is mounted before calling imperative methods:
```typescript
// Wait for onMount
const [mounted, setMounted] = useState(false);

<TrueSheet onMount={() => setMounted(true)} />

// Then use
if (mounted) {
  await TrueSheet.present('name');
}
```

### Issue: Build errors

**Solution:** Check Java version:
```bash
java -version
# Should be 11 or higher
```

Update `build.gradle` if needed:
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_11
    targetCompatibility JavaVersion.VERSION_11
}
```

### Issue: Events not firing

**Solution:** Check view ID is set:
```typescript
// Component must have a name or ref
<TrueSheet name="mySheet" /> // ✅ Good
<TrueSheet ref={ref} />       // ✅ Good
<TrueSheet />                 // ❌ Bad
```

## Verify Implementation

Run these quick checks:

```typescript
// 1. ✅ Component renders
<TrueSheet name="test">
  <Text>Hello</Text>
</TrueSheet>

// 2. ✅ Present works
await TrueSheet.present('test', 0);

// 3. ✅ Dismiss works
await TrueSheet.dismiss('test');

// 4. ✅ Resize works
await TrueSheet.present('test', 0);
await TrueSheet.resize('test', 1);

// 5. ✅ Props work
<TrueSheet
  name="test"
  detents={[0.5, 1]}
  backgroundColor="white"
  cornerRadius={12}
  dismissible={true}
  dimmed={true}
/>

// 6. ✅ Footer works
<TrueSheet
  name="test"
  footer={<View><Text>Footer</Text></View>}
>
  <Text>Content</Text>
</TrueSheet>

// 7. ✅ Events work
<TrueSheet
  name="test"
  onDidPresent={(e) => {
    console.log('Presented at index:', e.nativeEvent.index);
  }}
/>
```

## Example App

The example app includes demos for:
- ✅ Basic sheet
- ✅ Multiple detents
- ✅ ScrollView content
- ✅ FlatList content
- ✅ Footer examples
- ✅ Keyboard handling
- ✅ Gesture handling
- ✅ Reanimated integration

Run the example:
```bash
cd example
yarn android
```

## Performance Check

Test with React DevTools Profiler:

1. Open DevTools
2. Go to Profiler tab
3. Click Record
4. Present/dismiss sheet multiple times
5. Stop recording
6. Check render times (should be < 16ms for 60fps)

## Memory Check

Use Android Studio Memory Profiler:

1. Open Android Studio
2. Run app
3. View → Tool Windows → Profiler
4. Click Memory
5. Present/dismiss sheet 10 times
6. Force GC
7. Check for memory leaks (memory should return to baseline)

## Next Steps

Once basic functionality is verified:

1. Review `TESTING_CHECKLIST.md` for comprehensive tests
2. Check `ANDROID_FABRIC_IMPLEMENTATION.md` for architecture details
3. See `android/FABRIC_MIGRATION.md` for implementation guide
4. Run full test suite on physical devices

## Debugging Tips

### Enable Fabric Logs

In MainApplication.java:
```java
@Override
protected boolean isNewArchEnabled() {
  return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
}
```

### Check Native Logs

```bash
# Android logs
adb logcat *:S ReactNative:V ReactNativeJS:V TrueSheet:V

# Filter for TrueSheet
adb logcat | grep -i "truesheet"
```

### Debug Layout

In Android Studio:
1. Tools → Layout Inspector
2. View the sheet hierarchy
3. Check measurements and positions

## Support

If you encounter issues:

1. Check `ANDROID_CHANGES.md` for API changes
2. Review `TESTING_CHECKLIST.md` for specific scenarios
3. See `ANDROID_FABRIC_IMPLEMENTATION.md` for architecture
4. Check the example app for working code

## Success Criteria

✅ Clean build without errors
✅ Sheet renders correctly
✅ View hierarchy matches expected structure
✅ Imperative API works (present/dismiss/resize)
✅ All events fire correctly
✅ Props update as expected
✅ No memory leaks
✅ Smooth 60fps animations

Once all criteria are met, you're ready for production! 🎉

---

**Version:** 3.0+
**Architecture:** Fabric (New Architecture)
**Status:** Ready for Testing