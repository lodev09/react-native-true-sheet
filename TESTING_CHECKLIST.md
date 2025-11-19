# TrueSheet Android Fabric Implementation - Testing Checklist

## Pre-Testing Setup

- [ ] Clean build environment
  ```bash
  cd example/android
  ./gradlew clean
  cd ../..
  rm -rf node_modules
  yarn install
  cd example
  yarn android
  ```

- [ ] Verify New Architecture is enabled
  - Check `android/gradle.properties`: `newArchEnabled=true`
  - Check logs for "Fabric enabled" messages

- [ ] Install React DevTools for component inspection
  ```bash
  npm install -g react-devtools
  react-devtools
  ```

## 1. View Hierarchy Tests

### 1.1 Basic Rendering
- [ ] Sheet renders without errors
- [ ] View hierarchy is correct in React DevTools:
  ```
  TrueSheetView
    └── TrueSheetContainerView
        ├── TrueSheetContentView
        │   └── View (style wrapper)
        │       └── [content]
        └── TrueSheetFooterView (if footer prop provided)
            └── [footer content]
  ```
- [ ] Views have correct native tags
- [ ] No memory leaks on mount/unmount (use LeakCanary)

### 1.2 Container Layout
- [ ] Container measures correctly
- [ ] Container layout updates on content changes
- [ ] Container handles empty content gracefully

### 1.3 Content View
- [ ] Content view renders user's children
- [ ] Content height calculates correctly
- [ ] Dynamic content height updates work
- [ ] ScrollView content works inside sheet
- [ ] FlatList content works inside sheet

### 1.4 Footer View
- [ ] Footer renders when provided
- [ ] Footer doesn't render when not provided
- [ ] Footer positioned at bottom
- [ ] Footer height calculates correctly
- [ ] Footer doesn't interfere with content scrolling

## 2. Props Tests

### 2.1 Detents
- [ ] Single detent (e.g., `[0.8]`)
  - [ ] Sheet shows at correct height
  - [ ] No dragging to other detents
  
- [ ] Two detents (e.g., `[0.3, 0.9]`)
  - [ ] Both detents work correctly
  - [ ] Can drag between detents
  - [ ] Snaps to nearest detent on release
  
- [ ] Three detents (e.g., `[0.2, 0.5, 0.9]`)
  - [ ] All three detents work
  - [ ] Half-expanded state works correctly
  - [ ] Can drag between all detents
  
- [ ] Auto detent (e.g., `[-1, 1]` or `['auto', 1]`)
  - [ ] Height adjusts to content automatically
  - [ ] Updates when content height changes
  
- [ ] Invalid detents handled gracefully
  - [ ] Detents > 1 clamped to 1
  - [ ] Detents <= 0 handled (default to 0.1)
  - [ ] More than 3 detents (uses first 3)

### 2.2 Visual Props
- [ ] `background` - Background color applies correctly
- [ ] `cornerRadius` - Top corners rounded correctly
- [ ] `cornerRadius={0}` - No rounding
- [ ] `cornerRadius={-1}` - Default system radius

### 2.3 Behavior Props
- [ ] `dismissible={true}` - Can dismiss by drag/tap outside
- [ ] `dismissible={false}` - Cannot dismiss
- [ ] `dimmed={true}` - Background dimmed
- [ ] `dimmed={false}` - Background not dimmed, touchable
- [ ] `dimmedIndex={0}` - Dims from first detent
- [ ] `dimmedIndex={1}` - Dims only from second detent onwards
- [ ] `dimmedIndex={2}` - Dims only at last detent

### 2.4 Initial State Props
- [ ] `initialIndex={-1}` - Sheet hidden on mount
- [ ] `initialIndex={0}` - Sheet shows at first detent
- [ ] `initialIndex={1}` - Sheet shows at second detent
- [ ] `initialIndexAnimated={true}` - Animates on mount
- [ ] `initialIndexAnimated={false}` - No animation on mount

