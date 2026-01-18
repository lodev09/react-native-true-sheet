package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.UiThread
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.util.RNLog
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.core.GrabberOptions
import com.lodev09.truesheet.core.TrueSheetStackManager
import com.lodev09.truesheet.events.*
import com.lodev09.truesheet.utils.KeyboardUtils

/**
 * Main TrueSheet host view that manages the sheet and dispatches events to JavaScript.
 * This view is hidden (GONE) and delegates all rendering to TrueSheetViewController
 * using a CoordinatorLayout approach (no separate dialog window).
 */
@SuppressLint("ViewConstructor")
class TrueSheetView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  LifecycleEventListener,
  TrueSheetViewControllerDelegate,
  TrueSheetContainerViewDelegate {

  // ==================== Properties ====================

  internal val viewController: TrueSheetViewController = TrueSheetViewController(reactContext)
  override var eventDispatcher: EventDispatcher? = null

  // Initial present configuration (set by ViewManager before mount)
  var initialDetentIndex: Int = -1
  var initialDetentAnimated: Boolean = true
  private var didInitiallyPresent: Boolean = false

  var stateWrapper: StateWrapper? = null
    set(value) {
      // On first state wrapper assignment, immediately update state with screen dimensions.
      // This ensures Yoga has initial width/height for content layout before presenting.
      if (field == null && value != null) {
        updateState(viewController.screenWidth, viewController.screenHeight)
      }
      field = value
    }

  private var lastContainerWidth: Int = 0
  private var lastContainerHeight: Int = 0

  // Debounce flag to coalesce rapid layout changes into a single sheet update
  private var isSheetUpdatePending: Boolean = false

  // Root container for the coordinator layout (activity or Modal dialog content view)
  internal var rootContainerView: ViewGroup? = null

  // ==================== Initialization ====================

  init {
    reactContext.addLifecycleEventListener(this)
    viewController.delegate = this

    // Hide the host view - actual content is rendered in the dialog window
    visibility = GONE
  }

  // ==================== ReactViewGroup Overrides ====================

  override fun onLayout(
    changed: Boolean,
    left: Int,
    top: Int,
    right: Int,
    bottom: Int
  ) {
    // No-op: layout is managed by React Native's UIManager
  }

  override fun setId(id: Int) {
    super.setId(id)
    viewController.id = id
    TrueSheetModule.registerView(this, id)
  }

  // ==================== View Hierarchy Management ====================

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    if (initialDetentIndex >= 0 && !didInitiallyPresent) {
      didInitiallyPresent = true
      if (initialDetentAnimated) {
        present(initialDetentIndex, true) { }
      } else {
        post { present(initialDetentIndex, false) { } }
      }
    }
  }

  override fun addView(child: View?, index: Int) {
    if (child is TrueSheetContainerView) {
      viewController.removeSheetSnapshot()
    }

    viewController.addView(child, index)

    if (child is TrueSheetContainerView) {
      child.delegate = this
      viewController.createSheet()
      setupContentScrollViewPinning()

      val surfaceId = UIManagerHelper.getSurfaceId(this)
      eventDispatcher?.dispatchEvent(MountEvent(surfaceId, id))
    }
  }

  override fun getChildCount(): Int = viewController.childCount

  override fun getChildAt(index: Int): View? = viewController.getChildAt(index)

  override fun removeViewAt(index: Int) {
    val child = getChildAt(index)
    if (child is TrueSheetContainerView) {
      child.delegate = null
      viewController.createSheetSnapshot()

      // Dismiss when container is removed
      if (viewController.isPresented) {
        dismissAll(true) {}
      }
    }
    viewController.removeView(child)
  }

  // Accessibility: delegate to dialog's host view since this view is hidden
  override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {}
  override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent): Boolean = false

  // ==================== Lifecycle ====================

  override fun onHostResume() {
    viewController.reapplyHiddenState()
    finalizeUpdates()
  }

  override fun onHostPause() {}

  override fun onHostDestroy() {
    onDropInstance()
  }

  fun onDropInstance() {
    reactContext.removeLifecycleEventListener(this)

    TrueSheetModule.unregisterView(id)
    TrueSheetStackManager.removeSheet(this)

    didInitiallyPresent = false

    if (viewController.isPresented) {
      viewController.dismissPromise = {
        viewController.delegate = null
      }
      viewController.dismiss()
    } else {
      viewController.delegate = null
    }
  }

  /**
   * Called by the ViewManager after all properties are set.
   * Reconfigures the sheet if it's currently presented.
   */
  fun finalizeUpdates() {
    setupContentScrollViewPinning()

    if (viewController.isPresented) {
      viewController.sheetView?.setupBackground()
      viewController.sheetView?.setupGrabber()
      updateSheetIfNeeded()
    }
  }

  // ==================== Property Setters ====================

  fun setMaxHeight(height: Int) {
    if (viewController.maxSheetHeight == height) return
    viewController.maxSheetHeight = height
  }

  fun setDimmed(dimmed: Boolean) {
    if (viewController.dimmed == dimmed) return
    viewController.dimmed = dimmed
    if (viewController.isPresented) {
      viewController.setupDimmedBackground()
      viewController.updateDimAmount()
    }
  }

  fun setDimmedDetentIndex(index: Int) {
    if (viewController.dimmedDetentIndex == index) return
    viewController.dimmedDetentIndex = index
    if (viewController.isPresented) {
      viewController.setupDimmedBackground()
      viewController.updateDimAmount()
    }
  }

  fun setCornerRadius(radius: Float) {
    if (viewController.sheetCornerRadius == radius) return
    viewController.sheetCornerRadius = radius
  }

  fun setSheetBackgroundColor(color: Int?) {
    if (viewController.sheetBackgroundColor == color) return
    viewController.sheetBackgroundColor = color
  }

  fun setDismissible(dismissible: Boolean) {
    viewController.dismissible = dismissible
  }

  fun setDraggable(draggable: Boolean) {
    viewController.draggable = draggable
  }

  fun setGrabber(grabber: Boolean) {
    viewController.grabber = grabber
  }

  fun setGrabberOptions(options: GrabberOptions?) {
    viewController.grabberOptions = options
  }

  fun setSheetElevation(elevation: Float) {
    viewController.sheetElevation = elevation
  }

  fun setDetents(newDetents: MutableList<Double>) {
    viewController.detents = newDetents
  }

  fun setInsetAdjustment(insetAdjustment: String) {
    viewController.insetAdjustment = insetAdjustment
    setupContentScrollViewPinning()
  }

  fun setScrollable(scrollable: Boolean) {
    viewController.scrollable = scrollable
    setupContentScrollViewPinning()
  }

  fun setScrollableOptions(options: ReadableMap?) {
    viewController.scrollableOptions = options
    setupContentScrollViewPinning()
  }

  private fun setupContentScrollViewPinning() {
    viewController.containerView?.let {
      it.insetAdjustment = viewController.insetAdjustment
      it.scrollViewPinningEnabled = viewController.scrollable
      it.scrollViewBottomInset = viewController.contentBottomInset
      it.scrollableOptions = viewController.scrollableOptions
      it.setupContentScrollViewPinning()
    }
  }

  // ==================== State Management ====================

  /**
   * Updates the Fabric state with container dimensions for Yoga layout.
   * Converts pixel values to density-independent pixels (dp).
   */
  fun updateState(width: Int, height: Int) {
    if (width == lastContainerWidth && height == lastContainerHeight) return

    lastContainerWidth = width
    lastContainerHeight = height

    val sw = stateWrapper ?: return
    val newStateData = WritableNativeMap()
    newStateData.putDouble("containerWidth", width.toFloat().pxToDp().toDouble())
    newStateData.putDouble("containerHeight", height.toFloat().pxToDp().toDouble())
    sw.updateState(newStateData)
  }

  // ==================== Sheet Actions ====================

  @UiThread
  fun present(detentIndex: Int, animated: Boolean = true, promiseCallback: () -> Unit) {
    if (!viewController.isPresented) {
      // Dismiss keyboard if focused view is within a sheet or if target detent will be dimmed
      val parentSheet = TrueSheetStackManager.getTopmostSheet()
      val isFocusedViewWithinSheet = parentSheet?.viewController?.isFocusedViewWithinSheet() == true
      val shouldDismissKeyboard = isFocusedViewWithinSheet || viewController.isDimmedAtDetentIndex(detentIndex)
      if (KeyboardUtils.isKeyboardVisible(reactContext) && shouldDismissKeyboard) {
        viewController.saveFocusedView()
        KeyboardUtils.dismiss(this) {
          post { present(detentIndex, animated, promiseCallback) }
        }
        return
      }

      // Attach coordinator to the root container
      rootContainerView = findRootContainerView()
      viewController.coordinatorLayout?.let { rootContainerView?.addView(it) }

      // Register with observer to track sheet stack hierarchy
      viewController.parentSheetView = TrueSheetStackManager.onSheetWillPresent(this, detentIndex)
    }
    viewController.presentPromise = promiseCallback
    viewController.present(detentIndex, animated)
  }

  @UiThread
  fun dismiss(animated: Boolean = true, promiseCallback: () -> Unit) {
    // iOS-like behavior: calling dismiss on a presenting controller dismisses
    // its presented controller (and everything above it), but NOT itself.
    // See: https://developer.apple.com/documentation/uikit/uiviewcontroller/1621505-dismiss
    val sheetsAbove = TrueSheetStackManager.getSheetsAbove(this)
    if (sheetsAbove.isNotEmpty()) {
      for (sheet in sheetsAbove) {
        sheet.viewController.dismiss(animated)
      }
      promiseCallback()
      return
    }

    viewController.dismissPromise = promiseCallback
    viewController.dismiss(animated)
  }

  @UiThread
  fun dismissAll(animated: Boolean = true, promiseCallback: () -> Unit) {
    // Dismiss all sheets above first
    dismiss(animated) {}

    // Then dismiss itself
    viewController.dismissPromise = promiseCallback
    viewController.dismiss(animated)
  }

  @UiThread
  fun resize(detentIndex: Int, promiseCallback: () -> Unit) {
    viewController.resizePromise = promiseCallback
    viewController.resize(detentIndex)
  }

  /**
   * Debounced sheet update to handle rapid content/header size changes.
   * Uses post() to ensure all layout passes complete before reconfiguring.
   */
  fun updateSheetIfNeeded() {
    if (!viewController.isPresented || isSheetUpdatePending) return

    isSheetUpdatePending = true
    viewController.post {
      isSheetUpdatePending = false
      if (viewController.containerView == null) return@post

      viewController.setupSheetDetentsForSizeChange()
      TrueSheetStackManager.onSheetSizeChanged(this)
    }
  }

  // ==================== Sheet Stack Translation ====================

  /**
   * Updates this sheet's translation and disables dragging when a child sheet is presented.
   * Parent sheets slide down to create a stacked appearance.
   * Propagates additional translation to parent so the entire stack stays visually consistent.
   */
  fun updateTranslationForChild(childSheetTop: Int) {
    if (!viewController.isSheetVisible || viewController.isExpanded) return

    viewController.sheetView?.behavior?.isDraggable = false

    val mySheetTop = viewController.detentCalculator.getSheetTopForDetentIndex(viewController.currentDetentIndex)
    val newTranslation = maxOf(0, childSheetTop - mySheetTop)
    val additionalTranslation = newTranslation - viewController.currentTranslationY

    viewController.translateSheet(newTranslation)

    // Propagate any additional translation up the stack
    if (additionalTranslation > 0) {
      TrueSheetStackManager.getParentSheet(this)?.addTranslation(additionalTranslation)
    }
  }

  /**
   * Recursively adds translation to this sheet and all parent sheets.
   */
  private fun addTranslation(amount: Int) {
    if (viewController.isExpanded) return

    viewController.translateSheet(viewController.currentTranslationY + amount)
    TrueSheetStackManager.getParentSheet(this)?.addTranslation(amount)
  }

  /**
   * Resets this sheet's translation and restores dragging when it becomes topmost.
   * Parent recalculates its translation based on this sheet's position.
   */
  fun resetTranslation() {
    viewController.sheetView?.behavior?.isDraggable = viewController.draggable
    viewController.translateSheet(0)

    // Parent should recalculate its translation based on this sheet's position
    val mySheetTop = viewController.detentCalculator.getSheetTopForDetentIndex(viewController.currentDetentIndex)
    TrueSheetStackManager.getParentSheet(this)?.updateTranslationForChild(mySheetTop)
  }

  // ==================== TrueSheetViewControllerDelegate ====================

  override fun viewControllerWillPresent(index: Int, position: Float, detent: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(WillPresentEvent(surfaceId, id, index, position, detent))
  }

  override fun viewControllerDidPresent(index: Int, position: Float, detent: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DidPresentEvent(surfaceId, id, index, position, detent))
  }

  override fun viewControllerWillDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(WillDismissEvent(surfaceId, id))
  }

  override fun viewControllerDidDismiss(hadParent: Boolean) {
    // Detach coordinator from the root container view
    viewController.coordinatorLayout?.let { rootContainerView?.removeView(it) }
    rootContainerView = null

    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DidDismissEvent(surfaceId, id))

    TrueSheetStackManager.onSheetDidDismiss(this, hadParent)
  }

  override fun viewControllerDidChangeDetent(index: Int, position: Float, detent: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DetentChangeEvent(surfaceId, id, index, position, detent))
  }

  override fun viewControllerDidDragBegin(index: Int, position: Float, detent: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DragBeginEvent(surfaceId, id, index, position, detent))
  }

  override fun viewControllerDidDragChange(index: Int, position: Float, detent: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DragChangeEvent(surfaceId, id, index, position, detent))
  }

  override fun viewControllerDidDragEnd(index: Int, position: Float, detent: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DragEndEvent(surfaceId, id, index, position, detent))
  }

  override fun viewControllerDidChangePosition(index: Float, position: Float, detent: Float, realtime: Boolean) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(PositionChangeEvent(surfaceId, id, index, position, detent, realtime))
  }

  override fun viewControllerDidChangeSize(width: Int, height: Int) {
    updateState(width, height)
  }

  override fun viewControllerWillFocus() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(WillFocusEvent(surfaceId, id))
  }

  override fun viewControllerDidFocus() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(FocusEvent(surfaceId, id))
  }

  override fun viewControllerWillBlur() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(WillBlurEvent(surfaceId, id))
  }

  override fun viewControllerDidBlur() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(BlurEvent(surfaceId, id))
  }

  override fun viewControllerDidBackPress() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(BackPressEvent(surfaceId, id))
  }

  override fun viewControllerDidDetectScreenDismiss() {
    resetTranslation()
  }

  // ==================== TrueSheetContainerViewDelegate ====================

  override fun containerViewContentDidChangeSize(width: Int, height: Int) {
    updateSheetIfNeeded()
  }

  override fun containerViewHeaderDidChangeSize(width: Int, height: Int) {
    updateSheetIfNeeded()
  }

  override fun containerViewFooterDidChangeSize(width: Int, height: Int) {
    // Footer changes don't affect detents, only reposition it
    viewController.positionFooter()
  }

  // ==================== Private Helpers ====================

  /**
   * Find the root container view for presenting the sheet.
   * This traverses up the view hierarchy to find the content view (android.R.id.content)
   * of whichever window this view is in - whether that's the activity's window or a
   * Modal's dialog window.
   */
  override fun findRootContainerView(): ViewGroup? {
    var current: android.view.ViewParent? = parent

    while (current != null) {
      if (current is ViewGroup && current.id == android.R.id.content) {
        return current
      }
      current = current.parent
    }

    return reactContext.currentActivity?.findViewById(android.R.id.content)
  }
}
