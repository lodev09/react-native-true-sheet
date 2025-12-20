package com.lodev09.truesheet.core

import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.os.Bundle
import android.util.Log
import android.util.TypedValue
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.lodev09.truesheet.BuildConfig
import com.lodev09.truesheet.R
import com.lodev09.truesheet.utils.ScreenUtils

// =============================================================================
// MARK: - Delegate Protocol
// =============================================================================

interface TrueSheetDialogFragmentDelegate {
  fun onDialogCreated()
  fun onDialogShow()
  fun onDialogDismiss()
  fun onDialogCancel()
  fun onStateChanged(sheetView: View, newState: Int)
  fun onSlide(sheetView: View, slideOffset: Float)
  fun onBackPressed()
}

// =============================================================================
// MARK: - TrueSheetDialogFragment
// =============================================================================

/**
 * Custom BottomSheetDialogFragment for TrueSheet.
 * Provides a Material Design bottom sheet with proper lifecycle management.
 *
 * This fragment handles:
 * - Dialog creation with proper theming (edge-to-edge support)
 * - BottomSheetBehavior configuration and callbacks
 * - Background styling with corner radius
 * - Grabber view management
 * - Back press handling
 *
 * The parent TrueSheetViewController handles:
 * - React Native touch dispatching
 * - Detent calculations
 * - Animations
 * - Keyboard/modal observers
 * - Stacking and dimming
 */
class TrueSheetDialogFragment : BottomSheetDialogFragment() {

  companion object {
    private const val GRABBER_TAG = "TrueSheetGrabber"
    private const val DEFAULT_MAX_WIDTH = 640 // dp
    private const val DEFAULT_CORNER_RADIUS = 16f // dp

    fun newInstance(): TrueSheetDialogFragment = TrueSheetDialogFragment()
  }

  // =============================================================================
  // MARK: - Properties
  // =============================================================================

  var delegate: TrueSheetDialogFragmentDelegate? = null

  // Content view provided by the controller
  var contentView: View? = null

  // React context for theme resolution and screen utils
  var reactContext: ThemedReactContext? = null

  // Configuration
  var sheetCornerRadius: Float = DEFAULT_CORNER_RADIUS.dpToPx()
  var sheetBackgroundColor: Int? = null
  var edgeToEdgeFullScreen: Boolean = false
  var grabberEnabled: Boolean = true
  var grabberOptions: GrabberOptions? = null
  var draggable: Boolean = true

  var dismissible: Boolean = true
    set(value) {
      field = value
      (dialog as? BottomSheetDialog)?.apply {
        setCanceledOnTouchOutside(value)
        setCancelable(value)
        behavior.isHideable = value
      }
    }

  // =============================================================================
  // MARK: - Computed Properties
  // =============================================================================

  val bottomSheetDialog: BottomSheetDialog?
    get() = dialog as? BottomSheetDialog

  val behavior: BottomSheetBehavior<FrameLayout>?
    get() = bottomSheetDialog?.behavior

  val bottomSheetView: FrameLayout?
    get() = dialog?.findViewById(com.google.android.material.R.id.design_bottom_sheet)

  private val edgeToEdgeEnabled: Boolean
    get() {
      val defaultEnabled = android.os.Build.VERSION.SDK_INT >= 36
      return BuildConfig.EDGE_TO_EDGE_ENABLED || bottomSheetDialog?.edgeToEdgeEnabled == true || defaultEnabled
    }

  val topInset: Int
    get() = reactContext?.let { if (edgeToEdgeEnabled) ScreenUtils.getInsets(it).top else 0 } ?: 0

  // =============================================================================
  // MARK: - Lifecycle
  // =============================================================================

  override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
    val ctx = reactContext ?: requireContext()

    val style = if (edgeToEdgeEnabled) {
      R.style.TrueSheetEdgeToEdgeEnabledDialog
    } else {
      R.style.TrueSheetDialog
    }

    val dialog = BottomSheetDialog(ctx, style)