### 2.5 Size Props
- [ ] `maxHeight` - Respects maximum height
- [ ] `maxHeight` with auto detents - Works correctly
- [ ] No `maxHeight` - Uses screen height

### 2.6 Mode Props
- [ ] `edgeToEdge={false}` - Normal mode
- [ ] `edgeToEdge={true}` - Full screen height
- [ ] `keyboardMode="resize"` - Sheet resizes for keyboard
- [ ] `keyboardMode="pan"` - Sheet pans for keyboard

### 2.7 iOS-Only Props (Should Not Crash)
- [ ] `blurTint="light"` - No-op, no crash
- [ ] `blurTint="dark"` - No-op, no crash
- [ ] `grabber={true}` - Accepted, no visual grabber
- [ ] `grabber={false}` - Accepted

### 2.8 Prop Updates
- [ ] Update `background` while presented
- [ ] Update `cornerRadius` while presented
- [ ] Update `detents` while presented
- [ ] Update `dismissible` while presented
- [ ] Update `dimmed` while presented
- [ ] Update `maxHeight` while presented

## 3. Events Tests

### 3.1 Lifecycle Events
- [ ] `onMount` fires when component mounts
- [ ] `onMount` fires only once per mount

### 3.2 Presentation Events
- [ ] `onWillPresent` fires before presentation
- [ ] `onWillPresent` includes detent info payload
- [ ] `onDidPresent` fires after presentation complete
- [ ] `onDidPresent` includes detent info payload
- [ ] Event order: onWillPresent → onDidPresent

### 3.3 Dismissal Events
- [ ] `onWillDismiss` fires before dismissal
- [ ] `onDidDismiss` fires after dismissal complete
- [ ] Event order: onWillDismiss → onDidDismiss
- [ ] Events fire on user drag dismiss
- [ ] Events fire on tap outside dismiss
- [ ] Events fire on imperative dismiss

### 3.4 Detent Change Events
- [ ] `onDetentChange` fires when detent changes
- [ ] Includes correct index and position
- [ ] Fires on user drag to new detent
- [ ] Fires on imperative resize
- [ ] Doesn't fire on initial present (unless changing detent)

### 3.5 Drag Events
- [ ] `onDragBegin` fires when user starts dragging
- [ ] `onDragChange` fires continuously during drag
- [ ] `onDragEnd` fires when user releases
- [ ] Event order: onDragBegin → onDragChange(s) → onDragEnd
- [ ] Events include correct detent info
- [ ] Events don't fire on imperative changes

### 3.6 Position Change Events
- [ ] `onPositionChange` fires continuously during drag
- [ ] `onPositionChange` fires during settling animation
- [ ] Includes `transitioning: true` when dragging
- [ ] Includes `transitioning: false` when settled
- [ ] Position values are accurate

### 3.7 Event Payload Validation
- [ ] All payloads match TypeScript types
- [ ] `index` is integer
- [ ] `position` is float/number
- [ ] `transitioning` is boolean
- [ ] No null/undefined in required fields

## 4. Imperative API Tests

### 4.1 TrueSheet.present()
- [ ] `TrueSheet.present('name', 0)` - Present at first detent
- [ ] `TrueSheet.present('name', 1)` - Present at second detent
- [ ] `TrueSheet.present('name')` - Defaults to index 0
- [ ] Promise resolves after presentation complete
- [ ] Throws error if sheet name not found
- [ ] Throws error if index out of bounds
- [ ] Can present multiple times (changes detent)

### 4.2 TrueSheet.dismiss()
- [ ] `TrueSheet.dismiss('name')` - Dismisses sheet
- [ ] Promise resolves after dismissal complete
- [ ] Throws error if sheet name not found
- [ ] Can dismiss already dismissed sheet (no-op)

