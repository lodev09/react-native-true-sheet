package com.lodev09.truesheet

import android.graphics.Color
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.LinearLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.KeyboardManager
import com.lodev09.truesheet.core.RootViewGroup
import com.lodev09.truesheet.core.Utils

class TrueSheetDialog(
  private val reactContext: ThemedReactContext,
  private val behavior: TrueSheetBehavior,
  private val rootViewGroup: RootViewGroup
) : BottomSheetDialog(reactContext) {

  private var keyboardManager = KeyboardManager(reactContext)

  var sheetView: ViewGroup

  init {
    LinearLayout(reactContext).apply {
      addView(rootViewGroup)
      setContentView(this)

      sheetView = parent as ViewGroup

      // Set to transparent background to support corner radius
      sheetView.setBackgroundColor(Color.TRANSPARENT)

      // Assign our main BottomSheetBehavior
      val sheetViewParams = sheetView.layoutParams as CoordinatorLayout.LayoutParams
      sheetViewParams.behavior = behavior
    }

    // Setup window params to adjust layout based on Keyboard state.
    window?.apply {
      // SOFT_INPUT_ADJUST_RESIZE to resize the sheet above the keyboard
      // SOFT_INPUT_STATE_HIDDEN to hide the keyboard when sheet is shown
      setSoftInputMode(
        WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
          or WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN
      )
    }
  }

  fun show(sizeIndex: Int) {
    if (isShowing) {
      behavior.setStateForSizeIndex(sizeIndex)
    } else {
      behavior.configure()
      behavior.setStateForSizeIndex(sizeIndex)

      this.show()
    }
  }

  /**
   * Handle keyboard state changes and adjust maxScreenHeight (sheet max height) accordingly.
   * Also update footer's Y position.
   */
  fun registerKeyboardManager() {
    keyboardManager.registerKeyboardListener(object : KeyboardManager.OnKeyboardListener {
      override fun onKeyboardStateChange(isVisible: Boolean) {
        behavior.maxScreenHeight = Utils.activityView(reactContext)?.height ?: 0
        behavior.footerView?.apply {
          y = (behavior.maxScreenHeight - (sheetView.top ?: 0) - height).toFloat()
        }
      }
    })
  }

  /**
   * Remove keyboard listener.
   */
  fun unregisterKeyboardManager() {
    keyboardManager.unregisterKeyboardListener()
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
