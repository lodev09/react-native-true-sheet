package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import android.widget.RelativeLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog

class TrueSheetView(context: Context) : ViewGroup(context), LifecycleEventListener {

  private var sizes: Array<Any> = arrayOf("medium", "large")

  private val sheetDialog: BottomSheetDialog
  private val sheetRootView: TrueSheetRootViewGroup

  // The first child of the container view
  private var contentView: ViewGroup? = null

  private var sheetBehavior: TrueSheetBottomSheetBehavior<ViewGroup>

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    reactContext.addLifecycleEventListener(this)
    sheetRootView = TrueSheetRootViewGroup(context)
    sheetDialog = BottomSheetDialog(context)
    sheetBehavior = TrueSheetBottomSheetBehavior()

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
    dismiss()
  }

  override fun addView(child: View, index: Int) {
    // Hide this host view
    visibility = GONE

    // rootView's first child is the Container View
    sheetRootView.addView(child, index)

    // Container View's first child is the Content View
    contentView = (child as ViewGroup).getChildAt(0) as ViewGroup

    val layout = RelativeLayout(context)
    layout.addView(sheetRootView)

    sheetDialog.setContentView(layout)

    val viewGroup = layout.parent as ViewGroup
    (viewGroup.layoutParams as CoordinatorLayout.LayoutParams).behavior = sheetBehavior
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
    dismiss()
  }

  private fun getSizeHeight(size: Any, contentHeight: Int): Int {
    val maxViewHeight = TrueSheetHelper.getViewSize(context).y

    val height = when (size) {
      is Double -> PixelUtil.toPixelFromDIP(size).toInt()
      is Int -> PixelUtil.toPixelFromDIP(size.toDouble()).toInt()
      is String -> {
        return when (size) {
          "auto" -> contentHeight
          "large" -> maxViewHeight
          "medium" -> (maxViewHeight * 0.50).toInt()
          "small" -> (maxViewHeight * 0.25).toInt()
          else -> {
            if (size.endsWith('%')) {
              val percent = size.trim('%').toDoubleOrNull()
              return if (percent == null) 0
              else ((percent / 100) * maxViewHeight).toInt()
            } else {
              val fixedHeight = size.toDoubleOrNull()
              return if (fixedHeight == null) 0
              else PixelUtil.toPixelFromDIP(fixedHeight).toInt()
            }
          }
        }
      }
      else -> (maxViewHeight * 0.5).toInt()
    }

    return minOf(height, maxViewHeight)
  }

  private fun configureSheet() {
    contentView?.let {
      // Handle sheet content that might contain ScrollViews
      sheetBehavior.contentView = it

      sheetBehavior.apply {
        val contentHeight = it.height
        val maxViewHeight = TrueSheetHelper.getViewSize(context).y
        val sizeCount = sizes.size

        // Reset properties
        isFitToContents = true
        isHideable = true
        skipCollapsed = false
        state = BottomSheetBehavior.STATE_COLLAPSED

        when (sizeCount) {
          1 -> {
            state = BottomSheetBehavior.STATE_EXPANDED
            maxHeight = getSizeHeight(sizes[0], contentHeight)
            skipCollapsed = true
          }
          2 -> {
            peekHeight = getSizeHeight(sizes[0], contentHeight)
            maxHeight = getSizeHeight(sizes[1], contentHeight)
          }
          3 -> {
            // Enables half expanded
            isFitToContents = false

            peekHeight = getSizeHeight(sizes[0], contentHeight)
            halfExpandedRatio = getSizeHeight(sizes[1], contentHeight).toFloat() / maxViewHeight.toFloat()
            maxHeight = getSizeHeight(sizes[2], contentHeight)
          }
        }
      }
    }
  }

  fun setSizes(newSizes: Array<Any>) {
    sizes = newSizes
    configureSheet()
  }

  fun present() {
    configureSheet()
    sheetDialog.show()
  }

  fun dismiss() {
    sheetDialog.dismiss()
  }

  fun setEventDispatcher(eventDispatcher: EventDispatcher) {
    sheetRootView.setEventDispatcher(eventDispatcher)
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}

