package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.util.TypedValue
import android.view.View
import android.widget.FrameLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior

interface TrueSheetBottomSheetViewDelegate {
  val isTopmostSheet: Boolean
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
  }

  // =============================================================================
  // MARK: - Properties
  // =============================================================================

  // Configuration
  var sheetCornerRadius: Float = DEFAULT_CORNER_RADIUS.dpToPx()
  var sheetBackgroundColor: Int? = null
  var grabberEnabled: Boolean = true
  var grabberOptions: GrabberOptions? = null

  // Reference to the controller for checking state during layout
  var delegate: TrueSheetBottomSheetViewDelegate? = null

  // Behavior reference (set after adding to CoordinatorLayout)
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
    // Skip resetting translation to 0 for parent sheets (non-topmost)
    // This prevents keyboard inset animations from resetting parent sheet translation
    if (delegate?.isTopmostSheet == false && translationY == 0f && this.translationY != 0f) {
      return
    }
    super.setTranslationY(translationY)
  }

  // =============================================================================
  // MARK: - Layout
  // =============================================================================

  /**
   * Creates layout params with BottomSheetBehavior attached.
   */
  fun createLayoutParams(): CoordinatorLayout.LayoutParams {
    val behavior = BottomSheetBehavior<TrueSheetBottomSheetView>().apply {
      isHideable = true
      maxWidth = DEFAULT_MAX_WIDTH.dpToPx().toInt()
    }

    return CoordinatorLayout.LayoutParams(
      CoordinatorLayout.LayoutParams.MATCH_PARENT,
      CoordinatorLayout.LayoutParams.MATCH_PARENT
    ).apply {
      this.behavior = behavior
    }
  }

  // =============================================================================
  // MARK: - Background & Styling
  // =============================================================================

  fun setupBackground() {
    val radius = if (sheetCornerRadius < 0) DEFAULT_CORNER_RADIUS.dpToPx() else sheetCornerRadius

    // Rounded corners only on top
    val outerRadii = floatArrayOf(
      radius,
      radius, // top-left
      radius,
      radius, // top-right
      0f,
      0f, // bottom-right
      0f,
      0f // bottom-left
    )

    val backgroundColor = sheetBackgroundColor ?: getDefaultBackgroundColor()

    background = ShapeDrawable(RoundRectShape(outerRadii, null, null)).apply {
      paint.color = backgroundColor
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

  // =============================================================================
  // MARK: - Grabber
  // =============================================================================

  fun setupGrabber() {
    // Remove existing grabber
    findViewWithTag<View>(GRABBER_TAG)?.let { removeView(it) }

    val isDraggable = behavior?.isDraggable ?: true
    if (!grabberEnabled || !isDraggable) return

    val grabberView = TrueSheetGrabberView(reactContext, grabberOptions).apply {
      tag = GRABBER_TAG
    }

    // Add grabber at the top of the sheet (index 0)
    addView(grabberView, 0)
  }
}
