package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Content view that holds the main sheet content
 * This is the first child of TrueSheetContainerView
 */
class TrueSheetContentView(context: Context) : ViewGroup(context) {

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  /**
   * The actual React content view (first child)
   */
  private val reactContentView: View?
    get() = if (childCount > 0) getChildAt(0) else null

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int
  ) {
    // Layout the React content view to fill this container
    reactContentView?.let { content ->
      content.layout(0, 0, r - l, b - t)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    var maxHeight = 0

    // Measure the React content view
    reactContentView?.let { content ->
      measureChild(
        content,
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      )
      maxHeight = content.measuredHeight
    }

    setMeasuredDimension(width, maxHeight)
  }

  /**
   * Request layout update on parent container and sheet dialog
   */
  override fun requestLayout() {
    super.requestLayout()

    // Propagate layout request up the hierarchy
    post {
      measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      )
      layout(left, top, right, bottom)

      // Notify parent container
      (parent as? TrueSheetContainerView)?.requestLayout()
    }
  }
}
