package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import androidx.core.graphics.ColorUtils
import com.facebook.react.uimanager.PixelUtil.dpToPx

/**
 * Options for customizing the grabber appearance.
 */
data class GrabberOptions(
  val width: Float? = null,
  val height: Float? = null,
  val topMargin: Float? = null,
  val cornerRadius: Float? = null,
  val color: Int? = null,
  val adaptive: Boolean = true
)

/**
 * Native grabber (drag handle) view for the bottom sheet.
 * Displays a small pill-shaped indicator at the top of the sheet.
 */
@SuppressLint("ViewConstructor")
class TrueSheetGrabberView(context: Context, private val options: GrabberOptions? = null) : View(context) {

  companion object {
    private const val DEFAULT_WIDTH = 32f // dp
    private const val DEFAULT_HEIGHT = 4f // dp
    private const val DEFAULT_TOP_MARGIN = 16f // dp
    private const val DEFAULT_ALPHA = 0.4f
    private val DEFAULT_COLOR = Color.argb((DEFAULT_ALPHA * 255).toInt(), 73, 69, 79) // #49454F @ 40%
  }

  private val grabberWidth: Float
    get() = options?.width ?: DEFAULT_WIDTH

  private val grabberHeight: Float
    get() = options?.height ?: DEFAULT_HEIGHT

  private val grabberTopMargin: Float
    get() = options?.topMargin ?: DEFAULT_TOP_MARGIN

  private val grabberCornerRadius: Float
    get() = options?.cornerRadius ?: (grabberHeight / 2)

  private val isAdaptive: Boolean
    get() = options?.adaptive ?: true

  private val grabberColor: Int
    get() = if (isAdaptive) getAdaptiveColor(options?.color) else options?.color ?: DEFAULT_COLOR

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

  private fun getAdaptiveColor(baseColor: Int? = null): Int {
    val nightMode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    val isDarkMode = nightMode == Configuration.UI_MODE_NIGHT_YES
    val modeColor = if (isDarkMode) Color.WHITE else Color.BLACK

    return if (baseColor != null) {
      // Blend user color with mode color for adaptive effect
      val blendedColor = ColorUtils.blendARGB(baseColor, modeColor, 0.3f)
      ColorUtils.setAlphaComponent(blendedColor, (DEFAULT_ALPHA * 255).toInt())
    } else {
      ColorUtils.setAlphaComponent(modeColor, (DEFAULT_ALPHA * 255).toInt())
    }
  }
}
