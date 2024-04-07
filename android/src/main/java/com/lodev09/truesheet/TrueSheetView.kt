package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.lodev09.truesheet.core.DismissEvent
import com.lodev09.truesheet.core.PresentEvent
import com.lodev09.truesheet.core.RootViewGroup
import com.lodev09.truesheet.core.SizeChangeEvent

class TrueSheetView(context: Context) :
  ViewGroup(context),
  LifecycleEventListener {
  private var eventDispatcher: EventDispatcher? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  private val surfaceId: Int
    get() = UIManagerHelper.getSurfaceId(this)

  /**
   * Current activeIndex.
   */
  private var activeIndex: Int = 0

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
   * The custom BottomSheetDialogBehavior instance.
   */
  private val sheetBehavior: TrueSheetBehavior

  /**
   * React root view placeholder.
   */
  private val sheetRootView: RootViewGroup

  /**
   * 1st child of the container view.
   */
  private var contentView: ViewGroup? = null

  /**
   * 2nd child of the container view.
   */
  private var footerView: ViewGroup? = null

  init {
    reactContext.addLifecycleEventListener(this)
    eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)

    sheetRootView = RootViewGroup(context)
    sheetRootView.eventDispatcher = eventDispatcher

    sheetBehavior = TrueSheetBehavior(reactContext)
    sheetDialog = TrueSheetDialog(reactContext, sheetBehavior, sheetRootView)

    // Configure Sheet Dialog
    sheetDialog.apply {
      // Setup listener when the dialog has been presented.
      setOnShowListener {
        registerKeyboardManager()
        sheetBehavior.state = sheetBehavior.getStateForSizeIndex(activeIndex)

        // Initialize footer y
        footerView?.apply {
          UiThreadUtil.runOnUiThread {
            y = (sheetBehavior.maxScreenHeight - sheetView.top - height).toFloat()
          }
        }

        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        // dispatch onPresent event
        eventDispatcher?.dispatchEvent(PresentEvent(surfaceId, id, sheetBehavior.getSizeInfoForIndex(activeIndex)))
      }

      // Setup listener when the dialog has been dismissed.
      setOnDismissListener {
        unregisterKeyboardManager()
        sheetBehavior.state = BottomSheetBehavior.STATE_HIDDEN

        dismissPromise?.let { promise ->
          promise()
          dismissPromise = null
        }

        // dispatch onDismiss event
        eventDispatcher?.dispatchEvent(DismissEvent(surfaceId, id))
      }
    }

    // Configure sheet behavior events
    sheetBehavior.apply {
      addBottomSheetCallback(
        object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onSlide(sheetView: View, slideOffset: Float) {
            footerView?.let {
              val y = (maxScreenHeight - sheetView.top - it.height).toFloat()
              if (slideOffset >= 0) {
                it.y = y
              } else {
                it.y = y - it.height * slideOffset
              }
            }
          }

          override fun onStateChanged(view: View, newState: Int) {
            when (newState) {
              BottomSheetBehavior.STATE_HIDDEN -> sheetDialog.dismiss()

              else -> {
                val sizeInfo = getSizeInfoForState(newState)
                if (sizeInfo != null && sizeInfo.index != activeIndex) {
                  // Invoke promise when sheet resized programmatically
                  presentPromise?.let { promise ->
                    promise()
                    presentPromise = null
                  }

                  activeIndex = sizeInfo.index

                  // dispatch onSizeChange event
                  eventDispatcher?.dispatchEvent(SizeChangeEvent(surfaceId, id, sizeInfo))
                }
              }
            }
          }
        }
      )
    }
  }

  override fun dispatchProvideStructure(structure: ViewStructure) {
    sheetRootView.dispatchProvideStructure(structure)
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

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    sheetDialog.dismiss()
  }

  override fun addView(child: View, index: Int) {
    // Hide this host view
    visibility = GONE

    (child as ViewGroup).let {
      // Container View's first child is the Content View
      contentView = it.getChildAt(0) as ViewGroup
      footerView = it.getChildAt(1) as ViewGroup

      sheetBehavior.contentView = contentView
      sheetBehavior.footerView = footerView

      // rootView's first child is the Container View
      sheetRootView.addView(it, index)
    }
  }

  override fun getChildCount(): Int {
    // This method may be called by the parent constructor
    // before rootView is initialized.
    return sheetRootView.childCount
  }

  override fun getChildAt(index: Int): View = sheetRootView.getChildAt(index)

  override fun removeView(child: View) {
    sheetRootView.removeView(child)
  }

  override fun removeViewAt(index: Int) {
    val child = getChildAt(index)
    sheetRootView.removeView(child)
  }

  override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the rootView which lives in the dialog
  }

  override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent): Boolean {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the rootView which lives in the dialog
    return false
  }

  override fun onHostResume() {
    // do nothing
  }

  override fun onHostPause() {
    // do nothing
  }

  override fun onHostDestroy() {
    // Drop the instance if the host is destroyed which will dismiss the dialog
    reactContext.removeLifecycleEventListener(this)
    sheetDialog.dismiss()
  }

  fun setMaxHeight(height: Int) {
    sheetBehavior.maxSheetHeight = height
    sheetBehavior.configure()
  }

  fun setDismissible(dismissible: Boolean) {
    sheetBehavior.isHideable = dismissible
    sheetDialog.setCancelable(dismissible)
  }

  fun setSizes(newSizes: Array<Any>) {
    sheetBehavior.sizes = newSizes
    sheetBehavior.configure()
  }

  /**
   * Present the sheet at given size index.
   */
  fun present(sizeIndex: Int, promiseCallback: () -> Unit) {
    if (!sheetDialog.isShowing) {
      activeIndex = sizeIndex
    }

    presentPromise = promiseCallback
    sheetDialog.show(sizeIndex)
  }

  /**
   * Dismisses the sheet.
   */
  fun dismiss(promiseCallback: () -> Unit) {
    dismissPromise = promiseCallback
    sheetDialog.dismiss()
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
