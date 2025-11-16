package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
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
  private var currentDetentIndex: Int = -1

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

  init {
    reactContext.addLifecycleEventListener(this)

    rootSheetView = RootSheetView(context)
    sheetDialog = TrueSheetDialog(reactContext, rootSheetView)

    // Configure Sheet Dialog
    sheetDialog.apply {
      setOnDetentChangeListener { w, h ->
        val data = Arguments.createMap()
        data.putDouble("width", Utils.toDIP(w.toFloat()).toDouble())
        data.putDouble("height", Utils.toDIP(h.toFloat()).toDouble())

        dispatchEvent(TrueSheetEvent.CONTAINER_SIZE_CHANGE, data)
      }

      // Setup listener when the dialog has been presented.
      setOnShowListener {
        registerKeyboardManager()

        // Initialize footer y
        UiThreadUtil.runOnUiThread {
          positionFooter()
        }

        // Re-enable animation
        resetAnimation()

        // Resolve the present promise
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        // Dispatch onPresent event
        dispatchEvent(TrueSheetEvent.PRESENT, detentInfoData(getDetentInfoForIndex(currentDetentIndex)))
      }

      // Setup listener when the dialog has been dismissed.
      setOnDismissListener {
        unregisterKeyboardManager()

        // Resolve the dismiss promise
        dismissPromise?.let { promise ->
          promise()
          dismissPromise = null
        }

        // Dispatch onDismiss event
        dispatchEvent(TrueSheetEvent.DISMISS)
      }

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

            footerView?.let {
              val y = (maxScreenHeight - sheetView.top - footerHeight).toFloat()
              if (slideOffset >= 0) {
                // Sheet is expanding
                it.y = y
              } else {
                // Sheet is collapsing
                it.y = y - footerHeight * slideOffset
              }
            }
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
      sheetDialog.contentView?.height?.let { setContentHeight(it) }
      sheetDialog.footerView?.height?.let { setFooterHeight(it) }

      if (initialIndex >= 0) {
        currentDetentIndex = initialIndex
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
  public override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent): Boolean = false

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
    sheetDialog.dismiss()
  }

  private fun detentInfoData(detentInfo: DetentInfo): WritableMap {
    val data = Arguments.createMap()
    data.putInt("index", detentInfo.index)
    data.putDouble("value", detentInfo.value.toDouble())

    return data
  }

  private fun getCurrentDetentInfo(sheetView: View): DetentInfo {
    val height = sheetDialog.maxScreenHeight - sheetView.top
    val currentDetentInfo = DetentInfo(currentDetentIndex, Utils.toDIP(height.toFloat()))

    return currentDetentInfo
  }

  private fun handleDragBegin(sheetView: View) {
    // Dispatch drag started event
    dispatchEvent(TrueSheetEvent.DRAG_BEGIN, detentInfoData(getCurrentDetentInfo(sheetView)))
    // Flag sheet is being dragged
    isDragging = true
  }

  private fun handleDragChange(sheetView: View) {
    if (!isDragging) return

    // Dispatch drag change event
    dispatchEvent(TrueSheetEvent.DRAG_CHANGE, detentInfoData(getCurrentDetentInfo(sheetView)))
  }

  private fun handleDragEnd(state: Int) {
    if (!isDragging) return

    // For consistency with IOS,
    // we only handle state changes after dragging.
    //
    // Changing detent programmatically is handled via the present method.
    val detentInfo = sheetDialog.getDetentInfoForState(state)
    detentInfo?.let {
      // Dispatch drag ended after dragging
      dispatchEvent(TrueSheetEvent.DRAG_END, detentInfoData(it))
      if (it.index != currentDetentIndex) {
        // Invoke promise when sheet resized programmatically
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        currentDetentIndex = it.index
        sheetDialog.setupDimmedBackground(it.index)

        // Dispatch onDetentChange event
        dispatchEvent(TrueSheetEvent.DETENT_CHANGE, detentInfoData(it))
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
      sheetDialog.setStateForDetentIndex(currentDetentIndex)

      UiThreadUtil.runOnUiThread {
        sheetDialog.positionFooter()
      }
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

  fun setFooterHeight(height: Int) {
    if (sheetDialog.footerHeight == height) return

    sheetDialog.footerHeight = height
    configureIfShowing()
  }

  fun setDimmed(dimmed: Boolean) {
    if (sheetDialog.dimmed == dimmed) return

    sheetDialog.dimmed = dimmed
    if (sheetDialog.isShowing) {
      sheetDialog.setupDimmedBackground(currentDetentIndex)
    }
  }

  fun setDimmedIndex(index: Int) {
    if (sheetDialog.dimmedIndex == index) return

    sheetDialog.dimmedIndex = index
    if (sheetDialog.isShowing) {
      sheetDialog.setupDimmedBackground(currentDetentIndex)
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
    sheetDialog.window?.apply {
      this.setSoftInputMode(mode)
    }
  }

  fun setDismissible(dismissible: Boolean) {
    sheetDialog.dismissible = dismissible
  }

  fun setDetents(newDetents: Array<Any>) {
    sheetDialog.detents = newDetents
    configureIfShowing()
  }

  /**
   * Present the sheet at given detent index.
   */
  fun present(detentIndex: Int, promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    currentDetentIndex = detentIndex

    if (sheetDialog.isShowing) {
      // For consistency with IOS, we are not waiting
      // for the state to change before dispatching onDetentChange event.
      val detentInfo = sheetDialog.getDetentInfoForIndex(detentIndex)
      dispatchEvent(TrueSheetEvent.DETENT_CHANGE, detentInfoData(detentInfo))

      promiseCallback()
    } else {
      presentPromise = promiseCallback
    }

    sheetDialog.present(detentIndex)
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
