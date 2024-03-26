package com.lodev09.truesheet

import android.content.Context
import android.content.DialogInterface.OnDismissListener
import android.content.DialogInterface.OnShowListener
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetDialog

open class TrueSheetView(context: Context) : ViewGroup(context), LifecycleEventListener {
  // This listener is called when the user presses KeyEvent.KEYCODE_BACK
  // An event is then passed to JS which can either close or not close the Modal by setting the
  // visible property

  private val rootView: TrueSheetRootViewGroup?

  private var sheetDialog: BottomSheetDialog? = null
  private var onShowListener: OnShowListener? = null
  private var onDismissListener: OnDismissListener? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    reactContext.addLifecycleEventListener(this)
    rootView = TrueSheetRootViewGroup(context)
  }

  private fun destroyDialog() {
    sheetDialog = null

    // We need to remove the mHostView from the parent
    // It is possible we are dismissing this dialog and reattaching the hostView to another
    val parent = rootView!!.parent as ViewGroup
    parent.removeViewAt(0)
  }

  override fun dispatchProvideStructure(structure: ViewStructure) {
    rootView!!.dispatchProvideStructure(structure)
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

    UiThreadUtil.assertOnUiThread()
    rootView!!.addView(child, index)
  }

  override fun getChildCount(): Int {
    // This method may be called by the parent constructor
    // before mHostView is initialized.
    return rootView?.childCount ?: 0
  }

  override fun getChildAt(index: Int): View {
    return rootView!!.getChildAt(index)
  }

  override fun removeView(child: View) {
    UiThreadUtil.assertOnUiThread()
    rootView!!.removeView(child)
  }

  override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
    rootView!!.removeView(child)
  }

  override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the mHostView which lives in the dialog
  }

  override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent): Boolean {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the mHostView which lives in the dialog
    return false
  }

  fun onDropInstance() {
    reactContext.removeLifecycleEventListener(this)
    dismiss()
  }

  protected fun setOnShowListener(listener: OnShowListener?) {
    onShowListener = listener
  }

  protected fun setOnDismissListener(listener: OnDismissListener?) {
    onDismissListener = listener
  }

  fun setEventDispatcher(eventDispatcher: EventDispatcher) {
    rootView!!.setEventDispatcher(eventDispatcher)
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

  fun dismiss() {
    UiThreadUtil.assertOnUiThread()

    if (sheetDialog != null && sheetDialog!!.isShowing) {
      sheetDialog!!.dismiss()
    }

    destroyDialog()
  }

  fun present() {
    UiThreadUtil.assertOnUiThread()
    if (sheetDialog == null) {

      /**
       * View that will be the root view of the dialog. We are wrapping this in a
       * FrameLayout because this is the system's way of notifying us that the dialog size has changed.
       * This has the pleasant side-effect of us not having to preface all Modals with "top:
       * statusBarHeight", since that margin will be included in the FrameLayout.
       */
      val frameLayout = FrameLayout(context)
      frameLayout.addView(rootView)
      frameLayout.fitsSystemWindows = true

      sheetDialog = BottomSheetDialog(context)

      sheetDialog!!
        .window
        ?.setFlags(
          WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
          WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        )

      sheetDialog!!.setContentView(frameLayout)
      sheetDialog!!.setOnShowListener(onShowListener)
      sheetDialog!!.setOnDismissListener(onDismissListener)

      sheetDialog!!.show()
      sheetDialog!!.window?.clearFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
    }
  }

  companion object {
    const val NAME = "TrueSheetView"
  }
}

