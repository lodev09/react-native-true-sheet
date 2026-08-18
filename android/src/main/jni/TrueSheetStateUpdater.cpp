//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#include <fbjni/fbjni.h>
#include <react/fabric/StateWrapperImpl.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetFooterViewState.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetInsets.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetViewState.h>
#include <react/renderer/core/ConcreteState.h>

namespace facebook::react {

static std::shared_ptr<const State> getStateFromWrapper(jni::alias_ref<jobject> stateWrapper) {
  static const auto stateWrapperImplClass =
      jni::findClassStatic(StateWrapperImpl::StateWrapperImplJavaDescriptor);
  if (!stateWrapper->isInstanceOf(stateWrapperImplClass)) {
    return nullptr;
  }

  auto impl = jni::static_ref_cast<StateWrapperImpl::jhybridobject>(stateWrapper);
  return impl->cthis()->getState();
}

// Kotlin's StateWrapper.updateState is hardcoded async. This bridges to
// ConcreteState::updateState with unstable_Immediate so the commit — and, when
// called from the UI thread, the mount — run synchronously, letting Yoga resize
// the container in the same frame as the sheet (parity with iOS).
static jboolean updateStateImmediate(
    jni::alias_ref<jclass> /*clazz*/,
    jni::alias_ref<jobject> stateWrapper,
    jfloat containerWidth,
    jfloat containerHeight) {
  auto state = getStateFromWrapper(stateWrapper);
  if (!state) {
    return JNI_FALSE;
  }

  auto concreteState = std::static_pointer_cast<const ConcreteState<TrueSheetViewState>>(state);

  // Copy the latest data so fields this bridge doesn't set survive the update
  TrueSheetViewState newState = concreteState->getData();
  newState.containerWidth = containerWidth;
  newState.containerHeight = containerHeight;
  concreteState->updateState(std::move(newState), EventQueue::UpdateMode::unstable_Immediate);

  return JNI_TRUE;
}

// Same synchronous bridge for the footer's bottom inset — the footer must be
// padded (and resized) before detents are configured, otherwise the behavior
// is set up against the unpadded footer height and the auto detent lands an
// inset short.
static jboolean updateFooterStateImmediate(
    jni::alias_ref<jclass> /*clazz*/,
    jni::alias_ref<jobject> stateWrapper,
    jfloat bottomInset) {
  auto state = getStateFromWrapper(stateWrapper);
  if (!state) {
    return JNI_FALSE;
  }

  auto concreteState =
      std::static_pointer_cast<const ConcreteState<TrueSheetFooterViewState>>(state);

  // Copy the latest data so fields this bridge doesn't set survive the update
  TrueSheetFooterViewState newState = concreteState->getData();
  newState.bottomInset = bottomInset;
  newState.initialized = true;
  concreteState->updateState(std::move(newState), EventQueue::UpdateMode::unstable_Immediate);

  return JNI_TRUE;
}

// Publishes the precalculated bottom safe-area inset so a late-mounted
// footer's first layout is already padded (see TrueSheetFooterViewShadowNode).
static void setBottomSafeArea(jni::alias_ref<jclass> /*clazz*/, jfloat insetDp) {
  TrueSheetInsets::setBottomSafeArea(insetDp);
}

} // namespace facebook::react

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void * /*reserved*/) {
  return facebook::jni::initialize(vm, [] {
    facebook::jni::findClassStatic("com/lodev09/truesheet/TrueSheetStateUpdater")
        ->registerNatives({
            makeNativeMethod("nativeUpdateState", facebook::react::updateStateImmediate),
            makeNativeMethod("nativeUpdateFooterState", facebook::react::updateFooterStateImmediate),
            makeNativeMethod("nativeSetBottomSafeArea", facebook::react::setBottomSafeArea),
        });
  });
}
