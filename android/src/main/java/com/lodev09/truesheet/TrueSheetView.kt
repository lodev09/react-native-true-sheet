package com.lodev09.truesheet

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import android.widget.LinearLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.RootViewGroup
import com.lodev09.truesheet.core.ScrollableBehavior
import com.lodev09.truesheet.utils.maxSize

class TrueSheetView(context: Context) : ViewGroup(context), LifecycleEventListener {
  private var sizeIndex: Int = 0
  private var sizes: Array<Any> = arrayOf("medium", "large")

  private lateinit var presentCallback: () -> Unit
  private lateinit var dismissCallback: () -> Unit

  private val sheetDialog: BottomSheetDialog
  private val sheetLayout: LinearLayout
  private val sheetRootView: RootViewGroup

  // The first child of the container view
  private var contentView: ViewGroup? = null
  private var footerView: ViewGroup? = null

  private var sheetBehavior: ScrollableBehavior<ViewGroup>

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    reactContext.addLifecycleEventListener(this)

    sheetRootView = RootViewGroup(context)
    sheetDialog = BottomSheetDialog(context)

    // Configure Sheet events
    sheetBehavior = ScrollableBehavior<ViewGroup>().apply {
      addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(sheetView: View, slideOffset: Float) {
          footerView?.let {
            it.y = (sheetView.height - sheetView.top - it.height).toFloat()
          }
        }
        override fun onStateChanged(view: View, newState: Int) {
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
    sheetLayout = LinearLayout(context).apply {
      addView(sheetRootView)
      sheetDialog.setContentView(this)

      val layoutParent = parent as ViewGroup
      (layoutParent.layoutParams as CoordinatorLayout.LayoutParams).behavior = sheetBehavior
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

      // rootView's first child is the Container View
      sheetRootView.addView(it, index)
    }

    sheetDialog.setOnShowListener {
      UiThreadUtil.runOnUiThread {
        footerView?.let {
          val sheetView = sheetLayout.parent as ViewGroup
          it.y = (sheetView.height - sheetView.top - it.height).toFloat()
        }
      }

      presentCallback()
    }

    sheetDialog.setOnDismissListener {
      Log.d(TAG, "onDismiss")
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

  private fun getSizeHeight(size: Any, contentHeight: Int): Int {
    val maxViewHeight = maxSize(context).y

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
    val maxViewHeight = maxSize(context).y
    var contentHeight = contentView?.height ?: 0

    // Append footer view height
    footerView?.let {
      contentHeight += it.height
    }

    // Handle sheet content that might contain ScrollViews
    contentView?.let {
      sheetBehavior.contentView = it
    }

    // Configure sheet sizes
    sheetBehavior.apply {
      isFitToContents = true
      isHideable = true
      skipCollapsed = false

      when (sizes.size) {
        1 -> {
          maxHeight = getSizeHeight(sizes[0], contentHeight)
          skipCollapsed = true

          state = BottomSheetBehavior.STATE_EXPANDED
        }
        2 -> {
          peekHeight = getSizeHeight(sizes[0], contentHeight)
          maxHeight = getSizeHeight(sizes[1], contentHeight)

          when (sizeIndex) {
            0 -> state = BottomSheetBehavior.STATE_COLLAPSED
            1 -> state = BottomSheetBehavior.STATE_EXPANDED
          }
        }
        3 -> {
          // Enables half expanded
          isFitToContents = false

          peekHeight = getSizeHeight(sizes[0], contentHeight)
          halfExpandedRatio = getSizeHeight(sizes[1], contentHeight).toFloat() / maxViewHeight.toFloat()
          maxHeight = getSizeHeight(sizes[2], contentHeight)

          when (sizeIndex) {
            0 -> state = BottomSheetBehavior.STATE_COLLAPSED
            1 -> state = BottomSheetBehavior.STATE_HALF_EXPANDED
            2 -> state = BottomSheetBehavior.STATE_EXPANDED
          }
        }
      }
    }
  }

  fun setSizes(newSizes: Array<Any>) {
    sizes = newSizes
    configureSheet()
  }

  fun present(index: Int, closure: () -> Unit) {
    sizeIndex = index
    configureSheet()

    if (!sheetDialog.isShowing) {
      presentCallback = closure
      sheetDialog.show()
    }
  }

  fun dismiss(closure: () -> Unit) {
    dismissCallback = closure
    sheetDialog.dismiss()
  }

  fun setEventDispatcher(eventDispatcher: EventDispatcher) {
    sheetRootView.setEventDispatcher(eventDispatcher)
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}

