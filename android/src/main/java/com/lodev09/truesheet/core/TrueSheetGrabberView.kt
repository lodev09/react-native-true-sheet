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
 * Native grabber (drag handle) view for the bottom sheet.
 * Displays a small pill-shaped indicator at the top of the sheet.
 */
@SuppressLint("ViewConstructor")
class TrueSheetGrabberView(context: Context) : View(context) {

  companion object {
    private const val GRABBER_WIDTH = 32f // dp
    private const val GRABBER_HEIGHT = 4f // dp
    private const val GRABBER_TOP_MARGIN = 16f // dp
    private val GRABBER_COLOR = Color.argb((0.4 * 255).toInt(), 73, 69, 79) // #49454F @ 40%
  }

  init {
    layoutParams = FrameLayout.LayoutParams(
      GRABBER_WIDTH.dpToPx().toInt(),
      GRABBER_HEIGHT.dpToPx().toInt()
    ).apply {
      gravity = Gravity.CENTER_HORIZONTAL or Gravity.TOP
      topMargin = GRABBER_TOP_MARGIN.dpToPx().toInt()
    }

    background = GradientDrawable().apply {
      shape = GradientDrawable.RECTANGLE
      cornerRadius = (GRABBER_HEIGHT / 2).dpToPx()
      setColor(GRABBER_COLOR)
    }

    // High elevation to ensure grabber appears above content views
    elevation = 100f
  }
}
