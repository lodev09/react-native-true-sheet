package com.lodev09.truesheet.utils

import android.content.Context
import android.view.View
import android.view.ViewTreeObserver.OnGlobalLayoutListener
import android.view.inputmethod.InputMethodManager
import com.facebook.react.bridge.ReactContext

class KeyboardManager(reactContext: ReactContext) {
  interface OnKeyboardChangeListener {
    fun onKeyboardStateChange(isVisible: Boolean, visibleHeight: Int?)
  }

  private var contentView: View? = null
  private var onGlobalLayoutListener: OnGlobalLayoutListener? = null
  private var isKeyboardVisible = false

  init {
    val activity = reactContext.currentActivity
    contentView = activity?.findViewById(android.R.id.content)
  }

  fun registerKeyboardListener(listener: OnKeyboardChangeListener?) {
    contentView?.apply {
      unregisterKeyboardListener()

      onGlobalLayoutListener = object : OnGlobalLayoutListener {
        private var previousHeight = 0

        override fun onGlobalLayout() {
          val heightDiff = rootView.height - height
          if (heightDiff > PixelUtils.toPixel(200.0)) {
            // Will ask InputMethodManager.isAcceptingText() to detect if keyboard appeared or not.
            val inputManager = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            if (height != previousHeight && inputManager.isAcceptingText()) {
              listener?.onKeyboardStateChange(true, height)

              previousHeight = height
              isKeyboardVisible = true
            }
          } else if (isKeyboardVisible) {
            listener?.onKeyboardStateChange(false, null)
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
      contentView?.getViewTreeObserver()?.removeOnGlobalLayoutListener(onGlobalLayoutListener)
    }
  }
}
