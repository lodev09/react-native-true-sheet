package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import androidx.core.view.isNotEmpty
import com.facebook.react.R
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.utils.KeyboardManager
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
  fun viewControllerDidChangePosition(index: Int, position: Float)
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

  companion object {
    private const val TAG_NAME = "TrueSheet"
  }

  // ==================== RootView Touch Handling ====================

  internal var eventDispatcher: EventDispatcher? = null

  private val jSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jSPointerDispatcher = JSPointerDispatcher(this)
    }
  }

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
   * The sheet container view from Material BottomSheetDialog
   */
  private val sheetContainer: FrameLayout?
    get() = this.parent as? FrameLayout

  /**
   * Our sheet container view from this root view's only child
   */
  private val containerView: TrueSheetContainerView?
    get() = if (this.isNotEmpty()) {
      this.getChildAt(0) as? TrueSheetContainerView
    } else {
      null
    }

  /**
   * Content view from the container
   */
  val sheetContentView: TrueSheetContentView?
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

  private val edgeToEdgeEnabled
    get() = BuildConfig.EDGE_TO_EDGE_ENABLED || dialog?.edgeToEdgeEnabled == true

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

  /**
   * The content height from the container view.
   * Set by the host view when content size changes.
   */
  var contentHeight: Int = 0

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
  var sheetBackgroundColor: Int = Color.WHITE
  var detents = mutableListOf(0.5, 1.0)

  private var keyboardManager = KeyboardManager(reactContext)
  private var windowAnimation: Int = 0

  init {
    // Initialize maxScreenHeight
    maxScreenHeight = ScreenUtils.screenHeight(reactContext, edgeToEdgeEnabled)
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
      setContentView(this@TrueSheetViewController)

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

    // Remove this view from its parent to allow re-attachment on next presentation
    sheetContainer?.removeView(this)

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

      // Initialize footer position after layout is complete
      sheetContainer?.post {
        positionFooter()
      }

      // Re-enable animation
      resetAnimation()

      // Apply edge-to-edge configuration
      applyEdgeToEdge()

      // Resolve the present promise
      presentPromise?.let { promise ->
        promise()
        presentPromise = null
      }

      // Notify delegate
      val detentInfo = getDetentInfoForIndexWithPosition(currentDetentIndex)
      delegate?.viewControllerDidPresent(detentInfo.index, detentInfo.position)
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

          when (behavior.state) {
            // For consistency with iOS, we consider SETTLING as dragging change
            BottomSheetBehavior.STATE_DRAGGING,
            BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

            else -> { }
          }

          // Emit position change event continuously during slide
          val detentInfo = getCurrentDetentInfo(sheetView)
          delegate?.viewControllerDidChangePosition(detentInfo.index, detentInfo.position)

          // Update footer position during slide
          positionFooter(slideOffset)
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
      delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position)

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

      // m3 max width 640dp
      maxWidth = 640.0.dpToPx().toInt()

      when (detents.size) {
        1 -> {
          maxHeight = getDetentHeight(detents[0])
          skipCollapsed = true

          if (detents[0] == -1.0 || detents[0] == -1.0) {
            // Force a layout update for auto height
            sheetContainer?.apply {
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
          halfExpandedRatio = minOf(middleDetentHeight.toFloat() / maxScreenHeight.toFloat(), 1.0f)
        }
      }
    }
  }

  /**
   * Setup background color and corner radius.
   */
  fun setupBackground() {
    sheetContainer?.apply {
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
      background.paint.color = sheetBackgroundColor

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

  fun applyEdgeToEdge() {
    if (!edgeToEdgeEnabled) return

    dialog?.window?.apply {
      setFlags(
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
      )

      // Set system UI visibility
      @Suppress("DEPRECATION")
      decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
    }
  }

  fun positionFooter(slideOffset: Float? = null) {
    footerView?.let { footer ->
      val containerView = containerView ?: return
      val footerHeight = footer.height

      // Get container's position in screen coordinates
      val location = IntArray(2)
      containerView.getLocationOnScreen(location)
      val containerTop = location[1]

      // Calculate base position (screen bottom)
      val baseY = (maxScreenHeight - containerTop - footerHeight).toFloat()

      // Apply slideOffset for animation when sheet is below peek height
      footer.y = if (slideOffset != null && slideOffset < 0) {
        // Sheet is below peek height - animate footer down with sheet
        baseY - (footerHeight * slideOffset)
      } else {
        // Sheet is at or above peek height - footer sticks to screen bottom
        baseY
      }
    }
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
          else -> ScreenUtils.screenHeight(reactContext, edgeToEdgeEnabled)
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
    val position = sheetView.top.pxToDp()
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
      contentHeight
    } else {
      if (detent <= 0.0 || detent > 1.0) {
        throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
      }
      (detent * maxScreenHeight).toInt()
    }

    val finalHeight = maxSheetHeight?.let { minOf(height, it, maxScreenHeight) } ?: minOf(height, maxScreenHeight)
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
    val position = sheetContainer?.top?.pxToDp() ?: 0f
    return baseInfo.copy(position = position)
  }

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
    // Notify delegate about size change
    delegate?.viewControllerDidChangeSize(w, h)
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
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

  @OptIn(UnstableReactNativeAPI::class)
  @Suppress("DEPRECATION")
  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher, reactContext)
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
}
