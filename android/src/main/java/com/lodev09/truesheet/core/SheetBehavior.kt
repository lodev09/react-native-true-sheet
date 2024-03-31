package com.lodev09.truesheet.core

import android.graphics.Point
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.uimanager.PixelUtil
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lodev09.truesheet.utils.toDIP

data class SizeInfo(val index: Int, val value: Float)

class SheetBehavior<T : ViewGroup> : BottomSheetBehavior<T>() {
  var maxSize: Point = Point()

  var contentView: ViewGroup? = null
  var footerView: ViewGroup? = null

  override fun onInterceptTouchEvent(parent: CoordinatorLayout, child: T, event: MotionEvent): Boolean {
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

  private fun getSizeHeight(size: Any, contentHeight: Int): Int {
    val maxHeight = maxSize.y

    val height =
      when (size) {
        is Double -> PixelUtil.toPixelFromDIP(size).toInt()

        is Int -> PixelUtil.toPixelFromDIP(size.toDouble()).toInt()

        is String -> {
          return when (size) {
            "auto" -> contentHeight

            "large" -> maxHeight

            "medium" -> (maxHeight * 0.50).toInt()

            "small" -> (maxHeight * 0.25).toInt()

            else -> {
              if (size.endsWith('%')) {
                val percent = size.trim('%').toDoubleOrNull()
                return if (percent == null) {
                  0
                } else {
                  ((percent / 100) * maxHeight).toInt()
                }
              } else {
                val fixedHeight = size.toDoubleOrNull()
                return if (fixedHeight == null) {
                  0
                } else {
                  PixelUtil.toPixelFromDIP(fixedHeight).toInt()
                }
              }
            }
          }
        }

        else -> (maxHeight * 0.5).toInt()
      }

    return minOf(height, maxHeight)
  }

  fun configure(sizes: Array<Any>) {
    var contentHeight = 0

    contentView?.let { contentHeight = it.height }
    footerView?.let { contentHeight += it.height }

    // Configure sheet sizes
    apply {
      isFitToContents = true
      isHideable = true
      skipCollapsed = false

      when (sizes.size) {
        1 -> {
          maxHeight = getSizeHeight(sizes[0], contentHeight)
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
          halfExpandedRatio = getSizeHeight(sizes[1], contentHeight).toFloat() / maxSize.y.toFloat()
          maxHeight = getSizeHeight(sizes[2], contentHeight)
        }
      }
    }
  }

  fun getSizeInfoForState(sizeCount: Int, state: Int): SizeInfo? =
    when (sizeCount) {
      1 -> {
        when (state) {
          STATE_EXPANDED -> SizeInfo(0, PixelUtil.toDIPFromPixel(maxHeight.toFloat()))
          else -> null
        }
      }

      2 -> {
        when (state) {
          STATE_COLLAPSED -> SizeInfo(0, toDIP(peekHeight))
          STATE_EXPANDED -> SizeInfo(1, toDIP(maxHeight))
          else -> null
        }
      }

      3 -> {
        when (state) {
          STATE_COLLAPSED -> SizeInfo(0, toDIP(peekHeight))

          STATE_HALF_EXPANDED -> {
            val height = halfExpandedRatio * maxSize.y
            SizeInfo(1, toDIP(height.toInt()))
          }

          STATE_EXPANDED -> SizeInfo(2, toDIP(maxHeight))

          else -> null
        }
      }

      else -> null
    }

  fun setStateForSizeIndex(sizeCount: Int, index: Int) {
    state =
      when (sizeCount) {
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
  }
}
