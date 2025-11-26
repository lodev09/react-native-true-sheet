package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
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
 * Main TrueSheet host view.
 * Manages the sheet dialog and container, and dispatches events to JavaScript.
 */
@SuppressLint("ViewConstructor")
class TrueSheetView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  LifecycleEventListener,
  TrueSheetViewControllerDelegate,
  TrueSheetContainerViewDelegate {

  /**
   * The TrueSheetViewController instance that acts as both root view and controller
   */
  private val viewController: TrueSheetViewController = TrueSheetViewController(reactContext)

  /**
   * Gets the container view (first child of view controller)
   */
  private val containerView: TrueSheetContainerView?
    get() = viewController.getChildAt(0) as? TrueSheetContainerView

  var eventDispatcher: EventDispatcher? = null

  var initialDetentIndex: Int = -1
  var initialDetentAnimated: Boolean = true

  /**
   * Sets the state wrapper and immediately updates with initial screen width.
   * This ensures we have initial width even before controller emits changeSize.
   */
  var stateWrapper: StateWrapper? = null
    set(value) {
      // Immediately update state with screen width during first state update
      // This will help us layout the content width before presenting
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

  init {
    reactContext.addLifecycleEventListener(this)

    // Set delegates
    viewController.delegate = this

    // Hide the host view from layout and touch handling
    // The actual content is shown in a dialog window
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

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    onDropInstance()

    TrueSheetModule.unregisterView(id)
  }

  /**
   * showOrUpdate will display the Dialog. It is called by the manager once all properties are set
   * because we need to know all of them before creating the Dialog. It is also smart during updates
   * if the changed properties can be applied directly to the Dialog or require the recreation of a
   * new Dialog.
   */
  fun showOrUpdate() {
    if (viewController.isPresented) {
      updateSheetIfNeeded()
      viewController.setStateForDetentIndex(viewController.currentDetentIndex)
    }
  }

  // ==================== View Management ====================

  override fun addView(child: View?, index: Int) {
    // Add the child to our ViewController
    // This is the TrueSheetContainerView
    viewController.addView(child, index)

    // Create dialog and dispatch mount event when TrueSheetContainerView is added
    if (child is TrueSheetContainerView) {
      // Set up container delegate to listen for content size changes
      child.delegate = this

      // Create the dialog now that the container is mounted
      viewController.createDialog()

      // Handle initial presentation if provided
      if (initialDetentIndex >= 0) {
        // We run after layout pass so content height is already available
        post {
          present(initialDetentIndex, initialDetentAnimated) { }
        }
      }

      // Emit mount event
      val surfaceId = UIManagerHelper.getSurfaceId(this)
      eventDispatcher?.dispatchEvent(
        MountEvent(surfaceId, id)
      )
    }
  }

  override fun getChildCount(): Int = viewController.childCount
  override fun getChildAt(index: Int): View? = viewController.getChildAt(index)

  override fun removeViewAt(index: Int) {
    val child = getChildAt(index)

    // Clean up container delegate
    if (child is TrueSheetContainerView) {
      child.delegate = null
    }

    viewController.removeView(child)
  }

  override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the mHostView which lives in the dialog
  }

  // Explicitly override this to prevent accessibility events being passed down to children
  // Those will be handled by the mHostView which lives in the dialog
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
    showOrUpdate()
  }

  override fun onHostPause() {
  }

  override fun onHostDestroy() {
    onDropInstance()
  }

  // ==================== TrueSheetViewControllerDelegate Implementation ====================

  override fun viewControllerWillPresent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      WillPresentEvent(surfaceId, id, index, position)
    )
  }

  override fun viewControllerDidPresent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DidPresentEvent(surfaceId, id, index, position)
    )

    // Set our touch event dispatcher on the view controller and footer
    viewController.eventDispatcher = eventDispatcher
    containerView?.footerView?.eventDispatcher = eventDispatcher
  }

  override fun viewControllerWillDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      WillDismissEvent(surfaceId, id)
    )

    // Clear our touch event dispatcher on the view controller and footer
    viewController.eventDispatcher = null
    containerView?.footerView?.eventDispatcher = null
  }

  override fun viewControllerDidDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DidDismissEvent(surfaceId, id)
    )
  }

  override fun viewControllerDidChangeDetent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DetentChangeEvent(surfaceId, id, index, position)
    )
  }

  override fun viewControllerDidDragBegin(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragBeginEvent(surfaceId, id, index, position)
    )
  }

  override fun viewControllerDidDragChange(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragChangeEvent(surfaceId, id, index, position)
    )
  }

  override fun viewControllerDidDragEnd(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragEndEvent(surfaceId, id, index, position)
    )
  }

  override fun viewControllerDidChangePosition(index: Int, position: Float, transitioning: Boolean) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      PositionChangeEvent(surfaceId, id, index, position, transitioning)
    )
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
    viewController.setupBackground()
  }

  fun setSheetBackgroundColor(color: Int) {
    if (viewController.sheetBackgroundColor == color) return
    viewController.sheetBackgroundColor = color
    viewController.setupBackground()
  }

  fun setSoftInputMode(mode: Int) {
    viewController.setSoftInputMode(mode)
  }

  fun setDismissible(dismissible: Boolean) {
    viewController.dismissible = dismissible
  }

  fun setGrabber(grabber: Boolean) {}

  fun setDetents(newDetents: MutableList<Double>) {
    viewController.detents = newDetents
  }

  fun setBlurTint(tint: String?) {}

  fun setEdgeToEdgeFullScreen(edgeToEdgeFullScreen: Boolean) {
    viewController.edgeToEdgeFullScreen = edgeToEdgeFullScreen
  }

  // ==================== State Management ====================

  /**
   * Update state with container dimensions.
   * Called when the dialog size changes.
   */
  fun updateState(width: Int, height: Int) {
    // Skip if dimensions haven't changed
    if (width == lastContainerWidth && height == lastContainerHeight) return

    // Store new dimensions
    lastContainerWidth = width
    lastContainerHeight = height
    val sw = stateWrapper ?: return

    val realWidth = width.toFloat().pxToDp()
    val realHeight = height.toFloat().pxToDp()

    val newStateData = WritableNativeMap()
    newStateData.putDouble("containerWidth", realWidth.toDouble())
    newStateData.putDouble("containerHeight", realHeight.toDouble())
    sw.updateState(newStateData)
  }

  /**
   * Presents the sheet at the given detent index.
   *
   * @param detentIndex The detent index to present at
   * @param animated Whether to animate the presentation
   * @param promiseCallback Callback invoked when presentation completes
   */
  @UiThread
  fun present(detentIndex: Int, animated: Boolean = true, promiseCallback: () -> Unit) {
    viewController.presentPromise = promiseCallback
    viewController.present(detentIndex, animated)
  }

  /**
   * Dismisses the sheet.
   *
   * @param promiseCallback Callback invoked when dismissal completes
   */
  @UiThread
  fun dismiss(promiseCallback: () -> Unit) {
    viewController.dismissPromise = promiseCallback
    viewController.dismiss()
  }

  fun updateSheetIfNeeded() {
    // Update sheet size only when presented
    if (!viewController.isPresented) {
      return
    }

    // Skip if an update is already pending
    if (isSheetUpdatePending) {
      return
    }

    isSheetUpdatePending = true

    // Use post to ensure all layout passes are complete before reconfiguring
    // This handles cases where content and header size changes happen in sequence
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

    // Update our state after header change size for scroll view behavior to work
    val sheetHeight = TrueSheetViewController.getEffectiveSheetHeight(viewController.height, height)
    updateState(viewController.width, sheetHeight)
  }

  override fun containerViewFooterDidChangeSize(width: Int, height: Int) {
    // Reposition footer when its size changes
    if (viewController.isPresented) {
      viewController.positionFooter()
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
