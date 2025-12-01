package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.uimanager.PixelUtil.dpToPx

/**
 * Options for customizing the grabber appearance.
 */
data class GrabberOptions(
  val width: Float? = null,
  val height: Float? = null,
  val topMargin: Float? = null,
  val cornerRadius: Float? = null,
  val color: Int? = null
)

/**
 * Native grabber (drag handle) view for the bottom sheet.
 * Displays a small pill-shaped indicator at the top of the sheet.
 */
@SuppressLint("ViewConstructor")
class TrueSheetGrabberView(
  context: Context,
  private val options: GrabberOptions? = null
) : View(context) {

  companion object {
    private const val DEFAULT_WIDTH = 32f // dp
    private const val DEFAULT_HEIGHT = 4f // dp
    private const val DEFAULT_TOP_MARGIN = 16f // dp
    private val DEFAULT_COLOR = Color.argb((0.4 * 255).toInt(), 73, 69, 79) // #49454F @ 40%
  }

  private val grabberWidth: Float
    get() = options?.width ?: DEFAULT_WIDTH

  private val grabberHeight: Float
    get() = options?.height ?: DEFAULT_HEIGHT

  private val grabberTopMargin: Float
    get() = options?.topMargin ?: DEFAULT_TOP_MARGIN

  private val grabberCornerRadius: Float
    get() = options?.cornerRadius ?: (grabberHeight / 2)

  private val grabberColor: Int
    get() = options?.color ?: DEFAULT_COLOR

  init {
    layoutParams = FrameLayout.LayoutParams(
      grabberWidth.dpToPx().toInt(),
      grabberHeight.dpToPx().toInt()
    ).apply {
      gravity = Gravity.CENTER_HORIZONTAL or Gravity.TOP
      topMargin = grabberTopMargin.dpToPx().toInt()
    }

    background = GradientDrawable().apply {
      shape = GradientDrawable.RECTANGLE
      cornerRadius = grabberCornerRadius.dpToPx()
      setColor(grabberColor)
    }

    // High elevation to ensure grabber appears above content views
    elevation = 100f
  }
}
