package com.lodev09.truesheet

import android.content.Context
import android.view.View
import androidx.annotation.UiThread
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lodev09.truesheet.events.*
import com.lodev09.truesheet.utils.PixelUtils

/**
 * Container view that manages the bottom sheet dialog and holds content and footer views.
 * Similar to iOS TrueSheetContainerView, this handles the actual sheet presentation logic.
 */
class TrueSheetContainerView(context: Context) : ReactViewGroup(context) {

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  /**
   * Reference to the parent TrueSheetView (host view)
   */
  var sheetView: TrueSheetView? = null
    private set

  /**
   * The main BottomSheetDialog instance
   */
  private var sheetDialog: TrueSheetDialog? = null

  /**
   * React root view wrapper - this is what gets set as the dialog content
   */
  private var rootSheetView: TrueSheetRootView? = null

  /**
   * Determines if the sheet is being dragged by the user
   */
  private var isDragging = false

  /**
   * Current active detent index
   */
  private var currentDetentIndex: Int = -1

  /**
   * Promise callback to be invoked after `present` is called
   */
  private var presentPromise: (() -> Unit)? = null

  /**
   * Promise callback to be invoked after `dismiss` is called
   */
  private var dismissPromise: (() -> Unit)? = null

  /**
   * Reference to content view (first child)
   */
  val contentView: TrueSheetContentView?
    get() = if (childCount > 0 && getChildAt(0) is TrueSheetContentView) {
      getChildAt(0) as TrueSheetContentView
    } else {
      null
    }

  /**
   * Reference to footer view (second child)
   */
  val footerView: TrueSheetFooterView?
    get() = if (childCount > 1 && getChildAt(1) is TrueSheetFooterView) {
      getChildAt(1) as TrueSheetFooterView
    } else {
      null
    }

  /**
   * The content view height
   */
  val contentHeight: Int
    get() = contentView?.height ?: 0

  /**
   * The footer view height
   */
  val footerHeight: Int
    get() = footerView?.height ?: 0

  /**
   * Check if sheet is currently showing
   */
  val isShowing: Boolean
    get() = sheetDialog?.isShowing == true

  private val surfaceId: Int
    get() = UIManagerHelper.getSurfaceId(sheetView ?: this)

  private val viewId: Int
    get() = sheetView?.id ?: id

  var eventDispatcher: EventDispatcher? = null
  var stateWrapper: StateWrapper? = null

  init {
    // Container should not clip children to allow footer to position absolutely
    clipChildren = false
    clipToPadding = false
  }

