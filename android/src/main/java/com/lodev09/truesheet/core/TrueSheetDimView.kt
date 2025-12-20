package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.Outline
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactPointerEventsView
import com.facebook.react.uimanager.ThemedReactContext
import com.lodev09.truesheet.utils.ScreenUtils

/**
 * Delegate for handling dim view interactions.
 */
interface TrueSheetDimViewDelegate {
  fun dimViewDidTap()
}

/**
 * Dim view that sits behind the bottom sheet in the CoordinatorLayout.
 *
 * Key behaviors:
 * - When alpha > 0 (dimmed): blocks touches and calls delegate on tap
 * - When alpha == 0 (not dimmed): passes touches through to views below
 *
 * This implements the "dimmedDetentIndex" equivalent functionality:
 * the view only becomes interactive when the sheet is at or above the dimmed detent.
 */
@SuppressLint("ViewConstructor", "ClickableViewAccessibility")
class TrueSheetDimView(private val reactContext: ThemedReactContext) :
  View(reactContext),
  ReactPointerEventsView {

  companion object {
    private const val MAX_ALPHA = 0.5f
  }

  var delegate: TrueSheetDimViewDelegate? = null
  var dismissible: Boolean = true

  private var targetView: ViewGroup? = null

  /**
   * Whether this view should block gestures (when dimmed).
   */
  private val blockGestures: Boolean
    get() = alpha > 0f

  init {
    layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )
    setBackgroundColor(Color.BLACK)
    alpha = 0f

    // Handle taps on the dim view
    setOnClickListener {
      if (dismissible) {
        delegate?.dimViewDidTap()
      }
    }
  }

  // =============================================================================
  // MARK: - Attachment
  // =============================================================================

  /**
   * Attaches this dim view to a target view group.
   * For CoordinatorLayout usage, pass null to use the default (activity's decor view).
   * For stacked sheets, pass the parent sheet's bottom sheet view with corner radius.
   */
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
    } else {
      outlineProvider = null
      clipToOutline = false
    }

    targetView?.addView(this)
  }

  /**
   * Attaches this dim view to a CoordinatorLayout at index 0 (behind the sheet).
   */
  fun attachToCoordinator(coordinator: TrueSheetCoordinatorLayout) {
    if (parent != null) return
    targetView = coordinator
    outlineProvider = null
    clipToOutline = false
    coordinator.addView(this, 0)
  }

  fun detach() {
    targetView?.removeView(this)
    targetView = null
  }

  // =============================================================================
  // MARK: - Alpha Calculation
  // =============================================================================

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

  // =============================================================================
  // MARK: - Touch Handling
  // =============================================================================

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (blockGestures) {
      // When dimmed, consume touch and trigger click on ACTION_UP
      if (event.action == MotionEvent.ACTION_UP) {
        performClick()
      }
      return true
    }
    // When not dimmed, let touches pass through
    return false
  }

  // =============================================================================
  // MARK: - ReactPointerEventsView
  // =============================================================================

  /**
   * When dimmed (alpha > 0), intercept touches (AUTO).
   * When not dimmed (alpha == 0), pass through (NONE).
   */
  override val pointerEvents: PointerEvents
    get() = if (blockGestures) PointerEvents.AUTO else PointerEvents.NONE
}
