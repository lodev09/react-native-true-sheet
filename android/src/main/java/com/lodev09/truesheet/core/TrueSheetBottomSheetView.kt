package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Rect
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.util.TypedValue
import android.view.GestureDetector
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.transition.TransitionManager
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lodev09.truesheet.TrueSheetAnchor
import com.lodev09.truesheet.utils.ScreenUtils

interface TrueSheetBottomSheetViewDelegate {
  val isTopmostSheet: Boolean
  val sheetCornerRadius: Float
  val sheetElevation: Float
  val sheetBackgroundColor: Int?
  val maxContentWidth: Int?
  val anchor: TrueSheetAnchor
  val anchorOffset: Int
  val grabber: Boolean
  val grabberOptions: GrabberOptions?
  val draggable: Boolean
  fun bottomSheetViewDidTapGrabber()
}

/**
 * The bottom sheet view that holds the content.
 * This view has BottomSheetBehavior attached via CoordinatorLayout.LayoutParams.
 *
 * Touch dispatching to React Native is handled by TrueSheetViewController,
 * which is the actual RootView containing the React content.
 */
@SuppressLint("ViewConstructor")
class TrueSheetBottomSheetView(private val reactContext: ThemedReactContext) : FrameLayout(reactContext) {

  companion object {
    private const val GRABBER_TAG = "TrueSheetGrabber"
    private const val DEFAULT_CORNER_RADIUS = 16f // dp
    private const val DEFAULT_MAX_WIDTH = 640 // dp
    private const val DEFAULT_ELEVATION = 4f // dp
  }

  // =============================================================================
  // MARK: - Properties
  // =============================================================================

  var delegate: TrueSheetBottomSheetViewDelegate? = null

  // Behavior reference (set after adding to CoordinatorLayout)
  @Suppress("UNCHECKED_CAST")
  val behavior: BottomSheetBehavior<TrueSheetBottomSheetView>?
    get() = (layoutParams as? CoordinatorLayout.LayoutParams)
      ?.behavior as? BottomSheetBehavior<TrueSheetBottomSheetView>

  // =============================================================================
  // MARK: - Initialization
  // =============================================================================

  init {
    // Allow content to extend beyond bounds (for footer positioning)
    clipChildren = false
    clipToPadding = false
  }

  override fun setTranslationY(translationY: Float) {
    // This prevents keyboard inset animations from resetting parent sheet translation
    if (translationY == 0f && this.translationY != 0f) {
      return
    }
    super.setTranslationY(translationY)
  }

  // =============================================================================
  // MARK: - Layout
  // =============================================================================

  private fun resolveAnchor(): Pair<Int, Int> {
    val anchor = if (ScreenUtils.isPortraitPhone(reactContext)) null else delegate?.anchor
    val gravity = when (anchor) {
      TrueSheetAnchor.LEFT -> Gravity.START
      TrueSheetAnchor.RIGHT -> Gravity.END
      else -> Gravity.CENTER_HORIZONTAL
    } or Gravity.BOTTOM
    val margin = if (anchor == TrueSheetAnchor.LEFT || anchor == TrueSheetAnchor.RIGHT) delegate?.anchorOffset ?: 0 else 0
    return Pair(gravity, margin)
  }

  /**
   * Creates layout params with BottomSheetBehavior attached.
   */
  fun createLayoutParams(): CoordinatorLayout.LayoutParams {
    val applyMaxWidth = delegate?.maxContentWidth != null && !ScreenUtils.isPortraitPhone(reactContext)
    val effectiveMaxWidth = if (applyMaxWidth) delegate!!.maxContentWidth!! else DEFAULT_MAX_WIDTH.dpToPx().toInt()
    val behavior = BottomSheetBehavior<TrueSheetBottomSheetView>().apply {
      isHideable = true
      maxWidth = effectiveMaxWidth
    }

    val (gravity, margin) = resolveAnchor()

    return CoordinatorLayout.LayoutParams(
      CoordinatorLayout.LayoutParams.MATCH_PARENT,
      CoordinatorLayout.LayoutParams.MATCH_PARENT
    ).apply {
      this.behavior = behavior
      this.gravity = gravity
      this.marginStart = margin
      this.marginEnd = margin
    }
  }

  fun updateGravity(animated: Boolean = true) {
    val params = layoutParams as? CoordinatorLayout.LayoutParams ?: return
    val (gravity, margin) = resolveAnchor()

    if (params.gravity == gravity && params.marginStart == margin) return

    if (animated) {
      (parent as? CoordinatorLayout)?.let { TransitionManager.beginDelayedTransition(it) }
    }

    params.gravity = gravity
    params.marginStart = margin
    params.marginEnd = margin
    layoutParams = params
  }

  // =============================================================================
  // MARK: - Background & Styling
  // =============================================================================

  fun setupBackground() {
    val radius = delegate?.sheetCornerRadius ?: DEFAULT_CORNER_RADIUS.dpToPx()
    val effectiveRadius = if (radius < 0) DEFAULT_CORNER_RADIUS.dpToPx() else radius

    val outerRadii = floatArrayOf(
      effectiveRadius,
      effectiveRadius, // top-left
      effectiveRadius,
      effectiveRadius, // top-right
      0f,
      0f, // bottom-right
      0f,
      0f // bottom-left
    )

    val color = delegate?.sheetBackgroundColor ?: getDefaultBackgroundColor()

    background = ShapeDrawable(RoundRectShape(outerRadii, null, null)).apply {
      paint.color = color
    }

    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        outline.setRoundRect(0, 0, view.width, view.height, effectiveRadius)
      }
    }
    clipToOutline = true
  }

  private fun getDefaultBackgroundColor(): Int {
    val typedValue = TypedValue()
    return if (reactContext.theme.resolveAttribute(
        com.google.android.material.R.attr.colorSurfaceContainerLow,
        typedValue,
        true
      )
    ) {
      typedValue.data
    } else {
      Color.WHITE
    }
  }

  fun setupElevation() {
    val value = delegate?.sheetElevation ?: DEFAULT_ELEVATION
    val effectiveElevation = if (value < 0) DEFAULT_ELEVATION else value
    elevation = effectiveElevation.dpToPx()
  }

  // =============================================================================
  // MARK: - Grabber
  // =============================================================================

  fun setupGrabber() {
    findViewWithTag<View>(GRABBER_TAG)?.let { removeView(it) }

    val isEnabled = delegate?.grabber ?: true
    val isDraggable = delegate?.draggable ?: true
    if (!isEnabled || !isDraggable) return

    val grabberView = TrueSheetGrabberView(reactContext, delegate?.grabberOptions).apply {
      tag = GRABBER_TAG
    }

    addView(grabberView)
  }

  // =============================================================================
  // MARK: - Grabber Tap Detection
  // =============================================================================

  private val grabberTapDetector = GestureDetector(
    context,
    object : GestureDetector.SimpleOnGestureListener() {
      override fun onSingleTapUp(e: MotionEvent): Boolean {
        delegate?.bottomSheetViewDidTapGrabber()
        return true
      }
    }
  )

  override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    val grabber = findViewWithTag<View>(GRABBER_TAG)
    if (grabber != null) {
      val rect = Rect()
      grabber.getHitRect(rect)
      if (rect.contains(ev.x.toInt(), ev.y.toInt())) {
        if (grabberTapDetector.onTouchEvent(ev)) {
          return true
        }
      }
    }
    return super.dispatchTouchEvent(ev)
  }
}