  /**
   * Setup this container in the parent sheet view.
   * Called when container is mounted as a child of TrueSheetView.
   */
  fun setupInSheetView(sheetView: TrueSheetView) {
    this.sheetView = sheetView

    // Initialize dialog
    rootSheetView = TrueSheetRootView(context)
    rootSheetView?.id = sheetView.id
    rootSheetView?.eventDispatcher = eventDispatcher
    rootSheetView?.stateWrapper = stateWrapper

    sheetDialog = TrueSheetDialog(reactContext, rootSheetView!!, this)

    // Configure Sheet Dialog
    sheetDialog?.apply {
      // Setup listener when the dialog has been presented
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
        val detentInfo = getDetentInfoForIndexWithPosition(currentDetentIndex)
        eventDispatcher?.dispatchEvent(
          DidPresentEvent(surfaceId, viewId, detentInfo.index, detentInfo.position)
        )
      }

      // Setup listener when the dialog is about to be dismissed
      setOnCancelListener {
        // Dispatch onWillDismiss event
        eventDispatcher?.dispatchEvent(WillDismissEvent(surfaceId, viewId))
      }

      // Setup listener when the dialog has been dismissed
      setOnDismissListener {
        unregisterKeyboardManager()

        // Resolve the dismiss promise
        dismissPromise?.let { promise ->
          promise()
          dismissPromise = null
        }

        // Dispatch onDidDismiss event
        eventDispatcher?.dispatchEvent(DidDismissEvent(surfaceId, viewId))
      }

      // Configure sheet behavior events
      behavior.addBottomSheetCallback(
        object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onSlide(sheetView: View, slideOffset: Float) {
            when (behavior.state) {
              // For consistency with iOS, we consider SETTLING as dragging change
              BottomSheetBehavior.STATE_DRAGGING,
              BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

              else -> { }
            }

            // Emit position change event continuously during slide
            val detentInfo = getCurrentDetentInfo(sheetView)
            eventDispatcher?.dispatchEvent(
              PositionChangeEvent(surfaceId, viewId, detentInfo.index, detentInfo.position, isDragging)
            )

            // Update footer position during slide
            footerView?.let { footer ->
              val footerHeight = this@TrueSheetContainerView.footerHeight
              val y = (maxScreenHeight - sheetView.top - footerHeight).toFloat()

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

    // Move this container's children to the root sheet view
    while (childCount > 0) {
      val child = getChildAt(0)
      removeViewAt(0)
      rootSheetView?.addView(child)
    }

    // Handle initial presentation if needed
    sheetView.initialDetentIndex.takeIf { it >= 0 }?.let { index ->
      currentDetentIndex = index
      sheetDialog?.present(index, sheetView.initialDetentAnimated)
    }
  }

  /**
   * Cleanup when container is unmounted
   */
  fun cleanup() {
    sheetDialog?.dismiss()
    sheetDialog = null
    rootSheetView = null
    sheetView = null
  }

  override fun addView(child: View?, index: Int) {
    // Forward children to root sheet view if dialog is initialized
    rootSheetView?.let {
      it.addView(child, index)
    } ?: super.addView(child, index)
  }

  override fun getChildCount(): Int = rootSheetView?.childCount ?: super.getChildCount()

  override fun getChildAt(index: Int): View? = rootSheetView?.getChildAt(index) ?: super.getChildAt(index)

  override fun removeView(child: View?) {
    rootSheetView?.removeView(child) ?: super.removeView(child)
  }

  override fun removeViewAt(index: Int) {
    rootSheetView?.removeViewAt(index) ?: super.removeViewAt(index)
  }

  private fun getCurrentDetentInfo(sheetView: View): DetentInfo {
    val position = PixelUtils.toDIP(sheetView.top.toFloat())
    return DetentInfo(currentDetentIndex, position)
  }

  private fun handleDragBegin(sheetView: View) {
    // Dispatch drag started event
    val detentInfo = getCurrentDetentInfo(sheetView)
    eventDispatcher?.dispatchEvent(
      DragBeginEvent(surfaceId, viewId, detentInfo.index, detentInfo.position)
    )
    // Flag sheet is being dragged
    isDragging = true
  }

  private fun handleDragChange(sheetView: View) {
    if (!isDragging) return

    // Dispatch drag change event
    val detentInfo = getCurrentDetentInfo(sheetView)
    eventDispatcher?.dispatchEvent(
      DragChangeEvent(surfaceId, viewId, detentInfo.index, detentInfo.position)
    )
  }

  private fun handleDragEnd(state: Int) {
    if (!isDragging) return

    // For consistency with iOS,
    // we only handle state changes after dragging.
    //
    // Changing detent programmatically is handled via the present method.
    val detentInfo = sheetDialog?.getDetentInfoForState(state)
    detentInfo?.let {
      // Dispatch drag ended after dragging
      eventDispatcher?.dispatchEvent(
        DragEndEvent(surfaceId, viewId, it.index, it.position)
      )

      if (it.index != currentDetentIndex) {
        // Invoke promise when sheet resized programmatically
        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        currentDetentIndex = it.index
        sheetDialog?.setupDimmedBackground(it.index)

        // Dispatch onDetentChange event
        eventDispatcher?.dispatchEvent(
          DetentChangeEvent(surfaceId, viewId, it.index, it.position)
        )
      }
    }

    isDragging = false
  }

  fun configureIfShowing() {
    if (sheetDialog?.isShowing == true) {
      sheetDialog?.configure()
      sheetDialog?.setStateForDetentIndex(currentDetentIndex)

      UiThreadUtil.runOnUiThread {
        sheetDialog?.positionFooter()
      }
    }
  }

  // ==================== Dialog Configuration Methods ====================

  fun applyPropsFromSheetView() {
    // Called when props are updated on the sheet view
    configureIfShowing()
  }

  fun setEdgeToEdge(edgeToEdge: Boolean) {
    sheetDialog?.edgeToEdge = edgeToEdge
  }

  fun setMaxHeight(height: Int) {
    if (sheetDialog?.maxSheetHeight == height) return

    sheetDialog?.maxSheetHeight = height
    configureIfShowing()
  }

  fun setDimmed(dimmed: Boolean) {
    if (sheetDialog?.dimmed == dimmed) return

    sheetDialog?.dimmed = dimmed
    if (isShowing) {
      sheetDialog?.setupDimmedBackground(currentDetentIndex)
    }
  }

  fun setDimmedIndex(index: Int) {
    if (sheetDialog?.dimmedIndex == index) return

    sheetDialog?.dimmedIndex = index
    if (isShowing) {
      sheetDialog?.setupDimmedBackground(currentDetentIndex)
    }
  }

  fun setCornerRadius(radius: Float) {
    if (sheetDialog?.cornerRadius == radius) return

    sheetDialog?.cornerRadius = radius
    sheetDialog?.setupBackground()
  }

  fun setBackground(color: Int) {
    if (sheetDialog?.backgroundColor == color) return

    sheetDialog?.backgroundColor = color
    sheetDialog?.setupBackground()
  }

  fun setSoftInputMode(mode: Int) {
    sheetDialog?.window?.setSoftInputMode(mode)
  }

  fun setDismissible(dismissible: Boolean) {
    sheetDialog?.dismissible = dismissible
  }

  fun setDetents(newDetents: Array<Any>) {
    sheetDialog?.detents = newDetents
    configureIfShowing()
  }

  /**
   * Present the sheet at given detent index
   */
  @UiThread
  fun present(detentIndex: Int, promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    currentDetentIndex = detentIndex

    if (isShowing) {
      // For consistency with iOS, we are not waiting
      // for the state to change before dispatching onDetentChange event
      val detentInfo = sheetDialog?.getDetentInfoForIndexWithPosition(detentIndex)
      detentInfo?.let {
        eventDispatcher?.dispatchEvent(
          DetentChangeEvent(surfaceId, viewId, it.index, it.position)
        )
      }

      promiseCallback()
    } else {
      presentPromise = promiseCallback
      // Dispatch onWillPresent event before showing with detent info
      val detentInfo = sheetDialog?.getDetentInfoForIndex(detentIndex)
      detentInfo?.let {
        eventDispatcher?.dispatchEvent(
          WillPresentEvent(surfaceId, viewId, it.index, it.position)
        )
      }
    }

    sheetDialog?.present(detentIndex)
  }

  /**
   * Dismisses the sheet
   */
  @UiThread
  fun dismiss(promiseCallback: () -> Unit) {
    UiThreadUtil.assertOnUiThread()

    dismissPromise = promiseCallback
    sheetDialog?.dismiss()
  }

  // Helper methods that delegate to dialog
  private fun getDetentInfoForIndexWithPosition(index: Int): DetentInfo {
    return sheetDialog?.getDetentInfoForIndexWithPosition(index) ?: DetentInfo(0, 0f)
  }
}