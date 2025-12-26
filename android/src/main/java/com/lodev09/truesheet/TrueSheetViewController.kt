package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.os.Build
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityNodeInfo
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.coordinatorlayout.widget.CoordinatorLayout
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
import com.lodev09.truesheet.core.GrabberOptions
import com.lodev09.truesheet.core.RNScreensFragmentObserver
import com.lodev09.truesheet.core.TrueSheetBottomSheetView
import com.lodev09.truesheet.core.TrueSheetBottomSheetViewDelegate
import com.lodev09.truesheet.core.TrueSheetCoordinatorLayout
import com.lodev09.truesheet.core.TrueSheetCoordinatorLayoutDelegate
import com.lodev09.truesheet.core.TrueSheetDetentCalculator
import com.lodev09.truesheet.core.TrueSheetDetentCalculatorDelegate
import com.lodev09.truesheet.core.TrueSheetDimView
import com.lodev09.truesheet.core.TrueSheetDimViewDelegate
import com.lodev09.truesheet.core.TrueSheetKeyboardObserver
import com.lodev09.truesheet.core.TrueSheetKeyboardObserverDelegate
import com.lodev09.truesheet.core.TrueSheetStackManager
import com.lodev09.truesheet.utils.KeyboardUtils
import com.lodev09.truesheet.utils.ScreenUtils

// =============================================================================
// MARK: - Data Types & Delegate Protocol
// =============================================================================

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

// =============================================================================
// MARK: - TrueSheetViewController
// =============================================================================

/**
 * Controls the presentation and behavior of a bottom sheet.
 *
 * Uses CoordinatorLayout with BottomSheetBehavior to manage the sheet within the activity window,
 * enabling touch pass-through to underlying views. Handles detent configuration, drag interactions,
 * keyboard avoidance, dimmed backgrounds, back button, and lifecycle events for stacked sheets.
 */
