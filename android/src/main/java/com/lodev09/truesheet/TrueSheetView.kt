package com.lodev09.truesheet

import android.content.Context
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import android.widget.RelativeLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog

class TrueSheetView : ViewGroup, LifecycleEventListener {
  constructor(context: Context) : super(context)
  constructor(context: Context, attrs: AttributeSet) : super(context, attrs)
  constructor(context: Context, attrs: AttributeSet, defStyleAttr: Int) : super(context, attrs, defStyleAttr)

  private val sheetRootView: TrueSheetRootViewGroup?
  private var sheetDialog: BottomSheetDialog?

  private lateinit var sheetBehavior: TrueSheetBottomSheetBehavior<ViewGroup>

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    reactContext.addLifecycleEventListener(this)
    sheetRootView = TrueSheetRootViewGroup(context)
    sheetDialog = BottomSheetDialog(context)
    sheetBehavior = TrueSheetBottomSheetBehavior()
  }

  override fun dispatchProvideStructure(structure: ViewStructure) {
    sheetRootView?.dispatchProvideStructure(structure)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // Do nothing as we are laid out by UIManager
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    dismiss()
  }

  override fun addView(child: View, index: Int) {
    // Hide this host view
    visibility = GONE

    sheetRootView?.addView(child, index)

    UiThreadUtil.runOnUiThread {
      try {
        val manager = UIManagerHelper.getUIManagerForReactTag(reactContext, child.id)
        val view = manager?.resolveView(child.id)
        if (view != null) {
          setupSheetDialog(view.height)
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  override fun getChildCount(): Int {
    // This method may be called by the parent constructor
    // before rootView is initialized.
    return sheetRootView?.childCount ?: 0
  }

  override fun getChildAt(index: Int): View {
    return sheetRootView!!.getChildAt(index)
  }

  override fun removeView(child: View) {
    sheetRootView?.removeView(child)
  }

  override fun removeViewAt(index: Int) {
    val child = getChildAt(index)
    sheetRootView?.removeView(child)
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

  fun onDropInstance() {
    reactContext.removeLifecycleEventListener(this)
    dismiss()
  }

  fun setEventDispatcher(eventDispatcher: EventDispatcher) {
    sheetRootView?.setEventDispatcher(eventDispatcher)
  }

  override fun onHostResume() {
    // do nothing
  }

  override fun onHostPause() {
    // do nothing
  }

  override fun onHostDestroy() {
    // Drop the instance if the host is destroyed which will dismiss the dialog
    onDropInstance()
  }

  private fun setupSheetDialog(height: Int) {
    val layout = RelativeLayout(context)
    layout.addView(sheetRootView)

    sheetDialog?.setContentView(layout)

    val viewGroup = layout.parent as ViewGroup
    val params = viewGroup.layoutParams as CoordinatorLayout.LayoutParams

    sheetBehavior.apply {
      addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(bottomSheet: View, slideOffset: Float) { }
        override fun onStateChanged(bottomSheet: View, newState: Int) {
          when (newState) {
            BottomSheetBehavior.STATE_HIDDEN -> {
              dismiss()
            }
            BottomSheetBehavior.STATE_COLLAPSED -> {}
            BottomSheetBehavior.STATE_DRAGGING -> {}
            BottomSheetBehavior.STATE_EXPANDED -> {}
            BottomSheetBehavior.STATE_HALF_EXPANDED -> {}
            BottomSheetBehavior.STATE_SETTLING -> {}
          }
        }
      })

      isFitToContents = false
      halfExpandedRatio = 0.8f
      isHideable = true

      Log.d(TAG, height.toString())

      // TODO: Account for ScrollView content
      peekHeight = 1652 // height
    }

     params.behavior = sheetBehavior
  }

  fun present() {
    sheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
    sheetDialog?.show()
  }

  fun dismiss() {
    sheetDialog?.dismiss()
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}

