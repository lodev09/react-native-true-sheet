package com.lodev09.truesheet.core

import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import com.facebook.react.uimanager.ThemedReactContext
import com.lodev09.truesheet.utils.ScreenUtils

/**
 * A full-screen dim overlay view with precise alpha control.
 * Unlike WindowManager's FLAG_DIM_BEHIND, this allows smooth interpolation
 * to fully transparent without Android's non-linear rendering at tiny values.
 */
class TrueSheetDimView(private val reactContext: ThemedReactContext) : View(reactContext) {

  companion object {
    private const val DIM_COLOR = Color.BLACK
    private const val MAX_DIM_AMOUNT = 0.4f
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

  /** Animates dim alpha during present/dismiss transitions. */
  fun animateAlpha(show: Boolean, duration: Long, dimmedDetentIndex: Int, currentDetentIndex: Int) {
    val targetAlpha = if (show && currentDetentIndex >= dimmedDetentIndex) MAX_DIM_AMOUNT else 0f
    animate()
      .alpha(targetAlpha)
      .setDuration(duration)
      .start()
  }

  /** Interpolates alpha based on sheet position during drag. */
  fun interpolateAlpha(sheetTop: Int, dimmedDetentIndex: Int, getSheetTopForDetentIndex: (Int) -> Int) {
    val realHeight = ScreenUtils.getRealScreenHeight(reactContext)

    // Get the top position for dimmedDetentIndex (where dim should start)
    val dimmedDetentTop = getSheetTopForDetentIndex(dimmedDetentIndex)

    // Get the position below dimmedDetentIndex (where dim should be 0)
    val belowDimmedTop = if (dimmedDetentIndex > 0) {
      getSheetTopForDetentIndex(dimmedDetentIndex - 1)
    } else {
      realHeight // hidden
    }

    // Interpolate dim based on position relative to dimmedDetentIndex
    val dimAmount = when {
      // At or above dimmedDetentIndex = MAX_DIM_AMOUNT
      sheetTop <= dimmedDetentTop -> MAX_DIM_AMOUNT
      // Below the threshold where dim should be 0
      sheetTop >= belowDimmedTop -> 0f
      // Between dimmedDetentIndex and below = interpolate
      else -> {
        val totalDistance = belowDimmedTop - dimmedDetentTop
        val currentDistance = sheetTop - dimmedDetentTop
        val progress = 1f - (currentDistance.toFloat() / totalDistance.toFloat())
        (progress * MAX_DIM_AMOUNT).coerceIn(0f, MAX_DIM_AMOUNT)
      }
    }

    alpha = dimAmount
  }
}
