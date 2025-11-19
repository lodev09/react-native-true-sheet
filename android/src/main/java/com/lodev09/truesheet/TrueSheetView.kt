package com.lodev09.truesheet

import android.content.Context
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
 * The container manages the actual sheet presentation logic.
 */
class TrueSheetView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  LifecycleEventListener {

  var eventDispatcher: EventDispatcher? = null
    set(value) {
      field = value
      containerView?.eventDispatcher = value
    }

  var stateWrapper: StateWrapper? = null
    set(value) {
      field = value
      containerView?.stateWrapper = value
    }

  var initialDetentIndex: Int = -1
  var initialDetentAnimated: Boolean = true

  /**
   * Container view (first child) that manages the dialog
   */
  var containerView: TrueSheetContainerView? = null
    private set

  /**
   * Track if initial presentation has been handled
   */
  private var hasHandledInitialPresentation = false

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun setId(id: Int) {
    super.setId(id)

    // Register this view with the module for ref-based access
    TrueSheetModule.registerView(this, id)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    // Get event dispatcher and set it on container if available
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
    eventDispatcher = dispatcher

    // Emit onMount event when container is ready
    containerView?.let {
      val surfaceId = UIManagerHelper.getSurfaceId(this)
      dispatcher?.dispatchEvent(
        com.lodev09.truesheet.events.MountEvent(surfaceId, id)
      )
    }
  }

  /**
   * Show or update the sheet. Called after all properties are set.
   * Similar to ReactModalHostView.showOrUpdate()
   */
  fun showOrUpdate() {
    UiThreadUtil.assertOnUiThread()

    // Handle initial presentation if needed and not yet done
    if (!hasHandledInitialPresentation && initialDetentIndex >= 0 && containerView != null) {
      hasHandledInitialPresentation = true
      
      // Wait for container to be laid out before presenting
      containerView?.viewTreeObserver?.addOnGlobalLayoutListener(
        object : android.view.ViewTreeObserver.OnGlobalLayoutListener {
          override fun onGlobalLayout() {
            containerView?.viewTreeObserver?.removeOnGlobalLayoutListener(this)
            // Present after layout is complete
            containerView?.present(initialDetentIndex) { }
          }
        }
      )
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
      containerView?.configureIfShowing()
    }
  }

  // ==================== View Management ====================

  override fun addView(child: View?, index: Int) {
    // Check if it's a container view
    if (child is TrueSheetContainerView) {
      if (containerView != null) {
        throw IllegalStateException("TrueSheet: Sheet can only have one container component.")
      }

      containerView = child
      
      // Setup container in sheet view
      child.setupInSheetView(this)
      
      // Trigger initial presentation after container is ready
      showOrUpdate()
      
      // Don't add as child - container manages its own view hierarchy
      return
    }

    super.addView(child, index)
  }

  override fun removeView(child: View?) {
    if (child is TrueSheetContainerView && child == containerView) {
      child.cleanup()
      containerView = null
      return
    }

    super.removeView(child)
  }

  override fun removeViewAt(index: Int) {
    val child = getChildAt(index)
    removeView(child)
  }

  override fun onHostResume() {
    containerView?.configureIfShowing()
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
    containerView?.cleanup()
  }

  // ==================== Property Setters (forward to container) ====================

  fun applyPropsToContainer() {
    containerView?.applyPropsFromSheetView()
  }

  fun setEdgeToEdge(edgeToEdge: Boolean) {
    containerView?.setEdgeToEdge(edgeToEdge)
  }

  fun setMaxHeight(height: Int) {
    containerView?.setMaxHeight(height)
  }

  fun setDimmed(dimmed: Boolean) {
    containerView?.setDimmed(dimmed)
  }

  fun setDimmedIndex(index: Int) {
    containerView?.setDimmedIndex(index)
  }

  fun setCornerRadius(radius: Float) {
    containerView?.setCornerRadius(radius)
  }

  fun setBackground(color: Int) {
    containerView?.setBackground(color)
  }

  fun setSoftInputMode(mode: Int) {
    containerView?.setSoftInputMode(mode)
  }

  fun setDismissible(dismissible: Boolean) {
    containerView?.setDismissible(dismissible)
  }

  fun setGrabber(grabber: Boolean) {
    // Note: Android Material Bottom Sheet doesn't have a built-in grabber
    // This would need custom implementation if required
    // For now, we accept the prop but don't implement it
  }

  fun setDetents(newDetents: Array<Any>) {
    containerView?.setDetents(newDetents)
  }

  fun setBlurTint(tint: String?) {
    // Note: BlurTint is iOS-specific feature
    // Android doesn't have native blur support in the same way
    // This is a no-op on Android, accepting the prop for cross-platform compatibility
  }

  fun setKeyboardMode(mode: String) {
    // Already handled via setSoftInputMode
  }

  /**
   * Present the sheet at given detent index.
   *
   * @param detentIndex The detent index to present at
   * @param promiseCallback Callback invoked when presentation completes
   */
  @UiThread
  fun present(detentIndex: Int, promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    containerView?.present(detentIndex, promiseCallback) ?: run {
      // Container not ready, fail the promise
      promiseCallback()
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

    containerView?.dismiss(promiseCallback) ?: run {
      // Container not ready, just invoke callback
      promiseCallback()
    }
  }
}