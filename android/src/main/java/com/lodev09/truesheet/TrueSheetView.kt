package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import androidx.annotation.UiThread
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.events.*

/**
 * Main TrueSheet host view.
 * Manages the sheet dialog and container, and dispatches events to JavaScript.
 */
@SuppressLint("ViewConstructor")
class TrueSheetView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  LifecycleEventListener,
  TrueSheetDialogDelegate {

  var eventDispatcher: EventDispatcher? = null

  var stateWrapper: StateWrapper? = null

  var initialDetentIndex: Int = -1
  var initialDetentAnimated: Boolean = true

  /**
   * Tracks if initial presentation has been handled
   */
  private var hasHandledInitialPresentation = false

  /**
   * Container view that holds the sheet content.
   * All child views added to TrueSheetView are forwarded to this container.
   */
  private val containerView: TrueSheetContainerView = TrueSheetContainerView(reactContext)

  /**
   * Root view wrapper that gets set as the dialog content
   */
  private var rootSheetView: TrueSheetRootView? = null

  /**
   * The BottomSheetDialog instance
   */
  private var sheetDialog: TrueSheetDialog? = null

  init {
    reactContext.addLifecycleEventListener(this)

    rootSheetView = TrueSheetRootView(reactContext)
    rootSheetView?.eventDispatcher = eventDispatcher
    rootSheetView?.stateWrapper = stateWrapper

    sheetDialog = TrueSheetDialog(reactContext, rootSheetView!!, containerView)

    sheetDialog?.delegate = this

    rootSheetView?.addView(containerView)
  }

  override fun setId(id: Int) {
    super.setId(id)

    rootSheetView?.id = id

    TrueSheetModule.registerView(this, id)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
    eventDispatcher = dispatcher

    val surfaceId = UIManagerHelper.getSurfaceId(this)
    dispatcher?.dispatchEvent(
      com.lodev09.truesheet.events.MountEvent(surfaceId, id)
    )
  }

  /**
   * Shows or updates the sheet after all properties are set.
   */
  fun showOrUpdate() {
    UiThreadUtil.assertOnUiThread()

    // Only handle initial presentation once on mount
    if (!hasHandledInitialPresentation && initialDetentIndex >= 0) {
      hasHandledInitialPresentation = true

      post {
        present(initialDetentIndex) { }
      }
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    TrueSheetModule.unregisterView(id)
    onDropInstance()
  }

  override fun requestLayout() {
    super.requestLayout()

    post {
      configureIfShowing()
    }
  }

  private fun configureIfShowing() {
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

  // ==================== View Management ====================

  override fun addView(child: View?, index: Int) {
    UiThreadUtil.assertOnUiThread()

    containerView.addView(child, index)
  }

  override fun removeView(child: View?) {
    UiThreadUtil.assertOnUiThread()

    if (child != null) {
      containerView.removeView(child)
    }
  }

  override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
    containerView.removeView(child)
  }

  override fun getChildCount(): Int = containerView.childCount

  override fun getChildAt(index: Int): View? = containerView.getChildAt(index)

  override fun onHostResume() {
    configureIfShowing()
  }

  override fun onHostPause() {
  }

  override fun onHostDestroy() {
    onDropInstance()
  }

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
    rootSheetView = null
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

  fun applyPropsToContainer() {
    configureIfShowing()
  }

  fun setEdgeToEdge(edgeToEdge: Boolean) {
    sheetDialog?.edgeToEdge = edgeToEdge
  }

  fun setMaxHeight(height: Int) {
    sheetDialog?.let { dialog ->
      if (dialog.maxSheetHeight == height) return
      dialog.maxSheetHeight = height
      configureIfShowing()
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
      configureIfShowing()
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
