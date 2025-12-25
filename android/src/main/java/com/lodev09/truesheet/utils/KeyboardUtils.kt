package com.lodev09.truesheet.utils

import android.content.Context
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.uimanager.ThemedReactContext

object KeyboardUtils {

  /**
   * Dismisses the soft keyboard if currently shown.
   */
  fun dismiss(reactContext: ThemedReactContext) {
    val imm = reactContext.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
    reactContext.currentActivity?.currentFocus?.let { focusedView ->
      imm?.hideSoftInputFromWindow(focusedView.windowToken, 0)
    }
  }

  /**
   * Gets the current keyboard height from window insets.
   */
  fun getKeyboardHeight(view: View): Int {
    val insets = ViewCompat.getRootWindowInsets(view)
    return insets?.getInsets(WindowInsetsCompat.Type.ime())?.bottom ?: 0
  }
}
