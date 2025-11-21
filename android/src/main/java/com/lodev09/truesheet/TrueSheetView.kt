package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.util.Log
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
  TrueSheetControllerDelegate,
  TrueSheetRootViewDelegate {

  /**
   * Root view wrapper that gets set as the dialog content
   */
  private var sheetRootView: TrueSheetRootView = TrueSheetRootView(reactContext)

  /**
   * Gets the container view (first child of root view)
   */
  private val containerView: TrueSheetContainerView?
    get() = sheetRootView.getChildAt(0) as? TrueSheetContainerView

  var eventDispatcher: EventDispatcher? = null

  var initialDetentIndex: Int = -1
  var initialDetentAnimated: Boolean = true

  /**
   * Tracks if initial presentation has been handled
   */
  private var hasHandledInitialPresentation = false

  /**
   * The TrueSheetController instance that manages dialog lifecycle
   */
  private val sheetController: TrueSheetController

  init {
    reactContext.addLifecycleEventListener(this)

    sheetRootView.delegate = this

    // Create controller (dialog will be created when container mounts)
    sheetController = TrueSheetController(reactContext, sheetRootView)
    sheetController.delegate = this

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

    sheetRootView.id = id
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
      if (!sheetController.isShowing) {
        sheetController.createDialog()
      }

      post {
        present(initialDetentIndex) { }
      }
    } else {
      if (sheetController.isShowing) {
        sheetController.configure()
        sheetController.setStateForDetentIndex(sheetController.currentDetentIndex)

        UiThreadUtil.runOnUiThread {
          sheetController.positionFooter()
        }
      }
    }
  }

  // ==================== View Management ====================

  override fun addView(child: View?, index: Int) {
    UiThreadUtil.assertOnUiThread()

    // Add the child to our Root Sheet View
    // This is the TrueSheetContainerView
    sheetRootView.addView(child, index)

    // Create dialog and dispatch mount event when TrueSheetContainerView is added
    if (child is TrueSheetContainerView) {
      // Create the dialog now that the container is mounted
      sheetController.createDialog()

      val surfaceId = UIManagerHelper.getSurfaceId(this)
      eventDispatcher?.dispatchEvent(
        MountEvent(surfaceId, id)
      )
    }
  }

  override fun getChildCount(): Int = sheetRootView.childCount
  override fun getChildAt(index: Int): View? = sheetRootView.getChildAt(index)

  override fun removeView(child: View?) {
    UiThreadUtil.assertOnUiThread()

    if (child != null) {
      sheetRootView.removeView(child)
    }
  }

  override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
    sheetRootView.removeView(child)
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

    if (sheetController.isShowing) {
      sheetController.dismiss()
    }
    sheetController.delegate = null
  }

  override fun onHostResume() {
    showOrUpdate()
  }

  override fun onHostPause() {
  }

  override fun onHostDestroy() {
    onDropInstance()
  }

  // ==================== TrueSheetControllerDelegate Implementation ====================

  override fun controllerWillPresent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      WillPresentEvent(surfaceId, id, index, position)
    )
  }

  override fun controllerDidPresent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DidPresentEvent(surfaceId, id, index, position)
    )

    // Set our touch event dispatcher on the root view
    sheetRootView.eventDispatcher = eventDispatcher
  }

  override fun controllerWillDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      WillDismissEvent(surfaceId, id)
    )

    // Clear our touch event dispatcher on the root view
    sheetRootView.eventDispatcher = null
  }

  override fun controllerDidDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DidDismissEvent(surfaceId, id)
    )
  }

  override fun controllerDidChangeDetent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DetentChangeEvent(surfaceId, id, index, position)
    )
  }

  override fun controllerDidDragBegin(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragBeginEvent(surfaceId, id, index, position)
    )
  }

  override fun controllerDidDragChange(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragChangeEvent(surfaceId, id, index, position)
    )
  }

  override fun controllerDidDragEnd(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragEndEvent(surfaceId, id, index, position)
    )
  }

  override fun controllerDidChangePosition(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      PositionChangeEvent(surfaceId, id, index, position)
    )
  }

  // ==================== Property Setters (forward to controller) ====================

  fun setEdgeToEdge(edgeToEdge: Boolean) {
    sheetController.edgeToEdge = edgeToEdge
    sheetController.applyEdgeToEdge()
  }

  fun setMaxHeight(height: Int) {
    if (sheetController.maxSheetHeight == height) return
    sheetController.maxSheetHeight = height
  }

  fun setDimmed(dimmed: Boolean) {
    if (sheetController.dimmed == dimmed) return
    sheetController.dimmed = dimmed
    if (sheetController.isShowing) {
      sheetController.setupDimmedBackground(sheetController.currentDetentIndex)
    }
  }

  fun setDimmedIndex(index: Int) {
    if (sheetController.dimmedIndex == index) return
    sheetController.dimmedIndex = index
    if (sheetController.isShowing) {
      sheetController.setupDimmedBackground(sheetController.currentDetentIndex)
    }
  }

  fun setCornerRadius(radius: Float) {
    if (sheetController.cornerRadius == radius) return
    sheetController.cornerRadius = radius
    sheetController.setupBackground()
  }

  fun setBackground(color: Int) {
    if (sheetController.backgroundColor == color) return
    sheetController.backgroundColor = color
    sheetController.setupBackground()
  }

  fun setSoftInputMode(mode: Int) {
    sheetController.setSoftInputMode(mode)
  }

  fun setDismissible(dismissible: Boolean) {
    sheetController.dismissible = dismissible
  }

  fun setGrabber(grabber: Boolean) {}

  fun setDetents(newDetents: Array<Any>) {
    sheetController.detents = newDetents
  }

  fun setBlurTint(tint: String?) {}

  /**
   * Presents the sheet at the given detent index.
   *
   * @param detentIndex The detent index to present at
   * @param promiseCallback Callback invoked when presentation completes
   */
  @UiThread
  fun present(detentIndex: Int, promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    sheetController.presentPromise = promiseCallback
    sheetController.present(detentIndex)
  }

  /**
   * Dismisses the sheet.
   *
   * @param promiseCallback Callback invoked when dismissal completes
   */
  @UiThread
  fun dismiss(promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    sheetController.dismissPromise = promiseCallback
    sheetController.dismiss()
  }

  // ==================== TrueSheetRootViewDelegate Implementation ====================

  override fun rootViewDidChangeSize(width: Int, height: Int) {
    // Dispatch size change event to JS
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      SizeChangeEvent(surfaceId, id, width, height)
    )
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
