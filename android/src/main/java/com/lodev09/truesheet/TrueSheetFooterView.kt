package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Footer view that holds the footer content
 * This is the second child of TrueSheetContainerView
 * Positioned absolutely at the bottom of the sheet
 */
class TrueSheetFooterView(context: Context) : ViewGroup(context) {

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  /**
   * The actual React footer content view (first child)
   */
  private val reactFooterView: View?
    get() = if (childCount > 0) getChildAt(0) else null

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int
  ) {
    // Layout the React footer view to fill this container
    reactFooterView?.let { footer ->
      footer.layout(0, 0, r - l, b - t)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    val maxHeight = MeasureSpec.getSize(heightMeasureSpec).takeIf { it > 0 }
      ?: (parent as? ViewGroup)?.height
      ?: resources.displayMetrics.heightPixels
    var measuredHeight = 0

    // Measure the React footer view with explicit dimensions
    reactFooterView?.let { footer ->
      measureChild(
        footer,
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(maxHeight, MeasureSpec.AT_MOST)
      )
      measuredHeight = footer.measuredHeight
    }

    setMeasuredDimension(width, measuredHeight)
  }

  /**
   * Request layout update on parent container and sheet dialog
   */
  override fun requestLayout() {
    super.requestLayout()

    // Propagate layout request up the hierarchy
    post {
      val maxHeight = (parent as? ViewGroup)?.height
        ?: resources.displayMetrics.heightPixels
      measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(maxHeight, MeasureSpec.AT_MOST)
      )
      layout(left, top, right, bottom)

      // Notify parent container
      (parent as? TrueSheetContainerView)?.requestLayout()
    }
  }
}