### 4.3 TrueSheet.resize()
- [ ] `TrueSheet.resize('name', 1)` - Resizes to detent
- [ ] Works while sheet is presented
- [ ] Throws error if sheet not presented
- [ ] Throws error if index out of bounds
- [ ] Promise resolves after resize complete

### 4.4 Instance Methods (via ref)
- [ ] `ref.current.present(0)` - Works
- [ ] `ref.current.dismiss()` - Works
- [ ] `ref.current.resize(1)` - Works
- [ ] Methods work without `name` prop

### 4.5 Error Handling
- [ ] Invalid sheet name - descriptive error
- [ ] Invalid detent index - descriptive error
- [ ] View not found - descriptive error
- [ ] Calling before mount - handled gracefully

## 5. Layout & Measurements

### 5.1 Content Height
- [ ] Static content height correct
- [ ] Dynamic content height updates
- [ ] Content with padding measures correctly
- [ ] Content with margins measures correctly
- [ ] Very small content (< 100dp)
- [ ] Very large content (> screen height)

### 5.2 Footer Positioning
- [ ] Footer at bottom when settled
- [ ] Footer animates during drag
- [ ] Footer stays with sheet edge
- [ ] Footer doesn't overlap content
- [ ] Footer with padding positions correctly

### 5.3 Edge Cases
- [ ] Empty content (no children)
- [ ] Content updates while dragging
- [ ] Footer added after mount
- [ ] Footer removed after mount
- [ ] Orientation change handling

## 6. Keyboard Tests

### 6.1 Resize Mode
- [ ] Sheet resizes when keyboard appears
- [ ] Sheet restores when keyboard dismisses
- [ ] Input remains visible when focused
- [ ] Detents still work with keyboard visible

### 6.2 Pan Mode
- [ ] Sheet pans up when keyboard appears
- [ ] Sheet pans down when keyboard dismisses
- [ ] Input remains visible when focused
- [ ] Content doesn't resize

### 6.3 Edge Cases
- [ ] Multiple inputs - focus switching
- [ ] Dismiss keyboard by drag
- [ ] Keyboard visible during resize
- [ ] Keyboard with footer present

## 7. Interaction Tests

### 7.1 Drag Behavior
- [ ] Can drag sheet up and down
- [ ] Snaps to nearest detent on release
- [ ] Respects velocity (fling)
- [ ] Can't drag past max/min heights
- [ ] Smooth animation on release

### 7.2 Tap Outside
- [ ] Dismisses when `dismissible={true}`
- [ ] Doesn't dismiss when `dismissible={false}`
- [ ] Doesn't dismiss when `dimmed={false}` and tapping background components
- [ ] Background components receive touches when not dimmed

### 7.3 Scrollable Content
- [ ] ScrollView scrolls inside sheet
- [ ] FlatList scrolls inside sheet
- [ ] Can drag sheet when at top of scroll
- [ ] Can't drag sheet when scrolling content
- [ ] Scroll and drag interaction feels natural

### 7.4 Nested Gestures
- [ ] Buttons inside sheet work
- [ ] TextInput inside sheet works
- [ ] Touchables inside sheet work
- [ ] Swipe gestures inside sheet work

## 8. Edge-to-Edge Mode

### 8.1 Visual
- [ ] Sheet extends under status bar
- [ ] Sheet extends under navigation bar
- [ ] Content readable (not under system UI)
- [ ] Proper insets applied

### 8.2 Behavior
- [ ] Detent heights calculate correctly
- [ ] Max height uses full screen
- [ ] System bars remain visible
- [ ] Status bar style doesn't change

## 9. Multiple Sheets

### 9.1 Multiple Instances
- [ ] Can have multiple sheet components
- [ ] Each sheet has unique name
- [ ] Can present different sheets independently
- [ ] Dismiss one doesn't affect others

### 9.2 Stacking
- [ ] Present sheet B over sheet A
- [ ] Events fire correctly for both
- [ ] Dismiss order works correctly
- [ ] No z-index issues

## 10. Performance Tests