    dialog.window?.apply {
      setWindowAnimations(0)
      setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING)
      // Clear default dim - TrueSheet uses custom TrueSheetDimView for dimming
      clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
    }

    dialog.setOnShowListener {
      setupBottomSheetBehavior()
      setupBackground()
      setupGrabber()
      // Re-apply dismissible after show since behavior may reset it
      dialog.behavior.isHideable = dismissible

      delegate?.onDialogShow()
    }

    dialog.setCanceledOnTouchOutside(dismissible)
    dialog.setCancelable(dismissible)
    dialog.behavior.isHideable = dismissible
    dialog.behavior.isDraggable = draggable
    dialog.behavior.maxWidth = DEFAULT_MAX_WIDTH.dpToPx().toInt()

    // Handle back press - delegate to controller for animated dismiss
    dialog.onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          delegate?.onBackPressed()
        }
      }
    )

    return dialog
  }

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? = contentView

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    delegate?.onDialogCreated()
  }

  override fun onCancel(dialog: android.content.DialogInterface) {
    super.onCancel(dialog)
    delegate?.onDialogCancel()
  }

  override fun onDismiss(dialog: android.content.DialogInterface) {
    super.onDismiss(dialog)
    delegate?.onDialogDismiss()
  }

  override fun onDestroyView() {
    // Detach content view to prevent it from being destroyed with the fragment
    (contentView?.parent as? ViewGroup)?.removeView(contentView)
    super.onDestroyView()
  }

  // =============================================================================
  // MARK: - Setup
  // =============================================================================

  private fun setupBottomSheetBehavior() {
    val behavior = this.behavior ?: return

    behavior.addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
      override fun onSlide(sheetView: View, slideOffset: Float) {
        delegate?.onSlide(sheetView, slideOffset)
      }

      override fun onStateChanged(sheetView: View, newState: Int) {
        delegate?.onStateChanged(sheetView, newState)
      }
    })
  }

  fun setupBackground() {
    val bottomSheet = bottomSheetView ?: return
    val ctx = reactContext ?: return

    val radius = if (sheetCornerRadius < 0) DEFAULT_CORNER_RADIUS.dpToPx() else sheetCornerRadius

    // Rounded corners only on top
    val outerRadii = floatArrayOf(
      radius,
      radius,
      radius,
      radius,
      0f,
      0f,
      0f,
      0f
    )
    val backgroundColor = sheetBackgroundColor ?: getDefaultBackgroundColor(ctx)

    bottomSheet.background = ShapeDrawable(RoundRectShape(outerRadii, null, null)).apply {
      paint.color = backgroundColor
    }
    bottomSheet.clipToOutline = true
  }

  fun setupGrabber() {
    val bottomSheet = bottomSheetView ?: return
    val ctx = reactContext ?: return

    // Remove existing grabber
    bottomSheet.findViewWithTag<View>(GRABBER_TAG)?.let {
      bottomSheet.removeView(it)
    }

    if (!grabberEnabled || !draggable) return

    val grabberView = TrueSheetGrabberView(ctx, grabberOptions).apply {
      tag = GRABBER_TAG
    }

    bottomSheet.addView(grabberView)
  }

  // =============================================================================
  // MARK: - Configuration
  // =============================================================================

  /**
   * Configure detent-related behavior settings.
   * Called by the controller when detents change.
   */
  fun configureDetents(
    peekHeight: Int,
    halfExpandedRatio: Float,
    expandedOffset: Int,
    fitToContents: Boolean,
    skipCollapsed: Boolean = false,
    animate: Boolean = false
  ) {
    val behavior = this.behavior ?: return

    behavior.apply {
      isFitToContents = fitToContents
      this.skipCollapsed = skipCollapsed
      setPeekHeight(peekHeight, animate)
      this.halfExpandedRatio = halfExpandedRatio.coerceIn(0f, 0.999f)
      this.expandedOffset = expandedOffset
    }
  }

  /**
   * Set the behavior state.
   */
  fun setState(state: Int) {
    behavior?.state = state
  }

  /**
   * Update draggable state.
   */
  fun updateDraggable(enabled: Boolean) {
    draggable = enabled
    behavior?.isDraggable = enabled
    if (isAdded) setupGrabber()
  }

  // =============================================================================
  // MARK: - Helpers
  // =============================================================================

  private fun getDefaultBackgroundColor(context: ThemedReactContext): Int {
    val typedValue = TypedValue()
    return if (context.theme.resolveAttribute(
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
}
