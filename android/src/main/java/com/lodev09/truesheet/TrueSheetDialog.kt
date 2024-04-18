package com.lodev09.truesheet

import android.graphics.Color
import android.view.ViewGroup
import android.view.WindowManager
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.KeyboardManager
import com.lodev09.truesheet.core.RootSheetView
import com.lodev09.truesheet.core.Utils

data class SizeInfo(val index: Int, val value: Float)

class TrueSheetDialog(private val reactContext: ThemedReactContext, private val rootSheetView: RootSheetView) :
  BottomSheetDialog(reactContext) {

  private var keyboardManager = KeyboardManager(reactContext)

  var maxScreenHeight: Int = 0
  var maxSheetHeight: Int? = null

  var contentView: ViewGroup? = null
  var footerView: ViewGroup? = null

  var sizes: Array<Any> = arrayOf("medium", "large")

  var sheetView: ViewGroup

  init {
    setContentView(rootSheetView)
    sheetView = rootSheetView.parent as ViewGroup
    sheetView.setBackgroundColor(Color.TRANSPARENT)

    // Setup window params to adjust layout based on Keyboard state.
    window?.apply {
      // SOFT_INPUT_ADJUST_RESIZE to resize the sheet above the keyboard
      setSoftInputMode(
        WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
      )
    }
  }

  fun show(sizeIndex: Int) {
    if (isShowing) {
      setStateForSizeIndex(sizeIndex)
    } else {
      configure()
      setStateForSizeIndex(sizeIndex)

      this.show()
    }
  }

  /**
   * Handle keyboard state changes and adjust maxScreenHeight (sheet max height) accordingly.
   * Also update footer's Y position.
   */
  fun registerKeyboardManager() {
    keyboardManager.registerKeyboardListener(object : KeyboardManager.OnKeyboardListener {
      override fun onKeyboardStateChange(isVisible: Boolean, visibleHeight: Int?) {
        when (isVisible) {
          true -> maxScreenHeight = visibleHeight ?: 0
          else -> maxScreenHeight = Utils.screenHeight(reactContext)
        }

        footerView?.apply {
          y = (maxScreenHeight - (sheetView.top ?: 0) - height).toFloat()
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

  /**
   * Get the height value based on the size config value.
   */
  private fun getSizeHeight(size: Any, contentHeight: Int): Int {
    val height =
      when (size) {
        is Double -> Utils.toPixel(size)

        is Int -> Utils.toPixel(size.toDouble())

        is String -> {
          when (size) {
            "auto" -> contentHeight

            "large" -> maxScreenHeight

            "medium" -> (maxScreenHeight * 0.50).toInt()

            "small" -> (maxScreenHeight * 0.25).toInt()

            else -> {
              if (size.endsWith('%')) {
                val percent = size.trim('%').toDoubleOrNull()
                if (percent == null) {
                  0
                } else {
                  ((percent / 100) * maxScreenHeight).toInt()
                }
              } else {
                val fixedHeight = size.toDoubleOrNull()
                if (fixedHeight == null) {
                  0
                } else {
                  Utils.toPixel(fixedHeight)
                }
              }
            }
          }
        }

        else -> (maxScreenHeight * 0.5).toInt()
      }

    return minOf(height, maxSheetHeight ?: maxScreenHeight)
  }

  /**
   * Determines the state based on the given size index.
   */
  private fun getStateForSizeIndex(index: Int) =
    when (sizes.size) {
      1 -> BottomSheetBehavior.STATE_EXPANDED

      2 -> {
        when (index) {
          0 -> BottomSheetBehavior.STATE_COLLAPSED
          1 -> BottomSheetBehavior.STATE_EXPANDED
          else -> BottomSheetBehavior.STATE_HIDDEN
        }
      }

      3 -> {
        when (index) {
          0 -> BottomSheetBehavior.STATE_COLLAPSED
          1 -> BottomSheetBehavior.STATE_HALF_EXPANDED
          2 -> BottomSheetBehavior.STATE_EXPANDED
          else -> BottomSheetBehavior.STATE_HIDDEN
        }
      }

      else -> BottomSheetBehavior.STATE_HIDDEN
    }

  /**
   * Configure the sheet based on size preferences.
   */
  fun configure() {
    // Update the usable sheet height
    maxScreenHeight = Utils.screenHeight(reactContext)

    var contentHeight = 0

    contentView?.let { contentHeight = it.height }
    footerView?.let { contentHeight += it.height }

    // Configure sheet sizes
    behavior.apply {
      skipCollapsed = false
      isFitToContents = true

      // m3 max width 640dp
      maxWidth = Utils.toPixel(640.0)

      when (sizes.size) {
        1 -> {
          maxHeight = getSizeHeight(sizes[0], contentHeight)
          peekHeight = maxHeight
          skipCollapsed = true
        }

        2 -> {
          peekHeight = getSizeHeight(sizes[0], contentHeight)
          maxHeight = getSizeHeight(sizes[1], contentHeight)
        }

        3 -> {
          // Enables half expanded
          isFitToContents = false

          peekHeight = getSizeHeight(sizes[0], contentHeight)
          halfExpandedRatio = getSizeHeight(sizes[1], contentHeight).toFloat() / maxScreenHeight.toFloat()
          maxHeight = getSizeHeight(sizes[2], contentHeight)
        }
      }
    }
  }

  /**
   * Get the SizeInfo data by state.
   */
  fun getSizeInfoForState(state: Int): SizeInfo? =
    when (sizes.size) {
      1 -> {
        when (state) {
          BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(0, Utils.toDIP(behavior.maxHeight))
          else -> null
        }
      }

      2 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(behavior.peekHeight))
          BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(1, Utils.toDIP(behavior.maxHeight))
          else -> null
        }
      }

      3 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(behavior.peekHeight))

          BottomSheetBehavior.STATE_HALF_EXPANDED -> {
            val height = behavior.halfExpandedRatio * maxScreenHeight
            SizeInfo(1, Utils.toDIP(height.toInt()))
          }

          BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(2, Utils.toDIP(behavior.maxHeight))

          else -> null
        }
      }

      else -> null
    }

  /**
   * Get SizeInfo data for given size index.
   */
  fun getSizeInfoForIndex(index: Int) = getSizeInfoForState(getStateForSizeIndex(index)) ?: SizeInfo(0, 0f)

  /**
   * Set the state based on the given size index.
   */
  fun setStateForSizeIndex(index: Int) {
    behavior.state = getStateForSizeIndex(index)
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