### 10.1 Rendering
- [ ] Initial mount is fast (< 100ms)
- [ ] Presentation animation smooth (60fps)
- [ ] Drag interaction smooth (60fps)
- [ ] No jank during scroll

### 10.2 Memory
- [ ] No memory leaks on mount/unmount
- [ ] No memory leaks on present/dismiss cycles
- [ ] Large content doesn't cause OOM
- [ ] Multiple sheets don't accumulate memory

### 10.3 Large Content
- [ ] 1000+ item FlatList performs well
- [ ] Large images render correctly
- [ ] Complex layouts don't cause lag
- [ ] Detent calculation is fast

## 11. Device Testing

### 11.1 Screen Sizes
- [ ] Small phone (< 5")
- [ ] Normal phone (5-6")
- [ ] Large phone (6+")
- [ ] Tablet (7-10")
- [ ] Foldable (unfolded)

### 11.2 Android Versions
- [ ] Android 5.0 (API 21)
- [ ] Android 6.0 (API 23)
- [ ] Android 8.0 (API 26)
- [ ] Android 10 (API 29)
- [ ] Android 11 (API 30)
- [ ] Android 12 (API 31)
- [ ] Android 13 (API 33)
- [ ] Android 14 (API 34)

### 11.3 Manufacturers
- [ ] Samsung
- [ ] Google Pixel
- [ ] OnePlus
- [ ] Xiaomi
- [ ] Huawei

### 11.4 Orientations
- [ ] Portrait
- [ ] Landscape
- [ ] Rotation during presentation
- [ ] Rotation while dragging

## 12. Accessibility

### 12.1 TalkBack
- [ ] Sheet is announced when presented
- [ ] Content is navigable with TalkBack
- [ ] Dismiss action is available
- [ ] Proper content descriptions

### 12.2 Focus Management
- [ ] Focus moves to sheet on present
- [ ] Focus returns on dismiss
- [ ] Tab order is correct
- [ ] No focus traps

## 13. Error Scenarios

### 13.1 Invalid Props
- [ ] Negative detent values
- [ ] Empty detents array
- [ ] Invalid color values
- [ ] Negative corner radius
- [ ] Out of bounds initialIndex

### 13.2 Lifecycle Issues
- [ ] Present before mount
- [ ] Present during unmount
- [ ] Multiple rapid present/dismiss
- [ ] Update props during animation

### 13.3 Edge Cases
- [ ] No network (shouldn't affect)
- [ ] Low memory warning
- [ ] App backgrounding during presentation
- [ ] App killed and restored

## 14. Integration Tests

### 14.1 Navigation
- [ ] Sheet works with React Navigation
- [ ] Navigate while sheet presented
- [ ] Back button behavior
- [ ] Deep linking with sheet

### 14.2 State Management
- [ ] Redux state updates work
- [ ] Context updates work
- [ ] Recoil/Zustand updates work
- [ ] Props from state work

### 14.3 Other Libraries
- [ ] Works with React Native Reanimated
- [ ] Works with React Native Gesture Handler
- [ ] Works with React Native Maps
- [ ] Works with React Native Camera

## 15. Regression Tests

After any changes, verify:
- [ ] All basic functionality still works
- [ ] No new console warnings/errors
- [ ] No performance degradation
- [ ] No visual regressions
- [ ] Event order unchanged

## 16. Documentation Tests

- [ ] Example app demonstrates all features
- [ ] README is accurate
- [ ] TypeScript types are correct
- [ ] Props documented match implementation
- [ ] Event payloads documented match implementation

## Sign-Off

**Tested By:** ___________________
**Date:** ___________________
**Platform:** Android ___________________
**React Native Version:** ___________________
**Test Result:** ☐ Pass ☐ Fail

**Critical Issues Found:**
- [ ] None
- [ ] Issue 1: _____________________
- [ ] Issue 2: _____________________
- [ ] Issue 3: _____________________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________