package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.UiThread
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
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
  TrueSheetDialogDelegate {

  /**
   * Root view wrapper that gets set as the dialog content
   */
  private var sheetRootView: TrueSheetRootView = TrueSheetRootView(reactContext)

  var stateWrapper: StateWrapper?
    get() = sheetRootView.stateWrapper
    set(stateWrapper) {
      sheetRootView.stateWrapper = stateWrapper
    }

  var eventDispatcher: EventDispatcher?
    get() = sheetRootView.eventDispatcher
    set(eventDispatcher) {
      sheetRootView.eventDispatcher = eventDispatcher
    }

  var initialDetentIndex: Int = -1
  var initialDetentAnimated: Boolean = true

  /**
   * Tracks if initial presentation has been handled
   */
  private var hasHandledInitialPresentation = false

  /**
   * The BottomSheetDialog instance
   */
  private var sheetDialog: TrueSheetDialog? = null

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
    reactContext.addLifecycleEventListener(this)
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
      sheetDialog?.let { dialog ->
        if (dialog.isShowing) {
          dialog.configure()
          dialog.setStateForDetentIndex(dialog.currentDetentIndex)

          UiThreadUtil.runOnUiThread {
            dialog.positionFooter()
          }
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

    sheetDialog = TrueSheetDialog(reactContext, sheetRootView)
    sheetDialog?.delegate = this

    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      MountEvent(surfaceId, id)
    )
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

    sheetDialog?.let { dialog ->
      if (dialog.isShowing) {
        dialog.dismiss()
      }
      dialog.delegate = null
    }

    sheetDialog = null
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
  }

  override fun dialogWillDismiss() {
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    eventDispatcher?.dispatchEvent(
      WillDismissEvent(surfaceId, id)
    )
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
    sheetDialog?.edgeToEdge = edgeToEdge
  }

  fun setMaxHeight(height: Int) {
    sheetDialog?.let { dialog ->
      if (dialog.maxSheetHeight == height) return
      dialog.maxSheetHeight = height
    }
  }

  fun setDimmed(dimmed: Boolean) {
    sheetDialog?.let { dialog ->
      if (dialog.dimmed == dimmed) return
      dialog.dimmed = dimmed
      if (dialog.isShowing) {
        dialog.setupDimmedBackground(dialog.currentDetentIndex)
      }
    }
  }

  fun setDimmedIndex(index: Int) {
    sheetDialog?.let { dialog ->
      if (dialog.dimmedIndex == index) return
      dialog.dimmedIndex = index
      if (dialog.isShowing) {
        dialog.setupDimmedBackground(dialog.currentDetentIndex)
      }
    }
  }

  fun setCornerRadius(radius: Float) {
    sheetDialog?.let { dialog ->
      if (dialog.cornerRadius == radius) return
      dialog.cornerRadius = radius
      dialog.setupBackground()
    }
  }

  fun setBackground(color: Int) {
    sheetDialog?.let { dialog ->
      if (dialog.backgroundColor == color) return
      dialog.backgroundColor = color
      dialog.setupBackground()
    }
  }

  fun setSoftInputMode(mode: Int) {
    sheetDialog?.window?.setSoftInputMode(mode)
  }

  fun setDismissible(dismissible: Boolean) {
    sheetDialog?.dismissible = dismissible
  }

  fun setGrabber(grabber: Boolean) {}

  fun setDetents(newDetents: Array<Any>) {
    sheetDialog?.let { dialog ->
      dialog.detents = newDetents
    }
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

    sheetDialog?.let { dialog ->
      dialog.presentPromise = promiseCallback
      dialog.present(detentIndex)
    }
  }

  /**
   * Dismisses the sheet.
   *
   * @param promiseCallback Callback invoked when dismissal completes
   */
  @UiThread
  fun dismiss(promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    sheetDialog?.let { dialog ->
      dialog.dismissPromise = promiseCallback
      dialog.dismiss()
    }
  }
}
