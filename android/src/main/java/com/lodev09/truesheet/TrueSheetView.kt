package com.lodev09.truesheet

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog

class TrueSheetView(context: Context) : ViewGroup(context), LifecycleEventListener {
  private val sheetRootView: TrueSheetRootViewGroup?
  private var sheetDialog: BottomSheetDialog?

  private lateinit var sheetBehavior: BottomSheetBehavior<*>

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    reactContext.addLifecycleEventListener(this)
    sheetRootView = TrueSheetRootViewGroup(context)
    sheetDialog = BottomSheetDialog(context)
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
    val frameLayout = FrameLayout(context)
    frameLayout.addView(sheetRootView)

    sheetDialog?.setContentView(frameLayout)

    sheetBehavior = BottomSheetBehavior.from(frameLayout.parent as View).apply {
      addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(bottomSheet: View, slideOffset: Float) = Unit
        override fun onStateChanged(bottomSheet: View, newState: Int) {
          // TODO
        }
      })

      // virtually disables 'third' breakpoint
      isFitToContents = true
      isHideable = true
      // skipCollapsed = true
      peekHeight = height
    }
  }

  fun present() {
    sheetDialog?.show()
  }

  fun dismiss() {
    sheetDialog?.dismiss()
  }

  companion object {
    const val NAME = "TrueSheetView"
  }
}

