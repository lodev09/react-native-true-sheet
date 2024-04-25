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
import com.lodev09.truesheet.core.RootSheetView
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
  private val sheetContainer: TrueSheetContainer

  /**
   * React root view placeholder.
   */
  private val rootSheetView: RootSheetView

  /**
   * 2nd child of the container view.
   */
  private var footerView: ViewGroup? = null

  init {
    reactContext.addLifecycleEventListener(this)
    eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)

    rootSheetView = RootSheetView(context)
    rootSheetView.eventDispatcher = eventDispatcher

    sheetContainer = TrueSheetContainer(reactContext, rootSheetView)

    // Configure Sheet Dialog
    sheetContainer.apply {
      // Setup listener when the dialog has been presented.
      onShowListener = {
        registerKeyboardManager()

        // Initialize footer y
        UiThreadUtil.runOnUiThread {
          positionFooter()
        }

        presentPromise?.let { promise ->
          promise()
          presentPromise = null
        }

        // dispatch onPresent event
        eventDispatcher?.dispatchEvent(PresentEvent(surfaceId, id, getSizeInfoForIndex(activeIndex)))
      }

      // Setup listener when the dialog has been dismissed.
      onDismissListener = {
        unregisterKeyboardManager()

        dismissPromise?.let { promise ->
          promise()
          dismissPromise = null
        }

        // dispatch onDismiss event
        eventDispatcher?.dispatchEvent(DismissEvent(surfaceId, id))
      }

      // Configure sheet behavior events
      bottomSheetCallback = object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(sheetView: View, slideOffset: Float) {
          footerView?.let {
            val y = (maxScreenHeight - sheetView.top - footerHeight).toFloat()
            if (slideOffset >= 0) {
              it.y = y
            } else {
              it.y = y - footerHeight * slideOffset
            }
          }
        }

        override fun onStateChanged(view: View, newState: Int) {
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

      // Finally setup content
      setup()
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

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    sheetContainer.dismiss()
  }

  override fun addView(child: View, index: Int) {
    // Hide this host view
    visibility = GONE

    (child as ViewGroup).let {
      // Container View's first child is the Content View
      footerView = it.getChildAt(1) as ViewGroup

      sheetContainer.footerView = footerView

      // rootView's first child is the Container View
      rootSheetView.addView(it, index)
    }
  }

  override fun getChildCount(): Int {
    // This method may be called by the parent constructor
    // before rootView is initialized.
    return rootSheetView.childCount
  }

  override fun getChildAt(index: Int): View = rootSheetView.getChildAt(index)

  override fun removeView(child: View) {
    rootSheetView.removeView(child)
  }

  override fun removeViewAt(index: Int) {
    val child = getChildAt(index)
    rootSheetView.removeView(child)
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
    sheetContainer.dismiss()
  }

  private fun configureIfShowing() {
    if (sheetContainer.isShowing) {
      sheetContainer.configure()
      sheetContainer.positionFooter()
    }
  }

  fun setMaxHeight(height: Int) {
    sheetContainer.maxSheetHeight = height
    configureIfShowing()
  }

  fun setContentHeight(height: Int) {
    sheetContainer.contentHeight = height
    configureIfShowing()
  }

  fun setFooterHeight(height: Int) {
    sheetContainer.footerHeight = height
    configureIfShowing()
  }

  fun setDismissible(dismissible: Boolean) {
    sheetContainer.setDismissible(dismissible)
  }

  fun setDimmed(dimmed: Boolean) {
    if (sheetContainer.dimmed != dimmed) {
      sheetContainer.dimmed = dimmed
      sheetContainer.setup()
    }
  }

  fun setSizes(newSizes: Array<Any>) {
    sheetContainer.sizes = newSizes
    configureIfShowing()
  }

  /**
   * Present the sheet at given size index.
   */
  fun present(sizeIndex: Int, promiseCallback: () -> Unit) {
    if (!sheetContainer.isShowing) {
      activeIndex = sizeIndex
    }

    presentPromise = promiseCallback
    sheetContainer.show(sizeIndex)
  }

  /**
   * Dismisses the sheet.
   */
  fun dismiss(promiseCallback: () -> Unit) {
    dismissPromise = promiseCallback
    sheetContainer.dismiss()
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
