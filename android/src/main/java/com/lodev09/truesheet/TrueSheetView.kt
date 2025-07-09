package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.ViewTreeObserver
import android.view.accessibility.AccessibilityEvent
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lodev09.truesheet.core.RootSheetView
import com.lodev09.truesheet.core.Utils

class TrueSheetView(context: Context) :
  ViewGroup(context),
  LifecycleEventListener {

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  private val surfaceId: Int
    get() = UIManagerHelper.getSurfaceId(this)

  var eventDispatcher: EventDispatcher?
    get() = rootSheetView.eventDispatcher
    set(eventDispatcher) {
      rootSheetView.eventDispatcher = eventDispatcher
    }

  var initialIndex: Int = -1
  var initialIndexAnimated: Boolean = true

  /**
   * Determines if the sheet is being dragged by the user.
   */
  private var isDragging = false

  /**
   * Current activeIndex.
   */
  private var currentSizeIndex: Int = -1

  /**
   * Promise callback to be invoked after `present` is called.
   */
  private var presentPromise: (() -> Unit)? = null

  /**
   * Promise callback to be invoked after `dismiss` is called.
   */
  private var dismissPromise: (() -> Unit)? = null

  /**
   * The main BottomSheetDialog instance.
   */
  private val sheetDialog: TrueSheetDialog

  /**
   * React root view placeholder.
   */
  private val rootSheetView: RootSheetView

  private val layoutListener: ViewTreeObserver.OnGlobalLayoutListener

  init {
    reactContext.addLifecycleEventListener(this)
    rootSheetView = RootSheetView(context)

    sheetDialog = TrueSheetDialog(reactContext, rootSheetView)

    layoutListener = ViewTreeObserver.OnGlobalLayoutListener {
      updateViewSize()
    }

    // Configure Sheet Dialog
    sheetDialog.apply {
      // Setup listener when the dialog has been presented.
      setOnShowListener {
        updateViewSize()

        // Re-enable animation
        resetAnimation()

        // Resolve the present promise
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        // Dispatch onPresent event
        dispatchEvent(TrueSheetEvent.PRESENT, sizeInfoData(getSizeInfoForIndex(currentSizeIndex)))
      }

      // Setup listener when the dialog has been dismissed.
      setOnDismissListener {
        // Resolve the dismiss promise
        dismissPromise?.let { promise ->
          promise()
          dismissPromise = null
        }

        // Dispatch onDismiss event
        dispatchEvent(TrueSheetEvent.DISMISS)
      }

      behavior.isFitToContents = false

      // Configure sheet behavior events
      behavior.addBottomSheetCallback(
        object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onSlide(sheetView: View, slideOffset: Float) {
            when (behavior.state) {
              // For consistency with IOS, we consider SETTLING as dragging change.
              BottomSheetBehavior.STATE_DRAGGING,
              BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

              else -> { }
            }

            updateViewSize()
          }

          override fun onStateChanged(sheetView: View, newState: Int) {
            if (!isShowing) return

            when (newState) {
              // When changed to dragging, we know that the drag has started
              BottomSheetBehavior.STATE_DRAGGING -> handleDragBegin(sheetView)

              // Either of the following state determines drag end
              BottomSheetBehavior.STATE_EXPANDED,
              BottomSheetBehavior.STATE_COLLAPSED,
              BottomSheetBehavior.STATE_HALF_EXPANDED -> handleDragEnd(newState)

              else -> { }
            }
          }
        }
      )
    }
  }

  private fun updateViewSize() {
    // Recompute the size of the visible area and communicate this back to the
    // React world, so its layout engine can properly position the footer.
    val rect = sheetDialog.getVisibleContentDimensions()

    val data = Arguments.createMap()
    data.putDouble("width", Utils.toDIP(rect.width().toFloat()).toDouble())
    data.putDouble("height", Utils.toDIP(rect.height().toFloat()).toDouble())
    dispatchEvent(TrueSheetEvent.CONTAINER_SIZE_CHANGE, data)
  }

  override fun dispatchProvideStructure(structure: ViewStructure) {
    rootSheetView.dispatchProvideStructure(structure)
  }

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int
  ) {
    // Do nothing as we are laid out by UIManager
  }

  override fun setId(id: Int) {
    super.setId(id)

    // Forward the ID to our content view, so event dispatching behaves correctly
    rootSheetView.id = id
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    // Initialize content
    UiThreadUtil.runOnUiThread {
      // Respond to keyboard visibility events, we modulate the visible clipping area.
      ViewCompat.setOnApplyWindowInsetsListener(rootSheetView.rootView) { view, insets ->
        val imeVisible = insets.isVisible(WindowInsetsCompat.Type.ime())
        val imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom

        // Adjust your layout or padding/margin accordingly
        if (imeVisible) {
          rootSheetView.rootView.updatePadding(bottom = imeHeight)
        } else {
          rootSheetView.rootView.updatePadding(bottom = 0)
        }
        insets
      }
      // Recompute the visible rectangle on global layout changes (e.g. device rotation)
      rootSheetView.viewTreeObserver.addOnGlobalLayoutListener(layoutListener)

      sheetDialog.contentView?.height?.let { setContentHeight(it) }
      sheetDialog.headerView?.height?.let { setHeaderHeight(it) }
      sheetDialog.footerView?.height?.let { setFooterHeight(it) }

      if (initialIndex >= 0) {
        currentSizeIndex = initialIndex
        sheetDialog.present(initialIndex, initialIndexAnimated)
      }

      // Dispatch onMount event
      dispatchEvent(TrueSheetEvent.MOUNT)
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    onDropInstance()
  }

  override fun addView(child: View, index: Int) {
    UiThreadUtil.assertOnUiThread()
    rootSheetView.addView(child, index)

    // Hide this host view
    visibility = GONE
  }

  override fun getChildCount(): Int {
    // This method may be called by the parent constructor
    // before rootView is initialized.
    return rootSheetView.childCount
  }

  override fun getChildAt(index: Int): View = rootSheetView.getChildAt(index)

  override fun removeView(child: View) {
    UiThreadUtil.assertOnUiThread()
    rootSheetView.removeView(child)
  }

  override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
    rootSheetView.removeView(child)
  }

  override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the rootView which lives in the dialog
  }

  // Explicitly override this to prevent accessibility events being passed down to children
  // Those will be handled by the mHostView which lives in the dialog
  override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent): Boolean = false

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
    ViewCompat.setOnApplyWindowInsetsListener(rootSheetView.rootView, null)
    rootSheetView.viewTreeObserver.removeOnGlobalLayoutListener(layoutListener)
    reactContext.removeLifecycleEventListener(this)
    sheetDialog.dismiss()
  }

  private fun sizeInfoData(sizeInfo: SizeInfo): WritableMap {
    val data = Arguments.createMap()
    data.putInt("index", sizeInfo.index)
    data.putDouble("value", sizeInfo.value.toDouble())

    return data
  }

  private fun getCurrentSizeInfo(sheetView: View): SizeInfo {
    val height = sheetDialog.maxScreenHeight - sheetView.top
    val currentSizeInfo = SizeInfo(currentSizeIndex, Utils.toDIP(height.toFloat()))

    return currentSizeInfo
  }

  private fun handleDragBegin(sheetView: View) {
    // Dispatch drag started event
    dispatchEvent(TrueSheetEvent.DRAG_BEGIN, sizeInfoData(getCurrentSizeInfo(sheetView)))
    // Flag sheet is being dragged
    isDragging = true
  }

  private fun handleDragChange(sheetView: View) {
    if (!isDragging) return

    // Dispatch drag change event
    dispatchEvent(TrueSheetEvent.DRAG_CHANGE, sizeInfoData(getCurrentSizeInfo(sheetView)))
  }

  private fun handleDragEnd(state: Int) {
    if (!isDragging) return

    // For consistency with IOS,
    // we only handle state changes after dragging.
    //
    // Changing size programmatically is handled via the present method.
    val sizeInfo = sheetDialog.getSizeInfoForState(state)
    sizeInfo?.let {
      // Dispatch drag ended after dragging
      dispatchEvent(TrueSheetEvent.DRAG_END, sizeInfoData(it))
      if (it.index != currentSizeIndex) {
        // Invoke promise when sheet resized programmatically
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        currentSizeIndex = it.index
        sheetDialog.setupDimmedBackground(it.index)

        // Dispatch onSizeChange event
        dispatchEvent(TrueSheetEvent.SIZE_CHANGE, sizeInfoData(it))
      }
    }

    isDragging = false
  }

  private fun dispatchEvent(name: String, data: WritableMap? = null) {
    eventDispatcher?.dispatchEvent(TrueSheetEvent(surfaceId, id, name, data))
  }

  fun configureIfShowing() {
    if (sheetDialog.isShowing) {
      sheetDialog.configure()
    }
  }

  fun setEdgeToEdge(edgeToEdge: Boolean) {
    sheetDialog.edgeToEdge = edgeToEdge
  }

  fun setMaxHeight(height: Int) {
    if (sheetDialog.maxSheetHeight == height) return

    sheetDialog.maxSheetHeight = height
    configureIfShowing()
  }

  fun setContentHeight(height: Int) {
    if (sheetDialog.contentHeight == height) return

    sheetDialog.contentHeight = height
    configureIfShowing()
  }

  fun setHeaderHeight(height: Int) {
    if (sheetDialog.headerHeight == height) return

    sheetDialog.headerHeight = height
    configureIfShowing()
  }

  fun setFooterHeight(height: Int) {
    if (sheetDialog.footerHeight == height) return

    sheetDialog.footerHeight = height
    configureIfShowing()
  }

  fun setDimmed(dimmed: Boolean) {
    if (sheetDialog.dimmed == dimmed) return

    sheetDialog.dimmed = dimmed
    if (sheetDialog.isShowing) {
      sheetDialog.setupDimmedBackground(currentSizeIndex)
    }
  }

  fun setDimmedIndex(index: Int) {
    if (sheetDialog.dimmedIndex == index) return

    sheetDialog.dimmedIndex = index
    if (sheetDialog.isShowing) {
      sheetDialog.setupDimmedBackground(currentSizeIndex)
    }
  }

  fun setSoftInputMode(mode: Int) {
    sheetDialog.window?.apply {
      this.setSoftInputMode(mode)
    }
  }

  fun setDismissible(dismissible: Boolean) {
    sheetDialog.dismissible = dismissible
  }

  fun setSizes(newSizes: Array<Any>) {
    sheetDialog.sizes = newSizes
    configureIfShowing()
  }

  /**
   * Present the sheet at given size index.
   */
  fun present(sizeIndex: Int, promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    currentSizeIndex = sizeIndex

    if (sheetDialog.isShowing) {
      // For consistency with IOS, we are not waiting
      // for the state to change before dispatching onSizeChange event.
      val sizeInfo = sheetDialog.getSizeInfoForIndex(sizeIndex)
      dispatchEvent(TrueSheetEvent.SIZE_CHANGE, sizeInfoData(sizeInfo))

      promiseCallback()
    } else {
      presentPromise = promiseCallback
    }

    sheetDialog.present(sizeIndex)
  }

  /**
   * Dismisses the sheet.
   */
  fun dismiss(promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    dismissPromise = promiseCallback
    sheetDialog.dismiss()
  }
}
