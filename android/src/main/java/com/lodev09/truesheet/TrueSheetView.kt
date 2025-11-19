package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lodev09.truesheet.core.Utils
import com.lodev09.truesheet.events.*

/**
 * Main TrueSheet view component for Fabric architecture
 * Manages the bottom sheet dialog and contains TrueSheetContainerView
 */
class TrueSheetView(context: Context) :
  ViewGroup(context),
  LifecycleEventListener {

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  private val surfaceId: Int
    get() = UIManagerHelper.getSurfaceId(this)

  private var eventDispatcher: EventDispatcher? = null

  var initialIndex: Int = -1
  var initialIndexAnimated: Boolean = true

  /**
   * Determines if the sheet is being dragged by the user.
   */
  private var isDragging = false

  /**
   * Current active detent index.
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
   * Container view (first child) that holds content and footer
   */
  val containerView: TrueSheetContainerView?
    get() = if (childCount > 0 && getChildAt(0) is TrueSheetContainerView) {
      getChildAt(0) as TrueSheetContainerView
    } else {
      null
    }

  init {
    reactContext.addLifecycleEventListener(this)

    sheetDialog = TrueSheetDialog(reactContext, this)

    // Configure Sheet Dialog
    sheetDialog.apply {
      // Setup listener when the dialog has been presented.
      setOnShowListener {
        registerKeyboardManager()

        // Initialize footer position
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

        // Dispatch onDidPresent event with detent info
        val detentInfo = sheetDialog.getDetentInfoForIndexWithPosition(currentDetentIndex)
        eventDispatcher?.dispatchEvent(
          DidPresentEvent(surfaceId, id, detentInfo.index, detentInfo.position)
        )
      }

      // Setup listener when the dialog is about to be dismissed.
      setOnCancelListener {
        // Dispatch onWillDismiss event
        eventDispatcher?.dispatchEvent(WillDismissEvent(surfaceId, id))
      }

      // Setup listener when the dialog has been dismissed.
      setOnDismissListener {
        unregisterKeyboardManager()

        // Resolve the dismiss promise
        dismissPromise?.let { promise ->
          promise()
          dismissPromise = null
        }

        // Dispatch onDidDismiss event
        eventDispatcher?.dispatchEvent(DidDismissEvent(surfaceId, id))
      }

      // Configure sheet behavior events
      behavior.addBottomSheetCallback(
        object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onSlide(sheetView: View, slideOffset: Float) {
            when (behavior.state) {
              // For consistency with iOS, we consider SETTLING as dragging change.
              BottomSheetBehavior.STATE_DRAGGING,
              BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

              else -> { }
            }

            // Emit position change event continuously during slide
            val detentInfo = getCurrentDetentInfo(sheetView)
            eventDispatcher?.dispatchEvent(
              PositionChangeEvent(surfaceId, id, detentInfo.index, detentInfo.position, isDragging)
            )

            // Update footer position during slide
            containerView?.footerView?.let { footer ->
              val footerHeight = containerView?.getFooterHeight() ?: 0
              val y = (sheetDialog.maxScreenHeight - sheetView.top - footerHeight).toFloat()

              if (slideOffset >= 0) {
                // Sheet is expanding
                footer.y = y
              } else {
                // Sheet is collapsing
                footer.y = y - footerHeight * slideOffset
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

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int
  ) {
    // Layout the container view if it exists
    containerView?.let { container ->
      container.layout(0, 0, r - l, container.measuredHeight)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    var height = 0

    // Measure container view
    containerView?.let { container ->
      measureChild(
        container,
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      )
      height = container.measuredHeight
    }

    setMeasuredDimension(width, height)
  }

  override fun setId(id: Int) {
    super.setId(id)

    // Register this view with the module for ref-based access
    TrueSheetModule.registerView(this, id)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    // Get event dispatcher
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
    eventDispatcher = dispatcher

    // Initialize after layout
    post {
      if (initialIndex >= 0) {
        currentDetentIndex = initialIndex
        sheetDialog.present(initialIndex, initialIndexAnimated)
      }

      // Dispatch onMount event
      eventDispatcher?.dispatchEvent(MountEvent(surfaceId, id))
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
      measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      )
      layout(left, top, right, bottom)

      // Reconfigure sheet if showing
      configureIfShowing()
    }
  }

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
    sheetDialog.dismiss()
  }

  private fun getCurrentDetentInfo(sheetView: View): DetentInfo {
    val position = Utils.toDIP(sheetView.top.toFloat())
    return DetentInfo(currentDetentIndex, position)
  }

  private fun handleDragBegin(sheetView: View) {
    // Dispatch drag started event
    val detentInfo = getCurrentDetentInfo(sheetView)
    eventDispatcher?.dispatchEvent(
      DragBeginEvent(surfaceId, id, detentInfo.index, detentInfo.position)
    )
    // Flag sheet is being dragged
    isDragging = true
  }

  private fun handleDragChange(sheetView: View) {
    if (!isDragging) return

    // Dispatch drag change event
    val detentInfo = getCurrentDetentInfo(sheetView)
    eventDispatcher?.dispatchEvent(
      DragChangeEvent(surfaceId, id, detentInfo.index, detentInfo.position)
    )
  }

  private fun handleDragEnd(state: Int) {
    if (!isDragging) return

    // For consistency with iOS,
    // we only handle state changes after dragging.
    //
    // Changing detent programmatically is handled via the present method.
    val detentInfo = sheetDialog.getDetentInfoForState(state)
    detentInfo?.let {
      // Dispatch drag ended after dragging
      eventDispatcher?.dispatchEvent(
        DragEndEvent(surfaceId, id, it.index, it.position)
      )
      
      if (it.index != currentDetentIndex) {
        // Invoke promise when sheet resized programmatically
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        currentDetentIndex = it.index
        sheetDialog.setupDimmedBackground(it.index)

        // Dispatch onDetentChange event
        eventDispatcher?.dispatchEvent(
          DetentChangeEvent(surfaceId, id, it.index, it.position)
        )
      }
    }

    isDragging = false
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

  // ==================== Property Setters ====================

  fun setEdgeToEdge(edgeToEdge: Boolean) {
    sheetDialog.edgeToEdge = edgeToEdge
  }

  fun setMaxHeight(height: Int) {
    if (sheetDialog.maxSheetHeight == height) return

    sheetDialog.maxSheetHeight = height
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
    sheetDialog.window?.setSoftInputMode(mode)
  }

  fun setDismissible(dismissible: Boolean) {
    sheetDialog.dismissible = dismissible
  }

  fun setGrabber(grabber: Boolean) {
    // Note: Android Material Bottom Sheet doesn't have a built-in grabber
    // This would need custom implementation if required
    // For now, we accept the prop but don't implement it
  }

  fun setDetents(newDetents: Array<Any>) {
    sheetDialog.detents = newDetents
    configureIfShowing()
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

    currentDetentIndex = detentIndex

    if (sheetDialog.isShowing) {
      // For consistency with iOS, we are not waiting
      // for the state to change before dispatching onDetentChange event.
      val detentInfo = sheetDialog.getDetentInfoForIndexWithPosition(detentIndex)
      eventDispatcher?.dispatchEvent(
        DetentChangeEvent(surfaceId, id, detentInfo.index, detentInfo.position)
      )

      promiseCallback()
    } else {
      presentPromise = promiseCallback
      // Dispatch onWillPresent event before showing with detent info
      val detentInfo = sheetDialog.getDetentInfoForIndex(detentIndex)
      eventDispatcher?.dispatchEvent(
        WillPresentEvent(surfaceId, id, detentInfo.index, detentInfo.position)
      )
    }

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

    dismissPromise = promiseCallback
    sheetDialog.dismiss()
  }
}
