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

  /** Returns false when unavailable — caller should fall back to async updateState. */
  fun updateFooterState(stateWrapper: StateWrapper, bottomInsetDp: Float): Boolean =
    isAvailable && nativeUpdateFooterState(stateWrapper, bottomInsetDp)

  /**
   * Publishes the precalculated bottom safe-area inset so a late-mounted
   * footer's first layout is already padded (see TrueSheetFooterViewShadowNode).
   */
  fun setBottomSafeArea(insetDp: Float) {
    if (isAvailable) nativeSetBottomSafeArea(insetDp)
  }

  @JvmStatic
  private external fun nativeUpdateState(stateWrapper: Any, width: Float, height: Float): Boolean

  @JvmStatic
  private external fun nativeUpdateFooterState(stateWrapper: Any, bottomInset: Float): Boolean

  @JvmStatic
  private external fun nativeSetBottomSafeArea(insetDp: Float)
}
