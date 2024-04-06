package com.lodev09.truesheet.core

import android.content.Context
import android.view.View
import android.view.ViewTreeObserver.OnGlobalLayoutListener
import android.view.inputmethod.InputMethodManager
import com.facebook.react.bridge.ReactContext

class KeyboardManager(reactContext: ReactContext) {
  interface OnKeyboardListener {
    fun onKeyboardStateChange(isVisible: Boolean)
  }

  private var screenView: View? = Utils.activityView(reactContext)
  private var onGlobalLayoutListener: OnGlobalLayoutListener? = null
  private var isKeyboardVisible = false

  fun registerKeyboardListener(listener: OnKeyboardListener?) {
    screenView?.apply {
      unregisterKeyboardListener()

      onGlobalLayoutListener = object : OnGlobalLayoutListener {
        private var previousHeight = 0

        override fun onGlobalLayout() {
          val heightDiff = rootView.height - height
          if (heightDiff > Utils.toPixel(200.0)) {
            // Will ask InputMethodManager.isAcceptingText() to detect if keyboard appeared or not.
            val inputManager = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            if (height != previousHeight && inputManager.isAcceptingText()) {
              listener?.onKeyboardStateChange(true)

              previousHeight = height
              isKeyboardVisible = true
            }
          } else if (isKeyboardVisible) {
            listener?.onKeyboardStateChange(false)
            previousHeight = 0
            isKeyboardVisible = false
          }
        }
      }

      getViewTreeObserver().addOnGlobalLayoutListener(onGlobalLayoutListener)
    }
  }

  fun unregisterKeyboardListener() {
    onGlobalLayoutListener?.let {
      screenView?.getViewTreeObserver()?.removeOnGlobalLayoutListener(onGlobalLayoutListener)
    }
  }
}
