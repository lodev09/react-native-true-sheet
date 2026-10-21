package com.lodev09.truesheet

import android.annotation.SuppressLint
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for footer view size changes
 */
interface TrueSheetFooterViewDelegate {
  fun footerViewDidChangeSize(width: Int, height: Int)
  fun footerViewDidLayout()
}

/**
 * Footer view that holds the footer content
 * This is the second child of TrueSheetContainerView
 * Positioned absolutely at the bottom of the sheet
 *
 * Touches reach it through the controller's RootView like any other sheet
 * content — the container tracks the sheet's visible height, so the footer
 * always lays out inside the container's bounds.
 */
@SuppressLint("ViewConstructor")
class TrueSheetFooterView(reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {

  var delegate: TrueSheetFooterViewDelegate? = null
  var stateWrapper: StateWrapper? = null

  private var lastWidth = 0
  private var lastHeight = 0
  private var stateTranslationY = 0f

  var bottomInset = 0
    private set

  /**
   * positionFooter slides the footer off its Yoga position (above the
   * keyboard, or riding the sheet). Mirror where it rests into the shadow
   * node so measure() — and Pressability's press region — match where it's
   * drawn. Called once the footer settles: every push is a commit.
   */
  fun syncTranslationState() {
    if (translationY == stateTranslationY) return
    val sw = stateWrapper ?: return
    stateTranslationY = translationY
    TrueSheetStateUpdater.updateFooterTranslation(sw, translationY.pxToDp())
  }

  /**
   * Height the footer occupies above the keyboard — its layout height minus
   * the safe-area inset, which rides below the keyboard's top edge while the
   * keyboard is open (see positionFooter).
   */
  val keyboardOcclusionHeight: Int
    get() = maxOf(0, height - bottomInset)

  /**
   * Tells the shadow node to pad the footer's bottom edge with the sheet's
   * bottom safe-area inset — the footer owns the sheet's bottom edge, so it
   * absorbs the inset and its background fills it.
   */
  fun setBottomInset(inset: Int) {
    if (bottomInset == inset) return
    bottomInset = inset

    val sw = stateWrapper ?: return
    val insetDp = bottomInset.toFloat().pxToDp()
    // Carried along — this update replaces a still-queued translation update
    stateTranslationY = translationY
    val translateYDp = translationY.pxToDp()

    // Synchronous update — the footer must be padded before detents are
    // configured, otherwise the auto detent is set up an inset short
    if (TrueSheetStateUpdater.updateFooterState(sw, insetDp, translateYDp)) return

    // Fallback: async state update
    val newState = WritableNativeMap()
    newState.putDouble("bottomInset", insetDp.toDouble())
    newState.putDouble("translateY", translateYDp.toDouble())
    sw.updateState(newState)
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w != lastWidth || h != lastHeight) {
      lastWidth = w
      lastHeight = h
      delegate?.footerViewDidChangeSize(w, h)
    }
  }

  override fun onLayout(
    changed: Boolean,
    left: Int,
    top: Int,
    right: Int,
    bottom: Int
  ) {
    super.onLayout(changed, left, top, right, bottom)
    delegate?.footerViewDidLayout()
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
