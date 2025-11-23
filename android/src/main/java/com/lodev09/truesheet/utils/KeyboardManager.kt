package com.lodev09.truesheet.utils

import android.os.Build
import android.util.Log
import android.view.View
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.ReactContext

class KeyboardManager(reactContext: ReactContext) {
  companion object {
    private const val TAG_NAME = "TrueSheet"
  }

  interface OnKeyboardChangeListener {
    fun onKeyboardStateChange(isVisible: Boolean, visibleHeight: Int)
  }

  private var rootView: View? = null
  private var insetsListener: ((WindowInsetsCompat) -> Unit)? = null
  private var isKeyboardVisible = false
  private var previousHeight = 0

  init {
    val activity = reactContext.currentActivity
    rootView = activity?.window?.decorView?.rootView
  }

  fun registerKeyboardListener(listener: OnKeyboardChangeListener?) {
    val view = rootView ?: return

    // Clean up any existing listener first
    unregisterKeyboardListener()

    // Create and store the insets listener
    insetsListener = { windowInsets ->
      handleWindowInsets(windowInsets, listener)
    }

    // Register the WindowInsets listener
    ViewCompat.setOnApplyWindowInsetsListener(view) { _, insets ->
      insetsListener?.invoke(insets)
      insets
    }

    // Request a new insets pass to get initial state
    ViewCompat.requestApplyInsets(view)
  }

  private fun handleWindowInsets(
    windowInsets: WindowInsetsCompat,
    listener: OnKeyboardChangeListener?
  ) {
    // Get IME (keyboard) insets
    val imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime())
    val isImeVisible = windowInsets.isVisible(WindowInsetsCompat.Type.ime())

    // Calculate keyboard height
    val keyboardHeight = imeInsets.bottom

    if (isImeVisible && keyboardHeight > 0) {
      // Keyboard is visible
      if (!isKeyboardVisible || keyboardHeight != previousHeight) {
        // Get the visible height (screen height minus keyboard height)
        val systemBarsInsets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
        val visibleHeight = (rootView?.height ?: 0) - keyboardHeight - systemBarsInsets.top

        listener?.onKeyboardStateChange(true, visibleHeight)
        previousHeight = keyboardHeight
        isKeyboardVisible = true
      }
    } else if (isKeyboardVisible) {
      // Keyboard was visible, now it's hidden
      listener?.onKeyboardStateChange(false, 0)
      previousHeight = 0
      isKeyboardVisible = false
    }
  }

  fun unregisterKeyboardListener() {
    insetsListener = null
    rootView?.let { view ->
      ViewCompat.setOnApplyWindowInsetsListener(view, null)
    }
  }
}
