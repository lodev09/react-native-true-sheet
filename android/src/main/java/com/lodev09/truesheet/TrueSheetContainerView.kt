package com.lodev09.truesheet

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
 * Container view that manages the bottom sheet content and holds content and footer views.
 * The dialog is passed from TrueSheetView and persists across container lifecycle.
 */
class TrueSheetContainerView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {

  /**
   * Reference to the parent TrueSheetView (host view)
   */
  var sheetView: TrueSheetView? = null
    private set

  /**
   * The main BottomSheetDialog instance - passed from TrueSheetView
   */
  private var sheetDialog: TrueSheetDialog? = null

  /**
   * Determines if the sheet is being dragged by the user
   */
  private var isDragging = false

  /**
   * Current active detent index
   */
  var currentDetentIndex: Int = -1
    private set

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
  private val isShowing: Boolean
    get() = sheetDialog?.isShowing == true

  private val surfaceId: Int
    get() = UIManagerHelper.getSurfaceId(sheetView ?: this)

  private val viewId: Int
    get() = sheetView?.id ?: id

  var eventDispatcher: EventDispatcher? = null
  
  init {
    // Container should not clip children to allow footer to position absolutely
    clipChildren = false
    clipToPadding = false
  }

  /**
   * Setup this container in the parent sheet view with the provided dialog.
   * Called when container is created.
   */
  fun setupInSheetView(sheetView: TrueSheetView, dialog: TrueSheetDialog) {
    this.sheetView = sheetView
    this.sheetDialog = dialog

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
              PositionChangeEvent(surfaceId, viewId, detentInfo.index, detentInfo.position)
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
            // Handle STATE_HIDDEN before checking isShowing
            // This ensures we can dismiss even if dialog state gets out of sync
            if (newState == BottomSheetBehavior.STATE_HIDDEN) {
              sheetDialog?.dismiss()
              return
            }

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
      // Resize to new detent when already showing
      sheetDialog?.setStateForDetentIndex(detentIndex)
    } else {
      presentPromise = promiseCallback
      // Dispatch onWillPresent event before showing with detent info
      val detentInfo = sheetDialog?.getDetentInfoForIndex(detentIndex)
      detentInfo?.let {
        eventDispatcher?.dispatchEvent(
          WillPresentEvent(surfaceId, viewId, it.index, it.position)
        )
      }
      // Present the sheet - configure is called inside present()
      sheetDialog?.present(detentIndex)
    }
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
  private fun getDetentInfoForIndexWithPosition(index: Int): DetentInfo =
    sheetDialog?.getDetentInfoForIndexWithPosition(index) ?: DetentInfo(0, 0f)
}
