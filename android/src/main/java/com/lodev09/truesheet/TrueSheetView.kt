package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import android.widget.LinearLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.DismissEvent
import com.lodev09.truesheet.core.PresentEvent
import com.lodev09.truesheet.core.RootViewGroup
import com.lodev09.truesheet.core.SheetBehavior
import com.lodev09.truesheet.core.SizeChangeEvent
import com.lodev09.truesheet.utils.maxSize

class TrueSheetView(context: Context) : ViewGroup(context), LifecycleEventListener {
  private var eventDispatcher: EventDispatcher? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  private val surfaceId: Int
    get() = UIManagerHelper.getSurfaceId(this)

  private var sizeIndex: Int = 0
  private var sizes: Array<Any> = arrayOf("medium", "large")

  private var presentPromise: (() -> Unit)? = null
  private var dismissPromise: (() -> Unit)? = null

  private val sheetDialog: BottomSheetDialog
  private val sheetLayout: LinearLayout
  private val sheetRootView: RootViewGroup

  // 1st child of the container view
  private var contentView: ViewGroup? = null

  // 2nd child of the container view
  private var footerView: ViewGroup? = null

  private var sheetBehavior: SheetBehavior<ViewGroup>

  init {
    reactContext.addLifecycleEventListener(this)
    eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)

    sheetRootView = RootViewGroup(context)
    sheetRootView.eventDispatcher = eventDispatcher

    sheetDialog = BottomSheetDialog(context)
    sheetBehavior = SheetBehavior()
    sheetLayout = LinearLayout(context)

    // Configure Sheet events
    sheetBehavior.apply {
      maxSize = maxSize(context)
      addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(sheetView: View, slideOffset: Float) {
          footerView?.let {
            it.y = (sheetView.height - sheetView.top - it.height).toFloat()
          }
        }
        override fun onStateChanged(view: View, newState: Int) {
          val sizeInfo = getSizeInfoForState(sizes.size, newState)
          if (sizeInfo != null && sizeInfo.index != sizeIndex) {
            sizeIndex = sizeInfo.index

            // dispatch onSizeChange event
            eventDispatcher?.dispatchEvent(SizeChangeEvent(surfaceId, id, sizeInfo))
          }

          when (newState) {
            BottomSheetBehavior.STATE_HIDDEN -> {
              sheetDialog.dismiss()
            }
            BottomSheetBehavior.STATE_COLLAPSED -> {}
            BottomSheetBehavior.STATE_DRAGGING -> {}
            BottomSheetBehavior.STATE_EXPANDED -> {}
            BottomSheetBehavior.STATE_HALF_EXPANDED -> {}
            BottomSheetBehavior.STATE_SETTLING -> {}
          }
        }
      })
    }

    // Configure the sheet layout
    sheetLayout.apply {
      addView(sheetRootView)
      sheetDialog.setContentView(this)

      val layoutParent = parent as ViewGroup
      (layoutParent.layoutParams as CoordinatorLayout.LayoutParams).behavior = sheetBehavior
    }

    // Configure Sheet Dialog
    sheetDialog.apply {
      setOnShowListener {
        UiThreadUtil.runOnUiThread {
          footerView?.let {
            val sheetView = sheetLayout.parent as ViewGroup
            it.y = (sheetView.height - sheetView.top - it.height).toFloat()
          }
        }

        presentPromise?.invoke()
        presentPromise = null

        // dispatch onPresent event
        eventDispatcher?.dispatchEvent(PresentEvent(surfaceId, id))
      }

      setOnDismissListener {
        dismissPromise?.invoke()
        dismissPromise = null

        // dispatch onDismiss event
        eventDispatcher?.dispatchEvent(DismissEvent(surfaceId, id))
      }
    }
  }

  override fun dispatchProvideStructure(structure: ViewStructure) {
    sheetRootView.dispatchProvideStructure(structure)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
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

  override fun getChildAt(index: Int): View {
    return sheetRootView.getChildAt(index)
  }

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

  fun setSizes(newSizes: Array<Any>) {
    sizes = newSizes
    sheetBehavior.configure(sizes)
  }

  fun present(index: Int, promiseCallback: () -> Unit) {
    sheetBehavior.setStateForSizeIndex(sizes.size, index)

    if (sheetDialog.isShowing) {
      promiseCallback()
    } else {
      sheetBehavior.configure(sizes)
      presentPromise = promiseCallback
      sheetDialog.show()
    }
  }

  fun dismiss(promiseCallback: () -> Unit) {
    dismissPromise = promiseCallback
    sheetDialog.dismiss()
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}

