package com.lodev09.truesheet

import android.view.View
import androidx.annotation.UiThread
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

/**
 * Main TrueSheet host view for Fabric architecture.
 * Similar to iOS TrueSheetView, this is a simple host that holds a reference to the container.
 * The dialog lives here and persists across container mount/unmount cycles.
 */
class TrueSheetView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  LifecycleEventListener {

  var eventDispatcher: EventDispatcher? = null
    get() = field
    set(value) {
      field = value
      dialogContainer.eventDispatcher = value
    }

  var stateWrapper: StateWrapper? = null
    get() = field
    set(value) {
      field = value
      dialogContainer.stateWrapper = value
    }

  var initialDetentIndex: Int = -1
  var initialDetentAnimated: Boolean = true

  /**
   * Track if initial presentation has been handled
   */
  private var hasHandledInitialPresentation = false

  /**
   * Container view that manages the content - can be added/removed from dialog
   */
  private val dialogContainer: TrueSheetContainerView = TrueSheetContainerView(reactContext)

  /**
   * React root view wrapper - this is what gets set as the dialog content
   */
  private var rootSheetView: TrueSheetRootView? = null

  /**
   * The main BottomSheetDialog instance - persists across container lifecycle
   */
  private var sheetDialog: TrueSheetDialog? = null

  init {
    reactContext.addLifecycleEventListener(this)

    // Initialize dialog and root view
    rootSheetView = TrueSheetRootView(reactContext)
    rootSheetView?.eventDispatcher = eventDispatcher
    rootSheetView?.stateWrapper = stateWrapper

    sheetDialog = TrueSheetDialog(reactContext, rootSheetView!!, dialogContainer)

    // Setup container with the dialog
    dialogContainer.setupInSheetView(this, sheetDialog!!)

    // Add container to the root sheet view
    rootSheetView?.addView(dialogContainer)
  }

  override fun setId(id: Int) {
    super.setId(id)

    // Update root view ID to match
    rootSheetView?.id = id

    // Register this view with the module for ref-based access
    TrueSheetModule.registerView(this, id)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    // Get event dispatcher and set it on container if available
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
    eventDispatcher = dispatcher

    // Dispatch onMount event when attached
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    dispatcher?.dispatchEvent(
      com.lodev09.truesheet.events.MountEvent(surfaceId, id)
    )
  }

  /**
   * Show or update the sheet. Called after all properties are set.
   * Similar to ReactModalHostView.showOrUpdate()
   */
  fun showOrUpdate() {
    UiThreadUtil.assertOnUiThread()

    // Only handle initial presentation once on mount
    if (!hasHandledInitialPresentation && initialDetentIndex >= 0) {
      hasHandledInitialPresentation = true

      // Present directly - auto detent parsing should handle the timing
      post {
        dialogContainer.present(initialDetentIndex) { }
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

    // When layout is requested, update the sheet configuration
    post {
      configureIfShowing()
    }
  }

  private fun configureIfShowing() {
    sheetDialog?.let { dialog ->
      if (dialog.isShowing) {
        dialog.configure()
        dialog.setStateForDetentIndex(dialogContainer.currentDetentIndex)

        UiThreadUtil.runOnUiThread {
          dialog.positionFooter()
        }
      }
    }
  }

  // ==================== View Management ====================

  override fun addView(child: View?, index: Int) {
    UiThreadUtil.assertOnUiThread()
    // Forward all children to the container (like Modal forwards to dialogRootViewGroup)
    dialogContainer.addView(child, index)
  }

  override fun removeView(child: View?) {
    UiThreadUtil.assertOnUiThread()

    if (child != null) {
      dialogContainer.removeView(child)
    }
  }

  override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
    dialogContainer.removeView(child)
  }

  override fun getChildCount(): Int = dialogContainer.childCount

  override fun getChildAt(index: Int): View? = dialogContainer.getChildAt(index)

  override fun onHostResume() {
    configureIfShowing()
  }

  override fun onHostPause() {
    // do nothing
  }

  override fun onHostDestroy() {
    // Drop the instance if the host is destroyed which will dismiss the dialog
    onDropInstance()
  }

  fun onDropInstance() {
    reactContext.removeLifecycleEventListener(this)
    TrueSheetModule.unregisterView(id)

    // Cleanup dialog when view is actually dropped
    sheetDialog?.let { dialog ->
      if (dialog.isShowing) {
        dialog.dismiss()
      }
    }
    sheetDialog = null
    rootSheetView = null
  }

  // ==================== Property Setters (forward to container) ====================

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
        dialog.setupDimmedBackground(dialogContainer.currentDetentIndex)
      }
    }
  }

  fun setDimmedIndex(index: Int) {
    sheetDialog?.let { dialog ->
      if (dialog.dimmedIndex == index) return
      dialog.dimmedIndex = index
      if (dialog.isShowing) {
        dialog.setupDimmedBackground(dialogContainer.currentDetentIndex)
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
   * Present the sheet at given detent index.
   *
   * @param detentIndex The detent index to present at
   * @param promiseCallback Callback invoked when presentation completes
   */
  @UiThread
  fun present(detentIndex: Int, promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()
    dialogContainer.present(detentIndex, promiseCallback)
  }

  /**
   * Dismisses the sheet.
   *
   * @param promiseCallback Callback invoked when dismissal completes
   */
  @UiThread
  fun dismiss(promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()
    dialogContainer.dismiss(promiseCallback)
  }
}
