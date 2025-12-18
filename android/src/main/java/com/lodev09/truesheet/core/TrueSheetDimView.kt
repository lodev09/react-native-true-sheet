package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.Outline
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import com.facebook.react.uimanager.ThemedReactContext
import com.lodev09.truesheet.utils.ScreenUtils

@SuppressLint("ViewConstructor")
class TrueSheetDimView(private val reactContext: ThemedReactContext) : View(reactContext) {

  companion object {
    private const val MAX_ALPHA = 0.5f
  }

  private var targetView: ViewGroup? = null

  init {
    layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )
    setBackgroundColor(Color.BLACK)
    alpha = 0f
  }

  fun attach(view: ViewGroup? = null, cornerRadius: Float = 0f) {
    if (parent != null) return
    targetView = view ?: reactContext.currentActivity?.window?.decorView as? ViewGroup

    if (cornerRadius > 0f) {
      outlineProvider = object : ViewOutlineProvider() {
        override fun getOutline(v: View, outline: Outline) {
          outline.setRoundRect(0, 0, v.width, v.height, cornerRadius)
        }
      }
      clipToOutline = true
    }

    targetView?.addView(this)
  }

  fun detach() {
    targetView?.removeView(this)
    targetView = null
  }

  fun calculateAlpha(sheetTop: Int, dimmedDetentIndex: Int, getSheetTopForDetentIndex: (Int) -> Int): Float {
    val realHeight = ScreenUtils.getRealScreenHeight(reactContext)
    val dimmedDetentTop = getSheetTopForDetentIndex(dimmedDetentIndex)
    val belowDimmedTop = if (dimmedDetentIndex > 0) getSheetTopForDetentIndex(dimmedDetentIndex - 1) else realHeight

    return when {
      sheetTop <= dimmedDetentTop -> MAX_ALPHA
      sheetTop >= belowDimmedTop -> 0f
      else -> {
        val progress = 1f - (sheetTop - dimmedDetentTop).toFloat() / (belowDimmedTop - dimmedDetentTop)
        (progress * MAX_ALPHA).coerceIn(0f, MAX_ALPHA)
      }
    }
  }

  fun interpolateAlpha(sheetTop: Int, dimmedDetentIndex: Int, getSheetTopForDetentIndex: (Int) -> Int) {
    alpha = calculateAlpha(sheetTop, dimmedDetentIndex, getSheetTopForDetentIndex)
  }
}
