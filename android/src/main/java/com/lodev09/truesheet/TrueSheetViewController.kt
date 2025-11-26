package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import androidx.core.view.isNotEmpty
import com.lodev09.truesheet.core.RNScreensFragmentObserver
import com.facebook.react.R
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.util.RNLog
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.utils.ScreenUtils

data class DetentInfo(val index: Int, val position: Float)

/**
 * Delegate protocol for TrueSheetViewController lifecycle and interaction events.
 * Similar to iOS TrueSheetViewControllerDelegate pattern.
 */
interface TrueSheetViewControllerDelegate {
  fun viewControllerWillPresent(index: Int, position: Float)
  fun viewControllerDidPresent(index: Int, position: Float)
  fun viewControllerWillDismiss()
  fun viewControllerDidDismiss()
  fun viewControllerDidChangeDetent(index: Int, position: Float)
  fun viewControllerDidDragBegin(index: Int, position: Float)
  fun viewControllerDidDragChange(index: Int, position: Float)
  fun viewControllerDidDragEnd(index: Int, position: Float)
  fun viewControllerDidChangePosition(index: Int, position: Float, transitioning: Boolean)
  fun viewControllerDidChangeSize(width: Int, height: Int)
}

/**
 * TrueSheetViewController manages the bottom sheet dialog lifecycle and properties.
 * Similar to iOS TrueSheetViewController pattern.
 *
 * This view acts as both the RootView (handles touch events) and the controller (manages dialog).
 */
