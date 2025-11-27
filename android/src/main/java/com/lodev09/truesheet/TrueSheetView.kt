package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.UiThread
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.events.DetentChangeEvent
import com.lodev09.truesheet.events.DidDismissEvent
import com.lodev09.truesheet.events.DidPresentEvent
import com.lodev09.truesheet.events.DragBeginEvent
import com.lodev09.truesheet.events.DragChangeEvent
import com.lodev09.truesheet.events.DragEndEvent
import com.lodev09.truesheet.events.MountEvent
import com.lodev09.truesheet.events.PositionChangeEvent
import com.lodev09.truesheet.events.WillDismissEvent
import com.lodev09.truesheet.events.WillPresentEvent

/**
 * Main TrueSheet host view that manages the sheet dialog and dispatches events to JavaScript.
 * This view is hidden (GONE) and delegates all rendering to TrueSheetViewController in a dialog window.
 */
@SuppressLint("ViewConstructor")
class TrueSheetView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  LifecycleEventListener,
  TrueSheetViewControllerDelegate,
  TrueSheetContainerViewDelegate {

  private val viewController: TrueSheetViewController = TrueSheetViewController(reactContext)

  private val containerView: TrueSheetContainerView?
    get() = viewController.getChildAt(0) as? TrueSheetContainerView

  var eventDispatcher: EventDispatcher? = null

  var initialDetentIndex: Int = -1
  var initialDetentAnimated: Boolean = true

  var stateWrapper: StateWrapper? = null
    set(value) {
      // Immediately update state with screen width during first state update
      // This ensures we have initial width for content layout before presenting
      if (field == null && value != null) {
        updateState(viewController.screenWidth, 0)
      }
      field = value
    }

  // Track last dimensions to avoid unnecessary state updates
  private var lastContainerWidth: Int = 0
  private var lastContainerHeight: Int = 0

  // Flag to prevent multiple pending sheet updates
  private var isSheetUpdatePending: Boolean = false

  // Reference to parent sheet's controller (for stacking support)
  private var parentViewController: TrueSheetViewController? = null

  init {
    reactContext.addLifecycleEventListener(this)
    viewController.delegate = this

    // Hide the host view - actual content is rendered in the dialog window
    visibility = GONE
  }

  override fun dispatchProvideStructure(structure: ViewStructure) {
    super.dispatchProvideStructure(structure)
  }

  override fun onLayout(
    changed: Boolean,
    left: Int,
    top: Int,
    right: Int,
    bottom: Int
  ) {
    // Do nothing as we are laid out by UIManager
  }

  override fun setId(id: Int) {
    super.setId(id)
    viewController.id = id
    TrueSheetModule.registerView(this, id)
  }

  /**
   * Called by the manager after all properties are set.
   * Reconfigures the sheet if it's currently presented.
   */
  fun finalizeUpdates() {
    if (viewController.isPresented) {
      viewController.setupBackground()
      viewController.setupGrabber()
      updateSheetIfNeeded()
      viewController.setStateForDetentIndex(viewController.currentDetentIndex)
    }
  }

  // ==================== View Management ====================

  override fun addView(child: View?, index: Int) {
    viewController.addView(child, index)

    if (child is TrueSheetContainerView) {
      child.delegate = this
      viewController.createDialog()

      // Present at initial detent after layout pass when content height is available
      if (initialDetentIndex >= 0) {
        post { present(initialDetentIndex, initialDetentAnimated) { } }
      }

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
    }
    viewController.removeView(child)
  }

  // Accessibility events are handled by the dialog's host view
  override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {}
  override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent): Boolean = false

  fun onDropInstance() {
    reactContext.removeLifecycleEventListener(this)
    TrueSheetModule.unregisterView(id)

    if (viewController.isPresented) {
      viewController.dismiss()
    }
    viewController.delegate = null
  }

  override fun onHostResume() {
    finalizeUpdates()
  }

  override fun onHostPause() {
  }

  override fun onHostDestroy() {
    onDropInstance()
  }

  // ==================== TrueSheetViewControllerDelegate Implementation ====================

  override fun viewControllerWillPresent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(WillPresentEvent(surfaceId, id, index, position))
  }

  override fun viewControllerDidPresent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DidPresentEvent(surfaceId, id, index, position))

    // Enable touch event dispatching to React Native
    viewController.eventDispatcher = eventDispatcher
    containerView?.footerView?.eventDispatcher = eventDispatcher
  }

  override fun viewControllerWillDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(WillDismissEvent(surfaceId, id))

    // Disable touch event dispatching
    viewController.eventDispatcher = null
    containerView?.footerView?.eventDispatcher = null
  }

  override fun viewControllerDidDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DidDismissEvent(surfaceId, id))

    // Show parent sheet again if this was a stacked sheet
    parentViewController?.showDialog()
    parentViewController = null
  }

  override fun viewControllerDidChangeDetent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DetentChangeEvent(surfaceId, id, index, position))
  }

  override fun viewControllerDidDragBegin(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DragBeginEvent(surfaceId, id, index, position))
  }

  override fun viewControllerDidDragChange(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DragChangeEvent(surfaceId, id, index, position))
  }

  override fun viewControllerDidDragEnd(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(DragEndEvent(surfaceId, id, index, position))
  }

  override fun viewControllerDidChangePosition(index: Int, position: Float, transitioning: Boolean) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(PositionChangeEvent(surfaceId, id, index, position, transitioning))
  }

  override fun viewControllerDidChangeSize(width: Int, height: Int) {
    updateState(width, height)
  }

  // ==================== Property Setters (forward to controller) ====================

  fun setMaxHeight(height: Int) {
    if (viewController.maxSheetHeight == height) return
    viewController.maxSheetHeight = height
  }

  fun setDimmed(dimmed: Boolean) {
    if (viewController.dimmed == dimmed) return
    viewController.dimmed = dimmed
    if (viewController.isPresented) {
      viewController.setupDimmedBackground(viewController.currentDetentIndex)
    }
  }

  fun setDimmedDetentIndex(index: Int) {
    if (viewController.dimmedDetentIndex == index) return
    viewController.dimmedDetentIndex = index
    if (viewController.isPresented) {
      viewController.setupDimmedBackground(viewController.currentDetentIndex)
    }
  }

  fun setCornerRadius(radius: Float) {
    if (viewController.sheetCornerRadius == radius) return
    viewController.sheetCornerRadius = radius
  }

  fun setSheetBackgroundColor(color: Int) {
    if (viewController.sheetBackgroundColor == color) return
    viewController.sheetBackgroundColor = color
  }

  fun setSoftInputMode(mode: Int) {
    viewController.setSoftInputMode(mode)
  }

  fun setDismissible(dismissible: Boolean) {
    viewController.dismissible = dismissible
  }

  fun setGrabber(grabber: Boolean) {
    viewController.grabber = grabber
  }

  fun setDetents(newDetents: MutableList<Double>) {
    viewController.detents = newDetents
  }

  fun setBlurTint(tint: String?) {}

  fun setEdgeToEdgeFullScreen(edgeToEdgeFullScreen: Boolean) {
    viewController.edgeToEdgeFullScreen = edgeToEdgeFullScreen
  }

  // ==================== State Management ====================

  /**
   * Updates the Fabric state with container dimensions for Yoga layout.
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

  @UiThread
  fun present(detentIndex: Int, animated: Boolean = true, promiseCallback: () -> Unit) {
    // Find and hide parent sheet if this sheet is nested inside another TrueSheet
    // Only hide if parent is not expanded (otherwise it's already covering the screen)
    if (!viewController.isPresented) {
      parentViewController = findParentViewController()
      if (parentViewController?.isExpanded == false) {
        parentViewController?.hideDialog()
      } else {
        parentViewController = null
      }
    }

    viewController.presentPromise = promiseCallback
    viewController.present(detentIndex, animated)
  }

  @UiThread
  fun dismiss(promiseCallback: () -> Unit) {
    viewController.dismissPromise = promiseCallback
    viewController.dismiss()
  }

  /**
   * Traverses up the view hierarchy to find a parent TrueSheetViewController.
   * This is used to detect if this sheet is nested inside another TrueSheet's content.
   */
  private fun findParentViewController(): TrueSheetViewController? {
    var current: ViewGroup? = parent as? ViewGroup
    while (current != null) {
      if (current is TrueSheetViewController) {
        return current
      }
      current = current.parent as? ViewGroup
    }
    return null
  }

  /**
   * Debounced sheet update to handle rapid content/header size changes.
   * Uses post to ensure all layout passes complete before reconfiguring.
   */
  fun updateSheetIfNeeded() {
    if (!viewController.isPresented || isSheetUpdatePending) return

    isSheetUpdatePending = true
    viewController.post {
      isSheetUpdatePending = false
      viewController.setupSheetDetents()
      viewController.positionFooter()
    }
  }

  // ==================== TrueSheetContainerViewDelegate Implementation ====================

  override fun containerViewContentDidChangeSize(width: Int, height: Int) {
    updateSheetIfNeeded()
  }

  override fun containerViewHeaderDidChangeSize(width: Int, height: Int) {
    updateSheetIfNeeded()
  }

  override fun containerViewFooterDidChangeSize(width: Int, height: Int) {
    if (viewController.isPresented) {
      viewController.positionFooter()
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
