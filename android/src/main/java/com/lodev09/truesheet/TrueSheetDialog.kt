package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.KeyboardManager
import com.lodev09.truesheet.core.RootSheetView
import com.lodev09.truesheet.core.Utils

data class SizeInfo(val index: Int, val value: Float)

@SuppressLint("ClickableViewAccessibility")
class TrueSheetDialog(private val reactContext: ThemedReactContext, private val rootSheetView: RootSheetView) :
  BottomSheetDialog(reactContext) {

  private var keyboardManager = KeyboardManager(reactContext)
  private var sheetView: ViewGroup
  private var windowAnimation: Int = 0

  /**
   * Specify whether the sheet background is dimmed.
   * Set to `false` to allow interaction with the background components.
   */
  var dimmed = true

  /**
   * The size index that the sheet should start to dim the background.
   * This is ignored if `dimmed` is set to `false`.
   */
  var dimmedIndex = 0

  /**
   * The maximum window height
   */
  var maxScreenHeight = 0
  var contentHeight = 0
  var footerHeight = 0
  var maxSheetHeight: Int? = null

  var dismissible: Boolean = true
    set(value) {
      field = value
      setCanceledOnTouchOutside(value)
      setCancelable(value)

      behavior.isHideable = value
    }

  var footerView: ViewGroup? = null

  var sizes: Array<Any> = arrayOf("medium", "large")

  init {
    setContentView(rootSheetView)
    sheetView = rootSheetView.parent as ViewGroup
    sheetView.setBackgroundColor(Color.TRANSPARENT)

    // Setup window params to adjust layout based on Keyboard state
    window?.apply {
      // SOFT_INPUT_ADJUST_RESIZE to resize the sheet above the keyboard
      setSoftInputMode(
        WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
      )

      // Store current windowAnimation value to toggle later
      windowAnimation = attributes.windowAnimations
    }

    // Update the usable sheet height
    maxScreenHeight = Utils.screenHeight(reactContext)
  }

  /**
   * Setup dimmed sheet.
   * `dimmedIndex` will further customize the dimming behavior.
   */
  fun setupDimmedBackground(sizeIndex: Int) {
    window?.apply {
      val view = findViewById<View>(com.google.android.material.R.id.touch_outside)

      if (dimmed && sizeIndex >= dimmedIndex) {
        // Remove touch listener
        view.setOnTouchListener(null)

        // Add the dimmed background
        setFlags(
          WindowManager.LayoutParams.FLAG_DIM_BEHIND,
          WindowManager.LayoutParams.FLAG_DIM_BEHIND
        )

        setCanceledOnTouchOutside(dismissible)
      } else {
        // Override the background touch and pass it to the components outside
        view.setOnTouchListener { v, event ->
          event.setLocation(event.rawX - v.x, event.rawY - v.y)
          reactContext.currentActivity?.dispatchTouchEvent(event)
          false
        }

        // Remove the dimmed background
        clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)

        setCanceledOnTouchOutside(false)
      }
    }
  }

  fun resetAnimation() {
    window?.apply {
      setWindowAnimations(windowAnimation)
    }
  }

  /**
   * Present the sheet.
   */
  fun present(sizeIndex: Int, animated: Boolean = true) {
    setupDimmedBackground(sizeIndex)
    if (isShowing) {
      setStateForSizeIndex(sizeIndex)
    } else {
      configure()
      setStateForSizeIndex(sizeIndex)

      if (!animated) {
        // Disable animation
        window?.setWindowAnimations(0)
      }

      show()
    }
  }

  fun positionFooter() {
    footerView?.apply {
      y = (maxScreenHeight - sheetView.top - footerHeight).toFloat()
    }
  }

  /**
   * Set the state based for the given size index.
   */
  private fun setStateForSizeIndex(index: Int) {
    behavior.state = getStateForSizeIndex(index)
  }

  /**
   * Get the height value based on the size config value.
   */
  private fun getSizeHeight(size: Any): Int {
    val height =
      when (size) {
        is Double -> Utils.toPixel(size)

        is Int -> Utils.toPixel(size.toDouble())

        is String -> {
          when (size) {
            "auto" -> contentHeight + footerHeight

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

    return maxSheetHeight?.let { minOf(height, it, maxScreenHeight) } ?: minOf(height, maxScreenHeight)
  }

  /**
   * Determines the state based from the given size index.
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
   * Handle keyboard state changes and adjust maxScreenHeight (sheet max height) accordingly.
   * Also update footer's Y position.
   */
  fun registerKeyboardManager() {
    keyboardManager.registerKeyboardListener(object : KeyboardManager.OnKeyboardChangeListener {
      override fun onKeyboardStateChange(isVisible: Boolean, visibleHeight: Int?) {
        maxScreenHeight = when (isVisible) {
          true -> visibleHeight ?: 0
          else -> Utils.screenHeight(reactContext)
        }

        positionFooter()
      }
    })
  }

  fun setOnSizeChangeListener(listener: RootSheetView.OnSizeChangeListener) {
    rootSheetView.setOnSizeChangeListener(listener)
  }

  /**
   * Remove keyboard listener.
   */
  fun unregisterKeyboardManager() {
    keyboardManager.unregisterKeyboardListener()
  }

  /**
   * Configure the sheet based from the size preference.
   */
  fun configure() {
    // Configure sheet sizes
    behavior.apply {
      skipCollapsed = false
      isFitToContents = true

      // m3 max width 640dp
      maxWidth = Utils.toPixel(640.0)

      when (sizes.size) {
        1 -> {
          maxHeight = getSizeHeight(sizes[0])
          skipCollapsed = true
        }

        2 -> {
          setPeekHeight(getSizeHeight(sizes[0]), isShowing)
          maxHeight = getSizeHeight(sizes[1])
        }

        3 -> {
          // Enables half expanded
          isFitToContents = false

          setPeekHeight(getSizeHeight(sizes[0]), isShowing)

          halfExpandedRatio = minOf(getSizeHeight(sizes[1]).toFloat() / maxScreenHeight.toFloat(), 1.0f)
          maxHeight = getSizeHeight(sizes[2])
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

  companion object {
    const val TAG = "TrueSheetView"
  }
}
