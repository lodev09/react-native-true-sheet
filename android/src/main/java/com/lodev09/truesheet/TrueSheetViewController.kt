package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.util.TypedValue
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import androidx.core.view.isNotEmpty
import androidx.core.view.isVisible
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
import com.lodev09.truesheet.core.GrabberOptions
import com.lodev09.truesheet.core.RNScreensFragmentObserver
import com.lodev09.truesheet.core.TrueSheetGrabberView
import com.lodev09.truesheet.utils.ScreenUtils

data class DetentInfo(val index: Int, val position: Float)

interface TrueSheetViewControllerDelegate {
  fun viewControllerWillPresent(index: Int, position: Float, detent: Float)
  fun viewControllerDidPresent(index: Int, position: Float, detent: Float)
  fun viewControllerWillDismiss()
  fun viewControllerDidDismiss(hadParent: Boolean)
  fun viewControllerDidChangeDetent(index: Int, position: Float, detent: Float)
  fun viewControllerDidDragBegin(index: Int, position: Float, detent: Float)
  fun viewControllerDidDragChange(index: Int, position: Float, detent: Float)
  fun viewControllerDidDragEnd(index: Int, position: Float, detent: Float)
  fun viewControllerDidChangePosition(index: Float, position: Float, detent: Float, realtime: Boolean)
  fun viewControllerDidChangeSize(width: Int, height: Int)
  fun viewControllerWillFocus()
  fun viewControllerDidFocus()
  fun viewControllerWillBlur()
  fun viewControllerDidBlur()
  fun viewControllerDidBackPress()
}

/**
 * TrueSheetViewController manages the bottom sheet dialog and its presentation lifecycle.
 * This view also acts as a RootView to properly handle and dispatch touch events to React Native.
 */
