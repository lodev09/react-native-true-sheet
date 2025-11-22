package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.UiThread
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
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
import com.lodev09.truesheet.events.SizeChangeEvent
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
   * Tracks if initial presentation has been handled
   */
  private var hasHandledInitialPresentation = false

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

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
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
    UiThreadUtil.assertOnUiThread()

    // Only handle initial presentation once on mount
    if (!hasHandledInitialPresentation && initialDetentIndex >= 0) {
      hasHandledInitialPresentation = true

      // Create dialog if not created yet
      if (!viewController.isShowing) {
        viewController.createDialog()
      }

      post {
        present(initialDetentIndex, initialDetentAnimated) { }
      }
    } else {
      if (viewController.isShowing) {
        viewController.setupSheetDetents()
        viewController.setStateForDetentIndex(viewController.currentDetentIndex)
        viewController.positionFooter()
      }
    }
  }

  // ==================== View Management ====================

  override fun addView(child: View?, index: Int) {
    UiThreadUtil.assertOnUiThread()

    // Add the child to our ViewController
    // This is the TrueSheetContainerView
    viewController.addView(child, index)

    // Create dialog and dispatch mount event when TrueSheetContainerView is added
    if (child is TrueSheetContainerView) {
      // Set up container delegate to listen for content size changes
      child.delegate = this

      // Get initial content height from container
      val contentHeight = child.contentHeight
      if (contentHeight > 0) {
        viewController.contentHeight = contentHeight
      }

      // Create the dialog now that the container is mounted
      viewController.createDialog()

      val surfaceId = UIManagerHelper.getSurfaceId(this)
      eventDispatcher?.dispatchEvent(
        MountEvent(surfaceId, id)
      )
    }
  }

  override fun getChildCount(): Int = viewController.childCount
  override fun getChildAt(index: Int): View? = viewController.getChildAt(index)

  override fun removeView(child: View?) {
    UiThreadUtil.assertOnUiThread()

    if (child != null) {
      // Clean up container delegate
      if (child is TrueSheetContainerView) {
        child.delegate = null
      }

      viewController.removeView(child)
    }
  }

  override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
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

    if (viewController.isShowing) {
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

    // Set our touch event dispatcher on the view controller
    viewController.eventDispatcher = eventDispatcher
  }

  override fun viewControllerWillDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      WillDismissEvent(surfaceId, id)
    )

    // Clear our touch event dispatcher on the view controller
    viewController.eventDispatcher = null
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

  // ==================== Property Setters (forward to controller) ====================

  fun setMaxHeight(height: Int) {
    if (viewController.maxSheetHeight == height) return
    viewController.maxSheetHeight = height
  }

  fun setDimmed(dimmed: Boolean) {
    if (viewController.dimmed == dimmed) return
    viewController.dimmed = dimmed
    if (viewController.isShowing) {
      viewController.setupDimmedBackground(viewController.currentDetentIndex)
    }
  }

  fun setDimmedIndex(index: Int) {
    if (viewController.dimmedIndex == index) return
    viewController.dimmedIndex = index
    if (viewController.isShowing) {
      viewController.setupDimmedBackground(viewController.currentDetentIndex)
    }
  }

  fun setCornerRadius(radius: Float) {
    if (viewController.cornerRadius == radius) return
    viewController.cornerRadius = radius
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

  /**
   * Presents the sheet at the given detent index.
   *
   * @param detentIndex The detent index to present at
   * @param animated Whether to animate the presentation
   * @param promiseCallback Callback invoked when presentation completes
   */
  @UiThread
  fun present(detentIndex: Int, animated: Boolean = true, promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

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
    UiThreadUtil.assertOnUiThread()

    viewController.dismissPromise = promiseCallback
    viewController.dismiss()
  }

  override fun viewControllerDidChangeSize(width: Int, height: Int) {
    // Dispatch size change event to JS
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      SizeChangeEvent(surfaceId, id, width, height)
    )
  }

  // ==================== TrueSheetContainerViewDelegate Implementation ====================

  override fun containerViewContentDidChangeSize(width: Int, height: Int) {
    // Clamp content height to container height to prevent unbounded growth with scrollable content
    val containerHeight = viewController.maxScreenHeight
    val contentHeight = if (containerHeight > 0) minOf(height, containerHeight) else height

    viewController.contentHeight = contentHeight

    // Update detents if sheet is already presented
    if (viewController.isShowing) {
      // Reconfigure sheet detents with new content height
      viewController.setupSheetDetents()
      viewController.setStateForDetentIndex(viewController.currentDetentIndex)
    }
  }

  override fun containerViewFooterDidChangeSize(width: Int, height: Int) {
    // Reposition footer when its size changes
    if (viewController.isShowing) {
      viewController.positionFooter()
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
