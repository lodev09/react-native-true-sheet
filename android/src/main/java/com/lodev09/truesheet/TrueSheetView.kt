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
import com.lodev09.truesheet.core.RootSheetView
import com.lodev09.truesheet.events.DismissEvent
import com.lodev09.truesheet.events.MountEvent
import com.lodev09.truesheet.events.PresentEvent
import com.lodev09.truesheet.events.SizeChangeEvent

class TrueSheetView(context: Context) :
  ViewGroup(context),
  LifecycleEventListener {
  private var eventDispatcher: EventDispatcher? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  private val surfaceId: Int
    get() = UIManagerHelper.getSurfaceId(this)

  var initialIndex: Int = -1
  var initialIndexAnimated: Boolean = true

  /**
   * Current activeIndex.
   */
  private var currentSizeIndex: Int = 0

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
    eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)

    rootSheetView = RootSheetView(context)
    rootSheetView.eventDispatcher = eventDispatcher

    sheetDialog = TrueSheetDialog(reactContext, rootSheetView)

    // Configure Sheet Dialog
    sheetDialog.apply {
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
        eventDispatcher?.dispatchEvent(PresentEvent(surfaceId, id, sheetDialog.getSizeInfoForIndex(currentSizeIndex)))
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
        eventDispatcher?.dispatchEvent(DismissEvent(surfaceId, id))
      }

      // Configure sheet behavior events
      behavior.addBottomSheetCallback(
        object : BottomSheetBehavior.BottomSheetCallback() {
          override fun onSlide(sheetView: View, slideOffset: Float) {
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

          override fun onStateChanged(view: View, newState: Int) {
            if (!isShowing) return

            val sizeInfo = getSizeInfoForState(newState)
            if (sizeInfo == null || sizeInfo.index == currentSizeIndex) return

            // Invoke promise when sheet resized programmatically
            presentPromise?.let { promise ->
              promise()
              presentPromise = null
            }

            currentSizeIndex = sizeInfo.index
            setupDimmedBackground(sizeInfo.index)

            // Dispatch onSizeChange event
            eventDispatcher?.dispatchEvent(SizeChangeEvent(surfaceId, id, sizeInfo))
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

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    sheetDialog.dismiss()
  }

  override fun addView(child: View, index: Int) {
    // Hide this host view
    visibility = GONE

    (child as ViewGroup).let {
      // rootView's first child is the Container View
      rootSheetView.addView(it, index)

      // Initialize content
      UiThreadUtil.runOnUiThread {
        // 1st child is the content view
        val contentView = it.getChildAt(0) as ViewGroup
        setContentHeight(contentView.height)

        // 2nd child is the footer view
        val footerView = it.getChildAt(1) as ViewGroup
        sheetDialog.footerView = footerView
        setFooterHeight(footerView.height)

        if (initialIndex >= 0) {
          currentSizeIndex = initialIndex
          sheetDialog.present(initialIndex, initialIndexAnimated)
        }

        // Dispatch onMount event
        eventDispatcher?.dispatchEvent(MountEvent(surfaceId, id))
      }
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
    sheetDialog.dismiss()
  }

  private fun configureIfShowing() {
    if (sheetDialog.isShowing) {
      sheetDialog.configure()
      sheetDialog.positionFooter()
    }
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
    if (!sheetDialog.isShowing) {
      currentSizeIndex = sizeIndex
    }

    presentPromise = promiseCallback
    sheetDialog.present(sizeIndex)
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
