package com.lodev09.truesheet

import android.content.Context
import android.graphics.Color
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
  private val sheetRootView: TrueSheetRootViewGroup
  private var sheetDialog: BottomSheetDialog

  private var sheetBehavior: TrueSheetBottomSheetBehavior<ViewGroup>

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    reactContext.addLifecycleEventListener(this)
    sheetRootView = TrueSheetRootViewGroup(context)
    sheetDialog = BottomSheetDialog(context)
    sheetBehavior = TrueSheetBottomSheetBehavior()
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

    sheetRootView.addView(child, index)

    val layout = RelativeLayout(context)
    layout.addView(sheetRootView)
    layout.setBackgroundColor(Color.parseColor("red"))

    sheetDialog.setContentView(layout)

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
    }

    params.behavior = sheetBehavior
    // configureSheet()
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
    val maxHeight = TrueSheetHelper.getViewSize(context).y

    val height = when (size) {
      is Double -> PixelUtil.toPixelFromDIP(size).toInt()
      is Int -> PixelUtil.toPixelFromDIP(size.toDouble()).toInt()
      is String -> {
        return when (size) {
          "auto" -> contentHeight
          "large" -> maxHeight
          "medium" -> (maxHeight * 0.50).toInt()
          "small" -> (maxHeight * 0.25).toInt()
          else -> {
            if (size.endsWith('%')) {
              val percent = size.trim('%').toDoubleOrNull()
              return if (percent == null) 0
              else ((percent / 100) * maxHeight).toInt()
            } else {
              val fixedHeight = size.toDoubleOrNull()
              return if (fixedHeight == null) 0
              else PixelUtil.toPixelFromDIP(fixedHeight).toInt()
            }
          }
        }
      }
      else -> (maxHeight * 0.5).toInt()
    }

    return minOf(height, maxHeight)
  }

  private fun configureSheet() {
    sheetRootView.getChildAt(0)?.let {it ->
      sheetBehavior.apply {
        val contentHeight = it.height
        val maxViewHeight = TrueSheetHelper.getViewSize(context).y
        val sizeCount = sizes.size

        state = BottomSheetBehavior.STATE_COLLAPSED

        // Reset properties
//        isFitToContents = true
//        isHideable = true
//        peekHeight = 0
//        maxHeight = -1
//        halfExpandedRatio = 0.5f

        when (sizeCount) {
          1 -> {
            maxHeight = getSizeHeight(sizes[0], contentHeight)
          }
          2 -> {
            val height1 = getSizeHeight(sizes[0], contentHeight)
            val height2 = getSizeHeight(sizes[1], contentHeight)

            peekHeight = height1
            maxHeight = height2
          }
          3 -> {
            isFitToContents = false
            val height1 = getSizeHeight(sizes[0], contentHeight)
            val height2 = getSizeHeight(sizes[1], contentHeight)
            val height3 = getSizeHeight(sizes[2], contentHeight)

            peekHeight = minOf(height1, maxViewHeight)
            halfExpandedRatio = height2.toFloat() / height3.toFloat()
            maxHeight = height3
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
    // sheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
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

