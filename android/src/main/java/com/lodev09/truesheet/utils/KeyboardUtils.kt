package com.lodev09.truesheet.utils

import android.content.Context
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.uimanager.ThemedReactContext

object KeyboardUtils {

  /**
   * Checks if the soft keyboard is currently visible.
   */
  fun isKeyboardVisible(reactContext: ThemedReactContext): Boolean {
    val rootView = reactContext.currentActivity?.window?.decorView?.rootView ?: return false
    return isKeyboardVisible(rootView)
  }

  private fun isKeyboardVisible(view: View): Boolean {
    val insets = ViewCompat.getRootWindowInsets(view) ?: return false
    return insets.isVisible(WindowInsetsCompat.Type.ime())
  }

  /**
   * Dismisses the soft keyboard if currently shown.
   */
  fun dismiss(reactContext: ThemedReactContext) {
    val rootView = reactContext.currentActivity?.window?.decorView?.rootView ?: return
    dismiss(rootView, null)
  }

  /**
   * Dismisses the soft keyboard with an optional callback when the animation completes.
   */
  fun dismiss(view: View, onComplete: (() -> Unit)?) {
    val imm = view.context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
    val focusedView = view.rootView.findFocus()

    if (focusedView == null || !isKeyboardVisible(view)) {
      onComplete?.invoke()
      return
    }

    if (onComplete != null) {
      ViewCompat.setWindowInsetsAnimationCallback(
        view,
        object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
          override fun onProgress(
            insets: WindowInsetsCompat,
            runningAnimations: List<WindowInsetsAnimationCompat>
          ): WindowInsetsCompat = insets

          override fun onEnd(animation: WindowInsetsAnimationCompat) {
            ViewCompat.setWindowInsetsAnimationCallback(view, null)
            onComplete()
          }
        }
      )
    }

    imm?.hideSoftInputFromWindow(focusedView.windowToken, 0)
  }

  /**
   * Shows the soft keyboard for the given view.
   */
  fun show(view: View) {
    val imm = view.context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
    imm?.showSoftInput(view, InputMethodManager.SHOW_IMPLICIT)
  }

  /**
   * Gets the current keyboard height from window insets.
   */
  fun getKeyboardHeight(view: View): Int {
    val insets = ViewCompat.getRootWindowInsets(view)
    return insets?.getInsets(WindowInsetsCompat.Type.ime())?.bottom ?: 0
  }
}
