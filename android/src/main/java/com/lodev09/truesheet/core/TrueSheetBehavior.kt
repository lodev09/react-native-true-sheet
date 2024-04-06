package com.lodev09.truesheet.core

import android.util.Log
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.bridge.ReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior

data class SizeInfo(val index: Int, val value: Float)

class TrueSheetBehavior(private val reactContext: ReactContext) : BottomSheetBehavior<ViewGroup>() {
  private var keyboardManager = KeyboardManager(reactContext)

  var maxScreenHeight: Int = 0
  var maxSheetHeight: Int? = null

  var contentView: ViewGroup? = null
  var footerView: ViewGroup? = null
  var sheetView: ViewGroup? = null

  var sizes: Array<Any> = arrayOf("medium", "large")

  override fun onInterceptTouchEvent(parent: CoordinatorLayout, child: ViewGroup, event: MotionEvent): Boolean {
    contentView?.let {
      val isDownEvent = (event.actionMasked == MotionEvent.ACTION_DOWN)
      val expanded = state == STATE_EXPANDED

      if (isDownEvent && expanded) {
        for (i in 0 until it.childCount) {
          val contentChild = it.getChildAt(i)
          val scrolled = (contentChild is ScrollView && contentChild.scrollY > 0)

          if (!scrolled) continue
          if (isInsideSheet(contentChild as ScrollView, event)) {
            return false
          }
        }
      }
    }

    return super.onInterceptTouchEvent(parent, child, event)
  }

  private fun isInsideSheet(scrollView: ScrollView, event: MotionEvent): Boolean {
    val x = event.x
    val y = event.y

    val position = IntArray(2)
    scrollView.getLocationOnScreen(position)

    val nestedX = position[0]
    val nestedY = position[1]

    val boundRight = nestedX + scrollView.width
    val boundBottom = nestedY + scrollView.height

    return (x > nestedX && x < boundRight && y > nestedY && y < boundBottom) ||
      event.action == MotionEvent.ACTION_CANCEL
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
      1 -> STATE_EXPANDED

      2 -> {
        when (index) {
          0 -> STATE_COLLAPSED
          1 -> STATE_EXPANDED
          else -> STATE_HIDDEN
        }
      }

      3 -> {
        when (index) {
          0 -> STATE_COLLAPSED
          1 -> STATE_HALF_EXPANDED
          2 -> STATE_EXPANDED
          else -> STATE_HIDDEN
        }
      }

      else -> STATE_HIDDEN
    }

  /**
   * Handle keyboard state changes and adjust maxScreenHeight (sheet max height) accordingly.
   * Also update footer's Y position.
   */
  fun registerKeyboardManager() {
    keyboardManager.registerKeyboardListener(object : KeyboardManager.OnKeyboardListener {
      override fun onKeyboardStateChange(isVisible: Boolean) {
        Log.d(TAG, isVisible.toString())
        maxScreenHeight = Utils.activityView(reactContext)?.height ?: 0
        footerView?.apply {
          y = (maxScreenHeight - (sheetView?.top ?: 0) - height).toFloat()
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
   * Configure the sheet based on size preferences.
   */
  fun configure() {
    // Update the usable sheet height
    maxScreenHeight = Utils.activityView(reactContext)?.height ?: 0

    var contentHeight = 0

    contentView?.let { contentHeight = it.height }
    footerView?.let { contentHeight += it.height }

    // Configure sheet sizes
    apply {
      skipCollapsed = false
      isFitToContents = true

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
          STATE_EXPANDED -> SizeInfo(0, Utils.toDIP(maxHeight))
          else -> null
        }
      }

      2 -> {
        when (state) {
          STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(peekHeight))
          STATE_EXPANDED -> SizeInfo(1, Utils.toDIP(maxHeight))
          else -> null
        }
      }

      3 -> {
        when (state) {
          STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(peekHeight))

          STATE_HALF_EXPANDED -> {
            val height = halfExpandedRatio * maxScreenHeight
            SizeInfo(1, Utils.toDIP(height.toInt()))
          }

          STATE_EXPANDED -> SizeInfo(2, Utils.toDIP(maxHeight))

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
    state = getStateForSizeIndex(index)
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