@SuppressLint("ClickableViewAccessibility", "ViewConstructor")
class TrueSheetViewController(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  RootView,
  TrueSheetDetentCalculatorDelegate,
  TrueSheetDimViewDelegate,
  TrueSheetCoordinatorLayoutDelegate,
  TrueSheetBottomSheetViewDelegate {

  companion object {
    const val TAG_NAME = "TrueSheet"

    private const val DEFAULT_MAX_WIDTH = 640 // dp
    private const val DEFAULT_CORNER_RADIUS = 16 // dp
    private const val TRANSLATE_ANIMATION_DURATION = 200L
    private const val DISMISS_DURATION = 200L
    private const val MODAL_FADE_DURATION = 150L
  }

  // =============================================================================
  // MARK: - Types
  // =============================================================================

  private sealed class InteractionState {
    data object Idle : InteractionState()
    data class Dragging(val startTop: Int) : InteractionState()
    data object Reconfiguring : InteractionState()
  }

  // =============================================================================
  // MARK: - Properties
  // =============================================================================

  var delegate: TrueSheetViewControllerDelegate? = null

  // CoordinatorLayout components (replaces DialogFragment)
  internal var sheetView: TrueSheetBottomSheetView? = null
  private var coordinatorLayout: TrueSheetCoordinatorLayout? = null
  private var dimView: TrueSheetDimView? = null
  private var parentDimView: TrueSheetDimView? = null

  // Back button handling
  private var backCallback: OnBackPressedCallback? = null

  // Presentation State
  var isPresented = false
    private set

  var isSheetVisible = false
    private set

  var currentDetentIndex: Int = -1
    private set

  private var interactionState: InteractionState = InteractionState.Idle
  private var isDismissing = false
  private var wasHiddenByModal = false
  private var shouldAnimatePresent = false
  private var isPresentAnimating = false

  private var lastStateWidth: Int = 0
  private var lastStateHeight: Int = 0
  private var lastEmittedPositionPx: Int = -1

  // Keyboard State
  private var detentIndexBeforeKeyboard: Int = -1
  private var isKeyboardTransitioning: Boolean = false

  // Promises
  var presentPromise: (() -> Unit)? = null
  var dismissPromise: (() -> Unit)? = null

  // For stacked sheets
  var parentSheetView: TrueSheetView? = null

  // Helper Objects
  private var keyboardObserver: TrueSheetKeyboardObserver? = null
  private var rnScreensObserver: RNScreensFragmentObserver? = null
  internal val detentCalculator = TrueSheetDetentCalculator(reactContext).apply {
    delegate = this@TrueSheetViewController
  }

  // Touch Dispatchers
  internal var eventDispatcher: EventDispatcher? = null
  private val jsTouchDispatcher = JSTouchDispatcher(this)
  private var jsPointerDispatcher: JSPointerDispatcher? = null

  // Detent Configuration
  override var maxSheetHeight: Int? = null
  override var detents: MutableList<Double> = mutableListOf(0.5, 1.0)

  // Appearance Configuration
  var dimmed = true
  var dimmedDetentIndex = 0
  override var grabber: Boolean = true
  override var grabberOptions: GrabberOptions? = null
  override var sheetBackgroundColor: Int? = null
  var insetAdjustment: String = "automatic"

  override var sheetCornerRadius: Float = DEFAULT_CORNER_RADIUS.dpToPx()
    set(value) {
      field = if (value < 0) DEFAULT_CORNER_RADIUS.dpToPx() else value
      if (isPresented) sheetView?.setupBackground()
    }

  override var sheetElevation: Float = -1f
    set(value) {
      field = value
      if (isPresented) sheetView?.setupElevation()
    }

  var dismissible: Boolean = true
    set(value) {
      field = value
      behavior?.isHideable = value
    }

  var draggable: Boolean = true
    set(value) {
      field = value
      behavior?.isDraggable = value
      if (isPresented) sheetView?.setupGrabber()
    }

  val isDimmedAtCurrentDetent: Boolean
    get() = dimmed && currentDetentIndex >= dimmedDetentIndex

  // =============================================================================
  // MARK: - Computed Properties
  // =============================================================================

  // Behavior
  private val behavior: BottomSheetBehavior<TrueSheetBottomSheetView>?
    get() = sheetView?.behavior

  private val containerView: TrueSheetContainerView?
    get() = if (this.isNotEmpty()) getChildAt(0) as? TrueSheetContainerView else null

  // Screen Measurements
  override val screenHeight: Int
    get() = ScreenUtils.getScreenHeight(reactContext)

  val screenWidth: Int
    get() = ScreenUtils.getScreenWidth(reactContext)

  // Includes system bars for accurate positioning
  override val realScreenHeight: Int
    get() = ScreenUtils.getRealScreenHeight(reactContext)

  // Content Measurements
  override val contentHeight: Int
    get() = containerView?.contentHeight ?: 0

  override val headerHeight: Int
    get() = containerView?.headerHeight ?: 0

  // Insets
  // Target keyboard height used for detent calculations
  override val keyboardInset: Int
    get() = keyboardObserver?.targetHeight ?: 0

  // Current animated keyboard height for positioning
  private val currentKeyboardInset: Int
    get() = keyboardObserver?.currentHeight ?: 0

  val bottomInset: Int
    get() = if (edgeToEdgeEnabled) ScreenUtils.getInsets(reactContext).bottom else 0

  val topInset: Int
    get() = if (edgeToEdgeEnabled) ScreenUtils.getInsets(reactContext).top else 0

  override val contentBottomInset: Int
    get() = if (insetAdjustment == "automatic") bottomInset else 0

  private val edgeToEdgeEnabled: Boolean
    get() {
      val defaultEnabled = android.os.Build.VERSION.SDK_INT >= 36
      return BuildConfig.EDGE_TO_EDGE_ENABLED || defaultEnabled
    }

  // Sheet State
  val isExpanded: Boolean
    get() {
      val sheetTop = sheetView?.top ?: return false
      return sheetTop <= topInset
    }

  val currentTranslationY: Int
    get() = sheetView?.translationY?.toInt() ?: 0

  override val isTopmostSheet: Boolean
    get() {
      val hostView = delegate as? TrueSheetView ?: return true
      return TrueSheetStackManager.isTopmostSheet(hostView)
    }

  private val dimViews: List<TrueSheetDimView>
    get() = listOfNotNull(dimView, parentDimView)

  // =============================================================================
  // MARK: - Initialization
  // =============================================================================

  init {
    jsPointerDispatcher = JSPointerDispatcher(this)
  }

  // =============================================================================
  // MARK: - Sheet Creation & Cleanup
  // =============================================================================

  fun createSheet() {
    if (coordinatorLayout != null) return

    // Create coordinator layout
    coordinatorLayout = TrueSheetCoordinatorLayout(reactContext).apply {
      delegate = this@TrueSheetViewController
    }

    sheetView = TrueSheetBottomSheetView(reactContext).apply {
      delegate = this@TrueSheetViewController
    }

    setupModalObserver()
  }

  private fun cleanupSheet() {
    cleanupKeyboardObserver()
    cleanupModalObserver()
    cleanupBackCallback()
    sheetView?.animate()?.cancel()

    // Remove from activity
    removeFromActivity()

    // Cleanup dim views
    dimView?.detach()
    dimView = null
    parentDimView?.detach()
    parentDimView = null

    // Detach content from sheet
    sheetView?.removeView(this)

    coordinatorLayout = null
    sheetView = null

    interactionState = InteractionState.Idle
    isDismissing = false
    isPresented = false
    isSheetVisible = false
    wasHiddenByModal = false
    isKeyboardTransitioning = false
    isPresentAnimating = false
    lastEmittedPositionPx = -1
    detentIndexBeforeKeyboard = -1
    shouldAnimatePresent = true
  }

  private fun removeFromActivity() {
    val coordinator = coordinatorLayout ?: return
    val contentView = reactContext.currentActivity?.findViewById<ViewGroup>(android.R.id.content)
    contentView?.removeView(coordinator)
  }

  // =============================================================================
  // MARK: - Back Button Handling
  // =============================================================================

  private fun setupBackCallback() {
    val activity = reactContext.currentActivity as? AppCompatActivity ?: return

    backCallback = object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        delegate?.viewControllerDidBackPress()
        dismissOrCollapseToLowest()
      }
    }

    activity.onBackPressedDispatcher.addCallback(backCallback!!)
  }

  private fun cleanupBackCallback() {
    backCallback?.remove()
    backCallback = null
  }

  // =============================================================================
  // MARK: - TrueSheetCoordinatorLayout.Delegate
  // =============================================================================

  override fun coordinatorLayoutDidLayout(changed: Boolean) {
    // Reposition footer when layout changes
    if (isPresented && changed) {
      positionFooter()
    }
  }

  // =============================================================================
  // MARK: - TrueSheetDimViewDelegate
  // =============================================================================

  override fun dimViewDidTap() {
    val hostView = delegate as? TrueSheetView ?: return

    val children = TrueSheetStackManager.getSheetsAbove(hostView)
    val topmostChild = children.firstOrNull()?.viewController

    // If topmost child is dimmed, only handle that child
    if (topmostChild?.isDimmedAtCurrentDetent == true) {
      if (topmostChild.dismissible) {
        topmostChild.dismiss(animated = true)
      }
      return
    }

    // Pass through to parent - dismiss all if possible
    val allDismissible = dismissible && children.all { it.viewController.dismissible }
    if (allDismissible) {
      children.forEach { it.viewController.dismiss(animated = true) }
    }

    dismissOrCollapseToLowest()
  }

  // =============================================================================
  // MARK: - BottomSheetCallback
  // =============================================================================

  private val sheetCallback = object : BottomSheetBehavior.BottomSheetCallback() {
    override fun onStateChanged(sheetView: View, newState: Int) {
      handleStateChanged(sheetView, newState)
    }

    override fun onSlide(sheetView: View, slideOffset: Float) {
      handleSlide(sheetView, slideOffset)
    }
  }

  private fun handleStateChanged(sheetView: View, newState: Int) {
    if (newState == BottomSheetBehavior.STATE_HIDDEN) {
      if (isDismissing) return
      isDismissing = true
      dismissKeyboard()
      emitWillDismissEvents()
      finishDismiss()
      return
    }

    if (!isPresented) return

    when (newState) {
      BottomSheetBehavior.STATE_DRAGGING -> handleDragBegin(sheetView)

      BottomSheetBehavior.STATE_EXPANDED,
      BottomSheetBehavior.STATE_COLLAPSED,
      BottomSheetBehavior.STATE_HALF_EXPANDED -> handleStateSettled(sheetView, newState)

      else -> {}
    }
  }

  private fun handleSlide(sheetView: View, slideOffset: Float) {
    // Skip during dismiss animation
    if (isDismissing) return

    val behavior = behavior ?: return

    when (behavior.state) {
      BottomSheetBehavior.STATE_DRAGGING,
      BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

      else -> { }
    }

    emitChangePositionDelegate(sheetView.top)

    // On older APIs, use onSlide for footer positioning during keyboard transitions
    val useLegacyKeyboardHandling = Build.VERSION.SDK_INT < Build.VERSION_CODES.R
    if (!isKeyboardTransitioning || useLegacyKeyboardHandling) {
      positionFooter(slideOffset)
    }

    if (!isKeyboardTransitioning) {
      updateDimAmount(sheetView.top)
    }
  }

  private fun handleStateSettled(sheetView: View, newState: Int) {
    if (interactionState is InteractionState.Reconfiguring) return

    val index = detentCalculator.getDetentIndexForState(newState) ?: return
    val position = getPositionDpForView(sheetView)
    val detentInfo = DetentInfo(index, position)

    // Handle present animation completion
    if (isPresentAnimating) {
      isPresentAnimating = false
      finishPresent()
      return
    }

    when (interactionState) {
      is InteractionState.Dragging -> {
        val detent = detentCalculator.getDetentValueForIndex(detentInfo.index)
        delegate?.viewControllerDidDragEnd(detentInfo.index, detentInfo.position, detent)

        if (detentInfo.index != currentDetentIndex) {
          currentDetentIndex = detentInfo.index
          setupDimmedBackground(detentInfo.index)
          delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
        }

        interactionState = InteractionState.Idle
      }

      else -> {
        if (detentInfo.index != currentDetentIndex) {
          currentDetentIndex = detentInfo.index
          if (!isKeyboardTransitioning) {
            val detent = detentCalculator.getDetentValueForIndex(detentInfo.index)
            delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
          }
        }
      }
    }
  }

  // =============================================================================
  // MARK: - Modal Observer (react-native-screens)
  // =============================================================================

  private fun setupModalObserver() {
    rnScreensObserver = RNScreensFragmentObserver(
      reactContext = reactContext,
      onModalPresented = {
        if (isPresented && isSheetVisible && isTopmostSheet) {
          hideForModal()
        }
      },
      onModalWillDismiss = {
        if (isPresented && wasHiddenByModal && isTopmostSheet) {
          showAfterModal()
        }
      },
      onModalDidDismiss = {
        if (isPresented && wasHiddenByModal) {
          wasHiddenByModal = false
          // Restore parent sheet after this sheet is restored
          parentSheetView?.viewController?.let { parent ->
            post { parent.showAfterModal() }
          }
        }
      }
    )
    rnScreensObserver?.start()
  }

  private fun cleanupModalObserver() {
    rnScreensObserver?.stop()
    rnScreensObserver = null
  }

  private fun setSheetVisibility(visible: Boolean) {
    coordinatorLayout?.visibility = if (visible) VISIBLE else GONE
    dimViews.forEach { it.visibility = if (visible) VISIBLE else INVISIBLE }
  }

  private fun hideForModal() {
    val sheet = sheetView ?: run {
      RNLog.e(reactContext, "TrueSheet: sheetView is null in hideForModal")
      return
    }

    isSheetVisible = false
    wasHiddenByModal = true

    dimViews.forEach { it.animate().alpha(0f).setDuration(MODAL_FADE_DURATION).start() }
    sheet.animate()
      .alpha(0f)
      .setDuration(MODAL_FADE_DURATION)
      .withEndAction {
        setSheetVisibility(false)
      }
      .start()

    // This will hide parent sheets first
    parentSheetView?.viewController?.hideForModal()
  }

  private fun showAfterModal() {
    isSheetVisible = true
    setSheetVisibility(true)
    sheetView?.alpha = 1f
    updateDimAmount(animated = true)
  }

  /**
   * Re-applies hidden state after returning from background.
   * Android may restore visibility on activity resume, so we need to hide it again.
   */
  fun reapplyHiddenState() {
    if (!wasHiddenByModal) return
    setSheetVisibility(false)
  }

  // =============================================================================
  // MARK: - Presentation
  // =============================================================================

  fun present(detentIndex: Int, animated: Boolean = true) {
    val coordinator = this.coordinatorLayout ?: run {
      RNLog.w(reactContext, "TrueSheet: No coordinator layout available. Ensure the sheet is mounted before presenting.")
      return
    }

    val sheet = this.sheetView ?: run {
      RNLog.w(reactContext, "TrueSheet: No sheet view available.")
      return
    }

    val activity = reactContext.currentActivity ?: run {
      RNLog.w(reactContext, "TrueSheet: No activity available for presentation.")
      return
    }

    if (isPresented) {
      setupDimmedBackground(detentIndex)
      setStateForDetentIndex(detentIndex)
    } else {
      shouldAnimatePresent = animated
      currentDetentIndex = detentIndex
      interactionState = InteractionState.Idle

      // Setup sheet in coordinator layout
      setupSheetInCoordinator(coordinator, sheet)

      // Add coordinator to activity
      val contentView = activity.findViewById<ViewGroup>(android.R.id.content)
      contentView?.addView(coordinator)

      // Setup back button handling
      setupBackCallback()

      // Start presentation
      onSheetShow()
    }
  }

  private fun setupSheetInCoordinator(coordinator: TrueSheetCoordinatorLayout, sheet: TrueSheetBottomSheetView) {
    // Add this controller as content to the sheet
    (parent as? ViewGroup)?.removeView(this)
    sheet.addView(this)

    // Create layout params with behavior
    val params = sheet.createLayoutParams()
    val behavior = params.behavior as BottomSheetBehavior<TrueSheetBottomSheetView>

    // Configure behavior
    behavior.isHideable = true
    behavior.isDraggable = draggable
    behavior.state = BottomSheetBehavior.STATE_HIDDEN
    behavior.addBottomSheetCallback(sheetCallback)

    // Add sheet to coordinator
    coordinator.addView(sheet, params)
  }

  private fun onSheetShow() {
    val sheet = sheetView ?: run {
      RNLog.e(reactContext, "TrueSheet: sheetView is null in onSheetShow")
      return
    }

    emitWillPresentEvents()

    setupSheetDetents()
    setupDimmedBackground(currentDetentIndex)
    setupKeyboardObserver()
    sheet.setupBackground()
    sheet.setupElevation()
    sheet.setupGrabber()

    if (shouldAnimatePresent) {
      isPresentAnimating = true
      post { setStateForDetentIndex(currentDetentIndex) }
    } else {
      setStateForDetentIndex(currentDetentIndex)
      emitChangePositionDelegate(detentCalculator.getSheetTopForDetentIndex(currentDetentIndex))
      updateDimAmount()
      finishPresent()
    }

    isPresented = true
    isSheetVisible = true
  }

  fun dismiss(animated: Boolean = true) {
    if (isDismissing) return

    isDismissing = true
    dismissKeyboard()
    emitWillDismissEvents()

    if (animated) {
      animateDismiss()
    } else {
      emitChangePositionDelegate(realScreenHeight)
      finishDismiss()
    }
  }

  private fun dismissKeyboard() {
    KeyboardUtils.dismiss(reactContext)
  }

  private fun dismissOrCollapseToLowest() {
    if (dismissible) {
      dismiss(animated = true)
    } else if (parentSheetView == null && isDimmedAtCurrentDetent && dimmedDetentIndex > 0) {
      setStateForDetentIndex(dimmedDetentIndex - 1)
    }
  }

  private fun animateDismiss() {
    val sheet = sheetView ?: run {
      finishDismiss()
      return
    }

    sheet.animate()
      .y(realScreenHeight.toFloat())
      .setDuration(DISMISS_DURATION)
      .setInterpolator(android.view.animation.AccelerateInterpolator())
      .setUpdateListener { updateSheetVisuals(sheet.y.toInt()) }
      .withEndAction { finishDismiss() }
      .start()
  }

  private fun finishPresent() {
    // Restore isHideable to actual value after present animation
    behavior?.isHideable = dismissible

    val (index, position, detent) = getDetentInfoWithValue(currentDetentIndex)
    delegate?.viewControllerDidPresent(index, position, detent)
    parentSheetView?.viewControllerDidBlur()
    delegate?.viewControllerDidFocus()

    presentPromise?.invoke()
    presentPromise = null
  }

  private fun finishDismiss() {
    emitDidDismissEvents()
    cleanupSheet()
  }

  // =============================================================================
  // MARK: - Sheet Configuration
  // =============================================================================

  fun setupSheetDetents() {
    val behavior = this.behavior ?: run {
      RNLog.e(reactContext, "TrueSheet: behavior is null in setupSheetDetents")
      return
    }

    interactionState = InteractionState.Reconfiguring

    behavior.isFitToContents = false

    val maxAvailableHeight = realScreenHeight - topInset

    val peekHeight = minOf(detentCalculator.getDetentHeight(detents[0]), maxAvailableHeight)

    val halfExpandedDetentHeight = when (detents.size) {
      1 -> peekHeight
      else -> detentCalculator.getDetentHeight(detents[1])
    }

    val maxDetentHeight = minOf(detentCalculator.getDetentHeight(detents.last()), maxAvailableHeight)

    val adjustedHalfExpandedHeight = minOf(halfExpandedDetentHeight, maxAvailableHeight)
    val halfExpandedRatio = (adjustedHalfExpandedHeight.toFloat() / realScreenHeight.toFloat())

    val expandedOffset = realScreenHeight - maxDetentHeight

    // fitToContents works better with <= 2 detents when no expanded offset
    val fitToContents = detents.size < 3 && expandedOffset == 0

    configureDetents(
      behavior = behavior,
      peekHeight = peekHeight,
      halfExpandedRatio = halfExpandedRatio,
      expandedOffset = expandedOffset,
      fitToContents = fitToContents,
      animate = isPresented
    )

    val offset = if (expandedOffset == 0) topInset else 0
    val newHeight = realScreenHeight - expandedOffset - offset
    val newWidth = minOf(screenWidth, DEFAULT_MAX_WIDTH.dpToPx().toInt())

    if (lastStateWidth != newWidth || lastStateHeight != newHeight) {
      lastStateWidth = newWidth
      lastStateHeight = newHeight
      delegate?.viewControllerDidChangeSize(newWidth, newHeight)
    }

    if (isPresented) {
      setStateForDetentIndex(currentDetentIndex)
    }

    interactionState = InteractionState.Idle
  }

  private fun configureDetents(
    behavior: BottomSheetBehavior<TrueSheetBottomSheetView>,
    peekHeight: Int,
    halfExpandedRatio: Float,
    expandedOffset: Int,
    fitToContents: Boolean,
    animate: Boolean
  ) {
    behavior.apply {
      isFitToContents = fitToContents
      skipCollapsed = false
      setPeekHeight(peekHeight, animate)
      this.halfExpandedRatio = halfExpandedRatio.coerceIn(0.01f, 0.999f)
      this.expandedOffset = expandedOffset
    }
  }

  fun setupSheetDetentsForSizeChange() {
    setupSheetDetents()
    positionFooter()
  }

  fun setStateForDetentIndex(index: Int) {
    behavior?.state = detentCalculator.getStateForDetentIndex(index)
  }

  // =============================================================================
  // MARK: - Dimmed Background
  // =============================================================================

  fun setupDimmedBackground(detentIndex: Int) {
    val coordinator = this.coordinatorLayout ?: run {
      RNLog.e(reactContext, "TrueSheet: coordinatorLayout is null in setupDimmedBackground")
      return
    }

    if (dimmed) {
      val parentDimVisible = (parentSheetView?.viewController?.dimView?.alpha ?: 0f) > 0f

      if (dimView == null) {
        dimView = TrueSheetDimView(reactContext).apply {
          delegate = this@TrueSheetViewController
        }
      }
      if (!parentDimVisible) {
        dimView?.attachToCoordinator(coordinator)
      }

      // Attach dim view to parent sheet if stacked
      val parentController = parentSheetView?.viewController
      val parentBottomSheet = parentController?.sheetView
      if (parentBottomSheet != null) {
        if (parentDimView == null) {
          parentDimView = TrueSheetDimView(reactContext).apply {
            delegate = this@TrueSheetViewController
          }
        }
        parentDimView?.attach(parentBottomSheet, parentController.sheetCornerRadius)
      }
    } else {
      dimView?.detach()
      dimView = null
      parentDimView?.detach()
      parentDimView = null
    }
  }

  fun updateDimAmount(sheetTop: Int? = null, animated: Boolean = false) {
    if (!dimmed) return
    val keyboardOffset = if (isDismissing) 0 else currentKeyboardInset
    val top = (sheetTop ?: sheetView?.top ?: return) + keyboardOffset

    if (animated) {
      val targetAlpha = dimView?.calculateAlpha(
        top,
        dimmedDetentIndex,
        detentCalculator::getSheetTopForDetentIndex
      ) ?: 0f
      dimViews.forEach { it.animate().alpha(targetAlpha).setDuration(200).start() }
    } else {
      dimViews.forEach { it.interpolateAlpha(top, dimmedDetentIndex, detentCalculator::getSheetTopForDetentIndex) }
    }
  }

  // =============================================================================
  // MARK: - Footer Positioning
  // =============================================================================

  fun positionFooter(slideOffset: Float? = null) {
    if (!isPresented) return
    val footerView = containerView?.footerView ?: return
    val sheet = sheetView ?: return

    val footerHeight = footerView.height
    val sheetHeight = sheet.height
    val sheetTop = sheet.top

    var footerY = (sheetHeight - sheetTop - footerHeight - currentKeyboardInset).toFloat()

    // Adjust during dismiss animation when slideOffset is negative
    if (slideOffset != null && slideOffset < 0) {
      footerY -= (footerHeight * slideOffset)
    }

    // Clamp to prevent footer going above safe area
    val maxAllowedY = (sheetHeight - topInset - footerHeight).toFloat()
    footerView.y = minOf(footerY, maxAllowedY)
  }

  // =============================================================================
  // MARK: - Keyboard Handling
  // =============================================================================

  private fun shouldHandleKeyboard(): Boolean {
    if (wasHiddenByModal) return false
    return isTopmostSheet
  }

  fun setupKeyboardObserver() {
    val coordinator = coordinatorLayout ?: run {
      RNLog.e(reactContext, "TrueSheet: coordinatorLayout is null in setupKeyboardObserver")
      return
    }
    cleanupKeyboardObserver()
    keyboardObserver = TrueSheetKeyboardObserver(coordinator, reactContext).apply {
      delegate = object : TrueSheetKeyboardObserverDelegate {
        override fun keyboardWillShow(height: Int) {
          isKeyboardTransitioning = true
          if (!shouldHandleKeyboard()) return
          detentIndexBeforeKeyboard = currentDetentIndex
          setupSheetDetents()
          setStateForDetentIndex(detents.size - 1)
        }

        override fun keyboardWillHide() {
          if (!shouldHandleKeyboard()) return
          setupSheetDetents()
          if (!isDismissing && detentIndexBeforeKeyboard >= 0) {
            setStateForDetentIndex(detentIndexBeforeKeyboard)
            detentIndexBeforeKeyboard = -1
          }
        }

        override fun keyboardDidHide() {
          isKeyboardTransitioning = false
        }

        override fun keyboardDidChangeHeight(height: Int) {
          if (!shouldHandleKeyboard()) return
          positionFooter()
        }
      }
      start()
    }
  }

  fun cleanupKeyboardObserver() {
    keyboardObserver?.stop()
    keyboardObserver = null
  }

  // =============================================================================
  // MARK: - Drag Handling
  // =============================================================================

  private fun getPositionDpForView(sheetView: View): Float =
    detentCalculator.getPositionDp(detentCalculator.getVisibleSheetHeight(sheetView.top))

  private fun handleDragBegin(sheetView: View) {
    val position = getPositionDpForView(sheetView)
    val detent = detentCalculator.getDetentValueForIndex(currentDetentIndex)
    delegate?.viewControllerDidDragBegin(currentDetentIndex, position, detent)
    interactionState = InteractionState.Dragging(startTop = sheetView.top)
  }

  private fun handleDragChange(sheetView: View) {
    if (interactionState !is InteractionState.Dragging) return
    val position = getPositionDpForView(sheetView)
    val detent = detentCalculator.getDetentValueForIndex(currentDetentIndex)
    delegate?.viewControllerDidDragChange(currentDetentIndex, position, detent)
  }

  // =============================================================================
  // MARK: - Event Emission
  // =============================================================================

  private fun emitWillPresentEvents() {
    val (index, position, detent) = getDetentInfoWithValue(currentDetentIndex)
    parentSheetView?.viewControllerWillBlur()
    delegate?.viewControllerWillPresent(index, position, detent)
    delegate?.viewControllerWillFocus()
  }

  private fun emitWillDismissEvents() {
    delegate?.viewControllerWillBlur()
    delegate?.viewControllerWillDismiss()
    parentSheetView?.viewControllerWillFocus()
  }

  private fun emitDidDismissEvents() {
    val hadParent = parentSheetView != null
    parentSheetView?.viewControllerDidFocus()
    parentSheetView = null

    delegate?.viewControllerDidBlur()
    delegate?.viewControllerDidDismiss(hadParent)

    dismissPromise?.invoke()
    dismissPromise = null
  }

  private fun emitChangePositionDelegate(currentTop: Int, realtime: Boolean = true) {
    // Dedupe emissions for same position
    if (currentTop == lastEmittedPositionPx) return

    lastEmittedPositionPx = currentTop
    val visibleHeight = realScreenHeight - currentTop
    val position = detentCalculator.getPositionDp(visibleHeight)
    val interpolatedIndex = detentCalculator.getInterpolatedIndexForPosition(currentTop)
    val detent = detentCalculator.getInterpolatedDetentForPosition(currentTop)
    delegate?.viewControllerDidChangePosition(interpolatedIndex, position, detent, realtime)
  }

  /**
   * Updates position emission, footer, and dim amount together.
   * This pattern is commonly used during animations and state changes.
   */
  private fun updateSheetVisuals(effectiveTop: Int, slideOffset: Float? = null) {
    emitChangePositionDelegate(effectiveTop)
    positionFooter(slideOffset)
    updateDimAmount(effectiveTop)
  }

  // =============================================================================
  // MARK: - Detent Helpers
  // =============================================================================

  fun translateSheet(translationY: Int) {
    val sheet = sheetView ?: return

    sheet.animate()
      .translationY(translationY.toFloat())
      .setDuration(TRANSLATE_ANIMATION_DURATION)
      .setUpdateListener {
        val effectiveTop = sheet.top + sheet.translationY.toInt()
        emitChangePositionDelegate(effectiveTop)
      }
      .start()
  }

  private fun getDetentInfoWithValue(index: Int): Triple<Int, Float, Float> {
    val state = detentCalculator.getStateForDetentIndex(index)
    val detentIndex = detentCalculator.getDetentIndexForState(state) ?: 0
    val position = getPositionForDetentIndex(detentIndex)
    val detent = detentCalculator.getDetentValueForIndex(detentIndex)
    return Triple(detentIndex, position, detent)
  }

  private fun getPositionForDetentIndex(index: Int): Float {
    if (index < 0 || index >= detents.size) return screenHeight.pxToDp()

    sheetView?.let {
      val visibleSheetHeight = detentCalculator.getVisibleSheetHeight(it.top)
      if (visibleSheetHeight in 1..<realScreenHeight) {
        return detentCalculator.getPositionDp(visibleSheetHeight)
      }
    }

    val detentHeight = detentCalculator.getDetentHeight(detents[index])
    return detentCalculator.getPositionDp(detentHeight)
  }

  // =============================================================================
  // MARK: - RootView Implementation
  // =============================================================================

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)
    (getTag(R.id.react_test_id) as? String)?.let { info.viewIdResourceName = it }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w == oldw && h == oldh) return
    if (!isPresented) return

    // Skip reconfiguration if expanded and only height changed (e.g., keyboard)
    if (h + topInset >= screenHeight && isExpanded && oldw == w) return

    post {
      setupSheetDetents()
      positionFooter()
      sheetView?.let { emitChangePositionDelegate(it.top, realtime = false) }
    }
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  // =============================================================================
  // MARK: - Touch Event Handling
  // =============================================================================

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    // Footer needs special handling since it's positioned absolutely
    val footer = containerView?.footerView
    if (footer != null && footer.isVisible) {
      val footerLocation = ScreenUtils.getScreenLocation(footer)
      val touchScreenX = event.rawX.toInt()
      val touchScreenY = event.rawY.toInt()

      // Check if touch is within footer bounds
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
      jsTouchDispatcher.handleTouchEvent(event, it, reactContext)
      jsPointerDispatcher?.handleMotionEvent(event, it, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let {
      jsTouchDispatcher.handleTouchEvent(event, it, reactContext)
      jsPointerDispatcher?.handleMotionEvent(event, it, false)
    }
    super.onTouchEvent(event)
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher?.handleMotionEvent(event, it, true) }
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher?.handleMotionEvent(event, it, false) }
    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let {
      jsTouchDispatcher.onChildStartedNativeGesture(ev, it)
      jsPointerDispatcher?.onChildStartedNativeGesture(childView, ev, it)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jsTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jsPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    super.requestDisallowInterceptTouchEvent(disallowIntercept)
  }
}