@SuppressLint("ClickableViewAccessibility", "ViewConstructor")
class TrueSheetViewController(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  RootView {

  // ==================== RootView Touch Handling ====================

  internal var eventDispatcher: EventDispatcher? = null

  private val jSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null

  /**
   * Delegate for handling view controller events
   */
  var delegate: TrueSheetViewControllerDelegate? = null

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
   * The sheet container view from Material BottomSheetDialog (our parent)
   */
  private val sheetContainer: FrameLayout?
    get() = this.parent as? FrameLayout

  /**
   * The actual bottom sheet view used by Material BottomSheetBehavior
   * This is the view whose position changes during drag
   */
  private val bottomSheetView: FrameLayout?
    get() = dialog?.findViewById(com.google.android.material.R.id.design_bottom_sheet)

  /**
   * Our sheet container view from this root view's only child
   */
  private val containerView: TrueSheetContainerView?
    get() = if (this.isNotEmpty()) {
      this.getChildAt(0) as? TrueSheetContainerView
    } else {
      null
    }

  private val contentHeight: Int
    get() = containerView?.contentHeight ?: 0

  private val headerHeight: Int
    get() = containerView?.headerHeight ?: 0

  /**
   * Track if the dialog is currently being dragged
   */
  private var isDragging = false

  /**
   * Track if the sheet has been presented (after onShow callback)
   */
  var isPresented = false
    private set

  val statusBarHeight: Int
    get() = ScreenUtils.getStatusBarHeight(reactContext)

  private val edgeToEdgeEnabled: Boolean
    get() {
      // Auto-enable edge-to-edge for Android 16+ (API level 36) if not explicitly set
      val defaultEnabled = android.os.Build.VERSION.SDK_INT >= 36
      return BuildConfig.EDGE_TO_EDGE_ENABLED || dialog?.edgeToEdgeEnabled == true || defaultEnabled
    }

  /**
   * Whether to allow the sheet to extend behind the status bar in edge-to-edge mode
   */
  var edgeToEdgeFullScreen: Boolean = false

  /**
   * Top inset to apply to sheet max height calculation (only when not edgeToEdgeFullScreen)
   */
  private val sheetTopInset: Int
    get() = if (edgeToEdgeEnabled && !edgeToEdgeFullScreen) statusBarHeight else 0

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
  var dimmedDetentIndex = 0

  /**
   * The maximum window height
   */
  var screenHeight = 0

  /**
   * The window width
   */
  var screenWidth = 0

  var maxSheetHeight: Int? = null

  var dismissible: Boolean = true
    set(value) {
      field = value
      dialog?.apply {
        setCanceledOnTouchOutside(value)
        setCancelable(value)
        behavior.isHideable = value
      }
    }

  /**
   * Whether to show the native grabber/handle.
   * Follows Material Design 3 specs.
   */
  var grabber: Boolean = true

  var sheetCornerRadius: Float = -1f
  var sheetBackgroundColor: Int = 0
  var detents = mutableListOf(0.5, 1.0)

  private var windowAnimation: Int = 0

  /**
   * Observer for react-native-screens modal fragments.
   */
  private var rnScreensObserver: RNScreensFragmentObserver? = null

  init {
    screenHeight = ScreenUtils.getScreenHeight(reactContext, edgeToEdgeEnabled)
    screenWidth = ScreenUtils.getScreenWidth(reactContext)

    jSPointerDispatcher = JSPointerDispatcher(this)
  }

  /**
   * Get the default background color from Material Design 3 theme.
   * Uses colorSurfaceContainerLow which adapts to light/dark mode.
   */
  fun getDefaultBackgroundColor(): Int {
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

  // ==================== Lifecycle ====================

  /**
   * Creates the dialog instance. Should be called when container view is mounted.
   */
  fun createDialog() {
    if (dialog != null) return

    val style = if (edgeToEdgeEnabled) {
      com.lodev09.truesheet.R.style.TrueSheetEdgeToEdgeEnabledDialog
    } else {
      0
    }

    dialog = BottomSheetDialog(reactContext, style).apply {
      setContentView(this@TrueSheetViewController)

      // Setup window params
      window?.apply {
        // Store current windowAnimation value to toggle later
        windowAnimation = attributes.windowAnimations

      }

      // Setup fragment lifecycle observer to detect react-native-screens modal presentation
      setupModalObserver()

      // Setup dialog lifecycle listeners
      setupDialogListeners(this)

      // Setup bottom sheet behavior callbacks
      setupBottomSheetBehavior(this)

      // Apply initial properties
      setCanceledOnTouchOutside(dismissible)
      setCancelable(dismissible)
      behavior.isHideable = dismissible
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

    // Cleanup observers
    cleanupModalObserver()

    // Remove this view from its parent to allow re-attachment on next presentation
    sheetContainer?.removeView(this)

    dialog = null
    isDragging = false
    isPresented = false
  }

  /**
   * Setup dialog lifecycle listeners
   */
  private fun setupDialogListeners(dialog: BottomSheetDialog) {
    // Setup listener when the dialog has been presented
    dialog.setOnShowListener {
      isPresented = true

      // Re-enable animation
      resetAnimation()

      // Setup background and grabber on initial presentation
      setupBackground()
      setupGrabber()

      // Wait for the sheet to settle before notifying didPresent
      // The sheet animates to its final position after onShow fires
      sheetContainer?.post {
        // Notify delegate with the settled position
        val detentInfo = getDetentInfoForIndex(currentDetentIndex)
        delegate?.viewControllerDidPresent(detentInfo.index, detentInfo.position)

        // Emit position change with transitioning=true so Reanimated can animate it
        delegate?.viewControllerDidChangePosition(detentInfo.index, detentInfo.position, transitioning = true)

        // Resolve the present promise
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        // Initialize footer position after layout is complete
        positionFooter()
      }
    }

    // Setup listener when the dialog is about to be dismissed
    dialog.setOnCancelListener {
      // Notify delegate
      delegate?.viewControllerWillDismiss()
    }

    // Setup listener when the dialog has been dismissed
    dialog.setOnDismissListener {
      // Resolve the dismiss promise
      dismissPromise?.let { promise ->
        promise()
        dismissPromise = null
      }

      // Notify delegate
      delegate?.viewControllerDidDismiss()

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

          // Emit position change event continuously during slide
          // Set transitioning=false during drag to get real-time position updates
          val detentInfo = getCurrentDetentInfo(sheetView)
          delegate?.viewControllerDidChangePosition(detentInfo.index, detentInfo.position, transitioning = false)

          when (behavior.state) {
            // For consistency with iOS, we consider SETTLING as dragging change
            BottomSheetBehavior.STATE_DRAGGING,
            BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

            else -> { }
          }

          // Update footer position during slide
          positionFooter(slideOffset)
        }

        override fun onStateChanged(sheetView: View, newState: Int) {
          // Handle STATE_HIDDEN before checking isPresented
          // This ensures we can dismiss even if dialog state gets out of sync
          if (newState == BottomSheetBehavior.STATE_HIDDEN) {
            dismiss()
            return
          }

          if (!isPresented) return

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

  /**
   * Setup fragment lifecycle observer to detect react-native-screens modal presentation.
   * Hides TrueSheet when a modal is presented and shows it again when dismissed.
   */
  private fun setupModalObserver() {
    rnScreensObserver = RNScreensFragmentObserver(
      reactContext = reactContext,
      onModalPresented = {
        if (isPresented) {
          dialog?.window?.decorView?.visibility = View.INVISIBLE
        }
      },
      onModalDismissed = {
        if (isPresented) {
          dialog?.window?.decorView?.visibility = View.VISIBLE
        }
      }
    )
    rnScreensObserver?.start()
  }

  /**
   * Cleanup modal observer when dialog is destroyed.
   */
  private fun cleanupModalObserver() {
    rnScreensObserver?.stop()
    rnScreensObserver = null
  }

  /**
   * Check if there are active modal fragments being tracked.
   * Used to prevent view unregistration during modal navigation.
   */
  fun hasActiveModals(): Boolean = rnScreensObserver?.hasActiveModals() ?: false

  // ==================== Presentation ====================

  /**
   * Present the sheet.
   */
  fun present(detentIndex: Int, animated: Boolean = true) {
    val dialog = this.dialog ?: run {
      RNLog.w(reactContext, "TrueSheet: No dialog available. Ensure the sheet is mounted before presenting.")
      return
    }

    currentDetentIndex = detentIndex
    setupDimmedBackground(detentIndex)

    if (isPresented) {
      // For consistency with iOS, we notify detent change immediately
      // when already presented (not waiting for state to change)
      val detentInfo = getDetentInfoForIndex(detentIndex)
      delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position)

      // Note: onSlide will be called during resize animation, no need to emit position change here
      setStateForDetentIndex(detentIndex)
    } else {
      // Reset drag state before presenting
      isDragging = false

      setupSheetDetents()
      setStateForDetentIndex(detentIndex)

      // Notify delegate before showing
      val detentInfo = getDetentInfoForIndex(detentIndex)
      delegate?.viewControllerWillPresent(detentInfo.index, detentInfo.position)

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
    this.post {
      // Emit position change with transitioning=true to animate dismissal
      // Use screenHeight as the off-screen position (sheet slides down off screen)
      val offScreenPosition = screenHeight.pxToDp()
      delegate?.viewControllerDidChangePosition(currentDetentIndex, offScreenPosition, transitioning = true)
    }

    dialog?.dismiss()
  }

  // ==================== Configuration ====================

  /**
   * Setup sheet detents based on the detent preference.
   */
  fun setupSheetDetents() {
    val behavior = this.behavior ?: return

    // Configure sheet sizes
    behavior.apply {
      skipCollapsed = false
      isFitToContents = true

      maxWidth = DEFAULT_MAX_WIDTH.dpToPx().toInt()

      when (detents.size) {
        1 -> {
          val detentHeight = getDetentHeight(detents[0])
          maxHeight = detentHeight
          skipCollapsed = true
        }

        2 -> {
          val peekHeight = getDetentHeight(detents[0])
          val maxHeightValue = getDetentHeight(detents[1])
          maxHeight = maxHeightValue
          setPeekHeight(peekHeight, isPresented)
        }

        3 -> {
          // Enables half expanded
          isFitToContents = false

          val peekHeightValue = getDetentHeight(detents[0])
          val middleDetentHeight = getDetentHeight(detents[1])
          val maxHeightValue = getDetentHeight(detents[2])

          setPeekHeight(peekHeightValue, isPresented)
          maxHeight = maxHeightValue
          expandedOffset = sheetTopInset
          halfExpandedRatio = minOf(middleDetentHeight.toFloat() / screenHeight.toFloat(), 1.0f)
        }
      }

      // Force a layout update when sheet is presented (e.g., during rotation)
      // This ensures the container respects the new maxHeight constraint
      if (isPresented) {
        sheetContainer?.apply {
          val params = layoutParams
          params.height = maxHeight
          layoutParams = params
        }
      }
    }
  }

  /**
   * Creates and adds the native grabber view to the bottom sheet.
   * Follows Material Design 3 specs:
   * - Width: 32dp
   * - Height: 4dp
   * - Color: #49454F with 0.4 alpha
   * - Corner radius: 2dp (height/2)
   * - Top margin: 16dp
   */
  fun setupGrabber() {
    val bottomSheet = bottomSheetView ?: return

    // Remove existing grabber if any
    bottomSheet.findViewWithTag<View>(GRABBER_TAG)?.let {
      bottomSheet.removeView(it)
    }

    // Don't add grabber if disabled
    if (!grabber) return

    // Create and add grabber view
    val grabberView = View(reactContext).apply {
      tag = GRABBER_TAG

      // Set dimensions
      val width = GRABBER_WIDTH.dpToPx().toInt()
      val height = GRABBER_HEIGHT.dpToPx().toInt()
      val topMargin = GRABBER_TOP_MARGIN.dpToPx().toInt()

      layoutParams = FrameLayout.LayoutParams(width, height).apply {
        gravity = Gravity.CENTER_HORIZONTAL or Gravity.TOP
        this.topMargin = topMargin
      }

      // Create rounded rectangle background
      background = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = (GRABBER_HEIGHT / 2).dpToPx()
        setColor(GRABBER_COLOR)
      }

      // Ensure grabber is above other content
      elevation = 1f
    }

    bottomSheet.addView(grabberView)
  }

  /**
   * Setup background color and corner radius.
   */
  fun setupBackground() {
    val bottomSheet = bottomSheetView ?: return

    // -1 is used as sentinel for system default corner radius
    val cornerRadius = if (sheetCornerRadius < 0) DEFAULT_CORNER_RADIUS.dpToPx() else sheetCornerRadius

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

    // 0 (transparent) is used as sentinel for "use system default"
    val backgroundColor = if (sheetBackgroundColor != 0) sheetBackgroundColor else getDefaultBackgroundColor()

    val background = ShapeDrawable(RoundRectShape(outerRadii, null, null))
    background.paint.color = backgroundColor

    bottomSheet.background = background
    bottomSheet.clipToOutline = true
  }

  /**
   * Setup dimmed sheet.
   * `dimmedDetentIndex` will further customize the dimming behavior.
   */
  fun setupDimmedBackground(detentIndex: Int) {
    val dialog = this.dialog ?: return
    dialog.window?.apply {
      val view = findViewById<View>(com.google.android.material.R.id.touch_outside)

      if (dimmed && detentIndex >= dimmedDetentIndex) {
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

  fun positionFooter(slideOffset: Float? = null) {
    val footerView = containerView?.footerView ?: return

    val bottomSheet = bottomSheetView ?: return
    val footerHeight = footerView.height

    val bottomSheetY = ScreenUtils.getScreenY(bottomSheet)

    // Calculate footer Y position based on bottom sheet position
    var footerY = (screenHeight - bottomSheetY - footerHeight).toFloat()

    // Animate footer down with sheet when below peek height
    if (slideOffset != null && slideOffset < 0) {
      footerY -= (footerHeight * slideOffset)
    }

    // Clamp footer position to prevent it from going off screen when positioning at the top
    // This happens when fullScreen is enabled in edge-to-edge mode
    val maxAllowedY = (screenHeight - statusBarHeight - footerHeight).toFloat()
    footerView.y = minOf(footerY, maxAllowedY)
  }

  /**
   * Set the state based for the given detent index.
   */
  fun setStateForDetentIndex(index: Int) {
    behavior?.state = getStateForDetentIndex(index)
  }

  fun setSoftInputMode(mode: Int) {
    dialog?.window?.setSoftInputMode(mode)
  }

  // ==================== Drag Handling ====================

  /**
   * Get current detent info from sheet view position
   */
  private fun getCurrentDetentInfo(sheetView: View): DetentInfo {
    // Get the Y position in screen coordinates (like iOS presentedView.frame.origin.y)
    val screenY = ScreenUtils.getScreenY(sheetView)
    val position = screenY.pxToDp()
    return DetentInfo(currentDetentIndex, position)
  }

  /**
   * Handle drag begin
   */
  private fun handleDragBegin(sheetView: View) {
    val detentInfo = getCurrentDetentInfo(sheetView)
    delegate?.viewControllerDidDragBegin(detentInfo.index, detentInfo.position)
    isDragging = true
  }

  /**
   * Handle drag change
   */
  private fun handleDragChange(sheetView: View) {
    if (!isDragging) return

    val detentInfo = getCurrentDetentInfo(sheetView)
    delegate?.viewControllerDidDragChange(detentInfo.index, detentInfo.position)
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
      delegate?.viewControllerDidDragEnd(it.index, it.position)

      if (it.index != currentDetentIndex) {
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        currentDetentIndex = it.index
        setupDimmedBackground(it.index)

        // Notify delegate of detent change
        delegate?.viewControllerDidChangeDetent(it.index, it.position)
      }
    }

    isDragging = false
  }

  // ==================== Detent Calculations ====================

  /**
   * Get the height value based on the detent config value.
   */
  private fun getDetentHeight(detent: Double): Int {
    val height: Int = if (detent == -1.0) {
      // -1.0 represents "auto"
      // total height of the content + header
      contentHeight + headerHeight
    } else {
      if (detent <= 0.0 || detent > 1.0) {
        throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
      }
      (detent * screenHeight).toInt()
    }

    // Apply top inset when edge-to-edge is enabled
    val maxAllowedHeight = screenHeight - sheetTopInset
    val finalHeight = maxSheetHeight?.let { minOf(height, it, maxAllowedHeight) } ?: minOf(height, maxAllowedHeight)
    return finalHeight
  }

  /**
   * Determines the state based from the given detent index.
   */
  private fun getStateForDetentIndex(index: Int): Int =
    when (detents.size) {
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

  /**
   * Get the DetentInfo data by state.
   */
  fun getDetentInfoForState(state: Int): DetentInfo? =
    when (detents.size) {
      1 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> DetentInfo(0, getPositionForDetentIndex(0))
          BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(0, getPositionForDetentIndex(0))
          else -> null
        }
      }

      2 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> DetentInfo(0, getPositionForDetentIndex(0))
          BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(1, getPositionForDetentIndex(1))
          else -> null
        }
      }

      3 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> DetentInfo(0, getPositionForDetentIndex(0))
          BottomSheetBehavior.STATE_HALF_EXPANDED -> DetentInfo(1, getPositionForDetentIndex(1))
          BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(2, getPositionForDetentIndex(2))
          else -> null
        }
      }

      else -> null
    }

  /**
   * Calculate the expected Y position for a given detent index.
   * Uses actual screen position if available, otherwise calculates based on screen height.
   */
  private fun getPositionForDetentIndex(index: Int): Float {
    if (index < 0 || index >= detents.size) {
      return 0f
    }

    // Try to get actual position from bottom sheet view first (same view used in behavior callbacks)
    bottomSheetView?.let {
      it
      val screenY = ScreenUtils.getScreenY(it)
      // Only use actual position if sheet has been positioned (screenY > 0)
      if (screenY > 0) {
        return screenY.pxToDp()
      }
    }

    // Fallback: calculate expected position
    val detentHeight = getDetentHeight(detents[index])

    // Position calculation is simple: screen height - sheet height
    // In both edge-to-edge and non-edge-to-edge modes, getScreenY returns
    // coordinates in screen space, and screenHeight represents the available height
    // for the sheet, so the calculation is the same
    val positionPx = screenHeight - detentHeight

    return positionPx.pxToDp()
  }

  /**
   * Get DetentInfo data for given detent index.
   */
  fun getDetentInfoForIndex(index: Int) = getDetentInfoForState(getStateForDetentIndex(index)) ?: DetentInfo(0, 0f)

  // ==================== RootView Implementation ====================

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)

    val testId = getTag(R.id.react_test_id) as String?
    if (testId != null) {
      info.viewIdResourceName = testId
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    // Only proceed if size actually changed
    if (w == oldw && h == oldh) return

    val effectiveHeight = getEffectiveSheetHeight(h, headerHeight)

    // Notify delegate about size change so host view can update state
    delegate?.viewControllerDidChangeSize(w, effectiveHeight)

    val oldScreenHeight = screenHeight
    screenHeight = ScreenUtils.getScreenHeight(reactContext, edgeToEdgeEnabled)

    // Only handle rotation if sheet is presented and screen height actually changed
    if (isPresented && oldScreenHeight != screenHeight && oldScreenHeight > 0) {
      // Recalculate sheet detents with new screen dimensions
      setupSheetDetents()

      this.post {
        // Update footer position after rotation
        positionFooter()

        // Notify JS about position change after rotation settles
        val detentInfo = getDetentInfoForIndex(currentDetentIndex)
        delegate?.viewControllerDidChangePosition(detentInfo.index, detentInfo.position, transitioning = true)
      }
    }
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  /**
   * Override to dispatch touch events to footer when it's positioned outside container bounds.
   * This is necessary because the footer is positioned absolutely and may extend beyond the
   * container's clipping bounds when the sheet is expanded to full height.
   */
  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    val footer = containerView?.footerView
    if (footer != null && footer.visibility == View.VISIBLE) {
      // Get footer's position in screen coordinates
      val footerLocation = ScreenUtils.getScreenLocation(footer)

      // Get touch position in screen coordinates
      val touchScreenX = event.rawX.toInt()
      val touchScreenY = event.rawY.toInt()

      // Check if touch is within footer bounds (in screen coordinates)
      if (touchScreenX >= footerLocation[0] &&
        touchScreenX <= footerLocation[0] + footer.width &&
        touchScreenY >= footerLocation[1] &&
        touchScreenY <= footerLocation[1] + footer.height
      ) {
        // Transform touch to footer's local coordinates
        val localX = touchScreenX - footerLocation[0]
        val localY = touchScreenY - footerLocation[1]

        // Create a copy of the event with local coordinates
        val localEvent = MotionEvent.obtain(event)
        localEvent.setLocation(localX.toFloat(), localY.toFloat())

        val handled = footer.dispatchTouchEvent(localEvent)
        localEvent.recycle()

        if (handled) return true
      }
    }

    return super.dispatchTouchEvent(event)
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.handleTouchEvent(event, eventDispatcher, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.handleTouchEvent(event, eventDispatcher, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, false)
    }
    super.onTouchEvent(event)
    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, true) }
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, false) }
    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher)
      jSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, eventDispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jSTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jSPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // Allow the request to propagate to parent
    super.requestDisallowInterceptTouchEvent(disallowIntercept)
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
    const val GRABBER_TAG = "TrueSheetGrabber"

    // Material Design 3 max width in dp
    const val DEFAULT_MAX_WIDTH = 640

    // Material Design 3 default corner radius in dp
    const val DEFAULT_CORNER_RADIUS = 16

    // Material Design 3 grabber/drag handle specs
    const val GRABBER_WIDTH = 32f // dp
    const val GRABBER_HEIGHT = 4f // dp
    const val GRABBER_TOP_MARGIN = 16f // dp

    // M3 spec: #49454F with 0.4 alpha = rgba(73, 69, 79, 0.4)
    val GRABBER_COLOR = Color.argb((0.4 * 255).toInt(), 73, 69, 79)

    fun getEffectiveSheetHeight(sheetHeight: Int, headerHeight: Int): Int {
      // Calculate effective content height by subtracting header space.
      // We subtract headerHeight * 2 because both native layout and Yoga layout
      // account for the header. Since headerView.y is 0, headerView.bottom equals
      // its height, effectively doubling the space we need to subtract.
      return sheetHeight - headerHeight * 2
    }
  }
}
