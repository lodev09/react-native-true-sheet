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
  TrueSheetDialogDelegate,
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
   * The BottomSheetDialog instance
   */
  private val sheetDialog: TrueSheetDialog

  init {
    reactContext.addLifecycleEventListener(this)

    sheetRootView.delegate = this

    // Create dialog early so it's ready when props are set
    sheetDialog = TrueSheetDialog(reactContext, sheetRootView)
    sheetDialog.delegate = this

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

      post {
        present(initialDetentIndex) { }
      }
    } else {
      if (sheetDialog.isShowing) {
        sheetDialog.configure()
        sheetDialog.setStateForDetentIndex(sheetDialog.currentDetentIndex)

        UiThreadUtil.runOnUiThread {
          sheetDialog.positionFooter()
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

    // Dispatch mount event when TrueSheetContainerView is added
    if (child is TrueSheetContainerView) {
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

    if (sheetDialog.isShowing) {
      sheetDialog.dismiss()
    }
    sheetDialog.delegate = null
  }

  override fun onHostResume() {
    showOrUpdate()
  }

  override fun onHostPause() {
  }

  override fun onHostDestroy() {
    onDropInstance()
  }

  // ==================== TrueSheetDialogDelegate Implementation ====================

  override fun dialogWillPresent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      WillPresentEvent(surfaceId, id, index, position)
    )
  }

  override fun dialogDidPresent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DidPresentEvent(surfaceId, id, index, position)
    )

    // Set our touch event dispatcher on the root view
    sheetRootView.eventDispatcher = eventDispatcher
  }

  override fun dialogWillDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      WillDismissEvent(surfaceId, id)
    )

    // Clear our touch event dispatcher on the root view
    sheetRootView.eventDispatcher = null
  }

  override fun dialogDidDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DidDismissEvent(surfaceId, id)
    )
  }

  override fun dialogDidChangeDetent(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DetentChangeEvent(surfaceId, id, index, position)
    )
  }

  override fun dialogDidDragBegin(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragBeginEvent(surfaceId, id, index, position)
    )
  }

  override fun dialogDidDragChange(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragChangeEvent(surfaceId, id, index, position)
    )
  }

  override fun dialogDidDragEnd(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      DragEndEvent(surfaceId, id, index, position)
    )
  }

  override fun dialogDidChangePosition(index: Int, position: Float) {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      PositionChangeEvent(surfaceId, id, index, position)
    )
  }

  // ==================== Property Setters (forward to dialog) ====================

  fun setEdgeToEdge(edgeToEdge: Boolean) {
    sheetDialog.edgeToEdge = edgeToEdge
  }

  fun setMaxHeight(height: Int) {
    if (sheetDialog.maxSheetHeight == height) return
    sheetDialog.maxSheetHeight = height
  }

  fun setDimmed(dimmed: Boolean) {
    if (sheetDialog.dimmed == dimmed) return
    sheetDialog.dimmed = dimmed
    if (sheetDialog.isShowing) {
      sheetDialog.setupDimmedBackground(sheetDialog.currentDetentIndex)
    }
  }

  fun setDimmedIndex(index: Int) {
    if (sheetDialog.dimmedIndex == index) return
    sheetDialog.dimmedIndex = index
    if (sheetDialog.isShowing) {
      sheetDialog.setupDimmedBackground(sheetDialog.currentDetentIndex)
    }
  }

  fun setCornerRadius(radius: Float) {
    if (sheetDialog.cornerRadius == radius) return
    sheetDialog.cornerRadius = radius
    sheetDialog.setupBackground()
  }

  fun setBackground(color: Int) {
    if (sheetDialog.backgroundColor == color) return
    sheetDialog.backgroundColor = color
    sheetDialog.setupBackground()
  }

  fun setSoftInputMode(mode: Int) {
    sheetDialog.window?.setSoftInputMode(mode)
  }

  fun setDismissible(dismissible: Boolean) {
    sheetDialog.dismissible = dismissible
  }

  fun setGrabber(grabber: Boolean) {}

  fun setDetents(newDetents: Array<Any>) {
    sheetDialog.detents = newDetents
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

    sheetDialog.presentPromise = promiseCallback
    sheetDialog.present(detentIndex)
  }

  /**
   * Dismisses the sheet.
   *
   * @param promiseCallback Callback invoked when dismissal completes
   */
  @UiThread
  fun dismiss(promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    sheetDialog.dismissPromise = promiseCallback
    sheetDialog.dismiss()
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
