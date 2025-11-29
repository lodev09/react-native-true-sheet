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

    private const val GRABBER_TAG = "TrueSheetGrabber"
    private const val DEFAULT_MAX_WIDTH = 640 // dp
    private const val DEFAULT_CORNER_RADIUS = 16 // dp

    /**
     * Gets the effective sheet height by subtracting headerHeight * 2.
     * This is needed because both native layout and Yoga layout account for the header separately.
     */
    fun getEffectiveSheetHeight(sheetHeight: Int, headerHeight: Int): Int = sheetHeight - headerHeight * 2
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

  private var isDragging = false
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
        emitChangePositionDelegate(detentInfo.index, positionPx, realtime = false)

        // Notify parent sheet that it has lost focus (after this sheet appeared)
        parentSheetView?.viewControllerDidBlur()

        presentPromise?.invoke()
        presentPromise = null

        positionFooter()
      }
    }

    dialog.setOnCancelListener {
      // Notify parent sheet that it is about to regain focus
      parentSheetView?.viewControllerWillFocus()

      delegate?.viewControllerWillDismiss()
    }

    dialog.setOnDismissListener {
      val hadParent = parentSheetView != null

      // Notify parent sheet that it has regained focus
      parentSheetView?.viewControllerDidFocus()
      parentSheetView = null

      dismissPromise?.invoke()
      dismissPromise = null
      delegate?.viewControllerDidDismiss(hadParent)
      cleanupDialog()
    }
  }

  private fun setupBottomSheetBehavior(dialog: BottomSheetDialog) {
    dialog.behavior.addBottomSheetCallback(
      object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(sheetView: View, slideOffset: Float) {
          val behavior = behavior ?: return
          val positionPx = getCurrentPositionPx(sheetView)
          val detentIndex = getDetentIndexForPosition(positionPx)

          emitChangePositionDelegate(detentIndex, positionPx, realtime = true)

          when (behavior.state) {
            BottomSheetBehavior.STATE_DRAGGING,
            BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

            else -> { }
          }

          positionFooter(slideOffset)
        }

        override fun onStateChanged(sheetView: View, newState: Int) {
          if (newState == BottomSheetBehavior.STATE_HIDDEN) {
            dismiss()
            return
          }

          if (!isPresented) return

          when (newState) {
            BottomSheetBehavior.STATE_DRAGGING -> handleDragBegin(sheetView)

            BottomSheetBehavior.STATE_EXPANDED,
            BottomSheetBehavior.STATE_COLLAPSED,
            BottomSheetBehavior.STATE_HALF_EXPANDED -> handleDragEnd(newState)

            else -> {}
          }
        }
      }
    )
  }

  private fun setupModalObserver() {
    rnScreensObserver = RNScreensFragmentObserver(
      reactContext = reactContext,
      onModalPresented = {
        if (isPresented) {
          hideDialog()
        }
      },
      onModalDismissed = {
        if (isPresented) {
          showDialog()
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
    dialog?.window?.decorView?.visibility = View.INVISIBLE

    // Emit off-screen position (detent = 0 since sheet is fully hidden)
    emitChangePositionDelegate(currentDetentIndex, screenHeight, realtime = false)
  }

  /**
   * Shows a previously hidden dialog.
   * Used when the sheet on top dismisses.
   */
  fun showDialog() {
    isDialogVisible = true
    dialog?.window?.decorView?.visibility = View.VISIBLE

    // Emit current position
    val positionPx = bottomSheetView?.let { ScreenUtils.getScreenY(it) } ?: screenHeight
    emitChangePositionDelegate(currentDetentIndex, positionPx, realtime = false)
  }

  // ====================================================================
  // MARK: - Presentation
  // ====================================================================

  fun present(detentIndex: Int, animated: Boolean = true) {
    val dialog = this.dialog ?: run {
      RNLog.w(reactContext, "TrueSheet: No dialog available. Ensure the sheet is mounted before presenting.")
      return
    }

    currentDetentIndex = detentIndex
    setupDimmedBackground(detentIndex)

    if (isPresented) {
      val detentInfo = getDetentInfoForIndex(detentIndex)
      val detent = getDetentValueForIndex(detentInfo.index)
      delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
      setStateForDetentIndex(detentIndex)
    } else {
      isDragging = false
      setupSheetDetents()
      setStateForDetentIndex(detentIndex)

      val detentInfo = getDetentInfoForIndex(detentIndex)
      val detent = getDetentValueForIndex(detentInfo.index)

      // Notify parent sheet that it is about to lose focus (before this sheet appears)
      parentSheetView?.viewControllerWillBlur()

      delegate?.viewControllerWillPresent(detentInfo.index, detentInfo.position, detent)

      if (!animated) {
        dialog.window?.setWindowAnimations(0)
      }

      dialog.show()
    }
  }

  fun dismiss() {
    this.post {
      // Emit off-screen position (detent = 0 since sheet is fully hidden)
      emitChangePositionDelegate(currentDetentIndex, screenHeight, realtime = false)
    }
    dialog?.dismiss()
  }

  // ====================================================================
  // MARK: - Sheet Configuration
  // ====================================================================

  fun setupSheetDetents() {
    val behavior = this.behavior ?: return

    behavior.apply {
      skipCollapsed = false
      isFitToContents = true
      maxWidth = DEFAULT_MAX_WIDTH.dpToPx().toInt()

      when (detents.size) {
        1 -> {
          maxHeight = getDetentHeight(detents[0])
          skipCollapsed = true

          if (isPresented && detents[0] == -1.0) {
            sheetContainer?.apply {
              val params = layoutParams
              params.height = maxHeight
              layoutParams = params
            }
          }
        }

        2 -> {
          setPeekHeight(getDetentHeight(detents[0]), isPresented)
          maxHeight = getDetentHeight(detents[1])
        }

        3 -> {
          isFitToContents = false
          setPeekHeight(getDetentHeight(detents[0]), isPresented)
          maxHeight = getDetentHeight(detents[2])
          expandedOffset = sheetTopInset
          halfExpandedRatio = minOf(getDetentHeight(detents[1]).toFloat() / screenHeight.toFloat(), 1.0f)
        }
      }
    }
  }

  fun setupGrabber() {
    val bottomSheet = bottomSheetView ?: return

    bottomSheet.findViewWithTag<View>(GRABBER_TAG)?.let {
      bottomSheet.removeView(it)
    }

    if (!grabber || !draggable) return

    val grabberView = TrueSheetGrabberView(reactContext).apply {
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
   * @param index The current detent index (discrete, used as fallback)
   * @param positionPx The current position in pixels (screen Y coordinate)
   * @param realtime Whether the position is a real-time value (during drag or animation tracking)
   */
  private fun emitChangePositionDelegate(index: Int, positionPx: Int, realtime: Boolean) {
    if (positionPx == lastEmittedPositionPx) return

    lastEmittedPositionPx = positionPx
    val position = positionPx.pxToDp()
    val interpolatedIndex = getInterpolatedIndexForPosition(positionPx)
    val detent = getDetentValueForIndex(kotlin.math.round(interpolatedIndex).toInt())
    delegate?.viewControllerDidChangePosition(interpolatedIndex, position, detent, realtime)
  }

  /**
   * Calculates the interpolated index based on position.
   * Returns a continuous value (e.g., 0.5 means halfway between detent 0 and 1).
   */
  private fun getInterpolatedIndexForPosition(positionPx: Int): Float {
    val count = detents.size
    if (count == 0) return -1f
    if (count == 1) return 0f

    // Convert position to detent fraction
    val currentDetent = (screenHeight - positionPx).toFloat() / screenHeight.toFloat()

    // Handle below first detent (interpolate from -1 to 0)
    val firstDetentValue = getDetentValueForIndex(0)
    if (currentDetent < firstDetentValue) {
      if (firstDetentValue <= 0) return 0f
      val progress = currentDetent / firstDetentValue
      return progress - 1f
    }

    // Find which segment the current detent falls into and interpolate
    for (i in 0 until count - 1) {
      val detentValue = getDetentValueForIndex(i)
      val nextDetentValue = getDetentValueForIndex(i + 1)

      if (currentDetent <= nextDetentValue) {
        val range = nextDetentValue - detentValue
        if (range <= 0) return i.toFloat()
        val progress = (currentDetent - detentValue) / range
        return i + maxOf(0f, minOf(1f, progress))
      }
    }

    return (count - 1).toFloat()
  }

  /**
   * Gets the detent value (fraction) for a given index.
   * For auto (-1), calculates the actual fraction from content + header height.
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

  /**
   * Returns the detent index for the current position.
   * Only reports a higher index when the sheet has reached that detent's height.
   */
  private fun getDetentIndexForPosition(positionPx: Int): Int {
    if (detents.isEmpty()) return 0

    val sheetHeight = screenHeight - positionPx

    // Find the highest detent index that the sheet has reached
    for (i in detents.indices.reversed()) {
      val detentHeight = getDetentHeight(detents[i])
      if (sheetHeight >= detentHeight) {
        return i
      }
    }

    return 0
  }

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

  private fun handleDragEnd(state: Int) {
    if (!isDragging) return

    val detentInfo = getDetentInfoForState(state)
    detentInfo?.let {
      val detent = getDetentValueForIndex(it.index)
      delegate?.viewControllerDidDragEnd(it.index, it.position, detent)

      if (it.index != currentDetentIndex) {
        presentPromise?.invoke()
        presentPromise = null

        currentDetentIndex = it.index
        setupDimmedBackground(it.index)
        delegate?.viewControllerDidChangeDetent(it.index, it.position, detent)
      }
    }

    isDragging = false
  }

  // ====================================================================
  // MARK: - Detent Calculations
  // ====================================================================

  private fun getDetentHeight(detent: Double): Int {
    val height: Int = if (detent == -1.0) {
      contentHeight + headerHeight
    } else {
      if (detent <= 0.0 || detent > 1.0) {
        throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
      }
      (detent * screenHeight).toInt()
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

    delegate?.viewControllerDidChangeSize(w, h)

    val oldScreenHeight = screenHeight
    screenHeight = ScreenUtils.getScreenHeight(reactContext, edgeToEdgeEnabled)

    if (isPresented && oldScreenHeight != screenHeight && oldScreenHeight > 0) {
      setupSheetDetents()
      this.post {
        positionFooter()
        val positionPx = bottomSheetView?.let { ScreenUtils.getScreenY(it) } ?: screenHeight
        emitChangePositionDelegate(currentDetentIndex, positionPx, realtime = false)
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
    if (footer != null && footer.visibility == View.VISIBLE) {
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
