# Screen Unmount Detection Research

Exploring alternatives to `RNSLifecycleListenerProtocol` for detecting when a presenting screen unmounts while a sheet is presented.

**Context**: https://github.com/software-mansion/react-native-screens/pull/3527#pullrequestreview-3650866794

## Approach 1: `RCTMountingTransactionObserving`

Conform `TrueSheetView` to `RCTMountingTransactionObserving` and implement mounting transaction callbacks.

### 1a. `mountingTransactionWillMount`

Called right **before** first mutation executes.

```objc
- (void)mountingTransactionWillMount:(const facebook::react::MountingTransaction &)transaction
                withSurfaceTelemetry:(const facebook::react::SurfaceTelemetry &)surfaceTelemetry {
  for (const auto &mutation : transaction.getMutations()) {
    if (mutation.type == ShadowViewMutation::Delete && mutation.oldChildShadowView.tag == self.tag) {
      [self dismissAllAnimated:NO completion:nil];
      return;
    }
  }
}
```

| Scenario | Result |
|----------|--------|
| `navigation.goBack()` | Split second delay before dismiss |
| Native back gesture | Too late - controller already nil? |

### 1b. `mountingTransactionDidMount`

Called right **after** last mutation executes.

**Result**: Not working. Per React Native docs, `DidMount` is NOT called for views being unmounted (already unregistered as observer).

### Notes

- These approaches detect when `TrueSheetView` itself is deleted
- Does NOT detect when the **presenting screen** is deleted (parent unmount)
- The timing seems off for native back gestures
- Neither `WillMount` nor `DidMount` provide reliable timing

---

## Approach 2: Event Dispatcher (`RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED`)

Observe events via `NSNotificationCenter` using `RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED`.

### Implementation

```objc
- (void)startObservingEventDispatcher {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleEventDispatcherNotification:)
                                               name:@"RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED"
                                             object:nil];
}

- (void)handleEventDispatcherNotification:(NSNotification *)notification {
  id<RCTEvent> event = notification.userInfo[@"event"];
  NSString *eventName = [event eventName];
  // Look for onWillDisappear...
}
```

### Findings

**Result**: Not working. 

Only `onTransitionProgress` and `onHeaderHeightChange` are posted via this notification. The `onWillDisappear` event is emitted directly through the Fabric event emitter:

```objc
// react-native-screens uses direct emitter, NOT notification
std::dynamic_pointer_cast<const react::RNSScreenEventEmitter>(_eventEmitter)
    ->onWillDisappear(...);
```

---

## Approach 3: C++ EventDispatcher via State (ComponentDescriptor)

Pass the C++ `EventDispatcher` through state to the native view and add an `EventListener` to intercept all events.

### How it works

1. **ComponentDescriptor** has access to `eventDispatcher_` (member of `ConcreteComponentDescriptor`)
2. In `adopt()`, pass eventDispatcher to ShadowNode similar to how imageLoader is passed:
   ```cpp
   // TrueSheetViewComponentDescriptor.h
   void adopt(ShadowNode &shadowNode) const override {
     // ... existing code ...
     concreteShadowNode.setEventDispatcher(eventDispatcher_);
     ConcreteComponentDescriptor::adopt(shadowNode);
   }
   ```
3. Store in State class:
   ```cpp
   // TrueSheetViewState.h
   void setEventDispatcher(std::weak_ptr<const EventDispatcher> dispatcher);
   std::weak_ptr<const EventDispatcher> getEventDispatcher() const noexcept;
   ```
4. In native view's `updateState:oldState:`, retrieve and use it:
   ```objc
   - (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
     _state = std::static_pointer_cast<...>(state);
     if (auto dispatcherPtr = _state.get()->getData().getEventDispatcher().lock()) {
       // Add event listener to observe onWillDisappear from any RNSScreen
       dispatcherPtr->addListener(std::make_shared<EventListener>(
         [](const RawEvent& event) {
           if (event.type == "onWillDisappear") {
             // Dismiss sheet if it's our presenter
           }
           return false; // Don't intercept, pass through
         }
       ));
     }
   }
   ```

### RawEvent structure

```cpp
struct RawEvent {
  std::string type;                              // e.g., "onWillDisappear"
  SharedEventPayload eventPayload;
  SharedEventTarget eventTarget;
  std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily;  // Source component
  Category category;
};
```

### Reference: imageLoader pattern in react-native-screens

```cpp
// RNSScreenStackHeaderConfigComponentDescriptor.h
void adopt(ShadowNode &shadowNode) const override {
  // ...
  std::weak_ptr<void> imageLoader =
      contextContainer_->at<std::shared_ptr<void>>("RCTImageLoader");
  configShadowNode.setImageLoader(imageLoader);
}

// RNSScreenStackHeaderConfig.mm
- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<...>(state);
  if (auto imgLoaderPtr = _state.get()->getData().getImageLoader().lock()) {
    _imageLoader = react::unwrapManagedObject(imgLoaderPtr);
  }
}
```

### Implementation Status

**IMPLEMENTED** - This is the current solution.

### How It Works

1. **At presentation time**, capture:
   - `_presenterScreenTag` - Tag of the RNSScreenView containing the sheet
   - `_presenterScreenController` - The screen's view controller (via responder chain)
   - `_parentModalTag` - Tag of parent RNSModalScreen (if inside a modal)

2. **Listen for `topWillDisappear` events** via the EventDispatcher:
   - Compare event's screen tag with `_presenterScreenTag`
   - If they match, the presenter screen is being removed

3. **Distinguish navigation pop from modal dismiss**:
   - If inside a modal (`_parentModalTag != 0`), check if screen is still in nav stack
   - If still in nav stack → modal is being dismissed → skip (modal handles sheet)
   - If not in nav stack → navigation pop → dismiss sheet

### Files Changed

- `common/cpp/.../TrueSheetViewState.h` - Added `eventDispatcher_` member and getter/setter
- `common/cpp/.../TrueSheetViewState.cpp` - Implemented getter/setter
- `common/cpp/.../TrueSheetViewShadowNode.h` - Added `setEventDispatcher()` and `getStateDataMutable()`
- `common/cpp/.../TrueSheetViewShadowNode.cpp` - Implemented methods
- `common/cpp/.../TrueSheetViewComponentDescriptor.h` - Pass `eventDispatcher_` in `adopt()`
- `ios/TrueSheetView.mm` - Event listener setup and screen unmount detection logic

---

## Previous Solution: `RNSLifecycleListenerProtocol`

The protocol from react-native-screens notifies presented view controllers when the presenter is unmounting:

```objc
- (void)screenWillDisappear:(UIViewController *)screen isPresenterUnmounting:(BOOL)isPresenterUnmounting;
```

### Why it worked

- Called by `RNSScreen` when it's about to disappear
- Notifies any presented view controller that conforms to the protocol
- Has access to the screen's controller before it becomes nil

### Why we moved away

react-native-screens maintainers want to avoid component-specific integrations given planned deprecation of current implementation. See: https://github.com/software-mansion/react-native-screens/pull/3527#pullrequestreview-3650866794
