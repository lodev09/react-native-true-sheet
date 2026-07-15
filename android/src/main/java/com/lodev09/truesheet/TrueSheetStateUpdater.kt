package com.lodev09.truesheet

import com.facebook.react.uimanager.StateWrapper

/**
 * Synchronous Fabric state updates via JNI (see TrueSheetStateUpdater.cpp).
 *
 * StateWrapper.updateState commits asynchronously, so the container's Yoga
 * layout lags the sheet by a frame or two during drags. The native bridge
 * commits with `unstable_Immediate`, which mounts synchronously when called
 * from the UI thread — same-frame layout, like iOS.
 */
object TrueSheetStateUpdater {
  private val isAvailable: Boolean = try {
    System.loadLibrary("react_codegen_TrueSheetSpec")
    true
  } catch (e: UnsatisfiedLinkError) {
    false
  }

  /** Returns false when unavailable — caller should fall back to async updateState. */
  fun updateState(stateWrapper: StateWrapper, widthDp: Float, heightDp: Float): Boolean =
    isAvailable && nativeUpdateState(stateWrapper, widthDp, heightDp)

  @JvmStatic
  private external fun nativeUpdateState(stateWrapper: Any, width: Float, height: Float): Boolean
}
