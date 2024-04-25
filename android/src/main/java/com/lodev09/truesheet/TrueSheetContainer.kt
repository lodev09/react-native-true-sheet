package com.lodev09.truesheet

import android.graphics.Color
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetBehavior.BottomSheetCallback
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.KeyboardManager
import com.lodev09.truesheet.core.RootSheetView
import com.lodev09.truesheet.core.Utils

data class SizeInfo(val index: Int, val value: Float)

class TrueSheetContainer(private val reactContext: ThemedReactContext, private val rootSheetView: RootSheetView) {

  private var keyboardManager = KeyboardManager(reactContext)
  private var sheetDialog: BottomSheetDialog? = null

  lateinit var onDismissListener: () -> Unit
  lateinit var onShowListener: () -> Unit
  lateinit var bottomSheetCallback: (BottomSheetCallback)
  lateinit var behavior: BottomSheetBehavior<FrameLayout>

  var dimmed = true

  var maxScreenHeight: Int = 0
  var contentHeight: Int = 0
  var footerHeight: Int = 0
  var maxSheetHeight: Int? = null

  var footerView: ViewGroup? = null

  var sizes: Array<Any> = arrayOf("medium", "large")

  private var sheetView: ViewGroup? = null

  val isShowing: Boolean
    get() = when (dimmed) {
      true -> sheetDialog?.isShowing == true
      else -> TODO()
    }

  init {
    // Update the usable sheet height
    maxScreenHeight = Utils.screenHeight(reactContext)
  }

  fun setup() {
    if (dimmed) {
      sheetDialog = BottomSheetDialog(reactContext)
      sheetDialog?.let {
        it.setContentView(rootSheetView)

        it.setOnShowListener {
          onShowListener()
        }

        it.setOnDismissListener {
          onDismissListener()
        }

        sheetView = rootSheetView.parent as ViewGroup
        sheetView?.setBackgroundColor(Color.TRANSPARENT)

        // Setup window params to adjust layout based on Keyboard state.
        it.window?.apply {
          // SOFT_INPUT_ADJUST_RESIZE to resize the sheet above the keyboard
          setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
          )
        }

        behavior = it.behavior
      }
    } else {
      TODO()
    }

    behavior.addBottomSheetCallback(bottomSheetCallback)
  }

  fun show(sizeIndex: Int) {
    if (isShowing) {
      setStateForSizeIndex(sizeIndex)
    } else {
      configure()
      setStateForSizeIndex(sizeIndex)

      when (dimmed) {
        true -> sheetDialog?.show()
        else -> TODO()
      }
    }
  }

  fun dismiss() {
    when (dimmed) {
      true -> sheetDialog?.dismiss()
      else -> TODO()
    }
  }

  fun positionFooter() {
    footerView?.apply {
      y = (maxScreenHeight - (sheetView?.top ?: 0) - footerHeight).toFloat()
    }
  }

  fun setDismissible(dismissible: Boolean) {
    when (dimmed) {
      true -> {
        behavior.isHideable = dismissible
        sheetDialog?.setCancelable(dismissible)
      }

      else -> TODO()
    }
  }

  /**
   * Set the state based on the given size index.
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

    return when (maxSheetHeight) {
      null -> height
      else -> minOf(height, maxSheetHeight ?: maxScreenHeight)
    }
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
   * Handle keyboard state changes and adjust maxScreenHeight (sheet max height) accordingly.
   * Also update footer's Y position.
   */
  fun registerKeyboardManager() {
    keyboardManager.registerKeyboardListener(object : KeyboardManager.OnKeyboardListener {
      override fun onKeyboardStateChange(isVisible: Boolean, visibleHeight: Int?) {
        maxScreenHeight = when (isVisible) {
          true -> visibleHeight ?: 0
          else -> Utils.screenHeight(reactContext)
        }

        positionFooter()
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
   * Configure the sheet based on size preferences.
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
          halfExpandedRatio = getSizeHeight(sizes[1]).toFloat() / maxScreenHeight.toFloat()
          maxHeight = getSizeHeight(sizes[2])
        }
      }
    }
  }

  /**
   * Get the SizeInfo data by state.
   */
  fun getSizeInfoForState(state: Int): SizeInfo? {
    behavior.apply {
      return when (sizes.size) {
        1 -> {
          when (state) {
            BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(0, Utils.toDIP(maxHeight))
            else -> null
          }
        }

        2 -> {
          when (state) {
            BottomSheetBehavior.STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(peekHeight))
            BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(1, Utils.toDIP(maxHeight))
            else -> null
          }
        }

        3 -> {
          when (state) {
            BottomSheetBehavior.STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(peekHeight))

            BottomSheetBehavior.STATE_HALF_EXPANDED -> {
              val height = halfExpandedRatio * maxScreenHeight
              SizeInfo(1, Utils.toDIP(height.toInt()))
            }

            BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(2, Utils.toDIP(maxHeight))

            else -> null
          }
        }

        else -> null
      }
    }
  }

  /**
   * Get SizeInfo data for given size index.
   */
  fun getSizeInfoForIndex(index: Int) = getSizeInfoForState(getStateForSizeIndex(index)) ?: SizeInfo(0, 0f)

  companion object {
    const val TAG = "TrueSheetView"
  }
}