@SuppressLint("ClickableViewAccessibility", "ViewConstructor")
class TrueSheetViewController(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  RootView {

  companion object {
    const val TAG_NAME = "TrueSheet"

    private const val MAX_HALF_EXPANDED_RATIO = 0.999f

    private const val GRABBER_TAG = "TrueSheetGrabber"
    private const val DEFAULT_MAX_WIDTH = 640 // dp
    private const val DEFAULT_CORNER_RADIUS = 16 // dp
  }

  // ====================================================================
  // MARK: - Delegate
  // ====================================================================

  var delegate: TrueSheetViewControllerDelegate? = null

  // ====================================================================
  // MARK: - Dialog & Views
  // ====================================================================

  private var dialog: BottomSheetDialog? = null

  private val behavior: BottomSheetBehavior<FrameLayout>?
    get() = dialog?.behavior

  private val sheetContainer: FrameLayout?
    get() = this.parent as? FrameLayout

  private val bottomSheetView: FrameLayout?
    get() = dialog?.findViewById(com.google.android.material.R.id.design_bottom_sheet)

  private val containerView: TrueSheetContainerView?
    get() = if (this.isNotEmpty()) getChildAt(0) as? TrueSheetContainerView else null

  private val contentHeight: Int
    get() = containerView?.contentHeight ?: 0

  private val headerHeight: Int
    get() = containerView?.headerHeight ?: 0

  // ====================================================================
  // MARK: - State
  // ====================================================================

  var isPresented = false
    private set

  var isDialogVisible = false
    private set

  var currentDetentIndex: Int = -1
    private set

  // Resolved detent positions (Y coordinate when sheet rests at each detent)
  private val resolvedDetentPositions = mutableListOf<Int>()

  private var isDragging = false
  private var isReconfiguring = false
  private var windowAnimation: Int = 0
  private var lastEmittedPositionPx: Int = -1

  var presentPromise: (() -> Unit)? = null
  var dismissPromise: (() -> Unit)? = null

  // Reference to parent TrueSheetView (if presented from another sheet)
  var parentSheetView: TrueSheetView? = null

  // ====================================================================
  // MARK: - Configuration Properties
  // ====================================================================

  var screenHeight = 0
  var screenWidth = 0
  var maxSheetHeight: Int? = null
  var detents = mutableListOf(0.5, 1.0)

  var dimmed = true
  var dimmedDetentIndex = 0
  var grabber: Boolean = true
  var grabberOptions: GrabberOptions? = null
  var sheetCornerRadius: Float = -1f
  var sheetBackgroundColor: Int = 0
  var edgeToEdgeFullScreen: Boolean = false

  var dismissible: Boolean = true
    set(value) {
      field = value
      dialog?.apply {
        setCanceledOnTouchOutside(value)
        setCancelable(value)
        behavior.isHideable = value
      }
    }

  var draggable: Boolean = true
    set(value) {
      field = value
      behavior?.isDraggable = value
    }

  // ====================================================================
  // MARK: - Computed Properties
  // ====================================================================

  val statusBarHeight: Int
    get() = ScreenUtils.getStatusBarHeight(reactContext)

  /**
   * The bottom inset (navigation bar height) to add to sheet height.
   * This matches iOS behavior where the system adds bottom safe area inset internally.
   */
  private val bottomInset: Int
    get() = ScreenUtils.getNavigationBarHeight(reactContext)

  /**
   * Edge-to-edge is enabled by default on API 36+, or when explicitly configured.
   */
  private val edgeToEdgeEnabled: Boolean
    get() {
      val defaultEnabled = android.os.Build.VERSION.SDK_INT >= 36
      return BuildConfig.EDGE_TO_EDGE_ENABLED || dialog?.edgeToEdgeEnabled == true || defaultEnabled
    }

  /**
   * The top inset to apply when edge-to-edge is enabled but not full-screen.
   * This prevents the sheet from going under the status bar.
   */
  private val sheetTopInset: Int
    get() = if (edgeToEdgeEnabled && !edgeToEdgeFullScreen) statusBarHeight else 0

  // ====================================================================
  // MARK: - Touch Dispatchers
  // ====================================================================

  /**
   * Touch dispatchers are required for RootView to properly forward touch events to React Native.
   */
  internal var eventDispatcher: EventDispatcher? = null
  private val jSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null

  // ====================================================================
  // MARK: - Modal Observer
  // ====================================================================

  /**
   * Observes react-native-screens modal fragments to hide/show the sheet appropriately.
   * This prevents the sheet from rendering on top of modals.
   */
  private var rnScreensObserver: RNScreensFragmentObserver? = null

  // ====================================================================
  // MARK: - Initialization
  // ====================================================================

  init {
    screenHeight = ScreenUtils.getScreenHeight(reactContext, edgeToEdgeEnabled)
    screenWidth = ScreenUtils.getScreenWidth(reactContext)
    jSPointerDispatcher = JSPointerDispatcher(this)
  }

  // ====================================================================
  // MARK: - Dialog Lifecycle
  // ====================================================================

  fun createDialog() {
    if (dialog != null) return

    val style = if (edgeToEdgeEnabled) {
      com.lodev09.truesheet.R.style.TrueSheetEdgeToEdgeEnabledDialog
    } else {
      com.lodev09.truesheet.R.style.TrueSheetDialog
    }

    dialog = BottomSheetDialog(reactContext, style).apply {
      setContentView(this@TrueSheetViewController)

      window?.apply {
        windowAnimation = attributes.windowAnimations
      }

      setupModalObserver()
      setupDialogListeners(this)
      setupBottomSheetBehavior(this)

      setCanceledOnTouchOutside(dismissible)
      setCancelable(dismissible)
      behavior.isHideable = dismissible
      behavior.isDraggable = draggable

      // Handle back press
      onBackPressedDispatcher.addCallback(object : androidx.activity.OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          this@TrueSheetViewController.delegate?.viewControllerDidBackPress()
          if (dismissible) {
            dismiss()
          }
        }
      })
    }
  }

  private fun cleanupDialog() {
    dialog?.apply {
      setOnShowListener(null)
      setOnCancelListener(null)
      setOnDismissListener(null)
    }

    cleanupModalObserver()
    sheetContainer?.removeView(this)

    dialog = null
    isDragging = false
    isPresented = false
    isDialogVisible = false
    lastEmittedPositionPx = -1
  }

  private fun setupDialogListeners(dialog: BottomSheetDialog) {
    dialog.setOnShowListener {
      isPresented = true
      isDialogVisible = true
      resetAnimation()
      setupBackground()
      setupGrabber()

      sheetContainer?.post {
        val detentInfo = getDetentInfoForIndex(currentDetentIndex)
        val detent = getDetentValueForIndex(detentInfo.index)
        val positionPx = bottomSheetView?.let { ScreenUtils.getScreenY(it) } ?: screenHeight

        delegate?.viewControllerDidPresent(detentInfo.index, detentInfo.position, detent)

        // Store resolved position for initial detent
        storeResolvedPosition(detentInfo.index)
        emitChangePositionDelegate(positionPx, realtime = false)

        // Notify parent sheet that it has lost focus (after this sheet appeared)
        parentSheetView?.viewControllerDidBlur()

        // Emit didFocus with didPresent
        delegate?.viewControllerDidFocus()

        presentPromise?.invoke()
        presentPromise = null

        positionFooter()
      }
    }

    dialog.setOnCancelListener {
      // User-initiated dismiss (back button, tap outside)
      // Emit willBlur with willDismiss
      delegate?.viewControllerWillBlur()
      delegate?.viewControllerWillDismiss()

      // Notify parent sheet that it is about to regain focus
      parentSheetView?.viewControllerWillFocus()
    }

    dialog.setOnDismissListener {
      val hadParent = parentSheetView != null

      // Notify parent sheet that it has regained focus
      parentSheetView?.viewControllerDidFocus()
      parentSheetView = null

      // Emit didBlur with didDismiss
      delegate?.viewControllerDidBlur()
      delegate?.viewControllerDidDismiss(hadParent)

      dismissPromise?.invoke()
      dismissPromise = null

      cleanupDialog()
    }
  }

  private fun setupBottomSheetBehavior(dialog: BottomSheetDialog) {
    dialog.behavior.addBottomSheetCallback(
      object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(sheetView: View, slideOffset: Float) {
          val behavior = behavior ?: return
          val positionPx = getCurrentPositionPx(sheetView)

          emitChangePositionDelegate(positionPx, realtime = true)

          when (behavior.state) {
            BottomSheetBehavior.STATE_DRAGGING,
            BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

            else -> { }
          }

          positionFooter(slideOffset)
        }

        override fun onStateChanged(sheetView: View, newState: Int) {
          if (newState == BottomSheetBehavior.STATE_HIDDEN) {
            // setOnDismissListener handles didBlur/didDismiss
            dialog.dismiss()
            return
          }

          if (!isPresented) return

          when (newState) {
            BottomSheetBehavior.STATE_DRAGGING -> handleDragBegin(sheetView)

            BottomSheetBehavior.STATE_EXPANDED,
            BottomSheetBehavior.STATE_COLLAPSED,
            BottomSheetBehavior.STATE_HALF_EXPANDED -> {
              // Ignore state changes triggered by content size reconfiguration
              if (isReconfiguring) return

              getDetentInfoForState(newState)?.let { detentInfo ->
                // Store resolved position when sheet settles
                storeResolvedPosition(detentInfo.index)

                if (isDragging) {
                  // Handle drag end
                  val detent = getDetentValueForIndex(detentInfo.index)
                  delegate?.viewControllerDidDragEnd(detentInfo.index, detentInfo.position, detent)

                  if (detentInfo.index != currentDetentIndex) {
                    presentPromise?.invoke()
                    presentPromise = null
                    currentDetentIndex = detentInfo.index
                    setupDimmedBackground(detentInfo.index)
                    delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
                  }

                  isDragging = false
                } else {
                  // Handle programmatic resize - emit detent change after sheet settles
                  if (detentInfo.index != currentDetentIndex) {
                    val detent = getDetentValueForIndex(detentInfo.index)
                    currentDetentIndex = detentInfo.index
                    delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
                  }
                }
              }
            }

            else -> {}
          }
        }
      }
    )
  }

  private fun setupModalObserver() {
    rnScreensObserver = RNScreensFragmentObserver(
      reactContext = reactContext,
      onModalWillPresent = {
        if (isPresented) {
          delegate?.viewControllerWillBlur()
        }
      },
      onModalPresented = {
        if (isPresented) {
          hideDialog()
          delegate?.viewControllerDidBlur()
        }
      },
      onModalWillDismiss = {
        if (isPresented) {
          delegate?.viewControllerWillFocus()
        }
      },
      onModalDismissed = {
        if (isPresented) {
          showDialog()
          delegate?.viewControllerDidFocus()
        }
      }
    )
    rnScreensObserver?.start()
  }

  private fun cleanupModalObserver() {
    rnScreensObserver?.stop()
    rnScreensObserver = null
  }

  // ====================================================================
  // MARK: - Dialog Visibility (for stacking)
  // ====================================================================

  /**
   * Returns true if the sheet's top is at or above the status bar.
   */
  val isExpanded: Boolean
    get() {
      val sheetTop = bottomSheetView?.top ?: return false
      return sheetTop <= statusBarHeight
    }

  /**
   * Returns the current top position of the sheet (Y coordinate from screen top).
   * Used for comparing sheet positions during stacking.
   */
  val currentSheetTop: Int
    get() = bottomSheetView?.let { ScreenUtils.getScreenY(it) } ?: screenHeight

  /**
   * Returns the expected top position of the sheet when presented at the given detent index.
   * Used for comparing sheet positions before presentation.
   */
  fun getExpectedSheetTop(detentIndex: Int): Int {
    if (detentIndex < 0 || detentIndex >= detents.size) return screenHeight
    val detentHeight = getDetentHeight(detents[detentIndex])
    return screenHeight - detentHeight
  }

  /**
   * Hides the dialog without dismissing it.
   * Used when another TrueSheet presents on top or when RN screen is presented.
   */
  fun hideDialog() {
    isDialogVisible = false
    dialog?.window?.decorView?.visibility = INVISIBLE

    // Emit off-screen position (detent = 0 since sheet is fully hidden)
    emitChangePositionDelegate(screenHeight, realtime = false)
  }

  /**
   * Shows a previously hidden dialog.
   * Used when the sheet on top dismisses.
   */
  fun showDialog() {
    isDialogVisible = true
    dialog?.window?.decorView?.visibility = VISIBLE

    // Emit current position
    val positionPx = bottomSheetView?.let { ScreenUtils.getScreenY(it) } ?: screenHeight
    emitChangePositionDelegate(positionPx, realtime = false)
  }

  // ====================================================================
  // MARK: - Presentation
  // ====================================================================

  fun present(detentIndex: Int, animated: Boolean = true) {
    val dialog = this.dialog ?: run {
      RNLog.w(reactContext, "TrueSheet: No dialog available. Ensure the sheet is mounted before presenting.")
      return
    }

    setupDimmedBackground(detentIndex)

    if (isPresented) {
      // Detent change will be emitted when sheet settles in onStateChanged
      // Don't update currentDetentIndex here - it will be updated when sheet settles
      setStateForDetentIndex(detentIndex)
    } else {
      currentDetentIndex = detentIndex
      isDragging = false
      setupSheetDetents()
      setStateForDetentIndex(detentIndex)

      val detentInfo = getDetentInfoForIndex(detentIndex)
      val detent = getDetentValueForIndex(detentInfo.index)

      // Notify parent sheet that it is about to lose focus (before this sheet appears)
      parentSheetView?.viewControllerWillBlur()

      delegate?.viewControllerWillPresent(detentInfo.index, detentInfo.position, detent)

      // Emit willFocus with willPresent
      delegate?.viewControllerWillFocus()

      if (!animated) {
        dialog.window?.setWindowAnimations(0)
      }

      dialog.show()
    }
  }

  fun dismiss(animated: Boolean = true) {
    // Emit willBlur with willDismiss
    delegate?.viewControllerWillBlur()
    delegate?.viewControllerWillDismiss()

    // Notify parent sheet that it is about to regain focus
    parentSheetView?.viewControllerWillFocus()

    this.post {
      // Emit off-screen position (detent = 0 since sheet is fully hidden)
      emitChangePositionDelegate(screenHeight, realtime = false)
    }

    if (!animated) {
      dialog?.window?.setWindowAnimations(0)
    }

    // Temporarily enable hideable to allow STATE_HIDDEN transition
    behavior?.isHideable = true
    behavior?.state = BottomSheetBehavior.STATE_HIDDEN
  }

  // ====================================================================
  // MARK: - Sheet Configuration
  // ====================================================================

  fun setupSheetDetents() {
    val behavior = this.behavior ?: return

    // Reset resolved positions if detents count changed
    if (resolvedDetentPositions.size != detents.size) {
      resolvedDetentPositions.clear()
      repeat(detents.size) { resolvedDetentPositions.add(0) }
    }

    // Always update auto detent positions based on current content height
    for (i in detents.indices) {
      if (detents[i] == -1.0) {
        val detentHeight = getDetentHeight(detents[i])
        resolvedDetentPositions[i] = screenHeight - detentHeight
      }
    }

    // Flag to prevent state change callbacks from updating detent index during reconfiguration
    isReconfiguring = true

    behavior.apply {
      isFitToContents = false
      maxWidth = DEFAULT_MAX_WIDTH.dpToPx().toInt()

      val oldExpandOffset = expandedOffset

      when (detents.size) {
        1 -> {
          setPeekHeight(getDetentHeight(detents[0]), isPresented)
          halfExpandedRatio = minOf(peekHeight.toFloat() / screenHeight.toFloat(), MAX_HALF_EXPANDED_RATIO)
          expandedOffset = screenHeight - peekHeight
          isFitToContents = expandedOffset == 0
        }

        2 -> {
          setPeekHeight(getDetentHeight(detents[0]), isPresented)
          halfExpandedRatio = minOf(getDetentHeight(detents[1]).toFloat() / screenHeight.toFloat(), MAX_HALF_EXPANDED_RATIO)
          expandedOffset = screenHeight - getDetentHeight(detents[1])
          isFitToContents = expandedOffset == 0
        }

        3 -> {
          setPeekHeight(getDetentHeight(detents[0]), isPresented)
          halfExpandedRatio = minOf(getDetentHeight(detents[1]).toFloat() / screenHeight.toFloat(), MAX_HALF_EXPANDED_RATIO)
          expandedOffset = screenHeight - getDetentHeight(detents[2])
        }
      }

      // Keep container size in sync with sheet size
      if (oldExpandOffset != expandedOffset || expandedOffset == 0) {
        val offset = if (expandedOffset == 0) statusBarHeight else 0
        val newHeight = screenHeight - expandedOffset - offset
        delegate?.viewControllerDidChangeSize(width, newHeight)
      }

      if (isPresented) {
        // Re-apply current state to update position after config changes
        setStateForDetentIndex(currentDetentIndex)
      }

      isReconfiguring = false
    }
  }

  fun setupGrabber() {
    val bottomSheet = bottomSheetView ?: return

    bottomSheet.findViewWithTag<View>(GRABBER_TAG)?.let {
      bottomSheet.removeView(it)
    }

    if (!grabber || !draggable) return

    val grabberView = TrueSheetGrabberView(reactContext, grabberOptions).apply {
      tag = GRABBER_TAG
    }

    bottomSheet.addView(grabberView)
  }

  fun setupBackground() {
    val bottomSheet = bottomSheetView ?: return

    val cornerRadius = if (sheetCornerRadius < 0) DEFAULT_CORNER_RADIUS.dpToPx() else sheetCornerRadius
    val outerRadii = floatArrayOf(cornerRadius, cornerRadius, cornerRadius, cornerRadius, 0f, 0f, 0f, 0f)
    val backgroundColor = if (sheetBackgroundColor != 0) sheetBackgroundColor else getDefaultBackgroundColor()

    bottomSheet.background = ShapeDrawable(RoundRectShape(outerRadii, null, null)).apply {
      paint.color = backgroundColor
    }
    bottomSheet.clipToOutline = true
  }

  /**
   * Configures the dimmed background based on the current detent index.
   * When not dimmed, touch events pass through to the activity behind the sheet.
   */
  fun setupDimmedBackground(detentIndex: Int) {
    val dialog = this.dialog ?: return
    dialog.window?.apply {
      val view = findViewById<View>(com.google.android.material.R.id.touch_outside)

      if (dimmed && detentIndex >= dimmedDetentIndex) {
        view.setOnTouchListener(null)
        setFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND, WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        dialog.setCanceledOnTouchOutside(dismissible)
      } else {
        // Forward touch events to the activity when not dimmed
        view.setOnTouchListener { v, event ->
          event.setLocation(event.rawX - v.x, event.rawY - v.y)
          reactContext.currentActivity?.dispatchTouchEvent(event)
          false
        }
        clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        dialog.setCanceledOnTouchOutside(false)
      }
    }
  }

  fun resetAnimation() {
    dialog?.window?.setWindowAnimations(windowAnimation)
  }

  /**
   * Positions the footer view at the bottom of the sheet.
   * The footer stays fixed at the bottom edge of the visible sheet area,
   * adjusting during drag gestures via slideOffset.
   */
  fun positionFooter(slideOffset: Float? = null) {
    val footerView = containerView?.footerView ?: return
    val bottomSheet = bottomSheetView ?: return

    val footerHeight = footerView.height
    val bottomSheetY = ScreenUtils.getScreenY(bottomSheet)

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

  fun setStateForDetentIndex(index: Int) {
    behavior?.state = getStateForDetentIndex(index)
  }

  fun setSoftInputMode(mode: Int) {
    dialog?.window?.setSoftInputMode(mode)
  }

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

  // ====================================================================
  // MARK: - Position Change Delegate
  // ====================================================================

  /**
   * Emits position change to the delegate if the position has changed.
   * @param positionPx The current position in pixels (screen Y coordinate)
   * @param realtime Whether the position is a real-time value (during drag or animation tracking)
   */
  private fun emitChangePositionDelegate(positionPx: Int, realtime: Boolean) {
    if (positionPx == lastEmittedPositionPx) return

    lastEmittedPositionPx = positionPx
    val position = positionPx.pxToDp()
    val interpolatedIndex = getInterpolatedIndexForPosition(positionPx)
    val detent = getInterpolatedDetentForPosition(positionPx)
    delegate?.viewControllerDidChangePosition(interpolatedIndex, position, detent, realtime)
  }

  /**
   * Stores the current Y position as the resolved position for the given detent index.
   * This is called when the sheet settles at a detent to capture the actual position
   * which may differ from the calculated position due to system adjustments.
   */
  private fun storeResolvedPosition(index: Int) {
    if (index < 0 || index >= resolvedDetentPositions.size) return
    val positionPx = bottomSheetView?.let { ScreenUtils.getScreenY(it) } ?: return
    if (positionPx in 1..<screenHeight) {
      resolvedDetentPositions[index] = positionPx
    }
  }

  /**
   * Stores the resolved position for the current detent.
   * Called from TrueSheetView when content size changes.
   */
  fun storeCurrentResolvedPosition() {
    storeResolvedPosition(currentDetentIndex)
  }

  /**
   * Returns the estimated Y position for a detent index, using stored positions when available.
   */
  private fun getEstimatedPositionForIndex(index: Int): Int {
    if (index < 0 || index >= resolvedDetentPositions.size) return screenHeight

    val storedPos = resolvedDetentPositions[index]
    if (storedPos > 0) return storedPos

    // Estimate based on getDetentHeight which accounts for bottomInset and maxAllowedHeight
    if (index < detents.size) {
      val detentHeight = getDetentHeight(detents[index])
      return screenHeight - detentHeight
    }

    return screenHeight
  }

  /**
   * Finds the segment index and interpolation progress for a given position.
   * Returns a Triple of (fromIndex, toIndex, progress) where progress is 0-1 within that segment.
   * Returns null if position count is less than 2.
   */
  private fun findSegmentForPosition(positionPx: Int): Triple<Int, Int, Float>? {
    val count = resolvedDetentPositions.size
    if (count < 2) return null

    val firstPos = getEstimatedPositionForIndex(0)
    val lastPos = getEstimatedPositionForIndex(count - 1)

    // Below first detent
    if (positionPx > firstPos) {
      val range = screenHeight - firstPos
      val progress = if (range > 0) (positionPx - firstPos).toFloat() / range else 0f
      return Triple(-1, 0, progress) // Special index -1 for below first
    }

    // Above last detent
    if (positionPx < lastPos) {
      return Triple(count - 1, count - 1, 0f)
    }

    // Find segment (positions decrease as index increases)
    for (i in 0 until count - 1) {
      val pos = getEstimatedPositionForIndex(i)
      val nextPos = getEstimatedPositionForIndex(i + 1)

      if (positionPx in nextPos..pos) {
        val range = pos - nextPos
        val progress = if (range > 0) (pos - positionPx).toFloat() / range else 0f
        return Triple(i, i + 1, maxOf(0f, minOf(1f, progress)))
      }
    }

    return Triple(count - 1, count - 1, 0f)
  }

  /**
   * Calculates the interpolated index based on position.
   * Returns a continuous value (e.g., 0.5 means halfway between detent 0 and 1).
   */
  private fun getInterpolatedIndexForPosition(positionPx: Int): Float {
    val count = resolvedDetentPositions.size
    if (count == 0) return -1f
    if (count == 1) return 0f

    val segment = findSegmentForPosition(positionPx) ?: return 0f
    val (fromIndex, _, progress) = segment

    // Below first detent
    if (fromIndex == -1) return -progress

    return fromIndex + progress
  }

  /**
   * Calculates the interpolated detent value based on position.
   * Returns the actual screen fraction, clamped to valid detent range.
   */
  private fun getInterpolatedDetentForPosition(positionPx: Int): Float {
    val count = resolvedDetentPositions.size
    if (count == 0) return 0f

    val segment = findSegmentForPosition(positionPx) ?: return getDetentValueForIndex(0)
    val (fromIndex, toIndex, progress) = segment

    // Below first detent
    if (fromIndex == -1) {
      val firstDetent = getDetentValueForIndex(0)
      return maxOf(0f, firstDetent * (1 - progress))
    }

    val fromDetent = getDetentValueForIndex(fromIndex)
    val toDetent = getDetentValueForIndex(toIndex)
    return fromDetent + progress * (toDetent - fromDetent)
  }

  /**
   * Gets the detent value (fraction) for a given index.
   * Returns the raw screen fraction without bottomInset for interpolation calculations.
   * Note: bottomInset is only added in getDetentHeight() for actual sheet sizing.
   */
  private fun getDetentValueForIndex(index: Int): Float {
    if (index < 0 || index >= detents.size) return 0f
    val value = detents[index]
    return if (value == -1.0) {
      (contentHeight + headerHeight).toFloat() / screenHeight.toFloat()
    } else {
      value.toFloat()
    }
  }

  // ====================================================================
  // MARK: - Drag Handling
  // ====================================================================

  private fun getCurrentDetentInfo(sheetView: View): DetentInfo {
    val screenY = ScreenUtils.getScreenY(sheetView)
    return DetentInfo(currentDetentIndex, screenY.pxToDp())
  }

  private fun getCurrentPositionPx(sheetView: View): Int = ScreenUtils.getScreenY(sheetView)

  private fun handleDragBegin(sheetView: View) {
    val detentInfo = getCurrentDetentInfo(sheetView)
    val detent = getDetentValueForIndex(detentInfo.index)
    delegate?.viewControllerDidDragBegin(detentInfo.index, detentInfo.position, detent)
    isDragging = true
  }

  private fun handleDragChange(sheetView: View) {
    if (!isDragging) return
    val detentInfo = getCurrentDetentInfo(sheetView)
    val detent = getDetentValueForIndex(detentInfo.index)
    delegate?.viewControllerDidDragChange(detentInfo.index, detentInfo.position, detent)
  }

  // ====================================================================
  // MARK: - Detent Calculations
  // ====================================================================

  private fun getDetentHeight(detent: Double): Int {
    val height: Int = if (detent == -1.0) {
      // For auto detent, add bottomInset to match iOS behavior where the system
      // adds bottom safe area inset internally to the sheet height
      contentHeight + headerHeight + bottomInset
    } else {
      if (detent <= 0.0 || detent > 1.0) {
        throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
      }
      // For fractional detents, add bottomInset to match iOS behavior
      (detent * screenHeight).toInt() + bottomInset
    }

    val maxAllowedHeight = screenHeight - sheetTopInset
    return maxSheetHeight?.let { minOf(height, it, maxAllowedHeight) } ?: minOf(height, maxAllowedHeight)
  }

  private fun getStateForDetentIndex(index: Int): Int =
    when (detents.size) {
      1 -> BottomSheetBehavior.STATE_EXPANDED

      2 -> when (index) {
        0 -> BottomSheetBehavior.STATE_COLLAPSED
        1 -> BottomSheetBehavior.STATE_EXPANDED
        else -> BottomSheetBehavior.STATE_HIDDEN
      }

      3 -> when (index) {
        0 -> BottomSheetBehavior.STATE_COLLAPSED
        1 -> BottomSheetBehavior.STATE_HALF_EXPANDED
        2 -> BottomSheetBehavior.STATE_EXPANDED
        else -> BottomSheetBehavior.STATE_HIDDEN
      }

      else -> BottomSheetBehavior.STATE_HIDDEN
    }

  fun getDetentInfoForState(state: Int): DetentInfo? =
    when (detents.size) {
      1 -> when (state) {
        BottomSheetBehavior.STATE_COLLAPSED,
        BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(0, getPositionForDetentIndex(0))

        else -> null
      }

      2 -> when (state) {
        BottomSheetBehavior.STATE_COLLAPSED -> DetentInfo(0, getPositionForDetentIndex(0))
        BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(1, getPositionForDetentIndex(1))
        else -> null
      }

      3 -> when (state) {
        BottomSheetBehavior.STATE_COLLAPSED -> DetentInfo(0, getPositionForDetentIndex(0))
        BottomSheetBehavior.STATE_HALF_EXPANDED -> DetentInfo(1, getPositionForDetentIndex(1))
        BottomSheetBehavior.STATE_EXPANDED -> DetentInfo(2, getPositionForDetentIndex(2))
        else -> null
      }

      else -> null
    }

  private fun getPositionForDetentIndex(index: Int): Float {
    if (index < 0 || index >= detents.size) return 0f

    bottomSheetView?.let {
      val screenY = ScreenUtils.getScreenY(it)
      if (screenY > 0) return screenY.pxToDp()
    }

    val detentHeight = getDetentHeight(detents[index])
    return (screenHeight - detentHeight).pxToDp()
  }

  fun getDetentInfoForIndex(index: Int) = getDetentInfoForState(getStateForDetentIndex(index)) ?: DetentInfo(0, 0f)

  // ====================================================================
  // MARK: - RootView Implementation
  // ====================================================================

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)
    (getTag(R.id.react_test_id) as? String)?.let { info.viewIdResourceName = it }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (w == oldw && h == oldh) return

    // Skip when fully expanding to full screen (edgeToEdgeFullScreen enabled)
    // Size keeps changing on this case
    if (h + statusBarHeight > screenHeight && isExpanded && oldw == w) {
      return
    }

    val oldScreenHeight = screenHeight
    screenHeight = ScreenUtils.getScreenHeight(reactContext, edgeToEdgeEnabled)

    if (isPresented && oldScreenHeight != screenHeight && oldScreenHeight > 0) {
      setupSheetDetents()
      this.post {
        positionFooter()
        storeResolvedPosition(currentDetentIndex)
        val positionPx = bottomSheetView?.let { ScreenUtils.getScreenY(it) } ?: screenHeight
        emitChangePositionDelegate(positionPx, realtime = false)
      }
    }
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  // ====================================================================
  // MARK: - Touch Event Handling
  // ====================================================================

  /**
   * Custom touch dispatch to handle footer touch events.
   * The footer is positioned outside the normal view hierarchy, so we need to
   * manually check if touches fall within its bounds and forward them.
   */
  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    val footer = containerView?.footerView
    if (footer != null && footer.isVisible) {
      val footerLocation = ScreenUtils.getScreenLocation(footer)
      val touchScreenX = event.rawX.toInt()
      val touchScreenY = event.rawY.toInt()

      if (touchScreenX >= footerLocation[0] &&
        touchScreenX <= footerLocation[0] + footer.width &&
        touchScreenY >= footerLocation[1] &&
        touchScreenY <= footerLocation[1] + footer.height
      ) {
        val localEvent = MotionEvent.obtain(event)
        localEvent.setLocation(
          (touchScreenX - footerLocation[0]).toFloat(),
          (touchScreenY - footerLocation[1]).toFloat()
        )
        val handled = footer.dispatchTouchEvent(localEvent)
        localEvent.recycle()
        if (handled) return true
      }
    }
    return super.dispatchTouchEvent(event)
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let {
      jSTouchDispatcher.handleTouchEvent(event, it, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, it, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let {
      jSTouchDispatcher.handleTouchEvent(event, it, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, it, false)
    }
    super.onTouchEvent(event)
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
    eventDispatcher?.let {
      jSTouchDispatcher.onChildStartedNativeGesture(ev, it)
      jSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, it)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jSTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jSPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    super.requestDisallowInterceptTouchEvent(disallowIntercept)
  }
}
