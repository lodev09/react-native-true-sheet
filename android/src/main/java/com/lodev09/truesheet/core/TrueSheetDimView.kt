package com.lodev09.truesheet.core

import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import com.facebook.react.uimanager.ThemedReactContext

/**
 * A full-screen dim overlay view with precise alpha control.
 * Unlike WindowManager's FLAG_DIM_BEHIND, this allows smooth interpolation
 * to fully transparent without Android's non-linear rendering at tiny values.
 */
class TrueSheetDimView(private val reactContext: ThemedReactContext) : View(reactContext) {

  companion object {
    private const val DIM_COLOR = Color.BLACK
  }

  private var targetView: ViewGroup? = null

  init {
    layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )
    setBackgroundColor(DIM_COLOR)
    alpha = 0f
  }

  fun setDimAlpha(dimAmount: Float) {
    alpha = dimAmount.coerceIn(0f, 1f)
  }

  /** Attaches to the given view, or falls back to activity's decor view. */
  fun attach(view: ViewGroup? = null) {
    if (parent != null) return
    targetView = view ?: reactContext.currentActivity?.window?.decorView as? ViewGroup
    targetView?.addView(this)
  }

  fun detach() {
    targetView?.removeView(this)
    targetView = null
  }
}
