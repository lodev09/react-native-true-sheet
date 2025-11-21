package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.utils.KeyboardManager
import com.lodev09.truesheet.utils.PixelUtils
import com.lodev09.truesheet.utils.ScreenUtils

data class DetentInfo(val index: Int, val position: Float)

/**
 * Delegate protocol for TrueSheetController lifecycle and interaction events.
 * Similar to iOS TrueSheetViewControllerDelegate pattern.
 */
interface TrueSheetControllerDelegate {
  fun controllerWillPresent(index: Int, position: Float)
  fun controllerDidPresent(index: Int, position: Float)
  fun controllerWillDismiss()
  fun controllerDidDismiss()
  fun controllerDidChangeDetent(index: Int, position: Float)
  fun controllerDidDragBegin(index: Int, position: Float)
  fun controllerDidDragChange(index: Int, position: Float)
  fun controllerDidDragEnd(index: Int, position: Float)
  fun controllerDidChangePosition(index: Int, position: Float)
}

/**
 * TrueSheetController manages the bottom sheet dialog lifecycle and properties.
 * Similar to iOS TrueSheetViewController pattern.
 *
 * The dialog is created lazily when the container view mounts and is properly
 * cleaned up when dismissed to ensure clean state for each presentation.
 */
@SuppressLint("ClickableViewAccessibility")
class TrueSheetController(
  private val reactContext: ThemedReactContext,
  private val sheetRootView: TrueSheetRootView
) {

  /**
   * Delegate for handling controller events
   */
  var delegate: TrueSheetControllerDelegate? = null

  /**
   * The BottomSheetDialog instance - created lazily when container mounts
   */
  private var dialog: BottomSheetDialog? = null

  /**
   * The sheet behavior from the dialog
   */
  private val behavior: BottomSheetBehavior<FrameLayout>?
    get() = dialog?.behavior

  /**
   * The sheet container view from Material BottomSheetDialog
   */
  private val sheetRootViewContainer: FrameLayout?
    get() = sheetRootView.parent as? FrameLayout

  /**
   * Our sheet container view from root view's only child
   */
  private val containerView: TrueSheetContainerView?
    get() = if (sheetRootView.childCount > 0) {
      sheetRootView.getChildAt(0) as? TrueSheetContainerView
    } else {
      null
    }

  /**
   * Content view from the container
   */
  private val sheetContentView: TrueSheetContentView?
    get() = containerView?.contentView

  /**
   * Footer view from the container
   */
  private val footerView: TrueSheetFooterView?
    get() = containerView?.footerView

  /**
   * Track if the dialog is currently being dragged
   */
  private var isDragging = false

  /**
   * Current active detent index
   */
  var currentDetentIndex: Int = -1
    private set

  /**
   * Promise callback to be invoked after present is called
   */
  var presentPromise: (() -> Unit)? = null

  /**
   * Promise callback to be invoked after dismiss is called
   */
  var dismissPromise: (() -> Unit)? = null

  // ==================== Properties ====================

  /**
   * Specify whether the sheet background is dimmed.
   * Set to `false` to allow interaction with the background components.
   */
  var dimmed = true

  /**
   * The detent index that the sheet should start to dim the background.
   * This is ignored if `dimmed` is set to `false`.
   */
  var dimmedIndex = 0

  /**
   * The maximum window height
   */
  var maxScreenHeight = 0

  var maxSheetHeight: Int? = null

  var edgeToEdge: Boolean = false
    set(value) {
      field = value
      maxScreenHeight = ScreenUtils.screenHeight(reactContext, value)
    }

  var dismissible: Boolean = true
    set(value) {
      field = value
      dialog?.apply {
        setCanceledOnTouchOutside(value)
        setCancelable(value)
        behavior.isHideable = value
      }
    }

  var cornerRadius: Float = 0f
  var backgroundColor: Int = Color.WHITE
  var detents: Array<Any> = arrayOf(0.5, 1.0)

  private var keyboardManager = KeyboardManager(reactContext)
  private var windowAnimation: Int = 0

  init {
    // Initialize maxScreenHeight
    maxScreenHeight = ScreenUtils.screenHeight(reactContext, edgeToEdge)
  }

  // ==================== Lifecycle ====================

  /**
   * Check if dialog is showing
   */
  val isShowing: Boolean
    get() = dialog?.isShowing == true

  /**
   * Creates the dialog instance. Should be called when container view is mounted.
   */
  fun createDialog() {
    if (dialog != null) return

    dialog = BottomSheetDialog(reactContext).apply {
      setContentView(sheetRootView)

      // Setup window params
      window?.apply {
        // Store current windowAnimation value to toggle later
        windowAnimation = attributes.windowAnimations
      }

      // Setup dialog lifecycle listeners
      setupDialogListeners(this)

      // Setup bottom sheet behavior callbacks
      setupBottomSheetBehavior(this)

      // Apply initial properties
      setCanceledOnTouchOutside(dismissible)
      setCancelable(dismissible)
      behavior.isHideable = dismissible
      
      // Apply background color and corner radius
      setupBackground()
    }
  }

  /**
   * Cleans up the dialog instance. Called when dismissed to ensure clean state.
   */
  private fun cleanupDialog() {
    dialog?.apply {
      setOnShowListener(null)
      setOnCancelListener(null)
      setOnDismissListener(null)
    }

    // Remove sheetRootView from its parent to allow re-attachment on next presentation
    sheetRootViewContainer?.removeView(sheetRootView)

    unregisterKeyboardManager()
    dialog = null
    isDragging = false
  }

  /**
   * Setup dialog lifecycle listeners
   */
  private fun setupDialogListeners(dialog: BottomSheetDialog) {
    // Setup listener when the dialog has been presented
    dialog.setOnShowListener {
      registerKeyboardManager()

      // Initialize footer position
      positionFooter()

      // Re-enable animation
      resetAnimation()

      // Resolve the present promise
      presentPromise?.let { promise ->
        promise()
        presentPromise = null
      }

      // Notify delegate
      val detentInfo = getDetentInfoForIndexWithPosition(currentDetentIndex)
      delegate?.controllerDidPresent(detentInfo.index, detentInfo.position)
    }

    // Setup listener when the dialog is about to be dismissed
    dialog.setOnCancelListener {
      // Notify delegate
      delegate?.controllerWillDismiss()
    }

    // Setup listener when the dialog has been dismissed
    dialog.setOnDismissListener {
      // Resolve the dismiss promise
      dismissPromise?.let { promise ->
        promise()
        dismissPromise = null
      }

      // Notify delegate
      delegate?.controllerDidDismiss()

      // Clean up the dialog for next presentation
      cleanupDialog()
    }
  }

  /**
   * Setup bottom sheet behavior callbacks
   */
  private fun setupBottomSheetBehavior(dialog: BottomSheetDialog) {
    dialog.behavior.addBottomSheetCallback(
      object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(sheetView: View, slideOffset: Float) {
          val behavior = behavior ?: return

          when (behavior.state) {
            // For consistency with iOS, we consider SETTLING as dragging change
            BottomSheetBehavior.STATE_DRAGGING,
            BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

            else -> { }
          }

          // Emit position change event continuously during slide
          val detentInfo = getCurrentDetentInfo(sheetView)
          delegate?.controllerDidChangePosition(detentInfo.index, detentInfo.position)

          // Update footer position during slide
          footerView?.let { footer ->
            val footerHeight = containerView?.footerHeight ?: 0
            val y = (maxScreenHeight - sheetView.top - footerHeight).toFloat()

            if (slideOffset >= 0) {
              // Sheet is expanding
              footer.y = y
            } else {
              // Sheet is collapsing
              footer.y = y - footerHeight * slideOffset
            }
          }
        }

        override fun onStateChanged(sheetView: View, newState: Int) {
          // Handle STATE_HIDDEN before checking isShowing
          // This ensures we can dismiss even if dialog state gets out of sync
          if (newState == BottomSheetBehavior.STATE_HIDDEN) {
            dismiss()
            return
          }

          if (!isShowing) return

          when (newState) {
            // When changed to dragging, we know that the drag has started
            BottomSheetBehavior.STATE_DRAGGING -> handleDragBegin(sheetView)

            // Either of the following state determines drag end
            BottomSheetBehavior.STATE_EXPANDED,
            BottomSheetBehavior.STATE_COLLAPSED,
            BottomSheetBehavior.STATE_HALF_EXPANDED -> handleDragEnd(newState)

            else -> {}
          }
        }
      }
    )
  }

  // ==================== Presentation ====================

  /**
   * Present the sheet.
   */
  fun present(detentIndex: Int, animated: Boolean = true) {
    val dialog = this.dialog ?: run {
      // Dialog not created yet - this shouldn't happen but handle gracefully
      return
    }

    currentDetentIndex = detentIndex
    setupDimmedBackground(detentIndex)

    if (isShowing) {
      // For consistency with iOS, we notify detent change immediately
      // when already showing (not waiting for state to change)
      val detentInfo = getDetentInfoForIndexWithPosition(detentIndex)
      delegate?.controllerDidChangeDetent(detentInfo.index, detentInfo.position)

      setStateForDetentIndex(detentIndex)
    } else {
      // Reset drag state before presenting
      isDragging = false

      configure()
      setStateForDetentIndex(detentIndex)

      // Notify delegate before showing
      val detentInfo = getDetentInfoForIndex(detentIndex)
      delegate?.controllerWillPresent(detentInfo.index, detentInfo.position)

      if (!animated) {
        // Disable animation
        dialog.window?.setWindowAnimations(0)
      }

      dialog.show()
    }
  }

  /**
   * Dismiss the sheet.
   */
  fun dismiss() {
    dialog?.dismiss()
  }

  // ==================== Configuration ====================

  /**
   * Configure the sheet based from the detent preference.
   */
  fun configure() {
    val behavior = this.behavior ?: return

    // Configure sheet sizes
    behavior.apply {
      skipCollapsed = false
      isFitToContents = true

      // m3 max width 640dp
      maxWidth = PixelUtils.toPixel(640.0).toInt()

      when (detents.size) {
        1 -> {
          maxHeight = getDetentHeight(detents[0])
          skipCollapsed = true

          if (detents[0] == -1.0 || detents[0] == -1) {
            // Force a layout update for auto height
            sheetRootViewContainer?.apply {
              val params = layoutParams
              params.height = maxHeight
              layoutParams = params
            }
          }
        }

        2 -> {
          val peekHeight = getDetentHeight(detents[0])
          maxHeight = getDetentHeight(detents[1])
          setPeekHeight(peekHeight, isShowing)
        }

        3 -> {
          // Enables half expanded
          isFitToContents = false

          val peekHeightValue = getDetentHeight(detents[0])
          val middleDetentHeight = getDetentHeight(detents[1])
          val maxHeightValue = getDetentHeight(detents[2])

          setPeekHeight(peekHeightValue, isShowing)
          maxHeight = maxHeightValue

          // Calculate half expanded ratio relative to maxHeight (not maxScreenHeight)
          // BottomSheetBehavior calculates half-expanded against parent height (which is constrained by maxHeight)
          if (middleDetentHeight > 0 && maxHeightValue > 0) {
            val ratio = middleDetentHeight.toFloat() / maxHeightValue.toFloat()
            // Clamp ratio to valid range: (0, 1) - strictly between 0 and 1 (exclusive)
            // BottomSheetBehavior requires ratio > 0 && ratio < 1
            halfExpandedRatio = ratio.coerceIn(0.01f, 0.99f)
          } else {
            // Default to 0.5 if content isn't measured yet
            halfExpandedRatio = 0.5f
          }
        }
      }
    }
  }

  /**
   * Setup background color and corner radius.
   */
  fun setupBackground() {
    sheetRootViewContainer?.apply {
      val outerRadii = floatArrayOf(
        cornerRadius,
        cornerRadius,
        cornerRadius,
        cornerRadius,
        0f,
        0f,
        0f,
        0f
      )

      val background = ShapeDrawable(RoundRectShape(outerRadii, null, null))
      background.paint.color = backgroundColor
      
      this.background = background
      this.clipToOutline = true
    }
  }

  /**
   * Setup dimmed sheet.
   * `dimmedIndex` will further customize the dimming behavior.
   */
  fun setupDimmedBackground(detentIndex: Int) {
    val dialog = this.dialog ?: return
    dialog.window?.apply {
      val view = findViewById<View>(com.google.android.material.R.id.touch_outside)

      if (dimmed && detentIndex >= dimmedIndex) {
        // Remove touch listener
        view.setOnTouchListener(null)

        // Add the dimmed background
        setFlags(
          WindowManager.LayoutParams.FLAG_DIM_BEHIND,
          WindowManager.LayoutParams.FLAG_DIM_BEHIND
        )

        dialog.setCanceledOnTouchOutside(dismissible)
      } else {
        // Override the background touch and pass it to the components outside
        view.setOnTouchListener { v, event ->
          event.setLocation(event.rawX - v.x, event.rawY - v.y)
          reactContext.currentActivity?.dispatchTouchEvent(event)
          false
        }

        // Remove the dimmed background
        clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)

        dialog.setCanceledOnTouchOutside(false)
      }
    }
  }

  fun resetAnimation() {
    dialog?.window?.apply {
      setWindowAnimations(windowAnimation)
    }
  }

  fun positionFooter() {
    footerView?.let { footer ->
      val footerHeight = containerView?.footerHeight ?: 0
      val top = sheetRootViewContainer?.top ?: 0
      footer.y = (maxScreenHeight - top - footerHeight).toFloat()
    }
  }

  /**
   * Set the state based for the given detent index.
   */
  fun setStateForDetentIndex(index: Int) {
    behavior?.state = getStateForDetentIndex(index)
  }

  fun applyEdgeToEdge() {
    if (edgeToEdge || (dialog?.edgeToEdgeEnabled == true)) {
      dialog?.window?.apply {
        setFlags(
          WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
          WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        )

        decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      }
    }
  }

  fun setSoftInputMode(mode: Int) {
    dialog?.window?.setSoftInputMode(mode)
  }

  // ==================== Keyboard Management ====================

  /**
   * Handle keyboard state changes and adjust maxScreenHeight (sheet max height) accordingly.
   * Also update footer's Y position.
   */
  fun registerKeyboardManager() {
    keyboardManager.registerKeyboardListener(object : KeyboardManager.OnKeyboardChangeListener {
      override fun onKeyboardStateChange(isVisible: Boolean, visibleHeight: Int?) {
        maxScreenHeight = when (isVisible) {
          true -> visibleHeight ?: 0
          else -> ScreenUtils.screenHeight(reactContext, edgeToEdge)
        }

        positionFooter()
      }
    })
  }

  /**
   * Remove keyboard listener.
   */
  fun unregisterKeyboardManager() {
    keyboardManager.unregisterKeyboardListener()
  }

  // ==================== Drag Handling ====================

  /**
   * Get current detent info from sheet view position
   */
  private fun getCurrentDetentInfo(sheetView: View): DetentInfo {
    val position = PixelUtils.toDIP(sheetView.top.toFloat())
    return DetentInfo(currentDetentIndex, position)
  }

  /**
   * Handle drag begin
   */
  private fun handleDragBegin(sheetView: View) {
    val detentInfo = getCurrentDetentInfo(sheetView)
    delegate?.controllerDidDragBegin(detentInfo.index, detentInfo.position)
    isDragging = true
  }

  /**
   * Handle drag change
   */
  private fun handleDragChange(sheetView: View) {
    if (!isDragging) return

    val detentInfo = getCurrentDetentInfo(sheetView)
    delegate?.controllerDidDragChange(detentInfo.index, detentInfo.position)
  }

  /**
   * Handle drag end
   */
  private fun handleDragEnd(state: Int) {
    if (!isDragging) return

    // For consistency with iOS,
    // we only handle state changes after dragging.
    //
    // Changing detent programmatically is handled via the present method.
    val detentInfo = getDetentInfoForState(state)
    detentInfo?.let {
      // Notify delegate of drag end
      delegate?.controllerDidDragEnd(it.index, it.position)

      if (it.index != currentDetentIndex) {
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        currentDetentIndex = it.index
        setupDimmedBackground(it.index)

        // Notify delegate of detent change
        delegate?.controllerDidChangeDetent(it.index, it.position)
      }
    }

    isDragging = false
  }

  // ==================== Detent Calculations ====================

  /**
   * Get the height value based on the detent config value.
   */
  private fun getDetentHeight(detent: Any): Int {
    val height: Int =
      when (detent) {
        is Double -> {
          if (detent == -1.0) {
            // -1 represents "auto"
            val contentHeight = containerView?.contentHeight ?: 0
            contentHeight
          } else {
            if (detent <= 0.0 || detent > 1.0) {
              throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
            }
            (detent * maxScreenHeight).toInt()
          }
        }

        is Int -> {
          if (detent == -1) {
            // -1 represents "auto"
            val contentHeight = containerView?.contentHeight ?: 0
            contentHeight
          } else {
            if (detent <= 0 || detent > 1) {
              throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
            }
            (detent.toDouble() * maxScreenHeight).toInt()
          }
        }

        else -> throw IllegalArgumentException("TrueSheet: invalid detent type ${detent::class.simpleName}")
      }

    val finalHeight = maxSheetHeight?.let { minOf(height, it, maxScreenHeight) } ?: minOf(height, maxScreenHeight)
    return finalHeight
  }

  /**
   * Determines the state based from the given detent index.
   */
  private fun getStateForDetentIndex(index: Int): Int {
    return when (detents.size) {
      1 -> {
        BottomSheetBehavior.STATE_EXPANDED
      }

      2 -> {
        when (index) {
          0 -> BottomSheetBehavior.STATE_COLLAPSED
          1 -> BottomSheetBehavior.STATE_EXPANDED
          else -> BottomSheetBehavior.STATE_HIDDEN
        }
      }

      3 -> {
        when (index) {
          0 -> BottomSheetBehavior.STATE_COLLAPSED
          1 -> BottomSheetBehavior.STATE_HALF_EXPANDED
          2 -> BottomSheetBehavior.STATE_EXPANDED
          else -> BottomSheetBehavior.STATE_HIDDEN
        }
      }

      else -> BottomSheetBehavior.STATE_HIDDEN
    }
  }

  /**
   * Get the DetentInfo data by state.
   */
  fun getDetentInfoForState(state: Int): DetentInfo? =
    when (detents.size) {
      1 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> DetentInfo(0, 0f)
          BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(0, 0f)
          else -> null
        }
      }

      2 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> DetentInfo(0, 0f)
          BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(1, 0f)
          else -> null
        }
      }

      3 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> DetentInfo(0, 0f)
          BottomSheetBehavior.STATE_HALF_EXPANDED -> DetentInfo(1, 0f)
          BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(2, 0f)
          else -> null
        }
      }

      else -> null
    }

  /**
   * Get DetentInfo data for given detent index.
   */
  fun getDetentInfoForIndex(index: Int) = getDetentInfoForState(getStateForDetentIndex(index)) ?: DetentInfo(0, 0f)

  /**
   * Get DetentInfo data for given detent index with actual Y position from sheet view.
   */
  fun getDetentInfoForIndexWithPosition(index: Int): DetentInfo {
    val baseInfo = getDetentInfoForIndex(index)
    val position = PixelUtils.toDIP(sheetRootViewContainer?.top?.toFloat() ?: 0f)
    return baseInfo.copy(position = position)
  }
}
